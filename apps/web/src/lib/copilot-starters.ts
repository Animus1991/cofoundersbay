import type { CfbGlyphName } from '@/components/icons/CfbGlyph';

/**
 * Empty-state prompts for the copilot. English is what `sendMessage` and the
 * planner receive, so these stay in lockstep with SAMPLE_ASK on
 * `/ai/capabilities` wherever a capability already has the same ask.
 *
 * Reads look something up. Writes change something you own and wait for
 * confirm — the empty state has to say that before the click, not only on
 * the ActionCard that follows it.
 */
export type CopilotStarterKind = 'read' | 'write';

export type CopilotStarter = {
  en: string;
  el: string;
  kind: CopilotStarterKind;
  glyph: CfbGlyphName;
  /** Full-page empty state. Default true. */
  page?: boolean;
  /** Popup empty state. Default true. */
  popup?: boolean;
};

export const COPILOT_STARTERS: CopilotStarter[] = [
  { en: 'What should I do next?', el: 'Τι να κάνω μετά;', kind: 'read', glyph: 'spark' },
  { en: 'Show my best matches', el: 'Δείξε τις καλύτερες αντιστοιχίσεις', kind: 'read', glyph: 'matches' },
  { en: 'Find a technical cofounder in Athens', el: 'Βρες τεχνικό συνιδρυτή στην Αθήνα', kind: 'read', glyph: 'people' },
  { en: 'How is my fundraising going?', el: 'Πώς πάει η χρηματοδότησή μου;', kind: 'read', glyph: 'wallet' },
  { en: 'Save Elena to my shortlist', el: 'Αποθήκευσε την Elena στη λίστα', kind: 'write', glyph: 'bookmark' },
  { en: 'Remove Elena from my shortlist', el: 'Βγάλε την Elena από τη λίστα', kind: 'write', glyph: 'bookmark', popup: false },
  { en: 'Connect with Elena', el: 'Στείλε αίτημα σύνδεσης στην Elena', kind: 'write', glyph: 'people' },
];

/**
 * Whose work the empty state should name.
 *
 * A founder opening the assistant and a mentor opening it were offered the
 * same four questions. The phrases below are ones the planner already turns
 * into a read or a confirmed change for that role's own pages.
 */
export type StarterAudience = 'founder' | 'mentor' | 'investor' | 'provider' | 'org' | 'admin';

const ROLE_STARTERS: Record<Exclude<StarterAudience, 'founder'>, CopilotStarter[]> = {
  mentor: [
    { en: 'What should I do next?', el: 'Τι να κάνω μετά;', kind: 'read', glyph: 'spark' },
    { en: 'Show mentoring requests', el: 'Δείξε τα αιτήματα καθοδήγησης', kind: 'read', glyph: 'people' },
    { en: 'Which sessions are coming up?', el: 'Ποιες συνεδρίες έρχονται;', kind: 'read', glyph: 'calendar' },
    { en: 'Show my availability', el: 'Δείξε τη διαθεσιμότητά μου', kind: 'read', glyph: 'calendar' },
    { en: "Accept Sofia's mentoring request", el: 'Αποδέξου το αίτημα καθοδήγησης της Σοφίας', kind: 'write', glyph: 'people' },
  ],
  investor: [
    { en: 'What should I do next?', el: 'Τι να κάνω μετά;', kind: 'read', glyph: 'spark' },
    { en: 'Show my investor board', el: 'Δείξε τον πίνακα επενδύσεων', kind: 'read', glyph: 'wallet' },
    { en: 'Show my best matches', el: 'Δείξε τις καλύτερες αντιστοιχίσεις', kind: 'read', glyph: 'matches' },
  ],
  provider: [
    { en: 'What should I do next?', el: 'Τι να κάνω μετά;', kind: 'read', glyph: 'spark' },
    { en: 'Show my inquiries', el: 'Δείξε τα αιτήματα πελατών', kind: 'read', glyph: 'people' },
    { en: 'Show my services', el: 'Δείξε τις υπηρεσίες μου', kind: 'read', glyph: 'wallet' },
  ],
  org: [
    { en: 'What should I do next?', el: 'Τι να κάνω μετά;', kind: 'read', glyph: 'spark' },
    { en: 'Which accelerator programmes are open right now?', el: 'Ποια προγράμματα επιτάχυνσης δέχονται αιτήσεις;', kind: 'read', glyph: 'people' },
    { en: 'Show organisation members', el: 'Δείξε τα μέλη του οργανισμού', kind: 'read', glyph: 'people' },
    { en: 'Show cohorts', el: 'Δείξε τους κύκλους', kind: 'read', glyph: 'calendar' },
  ],
  admin: [
    { en: 'What should I do next?', el: 'Τι να κάνω μετά;', kind: 'read', glyph: 'spark' },
    { en: 'How many users are on the platform?', el: 'Πόσοι χρήστες είναι στην πλατφόρμα;', kind: 'read', glyph: 'people' },
    { en: 'Show the moderation queue', el: 'Δείξε την ουρά ελέγχου', kind: 'read', glyph: 'spark' },
  ],
};

export function starterAudience(role: string | null | undefined): StarterAudience {
  switch (role) {
    case 'mentor':
    case 'advisor':
    case 'coach':
      return 'mentor';
    case 'angel_investor':
    case 'vc_scout':
    case 'vc_analyst':
    case 'syndicate_manager':
      return 'investor';
    case 'service_provider':
    case 'legal_partner':
    case 'finance_advisor':
    case 'recruiter':
      return 'provider';
    case 'incubator_admin':
    case 'accelerator_admin':
    case 'university_admin':
    case 'venture_studio_admin':
      return 'org';
    case 'platform_admin':
      return 'admin';
    default:
      return 'founder';
  }
}

export function copilotStartersFor(surface: 'page' | 'popup', role?: string | null): {
  reads: CopilotStarter[];
  writes: CopilotStarter[];
} {
  const audience = starterAudience(role);
  const source = audience === 'founder' ? COPILOT_STARTERS : ROLE_STARTERS[audience];
  const visible = source.filter((starter) =>
    surface === 'popup' ? starter.popup !== false : starter.page !== false,
  );
  return {
    reads: visible.filter((starter) => starter.kind === 'read'),
    writes: visible.filter((starter) => starter.kind === 'write'),
  };
}

export const COPILOT_PRODUCT_LINKS: { href: string; en: string; el: string }[] = [
  { href: '/matches', en: 'Matches', el: 'Αντιστοιχίσεις' },
  { href: '/messages', en: 'Messages', el: 'Μηνύματα' },
  { href: '/fundraising', en: 'Fundraising', el: 'Χρηματοδότηση' },
  { href: '/research', en: 'Research', el: 'Έρευνα' },
  { href: '/calendar', en: 'Calendar', el: 'Ημερολόγιο' },
  { href: '/builder', en: 'Builder', el: 'Builder' },
  { href: '/builder/applications', en: 'Applications', el: 'Αιτήσεις' },
];
