'use client';

import { ReactNode, memo } from 'react';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useSidebar } from './SidebarContext';
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

  return (
    <div className={cn('bg-background', fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      {/* Fixed left sidebar — hides itself on < lg via hidden lg:flex */}
      <MemoSideNav />

      {/* Main column — offset by sidebar width on lg+ */}
      <div
        className={cn(
          'flex flex-col overflow-x-clip',
          fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen',
          'transition-[margin-left] duration-200 ease-out',
          (mounted ? expanded : true) ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
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
