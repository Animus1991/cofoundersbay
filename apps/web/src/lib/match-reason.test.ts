import { readFileSync } from 'node:fs';
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

  // Every reason an engine can push reaches a Greek page in Greek: six of
  // the shared engine's nine used to arrive in English. Read from the
  // engines' source, so a reason added there fails here until it is named.
  it('has Greek for every reason the two engines write', () => {
    const sources = [
      readFileSync('../../packages/shared/src/matching/score.ts', 'utf8'),
      readFileSync('../api/src/matching/matching.service.ts', 'utf8'),
    ];
    const written = new Set<string>();
    for (const source of sources) {
      for (const m of source.matchAll(/reasons\.push\('([^']+)'\)/g)) written.add(m[1]);
      for (const m of source.matchAll(/reasons\.length \? reasons : \['([^']+)'\]/g)) written.add(m[1]);
    }
    expect(written.size).toBeGreaterThanOrEqual(15);
    const english = [...written].filter((text) => matchReasonCopy(text).el === text);
    expect(english).toEqual([]);
  });

  it('never gives another member a gender', () => {
    expect(matchReasonCopy('Active this week').el).toBe('Ενεργό μέλος αυτή την εβδομάδα');
    expect(matchReasonCopy('Highly active on platform').el).toBe('Ενεργό μέλος στην πλατφόρμα');
  });
});
