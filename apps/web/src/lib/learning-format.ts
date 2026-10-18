/**
 * How the library's numbers read on the Learning page.
 *
 * The API stores one number per resource: `duration`, in minutes. The page
 * used to print it as "{n} min" and to add the printed strings back up for the
 * "Total hours" count, so three one-hour courses read "180h": minutes summed
 * and labelled as hours. The two jobs live here, each tested, so the card and
 * the count cannot disagree again.
 */

/** Written to be read, not watched: their length is a reading time. */
const READ_TYPES: ReadonlySet<string> = new Set(['article', 'guide']);

const usable = (minutes: number | null | undefined): minutes is number =>
  typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0;

/**
 * A resource's length the way a card prints it, in English; `durationEl`
 * (lib/i18n/units.ts) turns exactly these three shapes into Greek.
 *
 * "20 min read" for an article or guide, "45 min" under an hour, and hours with
 * at most one decimal from there ("1.5 hours", "3 hours"). `undefined` when the
 * library holds no length for it, so the card shows none rather than "0 min".
 */
export function learningDuration(minutes: number | null | undefined, type: string): string | undefined {
  if (!usable(minutes)) return undefined;
  const whole = Math.round(minutes);
  if (READ_TYPES.has(type)) return `${whole} min read`;
  if (whole < 60) return `${whole} min`;
  const hours = Math.round((whole / 60) * 10) / 10;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

/** The "Total hours" count: the minutes of every listed resource, added, then turned into hours. */
export function learningTotalHours(minutes: ReadonlyArray<number | null | undefined>): number {
  const total = minutes.reduce<number>((sum, m) => (usable(m) ? sum + m : sum), 0);
  return Math.round(total / 60);
}
