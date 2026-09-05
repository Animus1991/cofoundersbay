'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Keyboard, MoreHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { DemoDataToggle } from '@/components/common/DemoDataToggle';
import { LanguagePreferenceToggle } from '@/components/common/LanguagePreferenceToggle';
import { BilingualText } from '@/components/common/BilingualText';
import { commonEn, commonEl } from '@/lib/i18n/strings-common';
import { STATUS } from '@/lib/semantic-colors';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useDemoData } from '@/contexts/DemoDataContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

/**
 * Small, inline indicator that this is the shared preview-demo account.
 * Replaces a previous fixed-position full-width banner that covered the
 * search bar and other top-bar controls, and whose secondary (Greek) text
 * used BilingualText's default `text-muted-foreground` — calibrated for the
 * app's normal card surfaces, not the raw amber background that banner used,
 * so it rendered near-illegible. This uses the same WCAG-checked semantic
 * status tokens the rest of the app already relies on for warning chips.
 */
function PreviewDemoBadge() {
  const user = useCurrentUser();
  if (user?.email !== 'demo@cofounderbay.com') return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/register"
            className={cn(
              'hidden sm:inline-flex h-7 items-center gap-1 rounded-full border px-2 text-2xs font-medium transition-colors',
              STATUS.warning.chip,
              'hover:brightness-95',
            )}
          >
            <Sparkles className="icon-sm" />
            Demo
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-[220px]">
          <p className="text-xs">
            <BilingualText en={commonEn('demo_mode_banner')} el={commonEl('demo_mode_banner')} />
          </p>
          <p className="mt-1 text-xs font-medium text-status-warning underline underline-offset-2">
            <BilingualText en={commonEn('create_free_account')} el={commonEl('create_free_account')} />
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const CommandPalette = dynamic(
  () => import('@/components/common/CommandPalette').then((module) => ({ default: module.CommandPalette })),
  { ssr: false },
);

function MobileToolsMenu({ onCommand }: { onCommand: () => void }) {
  const { showDemoData, toggleDemoData } = useDemoData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden"
          aria-label="More tools"
        >
          <MoreHorizontal className="icon-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onCommand}>
          <Keyboard className="mr-2 icon-sm" />
          Command palette
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleDemoData}>
          {showDemoData ? <Eye className="mr-2 icon-sm" /> : <EyeOff className="mr-2 icon-sm" />}
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
      <header className="sticky top-0 z-30 flex h-12 min-h-12 items-center gap-1 border-b border-border/60 bg-card/95 px-2 backdrop-blur-sm sm:h-14 sm:gap-2 sm:px-4 lg:px-6 safe-x">
        <MobileNav />
        <SearchBar />

        <div className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-1.5">
          <PreviewDemoBadge />
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground md:flex"
            onClick={() => setCommandOpen(true)}
            aria-label="Command palette"
            title="Command palette (Ctrl+K)"
          >
            <Keyboard className="icon-sm" />
          </Button>
          <div className="hidden md:flex items-center gap-0.5">
            <DemoDataToggle />
            <LanguagePreferenceToggle />
          </div>
          <MobileToolsMenu onCommand={() => setCommandOpen(true)} />
          <ThemeSwitcher />
          <NotificationsBell className="h-9 w-9" />
          {ready && <UserMenu />}
        </div>
      </header>

      {ready && commandOpen ? <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} /> : null}
    </>
  );
}
