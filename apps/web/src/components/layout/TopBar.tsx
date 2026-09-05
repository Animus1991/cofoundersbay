'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { DemoDataToggle } from '@/components/common/DemoDataToggle';
import { useCommandPalette } from '@/hooks/useCommandPalette';

const CommandPalette = dynamic(
  () => import('@/components/common/CommandPalette').then((module) => ({ default: module.CommandPalette })),
  { ssr: false },
);

export function TopBar() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

  useEffect(() => {
    setReady(true);
  }, []);

  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth');

  if (isAuthPage) return null;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1.5 border-b border-border/60 bg-card/95 px-2 backdrop-blur-sm sm:gap-3 sm:px-6 safe-top">
        <MobileNav />
        <SearchBar />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 tap-target text-muted-foreground hover:text-foreground"
          onClick={() => setCommandOpen(true)}
          aria-label="Command palette"
          title="Command palette (Ctrl+K)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 sm:gap-1">
          <DemoDataToggle />
          <ThemeSwitcher />
          <NotificationsBell />
          {ready && <UserMenu />}
        </div>
      </header>

      {ready && commandOpen ? <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} /> : null}
    </>
  );
}
