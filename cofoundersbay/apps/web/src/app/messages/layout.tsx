import { ReactNode } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-hero-radial overflow-hidden">
      <div className="mx-auto w-full max-w-[1900px] px-4 sm:px-6 lg:px-8 pt-6 flex-shrink-0">
        <TopNav />
      </div>
      <div className="flex-1 overflow-hidden mx-auto w-full max-w-[1900px] px-4 sm:px-6 lg:px-8 mt-6 pb-20 lg:pb-0">
        <div className="h-full rounded-2xl border border-border/60 bg-card/70 shadow-glow-sm backdrop-blur overflow-hidden">
          {children}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
