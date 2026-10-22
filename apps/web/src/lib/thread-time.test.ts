import { describe, expect, it } from 'vitest';
import { calendarDaysAgo, clockTime, dayDividerLabel, listTimeLabel } from './thread-time';

// Local dates throughout: the thread is read on the reader's clock, so the
// test holds in any time zone the suite runs in.
const now = new Date(2026, 9, 16, 9, 30); // Friday 16 October 2026, 09:30
const labels = { today: 'Today', yesterday: 'Yesterday' };

describe('thread times, on the reader’s clock (docs §73)', () => {
  it('counts calendar days, not 24-hour spans', () => {
    expect(calendarDaysAgo(new Date(2026, 9, 16, 0, 5), now)).toBe(0);
    expect(calendarDaysAgo(new Date(2026, 9, 15, 23, 50), now)).toBe(1);
    // 34 hours ago is two days ago, not "Yesterday".
    expect(calendarDaysAgo(new Date(2026, 9, 14, 23, 30), now)).toBe(2);
    // A clock a little ahead of the reader's is still today.
    expect(calendarDaysAgo(new Date(2026, 9, 16, 9, 31), now)).toBe(0);
  });

  it('writes the time on the 24-hour clock in both languages', () => {
    const evening = new Date(2026, 9, 15, 19, 0);
    expect(clockTime(evening, 'en')).toBe('19:00');
    expect(clockTime(evening, 'el')).toBe('19:00');
  });

  it('labels the list by day where the reader is', () => {
    expect(listTimeLabel(new Date(2026, 9, 16, 1, 0), 'en', 'Yesterday', now)).toBe('01:00');
    expect(listTimeLabel(new Date(2026, 9, 15, 23, 0), 'en', 'Yesterday', now)).toBe('Yesterday');
    expect(listTimeLabel(new Date(2026, 9, 14, 23, 0), 'en', 'Yesterday', now)).toBe('Wed');
    expect(listTimeLabel(new Date(2026, 9, 1, 12, 0), 'en', 'Yesterday', now)).toBe('1 Oct');
    expect(listTimeLabel(new Date(2025, 11, 30, 12, 0), 'en', 'Yesterday', now)).toBe('30 Dec 2025');
  });

  it('names the day a divider stands over, the same day the messages are grouped by', () => {
    expect(dayDividerLabel(new Date(2026, 9, 16, 0, 30), 'en', labels, now)).toBe('Today');
    expect(dayDividerLabel(new Date(2026, 9, 15, 1, 0), 'en', labels, now)).toBe('Yesterday');
    expect(dayDividerLabel(new Date(2026, 9, 13, 1, 0), 'en', labels, now)).toBe('Tuesday 13 Oct');
    expect(dayDividerLabel(new Date(2026, 9, 13, 1, 0), 'el', labels, now)).toMatch(/^Τρίτη 13 Οκτ/);
  });
});
