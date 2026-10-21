import { DemoRefusal } from './demo-refusal';

/**
 * The demo member's connection requests: sent, answered, withdrawn.
 *
 * The sample list was a module constant. A request sent from Matches lasted
 * until the next reload; Accept answered with the first row, unchanged, so
 * Elena's request could never be accepted; Withdraw removed nothing; and the
 * status of *any* member read "request received", so the profile of someone
 * the visitor had never met offered to accept their request. The demo now
 * keeps what the visitor did in this tab (sessionStorage, as the other
 * `cfb:demo-*` worlds), with the API's rules (`connections.service.ts`): a
 * list answers one type (received, when none is given), only the receiver
 * answers a pending request, only the sender withdraws one, a second request
 * to someone already connected or asked is refused, and a status is read
 * from the rows.
 */

const STORAGE_KEY = 'cfb:demo-connections:v1';

type Person = { id: string; displayName: string; avatarUrl: string | null; role: string; headline: string | null };

export type DemoConnection = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  requester: Person;
  receiver: Person;
};

type Overlay = {
  /** Seed or created rows answered or blocked since: their new status. */
  changed: Record<string, { status: string; updatedAt: string }>;
  /** Rows the visitor created, newest first. */
  created: DemoConnection[];
  /** Rows withdrawn, or replaced by a new request after a decline. */
  removed: string[];
};

let memory: Overlay | null = null;

const empty = (): Overlay => ({ changed: {}, created: [], removed: [] });

