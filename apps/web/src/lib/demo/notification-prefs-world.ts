import { DIGEST_TOPIC_DEFAULTS, isDigestTopic, type DigestTopic } from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';

/**
 * The demo member's email-digest choice (Settings → Notifications, and the
 * assistant's `email_digest` control).
 *
 * `GET /api/notifications/preferences` had no demo handler, so it answered the
 * generic fallback: an object with no `digestFrequency`, which every reader
 * takes as "never". The switch could be turned on, the `PATCH` was echoed and
 * forgotten, and the refetch put the switch back — a control that looked
 * broken, and an assistant action that reported success and changed nothing.
 *
 * The rules are the API's (`notifications.controller.ts`): four values, and
 * `never` until the member opts in, because no stored row means no email. A
 * value outside the four is refused rather than kept, and a body with no
 * `digestFrequency` changes nothing.
 */

const STORAGE_KEY = 'cfb:demo-digest:v1';

export const DEMO_DIGEST_FREQUENCIES = ['daily', 'weekly', 'monthly', 'never'] as const;
export type DemoDigestFrequency = (typeof DEMO_DIGEST_FREQUENCIES)[number];

const isFrequency = (value: unknown): value is DemoDigestFrequency =>
  typeof value === 'string' && (DEMO_DIGEST_FREQUENCIES as readonly string[]).includes(value);

let memory: DemoDigestFrequency | null = null;

function read(): DemoDigestFrequency {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = isFrequency(raw) ? raw : 'never';
  } catch {
    memory = 'never';
  }
  return memory;
}

function write(value: DemoDigestFrequency) {
  memory = value;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked: the choice holds for this page view only.
  }
}

/** Back to "never", as a first visit. */
export function resetDemoDigest() {
  memory = null;
  topicsMemory = null;
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(TOPICS_KEY);
    }
  } catch {
    // ignore
  }
}

const TOPICS_KEY = 'cfb:demo-digest-topics:v1';
let topicsMemory: Record<DigestTopic, boolean> | null = null;

/** The demo member's digest topics: the job's defaults (all on) until a switch moves. */
function readTopics(): Record<DigestTopic, boolean> {
  if (topicsMemory) return topicsMemory;
  topicsMemory = { ...DIGEST_TOPIC_DEFAULTS };
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(TOPICS_KEY) : null;
    const stored = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    for (const [k, v] of Object.entries(stored)) if (isDigestTopic(k) && typeof v === 'boolean') topicsMemory[k] = v;
  } catch {
    // Unreadable storage: the defaults stand.
  }
  return topicsMemory;
}

function writeTopics(next: Record<DigestTopic, boolean>) {
  topicsMemory = next;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(TOPICS_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice holds for this page view only.
  }
}

/**
 * `/api/digests/preferences` with the API's rules (`digests.controller.ts`):
 * the cadence as three booleans (at most one true) and one boolean per topic;
 * a body changes only the keys it names.
 */
function previewDigestTopicsApi(method: string, body: Record<string, unknown>): unknown {
  if (method === 'GET') {
    const frequency = read();
    return { preferences: { daily: frequency === 'daily', weekly: frequency === 'weekly', monthly: frequency === 'monthly', ...readTopics() } };
  }
  if (method === 'POST') {
    const cadences = (['daily', 'weekly', 'monthly'] as const).filter((c) => body[c] === true);
    if (cadences.length > 1) throw new DemoRefusal(400, 'Choose only one digest frequency');
    if ((['daily', 'weekly', 'monthly'] as const).some((c) => body[c] !== undefined)) write(cadences[0] ?? 'never');
    const next = { ...readTopics() };
    for (const [k, v] of Object.entries(body)) if (isDigestTopic(k) && typeof v === 'boolean') next[k] = v;
    writeTopics(next);
    return { message: 'Digest preferences updated successfully' };
  }
  return undefined;
}

/** Answers `/api/notifications/preferences` and `/api/digests/preferences` for the demo, or `undefined` for any other path or method. */
export function previewNotificationPrefsApi(pathname: string, method: string, body: Record<string, unknown>): unknown {
  if (pathname === '/api/digests/preferences') return previewDigestTopicsApi(method, body);
  if (pathname !== '/api/notifications/preferences') return undefined;
  if (method === 'GET') return { digestFrequency: read() };
  if (method === 'PATCH') {
    if (body.digestFrequency !== undefined) {
      if (!isFrequency(body.digestFrequency)) {
        throw new DemoRefusal(400, 'digestFrequency must be one of: daily, weekly, monthly, never', { reason: 'digest_frequency' });
      }
      write(body.digestFrequency);
    }
    return { ok: true };
  }
  return undefined;
}
