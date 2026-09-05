'use client';

import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeSwitcher } from './ModeSwitcher';
import { getActiveNavHref, getSectionsForMode } from './nav-modes';
import { useSidebar } from './SidebarContext';
import { useSidebarMode } from '@/hooks/use-sidebar-mode';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { getNavLabelEl, getNavSectionEl } from '@/lib/i18n/strings-nav';
import { cn } from '@/lib/utils';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { useStoredUser } from '@/hooks/useStoredUser';

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, mobileNavId, setMobileNavOpen } = useSidebar();
  const [mode, setMode] = useSidebarMode();
  const { messages: unreadMessages, intros: pendingIntros, notifications: unreadNotifications } = useUnreadCounts();
  const user = useStoredUser();
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const sections = useMemo(
    () => getSectionsForMode(mode, user?.role),
    [mode, user?.role],
  );
  const activeHref = getActiveNavHref(pathname, sections);

  const handleLogout = () => {
    clearPreviewDemoSession();
    window.location.href = '/login';
  };

  const closeOnNavigate = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest('a[href]')) setMobileNavOpen(false);
  };

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
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 lg:hidden"
          aria-label={bilingualAria('Open navigation', 'Άνοιγμα πλοήγησης')}
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavOpen ? mobileNavId : undefined}
        >
          <Menu className="icon-md" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        id={mobileNavId}
        side="left"
        className="flex h-[100dvh] w-[min(22rem,92vw)] flex-col gap-0 overflow-hidden p-0"
        onClickCapture={closeOnNavigate}
        onOpenAutoFocus={() => {
          openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          if (openerRef.current?.isConnected) {
            event.preventDefault();
            openerRef.current.focus();
          }
        }}
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 pr-14 safe-top">
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle asChild>
              <OptimizedLink href="/" className="flex min-h-11 items-center rounded-md focus-ring">
                <Logo size="sm" />
              </OptimizedLink>
            </SheetTitle>
            <SheetDescription className="sr-only">
              <BilingualText en="Choose Work, Explore or Account to browse destinations." el="Επιλέξτε Εργασία, Εξερεύνηση ή Λογαριασμό για να δείτε τις διαθέσιμες σελίδες." />
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {user && (
            <OptimizedLink
              href="/profile"
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 hover:bg-secondary/50 focus-ring"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/15 text-primary-accessible font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-foreground">
                  {user.displayName ?? user.email ?? <BilingualText en="Account" el="Λογαριασμός" />}
                </p>
                {user.role && (
                  <p className="break-words text-xs capitalize text-muted-foreground">{user.role}</p>
                )}
              </div>
            </OptimizedLink>
          )}

          <ModeSwitcher currentMode={mode} onModeChange={setMode} expanded />

          <nav className="px-2 py-3" aria-label={bilingualAria('Mobile navigation', 'Πλοήγηση κινητού')}>
            {sections.map(({ section, links }) => (
              <div key={section} className="mb-3">
                <p className="px-3 pb-1 text-xs text-muted-foreground">
                  <BilingualText
                    en={section}
                    el={getNavSectionEl(section)}
                    stacked
                    primaryClassName="font-semibold uppercase tracking-wider whitespace-normal"
                    secondaryClassName="whitespace-normal"
                  />
                </p>
                <ul className="space-y-0.5">
                  {links.map(({ href, label, icon: Icon, badge: badgeType }) => {
                    const active = activeHref === href;
                    const badge = badgeFor(href, badgeType);
                    return (
                      <li key={`${section}-${href}`}>
                        <OptimizedLink
                          href={href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-ring',
                            active
                              ? 'bg-primary/10 text-primary-accessible'
                              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                          )}
                        >
                          <Icon className="icon-sm shrink-0" aria-hidden="true" />
                          <BilingualText en={label} el={getNavLabelEl(href)} stacked className="min-w-0 flex-1" primaryClassName="whitespace-normal break-words" secondaryClassName="whitespace-normal break-words" />
                          {badge > 0 && (
                            <>
                              <span aria-hidden="true" className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                                {badge > 99 ? '99+' : badge}
                              </span>
                              <span className="sr-only">
                                {badgeType === 'connections' || href === '/connections'
                                  ? bilingualAria(`${badge} pending requests`, `${badge} εκκρεμή αιτήματα`)
                                  : bilingualAria(`${badge} unread`, `${badge} αδιάβαστα`)}
                              </span>
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

          <div className="safe-bottom space-y-1 border-t border-border/60 p-3">
            {user ? (
              <>
                <OptimizedLink href="/profile" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus-ring">
                  <User className="icon-md shrink-0" aria-hidden="true" />
                  <BilingualText en="My Profile" el="Το προφίλ μου" stacked />
                </OptimizedLink>
                <OptimizedLink href="/settings" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus-ring">
                  <Settings className="icon-md shrink-0" aria-hidden="true" />
                  <BilingualText en="Settings" el="Ρυθμίσεις" stacked />
                </OptimizedLink>
                <button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive-accessible hover:bg-destructive/10 focus-ring">
                  <LogOut className="icon-md shrink-0" aria-hidden="true" />
                  <BilingualText en="Sign out" el="Αποσύνδεση" stacked />
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="secondary" className="h-auto min-h-11 py-2">
                  <OptimizedLink href="/login"><BilingualText en="Sign in" el="Σύνδεση" stacked /></OptimizedLink>
                </Button>
                <Button asChild className="h-auto min-h-11 py-2">
                  <OptimizedLink href="/register"><BilingualText en="Sign up" el="Εγγραφή" stacked secondaryClassName="text-primary-foreground" /></OptimizedLink>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
