import type { TodayRow } from '@/components/dashboard/HomeToday';

/**
 * The waiting list and HomeContinue can name the same milestone: Continue
 * owns it then, and the row leaves (docs §130.2). Every other row stays.
 */
export function dedupeWaitingRows(rows: TodayRow[], nextMilestone: unknown): TodayRow[] {
  return rows.filter((row) => !(row.key === 'milestone' && nextMilestone));
}
