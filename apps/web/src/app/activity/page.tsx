'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, Users, Sparkles, Bell, Calendar, MessageCircle,
  UserPlus, Award, Briefcase, RefreshCw, CheckCheck, ExternalLink,
  Flag, Star, Gift, Activity, Filter, Zap, Clock, ArrowRight,
  UserCheck, Target, BarChart3, CheckCircle2, X,
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardActivity, listNotifications, markAllNotificationsRead, type DashboardActivityItem, type NotificationItem, type DashboardActivityPage } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── Type config ─────────────────────────────────────────────────────────────

type ActivityType = 'all' | 'connection' | 'message' | 'match' | 'milestone' | 'achievement' | 'system' | 'event' | 'endorsement';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  connection:  { icon: UserCheck,     color: 'text-status-success', bg: 'bg-status-success-bg', label: 'Connections' },
  message:     { icon: MessageCircle, color: 'text-status-info',    bg: 'bg-status-info-bg',    label: 'Messages'    },
  match:       { icon: TrendingUp,    color: 'text-status-accent',  bg: 'bg-status-accent-bg',  label: 'Matches'     },
  milestone:   { icon: Flag,          color: 'text-status-warning',   bg: 'bg-status-warning-bg',   label: 'Milestones'  },
  achievement: { icon: Award,         color: 'text-status-warning',  bg: 'bg-status-warning-bg',  label: 'Achievements'},
  event:       { icon: Calendar,      color: 'text-status-accent',    bg: 'bg-status-accent-bg',    label: 'Events'      },
  endorsement: { icon: Star,          color: 'text-status-warning',  bg: 'bg-status-warning-bg',  label: 'Endorsements'},
  job:         { icon: Briefcase,     color: 'text-status-success',    bg: 'bg-status-success-bg',    label: 'Jobs'        },
  system:      { icon: Bell,          color: 'text-muted-foreground', bg: 'bg-muted',     label: 'System'      },
  invite:      { icon: Gift,          color: 'text-status-accent',  bg: 'bg-status-accent-bg',  label: 'Invites'     },
};

const NOTIF_ICONS: Record<string, React.ElementType> = Object.fromEntries(
  Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.icon])
);

const FEED_TYPE_FILTERS: { value: ActivityType; label: string; icon: React.ElementType }[] = [
  { value: 'all',         label: 'All',          icon: Sparkles  },
  { value: 'connection',  label: 'Connections',  icon: UserCheck },
  { value: 'match',       label: 'Matches',      icon: TrendingUp},
  { value: 'message',     label: 'Messages',     icon: MessageCircle },
  { value: 'milestone',   label: 'Milestones',   icon: Flag      },
  { value: 'achievement', label: 'Achievements', icon: Award     },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short', day: 'numeric' });
}

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Earlier';
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

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

// ── Network row ───────────────────────────────────────────────────────────────

function NetworkActivityRow({ item }: { item: DashboardActivityItem }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG['system'];
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 border-b border-border/40 px-4 py-3.5 last:border-0 hover:bg-muted/20 transition-colors group">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', cfg.bg, cfg.color)}>
        <Icon className="icon-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{item.title}</p>
        {item.author && <p className="text-xs text-muted-foreground mt-0.5">by {item.author}</p>}
        <div className="mt-1 flex items-center gap-2">
          <Clock className="icon-sm text-muted-foreground/60" />
          <span className="text-2xs text-muted-foreground">{item.timeAgo}</span>
          <Badge variant="outline" className="h-4 px-1.5 text-2xs capitalize">{item.type}</Badge>
        </div>
      </div>
      {item.href && (
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href={item.href} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="icon-sm" />
          </Link>
        </Button>
      )}
    </div>
  );
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({ item }: { item: NotificationItem }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG['system'];
  const Icon = cfg.icon;
  const isUnread = !item.readAt;
  return (
    <div className={cn(
      'flex items-start gap-3 border-b border-border/40 px-4 py-3.5 last:border-0 hover:bg-muted/20 transition-colors group',
      isUnread && 'bg-primary/[0.03]',
    )}>
      <div className="relative shrink-0">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', cfg.bg, cfg.color)}>
          <Icon className="icon-sm" />
        </div>
        {isUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', isUnread ? 'font-medium text-foreground' : 'text-foreground/80')}>
          {item.title}
        </p>
        {item.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.body}</p>}
        <div className="mt-1 flex items-center gap-2">
          <Clock className="icon-sm text-muted-foreground/60" />
          <span className="text-2xs text-muted-foreground">{formatTimeAgo(item.createdAt)}</span>
          {isUnread && <Badge className="h-4 px-1.5 text-2xs">New</Badge>}
        </div>
      </div>
      {item.link && (
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href={item.link} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="icon-sm" />
          </Link>
        </Button>
      )}
    </div>
  );
}

