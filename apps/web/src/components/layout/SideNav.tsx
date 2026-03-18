"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { navSections } from './nav-links';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type StoredUser = { displayName?: string; email?: string; role?: string; avatarUrl?: string } | null;

export function SideNav() {
  const pathname = usePathname();
  const { messages: unreadMessages, intros: pendingIntros } = useUnreadCounts();
  const [user, setUser] = useState<StoredUser>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try { setUser(JSON.parse(raw)); } catch { /* silent */ }
  }, []);

  const badgeFor = (href: string): number => {
    if (href === '/messages') return unreadMessages;
    if (href === '/connections') return pendingIntros;
    return 0;
  };

  const initials =
    user?.displayName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  return (
    <aside
      className="hidden lg:flex lg:flex-col h-fit min-h-[420px] rounded-xl border border-border bg-card shadow-sm sticky top-4"
      aria-label="Main navigation"
    >
      <nav className="flex-1 space-y-4 p-2 overflow-y-auto">
        {navSections.map(({ section, links }) => (
          <div key={section}>
            <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {section}
            </p>
            <ul className="space-y-0.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                const badge = badgeFor(href);
                return (
                  <li key={`${section}-${href}`}>
                    <OptimizedLink
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all duration-150',
                        active
                          ? 'bg-primary/8 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground font-normal',
                      )}
                    >
                      {/* Left border indicator for active state */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary" aria-hidden="true" />
                      )}
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground/70')} aria-hidden="true" />
                      <span className="truncate">{label}</span>
                      {badge > 0 && (
                        <span
                          className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                          aria-label={`${badge} unread`}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </OptimizedLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-border/60 p-3">
          <OptimizedLink href="/profile" className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/60 transition-colors">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{user.displayName ?? 'User'}</p>
              {user.role && (
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              )}
            </div>
          </OptimizedLink>
        </div>
      )}
    </aside>
  );
}
