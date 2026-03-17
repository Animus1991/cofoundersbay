'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMessageConversations, listConnectionRequests } from '@/lib/api';

export type UnreadCounts = {
  messages: number;
  intros: number;
};

/**
 * Returns unread message count + pending intro requests.
 * Uses React Query for deduplication — all components share the same cached fetch.
 * hasToken is reactive: re-enables queries after login without page reload.
 */
export function useUnreadCounts(pollIntervalMs = 60_000): UnreadCounts {
  const [hasToken, setHasToken] = useState(() =>
    typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false
  );

  // React to login/logout events in the same tab and across tabs
  useEffect(() => {
    const sync = () => setHasToken(!!localStorage.getItem('accessToken'));
    window.addEventListener('storage', sync);
    // Also poll once per minute in case token was set without a storage event
    const id = setInterval(sync, 60_000);
    return () => { window.removeEventListener('storage', sync); clearInterval(id); };
  }, []);

  const { data: convData, isError: convError } = useQuery({
    queryKey: ['conversations', 'list'],
    queryFn: listMessageConversations,
    staleTime: 30_000,
    // Stop polling on error (server down / 401) — resume only after window focus or manual refetch
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      return pollIntervalMs;
    },
    enabled: hasToken,
    retry: 0,
  });

  const { data: introData, isError: introError } = useQuery({
    queryKey: ['connections', 'pending-received'],
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    staleTime: 30_000,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      return pollIntervalMs;
    },
    enabled: hasToken,
    retry: 0,
  });

  // Silence unused-variable warnings
  void convError;
  void introError;

  const messages = convData?.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0;
  const intros = introData?.connections.filter((c) => c.status === 'pending').length ?? 0;

  return { messages, intros };
}
