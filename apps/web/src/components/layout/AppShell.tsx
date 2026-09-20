'use client';

import { ReactNode, createContext, useContext, memo } from 'react';
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
import { CfbGlyph, glyphForHref } from '@/components/icons/CfbGlyph';
import { AIComposer } from '@/components/ai/AIComposer';
import { CommandPaletteHost } from './CommandPaletteHost';
import { TOP_BANNER_STACK } from './useTopBannerHeight';

const MemoSideNav = memo(SideNav);
const MemoTopBar = memo(TopBar);
const MemoMobileBottomNav = memo(MobileBottomNav);

/**
 * True inside an <AppShellFrame>. Lets a page keep writing `<AppShell title=…>`
 * while the chrome actually lives in the segment layout above it — adopted
 * from origin/claude/project-audit-upgrade-y2ebnr (029642e, 7c9c97d).
 */
const InAppShellFrame = createContext(false);

export type AppShellFrameProps = {
  children: ReactNode;
  /** Full-height layout (messages) — no page scroll, fills the viewport. */
  fullHeight?: boolean;
  /** Extra class on the <main> element. */
  contentClassName?: string;
};

/**
 * The persistent application chrome: sidebar, top bar, mobile nav and the
 * <main> landmark.
 *
 * Rendered by a segment `layout.tsx` rather than by each page, so navigating
 * between two pages in the same section no longer unmounts and remounts the
 * whole navigation — the sidebar keeps its scroll position, its queries are
 * not refetched, and `loading.tsx` renders inside the shell instead of
 * replacing it.
 */
export function AppShellFrame({
  children,
  fullHeight = false,
  contentClassName,
}: AppShellFrameProps) {
  const { expanded, mounted } = useSidebar();

  return (
    <InAppShellFrame.Provider value={true}>
      <CommandPaletteHost>
      <div
        className={cn('bg-background', fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]')}
        style={{ paddingTop: TOP_BANNER_STACK }}
      >
        {/* Skip link lives once in app/layout.tsx so it is never duplicated in the tab order. */}

        {/* Fixed left sidebar — rail from `sm`, drawer from `lg`; hidden below `sm` */}
        <MemoSideNav />

        {/* Main column — offset by sidebar width on lg+ */}
        <div
          className={cn(
            'flex min-w-0 flex-col',
            fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]',
            'transition-[margin-left] duration-200 ease-out',
            // Rail from `sm` (68px), drawer from `lg`. Below `sm` the nav is the
            // bottom bar and the column takes the full width.
            'sm:ml-[4.25rem]',
            (mounted ? expanded : true) ? 'lg:ml-[15rem]' : 'lg:ml-[4.25rem]',
          )}
        >
          <MemoTopBar />

          {fullHeight ? (
            <main
              id="main-content"
              // tabIndex keeps this the skip-link target: focusable without
              // painting an outline ring.
              tabIndex={-1}
              className={cn(
                'flex min-h-0 flex-1 flex-col overflow-hidden focus:outline-none',
                // MobileBottomNav stops at `sm`, so its clearance does too.
                'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:pb-0',
                contentClassName,
              )}
            >
              {children}
            </main>
          ) : (
            <main
              id="main-content"
              tabIndex={-1}
              // No width cap. The column is already offset by the sidebar's own
              // width, so "full width" here means exactly the space the sidebar
              // leaves, never over it.
              className={cn(appShellMainClasses, contentClassName)}
            >
              {children}
            </main>
          )}

          <MemoMobileBottomNav />
        </div>
      </div>
      </CommandPaletteHost>
    </InAppShellFrame.Provider>
  );
}

type AppShellProps = {
  title?: string;
  description?: string;
  /**
   * Greek heading, for the rare page whose header cannot be a constant — a
   * count folded into the sentence, say. Everywhere else the pair lives in the
   * page registry and neither of these is passed: `resolvePageHeader` already
   * took overrides for them, but there was no prop to supply one, so a page
   * with a dynamic English description had no way to make the Greek match.
   */
  titleEl?: string;
  descriptionEl?: string;
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

/**
 * Page-level shell.
 *
 * Inside an <AppShellFrame> (i.e. the segment layout already mounted the
 * chrome) this renders only the page header and body, so every existing
 * `<AppShell title=…>` call site keeps working unchanged and never produces a
 * second sidebar. Outside a frame it renders the frame itself, which is how
 * pages in sections that have no layout frame continue to work.
 */
export function AppShell({
  title,
  description,
  titleEl,
  descriptionEl,
  actions,
  children,
  showHelp = false,
  fullHeight = false,
  contentClassName,
  askAi,
}: AppShellProps) {
  const insideFrame = useContext(InAppShellFrame);
  const pathname = usePathname() ?? '/';
  const resolved = resolvePageHeader(pathname, { title, description, titleEl, descriptionEl });
  const pageTitle = resolved.title;
  const pageTitleEl = resolved.titleEl;
  const pageDescription = resolved.description;
  const pageDescriptionEl = resolved.descriptionEl;
  const showAskAi = Boolean(pageTitle) && askAi !== false;
  const askAiPrompt =
    typeof askAi === 'string'
      ? askAi
      : `Help me with ${pageTitle ?? 'this page'}${pageDescription ? `: ${pageDescription}` : ''}. What should I do next?`;

  const body = fullHeight ? (
    children
  ) : (
    // Inside a frame the <main> belongs to the layout above, so a page-level
    // contentClassName (e.g. overflow-x-clip on /analytics, /discover,
    // /matches, pitch-deck) lands on this wrapper instead — same clipping.
    <div className={cn('space-y-5', insideFrame && contentClassName)}>
      {(pageTitle || pageDescription || actions || showAskAi || showHelp) && (
        <header className="space-y-3">
          <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <CfbGlyph
                name={glyphForHref(pathname)}
                className="mt-1 icon-md shrink-0 text-primary-accessible"
              />
              <div className="min-w-0">
                {pageTitle && (
                  <h1 className="text-balance text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                    <BilingualText en={pageTitle} el={pageTitleEl} />
                  </h1>
                )}
                {pageDescription && (
                  <p className="mt-0.5 max-w-prose text-sm leading-snug text-muted-foreground">
                    <BilingualText
                      en={pageDescription}
                      el={pageDescriptionEl}
                      stacked
                      wrap
                      secondaryFrom="lg"
                    />
                  </p>
                )}
              </div>
            </div>
            {(showHelp || showAskAi) && (
              <div className="flex w-full min-w-0 items-center gap-2 lg:mt-0.5 lg:w-[min(100%,57.5rem)] lg:shrink-0 lg:justify-end">
                {showHelp && <PageContextualHelp compact defaultOpen={false} />}
                {showAskAi && (
                  <AIComposer
                    prompt={askAiPrompt}
                    className="w-full min-w-0"
                  />
                )}
              </div>
            )}
          </section>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      )}
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
