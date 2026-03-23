import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: {
    type: string;
    name: string;
    slug: string;
    displayName?: string;
    description?: string;
    tagline?: string;
    website?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    primaryColor?: string;
    country?: string;
    city?: string;
    address?: string;
    timezone?: string;
    industries?: string[];
    stages?: string[];
    focusAreas?: string[];
    tenantId?: string;
  }) {
    // Check slug uniqueness
    const existing = await this.prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Organization slug already exists');
    }

    const organization = await this.prisma.organization.create({
      data: {
        createdById: userId,
        type: data.type as any,
        name: data.name,
        slug: data.slug,
        displayName: data.displayName,
        description: data.description,
        tagline: data.tagline,
        website: data.website,
        email: data.email,
        phone: data.phone,
        logoUrl: data.logoUrl,
        coverImageUrl: data.coverImageUrl,
        primaryColor: data.primaryColor,
        country: data.country,
        city: data.city,
        address: data.address,
        timezone: data.timezone,
        industries: data.industries || [],
        stages: data.stages || [],
        focusAreas: data.focusAreas || [],
        tenantId: data.tenantId,
      },
    });

    // Add creator as owner
    await this.prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        userId,
        role: 'owner',
      },
    });

    return organization;
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { user: { select: { id: true, email: true, profile: true } } },
        },
        programs: true,
        _count: { select: { memberships: true, programs: true } },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        programs: { where: { isPublic: true, status: 'active' } },
        _count: { select: { memberships: true, programs: true } },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async findAll(filters: {
    type?: string;
    isVerified?: boolean;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, isVerified, isFeatured, search, page = 1, limit = 20 } = filters;

    const where: Prisma.OrganizationWhereInput = {
      isActive: true,
      ...(type && { type: type as any }),
      ...(isVerified !== undefined && { isVerified }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        include: {
          _count: { select: { memberships: true, programs: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    displayName: string;
    description: string;
    tagline: string;
    website: string;
    email: string;
    phone: string;
    logoUrl: string;
    coverImageUrl: string;
    primaryColor: string;
    country: string;
    city: string;
    address: string;
    timezone: string;
    industries: string[];
    stages: string[];
    focusAreas: string[];
    settings: Record<string, unknown>;
  }>) {
    await this.checkAdminAccess(id, userId);

    return this.prisma.organization.update({
      where: { id },
      data: data as Prisma.OrganizationUpdateInput,
    });
  }

  async delete(id: string, userId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { organizationId: id, userId, role: 'owner' },
    });

    if (!membership) {
      throw new ForbiddenException('Only owners can delete organizations');
    }

    await this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  // Membership management
  async addMember(orgId: string, adminUserId: string, data: {
    userId: string;
    role: string;
    title?: string;
    department?: string;
  }) {
    await this.checkAdminAccess(orgId, adminUserId);

    const existing = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: data.userId } },
    });

    if (existing) {
      throw new BadRequestException('User is already a member');
    }

    return this.prisma.organizationMembership.create({
      data: {
        organizationId: orgId,
        userId: data.userId,
        role: data.role as any,
        title: data.title,
        department: data.department,
        invitedBy: adminUserId,
      },
    });
  }

  async updateMember(orgId: string, adminUserId: string, memberId: string, data: {
    role?: string;
    title?: string;
    department?: string;
    isActive?: boolean;
  }) {
    await this.checkAdminAccess(orgId, adminUserId);

    return this.prisma.organizationMembership.update({
      where: { id: memberId },
      data: data as Prisma.OrganizationMembershipUpdateInput,
    });
  }

  async removeMember(orgId: string, adminUserId: string, memberId: string) {
    await this.checkAdminAccess(orgId, adminUserId);

    const membership = await this.prisma.organizationMembership.findUnique({
      where: { id: memberId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === 'owner') {
      const ownerCount = await this.prisma.organizationMembership.count({
        where: { organizationId: orgId, role: 'owner', isActive: true },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    await this.prisma.organizationMembership.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    return { success: true };
  }

  async getMembers(orgId: string, filters?: { role?: string; isActive?: boolean }) {
    return this.prisma.organizationMembership.findMany({
      where: {
        organizationId: orgId,
        ...(filters?.role && { role: filters.role as any }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        user: { select: { id: true, email: true, profile: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId, isActive: true },
      include: {
        organization: {
          include: { _count: { select: { memberships: true, programs: true } } },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      memberRole: m.role,
      memberTitle: m.title,
    }));
  }

  // Mentor pool management
  async addMentorToPool(orgId: string, adminUserId: string, data: {
    userId: string;
    expertiseAreas?: string[];
    maxMentees?: number;
  }) {
    await this.checkAdminAccess(orgId, adminUserId);

    return this.prisma.organizationMentor.create({
      data: {
        organizationId: orgId,
        userId: data.userId,
        expertiseAreas: data.expertiseAreas || [],
        maxMentees: data.maxMentees,
        assignedBy: adminUserId,
      },
    });
  }

  async getMentorPool(orgId: string) {
    return this.prisma.organizationMentor.findMany({
      where: { organizationId: orgId, isActive: true },
    });
  }

  // Helper methods
  private async checkAdminAccess(orgId: string, userId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId: orgId,
        userId,
        isActive: true,
        role: { in: ['owner', 'admin', 'program_manager'] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Admin access required');
    }

    return membership;
  }

  async checkMemberAccess(orgId: string, userId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { organizationId: orgId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('Membership required');
    }

    return membership;
  }
}
