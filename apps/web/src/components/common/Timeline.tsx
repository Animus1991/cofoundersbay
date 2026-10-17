import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A history as GitHub's Timeline draws one: a hairline down the left, a mark
 * on it per event, and beside each mark what happened and when. The current
 * state sits first (`current`), so the reader sees where things are before
 * how they got there. Marks are neutral; the current one takes the accent.
 */
export type TimelineEvent = {
  id: string;
  title: ReactNode;
  /** When, already formatted (RelativeTime or a date). */
  when?: ReactNode;
  /** One line under the title: what changed, by whom. */
  detail?: ReactNode;
  current?: boolean;
};

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  if (events.length === 0) return null;
  return (
    <ol className={cn('relative ml-1.5 border-l border-border pl-4', className)} data-timeline="">
      {events.map((e) => (
        <li key={e.id} className="relative pb-4 last:pb-0">
          <span
            aria-hidden="true"
            className={cn(
              'absolute -left-[1.3125rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background',
              e.current ? 'bg-primary' : 'bg-border',
            )}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className={cn('text-sm', e.current ? 'font-medium text-foreground' : 'text-foreground')}>{e.title}</p>
            {e.when ? <span className="text-2xs text-muted-foreground tabular-nums">{e.when}</span> : null}
          </div>
          {e.detail ? <div className="mt-0.5 text-xs text-muted-foreground">{e.detail}</div> : null}
        </li>
      ))}
    </ol>
  );
}
