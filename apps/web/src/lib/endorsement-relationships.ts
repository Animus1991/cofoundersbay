/**
 * How the giver of an endorsement knows the person they endorse.
 *
 * The record keeps the words as chosen: the dialog's chips store their
 * English, and the demo and members may write their own. The Greek is found
 * here, so the card, the dialog and the assistant agree. No form names anyone
 * in one gender: «Συνιδρυτής», «Πελάτης» and «Επενδυτής» described the giver
 * in the masculine, and the card printed «Σχέση: Peer founder» in English
 * (docs §54 rule, §162).
 *
 * `el` is the chip, in the giver's own voice, as they choose it. `kindEl` is
 * the relationship itself, for the card after «Σχέση:» and for the assistant:
 * read by the person endorsed, «Ήμουν μέντορας» left unclear who "I" was.
 */
export const ENDORSEMENT_RELATIONSHIPS: readonly { en: string; el: string; kindEl: string }[] = [
  { en: 'Worked together', el: 'Συνεργαστήκαμε', kindEl: 'Συνεργασία' },
  { en: 'Co-founder', el: 'Συνιδρύσαμε', kindEl: 'Συνίδρυση' },
  { en: 'Mentored me', el: 'Με καθοδήγησε', kindEl: 'Καθοδήγηση' },
  { en: 'I mentored them', el: 'Ήμουν μέντορας', kindEl: 'Καθοδήγηση' },
  { en: 'Client', el: 'Παροχή υπηρεσιών', kindEl: 'Παροχή υπηρεσιών' },
  { en: 'Investor', el: 'Επένδυσα', kindEl: 'Επένδυση' },
];

/** Relationships written outside the dialog's chips (the demo's own among them). */
const WRITTEN_EL: Record<string, string> = {
  mentor: 'Καθοδήγηση',
  'peer founder': 'Ιδρυτές και οι δύο',
  'trial project': 'Δοκιμαστικό έργο',
};

/** The relationship a stored value names, in Greek; the words as written when unknown. */
export function relationshipEl(value: string): string {
  const key = value.trim().toLowerCase();
  return ENDORSEMENT_RELATIONSHIPS.find((r) => r.en.toLowerCase() === key)?.kindEl ?? WRITTEN_EL[key] ?? value;
}
