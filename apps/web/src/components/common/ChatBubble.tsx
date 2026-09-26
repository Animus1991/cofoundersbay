'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMessagingUnreadCount } from '@/contexts/MessagingContext';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/useDraggable';
import { bilingualAria } from '@/lib/i18n/format';
import { LogoIcon } from '@/components/brand/Logo';
import { usePageRail } from '@/components/layout/PageRailContext';

/**
 * Floating chat bubble shown on all pages except /messages.
 * Click opens the popup. Drag the bubble itself to move it — no extra chrome.
 * Hidden while the panel (or its minimised pill) is on screen, so the two
 * never stack in the same corner.
 */
export function ChatBubble() {
  // Read with the other contexts, above the early return below: a hook
  // called after `if (hidden) return null` runs on some renders and not
  // others, which is exactly the order change React refuses.
  const { pinned: railPinned, hasRail } = usePageRail();
  const pathname = usePathname();
  const unreadMessages = useMessagingUnreadCount();
  const { isOpen, isMinimized, open, restore } = usePopupChat();
  const [mounted, setMounted] = useState(false);

  const { position, isDragging, dragHandleProps, consumeSuppressClick } = useDraggable({
    storageKey: 'cfb-chat-bubble-position',
    initialPosition: { x: 0, y: 0 },
    boundaryPadding: 20,
    activationDelayMs: 180,
    moveThresholdPx: 6,
    preventDefaultOnDown: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const hidden =
    !mounted ||
    isOpen ||
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
    ? bilingualAria(`Open chat (${unreadEn})`, `Άνοιγμα συνομιλίας (${unreadEl})`)
    : bilingualAria('Open chat', 'Άνοιγμα συνομιλίας');
  const moveHint = bilingualAria(
    'Drag to move',
    'Σύρετε για μετακίνηση',
  );

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-6 z-50 hidden transition-[right] duration-200 ease-out lg:block',
        // Clear of the page rail: the strip on a page that has one, the whole
        // panel while it is pinned. Without this the bubble sat behind it.
        !hasRail ? 'right-6' : railPinned ? 'right-[23.252rem]' : 'right-[4.75rem]',
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <button
        type="button"
        {...dragHandleProps}
        onClick={(e) => {
          e.stopPropagation();
          if (consumeSuppressClick()) return;
          if (isMinimized) {
            restore();
            return;
          }
          open(undefined, unreadMessages > 0 ? 'messages' : undefined);
        }}
        aria-label={`${openLabel}. ${moveHint}`}
        title={`${openLabel}. ${moveHint}`}
        aria-haspopup="dialog"
        aria-expanded={false}
        className={cn(
          'pointer-events-auto relative flex items-center justify-center rounded-full shadow-lg transition-transform duration-200',
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105',
          'outline-none focus-visible:ring-2 focus-visible:ring-primary-accessible focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isDragging && 'scale-95 cursor-grabbing',
        )}
        style={{
          width: '52px',
          height: '52px',
          ...dragHandleProps.style,
          cursor: isDragging ? 'grabbing' : undefined,
        }}
      >
        <LogoIcon size={49} mono className="pointer-events-none text-primary-foreground -translate-y-[2px]" />
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
  );
}
