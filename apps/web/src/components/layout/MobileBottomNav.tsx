'use client';

import { OptimizedLink } from '@/components/common/OptimizedLink';
import { BilingualText } from '@/components/common/BilingualText';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavIcon } from '@/components/icons/CfbGlyph';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useI18n } from '@/components/common/I18nProvider';
import { bilingualAria } from '@/lib/i18n/format';

const PRIMARY_TABS = [
  { icon: Home, label: 'Home', labelEl: 'Αρχική', path: '/dashboard', match: ['/dashboard', '/home'] },
  { icon: Compass, label: 'Discover', labelEl: 'Ανακάλυψη', path: '/discover', match: ['/discover'] },
  // The assistant is the product's centre: the raised button in the middle,
  // as Parea draws its primary action (docs §131.1).
  { icon: Sparkles, label: 'Assistant', labelEl: 'Βοηθός', path: '/ai', match: ['/ai'], raised: true },
  { icon: MessageCircle, label: 'Messages', labelEl: 'Μηνύματα', path: '/messages', match: ['/messages'], badgeKey: 'messages' as const },
  // Εγώ took the menu's slot; the drawer's handle is the top bar's menu
  // button, which has always opened the same sheet.
  { icon: User, label: 'Profile', labelEl: 'Εγώ', path: '/profile', match: ['/profile'] },
] as const;

const tabClasses = 'relative flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[12.485px] font-medium leading-[1.25] tracking-tight focus-ring';

/*
 * A soft hyphen where a Greek tab name can outgrow its column. At 360px a
 * tab is 68px and «Εξερεύνηση» is 72px at this size: without one it broke as
 * «Εξερεύνησ / η»; with one it breaks «Εξερεύ- / νηση», and from 375px up
 * it stays on one line. At 320px a tab is 64px and the active one's pill
 * left «Μηνύματα» as «Μηνύματ / α»; it breaks «Μηνύ- / ματα» now (docs §107).
 */
const TAB_EL_BREAKS: Record<string, string> = {
  Εξερεύνηση: 'Εξερεύ\u00ADνηση',
  Μηνύματα: 'Μηνύ\u00ADματα',
};

function TabLabel({ en, el }: { en: string; el: string }) {
  // One language, wrapping, at 12.485px (12.74px minus another 2%). The accessible name
  // on the link still carries both languages.
  return (
    <BilingualText
      en={en}
      el={TAB_EL_BREAKS[el] ?? el}
      stacked
      wrap
      className="w-full text-center text-[12.485px] leading-[1.25] tracking-tight"
      primaryClassName="break-words"
    />
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { messages: unreadMessages } = useUnreadCounts();

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
    const raised = 'raised' in tab && tab.raised;
    return (
      <OptimizedLink
        key={tab.path}
        href={tab.path}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          tabClasses,
          raised ? 'text-muted-foreground' : isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        )}
      >
        <span className={cn('relative', raised && '-mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background')}>
          <NavIcon href={tab.path} fallback={Icon} className={raised ? 'icon-md text-primary-foreground' : 'icon-md'} />
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
            {badge === 1
              ? bilingualAria('1 unread message', '1 αδιάβαστο μήνυμα')
              : bilingualAria(`${badge} unread messages`, `${badge} αδιάβαστα μηνύματα`)}
          </span>
        )}
      </OptimizedLink>
    );
  };

  return (
    <nav
      data-mobile-tabs=""
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-0.5 pt-1 backdrop-blur-md sm:hidden safe-bottom pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
      role="navigation"
      aria-label={t('Primary mobile navigation')}
    >
      {PRIMARY_TABS.map(renderTab)}
    </nav>
  );
}
