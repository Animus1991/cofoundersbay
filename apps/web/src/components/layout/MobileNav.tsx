'use client';

import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, User, Settings, Bot, ChevronDown } from 'lucide-react';
import { LanguagePanel } from '@/components/common/LanguageSwitcher';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getActiveNavHref, getUnifiedSections } from './nav-modes';
import { useNavSections } from './useNavSections';
import { useSidebar } from './SidebarContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { getNavLabelEl, getNavSectionEl } from '@/lib/i18n/strings-nav';
import { cn, initialsOf } from '@/lib/utils';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { NavIcon, sectionNavGlyphs } from '@/components/icons/CfbGlyph';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useI18n } from '@/components/common/I18nProvider';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { mobileNavOpen, mobileNavId, setMobileNavOpen } = useSidebar();
  const { messages: unreadMessages, intros: pendingIntros, notifications: unreadNotifications } = useUnreadCounts();
  const user = useStoredUser();
  const role = useRoleOptional();
  const primaryRole = role?.primaryRole;
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  /**
   * Escape closes the drawer.
   *
   * Radix already offers this, and it does not arrive. Measured in Chromium:
   * opening this drawer puts two dismissable layers on the stack, and
   * `DismissableLayer` only acts on Escape for the highest one —
   * `if (index !== context.layers.size - 1) return`. The drawer is the lower
   * layer, so the first Escape is consumed by the one above it (which also
   * calls `preventDefault`, which is why nothing downstream could recover
   * it), and only a *second* press reaches the drawer. Close button and
   * outside-click both work, so the state path is sound; it is the keyboard
   * route alone that was lost.
   *
   * This listener is on the bubble phase, so it runs after Radix's capture
   * handler has had its chance and regardless of where the drawer sits in
   * the stack. `onCloseAutoFocus` still returns focus to the opener.
   */
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen, setMobileNavOpen]);

  // The sidebar's single list (docs §64): every destination, each section
  // opening in place, the open state shared with the desktop sidebar.
  const sections = useMemo(
    () => getUnifiedSections(primaryRole ?? user?.role),
    [primaryRole, user?.role],
  );
  const glyphs = useMemo(() => sectionNavGlyphs(sections), [sections]);
  const activeHref = getActiveNavHref(pathname, sections);
  const { isOpen, toggle: toggleSection } = useNavSections(sections, activeHref);

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
    (user?.displayName ? initialsOf(user.displayName) : '') ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 lg:hidden"
          aria-label={t('Open navigation')}
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
        <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-border px-4 pr-14 safe-top">
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle asChild>
              <OptimizedLink href="/" className="flex min-h-11 items-center rounded-xl focus-ring">
                <Logo size="sm" />
              </OptimizedLink>
            </SheetTitle>
            <SheetDescription className="sr-only">
              <BilingualText
                en="Every destination, by section. A section's name opens or closes it."
                el="Όλοι οι προορισμοί, ανά ενότητα. Το όνομα μιας ενότητας την ανοίγει ή την κλείνει."
              />
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {user && (
            <OptimizedLink
              href="/profile"
              data-sidebar-control="account"
              className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-secondary/50 focus-ring"
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

          <div className="border-b border-border px-3 py-3">
            <LanguagePanel sidebar />
          </div>

          <nav className="px-2 py-3" data-keep-icon="" data-sidenav="" aria-label={t('Primary mobile navigation')}>
            {sections.map((sectionData, sectionIndex) => {
              const { id, section, links, group } = sectionData;
              const open = isOpen(sectionData);
              const listId = `mobilenav-${id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
              const waiting = open ? 0 : links.reduce((sum, link) => sum + badgeFor(link.href, link.badge), 0);
              const startsGroup = sectionIndex > 0 && sections[sectionIndex - 1].group !== group;
              return (
              <div key={id} className={cn('mb-2', startsGroup && 'mt-1 border-t border-border/60 pt-2')}>
                <button
                  type="button"
                  onClick={() => toggleSection(sectionData)}
                  aria-expanded={open}
                  aria-controls={listId}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 pb-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-ring"
                  data-sidebar-control={section === 'Dashboard' ? 'section' : undefined}
                >
                  <span className="min-w-0 flex-1">
                    <BilingualText
                      en={section}
                      el={getNavSectionEl(section)}
                      stacked
                      primaryClassName="font-semibold uppercase tracking-wider whitespace-normal"
                      secondaryClassName="whitespace-normal"
                    />
                  </span>
                  {waiting > 0 ? (
                    <>
                      <span aria-hidden="true" className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                        {waiting > 99 ? '99+' : waiting}
                      </span>
                      <span className="sr-only">{bilingualAria(`${waiting} unread`, `${waiting} αδιάβαστα`)}</span>
                    </>
                  ) : null}
                  <ChevronDown className={cn('icon-sm shrink-0 transition-transform', !open && '-rotate-90')} aria-hidden="true" />
                </button>
                {open ? (
                <ul id={listId} className="space-y-0.5">
                  {links.map(({ href, label, icon: Icon, badge: badgeType }, linkIndex) => {
                    const active = activeHref === href;
                    const badge = badgeFor(href, badgeType);

                    // Remote introduced the /ai hub; use the Bot lucide glyph for
                    // AI Assistant / Ask AI entries.
                    const FallbackIcon = href === '/ai' ? Bot : Icon;

                    return (
                      <li key={`${section}-${href}`}>
                        <OptimizedLink
                          href={href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-ring',
                            active
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                          )}
                        >
                          <NavIcon
                            href={href}
                            name={glyphs[sectionIndex]?.[linkIndex] ?? null}
                            fallback={FallbackIcon}
                            className="icon-sm shrink-0"
                          />
                          <BilingualText
                            en={label}
                            el={getNavLabelEl(href)}
                            stacked
                            className="min-w-0 flex-1"
                            primaryClassName="whitespace-normal break-words"
                            secondaryClassName="whitespace-normal break-words"
                          />
                          {badge > 0 && (
                            <>
                              <span
                                aria-hidden="true"
                                className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground"
                              >
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
                ) : null}
              </div>
              );
            })}
          </nav>

          <div className="safe-bottom space-y-1 border-t border-border p-3">
            {user ? (
              <>
                <OptimizedLink
                  href="/profile"
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus-ring"
                >
                  <User className="icon-md shrink-0" aria-hidden="true" />
                  <BilingualText en="My Profile" el="Το προφίλ μου" stacked />
                </OptimizedLink>
                <OptimizedLink
                  href="/settings"
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus-ring"
                >
                  <Settings className="icon-md shrink-0" aria-hidden="true" />
                  <BilingualText en="Settings" el="Ρυθμίσεις" stacked />
                </OptimizedLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive-accessible hover:bg-destructive/10 focus-ring"
                >
                  <LogOut className="icon-md shrink-0" aria-hidden="true" />
                  <BilingualText en="Sign out" el="Αποσύνδεση" stacked />
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="secondary" className="h-auto min-h-11 py-2">
                  <OptimizedLink href="/login">
                    <BilingualText en="Sign in" el="Σύνδεση" stacked />
                  </OptimizedLink>
                </Button>
                <Button asChild className="h-auto min-h-11 py-2">
                  <OptimizedLink href="/register">
                    <BilingualText
                      en="Sign up"
                      el="Εγγραφή"
                      stacked
                      secondaryClassName="text-primary-foreground"
                    />
                  </OptimizedLink>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
