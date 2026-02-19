'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from '@/lib/utils';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  return `${days}d`;
}

export function NotificationsBell({ className }: { className?: string }) {
  const router = useRouter();
  const { error: showError } = useToast();

  const hasToken = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  }, []);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const unread = items.filter((n) => !n.readAt).length;

  const load = async () => {
    if (!hasToken) return;
    setLoading(true);
    try {
      const res = await listNotifications({ limit: 10 });
      setItems(res.notifications);
    } catch (e) {
      showError('Failed to load notifications', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasToken) return;
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  if (!hasToken) return null;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void load();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-sm font-medium text-foreground">Notifications</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2"
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
            <CheckCheck className="h-4 w-4" />
            Mark all
          </Button>
        </div>
        <DropdownMenuSeparator />

        {items.length === 0 && (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">
            {loading ? 'Loading…' : 'No notifications yet.'}
          </div>
        )}

        {items.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className={cn('flex flex-col items-start gap-1 px-3 py-2', !n.readAt && 'bg-primary/5')}
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
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground line-clamp-1">{n.title}</span>
              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                {timeAgo(n.createdAt)}
              </Badge>
            </div>
            {n.body && <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

