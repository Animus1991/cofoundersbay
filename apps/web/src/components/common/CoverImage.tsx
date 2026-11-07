'use client';

import { useCoverFailed } from '@/hooks/useCoverFailed';
import { cn } from '@/lib/utils';

/**
 * A picture across the top of a card (docs §115). The room is held before it
 * loads, so the page does not jump; a picture that fails leaves no gap, and the
 * card closes up like one that never had a picture. On a phone it stops at
 * 112px, so adding pictures does not add screens. Decorative: the name is
 * written beside it, so the `alt` is empty.
 */
export function CoverImage({ src, eager = false, className }: { src: string | null | undefined; eager?: boolean; className?: string }) {
  const cover = useCoverFailed(src);
  if (!src || cover.failed) return null;
  return (
    <img
      ref={cover.ref}
      onError={cover.onError}
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      data-cover=""
      className={cn('aspect-[3/1] w-full object-cover max-sm:h-28 max-sm:aspect-auto', className)}
    />
  );
}
