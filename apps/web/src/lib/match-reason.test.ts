import { describe, expect, it } from 'vitest';
import { matchReasonCopy } from './match-reason';

describe('a match reason in both languages', () => {
  it('names the engine causes, and the sample causes, in Greek', () => {
    expect(matchReasonCopy('Complementary roles')).toEqual({
      en: 'Complementary roles',
      el: 'Συμπληρωματικοί ρόλοι',
    });
    expect(matchReasonCopy('Complementary skills').el).toBe('Συμπληρωματικές δεξιότητες');
    expect(matchReasonCopy('Mentor match').el).toBe('Ταίριασμα μέντορα');
  });

  it('reads an open-to line back into the shared wording', () => {
    expect(matchReasonCopy('Open to mentoring')).toEqual({
      en: 'Open to mentoring',
      el: 'Ανοιχτός/ή σε: Καθοδήγηση',
    });
  });

  it('keeps a sentence the map does not know', () => {
    expect(matchReasonCopy('Met at a demo day')).toEqual({
      en: 'Met at a demo day',
      el: 'Met at a demo day',
    });
  });
});
