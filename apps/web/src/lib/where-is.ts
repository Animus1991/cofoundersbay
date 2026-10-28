import { PAGE_REGISTRY, type PageMeta } from '@/lib/page-registry';
import type { PageControlSummary } from '@/lib/page-controls';

/**
 * "Where do I export my pitch?" — answered from the page registry (every route,
 * bilingual title/description) and the controls the open page registered, so
 * the answer is never a hand-written list that drifts from the product.
 */

export type WhereIsHit = {
  page: PageMeta;
  score: number;
  /** Which words of the question matched, for the "because" line. */
  matched: string[];
};

export type WhereIsControlHit = {
  control: PageControlSummary;
  score: number;
};

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Question scaffolding that carries no meaning for the lookup.
const FILLERS = new Set([
  'where', 'which', 'what', 'how', 'do', 'does', 'can', 'could', 'would', 'should', 'i', 'we', 'you', 'me', 'my', 'our', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'for', 'is', 'are', 'it', 'this', 'that', 'find', 'go', 'get', 'see', 'open', 'page', 'here', 'from', 'with', 'and', 'or', 'please',
  'που', 'πως', 'ποια', 'ποιο', 'ποιος', 'σε', 'στο', 'στη', 'στην', 'στον', 'στα', 'στις', 'στους', 'το', 'τη', 'την', 'τον', 'τα', 'τις', 'τους', 'ο', 'η', 'οι', 'μου', 'μας', 'σου', 'κανω', 'μπορω', 'βρισκω', 'βρω', 'βλεπω', 'ειναι', 'να', 'και', 'για', 'με', 'απο', 'σελιδα', 'εδω', 'θα', 'ενα', 'μια', 'παρακαλω',
]);

