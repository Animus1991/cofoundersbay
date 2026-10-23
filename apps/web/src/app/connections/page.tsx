'use client';

import { choiceControl, ROW_GONE, rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Clock,
  Send,
  MessageCircle,
  Check,
  X,
  UserPlus,
  Compass,
  Handshake,
  TrendingUp,
} from 'lucide-react';
import {
  listConnectionRequests,
  respondToConnectionRequest,
  getOrCreateDirectConversation,
  type ConnectionRequestItem,
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailStats } from '@/components/layout/RailParts';
import { useStoredUser } from '@/hooks/useStoredUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { initialsOf } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { BilingualText } from '@/components/common/BilingualText';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { connectionsEn, connectionsEl } from '@/lib/i18n/strings-connections';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { qk } from '@/lib/query-keys';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { PeopleYouMayKnow } from '@/components/network/PeopleYouMayKnow';
import { Counter } from '@/components/ui/counter';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { ASK } from '@/lib/page-questions';
import { statusEl } from '@/components/common/StatusText';

const CollaborationStarter = dynamic(
  () => import('@/components/collaboration/CollaborationStarter').then((m) => ({ default: m.CollaborationStarter })),
  { ssr: false },
);
const PostAcceptCollaborationModal = dynamic(
  () => import('@/components/collaboration/CollaborationStarter').then((m) => ({ default: m.PostAcceptCollaborationModal })),
  { ssr: false },
);

