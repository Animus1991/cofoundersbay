'use client';

import { useEffect, useState } from 'react';
import { listMessageConversations, listConnectionRequests } from '@/lib/api';

export type UnreadCounts = {
  messages: number;
  intros: number;
};

/**
 * Polls (or fetches once on mount) unread message count + pending intro requests.
 * Re-exported so SideNav and TopNav can both consume it without duplicate fetches.
 */
export function useUnreadCounts(pollIntervalMs = 60_000): UnreadCounts {
  const [counts, setCounts] = useState<UnreadCounts>({ messages: 0, intros: 0 });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [convResult, introResult] = await Promise.allSettled([
          listMessageConversations(),
          listConnectionRequests({ type: 'received', limit: 50 }),
        ]);

        if (!mounted) return;

        const messages =
          convResult.status === 'fulfilled'
            ? convResult.value.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
            : 0;

        const intros =
          introResult.status === 'fulfilled'
            ? introResult.value.connections.filter((c) => c.status === 'pending').length
            : 0;

        setCounts({ messages, intros });
      } catch {
        // silent — not critical
      }
    };

    load();
    const timer = setInterval(load, pollIntervalMs);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pollIntervalMs]);

  return counts;
}
