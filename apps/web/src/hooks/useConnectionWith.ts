'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listConnectionRequests, respondToConnectionRequest } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { qk } from '@/lib/query-keys';
import type { MatchConnection } from '@/components/common/MatchCard';

export type ConnectionLink = { state: MatchConnection; id: string };

/**
 * Where a connection with each person stands, so a person's one primary
 * action is the right one: Connect, Accept their request, or Message.
 *
 * Read once here, on the keys /connections uses, so an answer there shows on
 * every surface that offers the action. The founder home offered "Connect" to
 * someone whose request was waiting (the activity line beside it said "Elena
 * Papadopoulos wants to connect", and /matches said "Accept"; docs §70).
 */
export function useConnectionWith(enabled: boolean, myId: string | null | undefined) {
  const received = useQuery({ queryKey: qk('connections', 'received'), queryFn: () => listConnectionRequests({ type: 'received' }), enabled, staleTime: 60_000 });
  const sent = useQuery({ queryKey: qk('connections', 'sent'), queryFn: () => listConnectionRequests({ type: 'sent' }), enabled, staleTime: 60_000 });
  const accepted = useQuery({ queryKey: qk('connections', 'accepted'), queryFn: () => listConnectionRequests({ type: 'accepted' }), enabled, staleTime: 60_000 });

  const connectionWith = useMemo(() => {
    const map = new Map<string, ConnectionLink>();
    for (const c of accepted.data?.connections ?? []) {
      map.set(c.requesterId === myId ? c.receiverId : c.requesterId, { state: 'connected', id: c.id });
    }
    for (const c of received.data?.connections ?? []) {
      if (!map.has(c.requesterId)) map.set(c.requesterId, { state: 'received', id: c.id });
    }
    for (const c of sent.data?.connections ?? []) {
      if (!map.has(c.receiverId)) map.set(c.receiverId, { state: 'sent', id: c.id });
    }
    return map;
  }, [accepted.data, received.data, sent.data, myId]);

  const connectionOf = useCallback(
    (userId: string): MatchConnection => connectionWith.get(userId)?.state ?? 'none',
    [connectionWith],
  );

  return { connectionWith, connectionOf };
}

/**
 * The connection state plus the one write every person card needs: accept a
 * request they sent. The founder home, /matches, a profile, Explore, the
 * member directory and For you each offered Accept with a copy of this; a
 * card that offered Connect instead sent a second request to someone whose
 * own was waiting (docs §86).
 */
export function useConnectionActions(enabled: boolean, myId: string | null | undefined) {
  const { connectionWith, connectionOf } = useConnectionWith(enabled, myId);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const accept = useCallback(
    async (userId: string): Promise<boolean> => {
      const link = connectionWith.get(userId);
      if (!link || link.state !== 'received') return false;
      try {
        await respondToConnectionRequest(link.id, 'accepted');
        success('Request accepted', 'You are now connected.');
        await queryClient.invalidateQueries({ queryKey: qk('connections') });
        return true;
      } catch (err) {
        showError('Could not accept the request', err instanceof Error ? err.message : 'Please try again');
        return false;
      }
    },
    [connectionWith, queryClient, success, showError],
  );
  return { connectionWith, connectionOf, accept };
}
