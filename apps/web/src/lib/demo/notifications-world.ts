import { DemoRefusal } from './demo-refusal';

/**
 * The demo member's notifications: read, unread again, deleted.
 *
 * The sample list was a constant, so "Mark all read" cleared the dots until
 * the refetch put every one back, the bell kept saying 2, and a delete came
 * back on the next visit. The demo now keeps what the visitor did in this tab
 * (sessionStorage, as the other `cfb:demo-*` worlds), with the API's rules
 * (`notifications.controller.ts`): the list filters by `unread` and `type`,
 * mark-all-read answers with the ids it marked, mark-unread makes read ones
 * unread again, and a delete removes the row.
 */

const STORAGE_KEY = 'cfb:demo-notifications:v1';

type Overlay = { readAt: Record<string, string | null>; deleted: string[] };
type Row = { id: string; type: string; readAt: string | null };

let memory: Overlay | null = null;

const empty = (): Overlay => ({ readAt: {}, deleted: [] });

function read(): Overlay {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as Partial<Overlay>) : null;
    memory = {
      readAt: parsed?.readAt && typeof parsed.readAt === 'object' ? parsed.readAt : {},
      deleted: Array.isArray(parsed?.deleted) ? parsed.deleted.filter((x): x is string => typeof x === 'string') : [],
    };
  } catch {
    memory = empty();
  }
  return memory;
}

function write(next: Overlay) {
  memory = next;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: what the visitor did holds for this page view only.
  }
}

/** Back to the sample as a first visit shows it. */
export function resetDemoNotifications() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** The sample rows as the visitor has left them: read marks applied, deleted ones gone. */
export function demoNotifications<T extends Row>(seed: readonly T[]): T[] {
  const overlay = read();
  return seed
    .filter((n) => !overlay.deleted.includes(n.id))
    .map((n) => (n.id in overlay.readAt ? { ...n, readAt: overlay.readAt[n.id] } : n));
}

function setReadAt(ids: readonly string[], value: string | null) {
  if (!ids.length) return;
  const overlay = read();
  const readAt = { ...overlay.readAt };
  for (const id of ids) readAt[id] = value;
  write({ ...overlay, readAt });
}

/**
 * Answers `/api/notifications…` for the demo, or `undefined` for any other
 * path or method (the preferences have their own world).
 */
export function previewNotificationsApi<T extends Row>(
  pathname: string,
  search: URLSearchParams,
  method: string,
  body: Record<string, unknown>,
  seed: readonly T[],
  nowIso: string,
): unknown {
  if (pathname !== '/api/notifications' && !pathname.startsWith('/api/notifications/')) return undefined;
  if (pathname === '/api/notifications/preferences') return undefined;
  const rows = demoNotifications(seed);

  if (pathname === '/api/notifications') {
    if (method === 'GET') {
      const type = search.get('type');
      const unreadOnly = search.get('unread') === 'true';
      return {
        notifications: rows.filter((n) => (!unreadOnly || !n.readAt) && (!type || type === 'all' || n.type === type)),
        nextCursor: null,
      };
    }
    if (method === 'DELETE') {
      const overlay = read();
      write({ ...overlay, deleted: [...new Set([...overlay.deleted, ...seed.map((n) => n.id)])] });
      return { ok: true };
    }
    return undefined;
  }

  if (pathname === '/api/notifications/unread-count' && method === 'GET') {
    return { count: rows.filter((n) => !n.readAt).length };
  }

  if (pathname === '/api/notifications/mark-all-read' && method === 'POST') {
    const ids = rows.filter((n) => !n.readAt).map((n) => n.id);
    setReadAt(ids, nowIso);
    return { ok: true, ids };
  }

  // The named ones read, as the API's mark-read: the inbox uses it while a category is chosen.
  if (pathname === '/api/notifications/mark-read' && method === 'POST') {
    const asked = Array.isArray(body.ids) ? body.ids : null;
    if (!asked || asked.length === 0 || asked.some((id) => typeof id !== 'string')) {
      throw new DemoRefusal(400, 'ids must be a non-empty array of strings', { reason: 'ids' });
    }
    const ids = rows.filter((n) => !n.readAt && asked.includes(n.id)).map((n) => n.id);
    setReadAt(ids, nowIso);
    return { ok: true, ids };
  }

  if (pathname === '/api/notifications/mark-unread' && method === 'POST') {
    const asked = Array.isArray(body.ids) ? body.ids : null;
    if (!asked || asked.length === 0 || asked.some((id) => typeof id !== 'string')) {
      throw new DemoRefusal(400, 'ids must be a non-empty array of strings', { reason: 'ids' });
    }
    const changed = rows.filter((n) => n.readAt && asked.includes(n.id)).map((n) => n.id);
    setReadAt(changed, null);
    return { ok: true, count: changed.length };
  }

  const readMatch = /^\/api\/notifications\/([^/]+)\/read$/.exec(pathname);
  if (readMatch && method === 'PATCH') {
    const row = rows.find((n) => n.id === readMatch[1]);
    if (row) setReadAt([row.id], nowIso);
    return { ok: true };
  }

  const rowMatch = /^\/api\/notifications\/([^/]+)$/.exec(pathname);
  if (rowMatch && method === 'DELETE') {
    const overlay = read();
    if (!overlay.deleted.includes(rowMatch[1])) write({ ...overlay, deleted: [...overlay.deleted, rowMatch[1]] });
    return { ok: true };
  }

  return undefined;
}
