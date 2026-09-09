'use client';

import { ReactNode, createContext, useContext, memo } from 'react';
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

/**
 * True inside an <AppShellFrame>. Lets a page keep writing `<AppShell title=…>`
 * while the chrome actually lives in the segment layout above it.
 */
const InAppShellFrame = createContext(false);

type PageHeaderProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

function PageHeader({ title, description, actions }: PageHeaderProps) {
  if (!title && !description && !actions) return null;
  return (
    <section className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-card px-5 py-3.5 shadow-sm lg:flex-row lg:items-center">
      <div>
        {title && (
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        )}
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </section>
  );
}

export type AppShellFrameProps = {
  children: ReactNode;
  /** Full-height layout (messages) — no page scroll, fills the viewport. */
  fullHeight?: boolean;
  /** Extra class on the <main> element. */
  contentClassName?: string;
};

/**
 * The persistent application chrome: sidebar, demo banner, top bar, mobile nav
 * and the <main> landmark.
 *
 * Rendered by a segment `layout.tsx` rather than by each page, so navigating
 * between two pages in the same section no longer unmounts and remounts the
 * whole navigation — the sidebar keeps its scroll position, its queries are not
 * refetched, and `loading.tsx` renders inside the shell instead of replacing it.
 */
export function AppShellFrame({
  children,
  fullHeight = false,
  contentClassName,
}: AppShellFrameProps) {
  const { expanded, mounted } = useSidebar();
  const user = useCurrentUser();
  const isDemo = user?.email === 'demo@cofounderbay.com';
  const offset = (mounted ? expanded : true) ? 'lg:ml-[240px]' : 'lg:ml-[68px]';

  return (
    <InAppShellFrame.Provider value={true}>
      <div className={cn('bg-background', fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen')}>
        {/* Fixed left sidebar — hides itself on < lg via hidden lg:flex */}
        <MemoSideNav />

        {/* Demo mode banner — full width, above the content column */}
        {isDemo && (
          <div
            className={cn(
              'fixed top-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-2',
              'bg-amber-500/95 text-amber-950 text-[13px] font-medium backdrop-blur-sm shadow-sm',
              'transition-[margin-left] duration-200 ease-out',
              offset,
              'left-0 lg:left-auto',
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="icon-xs shrink-0" aria-hidden="true" />
              <span>Demo mode — changes are not saved and data resets periodically.</span>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-md bg-amber-900/15 px-2.5 py-0.5 text-xs font-semibold hover:bg-amber-900/25 transition-colors"
            >
              Create free account
            </Link>
          </div>
        )}

        {/* Main column — offset by the sidebar width on lg+ */}
        <div
          className={cn(
            'flex flex-col overflow-x-clip',
            fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen',
            'transition-[margin-left] duration-200 ease-out',
            offset,
            isDemo && 'pt-9',
          )}
        >
          <MemoTopBar />

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
              {children}
            </main>
          )}

          {/* Mobile bottom nav — hides itself on lg+ via lg:hidden */}
          <MemoMobileBottomNav />
        </div>
      </div>
    </InAppShellFrame.Provider>
  );
}

export type AppShellProps = PageHeaderProps &
  AppShellFrameProps & {
    children: ReactNode;
  };

/**
 * Page-level shell.
 *
 * Inside an <AppShellFrame> (i.e. the segment layout already mounted the
 * chrome) this renders only the page header and body, so the 130 existing
 * `<AppShell title=…>` call sites keep working unchanged and never produce a
 * second sidebar. Outside a frame it renders the frame itself, which is how
 * pages in sections that have no layout frame continue to work.
 */
export function AppShell({
  title,
  description,
  actions,
  children,
  fullHeight = false,
  contentClassName,
}: AppShellProps) {
  const insideFrame = useContext(InAppShellFrame);

  const body = (
    <div className={cn(fullHeight ? 'flex min-h-0 flex-1 flex-col' : 'space-y-5')}>
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );

  if (insideFrame) return body;

  return (
    <AppShellFrame fullHeight={fullHeight} contentClassName={contentClassName}>
      {body}
    </AppShellFrame>
  );
}
