'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, GripVertical } from 'lucide-react';
import { useMessagingUnreadCount } from '@/contexts/MessagingContext';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/useDraggable';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';

/**
 * Floating chat bubble shown on all pages except /messages.
 * Clicking it navigates to the messages page.
 */
export function ChatBubble() {
  const pathname = usePathname();
  const unreadMessages = useMessagingUnreadCount();
  const { toggle } = usePopupChat();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Draggable functionality
  const { position, isDragging, dragHandleProps } = useDraggable({
    storageKey: 'cfb-chat-bubble-position',
    initialPosition: { x: 0, y: 0 },
    boundaryPadding: 20,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show on messages page or auth pages
  const hidden =
    !mounted ||
    dismissed ||
    pathname?.startsWith('/messages') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password');

  if (hidden) return null;

  const unreadEn = `${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`;
  const unreadEl = `${unreadMessages} ${unreadMessages === 1 ? 'αδιάβαστο μήνυμα' : 'αδιάβαστα μηνύματα'}`;
  const openLabel = unreadMessages > 0
    ? bilingualAria(`Open messages (${unreadEn})`, `Άνοιγμα μηνυμάτων (${unreadEl})`)
    : bilingualAria('Open messages', 'Άνοιγμα μηνυμάτων');
  const dismissLabel = bilingualAria('Hide chat bubble for this visit', 'Απόκρυψη φούσκας chat για αυτή την επίσκεψη');
  const dragLabel = bilingualAria('Drag to move', 'Σύρετε για μετακίνηση');

  return (
    <div
      className="group fixed bottom-6 right-6 z-30 hidden flex-col items-end gap-2 lg:flex"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Unread pill — states the count in words so the red badge below is
          never the only carrier of the information. */}
      {unreadMessages > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-full border border-border/60 bg-card px-3 py-1 shadow-md">
          <span className="text-xs font-medium text-foreground">
            <BilingualText en={unreadEn} el={unreadEl} compact />
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Secondary controls (hide, drag) appear on hover / keyboard focus.
            Showing three controls permanently made the corner look cluttered;
            both stay fully reachable — hover reveals them and Tab lands on them. */}
        <div
          className={cn(
            'flex items-center gap-2 transition-opacity duration-150',
            'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
            isDragging && 'opacity-100',
          )}
        >
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            aria-label={dismissLabel}
            title={dismissLabel}
          >
            <X className="icon-sm" aria-hidden="true" />
          </button>

          <div
            {...dragHandleProps}
            role="button"
            tabIndex={0}
            className={cn(
              'flex items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm',
              'transition-colors hover:bg-muted hover:text-foreground',
              isDragging && 'scale-95 bg-muted opacity-80',
            )}
            style={{ width: '28px', height: '28px', ...dragHandleProps.style }}
            title={dragLabel}
            aria-label={dragLabel}
          >
            <GripVertical className="icon-sm" aria-hidden="true" />
          </div>
        </div>

        {/* Main bubble */}
        <button
          type="button"
          onClick={toggle}
          aria-label={openLabel}
          title={openLabel}
          className={cn(
            'relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200',
            'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          style={{ width: '52px', height: '52px' }}
        >
          <MessageCircle className="icon-lg" fill="currentColor" fillOpacity={0.2} aria-hidden="true" />
          {unreadMessages > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-status-danger px-1 text-xs font-bold leading-none text-white shadow-sm"
            >
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
