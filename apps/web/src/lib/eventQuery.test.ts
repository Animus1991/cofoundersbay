import { describe, expect, it } from 'vitest';
import { eventWindowRange, readEventQuery } from '@cofounderbay/shared';

/**
 * Plain words on /events (docs §142), as Parea reads «κοντά μου, δωρεάν,
 * Σάββατο» into its filters: the format, the kind and when, in either
 * language; whatever else was typed stays the search text.
 */
describe('readEventQuery', () => {
  it('reads format, kind and window from English', () => {
    const read = readEventQuery('online workshops this week');
    expect(read.format).toBe('online');
    expect(read.type).toBe('workshop');
    expect(read.when).toBe('week');
    expect(read.rest).toBe('');
    expect(read.understood.map((f) => f.kind)).toEqual(['format', 'kind', 'when']);
  });

  it('reads the same from Greek, accents and endings included', () => {
    const read = readEventQuery('διαδικτυακά εργαστήρια αυτή την εβδομάδα');
    expect(read).toMatchObject({ format: 'online', type: 'workshop', when: 'week', rest: '' });
  });

  it('takes «διαδικτυακό σεμινάριο» as a webinar, not only as online', () => {
    const read = readEventQuery('διαδικτυακό σεμινάριο αύριο');
    expect(read.type).toBe('webinar');
    expect(read.format).toBeNull();
    expect(read.when).toBe('tomorrow');
  });

  it('keeps next week apart from this week', () => {
    expect(readEventQuery('networking next week').when).toBe('next-week');
    expect(readEventQuery('δικτύωση την επόμενη εβδομάδα')).toMatchObject({ type: 'networking', when: 'next-week' });
  });

  it('leaves unknown words as the search text, without filler', () => {
    const read = readEventQuery('fintech εκδηλώσεις στην Αθήνα σήμερα');
    expect(read.when).toBe('today');
    expect(read.rest).toBe('fintech Αθήνα');
  });

  it('reads nothing from a plain title', () => {
    const read = readEventQuery('Athens Founders Pitch Night');
    expect(read.understood).toEqual([]);
    expect(read.rest).toBe('Athens Founders Pitch Night');
  });
});

describe('eventWindowRange', () => {
  // Wednesday 25 November 2026, 10:00.
  const wed = new Date(2026, 10, 25, 10, 0);

  it('runs a week from now to the coming Monday', () => {
    const { from, to } = eventWindowRange('week', wed);
    expect(from).toEqual(wed);
    expect(to).toEqual(new Date(2026, 10, 30));
  });

  it('takes the coming Saturday and Sunday on a weekday, and the rest of it on a Saturday', () => {
    expect(eventWindowRange('weekend', wed)).toEqual({ from: new Date(2026, 10, 28), to: new Date(2026, 10, 30) });
    const sat = new Date(2026, 10, 28, 15, 0);
    expect(eventWindowRange('weekend', sat)).toEqual({ from: sat, to: new Date(2026, 10, 30) });
  });

  it('starts next week on Monday and ends the month on its last day', () => {
    expect(eventWindowRange('next-week', wed)).toEqual({ from: new Date(2026, 10, 30), to: new Date(2026, 11, 7) });
    expect(eventWindowRange('month', wed).to).toEqual(new Date(2026, 11, 1));
    expect(eventWindowRange('tomorrow', wed)).toEqual({ from: new Date(2026, 10, 26), to: new Date(2026, 10, 27) });
  });
});
