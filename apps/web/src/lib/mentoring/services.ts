import type { ExpertReviewType } from '@/lib/api';

/**
 * One mentor directory, three kinds of help (owner, 2026-10-28; docs §90.5,
 * §111).
 *
 * Coaching, Expert reviews and Mentors each listed the same people, and the
 * first two sent "Book" and "Request a review" to Mentors without the person
 * clicked. The directory is /mentoring now. What the reader needs picks the
 * area chips, what each card stresses and its main action: a session for a
 * mentor or a coach, a review request for an expert. Coaching and Expert
 * reviews keep what is theirs (sessions, action items, requests, insights)
 * and link here with the service and the area set.
 */
export type MentorService = 'mentoring' | 'coaching' | 'review';

export const MENTOR_SERVICES: ReadonlyArray<{ value: MentorService; en: string; el: string }> = [
  { value: 'mentoring', en: 'A mentor', el: 'Μέντορα' },
  { value: 'coaching', en: 'Coaching', el: 'Καθοδήγηση' },
  { value: 'review', en: 'An expert review', el: 'Αξιολόγηση ειδικού' },
];

export function isMentorService(value: unknown): value is MentorService {
  return value === 'mentoring' || value === 'coaching' || value === 'review';
}

// ── Coaching areas ───────────────────────────────────────────────────────────

export type CoachingArea = 'accountability' | 'clarity' | 'team_dynamics' | 'execution' | 'strategy' | 'wellbeing';

export const COACHING_AREAS: Record<CoachingArea, { en: string; el: string }> = {
  accountability: { en: 'Accountability', el: 'Λογοδοσία' },
  clarity: { en: 'Clarity', el: 'Διαύγεια' },
  team_dynamics: { en: 'Team Dynamics', el: 'Δυναμική ομάδας' },
  execution: { en: 'Execution', el: 'Εκτέλεση' },
  strategy: { en: 'Strategy', el: 'Στρατηγική' },
  wellbeing: { en: 'Wellbeing', el: 'Ευεξία' },
};

/**
 * The words that file a person under a coaching area.
 *
 * The backend stores focus areas and skills as the words people typed; the
 * pages speak in six fixed areas. Matching is the honest join between them,
 * and no match means no area rather than a default that would put everyone
 * under the same heading.
 */
const COACHING_KEYWORDS: Record<CoachingArea, string[]> = {
  accountability: ['accountability', 'habit', 'okr', 'goal'],
  clarity: ['clarity', 'vision', 'positioning', 'focus', 'narrative'],
  team_dynamics: ['team', 'hiring', 'people', 'culture', 'leadership', 'coaching'],
  execution: ['execution', 'delivery', 'product', 'operations', 'ops', 'roadmap'],
  strategy: ['strategy', 'go-to-market', 'gtm', 'fundraising', 'growth', 'market'],
  wellbeing: ['wellbeing', 'well-being', 'burnout', 'wellness', 'mental', 'resilience'],
};

// ── Review areas ─────────────────────────────────────────────────────────────

export type ReviewArea = ExpertReviewType;

export const REVIEW_AREAS: Record<ReviewArea, { en: string; el: string }> = {
  pitch_deck: { en: 'Pitch Deck', el: 'Pitch deck' },
  business_model: { en: 'Business Model', el: 'Επιχειρηματικό μοντέλο' },
  financial_model: { en: 'Financial Model', el: 'Οικονομικό μοντέλο' },
  legal_structure: { en: 'Legal Structure', el: 'Νομική δομή' },
  market_analysis: { en: 'Market Analysis', el: 'Ανάλυση αγοράς' },
  go_to_market: { en: 'Go-to-Market', el: 'Είσοδος στην αγορά' },
  technical_architecture: { en: 'Tech Architecture', el: 'Τεχνική αρχιτεκτονική' },
  product_strategy: { en: 'Product Strategy', el: 'Στρατηγική προϊόντος' },
  general: { en: 'General Review', el: 'Γενική αξιολόγηση' },
};

/**
 * The words that file an expert under a review area. "General" has none: it
 * is a request anyone can take, not an area a person names.
 */
const REVIEW_KEYWORDS: Record<ReviewArea, string[]> = {
  pitch_deck: ['pitch', 'deck', 'storytelling', 'narrative'],
  business_model: ['business model', 'bmc', 'monetisation', 'monetization', 'pricing'],
  financial_model: ['financial', 'finance', 'unit economics', 'cfo', 'accounting'],
  legal_structure: ['legal', 'counsel', 'incorporation', 'contract', 'compliance'],
  market_analysis: ['market', 'research', 'tam', 'competitive', 'analysis'],
  go_to_market: ['go-to-market', 'gtm', 'growth', 'sales', 'marketing', 'demand'],
  technical_architecture: ['architecture', 'engineering', 'infrastructure', 'cto', 'platform'],
  product_strategy: ['product', 'roadmap', 'discovery', 'ux', 'design'],
  general: [],
};

/*
 * Whole words, not substrings: "ops" sits inside "develops" and "ip" inside
 * "leadership". Every non-letter becomes a space and both sides are padded,
 * so a keyword matches only where a word starts and ends, and a hyphenated
 * keyword still matches because it is normalised the same way.
 */
const normalise = (text: string) => ` ${text.toLowerCase().replace(/[^a-z]+/g, ' ').trim()} `;

function areasFrom<K extends string>(keywords: Record<K, string[]>, words: readonly string[]): K[] {
  const haystack = normalise(words.join(' '));
  return (Object.keys(keywords) as K[]).filter(
    (key) => keywords[key].length > 0 && keywords[key].some((keyword) => haystack.includes(normalise(keyword))),
  );
}

/** Which of the six coaching areas a free-text list of skills names. */
export function coachingAreasFrom(words: readonly string[]): CoachingArea[] {
  return areasFrom(COACHING_KEYWORDS, words);
}

/** Which review areas a free-text list of skills names ("general" never). */
export function reviewAreasFrom(words: readonly string[]): ReviewArea[] {
  return areasFrom(REVIEW_KEYWORDS, words);
}

/** The area names a service filters by, in their fixed order. */
export function areaKeys(service: MentorService): string[] {
  if (service === 'coaching') return Object.keys(COACHING_AREAS);
  if (service === 'review') return Object.keys(REVIEW_AREAS).filter((key) => key !== 'general');
  return [];
}

/** An area's two names, or null when the key is not one of the service's. */
export function areaLabel(service: MentorService, key: string): { en: string; el: string } | null {
  if (service === 'coaching') return (COACHING_AREAS as Record<string, { en: string; el: string }>)[key] ?? null;
  if (service === 'review') return (REVIEW_AREAS as Record<string, { en: string; el: string }>)[key] ?? null;
  return null;
}

// ── Links into the directory ─────────────────────────────────────────────────

/** `/mentoring`, with the service and the area when they are not the default. */
export function directoryHref(service: MentorService, area?: string | null): string {
  const params = new URLSearchParams();
  if (service !== 'mentoring') params.set('service', service);
  if (area && service !== 'mentoring' && areaKeys(service).includes(area)) params.set('area', area);
  const query = params.toString();
  return `/mentoring${query ? `?${query}` : ''}`;
}

/** The service and area a link into the directory carries; anything else is dropped. */
export function directoryFromParams(params: URLSearchParams): { service: MentorService; area: string | null } {
  const raw = params.get('service');
  const service: MentorService = isMentorService(raw) ? raw : 'mentoring';
  const area = params.get('area');
  return { service, area: area && areaKeys(service).includes(area) ? area : null };
}
