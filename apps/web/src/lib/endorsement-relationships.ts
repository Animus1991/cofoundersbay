/**
 * How the giver of an endorsement knows the person they endorse.
 *
 * The record keeps the words as chosen: the dialog's chips store their
 * English, and the demo and members may write their own. The Greek is found
 * here, so the card, the dialog and the assistant say the same thing. Each
 * Greek form names the relationship in no one's gender: «Συνιδρυτής»,
 * «Πελάτης» and «Επενδυτής» described the giver in the masculine, and the
 * card printed «Σχέση: Peer founder» in English (docs §54 rule, §162).
 */
export const ENDORSEMENT_RELATIONSHIPS: readonly { en: string; el: string }[] = [
  { en: 'Worked together', el: 'Συνεργαστήκαμε' },
  { en: 'Co-founder', el: 'Συνιδρύσαμε' },
  { en: 'Mentored me', el: 'Με καθοδήγησε' },
  { en: 'I mentored them', el: 'Ήμουν μέντορας' },
  { en: 'Client', el: 'Πελατειακή σχέση' },
  { en: 'Investor', el: 'Επένδυσα' },
];

/** Relationships written outside the dialog's chips (the demo's own among them). */
const WRITTEN_EL: Record<string, string> = {
  mentor: 'Ήμουν μέντορας',
  'peer founder': 'Ιδρυτές και οι δύο',
  'trial project': 'Δοκιμαστικό έργο',
};

/** The Greek for a stored relationship, or the words as written when unknown. */
export function relationshipEl(value: string): string {
  const key = value.trim().toLowerCase();
  return ENDORSEMENT_RELATIONSHIPS.find((r) => r.en.toLowerCase() === key)?.el ?? WRITTEN_EL[key] ?? value;
}
