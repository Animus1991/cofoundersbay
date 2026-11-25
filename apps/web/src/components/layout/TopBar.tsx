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
import { GLOBAL_TOOLS_PLACEMENT, GlobalTools } from './GlobalTools';

export { CREATE_LINKS } from './GlobalTools';

/**
 * Phone-only chrome. From `sm` the sidebar rail keeps search + notifications
 * and folds palette, theme, and locale into the account menu — a sticky top
 * bar there would only steal vertical space without widening the column.
 * Palette, sample data and the language display are in the account menu here
 * too: the avatar opens them, so the bar carries one way to each.
 */
export function TopBar({ desktopBar }: {
  /** The desktop bar: by default only when the tools live there (GlobalTools).
   *  The full-height pages (/messages, /ai) and the canvas keep it (docs §146). */
  desktopBar?: boolean;
} = {}) {
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
    <>
    {/* The desktop bar: the create menu, the locale, bell and account that
        the sidebar footer used to hold (docs §131.1). Only where the page has
        no first block to hold them (docs §146). Phones keep their own bar below. */}
    {(desktopBar ?? GLOBAL_TOOLS_PLACEMENT === 'bar') ? <DesktopTopBar /> : null}
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
    </>
  );
}

function DesktopTopBar() {
  return (
    <header
      style={{ top: `var(--topbar-top, ${TOP_BANNER_STACK})` }}
      data-desktop-topbar=""
      className="sticky z-30 hidden h-14 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-md safe-x sm:flex"
    >
      {/* No ask pill (docs §146): every page asks in its own field; the
          sidebar's assistant and the chat stay one click away. */}
      <div className="min-w-0 flex-1" />
      <GlobalTools />
    </header>
  );
}
