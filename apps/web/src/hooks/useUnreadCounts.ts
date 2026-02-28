'use client';

import { useQuery } from '@tanstack/react-query';
import { listMessageConversations, listConnectionRequests } from '@/lib/api';

export type UnreadCounts = {
  messages: number;
  intros: number;
};

/**
 * Returns unread message count + pending intro requests.
 * Uses React Query for deduplication — all components share the same cached fetch.
 */
export function useUnreadCounts(pollIntervalMs = 60_000): UnreadCounts {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false;

  const { data: convData } = useQuery({
    queryKey: ['conversations', 'list'],
    queryFn: listMessageConversations,
    staleTime: 30_000,
    refetchInterval: pollIntervalMs,
    enabled: hasToken,
  });

  const { data: introData } = useQuery({
    queryKey: ['connections', 'pending-received'],
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    staleTime: 30_000,
    refetchInterval: pollIntervalMs,
    enabled: hasToken,
  });

  const messages = convData?.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0;
  const intros = introData?.connections.filter((c) => c.status === 'pending').length ?? 0;

  return { messages, intros };
}
