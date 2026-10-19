/**
 * A place as a Greek reader expects it: "Thessaloniki, GR" → «Θεσσαλονίκη,
 * Ελλάδα», "Cyprus" → «Κύπρος», "Remote" → «Εξ αποστάσεως».
 *
 * Places arrive as people typed them, in English, and pages printed them as
 * they came, so one card read «Ελλάδα · Cyprus · UK» (the DOM translator knew
 * "Greece" alone). Each comma-separated part is looked up; a part this list
 * does not know is kept as written, so an unknown town is never mangled.
 */

const PLACES_EL: Record<string, string> = {
  // Cities
  athens: 'Αθήνα',
  thessaloniki: 'Θεσσαλονίκη',
  patras: 'Πάτρα',
  heraklion: 'Ηράκλειο',
  larissa: 'Λάρισα',
  volos: 'Βόλος',
  ioannina: 'Ιωάννινα',
  chania: 'Χανιά',
  nicosia: 'Λευκωσία',
  limassol: 'Λεμεσός',
  larnaca: 'Λάρνακα',
  berlin: 'Βερολίνο',
  munich: 'Μόναχο',
  london: 'Λονδίνο',
  paris: 'Παρίσι',
  amsterdam: 'Άμστερνταμ',
  barcelona: 'Βαρκελώνη',
  madrid: 'Μαδρίτη',
  lisbon: 'Λισαβόνα',
  milan: 'Μιλάνο',
  rome: 'Ρώμη',
  vienna: 'Βιέννη',
  zurich: 'Ζυρίχη',
  dublin: 'Δουβλίνο',
  stockholm: 'Στοκχόλμη',
  sofia: 'Σόφια',
  bucharest: 'Βουκουρέστι',
  istanbul: 'Κωνσταντινούπολη',
  'new york': 'Νέα Υόρκη',
  'san francisco': 'Σαν Φρανσίσκο',
  boston: 'Βοστώνη',
  toronto: 'Τορόντο',
  singapore: 'Σιγκαπούρη',
  'tel aviv': 'Τελ Αβίβ',
  dubai: 'Ντουμπάι',
  // Countries and codes
  greece: 'Ελλάδα',
  gr: 'Ελλάδα',
  cyprus: 'Κύπρος',
  cy: 'Κύπρος',
  uk: 'Ηνωμένο Βασίλειο',
  'united kingdom': 'Ηνωμένο Βασίλειο',
  gb: 'Ηνωμένο Βασίλειο',
  germany: 'Γερμανία',
  de: 'Γερμανία',
  france: 'Γαλλία',
  fr: 'Γαλλία',
  netherlands: 'Ολλανδία',
  nl: 'Ολλανδία',
  spain: 'Ισπανία',
  es: 'Ισπανία',
  portugal: 'Πορτογαλία',
  pt: 'Πορτογαλία',
  italy: 'Ιταλία',
  it: 'Ιταλία',
  austria: 'Αυστρία',
  switzerland: 'Ελβετία',
  ireland: 'Ιρλανδία',
  sweden: 'Σουηδία',
  bulgaria: 'Βουλγαρία',
  romania: 'Ρουμανία',
  turkey: 'Τουρκία',
  india: 'Ινδία',
  usa: 'ΗΠΑ',
  us: 'ΗΠΑ',
  'united states': 'ΗΠΑ',
  // Regions
  eu: 'ΕΕ',
  europe: 'Ευρώπη',
  'se europe': 'Νοτιοανατολική Ευρώπη',
  'southern europe': 'Νότια Ευρώπη',
  dach: 'DACH',
  mena: 'MENA',
  global: 'Παγκοσμίως',
  worldwide: 'Παγκοσμίως',
  // Ways of working
  remote: 'Εξ αποστάσεως',
  hybrid: 'Υβριδικά',
  online: 'Διαδικτυακά',
};

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** The Greek for one place written in English, or the place as written. */
export function placeEl(place: string | null | undefined): string {
  if (!place) return '';
  return place
    .split(',')
    .map((part) => PLACES_EL[fold(part)] ?? part.trim())
    .join(', ');
}

/** Both languages, for `BilingualText`. */
export function placePair(place: string | null | undefined): { en: string; el: string } {
  return { en: place ?? '', el: placeEl(place) };
}

/**
 * The Greek for text that is only a place ("Heraklion, Greece", "Remote"),
 * or null. The DOM pass uses it for places pages print as they came: every
 * part must be known, and a lone two-letter code ("IT", "US") is left alone,
 * since alone it is as likely to be a word or an abbreviation as a country.
 */
export function placeElStrict(text: string): string | null {
  const parts = text.split(',');
  if (parts.length > 3) return null;
  if (parts.length === 1 && fold(text).length <= 2) return null;
  const out: string[] = [];
  for (const part of parts) {
    const el = PLACES_EL[fold(part)];
    if (!el) return null;
    out.push(el);
  }
  return out.join(', ');
}
