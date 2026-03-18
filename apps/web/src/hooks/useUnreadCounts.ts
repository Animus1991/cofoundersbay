'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMessageConversations, listConnectionRequests } from '@/lib/api';

export type UnreadCounts = {
  messages: number;
  intros: number;
};

/**
 * Check if the user has an active session by looking for the CSRF cookie.
 * The cfb_csrf cookie is set by the API on login (non-httpOnly, JS-readable).
 * Falls back to legacy localStorage token for backward compat.
 */
function hasActiveSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('cfb_session=');
}

/**
 * Returns unread message count + pending intro requests.
 * Uses React Query for deduplication — all components share the same cached fetch.
 * Reacts to login/logout events immediately (same-tab and cross-tab).
 */
export function useUnreadCounts(pollIntervalMs = 60_000): UnreadCounts {
  const [hasToken, setHasToken] = useState(() => hasActiveSession());

  useEffect(() => {
    // Cross-tab sync via storage event
    const syncStorage = () => setHasToken(hasActiveSession());
    // Same-tab login/logout events dispatched by api.ts
    const onLogin = () => setHasToken(true);
    const onLogout = () => setHasToken(false);

    window.addEventListener('storage', syncStorage);
    window.addEventListener('cfb:login', onLogin);
    window.addEventListener('cfb:logout', onLogout);

    // Periodic fallback poll (catches cookie expiry not signalled by events)
    const id = setInterval(syncStorage, 30_000);

    return () => {
      window.removeEventListener('storage', syncStorage);
      window.removeEventListener('cfb:login', onLogin);
      window.removeEventListener('cfb:logout', onLogout);
      clearInterval(id);
    };
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
