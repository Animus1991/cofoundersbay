'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bilingualAria } from '@/lib/i18n/format';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';

/**
 * Contextual help block. Each page passes a unique `id` so dismissed state
 * is remembered per page in localStorage. Users can reopen via the pill button.
 *
 * The heading is bilingual like the rest of the chrome, but the body is not:
 * `children` arrives already resolved to one language. Two paragraphs rendered
 * as `English · Ελληνικά` would read as one long run-on — the inline pairing
 * that works for a label does not scale to prose.
 */
export function HelpCallout({
  id,
  title,
  titleEl,
  children,
  badge,
  defaultOpen = true,
  compact = false,
  className,
}: {
  id: string;
  title: string;
  /** Greek heading; falls back to the English one when absent. */
  titleEl?: string;
  children: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  /** Icon-only trigger when the callout is collapsed (for tight headers). */
  compact?: boolean;
  className?: string;
}) {
  const storageKey = `cfb.help.${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'closed') setOpen(false);
    if (saved === 'open') setOpen(true);
  }, [storageKey]);

  const persist = (next: boolean) => {
    setOpen(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, next ? 'open' : 'closed');
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => persist(true)}
        aria-label={bilingualAria(title, titleEl)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary-accessible transition-colors hover:bg-primary/10',
          compact && 'h-8 w-8 justify-center p-0',
          className,
        )}
      >
        <CfbGlyph name="book" className="icon-sm" />
        <span className={cn(compact && 'sr-only')}>
          <BilingualText en={title} el={titleEl} compact />
        </span>
      </button>
    );
  }

  return (
    <div
      role="note"
      aria-label={bilingualAria(title, titleEl)}
      className={cn(
        'rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 text-sm leading-relaxed shadow-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-primary-accessible">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
            <CfbGlyph name="book" className="icon-sm" />
          </span>
          <BilingualText en={title} el={titleEl} />
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-accessible">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => persist(false)}
          aria-label={bilingualAria('Dismiss help', 'Απόρριψη βοήθειας')}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {/* Decorative: the button already carries its name via aria-label. */}
          <X className="icon-sm" aria-hidden="true" />
        </button>
      </div>
      {/* Columns, rather than one column of 90ch with 413px of empty banner
          beside it.

          The 90ch cap is not arbitrary — past roughly ninety characters a line
          the eye loses the return sweep, and the full content width here is
          1155px, about 175 characters. So the answer to the empty half is not
          a wider measure but a second column: the banner now uses its whole
          width, each column stays inside a readable measure, and the block is
          about a third shorter, which matters for a notice that pushes the
          page down.

          The split starts at `xl`, not `lg`: with the sidebar taking its share,
          1024px leaves the body 741px, and two columns of that are 339px — about
          49 characters, too narrow to read comfortably. One column of 741px is
          86ch, already inside the cap, so `lg` needs no help. A third column
          from `2xl`, because at 1920px two columns are 787px each, about 119
          characters, back past the limit the cap exists to hold.

          `break-inside-avoid` keeps a paragraph whole instead of splitting it
          across the fold, and the margin moves onto the children because
          `space-y` would put a gap at the top of the second column. */}
      <div className="max-w-[90ch] space-y-2 pl-9 text-muted-foreground xl:max-w-none xl:columns-2 2xl:columns-3 xl:gap-x-10 xl:space-y-0 xl:[&>*]:mb-2 xl:[&>*]:break-inside-avoid [&_a]:text-primary-accessible [&_a]:underline-offset-2 [&_a:hover]:underline [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
