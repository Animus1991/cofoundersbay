"use client";

import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { CommandPalette, useCommandPalette } from '@/components/common/CommandPalette';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { Logo } from '@/components/brand/Logo';
import { CfbGlyph } from '@/components/icons/CfbGlyph';

export function TopNav() {
  const [ready, setReady] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  const { messages: unreadMessages } = useUnreadCounts();

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <>
      <header className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Logo & Branding */}
        <OptimizedLink href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </OptimizedLink>

        {/* Search & Discover */}
        <div className="flex flex-1 items-center gap-3 lg:justify-center">
          <SearchBar />
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex shrink-0"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command palette (Ctrl+K)"
            title="Command palette (Ctrl+K)"
          >
            <Keyboard className="icon-sm" aria-hidden="true" />
          </Button>
          {/* `asChild`, not an anchor wrapping a button: `OptimizedLink` is a
              forwardRef over <a>, so the old shape was interactive content
              inside a link — invalid HTML and two tab stops for one target. */}
          <Button asChild variant="secondary" className="hidden lg:flex gap-2 hover-lift">
            <OptimizedLink href="/discover">
              <CfbGlyph name="discover" className="icon-sm" />
              Discover
            </OptimizedLink>
          </Button>
          {/* Same change here, which also retires the `tabIndex={-1}
              aria-hidden` pair: those hid the inner button from assistive
              technology to work around the nesting. With one element there is
              nothing to hide, and the link keeps its own label. */}
          <Button asChild variant="ghost" size="icon" className="relative hidden lg:flex shrink-0">
            <OptimizedLink href="/messages" aria-label={unreadMessages > 0 ? `Messages (${unreadMessages} unread)` : 'Messages'}>
              <CfbGlyph name="messages" className="icon-sm" />
              {unreadMessages > 0 && (
                <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-0.5 text-2xs font-bold text-primary-foreground">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </OptimizedLink>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <NotificationsBell />
          <MobileNav />
          {ready && <UserMenu />}
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
