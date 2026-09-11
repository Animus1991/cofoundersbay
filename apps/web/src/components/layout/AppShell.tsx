'use client';

import { ReactNode, memo } from 'react';
import { usePathname } from 'next/navigation';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useSidebar } from './SidebarContext';
import { resolvePageHeader } from '@/lib/page-registry';
import { BilingualText } from '@/components/common/BilingualText';
import { PageContextualHelp } from '@/components/common/PageContextualHelp';
import { cn } from '@/lib/utils';
import { appShellMainClasses } from '@/lib/layout-config';
import { CfbGlyphWell } from '@/components/icons/CfbGlyph';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { TOP_BANNER_STACK } from './useTopBannerHeight';

const MemoSideNav = memo(SideNav);
const MemoTopBar = memo(TopBar);
const MemoMobileBottomNav = memo(MobileBottomNav);

type AppShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Show contextual help from page registry when available */
  showHelp?: boolean;
  /** Full-height layout (messages page) — no scroll, fills viewport */
  fullHeight?: boolean;
  /** Extra class on the content wrapper */
  contentClassName?: string;
  /**
   * Contextual Ask AI prompt. Defaults to the page title when omitted.
   * Pass `false` to hide (AI workspace, pages that already own the CTA).
   */
  askAi?: string | false;
};

export function AppShell({
  title,
  description,
  actions,
  children,
  showHelp = false,
  fullHeight = false,
  contentClassName,
  askAi,
}: AppShellProps) {
  const pathname = usePathname() ?? '/';
  const resolved = resolvePageHeader(pathname, { title, description });
  const pageTitle = resolved.title;
  const pageTitleEl = resolved.titleEl;
  const pageDescription = resolved.description;
  const pageDescriptionEl = resolved.descriptionEl;
  const { expanded, mounted } = useSidebar();
  const showAskAi = Boolean(pageTitle) && askAi !== false;
  const askAiPrompt =
    typeof askAi === 'string'
      ? askAi
      : `Help me with ${pageTitle ?? 'this page'}${pageDescription ? `: ${pageDescription}` : ''}. What should I do next?`;

  return (
    <div
      className={cn('bg-background', fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]')}
      style={{ paddingTop: TOP_BANNER_STACK }}
    >
      {/* Skip link lives once in app/layout.tsx so it is never duplicated in the tab order. */}

      {/* Fixed left sidebar — hides itself on < lg via hidden lg:flex */}
      <MemoSideNav />

      {/* Main column — offset by sidebar width on lg+ */}
      <div
        className={cn(
          'flex min-w-0 flex-col',
          fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]',
          'transition-[margin-left] duration-200 ease-out',
          (mounted ? expanded : true) ? 'lg:ml-[15rem]' : 'lg:ml-[4.25rem]',
        )}
      >
        <MemoTopBar />

        {fullHeight ? (
          <main
            id="main-content"
            // Keeps both sides: our tabIndex/focus styling (this is the skip-link
            // target, so it must be focusable without painting an outline ring),
            // plus their min-h-0 flex fix and the mobile clearance that stops the
            // last row hiding behind MobileBottomNav.
            tabIndex={-1}
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden focus:outline-none',
              'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0',
              contentClassName,
            )}
          >
            {children}
          </main>
        ) : (
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(appShellMainClasses, 'mx-auto max-w-shell', contentClassName)}
          >
            <div className="space-y-6">
              {(pageTitle || pageDescription || actions || showAskAi) && (
                <section className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm sm:px-5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <CfbGlyphWell href={pathname} size="md" />
                    <div className="min-w-0">
                      {pageTitle && (
                        <h1 className="text-balance text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                          <BilingualText en={pageTitle} el={pageTitleEl} />
                        </h1>
                      )}
                      {pageDescription && (
                        <p className="mt-1 max-w-prose text-base leading-normal text-muted-foreground sm:mt-0.5 sm:text-sm">
                          <BilingualText en={pageDescription} el={pageDescriptionEl} />
                        </p>
                      )}
                    </div>
                  </div>
                  {(actions || showAskAi) && (
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      {showAskAi && (
                        <AIInsightButton prompt={askAiPrompt} variant="outline" size="sm" />
                      )}
                      {actions}
                    </div>
                  )}
                </section>
              )}
              {showHelp && <PageContextualHelp />}
              {children}
            </div>
          </main>
        )}

        <MemoMobileBottomNav />
      </div>
    </div>
  );
}
