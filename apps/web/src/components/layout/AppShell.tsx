'use client';

import { ReactNode, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useSidebar } from './SidebarContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { resolvePageHeader } from '@/lib/page-registry';
import { BilingualText } from '@/components/common/BilingualText';
import { PageContextualHelp } from '@/components/common/PageContextualHelp';
import { bilingualAria } from '@/lib/i18n/format';
import { commonEn, commonEl } from '@/lib/i18n/strings-common';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { cn } from '@/lib/utils';
import { appShellMainClasses } from '@/lib/layout-config';

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
};

export function AppShell({
  title,
  description,
  actions,
  children,
  showHelp = false,
  fullHeight = false,
  contentClassName,
}: AppShellProps) {
  const pathname = usePathname() ?? '/';
  const resolved = resolvePageHeader(pathname, { title, description });
  const pageTitle = resolved.title;
  const pageTitleEl = resolved.titleEl;
  const pageDescription = resolved.description;
  const pageDescriptionEl = resolved.descriptionEl;
  const { expanded, mounted } = useSidebar();
  const user = useCurrentUser();
  const isDemo = user?.email === 'demo@cofounderbay.com';
  const { primary: primaryLang } = useLanguagePreference();
  const skipLabel =
    primaryLang === 'el' ? commonEl('skip_to_content') : commonEn('skip_to_content');

  return (
    <div className={cn('bg-background', fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      {/* Skip link — first focusable element; lets keyboard users bypass nav (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="skip-to-content"
        aria-label={bilingualAria(commonEn('skip_to_content'), commonEl('skip_to_content'))}
      >
        {skipLabel}
      </a>

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
            <span>
              <BilingualText
                en={commonEn('demo_mode_banner')}
                el={commonEl('demo_mode_banner')}
              />
            </span>
          </div>
          <Link
            href="/register"
            className="shrink-0 rounded-md bg-amber-900/15 px-2.5 py-0.5 text-[12px] font-semibold hover:bg-amber-900/25 transition-colors"
          >
            <BilingualText
              en={commonEn('create_free_account')}
              el={commonEl('create_free_account')}
            />
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
            tabIndex={-1}
            className={cn('flex flex-col flex-1 overflow-hidden focus:outline-none', contentClassName)}
          >
            {children}
          </main>
        ) : (
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(appShellMainClasses, contentClassName)}
          >
            <div className="space-y-5">
              {(pageTitle || pageDescription || actions) && (
                <section className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-card px-5 py-3.5 shadow-sm lg:flex-row lg:items-center">
                  <div>
                    {pageTitle && (
                      <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        <BilingualText en={pageTitle} el={pageTitleEl} />
                      </h1>
                    )}
                    {pageDescription && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <BilingualText en={pageDescription} el={pageDescriptionEl} />
                      </p>
                    )}
                  </div>
                  {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </section>
              )}
              {showHelp && <PageContextualHelp />}
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
