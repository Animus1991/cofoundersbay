'use client';

import type { ElementType, ReactNode } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { cn } from '@/lib/utils';

/**
 * The pieces a page rail is built from.
 *
 * Every railed page drew its own stat rows, option buttons and action rows,
 * with the same classes copied from page to page and drifting (a 32px icon box
 * here, 36px there; a filled active state on one page, a tinted one on the
 * next). These keep one anatomy across rails, which is what lets the right
 * edge of the product read as one tool rather than twenty-six.
 */

export type RailStat = {
  key: string;
  label: string;
  labelEl?: string;
  value: ReactNode;
  /**
   * Kept so existing callers compile. Not drawn: a tinted square beside a
   * number is a stain, and the glyph inside it is often already hidden.
   */
  icon?: ElementType;
  /** @deprecated The figure is the number and its caption. */
  tone?: string;
  /** One line of context under the label ("+3 this week"), in both languages. */
  note?: string;
  noteEl?: string;
};

/** Figures that describe the page's list: the number and its caption. */
export function RailStats({ items }: { items: RailStat[] }) {
  return (
    <dl className="space-y-2">
      {items.map(({ key, label, labelEl, value, note, noteEl }) => (
        /* A soft tile, not a framed box, and no icon well: the rail is a
           flat surface like the left sidebar. */
        <div key={key} className="relative flex min-w-0 flex-col rounded-lg bg-muted/45 py-3 pl-3 pr-3">
          <dt className="order-2 mt-1 text-xs leading-snug text-muted-foreground">
            {/* Stacked: in a column this narrow an inline pair wraps and
                leaves its "·" separator alone on a line. */}
            <BilingualText en={label} el={labelEl} stacked wrap />
            {note ? (
              <span className="mt-0.5 block text-2xs text-muted-foreground/90">
                <BilingualText en={note} el={noteEl ?? note} compact wrap />
              </span>
            ) : null}
          </dt>
          <dd className="order-1 text-base font-semibold leading-none tabular-nums text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type RailOption<V extends string> = {
  value: V;
  en: string;
  el?: string;
  icon?: ElementType;
  /** A count shown at the end of the row, when the page knows it. */
  count?: number;
};

/**
 * One choice among several: a filter or a view. Each row is a button with
 * `aria-pressed`, so a screen reader hears which one is on, and the group is
 * named by its heading.
 */
export function RailOptions<V extends string>({
  title,
  titleEl,
  options,
  value,
  onChange,
}: {
  title: string;
  titleEl?: string;
  options: ReadonlyArray<RailOption<V>>;
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <div role="group" aria-label={title} className="space-y-1">
      <p className="px-2.5 pb-0.5 text-xs font-medium text-muted-foreground">
        <BilingualText en={title} el={titleEl} compact />
      </p>
      {options.map(({ value: v, en, el, icon: Icon, count }) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            className={cn(
              'tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
              on ? 'bg-primary/10 font-medium text-foreground' : 'text-foreground hover:bg-muted/70',
            )}
          >
            {Icon ? <Icon className={cn('icon-sm shrink-0', on ? '' : 'text-muted-foreground')} aria-hidden="true" /> : null}
            <span className="min-w-0 flex-1">
              <BilingualText en={en} el={el} compact wrap />
            </span>
            {count != null ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** A one-off action in the rail: clear filters, export, open a help page. */
export function RailAction({
  icon: Icon,
  en,
  el,
  onClick,
  disabled,
  title,
}: {
  icon: ElementType;
  en: string;
  el?: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <BilingualText en={en} el={el} compact wrap />
      </span>
    </button>
  );
}
