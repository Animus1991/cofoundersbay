'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useHasSession } from '@/hooks/useSession';
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
  const hasSession = useHasSession();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadedAt = useRef(0);
  const MIN_RELOAD_MS = 30_000; // minimum 30 s between background reloads

  const unread = items.filter((notification) => !notification.readAt).length;

  const load = async (force = false) => {
    if (loadingRef.current) return;
    const now = Date.now();
    if (!force && now - lastLoadedAt.current < MIN_RELOAD_MS) return;

    if (!hasSession) {
      setItems([]);
      setHasNew(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await listNotifications({ limit: 15 });
      lastLoadedAt.current = Date.now();
      setItems(result.notifications);
    } catch {
      // Silent background failure; the menu itself remains usable.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSession) {
      setItems([]);
      setHasNew(false);
      return;
    }

    void load(true); // force on initial mount / session change

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void load(); // rate-limited
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    window.addEventListener('cfb:api-online', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      window.removeEventListener('cfb:api-online', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  if (!hasSession) return null;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          void load(true); // always fetch fresh when user opens the panel
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

      <DropdownMenuContent align="end" className="flex max-h-[520px] w-[380px] flex-col overflow-hidden p-0">
        <div className="flex flex-shrink-0 items-center justify-between px-4 py-3">
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
                setItems((prev) => prev.map((notification) => ({
                  ...notification,
                  readAt: notification.readAt ?? new Date().toISOString(),
                })));
              } catch (error) {
                showError('Failed to mark read', error instanceof Error ? error.message : 'Please try again');
              }
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : "You're all caught up!"}
              </p>
            </div>
          )}

          {items.map((notification) => (
            <button
              key={notification.id}
              className={cn(
                'flex w-full items-start gap-3 border-b border-border/30 px-4 py-3 text-left transition-colors hover:bg-secondary/50 last:border-0',
                !notification.readAt && 'bg-primary/5',
              )}
              onClick={async () => {
                try {
                  if (!notification.readAt) {
                    await markNotificationRead(notification.id);
                    setItems((prev) =>
                      prev.map((item) => (
                        item.id === notification.id
                          ? { ...item, readAt: new Date().toISOString() }
                          : item
                      )),
                    );
                  }
                } catch {
                  // Ignore best-effort read receipts here.
                }

                if (notification.link) {
                  router.push(notification.link);
                }
              }}
            >
              <NotifIcon type={notification.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      'text-xs leading-snug',
                      !notification.readAt ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
                    )}
                  >
                    {notification.title}
                  </p>
                  <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                {notification.body && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                )}
              </div>
              {!notification.readAt && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="flex-shrink-0 px-4 py-2.5">
              <button
                className="w-full text-center text-xs text-primary hover:underline"
                onClick={() => router.push('/notifications')}
              >
                View all notifications
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
