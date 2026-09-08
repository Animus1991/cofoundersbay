import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesLoading() {
  return (
    <AppShell fullHeight contentClassName="min-h-0" askAi={false}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-2 border-b border-border/60 px-3 py-3 sm:px-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="hidden h-4 w-64 sm:block" />
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden md:mx-4 md:mb-4 md:mt-3 md:rounded-2xl md:border md:border-border/60">
          <div className="flex w-full flex-col md:w-80 lg:w-96 md:border-r md:border-border/60">
            <div className="space-y-3 border-b border-border/60 p-3">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="flex-1 space-y-1 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-10 shrink-0" />
                    </div>
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden min-h-0 flex-1 flex-col md:flex">
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex-1 space-y-4 p-6">
              {[false, true, false, false, true, false].map((isMine, i) => (
                <div key={i} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                  {!isMine && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
                  <Skeleton
                    className={`h-10 rounded-2xl ${isMine ? 'w-48 rounded-tr-sm' : 'w-64 rounded-tl-sm'}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-border/60 p-4">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
