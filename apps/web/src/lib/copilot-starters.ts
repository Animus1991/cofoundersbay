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

/** A question about the page the reader is on, with the read it must plan. */
export type PageStarter = CopilotStarter & { tool: string };

const read = (en: string, el: string, glyph: CfbGlyphName, tool: string): PageStarter => ({ en, el, kind: 'read', glyph, tool });

/**
 * The same seven starters showed on every page ("How is my fundraising
 * going?" on /profile). Opened from a page, the assistant now leads with
 * questions about that page - each one a phrasing the eval fixture already
 * holds, so the planner is known to answer it with the named read.
 */
export const PAGE_STARTERS: Record<string, PageStarter[]> = {
  '/matches': [read('Why do I match with Elena?', 'Γιατί ταιριάζω με την Έλενα;', 'matches', 'get_match_detail')],
  '/profile': [
    read('Who viewed my profile this month?', 'Ποιοι είδαν το προφίλ μου;', 'people', 'get_profile_viewers'),
    read('What evidence backs my skills?', 'Ποια τεκμήρια στηρίζουν τις δεξιότητές μου;', 'award', 'get_skill_evidence'),
  ],
  '/analytics': [read('Who viewed my profile this month?', 'Ποιοι είδαν το προφίλ μου;', 'people', 'get_profile_viewers')],
  '/commitments': [read('Where do my commitments stand and what is waiting on me?', 'Τι γίνεται με τις δεσμεύσεις μου;', 'pact', 'get_commitments')],
  '/intros': [
    read('Show my warm introductions', 'Δείξε μου τις συστάσεις γνωριμίας', 'intro', 'get_intros'),
    read('Who could introduce me to Nikos?', 'Ποιος μπορεί να με συστήσει στον Νίκο;', 'intro', 'get_intros'),
  ],
  '/scout': [read('What did my co-founder scout find?', 'Τι βρήκε ο ανιχνευτής συνιδρυτών;', 'scout', 'get_scout')],
  '/perks': [read('Are there any startup perks or cloud credits for us?', 'Υπάρχουν προσφορές συνεργατών ή εκπτώσεις για startups;', 'perk', 'get_perks')],
  '/updates': [read('Any new founder updates from people I follow?', 'Τι νέες ενημερώσεις ιδρυτών έχω;', 'update', 'get_founder_updates')],
  '/events': [read('What events are coming up this month?', 'Τι εκδηλώσεις έχει αυτόν τον μήνα;', 'calendar', 'get_events')],
  '/milestones': [read('Which of my milestones are overdue?', 'Ποια ορόσημα έχουν καθυστερήσει;', 'flag', 'get_milestones')],
  '/messages': [
    read('Do I have unread messages?', 'Έχω αδιάβαστα μηνύματα;', 'messages', 'get_messages'),
    read('Search my messages for research canvas', 'Βρες στα μηνύματά μου τον πίνακα έρευνας', 'search', 'search_messages'),
  ],
  '/connections': [read('Any connection requests waiting for me?', 'Έχω αιτήματα σύνδεσης σε αναμονή;', 'people', 'get_connections')],
  '/programs': [read('Which accelerator programmes are open right now?', 'Ποια προγράμματα επιτάχυνσης δέχονται αιτήσεις;', 'award', 'get_programs')],
  '/jobs': [read('Are there any open jobs I could apply to?', 'Υπάρχουν αγγελίες για θέσεις εργασίας;', 'briefcase', 'get_jobs')],
  // The AI Studio prototype offers its page questions on more pages; these
  // three are ones the eval fixture already holds, so the planner is known
  // to answer them with the named read.
  '/readiness': [read('How investor ready is my startup?', 'Πόσο καλή είναι η ετοιμότητα της startup μου;', 'gauge', 'get_readiness')],
  '/mentoring': [read('Which mentors are available for sessions?', 'Ποιοι μέντορες είναι διαθέσιμοι;', 'mentor', 'get_mentors')],
  '/discover': [read('Find a technical cofounder in Athens', 'Βρες τεχνικό συνιδρυτή στην Αθήνα', 'people', 'search_people')],
  '/fundraising': [read('How is my fundraising going?', 'Πώς πάει η χρηματοδότησή μου;', 'wallet', 'get_fundraising')],
};

/** The starters for a path: its own entry, or the nearest parent's ("/matches/u1" reads "/matches"). */
export function pageStartersFor(pathname: string | null | undefined): PageStarter[] {
  let path = (pathname ?? '').split('?')[0].replace(/\/+$/, '');
  while (path) {
    if (PAGE_STARTERS[path]) return PAGE_STARTERS[path];
    path = path.slice(0, path.lastIndexOf('/'));
  }
  return [];
}

/**
 * The empty state's starters: the reader's role chooses the general ones (a
 * mentor is offered mentoring work, not a founder's fundraising), and the
 * page they opened it from puts its own questions first. One options object,
 * because both used to arrive as the same positional argument.
 */
export function copilotStartersFor(
  surface: 'page' | 'popup',
  { pathname, role }: { pathname?: string | null; role?: string | null } = {},
): {
  reads: CopilotStarter[];
  writes: CopilotStarter[];
} {
  const audience = starterAudience(role);
  const source = audience === 'founder' ? COPILOT_STARTERS : ROLE_STARTERS[audience];
  const visible = source.filter((starter) =>
    surface === 'popup' ? starter.popup !== false : starter.page !== false,
  );
  const general = visible.filter((starter) => starter.kind === 'read');
  const forPage = pageStartersFor(pathname);
  return {
    // The page's questions lead; the list keeps its length, so the popup stays compact.
    reads: forPage.length
      ? [...forPage, ...general.filter((g) => !forPage.some((p) => p.en === g.en))].slice(0, general.length)
      : general,
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
