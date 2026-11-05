/**
 * The two forms the assistant drafts since §111 (docs §107.7-4): a programme
 * application note and a review asked of the reader.
 *
 * A model writes the words itself. Without one, the planner's path starts the
 * note from what the profile says, and leaves in brackets what only the
 * founder knows: nothing is invented, and the gaps are visible.
 */

export type DraftLanguage = 'en' | 'el';

/** The reader's chosen language, outside React; Greek unless they chose English. */
export function readerLanguage(): DraftLanguage {
  try {
    return window.localStorage.getItem('cfb:primary-language') === 'en' ? 'en' : 'el';
  } catch {
    return 'el';
  }
}

/** A programme application note from the profile's own facts, with the gaps in brackets. */
export function startingApplicationNote(
  profile: { displayName?: string | null; headline?: string | null; skills?: Array<{ skillName?: string | null }> | null } | null,
  programTitle: string | null | undefined,
  lang: DraftLanguage,
): string {
  const name = profile?.displayName?.trim();
  const headline = profile?.headline?.trim();
  const skills = (profile?.skills ?? []).map((s) => s.skillName?.trim()).filter((s): s is string => Boolean(s)).slice(0, 4);
  const program = programTitle?.trim();
  if (lang === 'el') {
    return [
      name ? `Είμαι ${name}${headline ? `, ${headline}` : ''}.` : null,
      skills.length ? `Φέρνω: ${skills.join(', ')}.` : null,
      `Κάνουμε αίτηση${program ? ` στο «${program}»` : ''} γιατί [γιατί ταιριάζει η startup σας: πρόβλημα, πελάτες, πρόοδος με αριθμούς].`,
      'Από το πρόγραμμα θέλουμε [τι θέλετε: χρηματοδότηση, μέντορες, πελάτες, χώρο].',
    ].filter(Boolean).join(' ');
  }
  return [
    name ? `I am ${name}${headline ? `, ${headline}` : ''}.` : null,
    skills.length ? `I bring: ${skills.join(', ')}.` : null,
    `We are applying${program ? ` to “${program}”` : ''} because [why the startup fits: problem, customers, progress in figures].`,
    'From the programme we want [what you want: funding, mentors, customers, space].',
  ].filter(Boolean).join(' ');
}

export type ReviewNote = { area: string; text: string };

/** "Problem: named in one sentence; Team: complementary" → two notes. */
export function parseReviewNotes(value: unknown): ReviewNote[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colon = part.indexOf(':');
      return colon > 0
        ? { area: part.slice(0, colon).trim(), text: part.slice(colon + 1).trim() }
        : { area: '', text: part };
    })
    .filter((note) => note.text.length > 0)
    .slice(0, 6);
}

/** The notes back to the one-line form a draft travels in. */
export function formatReviewNotes(notes: readonly ReviewNote[]): string {
  return notes.filter((n) => n.text.trim()).map((n) => (n.area.trim() ? `${n.area.trim()}: ${n.text.trim()}` : n.text.trim())).join('; ');
}

/** A score a model or a person typed, kept only when it is 1–10. */
export function readScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
}

const GREEK_TO_LATIN: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm',
  ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
};

/**
 * A name as letters that match across scripts: «Σοφία» and "Sofia" give the
 * same key, as do «Νίκος» and "Nikos". Spellings that differ in sound more
 * than script ("Marcus", «Μάρκους») are brought close: c→k, ph→f, y→i, ou→u.
 */
export function nameKey(name: string): string {
  const plain = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const latin = [...plain].map((ch) => GREEK_TO_LATIN[ch] ?? ch).join('');
  return latin
    .replace(/ou/g, 'u')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/ch/g, 'h')
    .replace(/c/g, 'k')
    .replace(/y/g, 'i')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whether a typed name (often just the first, often in Greek) names this person. */
export function namesPerson(typed: string, displayName: string | null | undefined): boolean {
  const want = nameKey(typed);
  if (!want || !displayName) return false;
  const have = nameKey(displayName);
  return have.includes(want) || have.split(' ').some((part) => part && want.split(' ').includes(part));
}
