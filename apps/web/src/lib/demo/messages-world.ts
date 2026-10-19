/**
 * The demo's conversations: the seed threads plus whatever the visitor starts
 * and writes during the session.
 *
 * Starting a conversation used to answer `conv-elena` whoever it was with, so
 * "Message" on an investor or a provider opened Elena's thread, and a message
 * typed in the demo vanished on reload. Now `POST conversations/direct` opens
 * the thread with the person asked for (an existing one if there is one), and
 * what the visitor writes is kept for the session (sessionStorage, the same
 * pattern as the other demo write overlays). Nobody answers: the other side
 * is a sample, and the page never pretends otherwise.
 */

type Person = { userId: string; displayName: string; headline?: string | null; role?: string | null };

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: null; role: string };
  attachments: unknown[];
};

type Conversation = {
  id: string;
  type: 'direct';
  recipient: { id: string; displayName: string; headline: string | null; avatarUrl: null; role: string; isOnline: boolean; lastSeenAt: string };
  lastMessage: { id: string; body: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: string;
};

type Overlay = { conversations: Conversation[]; messages: Record<string, Message[]> };

const KEY = 'cfb:demo-messages';

function read(): Overlay {
  if (typeof window === 'undefined') return { conversations: [], messages: {} };
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(KEY) ?? '{}') as Partial<Overlay>;
    return { conversations: parsed.conversations ?? [], messages: parsed.messages ?? {} };
  } catch {
    return { conversations: [], messages: {} };
  }
}

function write(overlay: Overlay) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(overlay));
  } catch {
    // private mode: the thread lives until reload
  }
}

export function resetDemoMessages() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(KEY);
}

type Context<C, M> = {
  seedConversations: C[];
  seedMessages: Record<string, M[]>;
  personById: (id: string) => Person | null;
  me: { id: string; displayName: string; role: string };
  now: () => string;
};

/** Answers the demo's messaging routes, or undefined for any other path. */
export function previewMessagesWorld<C extends { id: string; recipient: { id: string }; lastMessage?: unknown; updatedAt: string }, M>(
  pathname: string,
  method: string,
  body: unknown,
  ctx: Context<C, M>,
): unknown {
  if (!pathname.startsWith('/api/messages/conversations')) return undefined;
  const overlay = read();

  const withLatest = <T extends { id: string; lastMessage?: unknown; updatedAt: string }>(conversation: T): T => {
    const added = overlay.messages[conversation.id];
    const last = added?.[added.length - 1];
    return last
      ? { ...conversation, lastMessage: { id: last.id, body: last.body, senderId: last.senderId, createdAt: last.createdAt }, updatedAt: last.createdAt }
      : conversation;
  };

  if (pathname === '/api/messages/conversations' && method === 'GET') {
    const all = [...overlay.conversations.map(withLatest), ...ctx.seedConversations.map(withLatest)];
    return { conversations: all.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) };
  }

  if (pathname === '/api/messages/conversations/direct' && method === 'POST') {
    const userId = String((body as { userId?: unknown } | null)?.userId ?? '');
    const seed = ctx.seedConversations.find((c) => c.recipient.id === userId);
    if (seed) return { conversationId: seed.id };
    const existing = overlay.conversations.find((c) => c.recipient.id === userId);
    if (existing) return { conversationId: existing.id };
    const person = ctx.personById(userId);
    if (!person) return { conversationId: ctx.seedConversations[0]?.id ?? '' };
    const now = ctx.now();
    const conversation: Conversation = {
      id: `conv-${person.userId}`,
      type: 'direct',
      recipient: {
        id: person.userId,
        displayName: person.displayName,
        headline: person.headline ?? null,
        avatarUrl: null,
        role: person.role ?? 'member',
        isOnline: false,
        lastSeenAt: now,
      },
      lastMessage: null,
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      updatedAt: now,
    };
    write({ ...overlay, conversations: [conversation, ...overlay.conversations] });
    return { conversationId: conversation.id };
  }

  const thread = pathname.match(/^\/api\/messages\/conversations\/([^/]+)\/messages$/);
  if (thread) {
    const id = thread[1];
    if (method === 'POST') {
      const text = String((body as { body?: unknown } | null)?.body ?? '').trim();
      if (!text) return { message: null };
      const message: Message = {
        id: `msg-demo-${Date.now()}`,
        conversationId: id,
        senderId: ctx.me.id,
        body: text,
        createdAt: ctx.now(),
        sender: { id: ctx.me.id, displayName: ctx.me.displayName, avatarUrl: null, role: ctx.me.role },
        attachments: [],
      };
      write({ ...overlay, messages: { ...overlay.messages, [id]: [...(overlay.messages[id] ?? []), message] } });
      return { message };
    }
    return { messages: [...((ctx.seedMessages[id] ?? []) as unknown[]), ...(overlay.messages[id] ?? [])] };
  }

  return undefined;
}
