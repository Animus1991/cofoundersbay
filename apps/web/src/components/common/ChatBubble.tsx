'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { cn } from '@/lib/utils';

/**
 * Floating chat bubble shown on all pages except /messages.
 * Clicking it navigates to the messages page.
 */
export function ChatBubble() {
  const pathname = usePathname();
  const { messages: unreadMessages } = useUnreadCounts();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show on messages page or auth pages
  const hidden =
    !mounted ||
    dismissed ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/forgot-password');

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Unread badge tooltip */}
      {unreadMessages > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-full bg-card border border-border/60 px-3 py-1 shadow-md">
          <span className="text-xs font-medium text-foreground">
            {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border/60 text-muted-foreground shadow-sm hover:text-foreground transition-colors"
          aria-label="Dismiss chat bubble"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Main bubble */}
        <Link
          href="/messages"
          aria-label={unreadMessages > 0 ? `Open messages (${unreadMessages} unread)` : 'Open messages'}
          className={cn(
            'relative flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-all duration-200',
            'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          style={{ width: '52px', height: '52px' }}
        >
          <MessageCircle className="h-6 w-6" fill="currentColor" fillOpacity={0.2} />

          {/* Unread count badge */}
          {unreadMessages > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white shadow-sm">
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