// A few product words people say one way and the registry says another.
const SYNONYMS: Record<string, string[]> = {
  export: ['export', 'download', 'csv', 'εξαγωγ', 'κατεβασ'],
  download: ['export', 'download', 'εξαγωγ', 'κατεβασ'],
  pitch: ['pitch', 'deck', 'παρουσιασ'],
  deck: ['pitch', 'deck'],
  job: ['job', 'jobs', 'role', 'θεσ', 'αγγελι'],
  jobs: ['job', 'jobs', 'θεσ', 'αγγελι'],
  hire: ['job', 'jobs', 'θεσ'],
  perk: ['perk', 'perks', 'offer', 'προσφορ', 'παροχ'],
  perks: ['perk', 'perks', 'προσφορ', 'παροχ'],
  discount: ['perk', 'perks', 'εκπτωσ', 'προσφορ'],
  code: ['perk', 'perks', 'invite', 'κωδικ'],
  investor: ['investor', 'investors', 'fundraising', 'deal', 'επενδυτ', 'χρηματοδοτ'],
  investors: ['investor', 'investors', 'fundraising', 'επενδυτ', 'χρηματοδοτ'],
  raise: ['fundraising', 'round', 'χρηματοδοτ', 'γυρ'],
  round: ['fundraising', 'round', 'γυρ'],
  cofounder: ['match', 'matches', 'co-founder', 'συνιδρυτ', 'αντιστοιχ'],
  'co-founder': ['match', 'matches', 'συνιδρυτ', 'αντιστοιχ'],
  match: ['match', 'matches', 'αντιστοιχ'],
  mentor: ['mentor', 'mentors', 'mentoring', 'μεντορ', 'καθοδηγ'],
  session: ['mentoring', 'session', 'calendar', 'συνεδρι', 'ημερολογ'],
  book: ['mentoring', 'calendar', 'book', 'κλεισ', 'κρατησ'],
  calendar: ['calendar', 'ημερολογ'],
  password: ['settings', 'security', 'password', 'κωδικ', 'ασφαλει'],
  email: ['settings', 'notifications', 'email', 'ειδοποι'],
  notification: ['notifications', 'ειδοποι'],
  notifications: ['notifications', 'ειδοποι'],
  language: ['settings', 'language', 'γλωσσ'],
  theme: ['settings', 'themes', 'appearance', 'εμφανισ', 'θεμα'],
  dark: ['themes', 'appearance', 'εμφανισ'],
  billing: ['billing', 'plan', 'pricing', 'χρεωσ', 'συνδρομ'],
  plan: ['billing', 'pricing', 'plan', 'συνδρομ'],
  pay: ['billing', 'pricing', 'χρεωσ'],
  invite: ['invite', 'referrals', 'προσκλησ'],
  refer: ['referrals', 'invite', 'προσκλησ', 'παραπομπ'],
  delete: ['settings', 'data-export', 'account', 'διαγραφ', 'λογαριασμ'],
  account: ['settings', 'account', 'λογαριασμ'],
  data: ['data-export', 'data room', 'δεδομεν'],
  privacy: ['settings', 'privacy', 'visibility', 'ιδιωτικ', 'ορατοτ'],
  visibility: ['settings', 'visibility', 'ορατοτ'],
  availability: ['open-to', 'availability', 'profile', 'διαθεσιμ'],
  canvas: ['research', 'canvas', 'board', 'καμβ', 'πινακ'],
  board: ['research', 'board', 'πινακ'],
  milestone: ['milestones', 'οροσημ'],
  milestones: ['milestones', 'οροσημ'],
  goal: ['milestones', 'στοχ'],
  readiness: ['readiness', 'ετοιμοτ'],
  score: ['readiness', 'analytics', 'βαθμολογ', 'σκορ'],
  analytics: ['analytics', 'αναλυτικ', 'στατιστ'],
  stats: ['analytics', 'στατιστ'],
  message: ['messages', 'μηνυμ'],
  messages: ['messages', 'μηνυμ'],
  chat: ['messages', 'μηνυμ', 'συνομιλ'],
  endorse: ['endorsements', 'συστασ'],
  endorsement: ['endorsements', 'συστασ'],
  program: ['programs', 'accelerator', 'προγραμ'],
  programs: ['programs', 'προγραμ'],
  accelerator: ['programs', 'επιταχυντ', 'προγραμ'],
  apply: ['programs', 'applications', 'αιτησ'],
  application: ['applications', 'programs', 'αιτησ'],
  event: ['events', 'εκδηλωσ'],
  events: ['events', 'εκδηλωσ'],
  community: ['groups', 'community', 'κοινοτ', 'ομαδ'],
  group: ['groups', 'ομαδ'],
  saved: ['shortlist', 'saved', 'αποθηκευμ'],
  shortlist: ['shortlist', 'λιστ'],
  help: ['help', 'βοηθει'],
  // Greek stems for the same destinations.
  εξαγωγη: ['export', 'download', 'εξαγωγ'],
  κατεβασω: ['export', 'download'],
  επενδυτες: ['investor', 'fundraising', 'επενδυτ'],
  επενδυτη: ['investor', 'fundraising', 'επενδυτ'],
  χρηματοδοτηση: ['fundraising', 'χρηματοδοτ'],
  μεντορα: ['mentor', 'mentoring', 'μεντορ'],
  συνεδρια: ['mentoring', 'calendar', 'συνεδρι'],
  κωδικο: ['settings', 'security', 'password', 'κωδικ'],
  γλωσσα: ['settings', 'language', 'γλωσσ'],
  θεμα: ['themes', 'appearance', 'θεμα'],
  συνδρομη: ['billing', 'pricing', 'συνδρομ'],
  προσκληση: ['invite', 'referrals', 'προσκλησ'],
  διαγραψω: ['settings', 'data-export', 'διαγραφ'],
  λογαριασμο: ['settings', 'account', 'λογαριασμ'],
  διαθεσιμοτητα: ['open-to', 'availability', 'διαθεσιμ'],
  οροσημα: ['milestones', 'οροσημ'],
  ετοιμοτητα: ['readiness', 'ετοιμοτ'],
  μηνυματα: ['messages', 'μηνυμ'],
  εκδηλωσεις: ['events', 'εκδηλωσ'],
  προγραμματα: ['programs', 'προγραμ'],
  αιτηση: ['programs', 'applications', 'αιτησ'],
  κοινοτητα: ['groups', 'κοινοτ'],
  ειδοποιησεις: ['notifications', 'ειδοποι'],
  προσφορες: ['perks', 'προσφορ'],
  θεση: ['jobs', 'θεσ'],
  αγγελια: ['jobs', 'αγγελι'],
};

const HIDDEN_SECTIONS = new Set(['Admin', 'Tenant', 'Super admin', 'Platform']);

