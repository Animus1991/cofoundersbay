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
import { TOP_BANNER_STACK } from './useTopBannerHeight';

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

  // Hide TopBar on auth pages
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
      <header
      // Sticks below the fixed banner stack rather than sliding under it: with
      // a plain `top-0` the header scrolled behind the network/demo banners.
      style={{ top: TOP_BANNER_STACK }}
      className="sticky z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-card/95 px-4 backdrop-blur-sm sm:px-6"
    >
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
          <Keyboard className="icon-sm" aria-hidden="true" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <DemoDataToggle />
          <ThemeSwitcher />
          <NotificationsBell />
          <MobileNav />
          {ready && <UserMenu />}
        </div>
      </header>

      {ready && commandOpen ? <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} /> : null}
    </>
  );
}
