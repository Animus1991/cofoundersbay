import { OPEN_TO_COPY, type OpenToKind } from '@cofounderbay/shared';

/**
 * The matching engine names a cause in English. The card already shows the
 * score; this is the sentence under the name, in both languages.
 * An unknown sentence stays as the engine wrote it, in both places.
 */
const KNOWN: Record<string, { en: string; el: string }> = {
  'Complementary roles': { en: 'Complementary roles', el: 'Συμπληρωματικοί ρόλοι' },
  'Matching skills & expertise': { en: 'Matching skills and expertise', el: 'Ταιριαστές δεξιότητες' },
  'Aligned goals & vision': { en: 'Aligned goals', el: 'Κοινοί στόχοι' },
  'Same region or open to remote': { en: 'Same region, or open to remote', el: 'Ίδια περιοχή, ή εξ αποστάσεως' },
  'Related industry or stage': { en: 'Related industry or stage', el: 'Σχετικός κλάδος ή στάδιο' },
  'Highly active on platform': { en: 'Active on the platform', el: 'Ενεργός στην πλατφόρμα' },
  'Complementary skills': { en: 'Complementary skills', el: 'Συμπληρωματικές δεξιότητες' },
  'Same stage': { en: 'Same stage', el: 'Ίδιο στάδιο' },
  'Skills overlap': { en: 'Shared skills', el: 'Κοινές δεξιότητες' },
  'Active this week': { en: 'Active this week', el: 'Ενεργός αυτή την εβδομάδα' },
  'Mentor match': { en: 'Mentor match', el: 'Ταίριασμα μέντορα' },
  'Stage fit': { en: 'Stage fit', el: 'Ταιριαστό στάδιο' },
  'Cofounder match': { en: 'Co-founder match', el: 'Ταίριασμα συνιδρυτή' },
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
