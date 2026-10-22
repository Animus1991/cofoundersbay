import { calendarDaysUntil } from '@/lib/calendar-days';

/**
 * The times a conversation shows, on the reader's clock and in the reader's
 * language (docs §73).
 *
 * The thread wrote each message's time with the browser's default locale, so
 * a Greek page read "07:00 PM" under a list that said "19:00". The day
 * dividers and the list's weekday were written in UTC while the messages were
 * grouped by the reader's own day, so in Athens a message sent at 01:00 on a
 * Friday sat under "Friday" and was labelled Thursday. And the list counted
 * 24-hour spans, not days: a message from 23:00 the evening before last read
 * "Yesterday".
 */
export type ThreadLang = 'en' | 'el';

const LOCALE: Record<ThreadLang, string> = { en: 'en-GB', el: 'el-GR' };

/** Whole calendar days since the date, where the reader is: 0 today, 1 yesterday. */
export function calendarDaysAgo(date: Date, now: Date | number = Date.now()): number {
  const until = calendarDaysUntil(date, now);
  return until === null ? 0 : Math.max(0, -until);
}

/** "19:00" in both languages: the 24-hour clock the list already used. */
export function clockTime(date: Date, lang: ThreadLang): string {
  return date.toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

/** The conversation list's stamp: the time today, then Yesterday, a weekday, a date. */
export function listTimeLabel(date: Date, lang: ThreadLang, yesterday: string, now: Date | number = Date.now()): string {
  const days = calendarDaysAgo(date, now);
  if (days === 0) return clockTime(date, lang);
  if (days === 1) return yesterday;
  if (days < 7) return date.toLocaleDateString(LOCALE[lang], { weekday: 'short' });
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(LOCALE[lang], sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The divider over each day of the thread: Today, Yesterday, or the day itself. */
export function dayDividerLabel(
  date: Date,
  lang: ThreadLang,
  labels: { today: string; yesterday: string },
  now: Date | number = Date.now(),
): string {
  const days = calendarDaysAgo(date, now);
  if (days === 0) return labels.today;
  if (days === 1) return labels.yesterday;
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(
    LOCALE[lang],
    sameYear
      ? { weekday: 'long', day: 'numeric', month: 'short' }
      : { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' },
  );
}
