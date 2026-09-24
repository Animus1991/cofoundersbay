import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantMemberRole, Prisma } from '@prisma/client';

export type TenantCreateInput = {
  slug: string;
  name: string;
  displayName?: string;
  shortDescription?: string;
  description?: string;
  aboutText?: string;
  website?: string;
  logoUrl?: string;
  faviconUrl?: string;
};

export type TenantUpdateInput = Partial<TenantCreateInput & {
  status: 'draft' | 'active' | 'suspended';
}>;

export type TenantBrandingInput = Partial<{
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundStyle: string;
  // Typography
  headingFont: string;
  bodyFont: string;
  // Media
  heroImageUrl: string;
  websiteUrl: string;
  // Content
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  ctaLabel: string;
  ctaUrl: string;
  onboardingIntroText: string;
  dashboardWelcomeText: string;
  // Custom labels
  communityNaming: string;
  roleLabels: Record<string, string>;
  // Contact & legal
  supportEmail: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  cookiePolicyUrl: string;
  // Social
  linkedinUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  websiteFooterUrl: string;
  // Email
  emailSignature: string;
  emailLogoUrl: string;
  emailFooterText: string;
  emailFromName: string;
  // Status
  isBrandingActive: boolean;
}>;

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { branding: true },
    });
    if (!tenant) throw new NotFoundException(`Tenant "${slug}" not found`);
    return tenant;
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { branding: true, ssoConfig: { include: { identityProvider: true } } },
    });
    if (!tenant) throw new NotFoundException(`Tenant "${id}" not found`);
    return tenant;
  }

  async list(params?: { status?: string; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where['status'] = params.status;
    return this.prisma.tenant.findMany({
      where,
      include: { branding: true },
      take: params?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: TenantCreateInput) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException(`Slug "${data.slug}" is already taken`);
    return this.prisma.tenant.create({
      data: { ...data, status: 'draft' },
      include: { branding: true },
    });
  }

  /**
   * `settings` is a free-form preferences object the settings screen owns:
   * timezone, language, currency and the membership and notification toggles.
   * Typed as Prisma's own JSON input so it reaches the column without a cast
   * at the call site.
   */
  async update(
    id: string,
    data: TenantUpdateInput & { settings?: Prisma.InputJsonValue },
  ) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id } });
    if (data.slug) {
      const existing = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${data.slug}" is already taken`);
      }
    }
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: { branding: true },
    });
  }

  async upsertBranding(tenantId: string, data: TenantBrandingInput) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

    const { roleLabels, isBrandingActive, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (roleLabels !== undefined) payload['roleLabels'] = roleLabels;
    if (isBrandingActive !== undefined) {
      payload['isBrandingActive'] = isBrandingActive;
      if (isBrandingActive) payload['publishedAt'] = new Date();
    }

    const existing = await this.prisma.tenantBranding.findUnique({ where: { tenantId } });
    if (existing) {
      return this.prisma.tenantBranding.update({ where: { tenantId }, data: payload });
    }
    return this.prisma.tenantBranding.create({ data: { tenantId, ...payload } });
  }

  async getBranding(tenantId: string) {
    return this.prisma.tenantBranding.findUnique({ where: { tenantId } });
  }

  async publishBranding(tenantId: string) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return this.prisma.tenantBranding.update({
      where: { tenantId },
      data: { isBrandingActive: true, publishedAt: new Date() },
    });
  }

  async unpublishBranding(tenantId: string) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return this.prisma.tenantBranding.update({
      where: { tenantId },
      data: { isBrandingActive: false },
    });
  }

  // ── Member management ──────────────────────────────────────────────────────

  async getMembers(tenantId: string, params?: { limit?: number; offset?: number }) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { displayName: true, avatarUrl: true, headline: true } },
          },
        },
      },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
      orderBy: { joinedAt: 'desc' },
    });
  }

  async addMember(tenantId: string, userId: string, role: TenantMemberRole = TenantMemberRole.member, invitedBy?: string) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const existing = await this.prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (existing) {
      if (!existing.isActive) {
        return this.prisma.tenantMembership.update({
          where: { id: existing.id },
          data: { isActive: true, role },
        });
      }
      throw new ConflictException('User is already a member of this tenant');
    }

    return this.prisma.tenantMembership.create({
      data: { tenantId, userId, role, invitedBy },
    });
  }

  async updateMember(tenantId: string, userId: string, data: { role?: TenantMemberRole; isActive?: boolean }) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return this.prisma.tenantMembership.update({
      where: { id: membership.id },
      data,
    });
  }

  async removeMember(tenantId: string, userId: string) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return this.prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }

  async delete(id: string) {
    await this.prisma.tenant.findUniqueOrThrow({ where: { id } });
    return this.prisma.tenant.delete({ where: { id } });
  }
}
