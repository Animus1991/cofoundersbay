'use client';

import { OptimizedLink } from '@/components/common/OptimizedLink';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

const bottomTabs = [
  { icon: Home, label: 'Home', path: '/', badgeKey: null },
  { icon: Search, label: 'Discover', path: '/discover', badgeKey: null },
  { icon: MessageCircle, label: 'Messages', path: '/messages', badgeKey: 'messages' as const },
  { icon: Briefcase, label: 'Jobs', path: '/jobs', badgeKey: null },
  { icon: User, label: 'Profile', path: '/profile', badgeKey: null },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { messages: unreadMessages } = useUnreadCounts();

  const badgeCount = (key: string | null): number => {
    if (key === 'messages') return unreadMessages;
    return 0;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/60 bg-card/95 px-2 py-2 backdrop-blur-md lg:hidden safe-bottom"
      role="navigation"
    >
      {bottomTabs.map((tab) => {
        const isActive =
          pathname === tab.path ||
          (tab.path !== '/' && pathname.startsWith(tab.path));
        const Icon = tab.icon;
        const badge = badgeCount(tab.badgeKey);
        return (
          <OptimizedLink
            key={tab.path}
            href={tab.path}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon
                className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')}
                aria-hidden
              />
              {badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </OptimizedLink>
        );
      })}
    </nav>
  );
}
