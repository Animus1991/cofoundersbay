'use client';

import { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter,
  MessageCircle, UserPlus, Calendar, TrendingUp, Award,
  Briefcase, Users, RefreshCw, ExternalLink,
  Settings, Square, SquareCheck,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { notificationsEn, notificationsEl } from '@/lib/i18n/strings-notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from '@/lib/api';

const TYPE_ICONS: Record<string, React.ElementType> = {
  connection: UserPlus,
  message: MessageCircle,
  event: Calendar,
  match: TrendingUp,
  achievement: Award,
  job: Briefcase,
  community: Users,
  system: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  connection: 'bg-status-info-bg text-status-info',
  message: 'bg-primary/10 text-primary-accessible',
  event: 'bg-status-accent-bg text-status-accent',
  match: 'bg-status-success-bg text-status-success',
  achievement: 'bg-status-warning-bg text-status-warning',
  job: 'bg-status-warning-bg text-status-warning',
  community: 'bg-status-accent-bg text-status-accent',
  system: 'bg-muted text-muted-foreground',
};

const FILTER_TABS = [
  { value: 'all', labelEn: 'All', labelEl: 'Όλες' },
  { value: 'connection', labelEn: 'Connections', labelEl: 'Συνδέσεις' },
  { value: 'message', labelEn: 'Messages', labelEl: 'Μηνύματα' },
  { value: 'match', labelEn: 'Matches', labelEl: 'Αντιστοιχίσεις' },
  { value: 'event', labelEn: 'Events', labelEl: 'Εκδηλώσεις' },
  { value: 'achievement', labelEn: 'Achievements', labelEl: 'Επιτεύγματα' },
  { value: 'community', labelEn: 'Community', labelEl: 'Κοινότητα' },
  { value: 'system', labelEn: 'System', labelEl: 'Σύστημα' },
];

const TYPE_LABELS: Record<string, string> = {
  connection: 'Connection',
  message: 'Message',
  event: 'Event',
  match: 'Match',
  achievement: 'Achievement',
  job: 'Job',
  community: 'Community',
  system: 'System',
};

function groupByDate(notifications: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  const groups: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= todayStart) groups['Today'].push(n);
    else if (d >= yesterdayStart) groups['Yesterday'].push(n);
    else if (d >= weekStart) groups['This Week'].push(n);
    else groups['Older'].push(n);
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, items }));
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-border/50 px-4 py-4">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

