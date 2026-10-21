'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

/**
 * The page's figures as one dot-separated line: "4 matches · 3 excellent,
 * ready to connect · average 84% · top 92%".
 *
 * FactLine's sibling (FactLine is a card's facts: stage, place, sector).
 * Adopted from the AI Studio prototype for pages that opened with a row of
 * figure tiles before their content (docs §64): the tiles took about 100px
 * and drew a second row of boxes for numbers read in one glance, so the
 * first piece of content started lower than it needed to. The line takes
 * one row and keeps every figure. A figure that is also a filter is a
 * button ("3 excellent" shows them), so a banner that only repeated it and
 * offered "View" folds into the line.
 *
 * Type stays on the existing scale: the body size, the figure semibold in
 * the text colour, the words muted.
 */
export type PageFact = {
  id: string;
  /** The figure, first and in the text colour. Empty (or a dash) hides the fact. */
  value: ReactNode;
  /** The words after the figure. */
  en: string;
  el: string;
  /** Makes the fact a button: a figure that is also a filter. */
  onSelect?: () => void;
  /** That filter is the one applied. */
  selected?: boolean;
};

export function PageFacts({
  facts,
  labelEn,
  labelEl,
  className,
  ...rest
}: {
  facts: PageFact[];
  labelEn: string;
  labelEl: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLUListElement>, 'children'>) {
  // A dash is not a figure: "— average readiness" read as a broken number.
  const shown = facts.filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== '' && fact.value !== '—');
  if (shown.length === 0) return null;
  return (
    <ul
      aria-label={bilingualAria(labelEn, labelEl)}
      data-page-facts=""
      className={cn('facts-dotted flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground', className)}
      {...rest}
    >
      {shown.map((fact) => {
        const body = (
          <>
            <span className="font-semibold tabular-nums text-foreground">{fact.value}</span>{' '}
            <BilingualText en={fact.en} el={fact.el} compact />
          </>
        );
        return (
          <li key={fact.id} className="min-w-0">
            {fact.onSelect ? (
              <button
                type="button"
                onClick={fact.onSelect}
                aria-pressed={fact.selected ?? false}
                className={cn(
                  'rounded-sm text-left underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground focus-ring',
                  fact.selected && 'text-foreground decoration-foreground',
                )}
              >
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
