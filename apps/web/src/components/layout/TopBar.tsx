'use client';

import { usePathname } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationsBell } from './NotificationsBell';
import { TOP_BANNER_STACK } from './useTopBannerHeight';
import { DemoExitInTopBar } from '@/components/common/OfflineIndicator';

/**
 * Phone-only chrome. From `sm` the sidebar rail keeps search + notifications
 * and folds palette, theme, and locale into the account menu — a sticky top
 * bar there would only steal vertical space without widening the column.
 * Palette, sample data and the language display are in the account menu here
 * too: the avatar opens them, so the bar carries one way to each.
 */
export function TopBar() {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth');

  if (isAuthPage) return null;

  return (
    <header
      // A full-height frame sets --topbar-top to 0: its column does not
      // scroll, and the banners sit above it already (AppShellFrame).
      style={{ top: `var(--topbar-top, ${TOP_BANNER_STACK})` }}
      data-phone-topbar=""
      className="sticky z-30 flex h-12 min-h-12 items-center gap-0.5 border-b border-border bg-background/80 px-2 backdrop-blur-md safe-x sm:hidden"
    >
      <MobileNav />
      <SearchBar />
      <div className="min-w-0 flex-1" />
      <DemoExitInTopBar />
      <div className="flex shrink-0 items-center gap-0.5">
        <LanguageSwitcher iconOnly className="h-9 w-9" />
        <ThemeSwitcher className="h-9 w-9" />
        <NotificationsBell className="h-9 w-9" />
        <UserMenu />
      </div>
    </header>
  );
}
