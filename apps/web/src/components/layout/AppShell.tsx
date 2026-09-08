'use client';

import { ReactNode, memo } from 'react';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { useI18n } from '@/components/common/I18nProvider';

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
  fullHeight = false,
  contentClassName,
  askAi,
}: AppShellProps) {
  const { expanded, mounted } = useSidebar();
  const { t } = useI18n();
  const showAskAi = Boolean(title) && askAi !== false;
  const displayTitle = title ? t(title) : title;
  const displayDescription = description ? t(description) : description;
  const askAiPrompt =
    typeof askAi === 'string'
      ? askAi
      : `Help me with ${title ?? 'this page'}${description ? `: ${description}` : ''}. What should I do next?`;

  return (
    <div className={cn('bg-background', fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]')}>
      <MemoSideNav />

      <div
        className={cn(
          'flex min-w-0 flex-col',
          fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]',
          'transition-[margin-left] duration-200 ease-out',
          (mounted ? expanded : true) ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
        )}
      >
        <MemoTopBar />

        {fullHeight ? (
          <main
            id="main-content"
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden',
              'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0',
              contentClassName,
            )}
          >
            {children}
          </main>
        ) : (
          <main
            id="main-content"
            className={cn(
              'flex-1 mx-auto w-full max-w-screen-2xl',
              'px-3 sm:px-6 lg:px-8',
              'pt-4 pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] lg:pb-12',
              contentClassName,
            )}
          >
            <div className="space-y-6">
              {(title || description || actions || showAskAi) && (
                <section className="cfb-page-header">
                  <div className="min-w-0 space-y-1">
                    {displayTitle && (
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {displayTitle}
                      </h1>
                    )}
                    {displayDescription && (
                      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{displayDescription}</p>
                    )}
                  </div>
                  {(actions || showAskAi) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {showAskAi && (
                        <AIInsightButton prompt={askAiPrompt} variant="outline" size="sm" />
                      )}
                      {actions}
                    </div>
                  )}
                </section>
              )}
              {children}
            </div>
          </main>
        )}

        <MemoMobileBottomNav />
      </div>
    </div>
  );
}
