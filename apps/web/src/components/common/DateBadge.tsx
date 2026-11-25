'use client';

import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { cn } from '@/lib/utils';

/**
 * The corner date mark a card draws on its visual (docs §130.3, §134): a
 * solid card square — day over the short month — that reads on any photo or
 * tinted wash, with the full date in an sr-only line for screen readers.
 * EventCard's badge, shared so the catalogue family draws the same one.
 */
export function DateBadge({ date, size = 'md', className }: {
  date: Date | string | number;
  /** `lg` is the hero's square (featured events); `md` is every other card's; `sm` a strip's 160px cover. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const fmtDate = useDateFormat();
  const day = date instanceof Date ? date : new Date(date);
  const fullDate = fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  // Sizes in px (docs §142): rem boxes shrink under the 82% desktop root, and
  // `.card-meta`'s line-height beat `leading-none`, so the month spilled out
  // of the square (2px on /events, a whole line on the home strip).
  return (
    <div data-card-mark="" className={cn('absolute', size === 'lg' ? 'left-4 top-4' : size === 'sm' ? 'left-2 top-2' : 'left-3 top-3', className)}>
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-[3px] rounded-xl bg-card text-center leading-none shadow-sm',
          size === 'lg' ? 'h-[54px] w-[54px]' : size === 'sm' ? 'h-[42px] w-[42px]' : 'h-[46px] w-[46px]',
        )}
      >
        <span className={cn('font-bold tabular-nums leading-none text-primary-accessible', size === 'lg' ? 'text-[19px]' : size === 'sm' ? 'text-[15px]' : 'text-[16px]')} aria-hidden="true">
          {day.getDate()}
        </span>
        <span className="text-[11px] font-medium leading-none text-muted-foreground" aria-hidden="true">
          {fmtDate(day, { month: 'short' }).replace('.', '')}
        </span>
      </div>
      <span className="sr-only">{fullDate}</span>
    </div>
  );
}
