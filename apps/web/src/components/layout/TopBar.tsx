'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Eye, EyeOff, Globe, Keyboard, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { DemoDataToggle } from '@/components/common/DemoDataToggle';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useDemoData } from '@/contexts/DemoDataContext';

const CommandPalette = dynamic(
  () => import('@/components/common/CommandPalette').then((module) => ({ default: module.CommandPalette })),
  { ssr: false },
);

function MobileToolsMenu({ onCommand }: { onCommand: () => void }) {
  const { showDemoData, toggleDemoData } = useDemoData();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden"
          aria-label="More tools"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-56">
        <DropdownMenuItem onClick={onCommand}>
          <Keyboard className="mr-2 h-4 w-4" />
          Command palette
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings#language')}>
          <Globe className="mr-2 h-4 w-4" />
          Language
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleDemoData}>
          {showDemoData ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
          {showDemoData ? 'Hide sample data' : 'Show sample data'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
      <header className="sticky top-0 z-30 flex h-12 min-h-12 items-center gap-1 border-b border-border/50 bg-background/80 px-2 backdrop-blur-md sm:h-14 sm:gap-2 sm:px-4 lg:px-6 safe-x">
        <MobileNav />
        <SearchBar />

        <div className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground md:flex"
            onClick={() => setCommandOpen(true)}
            aria-label="Command palette"
            title="Command palette (Ctrl+K)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <div className="hidden md:block">
            <DemoDataToggle />
          </div>
          <MobileToolsMenu onCommand={() => setCommandOpen(true)} />
          <LanguageSwitcher />
          <ThemeSwitcher />
          <NotificationsBell className="h-9 w-9" />
          {ready && <UserMenu />}
        </div>
      </header>

      {ready && commandOpen ? <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} /> : null}
    </>
  );
}
