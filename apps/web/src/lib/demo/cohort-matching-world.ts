import {
  COHORT_MATCH_MIN_SCORE,
  cohortMatchPairs,
  type CohortMatchMember,
  type CohortRunResult,
} from '@cofounderbay/shared';
import { ORG_FOUNDERS, ORG_INVESTORS, ORG_MENTORS } from './org-world';

/**
 * A cohort-wide match run in the preview demo (docs §102), with the API's
 * rules (`cohortMatchPairs`, `COHORT_MATCH_MIN_SCORE`, rescoring keeps the
 * status). The demo has no matching engine, so a pair is scored from what
 * the demo knows about the two people - industry, stage, city, a mentor's
 * expertise - and says so in its reasons. Runs are kept for the session.
 */

const KEY = 'cfb:demo-cohort-runs:v1';

export type DemoCohortMatch = {
  id: string;
  a: { id: string; name: string | null; role: string; avatarUrl: null };
  b: { id: string; name: string | null; role: string; avatarUrl: null };
  score: number;
  status: 'pending' | 'viewed' | 'saved' | 'dismissed' | 'connected';
  generatedAt: string;
  reasons: string[];
};

type Stored = Record<string, { ranAt: string; matches: DemoCohortMatch[] }>;

function read(): Stored {
  try {
    const raw = typeof window === 'undefined' ? null : window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

function write(all: Stored) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage blocked: the run lasts this page view
  }
}

/** The matches of the last run of this cohort, when there was one this session. */
export function demoCohortRun(cohortId: string): { ranAt: string; matches: DemoCohortMatch[] } | null {
  return read()[cohortId] ?? null;
}

const city = (place?: string) => (place ?? '').split(',')[0].trim().toLowerCase();

/** Which mentor expertise speaks to which founder industry, in the demo's words. */
const EXPERTISE_FOR: Record<string, string[]> = {
  Climate: ['Energy markets', 'Hardware', 'Utilities'],
  CleanTech: ['Energy markets', 'Hardware', 'Utilities'],
  HealthTech: ['Healthcare', 'Product'],
  FinTech: ['Pricing', 'Fundraising', 'Go-to-market'],
  SaaS: ['Pricing', 'Go-to-market', 'Product'],
  DevTools: ['Product', 'Go-to-market', 'Hiring'],
  Logistics: ['Go-to-market', 'Pricing', 'Growth marketing'],
  Marketplaces: ['Growth marketing', 'Go-to-market', 'Brand'],
};

function score(sourceId: string, targetId: string): { score: number; reasons: string[] } {
  const a = ORG_FOUNDERS[sourceId];
  const reasons: string[] = [];
  let s = 50;
  const bFounder = ORG_FOUNDERS[targetId];
  const mentor = ORG_MENTORS.find((m) => m.id === targetId);
  const investor = ORG_INVESTORS.find((i) => i.id === targetId);
  if (a && bFounder) {
    if (a.industry === bFounder.industry) { s += 20; reasons.push('Same industry'); }
    if (a.stage === bFounder.stage) { s += 8; reasons.push('Same stage'); }
    if (city(a.location) && city(a.location) === city(bFounder.location)) { s += 7; reasons.push('Same city'); }
  } else if (a && mentor) {
    if (mentor.expertise.some((x) => (EXPERTISE_FOR[a.industry] ?? []).includes(x))) { s += 25; reasons.push('Mentor expertise fits'); }
    if (city(a.location) && city(a.location) === city(mentor.location)) { s += 7; reasons.push('Same city'); }
  } else if (a && investor) {
    if (/seed/i.test(investor.headline) && /seed/i.test(a.stage)) { s += 15; reasons.push('Same stage'); }
  } else {
    s = 30;
  }
  return { score: Math.min(95, s), reasons };
}

const nameOf = (id: string) => ORG_FOUNDERS[id]?.name ?? ORG_MENTORS.find((m) => m.id === id)?.name ?? ORG_INVESTORS.find((i) => i.id === id)?.name ?? null;

/**
 * Runs matching over `members`, starting from `existing` (the cohort's
 * suggestions as they stand): a pair already suggested is rescored with its
 * status kept, a new one is kept from the threshold up.
 */
export function runDemoCohortMatching(cohortId: string, members: CohortMatchMember[], existing: DemoCohortMatch[], now: number): CohortRunResult {
  const ranAt = new Date(now).toISOString();
  const prior = demoCohortRun(cohortId)?.matches ?? existing;
  const result: CohortRunResult = { scored: 0, created: 0, updated: 0, belowThreshold: 0, ranAt };
  const next: DemoCohortMatch[] = [];
  for (const p of cohortMatchPairs(members)) {
    const ab = score(p.source, p.target);
    const ba = p.kind === 'founders' ? score(p.target, p.source) : null;
    const value = Math.round(ba ? (ab.score + ba.score) / 2 : ab.score);
    const reasons = [...new Set([...ab.reasons, ...(ba?.reasons ?? [])])];
    result.scored += 1;
    const old = prior.find((m) => (m.a.id === p.source && m.b.id === p.target) || (m.a.id === p.target && m.b.id === p.source));
    const role = (id: string) => members.find((m) => m.userId === id)?.role ?? 'founder';
    if (old) {
      next.push({ ...old, score: value, reasons, generatedAt: ranAt });
      result.updated += 1;
    } else if (value >= COHORT_MATCH_MIN_SCORE) {
      next.push({
        id: `cm-run-${cohortId}-${p.source}-${p.target}`,
        a: { id: p.source, name: nameOf(p.source), role: role(p.source), avatarUrl: null },
        b: { id: p.target, name: nameOf(p.target), role: role(p.target), avatarUrl: null },
        score: value,
        status: 'pending',
        generatedAt: ranAt,
        reasons,
      });
      result.created += 1;
    } else {
      result.belowThreshold += 1;
    }
  }
  next.sort((x, y) => y.score - x.score);
  write({ ...read(), [cohortId]: { ranAt, matches: next } });
  return result;
}
