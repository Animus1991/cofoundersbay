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

  /**
   * Rules-based recommendations with score 0-100 per candidate.
   *
   * Scoring breakdown (max 100):
   *   30 pts — role complementarity (e.g. founder ↔ mentor/investor)
   *   30 pts — skills overlap with what the viewer seeks
   *   20 pts — stage alignment (rolePayload.stage match)
   *   10 pts — location / timezone proximity
   *   10 pts — recency (profile updated in last 30 days)
   */
  async getRecommendations(userId: string, options?: { role?: string; limit?: number }) {
    const fetchLimit = 50; // fetch more than needed so scoring can reorder
    const returnLimit = Math.min(options?.limit ?? 10, 20);

    const viewer = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: { select: { role: true } },
        skills: { include: { skill: true } },
      },
    });
    if (!viewer) return { suggestions: [] };

    const viewerRole = viewer.user.role as string;
    const viewerSkillNames = new Set(
      viewer.skills.map((s: { skill: { name: string } }) => s.skill.name.toLowerCase()),
    );
    const viewerStage = (viewer.rolePayload as Record<string, unknown> | null)?.stage as string | undefined;
    const viewerLocation = viewer.location?.toLowerCase();

    // Determine which roles to target
    const targetRoles = options?.role
      ? [options.role as Role]
      : this.complementaryRoles(viewerRole);

    const candidates = await this.prisma.profile.findMany({
      where: {
        userId: { not: userId },
        user: { role: { in: targetRoles } },
      },
      include: {
        user: { select: { id: true, role: true } },
        skills: { include: { skill: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: fetchLimit,
    });

    const now = Date.now();
    const scored = candidates.map((p) => {
      let score = 0;

      // 1. Role complementarity (30 pts)
      score += 30;

      // 2. Skills overlap (30 pts)
      const candidateSkills = new Set(
        p.skills.map((s: { skill: { name: string } }) => s.skill.name.toLowerCase()),
      );
      const overlap = [...viewerSkillNames].filter((s) => candidateSkills.has(s)).length;
      const union = new Set([...viewerSkillNames, ...candidateSkills]).size;
      const jaccard = union > 0 ? overlap / union : 0;
      score += Math.round(jaccard * 30);

      // 3. Stage alignment (20 pts)
      const candidateStage = (p.rolePayload as Record<string, unknown> | null)?.stage as string | undefined;
      if (viewerStage && candidateStage && viewerStage === candidateStage) {
        score += 20;
      } else if (viewerStage && candidateStage) {
        // Partial credit for adjacent stages
        score += 5;
      }

      // 4. Location proximity (10 pts)
      if (viewerLocation && p.location?.toLowerCase().includes(viewerLocation)) {
        score += 10;
      } else if (viewerLocation && viewerLocation.includes(p.location?.toLowerCase() ?? '')) {
        score += 5;
      }

      // 5. Recency bonus (10 pts — updated within 30 days)
      const daysSinceUpdate = (now - p.updatedAt.getTime()) / 86400000;
      if (daysSinceUpdate <= 7) score += 10;
      else if (daysSinceUpdate <= 30) score += 5;

      // Clamp to 100
      score = Math.min(score, 100);

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
        lookingFor: (rp?.lookingFor as string | undefined) ?? null,
        availability: (rp?.availability as string | undefined) ?? (rp?.commitment as string | undefined) ?? null,
      };
    });

    // Sort by score desc, return top N
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return { suggestions: scored.slice(0, returnLimit) };
  }

  /** Returns complementary roles for a given viewer role. */
  private complementaryRoles(viewerRole: string): Role[] {
    switch (viewerRole) {
      case 'founder':
        return ['mentor', 'investor'] as Role[];
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
