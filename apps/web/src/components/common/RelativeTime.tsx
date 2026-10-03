'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { el as elLocale } from 'date-fns/locale';
import { formatRelativeTime, formatRelativeTimeEl } from '@/lib/utils';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

/**
 * Hydration-stable wrapper for anything formatted relative to "now".
 *
 * React #418 haunted every page that rendered a relative timestamp: the
 * server formats "2 minutes ago" at render time, the client re-formats it at
 * hydration time, and when the clock crosses a minute boundary between those
 * two instants the text differs and React regenerates the subtree. Tracked in
 * `e2e/authenticated-a11y.spec.ts` as known debt, with the fix prescribed
 * there: route the renders through one component that emits a stable value on
 * the server and upgrades after mount. This is that component.
 *
 * How it stays stable: `useSyncExternalStore` returns the server snapshot
 * (`false`) during server render *and* during hydration, so both sides render
 * the same deterministic absolute date and the DOM matches. Immediately after
 * hydration the store reads `true` and the component re-renders with the
 * site's own relative wording — same words as before, one frame later, zero
 * mismatch.
 *
 * Call sites keep their formatter and hand it over instead of calling it:
 *
 *   {formatTimeAgo(item.createdAt)}                             // before
 *   <RelativeTime date={item.createdAt} format={formatTimeAgo} /> // after
 */

const emptySubscribe = () => () => {};

/**
 * `false` on the server and through hydration, `true` one frame later.
 *
 * Exported so anything else that has to read the clock during render uses the
 * same primitive rather than inventing a second one: a presence dot derived
 * from `lastSeenAt`, for instance, is the same hazard as a relative timestamp.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Deterministic on both sides of hydration: fixed locale, fixed UTC zone.
 * Shown for a single frame, so it favours being unambiguous over being in
 * the reader's language — "16 Sep" reads in both of the product's languages.
 */
function stableAbsolute(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

type DateInput = string | number | Date;

export function RelativeTime<T extends DateInput>({
  date,
  format,
  className,
}: {
  date: T;
  /**
   * The site's own wording, unchanged — only *when* it runs is managed here.
   * Omitted, it falls back to date-fns "x ago", which is what the previous
   * single-purpose RelativeTime (in LocalTime.tsx) hardcoded.
   */
  format?: (date: T) => ReactNode;
  className?: string;
}) {
  const hydrated = useHydrated();
  const { primary } = useLanguagePreference();
  const d = date instanceof Date ? date : new Date(date);
  const iso = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  const greek = primary === 'el';

  // The shared formatter and the date-fns default have Greek wording; a page's
  // own formatter is used as given.
  const relative = () => {
    if (format === formatRelativeTime && greek) return formatRelativeTimeEl(date as string | Date);
    if (format) return format(date);
    if (!iso) return '';
    return formatDistanceToNow(d, { addSuffix: true, ...(greek ? { locale: elLocale } : {}) });
  };

  return (
    <time dateTime={iso} className={className}>
      {hydrated ? relative() : stableAbsolute(d)}
    </time>
  );
}
