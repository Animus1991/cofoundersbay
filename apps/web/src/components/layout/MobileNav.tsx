'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeSwitcher } from './ModeSwitcher';
import { getSectionsForMode } from './nav-modes';
import { useSidebar } from './SidebarContext';
import { useSidebarMode } from '@/hooks/use-sidebar-mode';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { cn } from '@/lib/utils';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { useStoredUser } from '@/hooks/useStoredUser';

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useSidebar();
  const [mode, setMode] = useSidebarMode();
  const { messages: unreadMessages, intros: pendingIntros } = useUnreadCounts();
  const user = useStoredUser();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const sections = useMemo(
    () => getSectionsForMode(mode, user?.role),
    [mode, user?.role],
  );

  const handleLogout = () => {
    clearPreviewDemoSession();
    window.location.href = '/login';
  };

  const badgeFor = (href: string, badgeType?: 'messages' | 'connections' | 'notifications'): number => {
    if (badgeType === 'messages' || href === '/messages') return unreadMessages;
    if (badgeType === 'connections' || href === '/connections') return pendingIntros;
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
          className="h-9 w-9 shrink-0 lg:hidden"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
        >
          <Menu className="icon-md" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-full w-[min(22rem,92vw)] flex-col p-0 gap-0"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 pr-12">
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle asChild>
              <OptimizedLink href="/" className="flex items-center">
                <Logo size="sm" />
              </OptimizedLink>
            </SheetTitle>
          </SheetHeader>
        </div>

        {user && (
          <OptimizedLink
            href="/profile"
            className="flex items-center gap-3 border-b border-border/60 px-4 py-3 hover:bg-secondary/50"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-primary-accessible font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.displayName ?? user.email ?? 'Account'}
              </p>
              {user.role && (
                <p className="truncate text-xs capitalize text-muted-foreground">{user.role}</p>
              )}
            </div>
          </OptimizedLink>
        )}

        <ModeSwitcher currentMode={mode} onModeChange={setMode} expanded />

        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3" aria-label="Mobile navigation">
          {sections.map(({ section, links }) => (
            <div key={section} className="mb-3">
              <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section}
              </p>
              <ul className="space-y-0.5">
                {links.map(({ href, label, icon: Icon, badge: badgeType }) => {
                  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
                  const badge = badgeFor(href, badgeType);
                  return (
                    <li key={`${section}-${href}`}>
                      <OptimizedLink
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary-accessible'
                            : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                        )}
                      >
                        <Icon className={cn('icon-sm shrink-0', active && 'text-primary-accessible')} />
                        <span className="truncate">{label}</span>
                        {badge > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
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

        <div className="safe-bottom shrink-0 space-y-1 border-t border-border/60 p-3">
          {user ? (
            <>
              <OptimizedLink
                href="/profile"
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                <User className="icon-md" />
                My Profile
              </OptimizedLink>
              <OptimizedLink
                href="/settings"
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                <Settings className="icon-md" />
                Settings
              </OptimizedLink>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive-accessible hover:bg-destructive/10"
              >
                <LogOut className="icon-md" />
                Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <OptimizedLink href="/login" className="flex-1">
                <Button variant="secondary" className="w-full">Sign in</Button>
              </OptimizedLink>
              <OptimizedLink href="/register" className="flex-1">
                <Button className="w-full">Sign up</Button>
              </OptimizedLink>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