function ConnectionCard({
  connection,
  viewerId,
  onAccept,
  onDecline,
  onMessage,
  isPending,
}: {
  connection: ConnectionRequestItem;
  viewerId: string | null;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  isPending?: boolean;
}) {
  const isReceiver = connection.receiverId === viewerId;
  const other = isReceiver ? connection.requester : connection.receiver;
  const isAccepted = connection.status === 'accepted';

  const actions = isAccepted ? (
    <>
      <AIInsightButton
        prompt={{
          en: `Analyze collaboration potential with ${other.displayName}, a ${other.role}${other.headline ? ` — ${other.headline}` : ''}. What working dynamic would we likely have?`,
          el: `Ανάλυσε τη δυνατότητα συνεργασίας με ${other.displayName} (${statusEl(other.role) ?? other.role})${other.headline ? ` — ${other.headline}` : ''}. Τι δυναμική συνεργασίας θα είχαμε μάλλον;`,
        }}
        agentId="matching"
        cacheKey={`conn-match-${connection.id}`}
        variant="icon"
        label={bilingualAria(connectionsEn('ai_collaboration'), connectionsEl('ai_collaboration'))}
      />
      <Button variant="secondary" size="sm" className="gap-2" onClick={onMessage}>
        <MessageCircle className="icon-sm" />
        <BilingualText en={connectionsEn('message')} el={connectionsEl('message')} compact />
      </Button>
    </>
  ) : isReceiver && connection.status === 'pending' ? (
    <>
      <Button
        size="sm"
        className="gap-1"
        onClick={onAccept}
        disabled={isPending}
      >
        <Check className="icon-sm" />
        <BilingualText en={connectionsEn('accept')} el={connectionsEl('accept')} compact />
      </Button>
      <Button aria-label={bilingualAria(connectionsEn('decline'), connectionsEl('decline'))}
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground hover:text-destructive-accessible"
        onClick={onDecline}
        disabled={isPending}
      >
        <X className="icon-sm" aria-hidden="true" />
      </Button>
    </>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="mr-1 icon-sm" />
      <BilingualText en={connectionsEn('pending')} el={connectionsEl('pending')} compact />
    </Badge>
  );

  // The same head as every card (avatar, name, the line under it); the
  // actions sit at its right from `sm` up and under the note on a phone,
  // where they would squeeze the name.
  return (
    <Card className="card-interactive">
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Link href={`/profiles/${other.id}`} aria-label={bilingualAria(`Open ${other.displayName}'s profile`, `Άνοιγμα προφίλ: ${other.displayName}`)}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={other.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold">
                  {initialsOf(other.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          title={(
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <PersonHovercard userId={other.id}><Link href={`/profiles/${other.id}`} className="transition-colors hover:text-primary-accessible">{other.displayName}</Link></PersonHovercard>
              <RoleBadge role={other.role} size="sm" />
            </span>
          )}
          subtitle={other.headline ?? undefined}
          asideClassName="hidden sm:flex"
          aside={actions}
        />
        {connection.message && !isAccepted && (
          <p className="card-body italic text-muted-foreground line-clamp-2">
            &ldquo;{connection.message}&rdquo;
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:hidden">{actions}</div>
      </CardContent>
    </Card>
  );
}

function IntroRequestCard({
  connection,
  onAccept,
  onDecline,
  isPending,
}: {
  connection: ConnectionRequestItem;
  onAccept: () => void;
  onDecline: () => void;
  isPending?: boolean;
}) {
  const sender = connection.requester;
  const formatDay = useDateFormat();
  // Endorsements' anatomy: avatar, name and headline, the kind at the right;
  // the note and the foot (date, then the two answers) on the avatar's edge.
  return (
    <Card className="card-interactive border-primary-muted bg-primary-subtle">
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Link href={`/profiles/${sender.id}`} aria-label={bilingualAria(`Open ${sender.displayName}'s profile`, `Άνοιγμα προφίλ: ${sender.displayName}`)}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                <AvatarImage src={sender.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold">
                  {initialsOf(sender.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          title={(
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <PersonHovercard userId={sender.id}><Link href={`/profiles/${sender.id}`} className="transition-colors hover:text-primary-accessible">{sender.displayName}</Link></PersonHovercard>
              <RoleBadge role={sender.role} size="sm" />
            </span>
          )}
          subtitle={sender.headline ?? undefined}
          aside={(
            <span className="font-medium text-primary-accessible">
              <BilingualText en={connectionsEn('intro_request')} el={connectionsEl('intro_request')} compact />
            </span>
          )}
        />

        {connection.message && (
          <p className="card-body italic text-foreground/80">{connection.message}</p>
        )}

        <CardFoot meta={formatDay(connection.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}>
          <Button size="sm" className="gap-1.5" onClick={onAccept} disabled={isPending}>
            <Check className="icon-sm" />
            <BilingualText en={connectionsEn('accept')} el={connectionsEl('accept')} compact />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-muted-foreground hover:text-destructive-accessible"
            onClick={onDecline}
            disabled={isPending}
          >
            <X className="icon-sm" />
            <BilingualText en={connectionsEn('decline')} el={connectionsEl('decline')} compact />
          </Button>
        </CardFoot>
      </CardContent>
    </Card>
  );
}

function ConnectionSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

export default function ConnectionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  /*
   * Three tabs. "Intro Requests" and "Received" listed the same rows (the
   * API's received requests are the pending ones) in two card styles, and
   * "intro" is the word for /intros, a different thing. One "Requests" tab
   * keeps the richer card, with the message and Accept / Decline (§87).
   */
  const [tab, setTabState] = useState<'received' | 'sent' | 'accepted'>('received');
  const setTab = (v: string) => setTabState(v === 'sent' || v === 'accepted' ? v : 'received');
  // Links arrive as ?tab=requests|received|sent|connected (the "Next action"
  // banner sends ?tab=requests).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'sent') setTabState('sent');
    else if (t === 'connected' || t === 'accepted') setTabState('accepted');
  }, []);
  // Offered to the assistant: the tab, through the same setter ("intros"
  // still opens Requests). Accepting and declining are offered below, once
  // the rows are known.
  usePageControls([
    choiceControl('tab', 'Connections tab', 'Καρτέλα συνδέσεων', [
      { value: 'received', en: 'Requests waiting on you', el: 'Αιτήματα που σας περιμένουν' },
      { value: 'sent', en: 'Sent requests', el: 'Σταλμένα αιτήματα' },
      { value: 'accepted', en: 'Connected', el: 'Συνδεδεμένοι' },
    ], tab, setTab),
  ]);
  const [justAcceptedUser, setJustAcceptedUser] = useState<{
    id: string; displayName: string; avatarUrl?: string | null; role?: string; headline?: string | null;
  } | null>(null);

  // Read after mount, so the server and the first client render agree.
  const viewerId = useStoredUser()?.id ?? null;

  const listType = tab;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk('connections', listType),
    queryFn: () => listConnectionRequests({ type: listType }),
    staleTime: 30_000,
  });

  /*
   * The network figures were counted from whichever tab was open: on Intros
   * (requests received) "Sent, pending" was always 0 and "Connected" counted
   * only accepted requests the reader had received. Each figure now comes
   * from its own read - the same three the tabs use, so they share a cache.
   */
  const [receivedQ, sentQ, acceptedQ] = useQueries({
    queries: (['received', 'sent', 'accepted'] as const).map((type) => ({
      queryKey: qk('connections', type),
      queryFn: () => listConnectionRequests({ type }),
      staleTime: 30_000,
    })),
  });
  const countOf = (q: typeof receivedQ) => {
    const list = q.data?.connections;
    return q.data ? (Array.isArray(list) ? list.length : 0) : null;
  };
  const receivedCount = countOf(receivedQ);
  const sentCount = countOf(sentQ);
  const acceptedCount = countOf(acceptedQ);
  // Everyone already connected, or with a request either way, stays out of
  // "People you may know".
  const knownIds = useMemo(() => {
    const ids = new Set<string>();
    for (const q of [receivedQ, sentQ, acceptedQ]) {
      for (const c of q.data?.connections ?? []) {
        if (c?.requesterId) ids.add(c.requesterId);
        if (c?.receiverId) ids.add(c.receiverId);
      }
    }
    return ids;
  }, [receivedQ.data, sentQ.data, acceptedQ.data]);

  const respondMutation = useMutation({
    mutationFn: ({ id, status, otherUserId }: { id: string; status: 'accepted' | 'declined'; otherUserId?: string; acceptedUserInfo?: { id: string; displayName: string; avatarUrl?: string | null; role?: string; headline?: string | null } }) =>
      respondToConnectionRequest(id, status).then(() => otherUserId),
    onSuccess: (otherUserId, { status, acceptedUserInfo }) => {
      queryClient.invalidateQueries({ queryKey: qk('connections') });
      if (status === 'accepted' && otherUserId && acceptedUserInfo) {
        setJustAcceptedUser(acceptedUserInfo);
      } else if (status !== 'accepted') {
        success(bilingualInline('Request declined', 'Το αίτημα απορρίφθηκε'), bilingualInline('The request has been removed.', 'Το αίτημα αφαιρέθηκε.'));
      }
    },
    onError: (err) => {
      showError(bilingualInline('Could not respond', 'Δεν ήταν δυνατή η απάντηση'), err instanceof Error ? err.message : bilingualInline('Please try again', 'Δοκιμάστε ξανά'));
    },
  });

  const handleMessage = async (userId: string) => {
    try {
      const { conversationId } = await getOrCreateDirectConversation(userId);
      router.push(`/messages?c=${conversationId}`);
    } catch {
      router.push(`/messages?to=${userId}`);
    }
  };

  const allConnections = data?.connections ?? [];
  const connections =
    tab === 'received'
      ? allConnections.filter((c) => c.status === 'pending' && (!viewerId || c.receiverId === viewerId))
      : allConnections;

  const introCount = receivedCount ?? 0;

  // What the tab shows, and the row buttons as commands: Accept and Decline
  // on a request someone sent the reader - the same mutation the buttons run.
  const otherOf = (c: (typeof connections)[number]) => (c.requesterId === viewerId ? c.receiver : c.requester);
  const incoming = connections.filter((c) => c.receiverId === viewerId && c.status === 'pending');
  // Kept pending until the answer is stored, so the assistant's card turns
  // green only once the request has actually been accepted or declined.
  const respond = async (id: string | undefined, status: 'accepted' | 'declined'): Promise<PageControlRunResult> => {
    const c = incoming.find((row) => row.id === id);
    if (!c) return ROW_GONE;
    const other = otherOf(c);
    await respondMutation.mutateAsync({
      id: c.id,
      status,
      otherUserId: c.requesterId,
      acceptedUserInfo: { id: c.requesterId, displayName: other?.displayName ?? '', avatarUrl: other?.avatarUrl ?? null, role: other?.role, headline: other?.headline ?? null },
    });
  };
  usePageList([
    {
      id: 'connections',
      labelEn: 'Connections',
      labelEl: 'Συνδέσεις',
      rows: isLoading ? undefined : connections.map((c) => {
        const other = otherOf(c);
        return `${other?.displayName ?? 'Someone'}${other?.role ? ` · ${other.role}` : ''}${other?.headline ? ` · ${other.headline}` : ''} · ${c.status}`;
      }),
    },
  ]);
  usePageControls([
    {
      id: 'accept_request',
      labelEn: 'Accept connection request',
      labelEl: 'Αποδοχή αιτήματος σύνδεσης',
      writes: true,
      options: rowOptions(incoming, (c) => c.id, (c) => otherOf(c)?.displayName ?? 'Request'),
      unavailableEn: incoming.length ? undefined : 'No request is waiting on this tab.',
      unavailableEl: incoming.length ? undefined : 'Κανένα αίτημα δεν περιμένει σε αυτή την καρτέλα.',
      run: (v) => respond(v, 'accepted'),
    },
    {
      id: 'decline_request',
      labelEn: 'Decline connection request',
      labelEl: 'Απόρριψη αιτήματος σύνδεσης',
      writes: true,
      options: rowOptions(incoming, (c) => c.id, (c) => otherOf(c)?.displayName ?? 'Request'),
      unavailableEn: incoming.length ? undefined : 'No request is waiting on this tab.',
      unavailableEl: incoming.length ? undefined : 'Κανένα αίτημα δεν περιμένει σε αυτή την καρτέλα.',
      run: (v) => respond(v, 'declined'),
    },
  ]);

  // Unknown until its own read answers: a dash, never a 0 that means "loading".
  const figure = (n: number | null) => (n == null ? '—' : n);
  const networkStats = [
    { labelEn: connectionsEn('stat_connected'), labelEl: connectionsEl('stat_connected'), value: figure(acceptedCount), icon: Users, tone: 'accent' as const },
    { labelEn: connectionsEn('stat_intro_requests'), labelEl: connectionsEl('stat_intro_requests'), value: figure(receivedCount), icon: Handshake, tone: 'warning' as const },
    { labelEn: connectionsEn('stat_sent_pending'), labelEl: connectionsEl('stat_sent_pending'), value: figure(sentCount), icon: Send, tone: 'info' as const },
    {
      labelEn: connectionsEn('stat_total_interactions'),
      labelEl: connectionsEl('stat_total_interactions'),
      value: receivedCount == null || sentCount == null || acceptedCount == null ? '—' : receivedCount + sentCount + acceptedCount,
      icon: TrendingUp,
      tone: 'success' as const,
    },
  ];

  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'people',
      labelEn: 'Network',
      labelEl: 'Δίκτυο',
      content: (
        <RailStats
          items={networkStats.map((s) => ({
            key: s.labelEn,
            label: s.labelEn,
            labelEl: s.labelEl,
            value: s.value,
            icon: s.icon,
            tone: `${STATUS[s.tone].bg} ${STATUS[s.tone].icon}`,
          }))}
        />
      ),
    },
    {
      id: 'go',
      glyph: 'discover',
      labelEn: 'Where to go next',
      labelEl: 'Πού να πάτε μετά',
      content: (
        <div className="space-y-1">
          <RailAction icon={UserPlus} en={connectionsEn('find_people')} el={connectionsEl('find_people')} onClick={() => router.push('/discover')} />
          <RailAction icon={Compass} en="Open matches" el="Άνοιγμα αντιστοιχίσεων" onClick={() => router.push('/matches')} />
          <RailAction icon={MessageCircle} en="Open messages" el="Άνοιγμα μηνυμάτων" onClick={() => router.push('/messages')} />
        </div>
      ),
    },
  ];

  return (
    <>
    {justAcceptedUser && (
      <PostAcceptCollaborationModal
        otherUser={justAcceptedUser}
        onDismiss={() => setJustAcceptedUser(null)}
      />
    )}
    <AppShell
      showHelp
      rail={rail}
    >
      <div className="space-y-6 pb-10">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="received" className="gap-2">
            <Handshake className="icon-sm" />
            <BilingualText en={connectionsEn('requests')} el={connectionsEl('requests')} compact />
            {introCount > 0 && (
              <Counter value={introCount} tone="attention" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="icon-sm" />
            <BilingualText en={connectionsEn('sent')} el={connectionsEl('sent')} compact />
            {sentCount ? <Counter value={sentCount} /> : null}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-2">
            <Users className="icon-sm" />
            <BilingualText en={connectionsEn('connected')} el={connectionsEl('connected')} compact />
            {acceptedCount ? <Counter value={acceptedCount} /> : null}
          </TabsTrigger>
        </TabsList>

        {/* Requests waiting on the reader */}
        <TabsContent value="received" className="mt-6 space-y-3">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p role="alert" className="text-sm text-muted-foreground"><BilingualText en={connectionsEn('requests_failed')} el={connectionsEl('requests_failed')} wrap /></p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}><BilingualText en="Try again" el="Δοκιμάστε ξανά" compact /></Button>
            </CardContent></Card>
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ConnectionSkeleton key={i} />)
          ) : connections.length === 0 ? (
            <EmptyState
              illustration="default"
              title={<BilingualText en={connectionsEn('no_requests_waiting')} el={connectionsEl('no_requests_waiting')} />}
              description={<BilingualText en={connectionsEn('no_intro_desc')} el={connectionsEl('no_intro_desc')} />}
              askAiPrompt={ASK.introsEmpty}
              action={
                <Button variant="secondary" className="gap-2" asChild>
                  <Link href="/discover">
                    <Compass className="icon-sm" />
                    <BilingualText en={connectionsEn('discover_people')} el={connectionsEl('discover_people')} />
                  </Link>
                </Button>
              }
            />
          ) : (
            connections.map((c) => (
              <IntroRequestCard
                key={c.id}
                connection={c}
                isPending={respondMutation.isPending}
                onAccept={() => respondMutation.mutate({ id: c.id, status: 'accepted', otherUserId: c.requesterId, acceptedUserInfo: { id: c.requester.id, displayName: c.requester.displayName, avatarUrl: c.requester.avatarUrl, role: c.requester.role, headline: c.requester?.headline ?? null } })}
                onDecline={() => respondMutation.mutate({ id: c.id, status: 'declined' })}
              />
            ))
          )}
        </TabsContent>

        {/* Standard tabs */}
        {(['sent', 'accepted'] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-6 space-y-3">
            {isError && tab === t ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p role="alert" className="text-sm text-muted-foreground"><BilingualText en={t === 'sent' ? connectionsEn('requests_failed') : connectionsEn('connections_failed')} el={t === 'sent' ? connectionsEl('requests_failed') : connectionsEl('connections_failed')} wrap /></p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}><BilingualText en="Try again" el="Δοκιμάστε ξανά" compact /></Button>
              </CardContent></Card>
            ) : isLoading && tab === t ? (
              Array.from({ length: 3 }).map((_, i) => <ConnectionSkeleton key={i} />)
            ) : connections.length === 0 ? (
              <EmptyState
                illustration={t === 'accepted' ? 'connection' : 'default'}
                title={
                  <BilingualText
                    en={t === 'sent' ? connectionsEn('no_sent_requests') : connectionsEn('no_connections_yet')}
                    el={t === 'sent' ? connectionsEl('no_sent_requests') : connectionsEl('no_connections_yet')}
                  />
                }
                askAiPrompt={ASK.connectionsEmpty}
                action={
                  <Button variant="secondary" className="gap-2" asChild>
                    <Link href="/discover">
                      <Compass className="icon-sm" />
                      <BilingualText en={connectionsEn('discover_people')} el={connectionsEl('discover_people')} />
                    </Link>
                  </Button>
                }
              />
            ) : (
              connections.map((c) => {
                const otherUser = c.requesterId === viewerId
                  ? { id: c.receiverId, displayName: c.receiver?.displayName ?? '', avatarUrl: c.receiver?.avatarUrl ?? null, role: c.receiver?.role, headline: c.receiver?.headline ?? null }
                  : { id: c.requesterId, displayName: c.requester?.displayName ?? '', avatarUrl: c.requester?.avatarUrl ?? null, role: c.requester?.role, headline: c.requester?.headline ?? null };
                return (
                  <div key={c.id} className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <ConnectionCard
                      connection={c}
                      viewerId={viewerId}
                      isPending={respondMutation.isPending}
                      onAccept={() => {
                        const uid = c.requesterId === viewerId ? c.receiverId : c.requesterId;
                        respondMutation.mutate({ id: c.id, status: 'accepted', otherUserId: uid, acceptedUserInfo: otherUser });
                      }}
                      onDecline={() => respondMutation.mutate({ id: c.id, status: 'declined' })}
                      onMessage={() => handleMessage(otherUser.id)}
                    />
                    {t === 'accepted' && c.status === 'accepted' && (
                      <CollaborationStarter otherUser={otherUser} mode="inline" />
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
      <PeopleYouMayKnow excludeIds={knownIds} />
      </div>
    </AppShell>
    </>
  );
}
