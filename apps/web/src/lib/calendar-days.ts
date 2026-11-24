/**
 * Whole calendar days from today to a date, in the reader's time zone: 0 on
 * the day itself, 1 on the day before, negative once the day has passed.
 *
 * Five places counted milliseconds and rounded up (`Math.ceil`), which
 * answers another question: a deadline at 17:00 read "1 day left" on its own
 * morning, "Today!" only once it had passed (an opportunity closing today
 * read "Expired"), and a round closing on 26 November read "37 days" on 21
 * October. A date written without a time ("2026-11-11") is that day where
 * the reader is, not midnight in London.
 */
export function calendarDaysUntil(date: string | number | Date | null | undefined, now: number | Date = Date.now()): number | null {
  if (date === null || date === undefined || date === '') return null;
  let target: Date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    target = new Date(y, m - 1, d);
  } else {
    target = new Date(date);
  }
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now);
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}

/**
 * The event kinds sitting on each day of a UTC month — the month cell's dots
 * take their colour (and their sr-only word) from this (docs §132.4).
 */
export function eventTypesForDay<T extends string>(
  events: { date: string; type: T }[],
  year: number,
  month: number,
): Map<number, Set<T>> {
  const map = new Map<number, Set<T>>();
  for (const e of events) {
    const ed = new Date(e.date);
    if (ed.getUTCFullYear() !== year || ed.getUTCMonth() !== month) continue;
    const day = ed.getUTCDate();
    if (!map.has(day)) map.set(day, new Set());
    map.get(day)!.add(e.type);
  }
  return map;
}
