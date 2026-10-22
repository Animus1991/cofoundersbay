'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listConnectionRequests } from '@/lib/api';
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
