import { afterEach, describe, expect, it } from 'vitest';
import { COHORT_MATCH_MIN_SCORE } from '@cofounderbay/shared';
import { demoCohortDetail, previewOrgApi } from './org-api';
import { ORG_PROGRAMS, ORG_SLUG } from './org-world';

/*
 * A cohort-wide match run in the demo (docs §102) keeps the API's rules:
 * every founder pair and founder-mentor/investor pair scored once, new pairs
 * kept from the threshold up, suggestions already there rescored with their
 * status kept.
 */

const NOW = Date.parse('2026-10-24T10:00:00.000Z');
const iso = (days: number, hour = 9) => new Date(NOW + days * 86_400_000 + hour * 3_600_000).toISOString();
afterEach(() => window.sessionStorage.clear());

describe('demo cohort match run', () => {
  const prog = ORG_PROGRAMS.find((p) => (demoCohortDetail(p.cohortId, NOW)?.matches.length ?? 0) > 0)!;

  it('scores the pairs, keeps the good new ones and the statuses already given', () => {
    const before = demoCohortDetail(prog.cohortId, NOW)!;
    const connected = before.matches.find((m) => m.status === 'connected')!;
    const out = previewOrgApi(`/api/org/${ORG_SLUG}/cohorts/${prog.cohortId}/matches/run`, '', 'POST', iso) as any;
    const founders = before.participants.filter((p) => p.role === 'founder').length;
    const others = before.participants.length - founders;
    expect(out.scored).toBe((founders * (founders - 1)) / 2 + founders * others);
    expect(out.created + out.updated + out.belowThreshold).toBe(out.scored);
    expect(out.updated).toBe(before.matches.length);
    const after = demoCohortDetail(prog.cohortId, NOW)!;
    expect(after.matches.length).toBe(out.created + out.updated);
    expect(after.matches.find((m) => m.id === connected.id)?.status).toBe('connected');
    expect(after.matches.filter((m) => !before.matches.some((b) => b.id === m.id)).every((m) => m.score >= COHORT_MATCH_MIN_SCORE && m.status === 'pending')).toBe(true);
    expect(after.matches.map((m) => m.score)).toEqual([...after.matches.map((m) => m.score)].sort((a, b) => b - a));
  });

  it('refuses an unknown cohort', () => {
    expect(() => previewOrgApi(`/api/org/${ORG_SLUG}/cohorts/nope/matches/run`, '', 'POST', iso)).toThrow(/Cohort not found/);
  });
});
