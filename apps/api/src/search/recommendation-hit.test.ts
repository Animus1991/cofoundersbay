import { describe, expect, it } from 'vitest';
import { computeMatchScore, type ProfileSnapshot } from '@cofounderbay/shared';
import { recommendationHit } from './search.service';

const UPDATED = new Date('2026-10-20T08:00:00.000Z');
const SEEN = new Date('2026-10-21T09:30:00.000Z');

function row(rolePayload: unknown, extra: Partial<{ role: string; lastSeenAt: Date | null }> = {}) {
  return {
    id: 'p1',
    userId: 'u1',
    displayName: 'Elena',
    headline: 'Founder',
    bio: null,
    avatarUrl: null,
    location: 'Athens, Greece',
    rolePayload,
    updatedAt: UPDATED,
    user: { role: extra.role ?? 'founder', lastSeenAt: extra.lastSeenAt === undefined ? SEEN : extra.lastSeenAt },
    skills: [{ skill: { name: 'Product' } }, { skill: { name: 'Growth' } }],
  };
}

describe('a recommendation carries what its reasons are made of', () => {
  it('sends the stage, what they look for, their rounds and when they were active', () => {
    const hit = recommendationHit(
      row({ stage: 'mvp', commitment: 'full-time', rolesSought: ['Co-founder', 'CTO'], industries: ['SaaS', ''] }),
      74,
      ['Cofounder match'],
    );
    expect(hit).toMatchObject({
      skillNames: ['Product', 'Growth'],
      matchScore: 74,
      matchReasons: ['Cofounder match'],
      stage: 'mvp',
      availability: 'full-time',
      rolesSought: ['Co-founder', 'CTO'],
      // Profile edit saves `rolesSought`; `lookingFor` used to read a key it never writes.
      lookingFor: 'Co-founder, CTO',
      industries: ['SaaS'],
      investmentStages: [],
      profileUpdatedAt: '2026-10-20T08:00:00.000Z',
      lastSeenAt: Math.floor(SEEN.getTime() / 1000),
    });
  });

  it('reads an investor’s rounds and the older payload spellings', () => {
    const investor = recommendationHit(row({ stages: ['pre-seed', 'seed'], lookingFor: 'deal flow', industry: 'Fintech' }, { role: 'investor', lastSeenAt: null }), 60, []);
    expect(investor).toMatchObject({ investmentStages: ['pre-seed', 'seed'], lookingFor: 'deal flow', industries: ['Fintech'], stage: null, lastSeenAt: null });
    const listed = recommendationHit(row({ lookingFor: ['cofounder', 'mentor'] }), 50, []);
    expect(listed.lookingFor).toBe('cofounder, mentor');
    const empty = recommendationHit(row(null), 40, []);
    expect(empty).toMatchObject({ lookingFor: null, availability: null, stage: null, industries: [], rolesSought: [], investmentStages: [] });
  });
});

describe('the shared engine says "Skills overlap" only for a shared skill', () => {
  const snapshot = (skillNames: string[]): ProfileSnapshot => ({
    userId: Math.random().toString(36),
    profileId: 'p',
    role: 'founder',
    displayName: 'x',
    headline: null,
    bio: null,
    location: null,
    timezone: null,
    skillNames,
    rolePayload: null,
    updatedAtMs: 0,
  });

  it('no longer claims an overlap for two empty skill lists, and keeps their score', () => {
    const empty = computeMatchScore(snapshot([]), snapshot([]));
    expect(empty.breakdown.reasons).not.toContain('Skills overlap');
    // The score is a separate decision: two empty lists still count as they did.
    expect(empty.breakdown.skillsOverlap).toBe(25);
  });

  it('still says it when a skill is shared', () => {
    expect(computeMatchScore(snapshot(['Product', 'Growth']), snapshot(['product', 'AI'])).breakdown.reasons).toContain('Skills overlap');
    expect(computeMatchScore(snapshot(['Product']), snapshot(['AI'])).breakdown.reasons).not.toContain('Skills overlap');
  });
});
