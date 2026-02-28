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
    <aside className="hidden lg:flex lg:flex-col h-fit min-h-[420px] rounded-2xl border border-border/60 bg-card/70 shadow-glow-sm backdrop-blur sticky top-6">
      <nav className="flex-1 space-y-5 p-4 overflow-y-auto">
        {navSections.map(({ section, links }) => (
          <div key={section}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">
              {section}
            </p>
            <ul className="mt-2 space-y-0.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                const badge = badgeFor(href);
                return (
                  <li key={`${section}-${href}`}>
                    <OptimizedLink
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-primary/15 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:translate-x-0.5',
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                      <span className="truncate">{label}</span>
                      {badge > 0 && (
                        <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
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
