'use client';

import { ReactNode, memo } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useSidebar } from './SidebarContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

const MemoSideNav = memo(SideNav);
const MemoTopBar = memo(TopBar);
const MemoMobileBottomNav = memo(MobileBottomNav);

type AppShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Full-height layout (messages page) — no scroll, fills viewport */
  fullHeight?: boolean;
  /** Extra class on the content wrapper */
  contentClassName?: string;
};

export function AppShell({
  title,
  description,
  actions,
  children,
  fullHeight = false,
  contentClassName,
}: AppShellProps) {
  const { expanded, mounted } = useSidebar();
  const user = useCurrentUser();
  const isDemo = user?.email === 'demo@cofounderbay.com';

  return (
    <div className={cn('bg-background', fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      {/* Fixed left sidebar — hides itself on < lg via hidden lg:flex */}
      <MemoSideNav />

      {/* Demo mode banner — full width, above content column */}
      {isDemo && (
        <div
          className={cn(
            'fixed top-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-2',
            'bg-amber-500/95 text-amber-950 text-[13px] font-medium backdrop-blur-sm shadow-sm',
            'transition-[margin-left] duration-200 ease-out',
            (mounted ? expanded : true) ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
            'left-0 lg:left-auto',
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Demo mode — changes are not saved and data resets periodically.</span>
          </div>
          <Link
            href="/register"
            className="shrink-0 rounded-md bg-amber-900/15 px-2.5 py-0.5 text-[12px] font-semibold hover:bg-amber-900/25 transition-colors"
          >
            Create free account
          </Link>
        </div>
      )}

      {/* Main column — offset by sidebar width on lg+ */}
      <div
        className={cn(
          'flex flex-col overflow-x-clip',
          fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen',
          'transition-[margin-left] duration-200 ease-out',
          (mounted ? expanded : true) ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
          isDemo && 'pt-9',
        )}
      >
        {/* Sticky top bar — always rendered once */}
        <MemoTopBar />

        {/* Page body */}
        {fullHeight ? (
          <main
            id="main-content"
            className={cn('flex flex-col flex-1 overflow-hidden', contentClassName)}
          >
            {children}
          </main>
        ) : (
          <main
            id="main-content"
            className={cn(
              'flex-1 mx-auto w-full max-w-screen-2xl',
              'px-4 sm:px-6 lg:px-8',
              'pt-4 pb-24 lg:pb-10',
              contentClassName,
            )}
          >
            <div className="space-y-5">
              {(title || description || actions) && (
                <section className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-card px-5 py-3.5 shadow-sm lg:flex-row lg:items-center">
                  <div>
                    {title && (
                      <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </section>
              )}
              {children}
            </div>
          </main>
        )}

        {/* Mobile bottom nav — hides itself on lg+ via lg:hidden */}
        <MemoMobileBottomNav />
      </div>
    </div>
  );
}
