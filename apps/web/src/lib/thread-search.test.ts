import { describe, expect, it } from 'vitest';
import { highlightParts, matchRanges, stepMatch, threadMatches } from './thread-search';

describe('finding words in a conversation', () => {
  it('ignores accents, case and final sigma, and reports positions in the original text', () => {
    expect(matchRanges('Συμφωνούμε στους όρους;', 'ορους')).toEqual([[17, 22]]);
    expect(matchRanges('Term sheet attached. The TERM is 12 months.', 'term')).toEqual([[0, 4], [25, 29]]);
    expect(matchRanges('Ο Νίκος', 'νικοσ')).toEqual([[2, 7]]);
    expect(matchRanges('anything', '   ')).toEqual([]);
  });

  it('keeps the original spelling inside a highlight', () => {
    expect(highlightParts('Στείλε τους Όρους', 'ορους')).toEqual([
      { text: 'Στείλε τους ', hit: false },
      { text: 'Όρους', hit: true },
    ]);
    expect(highlightParts('nothing here', 'term')).toEqual([{ text: 'nothing here', hit: false }]);
  });

  it('searches every text a message shows, oldest first', () => {
    const messages = [
      { id: 'a', en: 'Loved your update', el: 'Μου άρεσε η ενημέρωση' },
      { id: 'b', en: 'Can we compare notes?', el: 'Συγκρίνουμε σημειώσεις;' },
      { id: 'c', en: 'Notes are in the board', el: 'Οι σημειώσεις είναι στον πίνακα' },
    ];
    const texts = (m: (typeof messages)[number]) => [m.en, m.el];
    expect(threadMatches(messages, 'σημειωσεις', texts)).toEqual(['b', 'c']);
    expect(threadMatches(messages, 'update', texts)).toEqual(['a']);
    expect(threadMatches(messages, '', texts)).toEqual([]);
  });

  it('steps between hits and wraps, starting from the newest going up', () => {
    expect(stepMatch(-1, 3, -1)).toBe(2);
    expect(stepMatch(2, 3, -1)).toBe(1);
    expect(stepMatch(0, 3, -1)).toBe(2);
    expect(stepMatch(2, 3, 1)).toBe(0);
    expect(stepMatch(0, 0, 1)).toBe(-1);
  });
});
