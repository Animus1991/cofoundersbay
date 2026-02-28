"use client";

import { useEffect, useState } from 'react';
import { Compass, Sparkles, MessageCircle, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationsBell } from './NotificationsBell';
import { CommandPalette, useCommandPalette } from '@/components/common/CommandPalette';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';

export function TopNav() {
  const [ready, setReady] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  const { messages: unreadMessages } = useUnreadCounts();

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <>
      <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-glow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between animate-fade-in-down">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition-transform hover:scale-105">
            <Sparkles className="h-5 w-5 animate-pulse-glow" />
          </div>
          <div>
            <OptimizedLink href="/" className="font-display text-lg font-semibold text-foreground hover:text-primary transition-colors">
              CoFounderBay
            </OptimizedLink>
            <p className="text-xs text-muted-foreground">
              Startup networking for founders, mentors, investors
            </p>
          </div>
        </div>

        {/* Search & Discover */}
        <div className="flex flex-1 items-center gap-3 lg:justify-center">
          <SearchBar />
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex shrink-0"
            onClick={() => setCommandOpen(true)}
            title="Command palette (Ctrl+K)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <OptimizedLink href="/discover">
            <Button variant="secondary" className="hidden lg:flex gap-2 hover-lift">
              <Compass className="h-4 w-4" />
              Discover
            </Button>
          </OptimizedLink>
          <OptimizedLink href="/messages">
            <Button variant="ghost" size="icon" className="relative hidden lg:flex shrink-0" title="Messages">
              <MessageCircle className="h-4 w-4" />
              {unreadMessages > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Button>
          </OptimizedLink>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <ThemeToggle />
          <NotificationsBell />
          <MobileNav />
          {ready && <UserMenu />}
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
