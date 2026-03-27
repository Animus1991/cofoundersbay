'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  Clock,
  Send,
  MessageCircle,
  Check,
  X,
  UserPlus,
  Compass,
  Handshake,
  Quote,
  TrendingUp,
} from 'lucide-react';
import {
  listConnectionRequests,
  respondToConnectionRequest,
  getOrCreateDirectConversation,
  type ConnectionRequestItem,
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
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
import { CollaborationStarter, PostAcceptCollaborationModal } from '@/components/collaboration/CollaborationStarter';
import { cn } from '@/lib/utils';

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

  return (
    <Card className="card-interactive">
      <CardContent className="flex items-center gap-4 p-4">
        <Link href={`/profiles/${other.id}`}>
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={other.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {other.displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profiles/${other.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
              {other.displayName}
            </Link>
            <RoleBadge role={other.role} size="sm" />
          </div>
          {other.headline && (
            <p className="text-sm text-muted-foreground truncate">{other.headline}</p>
          )}
          {connection.message && !isAccepted && (
            <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
              &ldquo;{connection.message}&rdquo;
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAccepted ? (
            <Button variant="secondary" size="sm" className="gap-2" onClick={onMessage}>
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          ) : isReceiver && connection.status === 'pending' ? (
            <>
              <Button
                size="sm"
                className="gap-1"
                onClick={onAccept}
                disabled={isPending}
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground hover:text-destructive"
                onClick={onDecline}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          )}
        </div>
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
  return (
    <Card className="card-interactive border-primary/20 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Link href={`/profiles/${sender.id}`}>
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/30">
              <AvatarImage src={sender.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {sender.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/profiles/${sender.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {sender.displayName}
              </Link>
              <RoleBadge role={sender.role} size="sm" />
              <Badge variant="outline" className="ml-auto border-primary/40 text-primary text-xs gap-1">
                <Handshake className="h-3 w-3" />
                Intro request
              </Badge>
            </div>

            {sender.headline && (
              <p className="text-sm text-muted-foreground">{sender.headline}</p>
            )}

            {connection.message && (
              <div className="flex gap-2 rounded-xl bg-secondary/50 px-3 py-2.5">
                <Quote className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                <p className="text-sm text-foreground/80 italic">{connection.message}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" className="gap-1.5" onClick={onAccept} disabled={isPending}>
                <Check className="h-3.5 w-3.5" />
                Accept intro
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:text-destructive"
                onClick={onDecline}
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" />
                Decline
              </Button>
              <p className="ml-auto text-xs text-muted-foreground">
                {new Date(connection.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
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
  const [tab, setTab] = useState<'intros' | 'received' | 'sent' | 'accepted'>('intros');
  const [justAcceptedUser, setJustAcceptedUser] = useState<{
    id: string; displayName: string; avatarUrl?: string | null; role?: string; headline?: string | null;
  } | null>(null);

  const viewerId =
    typeof window !== 'undefined'
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('user') ?? 'null')?.id ?? null;
          } catch {
            return null;
          }
        })()
      : null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['connections', tab],
    queryFn: () =>
      listConnectionRequests({
        type: tab === 'intros' ? 'received' : tab,
      }),
    staleTime: 30_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status, otherUserId }: { id: string; status: 'accepted' | 'declined'; otherUserId?: string; acceptedUserInfo?: { id: string; displayName: string; avatarUrl?: string | null; role?: string; headline?: string | null } }) =>
      respondToConnectionRequest(id, status).then(() => otherUserId),
    onSuccess: (otherUserId, { status, acceptedUserInfo }) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      if (status === 'accepted' && otherUserId && acceptedUserInfo) {
        setJustAcceptedUser(acceptedUserInfo);
      } else if (status !== 'accepted') {
        success('Request declined', 'The request has been removed.');
      }
    },
    onError: (err) => {
      showError('Could not respond', err instanceof Error ? err.message : 'Please try again');
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
    tab === 'intros'
      ? allConnections.filter((c) => c.receiverId === viewerId && c.status === 'pending')
      : allConnections;

  const introCount = connections.filter(
    (c) => c.receiverId === viewerId && c.status === 'pending',
  ).length;

  return (
    <>
    {justAcceptedUser && (
      <PostAcceptCollaborationModal
        otherUser={justAcceptedUser}
        onDismiss={() => setJustAcceptedUser(null)}
      />
    )}
    <AppShell
      title="Connections"
      description="Manage your network and connection requests"
      actions={
        <Link href="/discover">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Find people
          </Button>
        </Link>
      }
    >
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Stats bar */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Connected', value: (data?.connections ?? []).filter((c) => c.status === 'accepted').length, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Intro Requests', value: introCount, icon: Handshake, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Sent Pending', value: (data?.connections ?? []).filter((c) => c.requesterId === viewerId && c.status === 'pending').length, icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Interactions', value: (data?.connections ?? []).length, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((s) => {
            const SIcon = s.icon;
            return (
              <Card key={s.label} className="shadow-sm border-border/50">
                <CardContent className="flex items-center gap-2.5 p-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                    <SIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="intros" className="gap-2">
            <Handshake className="h-4 w-4" />
            Intro Requests
            {introCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {introCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Received
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-2">
            <Users className="h-4 w-4" />
            Connected
          </TabsTrigger>
        </TabsList>

        {/* Intro Requests tab */}
        <TabsContent value="intros" className="mt-6 space-y-3">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">Failed to load requests.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardContent></Card>
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ConnectionSkeleton key={i} />)
          ) : connections.length === 0 ? (
            <EmptyState
              illustration="default"
              title="No intro requests"
              description="When someone sends you a connection request with a message, it appears here."
              action={
                <Link href="/discover">
                  <Button variant="secondary" className="gap-2">
                    <Compass className="h-4 w-4" />
                    Discover people
                  </Button>
                </Link>
              }
            />
          ) : (
            connections.map((c) => (
              <IntroRequestCard
                key={c.id}
                connection={c}
                isPending={respondMutation.isPending}
                onAccept={() => respondMutation.mutate({ id: c.id, status: 'accepted', otherUserId: c.requesterId, acceptedUserInfo: { id: c.requester.id, displayName: c.requester.displayName, avatarUrl: c.requester.avatarUrl, role: c.requester.role, headline: c.requester.headline ?? null } })}
                onDecline={() => respondMutation.mutate({ id: c.id, status: 'declined' })}
              />
            ))
          )}
        </TabsContent>

        {/* Standard tabs */}
        {(['received', 'sent', 'accepted'] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-6 space-y-3">
            {isError && tab === t ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Failed to load connections.</p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
              </CardContent></Card>
            ) : isLoading && tab === t ? (
              Array.from({ length: 3 }).map((_, i) => <ConnectionSkeleton key={i} />)
            ) : connections.length === 0 ? (
              <EmptyState
                illustration={t === 'accepted' ? 'connection' : 'default'}
                title={
                  t === 'received'
                    ? 'No pending requests'
                    : t === 'sent'
                      ? 'No sent requests'
                      : 'No connections yet'
                }
                description={
                  t === 'accepted'
                    ? 'Start connecting with founders, mentors, and investors.'
                    : t === 'sent'
                      ? 'Browse profiles and send connection requests.'
                      : 'When people send you requests, they appear here.'
                }
                action={
                  t !== 'received' ? (
                    <Link href="/discover">
                      <Button variant="secondary" className="gap-2">
                        <Compass className="h-4 w-4" />
                        Discover people
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              connections.map((c) => {
                const otherUser = c.requesterId === viewerId
                  ? { id: c.receiverId, displayName: c.receiver?.displayName ?? '', avatarUrl: c.receiver?.avatarUrl ?? null, role: c.receiver?.role, headline: c.receiver?.headline ?? null }
                  : { id: c.requesterId, displayName: c.requester?.displayName ?? '', avatarUrl: c.requester?.avatarUrl ?? null, role: c.requester?.role, headline: c.requester?.headline ?? null };
                return (
                  <div key={c.id} className="rounded-xl overflow-hidden border border-border/60 shadow-sm">
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
      </div>
    </AppShell>
    </>
  );
}
