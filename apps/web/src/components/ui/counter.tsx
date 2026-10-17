import { cn } from '@/lib/utils';

/**
 * A count beside a label, as GitHub draws it after "Issues" or "Pull
 * requests": a small pill, so the number reads as a number and not as part of
 * the word. One shape for every tab and filter (31 tabs wrote "(3)" in
 * brackets and eight other places drew eight different badge sizes).
 *
 * Neutral is an alpha grey, so it shows on a white tab and on a grey one
 * alike (Primer's neutral counter is the same idea); it is not one of the
 * chip washes globals.css lifts off words. `attention` is for a count that
 * asks for something - unread, waiting on you.
 */
export function Counter({
  value,
  tone = 'neutral',
  className,
}: {
  value: number;
  tone?: 'neutral' | 'attention';
  className?: string;
}) {
  return (
    <span
      data-counter=""
      className={cn(
        'ml-1.5 inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full px-1.5 text-2xs font-semibold leading-none tabular-nums',
        tone === 'attention' ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.07] text-foreground',
        className,
      )}
    >
      {value}
    </span>
  );
}