/** Words worth looking up, after the question scaffolding is removed. */
export function whereIsTerms(query: string): string[] {
  return fold(query)
    .replace(/[?;\u037e!.,«»"“”']+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !FILLERS.has(w));
}

function expand(term: string): string[] {
  const syn = SYNONYMS[term] ?? SYNONYMS[term.replace(/s$/, '')] ?? [];
  return Array.from(new Set([term, ...syn]));
}

function stemHit(hay: string, needle: string): boolean {
  if (needle.length < 3) return hay.split(/\s+/).includes(needle);
  return hay.includes(needle);
}

export function rankPages(query: string, pathname?: string): WhereIsHit[] {
  const terms = whereIsTerms(query);
  if (!terms.length) return [];
  const wantsAdmin = terms.some((t) => /^(admin|διαχειρ|tenant|platform)/.test(t));
  const hits: WhereIsHit[] = [];
  for (const page of PAGE_REGISTRY) {
    if (!wantsAdmin && (HIDDEN_SECTIONS.has(page.section ?? '') || page.path.startsWith('/admin') || page.path.startsWith('/tenant'))) continue;
    if (page.status === 'scaffold') continue;
    const title = fold(`${page.title} ${page.titleEl ?? ''}`);
    const body = fold(`${page.description} ${page.descriptionEl ?? ''} ${page.helpTitle ?? ''} ${page.helpTitleEl ?? ''}`);
    const path = fold(page.path.replace(/\[[^\]]+\]/g, ' ').replace(/[/-]/g, ' '));
    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const forms = expand(term);
      let best = 0;
      for (const f of forms) {
        if (stemHit(title, f)) best = Math.max(best, 4);
        else if (stemHit(path, f)) best = Math.max(best, 3);
        else if (stemHit(body, f)) best = Math.max(best, 1.5);
      }
      if (best > 0) { score += best; matched.push(term); }
    }
    if (score === 0) continue;
    // Dynamic detail routes answer "where" worse than their list page.
    if (page.path.includes('[')) score -= 1;
    if (pathname && page.path === pathname) score += 0.5;
    hits.push({ page, score, matched });
  }
  const sorted = hits.sort((a, b) => b.score - a.score || a.page.path.length - b.page.path.length);
  // Two routes with one title (a list and its detail) read as one place.
  const seen = new Set<string>();
  return sorted.filter((h) => (seen.has(h.page.title) ? false : (seen.add(h.page.title), true))).slice(0, 3);
}

export function rankControls(query: string, controls: readonly PageControlSummary[]): WhereIsControlHit[] {
  const terms = whereIsTerms(query);
  if (!terms.length) return [];
  return controls
    .map((control) => {
      const hay = fold(`${control.labelEn} ${control.labelEl} ${control.id.replace(/_/g, ' ')}`);
      const score = terms.reduce((sum, term) => sum + (expand(term).some((f) => stemHit(hay, f)) ? 1 : 0), 0);
      return { control, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

/** Phrasing that asks where something lives or how to get to it. */
const WHERE_IS_PATTERNS: RegExp[] = [
  /\bwhere\s+(?:do|can|could|would|should|did|will)\s+i\b/,
  /\bwhere\s+(?:is|are|'s)\s+(?:the|my|our)\b/,
  /\bwhere\s+to\s+\w+/,
  /\b(?:which|what)\s+page\b/,
  /\bhow\s+(?:do|can|could|would|should)\s+i\s+(?:find|open|get\s+to|reach|change|edit|update|export|download|post|book|claim|invite|publish|share|see|view|set|turn|switch|delete|cancel|add|create|manage)\b/,
  /(?:^|\s)που\s+(?:κανω|βρισκω|βρω|βλεπω|αλλαζω|μπορω|ειναι|θα\s+βρω|ανοιγω|βαζω|ρυθμιζω|κλεινω|στελνω)(?:\s|$)/,
  /(?:^|\s)σε\s+ποια\s+σελιδα/,
  /(?:^|\s)πως\s+(?:κανω|αλλαζω|βρισκω|ανοιγω|στελνω|κλεινω|βαζω|ρυθμιζω|βλεπω|διαγραφω|ακυρωνω|προσθετω|δημιουργω|διαχειριζομαι|κατεβαζω|μοιραζομαι|δημοσιευω)(?:\s|$)/,
];

// Questions about the open page itself are answered by the engine's page explainer.
const NOT_WHERE_IS = /\bwhere\s+am\s+i\b|που\s+βρισκομαι|where\s+did\s+(?:we|i)\s+(?:talk|write|speak|chat)|που\s+(?:μιλησαμε|γραψαμε)/;

export function isWhereIsQuestion(rawMessage: string): boolean {
  const folded = fold(rawMessage.trim());
  if (NOT_WHERE_IS.test(folded)) return false;
  return WHERE_IS_PATTERNS.some((re) => re.test(folded));
}
