/** Canonical React Query keys. Invalidate these after domain writes. */

export const queryKeys = {
  profileMe: ['me', 'profile'] as const,
  meProfileLegacy: ['me-profile'] as const,
  connections: ['connections'] as const,
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
};

export const PROFILE_KEYS = [queryKeys.profileMe, queryKeys.meProfileLegacy] as const;
export const CONNECTION_KEYS = [queryKeys.connections, queryKeys.connectionsPending] as const;
export const MESSAGE_KEYS = [queryKeys.conversations, queryKeys.conversationsList] as const;
