import { OPEN_TO_COPY, type OpenToKind } from '@cofounderbay/shared';

/**
 * The matching engine names a cause in English. The card already shows the
 * score; this is the sentence under the name, in both languages.
 * An unknown sentence stays as the engine wrote it, in both places.
 *
 * Every reason either engine can write is here: the shared rule-based score
 * (`packages/shared/src/matching/score.ts`), the detailed comparison
 * (`matching.service.ts`), and the sample data's own words. Six of the
 * shared engine's nine used to reach Greek pages in English. A sentence
 * about another member never takes a gender: «Ενεργό μέλος», not «Ενεργός».
 * Where the page has both profiles, `lib/match-explain.ts` says the same
 * thing with the facts in it; this table is what remains when it does not.
 */
const KNOWN: Record<string, { en: string; el: string }> = {
  'Complementary roles': { en: 'Complementary roles', el: 'Συμπληρωματικοί ρόλοι' },
  'Matching skills & expertise': { en: 'Matching skills and expertise', el: 'Ταιριαστές δεξιότητες' },
  'Aligned goals & vision': { en: 'Aligned goals', el: 'Κοινοί στόχοι' },
  'Same region or open to remote': { en: 'Same region, or open to remote', el: 'Ίδια περιοχή, ή εξ αποστάσεως' },
  'Related industry or stage': { en: 'Related industry or stage', el: 'Σχετικός κλάδος ή στάδιο' },
  'Highly active on platform': { en: 'Active on the platform', el: 'Ενεργό μέλος στην πλατφόρμα' },
  'Complementary skills': { en: 'Complementary skills', el: 'Συμπληρωματικές δεξιότητες' },
  'Same stage': { en: 'Same stage', el: 'Ίδιο στάδιο' },
  'Skills overlap': { en: 'Shared skills', el: 'Κοινές δεξιότητες' },
  'Active this week': { en: 'Active this week', el: 'Ενεργό μέλος αυτή την εβδομάδα' },
  'Mentor match': { en: 'Mentor match', el: 'Ταίριασμα μέντορα' },
  'Stage fit': { en: 'Stage fit', el: 'Ταιριαστό στάδιο' },
  'Cofounder match': { en: 'Co-founder match', el: 'Ταίριασμα συνιδρυτή' },
  'Similar stage': { en: 'Similar stage', el: 'Κοντινό στάδιο' },
  'Same commitment': { en: 'Same time commitment', el: 'Ίδια δέσμευση χρόνου' },
  'Compatible commitment': { en: 'Compatible time commitment', el: 'Συμβατή δέσμευση χρόνου' },
  'Same or nearby location': { en: 'Same or nearby place', el: 'Ίδια ή κοντινή τοποθεσία' },
  // The engine says this when the profile was updated in the last 7 days.
  'Active recently': { en: 'Profile updated this week', el: 'Προφίλ ενημερωμένο αυτή την εβδομάδα' },
  // The engine's word when nothing else matched: said as it is.
  'Profile match': { en: 'Few details in common yet', el: 'Λίγα κοινά στοιχεία ακόμη' },
};

export function matchReasonCopy(text: string): { en: string; el: string } {
  const known = KNOWN[text];
  if (known) return known;
  const open = /^open to (.+)$/i.exec(text.trim());
  if (open) {
    const rest = open[1].toLowerCase();
    const kind = (Object.keys(OPEN_TO_COPY) as OpenToKind[]).find(
      (key) => OPEN_TO_COPY[key].en.toLowerCase() === rest,
    );
    if (kind) {
      return {
        en: `Open to ${OPEN_TO_COPY[kind].en.toLowerCase()}`,
        el: `Ανοιχτός/ή σε: ${OPEN_TO_COPY[kind].el}`,
      };
    }
  }
  return { en: text, el: text };
}
