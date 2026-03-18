'use client';

import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { CommandPalette, useCommandPalette } from '@/components/common/CommandPalette';

export function TopBar() {
  const [ready, setReady] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-card/95 px-4 backdrop-blur-sm sm:px-6">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <SearchBar />
        </div>

        {/* Cmd palette trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden shrink-0 lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setCommandOpen(true)}
          aria-label="Command palette (Ctrl+K)"
          title="Command palette (Ctrl+K)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
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
