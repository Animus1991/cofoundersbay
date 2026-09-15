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
   * Unified search the `/search` page calls: people, jobs, events, groups,
   * opportunities — one payload with `href` on every hit so the client can
   * render ResultCards instead of dropping rows that look like profile hits.
   */
  async searchGlobal(params: {
    q: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const q = params.q.trim();
    const category = params.category ?? 'all';
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const empty = {
      results: [] as Array<Record<string, unknown>>,
      total: 0,
      categories: {
        people: 0,
        jobs: 0,
        events: 0,
        groups: 0,
        mentors: 0,
        opportunities: 0,
      },
    };
    if (q.length < 2) return empty;

    const contains = { contains: q, mode: 'insensitive' as const };
    const wantPeople = category === 'all' || category === 'people';
    const wantMentors = category === 'all' || category === 'mentors';
    const wantJobs = category === 'all' || category === 'jobs';
    const wantEvents = category === 'all' || category === 'events';
    const wantGroups = category === 'all' || category === 'groups';
    const wantOpps = category === 'all' || category === 'opportunities';

    const [people, mentors, jobs, events, groups, opportunities] = await Promise.all([
      wantPeople
        ? this.prisma.profile.findMany({
            where: {
              OR: [
                { displayName: contains },
                { headline: contains },
                { bio: contains },
                { location: contains },
              ],
            },
            include: { user: { select: { id: true, role: true } } },
            take: limit,
          })
        : Promise.resolve([]),
      wantMentors
        ? this.prisma.profile.findMany({
            where: {
              user: { role: 'mentor' },
              OR: [
                { displayName: contains },
                { headline: contains },
                { bio: contains },
                { location: contains },
              ],
            },
            include: { user: { select: { id: true, role: true } } },
            take: limit,
          })
        : Promise.resolve([]),
      wantJobs
        ? this.prisma.jobPosting.findMany({
            where: {
              isActive: true,
              OR: [{ title: contains }, { description: contains }, { location: contains }, { role: contains }],
            },
            take: limit,
          })
        : Promise.resolve([]),
      wantEvents
        ? this.prisma.event.findMany({
            where: {
              OR: [{ title: contains }, { description: contains }, { location: contains }],
            },
            take: limit,
            orderBy: { startAt: 'desc' },
          })
        : Promise.resolve([]),
      wantGroups
        ? this.prisma.group.findMany({
            where: {
              privacy: 'public',
              OR: [{ name: contains }, { description: contains }, { category: contains }],
            },
            take: limit,
          })
        : Promise.resolve([]),
      wantOpps
        ? this.prisma.opportunity.findMany({
            where: {
              isActive: true,
              OR: [{ title: contains }, { description: contains }, { company: contains }, { location: contains }],
            },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    const peopleHits = people.map((p) => ({
      id: p.userId,
      type: 'user' as const,
      title: p.displayName,
      subtitle: p.headline ?? undefined,
      description: p.bio ?? undefined,
      imageUrl: p.avatarUrl ?? undefined,
      href: `/profiles/${p.userId}`,
      meta: p.location ? { location: p.location } : undefined,
    }));
    const mentorHits = mentors.map((p) => ({
      id: p.userId,
      type: 'user' as const,
      title: p.displayName,
      subtitle: p.headline ?? undefined,
      description: p.bio ?? undefined,
      imageUrl: p.avatarUrl ?? undefined,
      href: `/profiles/${p.userId}`,
      meta: p.location ? { location: p.location } : undefined,
    }));
    const jobHits = jobs.map((j) => ({
      id: j.id,
      type: 'job' as const,
      title: j.title,
      subtitle: j.role ?? undefined,
      description: j.description ?? undefined,
      href: `/jobs`,
      meta: {
        ...(j.location ? { location: j.location } : {}),
      },
    }));
    const eventHits = events.map((e) => ({
      id: e.id,
      type: 'event' as const,
      title: e.title,
      subtitle: e.location ?? undefined,
      description: e.description ?? undefined,
      imageUrl: e.coverImageUrl ?? undefined,
      href: `/events/${e.id}`,
      meta: {
        ...(e.location ? { location: e.location } : {}),
        date: e.startAt.toISOString(),
      },
    }));
    const groupHits = groups.map((g) => ({
      id: g.id,
      type: 'group' as const,
      title: g.name,
      subtitle: g.category ?? undefined,
      description: g.description ?? undefined,
      imageUrl: g.avatarUrl ?? undefined,
      href: `/groups/${g.id}`,
    }));
    const oppHits = opportunities.map((o) => ({
      id: o.id,
      type: 'opportunity' as const,
      title: o.title,
      subtitle: o.company ?? undefined,
      description: o.description ?? undefined,
      href: `/opportunities`,
      meta: o.location ? { location: o.location } : undefined,
    }));

    const byCategory = {
      people: peopleHits,
      mentors: mentorHits,
      jobs: jobHits,
      events: eventHits,
      groups: groupHits,
      opportunities: oppHits,
    };

    const results =
      category === 'all'
        ? [...peopleHits, ...jobHits, ...eventHits, ...groupHits, ...oppHits]
        : byCategory[category as keyof typeof byCategory] ?? [];

    return {
      results: results.slice(0, limit),
      total: results.length,
      categories: {
        people: peopleHits.length,
        jobs: jobHits.length,
        events: eventHits.length,
        groups: groupHits.length,
        mentors: mentorHits.length,
        opportunities: oppHits.length,
      },
    };
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