function read(): Overlay {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as Partial<Overlay>) : null;
    memory = {
      changed: parsed?.changed && typeof parsed.changed === 'object' ? parsed.changed : {},
      created: Array.isArray(parsed?.created) ? parsed.created.filter((c): c is DemoConnection => Boolean(c && typeof c === 'object' && typeof (c as DemoConnection).id === 'string')) : [],
      removed: Array.isArray(parsed?.removed) ? parsed.removed.filter((x): x is string => typeof x === 'string') : [],
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
export function resetDemoConnections() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Every row as the visitor has left it, newest first. */
export function demoConnections(seed: readonly DemoConnection[]): DemoConnection[] {
  const overlay = read();
  return [...overlay.created, ...seed]
    .filter((c) => !overlay.removed.includes(c.id))
    .map((c) => (overlay.changed[c.id] ? { ...c, ...overlay.changed[c.id] } : c))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function between(rows: DemoConnection[], me: string, other: string): DemoConnection | undefined {
  return rows.find(
    (c) => (c.requesterId === me && c.receiverId === other) || (c.requesterId === other && c.receiverId === me),
  );
}

export type ConnectionsContext = {
  seed: readonly DemoConnection[];
  me: Person;
  /** A member of the demo world by user id, or undefined. */
  personById: (id: string) => Person | undefined;
  nowIso: string;
  newId: () => string;
};

/**
 * Answers `/api/connections…` for the demo, or `undefined` for any other
 * path. Throws `DemoRefusal` where the API refuses.
 */
export function previewConnectionsApi(
  pathname: string,
  search: URLSearchParams,
  method: string,
  body: Record<string, unknown>,
  ctx: ConnectionsContext,
): unknown {
  if (pathname !== '/api/connections' && !pathname.startsWith('/api/connections/')) return undefined;
  const me = ctx.me.id;
  const rows = demoConnections(ctx.seed);
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api', 'connections', ...]

  if (parts[2] === 'status' && parts[3] && method === 'GET') {
    const row = between(rows, me, parts[3]);
    if (!row) return { status: null, connectionId: null, direction: null };
    return { status: row.status, connectionId: row.id, direction: row.requesterId === me ? 'sent' : 'received' };
  }

  if (parts[2] === 'block' && parts[3] && method === 'POST') {
    const other = parts[3];
    if (other === me) throw new DemoRefusal(400, 'Cannot block yourself', { messageEl: 'Δεν μπορείτε να αποκλείσετε τον εαυτό σας.' });
    const overlay = read();
    const row = between(rows, me, other);
    if (row) {
      write({ ...overlay, changed: { ...overlay.changed, [row.id]: { status: 'blocked', updatedAt: ctx.nowIso } } });
      return { connection: { ...row, status: 'blocked', updatedAt: ctx.nowIso } };
    }
    const person = ctx.personById(other);
    if (!person) throw new DemoRefusal(404, 'Member not found', { messageEl: 'Το μέλος δεν βρέθηκε.' });
    const blocked: DemoConnection = { id: ctx.newId(), requesterId: me, receiverId: other, status: 'blocked', message: null, createdAt: ctx.nowIso, updatedAt: ctx.nowIso, requester: ctx.me, receiver: person };
    write({ ...overlay, created: [blocked, ...overlay.created] });
    return { connection: blocked };
  }

  // A list, whatever path under /api/connections asks for one ("/requests"
  // included): the API's types, received when none is given.
  if (method === 'GET') {
    const type = search.get('type') ?? 'received';
    const limit = Math.min(Number(search.get('limit')) || 50, 100);
    const connections = rows.filter((c) =>
      type === 'sent'
        ? c.requesterId === me && c.status === 'pending'
        : type === 'accepted'
          ? (c.requesterId === me || c.receiverId === me) && c.status === 'accepted'
          : c.receiverId === me && c.status === 'pending',
    );
    return { connections: connections.slice(0, limit) };
  }

  if (parts.length === 2 && method === 'POST') {
    const receiverId = typeof body.receiverId === 'string' ? body.receiverId : '';
    if (!receiverId) throw new DemoRefusal(400, 'receiverId is required', { reason: 'receiverId', messageEl: 'Λείπει ο παραλήπτης.' });
    if (receiverId === me) throw new DemoRefusal(400, 'Cannot connect with yourself', { messageEl: 'Δεν μπορείτε να συνδεθείτε με τον εαυτό σας.' });
    const existing = between(rows, me, receiverId);
    if (existing?.status === 'accepted') throw new DemoRefusal(409, 'Already connected', { messageEl: 'Είστε ήδη συνδεδεμένοι.' });
    if (existing?.status === 'pending') throw new DemoRefusal(409, 'Connection request already sent', { messageEl: 'Υπάρχει ήδη αίτημα σύνδεσης σε αναμονή.' });
    if (existing?.status === 'blocked') throw new DemoRefusal(403, 'Cannot connect with this user', { messageEl: 'Δεν είναι δυνατή η σύνδεση με αυτό το μέλος.' });
    const person = ctx.personById(receiverId);
    if (!person) throw new DemoRefusal(404, 'Member not found', { messageEl: 'Το μέλος δεν βρέθηκε.' });
    const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : null;
    const created: DemoConnection = { id: ctx.newId(), requesterId: me, receiverId, status: 'pending', message, createdAt: ctx.nowIso, updatedAt: ctx.nowIso, requester: ctx.me, receiver: person };
    const overlay = read();
    // A declined request is replaced, as the API deletes it before creating the new one.
    write({ ...overlay, created: [created, ...overlay.created], removed: existing ? [...overlay.removed, existing.id] : overlay.removed });
    return { connection: created };
  }

  if (parts.length === 3) {
    const row = rows.find((c) => c.id === parts[2]);
    if (method === 'PATCH') {
      const status = body.status;
      if (status !== 'accepted' && status !== 'declined') throw new DemoRefusal(400, 'status must be accepted or declined', { reason: 'status' });
      if (!row) throw new DemoRefusal(404, 'Connection request not found', { messageEl: 'Το αίτημα σύνδεσης δεν βρέθηκε.' });
      if (row.receiverId !== me) throw new DemoRefusal(403, 'Not authorized', { messageEl: 'Μόνο ο παραλήπτης απαντά σε ένα αίτημα.' });
      if (row.status !== 'pending') throw new DemoRefusal(409, 'Request already responded to', { messageEl: 'Το αίτημα έχει ήδη απαντηθεί.' });
      const overlay = read();
      write({ ...overlay, changed: { ...overlay.changed, [row.id]: { status, updatedAt: ctx.nowIso } } });
      return { connection: { ...row, status, updatedAt: ctx.nowIso } };
    }
    if (method === 'DELETE') {
      if (!row) throw new DemoRefusal(404, 'Connection request not found', { messageEl: 'Το αίτημα σύνδεσης δεν βρέθηκε.' });
      if (row.requesterId !== me) throw new DemoRefusal(403, 'Only the sender can withdraw a request', { messageEl: 'Μόνο όποιος έστειλε το αίτημα μπορεί να το αποσύρει.' });
      if (row.status !== 'pending') throw new DemoRefusal(409, 'Request has already been answered', { messageEl: 'Το αίτημα έχει ήδη απαντηθεί.' });
      const overlay = read();
      write({ ...overlay, removed: [...overlay.removed, row.id] });
      return { ok: true, connectionId: row.id };
    }
  }

  return undefined;
}
