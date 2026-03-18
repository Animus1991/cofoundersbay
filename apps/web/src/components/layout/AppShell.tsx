import { ReactNode, memo } from 'react';
import { TopNav } from './TopNav';
import { SideNav } from './SideNav';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from '@/components/common/PageTransition';

const MemoTopNav = memo(TopNav);
const MemoSideNav = memo(SideNav);
const MemoMobileBottomNav = memo(MobileBottomNav);

type AppShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-16">
      <div className="mx-auto w-full max-w-[1760px] px-4 sm:px-6 lg:px-8 pt-4">
        <MemoTopNav />
        <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
          <MemoSideNav />
          <PageTransition>
            <main id="main-content" className="space-y-5 min-w-0">
              {(title || description || actions) && (
                <section className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center">
                  <div>
                    {title && (
                      <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  {actions && <div className="flex items-center gap-2">{actions}</div>}
                </section>
              )}
              {children}
            </main>
          </PageTransition>
        </div>
      </div>
      <MemoMobileBottomNav />
    </div>
  );
}
