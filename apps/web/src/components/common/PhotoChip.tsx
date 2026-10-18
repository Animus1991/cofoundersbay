import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A label that sits on a photo (a community's category, an event's format).
 *
 * The tinted status chips are translucent by design, which is right on the
 * page and wrong on a picture: on a dark or busy cover "Technology" and
 * "Fundraising" all but vanished. This one is an opaque chip in the page's
 * own colours, with a hairline border and a soft shadow, so it reads on any
 * photo in either theme. 12px is the legibility floor (px, not rem: the
 * desktop root is 82%).
 */
export function PhotoChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2 py-0.5',
        'text-[12px] font-semibold leading-4 text-foreground shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </span>
  );
}
