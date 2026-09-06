'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSectionsForMode, type SidebarMode } from './nav-modes';
import { ModeSwitcher } from './ModeSwitcher';
import { useSidebar } from './SidebarContext';
import { useSidebarMode } from '@/hooks/use-sidebar-mode';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NAV_LINK_DESCRIPTIONS } from '@/lib/nav-descriptions';
import {
  getNavDescriptionEl,
  getNavLabelEl,
  getNavSectionEl,
} from '@/lib/i18n/strings-nav';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { commonEn, commonEl } from '@/lib/i18n/strings-common';
import { Logo, LogoIcon } from '@/components/brand/Logo';
import { NavIcon } from '@/components/icons/CfbGlyph';
import { isPreviewDemo } from '@/lib/preview-demo';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useRole } from '@/contexts/RoleContext';

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, toggle } = useSidebar();
  const { messages: unreadMessages, intros: pendingIntros, notifications: unreadNotifications } = useUnreadCounts();
  const user = useStoredUser();
  const { primaryRole } = useRole();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useSidebarMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login when session expires
  useEffect(() => {
    const handleLogout = () => {
      if (isPreviewDemo()) return;
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

  // primaryRole comes from RoleContext (root-level, API-backed — the single source
  // of truth per docs/AI_PLATFORM_UPGRADE_PLAN.md §1.2). user?.role is a coarser
  // string cached in localStorage at login and only used as a fallback while
  // RoleContext is still loading or if it failed to fetch.
  const effectiveRole = primaryRole ?? user?.role;
  const sections = useMemo(
    () => getSectionsForMode(mode, effectiveRole),
    [mode, effectiveRole],
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
    if (badgeType === 'notifications' || href === '/notifications') return unreadNotifications;
    return 0;
  };

  const initials =
    user?.displayName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  return (
    <TooltipProvider delayDuration={400}>
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col overflow-x-hidden border-r border-border/60 bg-card/98 backdrop-blur-sm',
        'transition-[width] duration-200 ease-out will-change-[width]',
        'hidden lg:flex',
        'max-lg:pointer-events-none max-lg:invisible',
        expanded ? 'w-[240px]' : 'w-[68px]',
      )}
      aria-label={bilingualAria(commonEn('main_navigation'), commonEl('main_navigation'))}
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
            aria-label={bilingualAria(commonEn('collapse_sidebar'), commonEl('collapse_sidebar'))}
          >
            <PanelLeftClose className="icon-sm" />
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
              <p className="mx-3 mb-1 mt-3 text-xs text-muted-foreground/80 first:mt-1">
                <BilingualText
                  en={section}
                  el={getNavSectionEl(section)}
                  stacked
                  primaryClassName="font-semibold uppercase tracking-widest"
                  secondaryClassName="normal-case tracking-normal"
                />
              </p>
            ) : (
              <div className="mx-3 my-2 h-px bg-border/50" />
            )}
            <ul className="space-y-0.5 px-2">
              {links.map(({ href, label, icon: Icon, badge: badgeType }) => {
                const active =
                  pathname === href || (href !== '/' && pathname?.startsWith(href));
                const badge = badgeFor(href, badgeType);

                const navHint = NAV_LINK_DESCRIPTIONS[href];
                const navHintEl = getNavDescriptionEl(href);
                const labelEl = getNavLabelEl(href);

                const link = (
                  <OptimizedLink
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    title={
                      !expanded
                        ? bilingualAria(
                            navHint ?? label,
                            navHintEl ?? labelEl,
                          )
                        : undefined
                    }
                    className={cn(
                      'group relative flex items-center rounded-lg text-sm transition-all duration-150 min-w-0 overflow-hidden',
                      expanded ? 'gap-2.5 px-2.5 py-1.5' : 'justify-center p-2.5',
                      active
                        ? 'bg-primary/8 text-primary-accessible font-medium'
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
                        <NavIcon
                          href={href}
                          fallback={Icon}
                          className={cn(
                            'icon-sm',
                            active ? 'text-primary-accessible' : 'text-muted-foreground/70 group-hover:text-foreground',
                          )}
                        />
                        {badge > 0 && !expanded && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold leading-none text-primary-foreground ring-2 ring-card">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </span>

                      {/* Label + badge (expanded) */}
                      {expanded && (
                        <>
                          <BilingualText en={label} el={labelEl} stacked className="min-w-0 flex-1" />
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
                );

                return (
                  <li key={`${section}-${href}`}>
                    {expanded && navHint ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[240px] text-xs">
                          <p className="font-medium text-foreground">
                            <BilingualText en={label} el={labelEl} />
                          </p>
                          {navHint && (
                            <p className="text-muted-foreground">
                              <BilingualText en={navHint} el={navHintEl} />
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
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
              <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary-accessible">
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
            aria-label={bilingualAria(commonEn('expand_sidebar'), commonEl('expand_sidebar'))}
          >
            <PanelLeftOpen className="icon-sm" />
          </button>
        )}
      </div>
    </aside>
    </TooltipProvider>
  );
}
