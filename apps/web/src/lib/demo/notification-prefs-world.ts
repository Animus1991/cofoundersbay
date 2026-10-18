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
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Answers `/api/notifications/preferences` for the demo, or `undefined` for any other path or method. */
export function previewNotificationPrefsApi(pathname: string, method: string, body: Record<string, unknown>): unknown {
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
