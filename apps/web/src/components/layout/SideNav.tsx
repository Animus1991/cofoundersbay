'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PanelLeftClose, PanelLeftOpen, Bot, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSectionsForMode, type SidebarMode } from './nav-modes';
import { ModeSwitcher } from './ModeSwitcher';
import { useSidebar } from './SidebarContext';
import { useSidebarMode } from '@/hooks/use-sidebar-mode';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
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
import { CfbGlyph, NavIcon } from '@/components/icons/CfbGlyph';
import { isPreviewDemo } from '@/lib/preview-demo';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useOpenCommandPalette } from './CommandPaletteHost';
import { NotificationsBell } from './NotificationsBell';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { LanguagePreferenceToggle } from '@/components/common/LanguagePreferenceToggle';
import { DemoDataToggle } from '@/components/common/DemoDataToggle';
import { UserMenu } from './UserMenu';
import { PreviewDemoBadge } from './TopBar';
import { Button } from '@/components/ui/button';

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, isRail, toggle } = useSidebar();
  const { messages: unreadMessages, intros: pendingIntros, notifications: unreadNotifications } = useUnreadCounts();
  const user = useStoredUser();
  const role = useRoleOptional();
  const primaryRole = role?.primaryRole;
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useSidebarMode();
  const setCommandOpen = useOpenCommandPalette();

  // Between `sm` and `lg` the aside is a fixed 68px rail, so it renders its
  // collapsed contents regardless of the stored preference; the preference
  // still governs from `lg` up, where the 240px drawer fits.
  const showLabels = expanded && !isRail;

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
  }, [setMode]);

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

  return (
    <TooltipProvider delayDuration={400}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col overflow-x-hidden border-r border-border/60 bg-card/98 backdrop-blur-sm',
          'transition-[width] duration-200 ease-out will-change-[width]',
          // Rail from `sm`, drawer from `lg`. Width is pure CSS so the shell is
          // correct on first paint; only the contents wait for `isRail`.
          'hidden sm:flex',
          'max-sm:pointer-events-none max-sm:invisible',
          'w-[4.25rem]',
          expanded ? 'lg:w-[15rem]' : 'lg:w-[4.25rem]',
        )}
        aria-label={bilingualAria(commonEn('main_navigation'), commonEl('main_navigation'))}
      >
        {/* ── Logo header ── */}
        <div
          className={cn(
            'flex h-12 flex-shrink-0 items-center border-b border-border/60',
            showLabels ? 'justify-between px-4' : 'justify-center px-0',
          )}
        >
          {showLabels ? (
            <OptimizedLink href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Logo size="sm" />
            </OptimizedLink>
          ) : (
            <OptimizedLink href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
              <LogoIcon size={28} />
            </OptimizedLink>
          )}
          {showLabels && mounted && !isRail && (
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
        <ModeSwitcher currentMode={mode} onModeChange={handleModeChange} expanded={showLabels} />

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-hide">
          {sections.map(({ section, links }) => (
            <div key={section} className="mb-0.5">
              {/* nav-section-label, not plain text-xs: these uppercase headings
                  take the display steps' -2% per pass while the links under them
                  take the +2% of the body scale (see globals.css). */}
              {showLabels ? (
                <p className="nav-section-label mx-3 mb-1 mt-2.5 text-xs text-muted-foreground/80 first:mt-1">
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

                  // Remote introduced the /ai hub; use the Bot lucide glyph as the
                  // navigational icon for AI Assistant / Ask AI entries.
                  const FallbackIcon = href === '/ai' ? Bot : Icon;

                  const link = (
                    <OptimizedLink
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      title={
                        !showLabels
                          ? bilingualAria(
                              navHint ?? label,
                              navHintEl ?? labelEl,
                            )
                          : undefined
                      }
                      className={cn(
                        'group relative flex items-center rounded-lg text-sm transition-all duration-150 min-w-0 overflow-hidden',
                        showLabels ? 'gap-2 px-2 py-1.5' : 'justify-center p-2',
                        active
                          ? 'bg-primary/8 text-primary-accessible font-medium'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                      )}
                    >
                      {/* Active left bar */}
                      {active && showLabels && (
                        <span
                          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}

                      {/* Icon + badge (collapsed) */}
                      <span className="relative flex-shrink-0">
                        <NavIcon
                          href={href}
                          fallback={FallbackIcon}
                          className={cn(
                            'icon-sm',
                            active ? 'text-primary-accessible' : 'text-muted-foreground/70 group-hover:text-foreground',
                          )}
                        />
                        {badge > 0 && !showLabels && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold leading-none text-primary-foreground ring-2 ring-card">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </span>

                      {/* Label + badge (expanded) */}
                      {showLabels && (
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
                      {showLabels && navHint ? (
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

        {/* ── Tools + user. Relocated TopBar controls; none are dropped. ── */}
        <div className={cn('flex-shrink-0 border-t border-border/60', showLabels ? 'space-y-1 p-2' : 'space-y-0.5 p-1.5')}>
          <div className={cn(showLabels ? 'grid grid-cols-4 gap-0.5' : 'flex flex-col items-center gap-0.5')}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              onClick={() => router.push('/search')}
              aria-label={bilingualAria('Search', 'Αναζήτηση')}
            >
              <CfbGlyph name="discover" className="icon-sm" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              onClick={() => setCommandOpen(true)}
              aria-label={bilingualAria('Command palette (Ctrl+K)', 'Παλέτα εντολών (Ctrl+K)')}
            >
              <Keyboard className="icon-sm" />
            </Button>
            <NotificationsBell className="h-8 w-8" />
            {showLabels ? (
              <>
                <DemoDataToggle iconOnly className="h-8 w-8 min-w-8 px-0" />
                <LanguagePreferenceToggle className="h-8 w-8" />
                <LanguageSwitcher iconOnly className="h-8 w-8" />
                <ThemeSwitcher className="h-8 w-8" />
              </>
            ) : null}
          </div>
          {showLabels && <PreviewDemoBadge className="max-w-full justify-start" />}
          {mounted ? (
            <UserMenu variant="sidebar" />
          ) : (
            <div className={cn('rounded-lg bg-secondary/40', showLabels ? 'h-10' : 'h-9 w-9 mx-auto')} />
          )}
          {!showLabels && (
            <div className="flex flex-col items-center gap-0.5">
              <DemoDataToggle iconOnly className="h-8 w-8 min-w-8 px-0" />
              <LanguagePreferenceToggle className="h-8 w-8" />
              <LanguageSwitcher iconOnly className="h-8 w-8" />
              <ThemeSwitcher className="h-8 w-8" />
            </div>
          )}

          {!showLabels && mounted && !isRail && (
            <button
              onClick={toggle}
              className="mt-0.5 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-colors"
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
