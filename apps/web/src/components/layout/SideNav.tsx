'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Bot, Keyboard } from 'lucide-react';
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

  const rail = !showLabels;
  const railSlot =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:h-[36px] lg:w-[36px]';
  const chromeIcon = rail ? 'icon-md' : 'icon-sm';

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
          'fixed left-0 top-0 z-40 flex h-full flex-col overflow-x-visible border-r border-border/60 bg-card/98 backdrop-blur-sm',
          'transition-[width] duration-200 ease-out will-change-[width]',
          // Rail from `sm`, drawer from `lg`. Width is pure CSS so the shell is
          // correct on first paint; only the contents wait for `isRail`.
          'hidden sm:flex',
          'max-sm:pointer-events-none max-sm:invisible',
          'w-[4.25rem]',
          expanded ? 'lg:w-[15rem]' : 'lg:w-[4.25rem]',
        )}
        data-rail={rail ? 'true' : undefined}
        aria-label={bilingualAria(commonEn('main_navigation'), commonEl('main_navigation'))}
      >
        {/* ── Logo header ── */}
        <div
          className={cn(
            'flex h-14 flex-shrink-0 items-center overflow-x-hidden border-b border-border/60',
            showLabels ? 'justify-start pl-2 pr-3' : 'justify-center px-0',
          )}
        >
          {showLabels ? (
            <OptimizedLink href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Logo size="sm" />
            </OptimizedLink>
          ) : (
            <OptimizedLink
              href="/"
              // Collapsed, the logo is the mark alone - no wordmark to name the
              // link - so every page with a collapsed sidebar (and the research
              // canvas, which always collapses it) had a nameless home link.
              aria-label="CoFounderBay home"
              className="flex h-11 w-11 items-center justify-center hover:opacity-80 transition-opacity"
            >
              <LogoIcon size={35} />
            </OptimizedLink>
          )}
        </div>

        {/* ── Mode Switcher ── */}
        <ModeSwitcher currentMode={mode} onModeChange={handleModeChange} expanded={showLabels} />

        {/* ── Navigation ── */}
        <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-hide', rail && 'flex flex-col items-center')}>
          {sections.map(({ section, links }) => (
            <div key={section} className={cn('mb-0.5', rail && 'flex w-full flex-col items-center')}>
              {/* nav-section-label, not plain text-xs: these uppercase headings
                  take the display steps' -2% per pass while the links under them
                  take the +2% of the body scale (see globals.css). */}
              {showLabels ? (
                <p className="nav-section-label mx-3 mb-1 mt-2.5 text-xs text-muted-foreground first:mt-1">
                  <BilingualText
                    en={section}
                    el={getNavSectionEl(section)}
                    stacked
                    primaryClassName="font-semibold uppercase tracking-widest"
                    secondaryClassName="normal-case tracking-normal"
                  />
                </p>
              ) : (
                <div className="mx-auto my-1.5 h-px w-6 bg-border/50" />
              )}
              <ul className={cn('space-y-0.5', showLabels ? 'px-2' : 'flex w-full flex-col items-center px-0')}>
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
                        showLabels ? 'gap-2 px-2 py-1.5' : cn(railSlot, 'justify-center p-0'),
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
                            chromeIcon,
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
                    <li key={`${section}-${href}`} className={rail ? 'flex w-full justify-center' : undefined}>
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
        <div className={cn('flex-shrink-0 border-t border-border/60', showLabels ? 'space-y-1 p-2' : 'flex flex-col items-center gap-0.5 px-0 py-1.5')}>
          <div className={cn(showLabels ? 'grid grid-cols-4 gap-0.5' : 'flex flex-col items-center gap-0.5')}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('shrink-0 text-muted-foreground', rail ? railSlot : 'h-8 w-8')}
              onClick={() => router.push('/search')}
              aria-label={bilingualAria('Search', 'Αναζήτηση')}
            >
              <CfbGlyph name="discover" className={chromeIcon} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('shrink-0 text-muted-foreground', rail ? railSlot : 'h-8 w-8')}
              onClick={() => setCommandOpen(true)}
              aria-label={bilingualAria('Command palette (Ctrl+K)', 'Παλέτα εντολών (Ctrl+K)')}
            >
              <Keyboard className={chromeIcon} />
            </Button>
            <NotificationsBell className={rail ? railSlot : 'h-8 w-8'} />
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
            <UserMenu variant="sidebar" rail={rail} />
          ) : (
            <div className={cn('rounded-lg bg-secondary/40', showLabels ? 'h-10' : 'mx-auto h-9 w-9')} />
          )}
          {!showLabels && (
            <div className="flex flex-col items-center gap-0.5">
              <DemoDataToggle iconOnly className={cn(railSlot, 'min-w-9 px-0')} />
              <LanguagePreferenceToggle className={railSlot} />
              <LanguageSwitcher iconOnly className={railSlot} />
              <ThemeSwitcher className={railSlot} />
            </div>
          )}
        </div>

        {mounted && !isRail && (
          <button
            type="button"
            data-sidebar-edge-toggle=""
            onClick={toggle}
            aria-expanded={showLabels}
            aria-label={bilingualAria(
              showLabels ? commonEn('collapse_sidebar') : commonEn('expand_sidebar'),
              showLabels ? commonEl('collapse_sidebar') : commonEl('expand_sidebar'),
            )}
            className="absolute right-0 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/25"
          >
            {showLabels ? (
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        )}
      </aside>
    </TooltipProvider>
  );
}
