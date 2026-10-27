import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { axisCopy, badgeCopy, compatSummary, completenessCopy, frictionCopy, frictionParts, strengthTerms } from './match-vs-copy';

describe('the compatibility dialog in both languages', () => {
  it('names each axis by its key, briefly', () => {
    expect(axisCopy('role', 'Role Complementarity')).toEqual({ en: 'Roles', el: 'Ρόλοι' });
    expect(axisCopy('behavioral', 'Platform Activity')).toEqual({ en: 'Activity', el: 'Δραστηριότητα' });
    // An axis this table does not know keeps its label, in Greek where one exists.
    expect(axisCopy('mystery', 'Location Fit')).toEqual({ en: 'Location Fit', el: 'Εγγύτητα τοποθεσίας' });
    expect(axisCopy(undefined, 'Something new')).toEqual({ en: 'Something new', el: 'Something new' });
  });

  it('says how much the comparison stands on, not a second percentage', () => {
    expect(completenessCopy(95)?.el).toBe('Με βάση αναλυτικά προφίλ');
    expect(completenessCopy(70)?.el).toBe('Με βάση μερικώς συμπληρωμένα προφίλ');
    expect(completenessCopy(50)?.el).toBe('Με βάση λίγα στοιχεία προφίλ');
    expect(completenessCopy(null)).toBeNull();
  });

  it('says what differs and what to agree on, with the facts', () => {
    expect(frictionCopy({ key: 'location', values: { mine: 'Athens, Greece', theirs: 'Berlin, Germany' } })).toEqual({
      en: 'Different places: Berlin, Germany and Athens, Greece. Agree early on how you will work across the distance.',
      el: 'Διαφορετικές τοποθεσίες: Βερολίνο, Γερμανία και Αθήνα, Ελλάδα. Συμφωνήστε νωρίς πώς θα συνεργάζεστε από απόσταση.',
    });
    expect(frictionCopy({ key: 'stage', values: { mine: 'idea', theirs: 'traction' } })?.el)
      .toBe('Διαφορετικά στάδια: Traction και Ιδέα. Συμφωνήστε νωρίς ποια ορόσημα προηγούνται.');
    expect(frictionCopy({ key: 'commitment', values: { mine: 'full-time', theirs: 'part-time' } })?.el)
      .toBe('Διαφορετική δέσμευση χρόνου: μερική απασχόληση και πλήρης απασχόληση. Συμφωνήστε σε ώρες και ορόσημα.');
  });

  it('reads an older answer by its icon, and keeps an unknown one', () => {
    // matching.service before frictions carried a key: English title and description.
    expect(frictionCopy({ icon: 'warning_amber', title: 'Technical Role Overlap', description: 'Both profiles are primarily technical.' })?.el)
      .toBe('Έχετε και οι δύο τεχνικό προφίλ. Αποφασίστε νωρίς πώς θα καλυφθούν οι πωλήσεις, η επιχειρηματική πλευρά και η ανάπτυξη.');
    expect(frictionCopy({ icon: 'schedule', title: 'Location Difference', description: 'Athens vs Berlin.' })?.el)
      .toBe('Διαφορετικές τοποθεσίες. Συμφωνήστε νωρίς πώς θα συνεργάζεστε από απόσταση.');
    expect(frictionCopy({ icon: 'bolt', title: 'Pace', description: 'Different speeds.' })).toEqual({ en: 'Pace: Different speeds.', el: 'Pace: Different speeds.' });
    expect(frictionCopy({})).toBeNull();
    expect(frictionCopy(null)).toBeNull();
  });

  it('lists shared strengths once, without what a reason already names', () => {
    const terms = strengthTerms(
      [{ icon: 'terminal', label: 'Product' }, { icon: 'lightbulb', label: 'fintech' }, 'Fintech', { icon: 'terminal', label: 'Growth' }],
      ['product', 'Growth'],
      (t) => ({ FinTech: 'FinTech' } as Record<string, string>)[t] ?? t,
    );
    expect(terms).toEqual([{ en: 'FinTech', el: 'FinTech' }]);
  });

  it('sums up the working-style questions, or says there are too few', () => {
    expect(compatSummary({ shared: 5, total: 10, agree: 3, close: 1, talk: 1, items: [], share: 0.7 }).text.el)
      .toBe('Τρόπος συνεργασίας: απαντήσατε και οι δύο 5 από 10 ερωτήσεις· 3 συμφωνίες, 1 κοντά, 1 για συζήτηση πρώτα.');
    const few = compatSummary({ shared: 1, total: 10, agree: 1, close: 0, talk: 0, items: [], share: null });
    expect(few.enough).toBe(false);
    expect(few.text.el).toMatch(/^Λιγότερες από 3 ερωτήσεις/);
    expect(compatSummary(undefined).enough).toBe(false);
  });

  it('splits a point into its heading and its advice, for pages that lay them out apart', () => {
    expect(frictionParts({ key: 'stage', values: { mine: 'idea', theirs: 'mvp' } })).toEqual({
      title: { en: 'Different stages: MVP and Idea', el: 'Διαφορετικά στάδια: MVP και Ιδέα' },
      advice: { en: 'Agree early on which milestones come first.', el: 'Συμφωνήστε νωρίς ποια ορόσημα προηγούνται.' },
      known: true,
    });
    expect(frictionParts({ title: 'Pace', description: 'Different speeds.' })).toEqual({
      title: { en: 'Pace', el: 'Pace' },
      advice: { en: 'Different speeds.', el: 'Different speeds.' },
      known: false,
    });
  });

  it('says the engine badges in Greek, and keeps one it does not know', () => {
    expect(badgeCopy('Strong Role Complement').el).toBe('Συμπληρωματικοί ρόλοι');
    expect(badgeCopy('Potential Match').el).toBe('Δυνητική αντιστοίχιση');
    expect(badgeCopy('Brand new badge')).toEqual({ en: 'Brand new badge', el: 'Brand new badge' });
  });

  // Read from the engine's source, so a badge added there fails here until
  // it is named (the same guard the reasons have).
  it('has Greek for every badge the engine writes', () => {
    const source = readFileSync('../api/src/matching/matching.service.ts', 'utf8');
    const written = [...source.matchAll(/badges\.push\('([^']+)'\)/g)].map((m) => m[1]);
    expect(written.length).toBeGreaterThanOrEqual(7);
    expect(written.filter((b) => badgeCopy(b).el === b)).toEqual([]);
  });
});
