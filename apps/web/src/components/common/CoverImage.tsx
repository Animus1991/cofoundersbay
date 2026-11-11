'use client';

import type { ReactNode } from 'react';
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

/**
 * The same picture, small, in a row (docs §115): where a list is a column of
 * full-width rows, a 3:1 band would make each row a screen tall, so the cover
 * stands in the row's mark place instead. Without a picture, or when it fails,
 * the row's own mark shows, as before.
 */
export function CoverThumb({ src, fallback, className }: { src: string | null | undefined; fallback: ReactNode; /** Another box than the row's 64x40, e.g. the size of the marks it stands among. */ className?: string }) {
  const cover = useCoverFailed(src);
  if (!src || cover.failed) return <>{fallback}</>;
  return (
    <img
      ref={cover.ref}
      onError={cover.onError}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      data-cover-thumb=""
      data-card-mark=""
      className={cn('shrink-0 rounded-lg object-cover', className ?? 'h-10 w-16')}
    />
  );
}
