import { describe, expect, it } from 'vitest';
import { resolvePreviewApi } from './preview-api';

/**
 * /events, /jobs, /groups and /opportunities used to fall through to the
 * generic fallback: the pages rendered empty and their stat tiles showed
 * invented copy ("40+", "5+"). These assert the four areas answer with their
 * real shape AND that the controls on those pages actually narrow the list —
 * a filter that returns the same rows every time reads as broken.
 */

type Events = { events: Array<{ id: string; mode: string; startAt: string; viewerRsvp: string | null }> };
type Groups = { groups: Array<{ id: string; category: string | null; memberCount: number; isMember: boolean }>; total: number; hasMore: boolean };
type Opps = { opportunities: Array<{ id: string; type: string; isRemote: boolean }>; total: number };

const NOW = '2026-09-04T10:00:00.000Z';

describe('preview showcase areas', () => {
  it('serves upcoming events, and past ones only under the past scope', () => {
    const upcoming = resolvePreviewApi('/api/events?scope=upcoming&limit=48') as Events;
    expect(upcoming.events.length).toBeGreaterThan(0);
    expect(upcoming.events.every((e) => e.startAt >= NOW)).toBe(true);
    // Upcoming reads forwards, so the soonest event is first.
    expect(upcoming.events[0]!.startAt).toBe(
      [...upcoming.events].sort((a, b) => a.startAt.localeCompare(b.startAt))[0]!.startAt,
    );

    const past = resolvePreviewApi('/api/events?scope=past') as Events;
    expect(past.events.length).toBeGreaterThan(0);
    expect(past.events.every((e) => e.startAt < NOW)).toBe(true);
  });

  it('narrows events by mode and by search text', () => {
    const online = resolvePreviewApi('/api/events?scope=upcoming&mode=online') as Events;
    expect(online.events.length).toBeGreaterThan(0);
    expect(online.events.every((e) => e.mode === 'online')).toBe(true);

    const all = resolvePreviewApi('/api/events?scope=upcoming') as Events;
    expect(online.events.length).toBeLessThan(all.events.length);

    const searched = resolvePreviewApi('/api/events?scope=upcoming&q=demo') as Events;
    expect(searched.events.length).toBeGreaterThan(0);
    expect(searched.events.length).toBeLessThan(all.events.length);
  });

  it('scopes "my events" to the ones the viewer answered', () => {
    const mine = resolvePreviewApi('/api/events?scope=mine') as Events;
    expect(mine.events.length).toBeGreaterThan(0);
    expect(mine.events.every((e) => e.viewerRsvp != null)).toBe(true);
  });

  it('serves jobs and honours the limit', () => {
    const jobs = resolvePreviewApi('/api/jobs?limit=50') as { jobs: unknown[] };
    expect(jobs.jobs.length).toBeGreaterThan(0);
    const capped = resolvePreviewApi('/api/jobs?limit=2') as { jobs: unknown[] };
    expect(capped.jobs).toHaveLength(2);
  });

  it('serves groups with a real total, and filters by category and search', () => {
    const all = resolvePreviewApi('/api/groups?limit=30&sort=popular') as Groups;
    expect(all.groups.length).toBeGreaterThan(0);
    expect(all.total).toBe(all.groups.length);
    expect(all.hasMore).toBe(false);
    // popular = most members first
    expect(all.groups[0]!.memberCount).toBe(Math.max(...all.groups.map((g) => g.memberCount)));

    const local = resolvePreviewApi('/api/groups?category=Local') as Groups;
    expect(local.groups.length).toBeGreaterThan(0);
    expect(local.groups.every((g) => g.category === 'Local')).toBe(true);
    expect(local.groups.length).toBeLessThan(all.groups.length);

    const searched = resolvePreviewApi('/api/groups?search=metrics') as Groups;
    expect(searched.groups.length).toBeGreaterThan(0);
    expect(searched.groups.length).toBeLessThan(all.groups.length);
  });

  it('returns only joined groups from /api/groups/my', () => {
    const mine = resolvePreviewApi('/api/groups/my') as { groups: Array<{ isMember: boolean; memberRole: string; joinedAt: string }> };
    expect(mine.groups.length).toBeGreaterThan(0);
    expect(mine.groups.every((g) => g.isMember)).toBe(true);
    expect(mine.groups.every((g) => typeof g.memberRole === 'string' && typeof g.joinedAt === 'string')).toBe(true);
  });

  it('serves opportunities and filters by type and remote', () => {
    const all = resolvePreviewApi('/api/opportunities?limit=20') as Opps;
    expect(all.opportunities.length).toBeGreaterThan(0);
    expect(all.total).toBe(all.opportunities.length);

    const cofounder = resolvePreviewApi('/api/opportunities?type=cofounder') as Opps;
    expect(cofounder.opportunities.length).toBeGreaterThan(0);
    expect(cofounder.opportunities.every((o) => o.type === 'cofounder')).toBe(true);

    const remote = resolvePreviewApi('/api/opportunities?isRemote=true') as Opps;
    expect(remote.opportunities.length).toBeGreaterThan(0);
    expect(remote.opportunities.every((o) => o.isRemote)).toBe(true);
    expect(remote.opportunities.length).toBeLessThan(all.opportunities.length);
  });

  it('says the demo founder belongs to no organisation, rather than inventing one', () => {
    const res = resolvePreviewApi('/api/sso/memberships') as { memberships: unknown[] };
    expect(Array.isArray(res.memberships)).toBe(true);
    expect(res.memberships).toEqual([]);
  });
});