// ── Date group header ─────────────────────────────────────────────────────────

function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-2">
      <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function ActivityPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'network' | 'notifications' | 'events'>('network');
  const [typeFilter, setTypeFilter] = useState<ActivityType>('all');
  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<DashboardActivityItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: activityData, isLoading: activityLoading, isError: activityError, refetch: refetchActivity } = useQuery<DashboardActivityPage>({
    queryKey: ['dashboard-activity', PAGE_SIZE],
    queryFn: () => getDashboardActivity({ limit: PAGE_SIZE, offset: 0 }),
    staleTime: 30_000,
  });

  // Sync initial query data into accumulated items state
  useEffect(() => {
    if (activityData) {
      setAllItems(activityData.items);
      setHasMore(activityData.hasMore);
      setOffset(activityData.items.length);
    }
  }, [activityData]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const more = await getDashboardActivity({ limit: PAGE_SIZE, offset });
      setAllItems((prev) => [...prev, ...more.items]);
      setHasMore(more.hasMore);
      setOffset((prev) => prev + more.items.length);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  };

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

  const activityItems = allItems;
  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const eventItems = activityItems.filter((i) => i.type === 'event');

  const filteredActivity = useMemo(() => {
    if (typeFilter === 'all') return activityItems;
    return activityItems.filter((i) => i.type === typeFilter);
  }, [activityItems, typeFilter]);

  // Group items by date
  const groupedActivity = useMemo(() => {
    const groups: Record<string, DashboardActivityItem[]> = {};
    filteredActivity.forEach((item) => {
      const group = getDateGroup(item.timeAgo ?? new Date().toISOString());
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filteredActivity]);

  // Stats summary
  const todayCount = activityItems.filter((i) => i.timeAgo && (i.timeAgo.includes('m ago') || i.timeAgo.includes('h ago') || i.timeAgo === 'just now')).length;
  const connectionCount = activityItems.filter((i) => i.type === 'connection').length;
  const matchCount = activityItems.filter((i) => i.type === 'match').length;

  const isLoading = activeTab === 'notifications' ? notifLoading : activityLoading;
  const refetch = activeTab === 'notifications' ? refetchNotif : refetchActivity;

  return (
    <AppShell title="Activity Feed" description="Track your network activity, notifications, and events">
      <div className="space-y-5">

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today's Activity", value: todayCount, icon: Zap, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
            { label: 'Unread Notifications', value: unreadCount, icon: Bell, color: 'text-status-info', bg: 'bg-status-info-bg' },
            { label: 'New Connections', value: connectionCount, icon: UserCheck, color: 'text-status-success', bg: 'bg-status-success-bg' },
            { label: 'New Matches', value: matchCount, icon: TrendingUp, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', stat.bg, stat.color)}>
                    <Icon className="icon-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                    <p className="mt-0.5 text-2xs text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:hidden">
          {[
            { href: '/discover', label: 'Explore People', icon: Users },
            { href: '/matches', label: 'View Matches', icon: TrendingUp },
            { href: '/events', label: 'Browse Events', icon: Calendar },
            { href: '/achievements', label: 'Achievements', icon: Award },
          ].map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
                  <ActionIcon className="icon-sm shrink-0 text-primary-accessible" />
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
          {/* Main feed */}
          <div>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setTypeFilter('all'); }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <TabsList className="h-9">
                  <TabsTrigger value="network" className="gap-1.5 text-xs">
                    <Sparkles className="icon-sm" /> Network
                    {activityItems.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 min-w-[1rem] px-1 text-2xs">{activityItems.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-1.5 text-xs">
                    <Bell className="icon-sm" /> Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-1 h-4 min-w-[1rem] px-1 text-2xs">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="events" className="gap-1.5 text-xs">
                    <Calendar className="icon-sm" /> Events
                    {eventItems.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 min-w-[1rem] px-1 text-2xs">{eventItems.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  {activeTab === 'notifications' && unreadCount > 0 && (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                      onClick={() => markAll.mutate()} disabled={markAll.isPending}>
                      <CheckCheck className="icon-sm" /> Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
                    <RefreshCw className={cn('icon-sm', isLoading && 'animate-spin')} />
                  </Button>
                </div>
              </div>

              {/* Network tab with type filters */}
              <TabsContent value="network" className="mt-0 space-y-3">
                {/* Type filter chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Filter className="icon-sm text-muted-foreground shrink-0" />
                  {FEED_TYPE_FILTERS.map((f) => {
                    const FIcon = f.icon;
                    const isActive = typeFilter === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setTypeFilter(f.value)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        )}
                      >
                        <FIcon className="icon-sm" />
                        {f.label}
                        {f.value !== 'all' && (
                          <span className={cn('ml-0.5 rounded-full px-1 text-2xs', isActive ? 'bg-white/20' : 'bg-muted')}>
                            {activityItems.filter((i) => i.type === f.value).length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {typeFilter !== 'all' && (
                    <button onClick={() => setTypeFilter('all')} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <X className="icon-sm" /> Clear
                    </button>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                  {activityError ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <p className="text-sm text-muted-foreground">Failed to load activity.</p>
                      <Button variant="secondary" size="sm" onClick={() => refetchActivity()}>Retry</Button>
                    </div>
                  ) : activityLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <ItemSkeleton key={i} />)
                  ) : filteredActivity.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Activity className="icon-md text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {typeFilter === 'all' ? 'No network activity yet' : `No ${typeFilter} activity`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {typeFilter === 'all' ? 'Connect with people to see updates here.' : 'Try a different filter.'}
                      </p>
                      {typeFilter === 'all' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/discover">Discover people</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupedActivity).map(([group, items]) => (
                        <div key={group}>
                          <DateGroupHeader label={group} />
                          {items.map((item) => <NetworkActivityRow key={item.id} item={item} />)}
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {hasMore && typeFilter === 'all' && !activityLoading && !activityError && (
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <RefreshCw className="icon-sm animate-spin" />
                      ) : (
                        <ArrowRight className="icon-sm" />
                      )}
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="mt-0">
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                  {notifError ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <p className="text-sm text-muted-foreground">Failed to load notifications.</p>
                      <Button variant="secondary" size="sm" onClick={() => refetchNotif()}>Retry</Button>
                    </div>
                  ) : notifLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <ItemSkeleton key={i} />)
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <CheckCircle2 className="icon-md text-status-success" />
                      </div>
                      <p className="text-sm font-medium text-foreground">All caught up!</p>
                      <p className="text-xs text-muted-foreground">No notifications right now.</p>
                    </div>
                  ) : (
                    notifications.map((n) => <NotificationRow key={n.id} item={n} />)
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="mt-3 flex items-center justify-between px-1">
                    <p className="text-xs text-muted-foreground">{unreadCount} unread of {notifications.length} total</p>
                    <Link href="/notifications" className="text-xs text-primary-accessible hover:underline flex items-center gap-1">
                      View all <ArrowRight className="icon-sm" />
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
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Calendar className="icon-md text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No upcoming events</p>
                      <p className="text-xs text-muted-foreground">Browse and join events in your ecosystem.</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/events">Browse events</Link>
                      </Button>
                    </div>
                  ) : (
                    eventItems.map((item) => <NetworkActivityRow key={item.id} item={item} />)
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4">
            {/* Quick actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 pb-4">
                {[
                  { href: '/discover', label: 'Explore People', icon: Users, color: 'text-status-accent' },
                  { href: '/matches', label: 'View Matches', icon: TrendingUp, color: 'text-status-success' },
                  { href: '/events', label: 'Browse Events', icon: Calendar, color: 'text-status-accent' },
                  { href: '/achievements', label: 'Achievements', icon: Award, color: 'text-status-warning' },
                ].map((a) => {
                  const AIcon = a.icon;
                  return (
                    <Link key={a.href} href={a.href}>
                      <div className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                        <AIcon className={cn('icon-sm shrink-0', a.color)} />
                        <span className="text-sm text-foreground/80">{a.label}</span>
                        <ArrowRight className="ml-auto icon-sm text-muted-foreground/50" />
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Activity breakdown */}
            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm">Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2.5">
                {Object.entries(TYPE_CONFIG).slice(0, 6).map(([type, cfg]) => {
                  const count = activityItems.filter((i) => i.type === type).length;
                  const Icon = cfg.icon;
                  return (
                    <div key={type} className="flex items-center gap-2.5">
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', cfg.bg, cfg.color)}>
                        <Icon className="icon-sm" />
                      </div>
                      <span className="flex-1 text-xs text-muted-foreground capitalize">{type}</span>
                      <span className="text-xs font-semibold text-foreground">{count}</span>
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', cfg.color.replace('text-', 'bg-'))}
                          style={{ width: `${activityItems.length > 0 ? (count / activityItems.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Streak / engagement */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-violet-500/5">
              <CardContent className="p-4 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="icon-md text-primary-accessible" />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">Stay Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Connect, engage, and grow your network daily.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full h-8 text-xs gap-1.5" asChild>
                  <Link href="/analytics">
                    <Target className="icon-sm" /> View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
