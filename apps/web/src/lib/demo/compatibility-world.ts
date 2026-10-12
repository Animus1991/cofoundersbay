/**
 * The compatibility questions in the demo, with the API's rules
 * (`apps/api/src/compatibility`, `packages/shared/src/compatibility`).
 *
 * The visitor starts with six of the ten answered, so a comparison shows and
 * the Settings card still has questions to offer. The four directory people
 * answer in ways that fit the roles the demo world gives them: Elena brings
 * an idea and wants to raise, Marcus wants to join one, Dr. Sarah Kim is a
 * mentor with steadier hours, Nikos an angel who answered only three.
 */

import {
  COMPAT_QUESTIONS,
  answeredCount,
  cleanCompatAnswers,
  compareCompatAnswers,
  mergeCompatAnswers,
  readCompatAnswers,
  type CompatAnswers,
} from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';

const ME = 'preview-demo-user';
const STORAGE_KEY = 'cfb:demo-compatibility:v1';

const SEED_ME: CompatAnswers = {
  hours: '40_plus',
  start: 'now',
  runway: '6_12',
  risk: 'medium',
  place: 'hybrid',
  idea: 'have_idea',
};

const OTHERS: Record<string, CompatAnswers> = {
  'user-elena': { hours: '40_plus', start: 'now', runway: '3_6', equity: 'by_time', risk: 'high', decisions: 'owner', place: 'same_city', idea: 'have_idea', pace: 'sprints', aim: 'venture_scale' },
  'user-marcus': { hours: '20_40', start: '1_3_months', runway: '6_12', equity: 'by_time', risk: 'medium', decisions: 'data', place: 'remote', idea: 'want_to_join', pace: 'steady', aim: 'venture_scale' },
  'user-sarah': { hours: 'under_10', start: 'now', runway: '12_plus', risk: 'low', decisions: 'consensus', place: 'remote', idea: 'open', pace: 'steady' },
  'user-nikos': { start: 'now', risk: 'high', aim: 'acquisition' },
};

let memory: CompatAnswers | null = null;

function load(): CompatAnswers {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? cleanCompatAnswers(JSON.parse(raw)) : { ...SEED_ME };
  } catch {
    memory = { ...SEED_ME };
  }
  return memory;
}

function persist() {
  try {
    if (memory && typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked: the demo keeps working for this page view.
  }
}

export function resetDemoCompatibility() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** The comparison the match page shows for a demo person. */
export function demoCompatibilityWith(userId: string) {
  return compareCompatAnswers(load(), OTHERS[userId] ?? {});
}

/** Answers `/api/compatibility…` for the demo, or `undefined` for any other path. */
export function previewCompatibilityApi(pathname: string, method: string, body: Record<string, unknown>): unknown {
  if (!pathname.startsWith('/api/compatibility/')) return undefined;
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api','compatibility', ...]
  if (parts.length === 3 && parts[2] === 'me') {
    if (method === 'GET') {
      const answers = load();
      return { answers, answered: answeredCount(answers), total: COMPAT_QUESTIONS.length };
    }
    if (method === 'PUT') {
      const read = readCompatAnswers('answers' in body ? body.answers : body);
      if (!read.ok) throw new DemoRefusal(400, read.reason.en, { reason: 'compat_invalid', field: read.field, messageEl: read.reason.el });
      memory = mergeCompatAnswers(load(), read.value);
      persist();
      return { answers: memory, answered: answeredCount(memory), total: COMPAT_QUESTIONS.length };
    }
  }
  if (parts.length === 4 && parts[2] === 'with' && method === 'GET') {
    const other = parts[3];
    if (other === ME) throw new DemoRefusal(400, 'Compare with someone else.', { reason: 'compat_self', messageEl: 'Συγκρίνετε με κάποιον άλλον.' });
    const mine = load();
    return {
      available: true,
      answeredByYou: answeredCount(mine),
      answeredByThem: answeredCount(OTHERS[other] ?? {}),
      ...compareCompatAnswers(mine, OTHERS[other] ?? {}),
    };
  }
  return undefined;
}
