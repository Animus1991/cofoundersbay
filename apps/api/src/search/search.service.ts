import { Injectable } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { computeMatchScore, type ProfileSnapshot } from '@cofounderbay/shared';
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
      try {
        return await this.meili.searchProfiles(params);
      } catch {
        // Meilisearch unreachable — fall through to Prisma
      }
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

  /**
   * Rules-based recommendations with score 0-100 per candidate.
   * Excludes users that already have a pending or accepted connection with the viewer.
   * Uses shared computeMatchScore for consistent scoring (role, skills, stage, commitment, location, recency).
   */
  async getRecommendations(userId: string, options?: { role?: string; limit?: number }) {
    const fetchLimit = 50;
    const returnLimit = Math.min(options?.limit ?? 10, 20);

    const viewer = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: { select: { role: true } },
        skills: { include: { skill: true } },
      },
    });
    if (!viewer) return { suggestions: [] };

    const excludedUserIds = await this.getConnectedOrPendingUserIds(userId);

    const targetRoles = options?.role
      ? [options.role as Role]
      : this.complementaryRoles(viewer.user.role as string);

    const candidates = await this.prisma.profile.findMany({
      where: {
        userId: { not: userId, notIn: excludedUserIds },
        user: { role: { in: targetRoles } },
      },
      include: {
        user: { select: { id: true, role: true } },
        skills: { include: { skill: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: fetchLimit,
    });

    const viewerSnapshot = this.toProfileSnapshot(viewer);
    const scored = candidates.map((p) => {
      const candidateSnapshot = this.toProfileSnapshot(p);
      const { score, breakdown } = computeMatchScore(viewerSnapshot, candidateSnapshot);
      const rp = p.rolePayload as Record<string, unknown> | null;
      return {
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        headline: p.headline,
        bio: p.bio,
        avatarUrl: p.avatarUrl ?? null,
        location: p.location,
        role: p.user.role,
        skillNames: p.skills.map((s: { skill: { name: string } }) => s.skill.name),
        matchScore: score,
        matchReasons: breakdown.reasons,
        lookingFor: (rp?.lookingFor as string | undefined) ?? null,
        availability: (rp?.availability as string | undefined) ?? (rp?.commitment as string | undefined) ?? null,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return { suggestions: scored.slice(0, returnLimit) };
  }

  /** User IDs that have pending or accepted connection with the given user (either direction). */
  private async getConnectedOrPendingUserIds(userId: string): Promise<string[]> {
    const requests = await this.prisma.connectionRequest.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: { in: ['pending', 'accepted'] },
      },
      select: { requesterId: true, receiverId: true },
    });
    const ids = new Set<string>();
    for (const r of requests) {
      if (r.requesterId !== userId) ids.add(r.requesterId);
      if (r.receiverId !== userId) ids.add(r.receiverId);
    }
    return Array.from(ids);
  }

  private toProfileSnapshot(p: {
    id: string;
    userId: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    timezone: string | null;
    rolePayload: unknown;
    updatedAt: Date;
    user: { role: string };
    skills: { skill: { name: string } }[];
  }): ProfileSnapshot {
    return {
      profileId: p.id,
      userId: p.userId,
      role: p.user.role as ProfileSnapshot['role'],
      displayName: p.displayName,
      headline: p.headline,
      bio: p.bio,
      location: p.location,
      timezone: p.timezone,
      skillNames: p.skills.map((s) => s.skill.name),
      rolePayload: (p.rolePayload as Record<string, unknown>) ?? null,
      updatedAtMs: p.updatedAt.getTime(),
    };
  }

  /** Returns complementary roles for a given viewer role (includes cofounder match for founders). */
  private complementaryRoles(viewerRole: string): Role[] {
    switch (viewerRole) {
      case 'founder':
        return ['mentor', 'investor', 'founder'] as Role[];
      case 'mentor':
        return ['founder'] as Role[];
      case 'investor':
        return ['founder'] as Role[];
      case 'org':
        return ['founder', 'mentor'] as Role[];
      default:
        return ['founder', 'mentor', 'investor'] as Role[];
    }
  }
}
