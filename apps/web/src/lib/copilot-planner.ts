import { resolveRouteTarget } from '@/lib/action-registry';
import type { CopilotToolName, PlannedTool } from './copilot-types';

const ROUTE_ALIASES: Array<{ keys: string[]; href: string; label: string }> = [
  { keys: ['dashboard', 'home', 'overview', 'αρχική'], href: '/dashboard', label: 'Dashboard' },
  { keys: ['match', 'matches', 'ταιριά', 'ταιριασματα'], href: '/matches', label: 'Matches' },
  { keys: ['discover', 'explore', 'ανακάλυψε'], href: '/discover', label: 'Discover' },
  { keys: ['search', 'αναζήτηση'], href: '/search', label: 'Search' },
  { keys: ['message', 'messages', 'inbox', 'μηνύματα'], href: '/messages', label: 'Messages' },
  { keys: ['connection', 'connections', 'intros', 'συνδέσεις'], href: '/connections', label: 'Connections' },
  { keys: ['profile', 'προφίλ'], href: '/profile', label: 'Profile' },
  { keys: ['settings', 'ρυθμίσεις'], href: '/settings', label: 'Settings' },
  { keys: ['research', 'canvas', 'έρευνα'], href: '/research', label: 'Research' },
  { keys: ['builder', 'pitch'], href: '/builder', label: 'Builder' },
  { keys: ['notification', 'ειδοποιήσεις'], href: '/notifications', label: 'Notifications' },
  { keys: ['shortlist', 'saved profile', 'αποθηκευμ'], href: '/shortlist', label: 'Saved Profiles' },
  { keys: ['calendar', 'ημερολόγ', 'ημερολογ'], href: '/calendar', label: 'Calendar' },
  { keys: ['fundraising', 'χρηματοδ'], href: '/fundraising', label: 'Fundraising' },
  { keys: ['job', 'jobs', 'θέσεις', 'θεσεις'], href: '/jobs', label: 'Jobs' },
  { keys: ['event', 'events', 'εκδήλωσ', 'εκδηλωσ'], href: '/events', label: 'Events' },
  { keys: ['mentor', 'mentoring', 'μέντορ', 'μεντορ'], href: '/mentoring', label: 'Mentoring' },
  { keys: ['assistant', 'copilot', 'ai chat'], href: '/ai', label: 'AI Assistant' },
];

const LOCATION_ALIASES: Array<{ keys: string[]; value: string }> = [
  { keys: ['athens', 'αθήνα', 'αθηνα', 'greece', 'ελλάδα', 'ελλαδα'], value: 'Athens' },
  { keys: ['berlin', 'berlín', 'germany'], value: 'Berlin' },
  { keys: ['london', 'uk'], value: 'London' },
  { keys: ['cyprus', 'limassol', 'κύπρο', 'κυπρο'], value: 'Cyprus' },
];

const PERSON_ALIASES: Array<{ keys: string[]; name: string }> = [
  { keys: ['elena', 'papadopoulos', 'έλενα'], name: 'Elena' },
  { keys: ['marcus', 'chen', 'μάρκους', 'μαρκους'], name: 'Marcus' },
  { keys: ['sarah', 'kim'], name: 'Sarah' },
  { keys: ['nikos', 'andreou', 'νίκος', 'νικος'], name: 'Nikos' },
];

/**
 * The analytics windows, longest spelling first so "14 days" is not captured
 * by "4 days" and "90" is not captured inside "190".
 */
const PERIOD_ALIASES: Array<{ keys: string[]; period: string }> = [
  { keys: ['90 day', '90d', '3 month', '90 ημέρ', '90 ημερ', '3 μήν', '3 μην', 'τρίμην', 'τριμην'], period: '90d' },
  // 'μήνα', not 'μήν': the shorter stem is inside 'μήνυμα' (message).
  { keys: ['30 day', '30d', 'last month', 'μήνα', 'μηνα', '30 ημέρ', '30 ημερ'], period: '30d' },
  { keys: ['14 day', '14d', 'two week', 'fortnight', '14 ημέρ', '14 ημερ', 'δεκαπενθ'], period: '14d' },
  { keys: ['7 day', '7d', 'last week', 'this week', '7 ημέρ', '7 ημερ', 'εβδομάδ', 'εβδομαδ'], period: '7d' },
];

