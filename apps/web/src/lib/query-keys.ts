/**
 * Canonical React Query key factory.
 *
 * docs/AI_PLATFORM_UPGRADE_PLAN.md §1.2 identified duplicate keys for the same
 * resource (e.g. ['me','profile'] vs ['me-profile'], ['connections'] vs
 * ['connection-requests']) — since invalidateQueries() only reaches keys that
 * share the array prefix, a write on one variant silently leaves the other
 * stale (concretely: saving /profile/edit never refreshed any dashboard,
 * because every dashboard read profile under a different key entirely).
 *
 * New code should build keys from here rather than writing array literals,
 * so a resource has exactly one key shape and invalidating it always reaches
 * every consumer. This is additive — it does not attempt to migrate every
 * existing key in one pass, only to give new and touched call sites a single
 * source of truth to converge on.
 */

const connectionsList = (tab?: string) =>
  tab ? (['connections', tab] as const) : (['connections'] as const);
const connectionsPending = () => ['connections', 'pending-received'] as const;

const connections = Object.assign(['connections'] as const, {
  list: connectionsList,
  pendingReceived: connectionsPending,
});

type ConnectionsKey = readonly ['connections'] & {
  list: (tab?: string) => readonly string[];
  pendingReceived: () => readonly ['connections', 'pending-received'];
};

export const queryKeys = {
  me: {
    /** Current user's profile. */
    profile: () => ['me', 'profile'] as const,
  },
  /** Connections query-key family. Use as an array or call `.list()` / `.pendingReceived()`. */
  connections: connections as ConnectionsKey,
  profileMe: ['me', 'profile'] as const,
  meProfileLegacy: ['me-profile'] as const,
  connectionsPending: ['connections', 'pending-received'] as const,
  conversations: ['conversations'] as const,
  conversationsList: ['conversations', 'list'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  notifications: ['notifications'] as const,
  notificationsUnread: ['notifications', 'unread-count'] as const,
  recommendations: ['recommendations'] as const,
  graphMe: ['graph', 'me'] as const,
  xpMe: ['xp', 'me'] as const,
  aiConversations: ['ai', 'conversations'] as const,
  aiConversation: (id: string) => ['ai', 'conversation', id] as const,
  aiPreferences: ['ai', 'preferences'] as const,
  aiHealth: ['ai-health'] as const,
  aiModels: ['ai-models'] as const,
  aiAgents: ['ai-agents'] as const,
  roles: ['roles', 'dashboard-context'] as const,
  shortlist: ['shortlist'] as const,
  shortlistIds: ['shortlist', 'ids'] as const,
};

export const PROFILE_KEYS = [
  queryKeys.profileMe,
  queryKeys.meProfileLegacy,
  queryKeys.me.profile(),
] as const;
export const CONNECTION_KEYS = [
  queryKeys.connections,
  queryKeys.connectionsPending,
  queryKeys.connections.pendingReceived(),
] as const;
export const MESSAGE_KEYS = [queryKeys.conversations, queryKeys.conversationsList] as const;
