'use client';

import { OptimizedLink } from '@/components/common/OptimizedLink';
import { BilingualText } from '@/components/common/BilingualText';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CfbGlyph, NavIcon } from '@/components/icons/CfbGlyph';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useSidebar } from './SidebarContext';
import { useI18n } from '@/components/common/I18nProvider';
import { bilingualAria } from '@/lib/i18n/format';

const PRIMARY_TABS = [
  { icon: Home, label: 'Home', labelEl: 'Αρχική', path: '/dashboard', match: ['/dashboard'] },
  { icon: Compass, label: 'Discover', labelEl: 'Εξερεύνηση', path: '/discover', match: ['/discover'] },
  { icon: MessageCircle, label: 'Messages', labelEl: 'Μηνύματα', path: '/messages', match: ['/messages'], badgeKey: 'messages' as const },
  { icon: User, label: 'Profile', labelEl: 'Προφίλ', path: '/profile', match: ['/profile'] },
] as const;

const tabClasses = 'relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-xs font-medium focus-ring';

function TabLabel({ en, el }: { en: string; el: string }) {
  return (
    <BilingualText
      en={en}
      el={el}
      stacked
      className="w-full text-center"
      primaryClassName="whitespace-normal break-words"
      secondaryClassName="whitespace-normal break-words"
    />
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { messages: unreadMessages } = useUnreadCounts();
  const { mobileNavOpen, mobileNavId, setMobileNavOpen } = useSidebar();

  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth');

  if (isAuthPage) return null;

  const isTabActive = (match: readonly string[]) =>
    match.some((prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`));

  const renderTab = (tab: typeof PRIMARY_TABS[number]) => {
    const isActive = isTabActive(tab.match);
    const Icon = tab.icon;
    const badge = 'badgeKey' in tab ? unreadMessages : 0;
    return (
      <OptimizedLink
        key={tab.path}
        href={tab.path}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          tabClasses,
          isActive ? 'bg-primary/10 text-primary-accessible' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        )}
      >
        <span className="relative">
          <NavIcon href={tab.path} fallback={Icon} className="icon-md" />
          {badge > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-2xs font-bold text-primary-foreground"
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        <TabLabel en={tab.label} el={tab.labelEl} />
        {badge > 0 && (
          <span className="sr-only">
            {bilingualAria(`${badge} unread messages`, `${badge} αδιάβαστα μηνύματα`)}
          </span>
        )}
      </OptimizedLink>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border/60 bg-card/95 px-1 pt-1.5 backdrop-blur-md lg:hidden safe-bottom safe-x"
      role="navigation"
      aria-label={t('Primary mobile navigation')}
    >
      {PRIMARY_TABS.slice(0, 3).map(renderTab)}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('More destinations')}
        aria-haspopup="dialog"
        aria-expanded={mobileNavOpen}
        aria-controls={mobileNavOpen ? mobileNavId : undefined}
        className={cn(tabClasses, mobileNavOpen ? 'bg-primary/10 text-primary-accessible' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground')}
      >
        <CfbGlyph name="more" className="icon-md" />
        <TabLabel en="More" el="Μενού" />
      </button>
      {PRIMARY_TABS.slice(3).map(renderTab)}
    </nav>
  );
}
