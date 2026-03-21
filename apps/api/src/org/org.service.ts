import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrgProfile(slug: string) {
    // Use findFirst so we can filter by both slug and role
    const org = await this.prisma.user.findFirst({
      where: { slug, role: 'org' },
      include: {
        profile: true,
        _count: {
          select: {
            opportunities: true,
            cohortsOrganized: true,
            eventsCreated: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const totalMembers = await this.prisma.cohortMember.count({
      where: { cohort: { organizerId: org.id } },
    });

    return {
      org: {
        id: org.id,
        name: org.profile?.displayName ?? org.email,
        slug: org.slug,
        tagline: org.profile?.headline ?? null,
        description: org.profile?.bio ?? null,
        mission: (org.profile as any)?.mission ?? null,
        avatarUrl: org.profile?.avatarUrl ?? null,
        website: (org.profile as any)?.website ?? null,
        email: org.email,
        location: org.profile?.location ?? null,
        industry: (org.profile as any)?.industry ?? null,
        focus: (org.profile as any)?.focus ?? null,
        size: (org.profile as any)?.size ?? null,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        _count: {
          opportunities: org._count.opportunities,
          cohorts: org._count.cohortsOrganized,
          members: totalMembers,
          events: org._count.eventsCreated,
        },
      },
    };
  }

  async getOrgOpportunities(slug: string, params?: { limit?: number; offset?: number }) {
    const org = await this.prisma.user.findFirst({
      where: { slug, role: 'org' },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const [opportunities, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where: { createdById: org.id },
        include: {
          createdBy: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: params?.limit ?? 20,
        skip: params?.offset ?? 0,
      }),
      this.prisma.opportunity.count({ where: { createdById: org.id } }),
    ]);

    return {
      opportunities: opportunities.map((opp) => ({
        id: opp.id,
        title: opp.title,
        description: opp.description,
        type: opp.type,
        company: opp.company,
        location: opp.location,
        isRemote: opp.isRemote,
        url: opp.url,
        tags: opp.tags,
        deadline: opp.deadline,
        isActive: opp.isActive,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        createdById: opp.createdById,
        createdBy: {
          id: opp.createdBy.id,
          name: opp.createdBy.profile?.displayName ?? null,
          avatarUrl: opp.createdBy.profile?.avatarUrl ?? null,
        },
      })),
      total,
    };
  }

  async getOrgCohorts(slug: string, params?: { limit?: number; offset?: number }) {
    const org = await this.prisma.user.findFirst({
      where: { slug, role: 'org' },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const [cohorts, total] = await Promise.all([
      this.prisma.cohort.findMany({
        where: { organizerId: org.id },
        include: {
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params?.limit ?? 20,
        skip: params?.offset ?? 0,
      }),
      this.prisma.cohort.count({ where: { organizerId: org.id } }),
    ]);

    return { cohorts, total };
  }

  async getOrgMembers(slug: string, params?: { limit?: number; offset?: number }) {
    const org = await this.prisma.user.findFirst({
      where: { slug, role: 'org' },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Get members from all cohorts organized by this org
    const [members, total] = await Promise.all([
      this.prisma.cohortMember.findMany({
        where: { cohort: { organizerId: org.id } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  headline: true,
                  location: true,
                },
              },
            },
          },
          cohort: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: params?.limit ?? 50,
        skip: params?.offset ?? 0,
      }),
      this.prisma.cohortMember.count({
        where: { cohort: { organizerId: org.id } },
      }),
    ]);

    // Deduplicate members (a user might be in multiple cohorts)
    const uniqueMembers = new Map<string, typeof members[0]>();
    for (const member of members) {
      if (!uniqueMembers.has(member.userId)) {
        uniqueMembers.set(member.userId, member);
      }
    }

    return {
      members: Array.from(uniqueMembers.values()).map((m) => ({
        id: m.user.id,
        displayName: m.user.profile?.displayName ?? m.user.email,
        avatarUrl: m.user.profile?.avatarUrl ?? null,
        headline: m.user.profile?.headline ?? null,
        location: m.user.profile?.location ?? null,
        role: m.user.role,
        cohortName: m.cohort.name,
        joinedAt: m.joinedAt,
      })),
      total,
    };
  }
}
