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

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
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
