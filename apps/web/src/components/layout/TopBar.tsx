'use client';

import { usePathname, useRouter } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { usePopupChatOptional } from '@/contexts/PopupChatContext';
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
    <>
    {/* The desktop bar: the ask pill in the middle, the create menu, then the
        locale, bell and account that the sidebar footer used to hold
        (docs §131.1). Phones keep their own bar below. */}
    <DesktopTopBar />
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

/* The three "new" pages the registry already knows (docs §131.1). */
export const CREATE_LINKS = [
  { href: '/commitments/new', en: 'Need card', el: 'Κάρτα ανάγκης' },
  { href: '/events/create', en: 'Event', el: 'Εκδήλωση' },
  { href: '/projects/create', en: 'Project', el: 'Έργο' },
];

function DesktopTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const popup = usePopupChatOptional();

  const openAsk = () => {
    if (popup && !pathname?.startsWith('/ai')) popup.open(undefined, 'ai');
    else router.push('/ai');
  };

  return (
    <header
      style={{ top: `var(--topbar-top, ${TOP_BANNER_STACK})` }}
      data-desktop-topbar=""
      className="sticky z-30 hidden h-14 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-md safe-x sm:flex"
    >
      <div className="min-w-0 flex-1" />
      {/* The ask surface, not a second input: the pill opens the assistant. */}
      <button
        type="button"
        onClick={openAsk}
        aria-label={bilingualAria('Ask or search', 'Ρωτήστε ή αναζητήστε')}
        className="focus-ring mx-auto flex h-10 w-full max-w-md items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Sparkles className="icon-sm shrink-0 text-primary-accessible" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">
          <BilingualText en="Ask or search…" el="Ρωτήστε ή αναζητήστε…" compact />
        </span>
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full px-3.5" aria-label={bilingualAria('Create', 'Δημιουργία')}>
              <Plus className="icon-sm" aria-hidden="true" />
              <span className="hidden lg:inline"><BilingualText en="Create" el="Δημιουργία" compact /></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {CREATE_LINKS.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}><BilingualText en={item.en} el={item.el} compact /></Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <LanguageSwitcher iconOnly className="h-9 w-9" />
        <NotificationsBell className="h-9 w-9" />
        <UserMenu />
      </div>
    </header>
  );
}
