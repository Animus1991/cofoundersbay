import type { BilingualPair } from './types';

/**
 * Join EN + EL for `aria-label` / `title` / `alt` ONLY — the full stop makes a
 * screen reader pause between the two languages.
 *
 * Do NOT use for visible text: the result renders as an unstyled "English. Ελληνικά"
 * run-on with no typographic hierarchy. For visible text use `<BilingualText>`
 * (styled, `lang`-tagged, honours the user's display preference), or
 * `bilingualInline` when the slot only accepts a string (placeholder, toast).
 */
export function bilingualAria(en: string, el?: string | null): string {
  if (!el || el === en) return en;
  return `${en}. ${el}`;
}

/**
 * Inline bilingual string for visible slots that only accept a `string`
 * (e.g. `placeholder`, toast bodies). Prefer `<BilingualText>` wherever a
 * ReactNode is allowed.
 */
export function bilingualInline(en: string, el?: string | null): string {
  if (!el || el === en) return en;
  return `${en} · ${el}`;
}

export function fromPair(pair: BilingualPair): { en: string; el: string } {
  return { en: pair.en, el: pair.el };
}

const DATE_LOCALE: Record<'en' | 'el', string> = { en: 'en-GB', el: 'el-GR' };

/**
 * Every *date* the product renders is formatted in UTC, deliberately.
 *
 * `toLocaleDateString` without a `timeZone` formats in whatever zone the runtime
 * is in. The server is UTC and the reader's browser is not, so any timestamp
 * near a day boundary renders as two different days and React throws a
 * hydration mismatch — the demo data's `dueDate: '2026-03-28T23:59:00Z'` is
 * "28 Mar" on the server and "29 Mar" in Athens. It is a latent bug on every
 * date in the product, not a property of that one record.
 *
 * UTC rather than the reader's zone because these are date-granularity values
 * whose source of truth is the stored instant: a review due at 23:59Z on the
 * 28th is due *on the 28th*, whoever is reading. The alternative — deferring
 * every date to a post-mount render — leaves the dashboard full of blank slots
 * on first paint.
 *
 * Times are different: see `formatLocalTime`.
 */
const DISPLAY_TIME_ZONE = 'UTC';

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Date in the user's primary language, formatted in UTC so the server and the
 * browser always agree. Defaults to the locale's own short form ("28/03/2026"),
 * matching what a bare `toLocaleDateString()` used to produce.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  lang: 'en' | 'el' = 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(DATE_LOCALE[lang], {
    timeZone: DISPLAY_TIME_ZONE,
    ...options,
  });
}

/**
 * Clock time in the reader's own zone — "14:32" is only useful locally, so this
 * one cannot be pinned the way dates are.
 *
 * Because of that it is **not safe to render on the server**. Call it only
 * behind a mounted gate (see `useMounted`), or the same hydration mismatch
 * comes back on the hour instead of on the day.
 */
export function formatLocalTime(
  value: string | number | Date | null | undefined,
  lang: 'en' | 'el' = 'en',
): string {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleTimeString(DATE_LOCALE[lang], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Short date in the user's primary language, e.g. "15 Apr" / "15 Απρ".
 *
 * The year is appended whenever the date is not in the current year. Omitting it
 * unconditionally (the previous behaviour) makes a deadline 8 months out
 * indistinguishable from one 4 months back.
 */
export function formatShortDate(
  value: string | Date,
  lang: 'en' | 'el' = 'en',
): string {
  const date = toDate(value);
  if (!date) return '';
  // getUTCFullYear, to stay in the same frame as the formatter below.
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return date.toLocaleDateString(DATE_LOCALE[lang], {
    timeZone: DISPLAY_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
