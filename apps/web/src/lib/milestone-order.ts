import { calendarDaysUntil } from '@/lib/calendar-days';

/**
 * When a milestone is due, in calendar days where the reader is (docs §72).
 *
 * The page compared milliseconds with midnight UTC, so a milestone due today
 * read "Overdue" from 03:00 in Athens, and "Due soon" showed on milestones
 * already completed.
 */
type Dated = { status: string; dueDate: string | null };

const DONE = new Set(['completed', 'cancelled']);

function daysLeft(iso: string | null, now: number): number | null {
  if (!iso) return null;
  // A date stored at midnight UTC is that calendar day, not the evening before.
  return calendarDaysUntil(/^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso, now);
}

export function isMilestoneOverdue(item: Dated, now = Date.now()): boolean {
  if (DONE.has(item.status)) return false;
  const days = daysLeft(item.dueDate, now);
  return days !== null && days < 0;
}

/** Due today or within the next six days, and not finished. */
export function isMilestoneDueSoon(item: Dated, now = Date.now()): boolean {
  if (DONE.has(item.status)) return false;
  const days = daysLeft(item.dueDate, now);
  return days !== null && days >= 0 && days < 7;
}

/**
 * The order of importance: open milestones first, the overdue and the nearest
 * due at the top, undated after them; finished ones last, the most recent
 * first. The list came in the API's order, so the one overdue milestone was
 * third and the one due this week fifth.
 */
export function orderMilestones<T extends Dated>(items: readonly T[], now = Date.now()): T[] {
  const due = (m: T) => daysLeft(m.dueDate, now);
  return [...items].sort((a, b) => {
    const doneA = DONE.has(a.status) ? 1 : 0;
    const doneB = DONE.has(b.status) ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    const da = due(a);
    const db = due(b);
    if (da === null || db === null) return da === null ? (db === null ? 0 : 1) : -1;
    return doneA ? db - da : da - db;
  });
}
