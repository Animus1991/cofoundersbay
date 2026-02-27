'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const bottomTabs = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Discover', path: '/discover' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Briefcase, label: 'Jobs', path: '/discover' },
  { icon: User, label: 'Profile', path: '/profile' },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/60 bg-card/95 px-2 py-2 backdrop-blur-md lg:hidden"
      role="navigation"
    >
      {bottomTabs.map((tab) => {
        const isActive =
          pathname === tab.path ||
          (tab.path !== '/' && pathname.startsWith(tab.path));
        const Icon = tab.icon;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon
              className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')}
              aria-hidden
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
