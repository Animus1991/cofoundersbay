import { describe, expect, it } from 'vitest';
import { homeSuggestions, readSnoozed } from './home-suggestion';

/**
 * The assistant's one offer on /home (docs §142): only what the page does
 * not already say, the most time-bound first, the week plan last.
 */
const NOW = new Date(2026, 10, 25, 10, 0);
const at = (day: number, hour = 19) => new Date(2026, 10, day, hour).toISOString();
const none = () => 'none' as const;

describe('homeSuggestions', () => {
  it('puts an event the reader is going to this week first, then a person, then the week', () => {
    const list = homeSuggestions({
      events: [
        { id: 'far', title: 'Later', startAt: at(30), viewerRsvp: 'going' },
        { id: 'soon', title: 'Pitch Night', startAt: at(27), viewerRsvp: 'interested' },
        { id: 'skip', title: 'Not going', startAt: at(26), viewerRsvp: null },
      ],
      people: [{ userId: 'u4', displayName: 'Nikos Andreou' }],
      shownAbove: new Set(),
      connectionOf: none,
      now: NOW,
    });
    expect(list.map((s) => s.id)).toEqual(['event:soon', 'person:u4', 'week']);
    expect(list[0].el).toBe('Η εκδήλωση «Pitch Night» είναι σε 2 μέρες. Να σας πω ποιους να συναντήσετε εκεί;');
    expect(list[0].en).toContain('in 2 days');
  });

  it('never offers a person the page already shows, or one the reader is already linked with', () => {
    const list = homeSuggestions({
      events: [],
      people: [
        { userId: 'shown', displayName: 'On the page' },
        { userId: 'linked', displayName: 'Already linked' },
        { userId: 'new', displayName: 'Sofia Alexiou' },
      ],
      shownAbove: new Set(['shown']),
      connectionOf: (id) => (id === 'linked' ? 'sent' : 'none'),
      now: NOW,
    });
    expect(list[0].id).toBe('person:new');
    expect(list[0].prompt).toEqual(expect.objectContaining({ en: expect.stringContaining('Sofia Alexiou') }));
  });

  it('falls back to the week plan, asked in the words the planner reads', () => {
    const [only] = homeSuggestions({ events: [], people: [], shownAbove: new Set(), connectionOf: none, now: NOW });
    expect(only.id).toBe('week');
    expect(only.prompt).toEqual({ en: 'Prepare my week', el: 'Ετοίμασε την εβδομάδα μου' });
  });

  it('says tomorrow and today in words', () => {
    const [tomorrow] = homeSuggestions({ events: [{ id: 'e', title: 'T', startAt: at(26), viewerRsvp: 'going' }], people: [], shownAbove: new Set(), connectionOf: none, now: NOW });
    expect(tomorrow.el).toContain('είναι αύριο');
    const [today] = homeSuggestions({ events: [{ id: 'e', title: 'T', startAt: at(25, 20), viewerRsvp: 'going' }], people: [], shownAbove: new Set(), connectionOf: none, now: NOW });
    expect(today.en).toContain('is today');
  });
});

describe('readSnoozed', () => {
  it('keeps only snoozes that have not run out, and survives bad storage', () => {
    const now = NOW.getTime();
    expect(readSnoozed(JSON.stringify({ week: now + 1000, old: now - 1, bad: 'x' }), now)).toEqual({ week: now + 1000 });
    expect(readSnoozed('not json', now)).toEqual({});
    expect(readSnoozed(null, now)).toEqual({});
  });
});
