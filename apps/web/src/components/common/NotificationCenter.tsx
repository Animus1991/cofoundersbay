'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  MessageCircle,
  UserPlus,
  Heart,
  Calendar,
  Star,
  Trash2,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type NotificationType = 'message' | 'connection' | 'match' | 'event' | 'system';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  timestamp: Date;
  href?: string;
  actor?: {
    name: string;
    avatarUrl?: string | null;
  };
};

type NotificationCenterProps = {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
};

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  message: MessageCircle,
  connection: UserPlus,
  match: Heart,
  event: Calendar,
  system: Star,
};

const notificationColors: Record<NotificationType, string> = {
  message: 'text-blue-400 bg-blue-400/10',
  connection: 'text-emerald-400 bg-emerald-400/10',
  match: 'text-pink-400 bg-pink-400/10',
  event: 'text-purple-400 bg-purple-400/10',
  system: 'text-amber-400 bg-amber-400/10',
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}) {
  const Icon = notificationIcons[notification.type];
  const colorClass = notificationColors[notification.type];

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.read ? 'bg-transparent' : 'bg-primary/5',
        'hover:bg-secondary/60'
      )}
    >
      {notification.actor ? (
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={notification.actor.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {notification.actor.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className={cn(
            'h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center',
            colorClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatTimestamp(notification.timestamp)}
        </p>
      </div>
    </div>
  );

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={onMarkAsRead}>
        {content}
      </Link>
    );
  }

  return <div onClick={onMarkAsRead}>{content}</div>;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Notifications" variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[480px] overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/60">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onMarkAllAsRead?.()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <div className="max-h-[360px] overflow-y-auto">
          {hasNotifications ? (
            notifications.slice(0, 20).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => onMarkAsRead?.(notification.id)}
                onDelete={() => onDelete?.(notification.id)}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {hasNotifications && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="w-full justify-center">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Notification badge for nav items
export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] font-bold"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
