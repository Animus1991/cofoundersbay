'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSectionsForMode, type NavSection, type SidebarMode } from './nav-modes';
import { ModeSwitcher } from './ModeSwitcher';
import { useSidebar } from './SidebarContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo, LogoIcon } from '@/components/brand/Logo';

type StoredUser = {
  displayName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
} | null;

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, toggle } = useSidebar();
  const { messages: unreadMessages, intros: pendingIntros } = useUnreadCounts();
  const [user, setUser] = useState<StoredUser>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<SidebarMode>('work');

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try { setUser(JSON.parse(raw) as StoredUser); } catch { /* silent */ }
    // Restore saved mode preference
    const savedMode = localStorage.getItem('cfb:sidebar-mode') as SidebarMode | null;
    if (savedMode && ['work', 'explore', 'account'].includes(savedMode)) {
      setMode(savedMode);
    }
  }, []);

  // Redirect to login when session expires
  useEffect(() => {
    const handleLogout = () => {
      router.replace('/login');
    };
    window.addEventListener('cfb:logout', handleLogout);
    return () => window.removeEventListener('cfb:logout', handleLogout);
  }, [router]);

  // Handle mode change with persistence
  const handleModeChange = useCallback((newMode: SidebarMode) => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cfb:sidebar-mode', newMode);
    }
  }, []);

  const sections = useMemo(
    () => getSectionsForMode(mode, user?.role),
    [mode, user?.role],
  );

  // Hide sidebar on auth pages
  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth');

  if (isAuthPage) return null;

  const badgeFor = (href: string, badgeType?: 'messages' | 'connections' | 'notifications'): number => {
    if (badgeType === 'messages' || href === '/messages') return unreadMessages;
    if (badgeType === 'connections' || href === '/connections') return pendingIntros;
    if (badgeType === 'notifications' || href === '/notifications') return 0; // TODO: Add notifications count when available
    return 0;
  };

  const initials =
    user?.displayName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border/60 bg-card/98 backdrop-blur-sm',
        'transition-[width] duration-200 ease-out will-change-[width]',
        'hidden lg:flex',
        expanded ? 'w-[240px]' : 'w-[68px]',
      )}
      aria-label="Main navigation"
    >
      {/* ── Logo header ── */}
      <div
        className={cn(
          'flex h-14 flex-shrink-0 items-center border-b border-border/60',
          expanded ? 'justify-between px-4' : 'justify-center px-0',
        )}
      >
        {expanded ? (
          <OptimizedLink href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </OptimizedLink>
        ) : (
          <OptimizedLink href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
            <LogoIcon size={28} />
          </OptimizedLink>
        )}
        {expanded && mounted && (
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="icon-sm" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Mode Switcher ── */}
      <ModeSwitcher currentMode={mode} onModeChange={handleModeChange} expanded={expanded} />

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-hide">
        {sections.map(({ section, links }) => (
          <div key={section} className="mb-1">
            {expanded ? (
              <p className="mx-3 mb-1 mt-3 text-2xs font-semibold uppercase tracking-widest text-muted-foreground/40 first:mt-1">
                {section}
              </p>
            ) : (
              <div className="mx-3 my-2 h-px bg-border/50" />
            )}
            <ul className="space-y-0.5 px-2">
              {links.map(({ href, label, icon: Icon, badge: badgeType }) => {
                const active =
                  pathname === href || (href !== '/' && pathname?.startsWith(href));
                const badge = badgeFor(href, badgeType);

                return (
                  <li key={`${section}-${href}`}>
                    <OptimizedLink
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      title={!expanded ? label : undefined}
                      className={cn(
                        'group relative flex items-center rounded-lg transition-all duration-150',
                        expanded ? 'gap-2.5 px-2.5 py-1.5' : 'justify-center p-2.5',
                        active
                          ? 'bg-primary/8 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                      )}
                    >
                      {/* Active left bar */}
                      {active && expanded && (
                        <span
                          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}

                      {/* Icon + badge (collapsed) */}
                      <span className="relative flex-shrink-0">
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
                          )}
                          aria-hidden="true"
                        />
                        {badge > 0 && !expanded && (
                          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-primary px-0.5 text-2xs font-bold leading-none text-primary-foreground">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </span>

                      {/* Label + badge (expanded) */}
                      {expanded && (
                        <>
                          <span className="truncate text-sm leading-none">{label}</span>
                          {badge > 0 && (
                            <span
                              className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold leading-none text-primary-foreground"
                              aria-label={`${badge} unread`}
                            >
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                        </>
                      )}
                    </OptimizedLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User profile footer ── */}
      <div className="flex-shrink-0 border-t border-border/60 p-2">
        {user && mounted ? (
          <OptimizedLink
            href="/profile"
            title={!expanded ? (user.displayName ?? 'Profile') : undefined}
            className={cn(
              'flex items-center rounded-lg transition-colors hover:bg-secondary/60',
              expanded ? 'gap-2.5 px-2 py-2' : 'justify-center p-2',
            )}
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-foreground">
                  {user.displayName ?? 'User'}
                </p>
                {user.role && (
                  <p className="truncate text-xs capitalize leading-tight text-muted-foreground">
                    {user.role}
                  </p>
                )}
              </div>
            )}
          </OptimizedLink>
        ) : (
          <div className={cn('rounded-lg bg-secondary/40', expanded ? 'h-10' : 'h-9 w-9 mx-auto')} />
        )}

        {/* Expand button when collapsed */}
        {!expanded && mounted && (
          <button
            onClick={toggle}
            className="mt-1 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="icon-sm" aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
}
