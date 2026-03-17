'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCheck, MessageCircle, UserPlus, Star, Calendar,
  Briefcase, Users, Zap, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/api';
import { getNotificationSocket, disconnectNotificationSocket } from '@/lib/notificationSocket';
import { cn, formatRelativeTime } from '@/lib/utils';

const TYPE_ICON: Record<string, React.ElementType> = {
  message: MessageCircle,
  connection_request: UserPlus,
  connection_accepted: UserPlus,
  match: Star,
  event: Calendar,
  job: Briefcase,
  group: Users,
  mention: Zap,
};

const TYPE_COLOR: Record<string, string> = {
  message: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  connection_request: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  connection_accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  match: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  event: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  job: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  group: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  mention: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
};

function NotifIcon({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] ?? Info;
  const color = TYPE_COLOR[type] ?? 'bg-secondary text-muted-foreground';
  return (
    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', color)}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}

export function NotificationsBell({ className }: { className?: string }) {
  const router = useRouter();
  const { error: showError } = useToast();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const socketConnectedRef = useRef(false);

  // Client-only: load accessToken after mount to avoid hydration mismatch
  useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'));
  }, []);

  const unread = items.filter((n) => !n.readAt).length;

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listNotifications({ limit: 15 });
      setItems(res.notifications);
    } catch {
      // silently fail on background polls
    } finally {
      setLoading(false);
    }
  };

  // Initial load + polling fallback every 60s
  useEffect(() => {
    if (!accessToken) return;
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Real-time socket for instant notification push
  useEffect(() => {
    if (!accessToken || socketConnectedRef.current) return;
    socketConnectedRef.current = true;
    try {
      const sock = getNotificationSocket(accessToken);
      sock.on('notification:new', (payload) => {
        setItems((prev) => {
          if (prev.some((x) => x.id === payload.id)) return prev;
          return [payload as NotificationItem, ...prev].slice(0, 20);
        });
        setHasNew(true);
      });
    } catch {
      // socket namespace may not exist yet — polling covers it
    }
    return () => {
      disconnectNotificationSocket();
      socketConnectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!accessToken) return null;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          void load();
          setHasNew(false);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        >
          <Bell className={cn('h-5 w-5', hasNew && 'animate-pulse')} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0 max-h-[520px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div>
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {unread} new
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={unread === 0 || loading}
            onClick={async () => {
              try {
                await markAllNotificationsRead();
                setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
              } catch (e) {
                showError('Failed to mark read', e instanceof Error ? e.message : 'Please try again');
              }
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator className="my-0" />

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading…' : "You're all caught up!"}
              </p>
            </div>
          )}

          {items.map((n) => (
            <button
              key={n.id}
              className={cn(
                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 border-b border-border/30 last:border-0',
                !n.readAt && 'bg-primary/5',
              )}
              onClick={async () => {
                try {
                  if (!n.readAt) {
                    await markNotificationRead(n.id);
                    setItems((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
                    );
                  }
                } catch {
                  // ignore
                }
                if (n.link) router.push(n.link);
              }}
            >
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    'text-xs leading-snug',
                    !n.readAt ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
                  )}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                {n.body && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                )}
              </div>
              {!n.readAt && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="px-4 py-2.5 flex-shrink-0">
              <button
                className="w-full text-center text-xs text-primary hover:underline"
                onClick={() => router.push('/notifications')}
              >
                View all notifications →
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

