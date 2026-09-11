import { Skeleton } from '@/components/ui/skeleton';

export default function FundraisingLoading() {
  return (
    <div className="min-h-screen pb-20 lg:pb-10">
      <div className="mx-auto w-full max-w-[1638px] px-4 sm:px-6 lg:px-8 pt-4 space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-3.5 shadow-sm">
          <div className="space-y-1.5"><Skeleton className="h-5 w-32" /><Skeleton className="h-3.5 w-56" /></div>
          <div className="flex gap-2"><Skeleton className="h-9 w-28 rounded-lg" /><Skeleton className="h-9 w-24 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-3.5 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <div className="space-y-1.5"><Skeleton className="h-5 w-14" /><Skeleton className="h-3 w-20" /></div>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
