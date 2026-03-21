'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, Users, Sparkles, Bell, Calendar, MessageCircle,
  UserPlus, Award, Briefcase, RefreshCw, CheckCheck, ExternalLink,
  Flag, Star, Gift,
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardActivity, listNotifications, markAllNotificationsRead, type DashboardActivityItem, type NotificationItem } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const NOTIF_ICONS: Record<string, React.ElementType> = {
  connection: UserPlus,
  message: MessageCircle,
  event: Calendar,
  match: TrendingUp,
  achievement: Award,
  job: Briefcase,
  system: Bell,
  milestone: Flag,
  endorsement: Star,
  invite: Gift,
};

function formatTimeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ItemSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 px-4 py-4 last:border-0">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function NetworkActivityRow({ item }: { item: DashboardActivityItem }) {
  const isConnection = item.type === 'connection';
  return (
    <div className="flex items-start gap-3 border-b border-border/40 px-4 py-4 last:border-0 hover:bg-muted/20 transition-colors">
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        isConnection ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary',
      )}>
        {isConnection ? <Users className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{item.title}</p>
        {item.author && <p className="text-xs text-muted-foreground mt-0.5">by {item.author}</p>}
        <p className="mt-1 text-[11px] text-muted-foreground">{item.timeAgo}</p>
      </div>
      {item.href && (
        <Link href={item.href} className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1">
          View <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const Icon = NOTIF_ICONS[item.type] ?? Bell;
  const isUnread = !item.readAt;
  return (
    <div className={cn(
      'flex items-start gap-3 border-b border-border/40 px-4 py-4 last:border-0 hover:bg-muted/20 transition-colors',
      isUnread && 'bg-primary/[0.03]',
    )}>
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {isUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', isUnread ? 'font-medium text-foreground' : 'text-foreground/80')}>
          {item.title}
        </p>
        {item.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.body}</p>}
        <p className="mt-1 text-[11px] text-muted-foreground">{formatTimeAgo(item.createdAt)}</p>
      </div>
      {item.link && (
        <Link href={item.link} className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1">
          View <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'network' | 'notifications' | 'events'>('network');

  const { data: activityData, isLoading: activityLoading, isError: activityError, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboard-activity', 30],
    queryFn: () => getDashboardActivity({ limit: 30 }),
    staleTime: 30_000,
  });

  const { data: notifData, isLoading: notifLoading, isError: notifError, refetch: refetchNotif } = useQuery({
    queryKey: ['notifications-activity'],
    queryFn: () => listNotifications({ limit: 50 }),
    staleTime: 30_000,
    enabled: activeTab === 'notifications',
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-activity'] }),
  });

  const activityItems = activityData ?? [];
  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const eventItems = activityItems.filter((i) => i.type === 'event');

  const isLoading = activeTab === 'notifications' ? notifLoading : activityLoading;
  const refetch = activeTab === 'notifications' ? refetchNotif : refetchActivity;

  return (
    <AppShell
      title="Activity"
      description="Network activity, notifications, and upcoming events"
    >
      <div className="mx-auto max-w-2xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <TabsList className="h-9">
              <TabsTrigger value="network" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Network
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs">
                <Bell className="h-3.5 w-3.5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-1 h-4 min-w-[1rem] px-1 text-[10px]">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" /> Events
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {activeTab === 'notifications' && unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Network activity */}
          <TabsContent value="network" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              {activityError ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <p className="text-sm text-muted-foreground">Failed to load activity.</p>
                  <Button variant="secondary" size="sm" onClick={() => refetchActivity()}>Retry</Button>
                </div>
              ) : activityLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ItemSkeleton key={i} />)
              ) : activityItems.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No network activity yet</p>
                  <p className="text-xs text-muted-foreground">Connect with people to see updates here.</p>
                  <Link href="/discover">
                    <Button variant="outline" size="sm">Discover people</Button>
                  </Link>
                </div>
              ) : (
                activityItems.map((item) => <NetworkActivityRow key={item.id} item={item} />)
              )}
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              {notifError ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <p className="text-sm text-muted-foreground">Failed to load notifications.</p>
                  <Button variant="secondary" size="sm" onClick={() => refetchNotif()}>Retry</Button>
                </div>
              ) : notifLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ItemSkeleton key={i} />)
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground">No notifications right now.</p>
                </div>
              ) : (
                notifications.map((n) => <NotificationRow key={n.id} item={n} />)
              )}
            </div>
            {notifications.length > 0 && (
              <div className="mt-3 text-center">
                <Link href="/notifications" className="text-xs text-primary hover:underline">
                  View all notifications →
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Events */}
          <TabsContent value="events" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              {activityLoading ? (
                Array.from({ length: 3 }).map((_, i) => <ItemSkeleton key={i} />)
              ) : eventItems.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No upcoming events</p>
                  <Link href="/events">
                    <Button variant="outline" size="sm">Browse events</Button>
                  </Link>
                </div>
              ) : (
                eventItems.map((item) => <NetworkActivityRow key={item.id} item={item} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
