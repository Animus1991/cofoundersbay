'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, GripVertical } from 'lucide-react';
import { useMessagingUnreadCount } from '@/contexts/MessagingContext';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/useDraggable';

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

  return (
    <div 
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
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

        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-full bg-card border border-border/60 text-muted-foreground shadow-sm',
            'hover:text-foreground hover:bg-muted transition-colors',
            isDragging && 'scale-95 opacity-80 bg-muted',
          )}
          style={{ width: '28px', height: '28px', ...dragHandleProps.style }}
          title="Drag to move"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* Main bubble */}
        <button
          onClick={toggle}
          aria-label={unreadMessages > 0 ? `Open messages (${unreadMessages} unread)` : 'Open messages'}
          className={cn(
            'relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200',
            'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          style={{ width: '52px', height: '52px' }}
        >
          <MessageCircle className="h-6 w-6" fill="currentColor" fillOpacity={0.2} />
          {unreadMessages > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white shadow-sm">
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
