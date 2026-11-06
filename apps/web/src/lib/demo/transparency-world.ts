import {
  TRANSPARENCY_EVENT_KINDS,
  halfYearOf,
  isAssistantFeedbackReason,
  parseHalfYear,
  type AssistantFeedbackCounts,
  type TransparencyEventKind,
  type TransparencyReport,
  type TransparencySurface,
} from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';

/**
 * The transparency report in the preview demo.
 *
 * The demo's own rules refuse contact details and promised returns exactly
 * as the API does; each refusal is counted here (kind and surface, nothing
 * else) for the current half year, so the report shows what this demo
 * session actually refused. The two moderation reports are the demo
 * admin queue's. The answer carries `sample: true` and the page says so.
 */

const STORAGE_KEY = 'cfb:demo-transparency:v1';
type Counts = Partial<Record<TransparencyEventKind, Partial<Record<TransparencySurface, number>>>>;
let memory: Counts | null = null;

function load(): Counts {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? (JSON.parse(raw) as Counts) : {};
  } catch {
    memory = {};
  }
  return memory;
}

export function resetDemoTransparency() {
  memory = null;
  votes = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(VOTES_KEY);
  } catch {
    // ignore
  }
}

/** Called by the demo worlds where the API records a refusal. */
export function recordDemoRefusal(kind: TransparencyEventKind, surface: TransparencySurface) {
  const counts = load();
  const bucket = (counts[kind] ??= {});
  bucket[surface] = (bucket[surface] ?? 0) + 1;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // storage blocked: the count lasts this page view
  }
}

// The 👍 and 👎 given in this demo session, kept as the API keeps them: one
// verdict per answer, a reason only on a 👎, and no text.
const VOTES_KEY = 'cfb:demo-answer-feedback:v1';
type Vote = { helpful: boolean; reason: string | null };
let votes: Record<string, Vote> | null = null;

function loadVotes(): Record<string, Vote> {
  if (votes) return votes;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(VOTES_KEY) : null;
    votes = raw ? (JSON.parse(raw) as Record<string, Vote>) : {};
  } catch {
    votes = {};
  }
  return votes;
}

function saveVotes(next: Record<string, Vote>) {
  votes = next;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(VOTES_KEY, JSON.stringify(next));
  } catch {
    // storage blocked: the verdict lasts this page view
  }
}

/** Answers `/api/ai/answers/:id/feedback` for the demo, or `undefined` for any other path. */
export function previewAnswerFeedbackApi(pathname: string, method: string, body: Record<string, unknown>): unknown {
  const match = /^\/api\/ai\/answers\/([^/]+)\/feedback$/.exec(pathname);
  if (!match) return undefined;
  const answerId = decodeURIComponent(match[1]);
  if (method === 'DELETE') {
    const { [answerId]: _gone, ...rest } = loadVotes();
    saveVotes(rest);
    return { ok: true };
  }
  if (method !== 'PUT') return undefined;
  if (typeof body.helpful !== 'boolean') throw new DemoRefusal(400, 'helpful must be a boolean value', { reason: 'helpful' });
  if (body.reason !== undefined && !isAssistantFeedbackReason(body.reason)) throw new DemoRefusal(400, 'reason must be one of the listed reasons', { reason: 'reason' });
  const reason = body.helpful ? null : ((body.reason as string | undefined) ?? null);
  saveVotes({ ...loadVotes(), [answerId]: { helpful: body.helpful, reason } });
  return { answerId, helpful: body.helpful, reason };
}

function feedbackCounts(): AssistantFeedbackCounts {
  const counts: AssistantFeedbackCounts = { helpful: 0, notHelpful: 0, byReason: {} };
  for (const vote of Object.values(loadVotes())) {
    if (vote.helpful) counts.helpful += 1;
    else {
      counts.notHelpful += 1;
      if (isAssistantFeedbackReason(vote.reason)) counts.byReason[vote.reason] = (counts.byReason[vote.reason] ?? 0) + 1;
    }
  }
  return counts;
}

/** Answers `/api/public/transparency` for the demo, or `undefined` for any other path. */
export function previewTransparencyApi(pathname: string, path: string, now: number): unknown {
  if (pathname !== '/api/public/transparency') return undefined;
  const requested = new URLSearchParams(path.split('?')[1] ?? '').get('period');
  const current = halfYearOf(now);
  const period = requested ? parseHalfYear(requested) : current;
  if (!period || Date.parse(period.from) > now) throw new DemoRefusal(400, 'period must look like 2026-H2');
  const live = period.key === current.key;
  const counts = live ? load() : {};
  const refusals = Object.fromEntries(
    TRANSPARENCY_EVENT_KINDS.map((k) => {
      const bySurface = { ...(counts[k] ?? {}) };
      return [k, { total: Object.values(bySurface).reduce((a, b) => a + (b ?? 0), 0), bySurface }];
    }),
  ) as TransparencyReport['refusals'];
  const report: TransparencyReport = {
    period,
    inProgress: live,
    refusals,
    reports: live ? { received: 2, resolved: 1, dismissed: 0, open: 1 } : { received: 0, resolved: 0, dismissed: 0, open: 0 },
    blocks: 0,
    assistantFeedback: live ? feedbackCounts() : { helpful: 0, notHelpful: 0, byReason: {} },
    generatedAt: new Date(now).toISOString(),
    sample: true,
  };
  return report;
}