const READINESS_DIMENSION_ALIASES: Array<{ keys: string[]; dimension: string }> = [
  { keys: ['team', 'ομάδ', 'ομαδ'], dimension: 'team' },
  { keys: ['market', 'αγορά', 'αγορα'], dimension: 'market' },
  { keys: ['product', 'προϊόν', 'προιον', 'προϊον'], dimension: 'product' },
  { keys: ['business', 'μοντέλο', 'μοντελο', 'επιχειρηματικ'], dimension: 'business' },
  { keys: ['funding', 'χρηματοδ', 'επένδυσ', 'επενδυσ'], dimension: 'funding' },
  { keys: ['execution', 'εκτέλεσ', 'εκτελεσ', 'υλοποίησ', 'υλοποιησ'], dimension: 'execution' },
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Whether the reader is asking about the screen in front of them.
 *
 * Narrow on purpose. A question about the page is one the page's own snapshot
 * can answer; anything broader belongs to the network tools, and answering it
 * by describing the current page would be a non-sequitur.
 *
 * It lives here rather than in the engine because every other phrase list does
 * — and because the engine's source is scanned for user-facing prose, where a
 * list of matching keys reads as untranslated copy.
 */
const THIS_PAGE_PHRASES = [
  'this page', 'this screen', 'what am i looking at', 'what is here', 'what do i see',
  'where am i', 'what should i do here', 'explain this',
  'αυτή τη σελίδα', 'αυτη τη σελιδα', 'αυτή η σελίδα', 'αυτη η σελιδα',
  'τι βλέπω', 'τι βλεπω', 'πού βρίσκομαι', 'που βρισκομαι',
  'τι κάνω εδώ', 'τι κανω εδω', 'τι είναι αυτό', 'τι ειναι αυτο',
];

export function asksAboutThisPage(message: string): boolean {
  return includesAny(message.toLowerCase(), THIS_PAGE_PHRASES);
}

export function detectAnalyticsPeriod(message: string): string | undefined {
  return PERIOD_ALIASES.find((alias) => includesAny(message, alias.keys))?.period;
}

export function detectReadinessDimension(message: string): string | undefined {
  return READINESS_DIMENSION_ALIASES.find((alias) => includesAny(message, alias.keys))?.dimension;
}

/**
 * Pulls a workspace name out of quotes.
 *
 * Only quoted, deliberately. Guessing a name from free prose would create
 * something the user has to go and rename, and the engine's "what should I
 * call it?" is a better answer than a wrong name. Handles the curly quotes a
 * phone keyboard produces as well as the straight ones a desktop does.
 */
export function detectQuotedName(rawMessage: string): string | undefined {
  const match = rawMessage.match(/["“'«]([^"”'»]{1,100})["”'»]/);
  return match?.[1].trim() || undefined;
}

export function detectLocation(message: string): string | undefined {
  const hit = LOCATION_ALIASES.find((alias) => includesAny(message, alias.keys));
  return hit?.value;
}

export function detectPersonName(message: string): string | undefined {
  const hit = PERSON_ALIASES.find((alias) => includesAny(message, alias.keys));
  return hit?.name;
}

export function detectNavigateHref(message: string): { href: string; label: string } | undefined {
  const wantsNav = includesAny(message, [
    'open',
    'go to',
    'take me',
    'navigate',
    'άνοιξε',
    'ανοιξε',
    'πήγαινε',
    'πηγαινε',
    'δείξε μου τη σελίδα',
  ]);
  if (!wantsNav) return undefined;
  const hit = ROUTE_ALIASES.find((alias) => includesAny(message, alias.keys));
  if (hit) return { href: hit.href, label: hit.label };

  // The aliases above cover 18 destinations; the product has 155, and
  // `PAGE_REGISTRY` already carries a bilingual title for each one. Consulted
  // only after an alias misses, so every phrase that resolved before still
  // resolves to exactly the same route as before.
  const fromRegistry = resolveRouteTarget(message);
  return fromRegistry ? { href: fromRegistry.href, label: fromRegistry.label } : undefined;
}

function searchQueryFromMessage(message: string): string {
  const stripped = message
    .replace(/\b(find|search|look for|show me|βρες|βρες μου|ψάξε|δείξε|co-?founders?|technical|business|mentor|investor|στην|στον|στη|the|a|an|μου|να)\b/gi, ' ')
    .replace(/[?!.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, 80);
}

/**
 * Rule-based planner used when the LLM has no tools (preview, Ollama down).
 * Returns 1–3 tools; never proposes destructive admin actions.
 */
export function planCopilotTools(rawMessage: string): PlannedTool[] {
  const message = rawMessage.trim().toLowerCase();
  if (!message) return [{ name: 'get_graph', args: {} }];

  const tools: PlannedTool[] = [];
  const add = (name: CopilotToolName, args: Record<string, string> = {}) => {
    if (!tools.some((t) => t.name === name && JSON.stringify(t.args) === JSON.stringify(args))) {
      tools.push({ name, args });
    }
  };

  const location = detectLocation(message);
  const person = detectPersonName(message);
  const nav = detectNavigateHref(message);

  const wantsGraph = includesAny(message, [
    'what should i do',
    'next',
    'summary',
    'unread',
    'status',
    'graph',
    'τι να κάνω',
    'τι να κανω',
    'σύνοψη',
    'συνοψη',
    'αδιάβαστα',
    'αδιαβαστα',
    'επόμενο',
    'επομενο',
  ]);

  const wantsSearch = includesAny(message, [
    'find',
    'search',
    'look for',
    'who is',
    'βρες',
    'ψάξε',
    'ψαξε',
    'αναζήτη',
    'technical cofounder',
    'co-founder',
    'cofounder',
    'mentor',
    'investor',
  ]);

  const wantsMatches = includesAny(message, [
    'match',
    'recommend',
    'for you',
    'compatible',
    'ταιρι',
    'σύσταση',
    'συσταση',
    'προτάσ',
    'προτασ',
  ]);

  const wantsNotifications = includesAny(message, [
    'notification',
    'alert',
    'inbox alert',
    'ειδοποιή',
    'ειδοποιη',
  ]);

  const wantsShortlist = includesAny(message, [
    'shortlist',
    'bookmark',
    'save to',
    'save them',
    'save her',
    'save him',
    'αποθήκευσε',
    'αποθηκευσε',
    'λίστα',
    'λιστα',
  ]);

  const wantsConnect = includesAny(message, [
    'connect',
    'intro',
    'introduction',
    'σύνδεσε',
    'συνδεσε',
    'σύνδεση',
    'συνδεση',
    'στείλε intro',
    'στειλε intro',
  ]);

  const wantsMessage = includesAny(message, [
    'message',
    'dm',
    'chat with',
    'γράψε',
    'γραψε',
    'στείλε μήνυμα',
    'στειλε μηνυμα',
  ]);

  // Analytics, readiness and workspace intents. Each needs both an object and
  // a verb before it plans anything: "readiness" alone is a question about a
  // score, not a request to change one.
  const wantsPeriod =
    includesAny(message, ['analytic', 'metric', 'αναλυτικ', 'μετρήσ', 'μετρησ', 'στατιστικ']) &&
    detectAnalyticsPeriod(message) !== undefined;

  const wantsWorkspace = includesAny(message, [
    'create a workspace',
    'create workspace',
    'new workspace',
    'start a workspace',
    'set up a workspace',
    'δημιούργησε χώρο',
    'δημιουργησε χωρο',
    'νέο χώρο εργασίας',
    'νεο χωρο εργασιας',
    'φτιάξε χώρο',
    'φτιαξε χωρο',
  ]);

  const wantsCriterion =
    includesAny(message, ['readiness', 'criteri', 'ετοιμότητ', 'ετοιμοτητ', 'κριτήρι', 'κριτηρι']) &&
    includesAny(message, [
      'tick',
      'check off',
      'mark',
      'complete',
      'done',
      'τσέκαρε',
      'τσεκαρε',
      'σημείωσε',
      'σημειωσε',
      'ολοκλήρωσ',
      'ολοκληρωσ',
    ]);

  if (wantsGraph) add('get_graph');

  if (wantsSearch) {
    const args: Record<string, string> = {};
    const q = searchQueryFromMessage(rawMessage);
    if (person) args.q = person;
    else if (q) args.q = q;
    if (location) args.location = location;
    if (includesAny(message, ['technical', 'τεχνικ', 'engineer', 'developer'])) {
      args.q = [args.q, 'technical'].filter(Boolean).join(' ');
    }
    add('search_people', args);
  }

  if (wantsMatches) add('get_recommendations');

  if (wantsNotifications) add('get_notifications');

  if (wantsShortlist) {
    const args: Record<string, string> = {};
    if (person) args.name = person;
    if (person && !tools.some((t) => t.name === 'search_people')) {
      add('search_people', { q: person });
    }
    add('shortlist_add', args);
  }

  if (wantsConnect) {
    const args: Record<string, string> = {};
    if (person) args.name = person;
    add('send_connection', args);
    if (person && !tools.some((t) => t.name === 'search_people')) {
      add('search_people', { q: person });
    }
  }

  if (wantsMessage && (person || !nav)) {
    const args: Record<string, string> = {};
    if (person) args.name = person;
    add('start_or_send_message', args);
    if (person && !tools.some((t) => t.name === 'search_people')) {
      add('search_people', { q: person });
    }
  }

  if (wantsPeriod) {
    const period = detectAnalyticsPeriod(message);
    if (period) add('analytics_set_period', { period });
  }

  if (wantsWorkspace) {
    const name = detectQuotedName(rawMessage);
    add('workspace_create', name ? { name } : {});
  }

  if (wantsCriterion) {
    const dimension = detectReadinessDimension(message);
    // Without a criterion id there is nothing to write, and one cannot be
    // guessed from prose — the engine turns this into a question naming the
    // six dimensions rather than a half-formed write.
    add('readiness_tick_criterion', dimension ? { dimension } : {});
  }

  if (nav) add('navigate', { href: nav.href, label: nav.label });

  if (tools.length === 0) {
    if (person || location) add('search_people', { ...(person ? { q: person } : {}), ...(location ? { location } : {}) });
    else add('get_graph');
  }

  if (!tools.some((t) => t.name === 'get_graph') && tools.length <= 2) {
    tools.unshift({ name: 'get_graph', args: {} });
  }

  return tools.slice(0, 4);
}
