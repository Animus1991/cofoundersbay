import { describe, expect, it } from 'vitest';
import { buildIcs, icsFileName, icsText } from './ics';

const now = new Date('2026-10-20T08:00:00.000Z');

describe('calendar files', () => {
  it('escapes what TEXT must escape, the semicolon included', () => {
    expect(icsText('Demo day; Athens, GR\nRoom 2')).toBe('Demo day\\; Athens\\, GR\\nRoom 2');
  });

  it('writes a timed entry in UTC and an all-day one by date', () => {
    const ics = buildIcs(
      [
        { uid: 'session-1', title: 'Mentor session', start: '2026-10-22T14:00:00.000Z', end: '2026-10-22T15:00:00.000Z', location: 'Video call' },
        { uid: 'milestone-2', title: 'Pitch deck due', start: '2026-10-25T10:00:00.000Z', allDay: true },
      ],
      { name: 'CoFounderBay', now },
    );
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('X-WR-CALNAME:CoFounderBay');
    expect(lines).toContain('DTSTART:20261022T140000Z');
    expect(lines).toContain('DTEND:20261022T150000Z');
    expect(lines).toContain('LOCATION:Video call');
    expect(lines).toContain('DTSTART;VALUE=DATE:20261025');
    expect(lines).toContain('DTEND;VALUE=DATE:20261026');
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2);
    expect(lines[lines.length - 1]).toBe('END:VCALENDAR');
  });

  it('gives an entry without an end one hour', () => {
    const ics = buildIcs([{ uid: 'e', title: 'Call', start: '2026-10-22T09:30:00.000Z' }], { now });
    expect(ics).toContain('DTEND:20261022T103000Z');
  });

  it('names the file after the title', () => {
    expect(icsFileName('Demo Day Q2')).toBe('demo-day-q2.ics');
    expect(icsFileName('Ημερολόγιο', 'calendar')).toBe('calendar.ics');
  });
});
