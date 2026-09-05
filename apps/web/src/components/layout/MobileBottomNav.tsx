'use client';

import { OptimizedLink } from '@/components/common/OptimizedLink';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, Menu, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useSidebar } from './SidebarContext';

const PRIMARY_TABS = [
  { icon: Home, label: 'Home', path: '/dashboard', match: ['/dashboard'] },
  { icon: Compass, label: 'Discover', path: '/discover', match: ['/discover'] },
  { icon: MessageCircle, label: 'Messages', path: '/messages', match: ['/messages'], badgeKey: 'messages' as const },
  { icon: User, label: 'Profile', path: '/profile', match: ['/profile'] },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { messages: unreadMessages } = useUnreadCounts();
  const { mobileNavOpen, setMobileNavOpen } = useSidebar();

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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border/60 bg-card/95 px-1 pt-1.5 backdrop-blur-md lg:hidden safe-bottom safe-x"
      role="navigation"
      aria-label="Primary mobile navigation"
    >
      {PRIMARY_TABS.slice(0, 3).map((tab) => {
        const isActive = isTabActive(tab.match);
        const Icon = tab.icon;
        const badge = 'badgeKey' in tab && tab.badgeKey === 'messages' ? unreadMessages : 0;
        return (
          <OptimizedLink
            key={tab.path}
            href={tab.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium tap-target',
              isActive ? 'text-primary-accessible' : 'text-muted-foreground',
            )}
          >
            <span className="relative">
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} aria-hidden />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </OptimizedLink>
        );
      })}

      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="More destinations"
        aria-expanded={mobileNavOpen}
        className={cn(
          'relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium tap-target',
          mobileNavOpen ? 'text-primary-accessible' : 'text-muted-foreground',
        )}
      >
        <Menu className={cn('h-5 w-5', mobileNavOpen && 'stroke-[2.5px]')} aria-hidden />
        <span>More</span>
      </button>

      {PRIMARY_TABS.slice(3).map((tab) => {
        const isActive = isTabActive(tab.match);
        const Icon = tab.icon;
        return (
          <OptimizedLink
            key={tab.path}
            href={tab.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium tap-target',
              isActive ? 'text-primary-accessible' : 'text-muted-foreground',
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} aria-hidden />
            <span>{tab.label}</span>
          </OptimizedLink>
        );
      })}
    </nav>
  );
}
