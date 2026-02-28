import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { SideNav } from './SideNav';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from '@/components/common/PageTransition';

type AppShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-hero-radial pb-20 lg:pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6">
        <TopNav />
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <SideNav />
          <PageTransition>
            <main className="space-y-6">
              {(title || description || actions) && (
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-glow-sm backdrop-blur lg:flex-row lg:items-center">
                  <div>
                    {title && (
                      <h1 className="font-display text-2xl font-semibold text-foreground">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  {actions && <div className="flex items-center gap-3">{actions}</div>}
                </section>
              )}
              {children}
            </main>
          </PageTransition>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
