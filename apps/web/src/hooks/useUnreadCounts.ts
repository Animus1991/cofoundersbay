'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMessageConversations, listConnectionRequests, getNotificationUnreadCount } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useHasSession } from './useSession';
import { useAuthenticatedSession } from './useAuthenticatedSession';
import { useApiAvailability } from './useApiAvailability';

export type UnreadCounts = {
  messages: number;
  intros: number;
  notifications: number;
};

/**
 * Returns unread message count + pending intro requests + unread notifications.
 * Uses React Query for deduplication — all components share the same cached fetch.
 * Reacts to login/logout events immediately (same-tab and cross-tab).
 */
export function useUnreadCounts(pollIntervalMs = 60_000): UnreadCounts {
  const hasToken = useHasSession();
  const { isAuthenticated } = useAuthenticatedSession();
  const apiAvailable = useApiAvailability();
  const [isVisible, setIsVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const { data: convData, isError: convError } = useQuery({
    queryKey: ['conversations', 'list'],
    queryFn: listMessageConversations,
    staleTime: 60_000,
    // Stop polling on error (server down / 401) — resume only after window focus or manual refetch
    refetchInterval: (query) => {
      if (!isVisible || query.state.status === 'error') return false;
      return pollIntervalMs;
    },
    enabled: hasToken && isAuthenticated && isVisible && apiAvailable,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 0,
  });

  const { data: introData, isError: introError } = useQuery({
    queryKey: queryKeys.connections.pendingReceived(),
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    staleTime: 60_000,
    refetchInterval: (query) => {
      if (!isVisible || query.state.status === 'error') return false;
      return pollIntervalMs;
    },
    enabled: hasToken && isAuthenticated && isVisible && apiAvailable,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 0,
  });

  const { data: notifData, isError: notifError } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getNotificationUnreadCount,
    staleTime: 60_000,
    refetchInterval: (query) => {
      if (!isVisible || query.state.status === 'error') return false;
      return pollIntervalMs;
    },
    enabled: hasToken && isAuthenticated && isVisible && apiAvailable,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 0,
  });

  // Silence unused-variable warnings
  void convError;
  void introError;
  void notifError;

  const messages = convData?.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0;
  const intros = introData?.connections.filter((c) => c.status === 'pending').length ?? 0;
  const notifications = notifData?.count ?? 0;

  return { messages, intros, notifications };
}