const NotificationRow = memo(function NotificationRow({
  item,
  onRead,
  onDelete,
  selectable,
  selected,
  onSelect,
}: {
  item: NotificationItem;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const isUnread = !item.readAt;
  const Icon = TYPE_ICONS[item.type] ?? Bell;
  const colorClass = TYPE_COLORS[item.type] ?? TYPE_COLORS.system;
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30',
        'border-b border-border/40 last:border-0',
        isUnread && 'bg-primary/[0.03]',
        selected && 'bg-primary/5',
      )}
    >
      {selectable && (
        <button onClick={() => onSelect?.(item.id)} className="mt-1 shrink-0 text-muted-foreground hover:text-primary-accessible transition-colors">
          {selected ? <SquareCheck className="icon-sm text-primary-accessible" /> : <Square className="icon-sm" />}
        </button>
      )}

      {/* Icon */}
      <div className="relative mt-0.5 shrink-0">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', colorClass)}>
          <Icon className="icon-sm" />
        </div>
        {isUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* The title is the notification. On a 360px row it was sharing space
                with this badge and the timestamp and losing 57% of itself —
                "Elena Papadopoulos sent a connection reque…". Two lines on a phone,
                one from sm up. */}
            <p className={cn('text-sm leading-snug line-clamp-2 sm:truncate', isUnread ? 'font-medium text-foreground' : 'text-foreground/80')}>
              {item.title}
            </p>
            {/* Redundant on a phone: the coloured icon to the left already encodes
                the type. Shown again from sm, where there is room for both. */}
            <Badge variant="secondary" className="hidden sm:inline-flex text-2xs px-1.5 py-0 h-4 shrink-0 capitalize">
              {typeLabel}
            </Badge>
          </div>
          <span className="shrink-0 text-2xs text-muted-foreground">{formatTimeAgo(item.createdAt)}</span>
        </div>
        {item.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.body}</p>
        )}
        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.link && (
            <Link
              href={item.link}
              onClick={() => onRead(item.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-accessible hover:underline"
            >
              <BilingualText en="View" el="Προβολή" compact /> <ExternalLink className="icon-sm" />
            </Link>
          )}
          {isUnread && (
            <button
              onClick={() => onRead(item.id)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="icon-sm" /> <BilingualText en="Mark read" el="Αναγνωσμένη" compact />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive-accessible transition-colors"
          >
            <Trash2 className="icon-sm" /> <BilingualText en="Delete" el="Διαγραφή" compact />
          </button>
        </div>
      </div>
    </div>
  );
});

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queryKey = ['notifications', activeTab, showUnreadOnly];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      listNotifications({
        limit: 50,
        type: activeTab !== 'all' ? activeTab : undefined,
        unread: showUnreadOnly || undefined,
      }),
    staleTime: 30_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      qc.setQueryData(queryKey, (old: typeof data) => ({
        ...old,
        notifications: (old?.notifications ?? []).map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });
      qc.setQueryData(queryKey, (old: typeof data) => ({
        ...old,
        notifications: (old?.notifications ?? []).map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteN = useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      qc.setQueryData(queryKey, (old: typeof data) => ({
        ...old,
        notifications: (old?.notifications ?? []).filter((n) => n.id !== id),
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleRead = useCallback((id: string) => markRead.mutate(id), [markRead]);
  const handleDelete = useCallback((id: string) => deleteN.mutate(id), [deleteN]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkRead = useCallback(() => {
    selectedIds.forEach((id) => markRead.mutate(id));
    setSelectedIds(new Set());
  }, [selectedIds, markRead]);

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteN.mutate(id));
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, deleteN]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  // Per-category unread counts
  const catCounts = notifications.reduce<Record<string, number>>((acc, n) => {
    if (!n.readAt) acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {});

  const grouped = groupByDate(notifications);

  return (
    <AppShell
      title={notificationsEn('page_title')}
      description={notificationsEn('page_description')}
    >
      <div className="">
        {/* Stats bar */}
        {unreadCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              <BilingualText en={notificationsEn('unread_by_type')} el={notificationsEl('unread_by_type')} compact />
            </span>
            {Object.entries(catCounts).map(([type, count]) => {
              const Icon = TYPE_ICONS[type] ?? Bell;
              const color = TYPE_COLORS[type] ?? TYPE_COLORS.system;
              return (
                <button
                  key={type}
                  onClick={() => { setActiveTab(type); setShowUnreadOnly(true); }}
                  className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80', color)}
                >
                  <Icon className="icon-sm" />{count}
                </button>
              );
            })}
          </div>
        )}

        {/* Header actions */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds(new Set()); }}>
              <TabsList className="h-8 gap-0.5 flex-nowrap">
                {/* min-h-10 is the incoming branch's taller touch target; the
                    bilingual label is ours. */}
                {FILTER_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="min-h-10 shrink-0 px-3 text-xs">
                    <BilingualText en={t.labelEn} el={t.labelEl} compact />
                    {catCounts[t.value] ? (
                      <span className="ml-1 rounded-full bg-primary/20 px-1 text-2xs font-bold text-primary-accessible">
                        {catCounts[t.value]}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {bulkMode && selectedIds.size > 0 && (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleBulkRead}>
                  <Check className="icon-sm" /><BilingualText en={`Mark read (${selectedIds.size})`} el={`Αναγνωσμένες (${selectedIds.size})`} compact />
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-destructive-accessible hover:text-destructive-accessible" onClick={handleBulkDelete}>
                  <Trash2 className="icon-sm" /><BilingualText en={`Delete (${selectedIds.size})`} el={`Διαγραφή (${selectedIds.size})`} compact />
                </Button>
              </>
            )}
            {bulkMode && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={selectAll}>
                <BilingualText en={notificationsEn('select_all')} el={notificationsEl('select_all')} compact />
              </Button>
            )}
            <button
              onClick={() => { setBulkMode((v) => !v); setSelectedIds(new Set()); }}
              className={cn(
                // Their 44px tap target, our contrast-safe accent token.
                'inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                bulkMode ? 'border-primary/40 bg-primary/10 text-primary-accessible' : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground',
              )}
            >
              <SquareCheck className="icon-sm" />
              <BilingualText en={bulkMode ? notificationsEn('exit_select') : notificationsEn('select')} el={bulkMode ? notificationsEl('exit_select') : notificationsEl('select')} compact />
            </button>
            <button
              onClick={() => setShowUnreadOnly((v) => !v)}
              className={cn(
                // Their 44px tap target, our contrast-safe accent token.
                'inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                showUnreadOnly ? 'border-primary/40 bg-primary/10 text-primary-accessible' : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground',
              )}
            >
              <Filter className="icon-sm" />
              <BilingualText en={notificationsEn('unread')} el={notificationsEl('unread')} compact />
              {unreadCount > 0 && (
                <Badge className="h-4 min-w-[1rem] px-1 text-2xs" variant="default">{unreadCount}</Badge>
              )}
            </button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                <CheckCheck className="icon-sm" /><BilingualText en={notificationsEn('mark_all_read')} el={notificationsEl('mark_all_read')} compact />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} title="Refresh">
              <RefreshCw className={cn('icon-sm', isLoading && 'animate-spin')} />
            </Button>
            <Link href="/settings" title="Notification settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="icon-sm" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Notification list */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <BellOff className="icon-xl text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                <BilingualText en={notificationsEn('error_load')} el={notificationsEl('error_load')} />
              </p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 icon-sm" /> <BilingualText en={notificationsEn('retry')} el={notificationsEl('retry')} compact />
              </Button>
            </div>
          ) : isLoading ? (
            <>{Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)}</>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell className="icon-lg text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  <BilingualText
                    en={showUnreadOnly ? notificationsEn('empty_no_unread_title') : notificationsEn('empty_all_caught_up')}
                    el={showUnreadOnly ? notificationsEl('empty_no_unread_title') : notificationsEl('empty_all_caught_up')}
                  />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <BilingualText
                    en={showUnreadOnly ? notificationsEn('empty_no_unread_desc') : notificationsEn('empty_desc')}
                    el={showUnreadOnly ? notificationsEl('empty_no_unread_desc') : notificationsEl('empty_desc')}
                  />
                </p>
              </div>
              {/* Their wrapper and the caught-up Ask AI prompt (a real addition to
                  an otherwise dead-end empty state), with our bilingual label. */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {showUnreadOnly && (
                  <Button variant="outline" size="sm" onClick={() => setShowUnreadOnly(false)}>
                    <BilingualText en={notificationsEn('show_all_notifications')} el={notificationsEl('show_all_notifications')} compact />
                  </Button>
                )}
                <AIInsightButton
                  prompt="I am all caught up on notifications. What should I do next on Discover, Matches, or Messages?"
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          ) : (
            grouped.map(({ label, items }) => (
              <div key={label}>
                <div className="px-4 py-2 border-b border-border/40 bg-muted/30">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                </div>
                {items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onRead={handleRead}
                    onDelete={handleDelete}
                    selectable={bulkMode}
                    selected={selectedIds.has(item.id)}
                    onSelect={toggleSelect}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            {unreadCount > 0 && ` · ${unreadCount} unread`}
            {bulkMode && selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </p>
        )}
      </div>
    </AppShell>
  );
}
