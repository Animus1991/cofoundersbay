/**
 * What is new since the reader was last here (docs §115): a reason to come back
 * that is true. Only what arrived, counted from the notifications themselves;
 * nothing arrives on a first visit, and a quiet day says nothing at all.
 */

const LAST_VISIT = 'cfb.home.lastVisit';
const THIS_SESSION = 'cfb.home.sinceVisit';

type Kind = 'messages' | 'people' | 'matches' | 'rest';

const KIND: Array<[RegExp, Kind]> = [
  [/message/, 'messages'],
  [/connection|intro|follow/, 'people'],
  [/match/, 'matches'],
];

const LABEL: Record<Kind, { en: string; el: string }> = {
  messages: { en: 'messages', el: 'μηνύματα' },
  people: { en: 'people', el: 'άτομα' },
  matches: { en: 'matches', el: 'αντιστοιχίσεις' },
  rest: { en: 'other', el: 'άλλα' },
};

const kindOf = (type: string): Kind => KIND.find(([pattern]) => pattern.test(type))?.[1] ?? 'rest';

export function sinceLastVisit(items: ReadonlyArray<{ type: string; createdAt: string }>, lastVisitMs: number | null): { en: string; el: string } | null {
  if (lastVisitMs === null) return null;
  const counts = new Map<Kind, number>();
  for (const item of items) {
    if (Date.parse(item.createdAt) <= lastVisitMs) continue;
    const kind = kindOf(item.type);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const order: Kind[] = ['messages', 'people', 'matches', 'rest'];
  const parts = order.filter((kind) => counts.has(kind)).map((kind) => ({ count: counts.get(kind) as number, label: LABEL[kind] }));
  return {
    en: `Since your last visit: ${parts.map((part) => `${part.label.en} ${part.count}`).join(' · ')}`,
    el: `Από την τελευταία φορά: ${parts.map((part) => `${part.label.el} ${part.count}`).join(' · ')}`,
  };
}

/**
 * When the reader was last on the home, before this visit. The mark moves on at
 * once, but a reload in the same session keeps the line it already showed.
 */
export function readLastVisit(now = Date.now()): number | null {
  try {
    const held = window.sessionStorage.getItem(THIS_SESSION);
    if (held !== null) return held === '' ? null : Number(held);
    const stored = window.localStorage.getItem(LAST_VISIT);
    window.sessionStorage.setItem(THIS_SESSION, stored ?? '');
    window.localStorage.setItem(LAST_VISIT, String(now));
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}
