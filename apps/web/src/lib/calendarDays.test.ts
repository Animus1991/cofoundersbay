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

import { eventTypesForDay } from './calendar-days';
import { TYPE_CONFIG, type EventType } from '../app/calendar/type-config';

describe('the month cell’s type chips (docs §132.4)', () => {
  it('tracks every kind sitting on a day so its dot can carry the word', () => {
    const map = eventTypesForDay<EventType>([
      { date: '2026-10-15T09:00:00Z', type: 'event' },
      { date: '2026-10-15T18:00:00Z', type: 'meeting' },
      { date: '2026-10-16T09:00:00Z', type: 'milestone' },
      // A different month and a different year stay out of the grid.
      { date: '2026-11-15T09:00:00Z', type: 'deadline' },
    ], 2026, 9);
    expect([...(map.get(15) ?? [])].sort()).toEqual(['event', 'meeting']);
    expect([...(map.get(16) ?? [])]).toEqual(['milestone']);
    expect(map.has(14)).toBe(false);
  });

  it('gives every kind a word in both languages — a chip is never colour alone', () => {
    for (const [kind, cfg] of Object.entries(TYPE_CONFIG)) {
      expect(cfg.labelEn, kind).toBeTruthy();
      expect(cfg.labelEl, kind).toBeTruthy();
      expect(cfg.icon, kind).toBeTruthy();
    }
  });
});
