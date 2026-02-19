import { Injectable } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchService } from './meilisearch.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeilisearchService,
  ) {}

  async searchProfiles(params: {
    q?: string;
    roles?: string[];
    location?: string;
    skills?: string[];
    industries?: string[];
    stage?: string[];
    languages?: string[];
    commitment?: string[];
    investmentStages?: string[];
    sortBy?: 'relevance' | 'recent' | 'active';
    limit?: number;
    offset?: number;
  }) {
    if (this.meili.isEnabled()) {
      return this.meili.searchProfiles(params);
    }
    return this.searchProfilesFallback(params);
  }

  private async searchProfilesFallback(params: {
    q?: string;
    roles?: string[];
    location?: string;
    skills?: string[];
    industries?: string[];
    stage?: string[];
    languages?: string[];
    commitment?: string[];
    investmentStages?: string[];
    sortBy?: 'relevance' | 'recent' | 'active';
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(params.limit ?? 20, 50);
    const offset = params.offset ?? 0;
    const where: Prisma.ProfileWhereInput = {};
    if (params.roles?.length) {
      where.user = { role: { in: params.roles as Role[] } };
    }
    if (params.location) {
      where.location = { contains: params.location, mode: 'insensitive' };
    }
    if (params.q) {
      const q = params.q.trim();
      if (q) {
        where.OR = [
          { displayName: { contains: q, mode: 'insensitive' } },
          { headline: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { skills: { some: { skill: { name: { contains: q, mode: 'insensitive' } } } } },
        ];
      }
    }
    if (params.skills?.length) {
      where.skills = {
        some: {
          skill: { name: { in: params.skills } },
        },
      };
    }

    const and: Prisma.ProfileWhereInput[] = [];

    if (params.languages?.length) {
      and.push({
        OR: params.languages.map((lang) => ({
          languages: { array_contains: [lang] } as any,
        })),
      });
    }
    if (params.industries?.length) {
      and.push({
        OR: params.industries.map((ind) => ({
          rolePayload: { path: ['industry'], equals: ind } as any,
        })),
      });
    }
    if (params.stage?.length) {
      and.push({
        OR: params.stage.map((st) => ({
          rolePayload: { path: ['stage'], equals: st } as any,
        })),
      });
    }
    if (params.commitment?.length) {
      and.push({
        OR: params.commitment.map((c) => ({
          rolePayload: { path: ['commitment'], equals: c } as any,
        })),
      });
    }
    if (params.investmentStages?.length) {
      and.push({
        OR: params.investmentStages.map((st) => ({
          rolePayload: { path: ['stages'], array_contains: [st] } as any,
        })),
      });
    }

    if (and.length) where.AND = and;

    const orderBy =
      params.sortBy === 'recent'
        ? ({ createdAt: 'desc' } as const)
        : params.sortBy === 'active'
          ? ({ updatedAt: 'desc' } as const)
          : ({ updatedAt: 'desc' } as const);

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          user: { select: { id: true, role: true } },
          skills: { include: { skill: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.profile.count({ where }),
    ]);

    const hits = profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      headline: p.headline,
      bio: p.bio,
      avatarUrl: p.avatarUrl ?? null,
      location: p.location,
      timezone: p.timezone,
      languages: (p.languages as string[] | null) ?? [],
      role: p.user.role,
      skillNames: p.skills.map((s: { skill: { name: string } }) => s.skill.name),
      skillSlugs: p.skills.map((s: { skill: { slug: string } }) => s.skill.slug),
      createdAt: Math.floor(p.createdAt.getTime() / 1000),
      updatedAt: Math.floor(p.updatedAt.getTime() / 1000),
    }));

    return { hits, total };
  }

  /** Rules-based: suggest co-founders (founders), mentors, or investors for the current user. */
  async getRecommendations(userId: string, options?: { role?: string; limit?: number }) {
    const limit = Math.min(options?.limit ?? 10, 20);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return { suggestions: [] };

    const targetRole = (options?.role ?? this.suggestTargetRole(user.role)) as Role;
    const excludeIds = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    }).then((p) => (p ? [p.id] : []));

    const profiles = await this.prisma.profile.findMany({
      where: {
        user: { role: targetRole },
        id: excludeIds.length ? { notIn: excludeIds } : undefined,
      },
      include: {
        user: { select: { id: true, role: true } },
        skills: { include: { skill: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return {
      suggestions: profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        headline: p.headline,
        location: p.location,
        role: p.user.role,
        skillNames: p.skills.map((s: { skill: { name: string } }) => s.skill.name),
      })),
    };
  }

  private suggestTargetRole(userRole: string): string {
    switch (userRole) {
      case 'founder':
        return 'mentor'; // suggest mentors first; can add "co-founders" as second type later
      case 'mentor':
        return 'founder';
      case 'investor':
        return 'founder';
      case 'org':
        return 'founder';
      default:
        return 'founder';
    }
  }
}
