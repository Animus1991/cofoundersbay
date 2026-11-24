'use client';

import { usePathname } from 'next/navigation';
import { deriveTitleSticker } from '@/lib/title-sticker';
import { STICKER_BAND_BG } from '@/components/dashboard/SectionSticker';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The loading echo of the AppShell header band (B1.2): the same rounded
 * tinted block in the route's own tint, holding a sticker well and the
 * title's bar, so the skeleton and the settled page occupy the same shape
 * and nothing jumps when the header arrives.
 */
export function HeaderBandSkeleton({ className }: { className?: string }) {
  const pathname = usePathname() ?? '/';
  const tint = deriveTitleSticker(pathname)?.tint ?? 'neutral';
  return (
    <div
      data-header-band-skeleton=""
      className={cn('rounded-2xl px-3 py-3 sm:rounded-3xl sm:px-6 sm:py-5', STICKER_BAND_BG[tint], className)}
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-2xl sm:h-11 sm:w-11" />
        <Skeleton className="h-6 w-44 max-w-[60%]" />
      </div>
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
    </div>
  );
}
