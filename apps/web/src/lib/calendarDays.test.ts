import { describe, expect, it } from 'vitest';
import { calendarDaysUntil } from './calendar-days';

describe('calendar days until a date', () => {
  const morning = new Date(2026, 9, 21, 9, 0).getTime();

  it('counts days, not hours rounded up', () => {
    expect(calendarDaysUntil(new Date(2026, 9, 21, 17, 0), morning)).toBe(0);
    expect(calendarDaysUntil(new Date(2026, 9, 22, 1, 0), morning)).toBe(1);
    expect(calendarDaysUntil(new Date(2026, 10, 26, 17, 0), morning)).toBe(36);
  });

  it('goes negative once the day has passed, never on the day itself', () => {
    expect(calendarDaysUntil(new Date(2026, 9, 21, 8, 0), morning)).toBe(0);
    expect(calendarDaysUntil(new Date(2026, 9, 20, 23, 0), morning)).toBe(-1);
  });

  it('reads a date without a time as that day where the reader is', () => {
    expect(calendarDaysUntil('2026-10-21', morning)).toBe(0);
    expect(calendarDaysUntil('2026-11-11', morning)).toBe(21);
  });

  it('has no answer for no date', () => {
    expect(calendarDaysUntil(null, morning)).toBeNull();
    expect(calendarDaysUntil('', morning)).toBeNull();
    expect(calendarDaysUntil('not a date', morning)).toBeNull();
  });
});
