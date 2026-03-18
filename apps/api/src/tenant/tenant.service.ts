import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async list(params?: { status?: string; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    return this.prisma.tenant.findMany({
      where,
      include: { branding: true },
      take: params?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    slug: string;
    name: string;
    displayName?: string;
    description?: string;
    website?: string;
    logoUrl?: string;
  }) {
    return this.prisma.tenant.create({
      data: { ...data, status: 'draft' },
      include: { branding: true },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    displayName: string;
    description: string;
    website: string;
    logoUrl: string;
    faviconUrl: string;
    status: 'draft' | 'active' | 'suspended';
  }>) {
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: { branding: true },
    });
  }

  async upsertBranding(tenantId: string, data: Partial<{
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaLabel: string;
    onboardingIntroText: string;
    dashboardWelcomeText: string;
    supportEmail: string;
    privacyPolicyUrl: string;
    termsUrl: string;
    linkedinUrl: string;
    twitterUrl: string;
    emailSignature: string;
    emailLogoUrl: string;
    isBrandingActive: boolean;
  }>) {
    // Ensure tenant exists
    await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

    const existing = await this.prisma.tenantBranding.findUnique({ where: { tenantId } });
    if (existing) {
      return this.prisma.tenantBranding.update({
        where: { tenantId },
        data: {
          ...data,
          ...(data.isBrandingActive ? { publishedAt: new Date() } : {}),
        },
      });
    }
    return this.prisma.tenantBranding.create({
      data: {
        tenantId,
        ...data,
        ...(data.isBrandingActive ? { publishedAt: new Date() } : {}),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }
}
