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
  /** `lg` is the hero's square (featured events); `md` is every other card's. */
  size?: 'md' | 'lg';
  className?: string;
}) {
  const fmtDate = useDateFormat();
  const day = date instanceof Date ? date : new Date(date);
  const fullDate = fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div data-card-mark="" className={cn('absolute', size === 'lg' ? 'left-4 top-4' : 'left-3 top-3', className)}>
      <div className={cn('flex flex-col items-center justify-center rounded-xl bg-card text-center shadow-sm', size === 'lg' ? 'h-12 w-12' : 'h-11 w-11')}>
        <span className={cn('font-bold tabular-nums text-primary-accessible', size === 'lg' ? 'text-base' : 'text-sm')} aria-hidden="true">
          {day.getDate()}
        </span>
        <span className="card-meta leading-none text-muted-foreground" aria-hidden="true">
          {fmtDate(day, { month: 'short' })}
        </span>
      </div>
      <span className="sr-only">{fullDate}</span>
    </div>
  );
}
