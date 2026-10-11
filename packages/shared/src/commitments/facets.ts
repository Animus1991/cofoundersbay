import { CARD_COMMITMENTS, CARD_STAGES, isInHistory } from './model';
import { foldSearchText, placeVariants } from '../search';

/**
 * Facet counts for the need-card wall.
 *
 * The board the page draws is capped (the newest 100). These counts are the
 * same rules applied to every card, so a chip can name a card the page has
 * not loaded yet. The web wall and `GET /commitments/cards/counts` both call
 * this, and a board of 100 produces the same numbers either way.
 */

export const CHIP_KEYS = ['category', 'place', 'stage', 'commitment'] as const;
export type ChipKey = (typeof CHIP_KEYS)[number];
/** '' is "any". */
export type CardChips = Record<ChipKey, string>;
export const NO_CHIPS: CardChips = { category: '', place: '', stage: '', commitment: '' };

/** The fields the wall filters on. `outcome` is the card's status. */
export type FacetCard = {
  isMine: boolean;
  kind: string;
  outcome: string;
  settledAt: string | null;
  isRemote: boolean;
  title: string;
  exists: string;
  goal: string;
  missing: string;
  offerRole: string | null;
  category: string | null;
  place: string | null;
  stage: string;
  commitment: string;
};

export type FacetCount = { value: string; count: number };

/** The city part of a place ("Athens, Greece" → "Athens"), which is what people choose between. */
export function cityOf(place: string | null | undefined): string {
  return (place ?? '').split(',')[0]?.trim() ?? '';
}

function fits(card: FacetCard, key: ChipKey, value: string): boolean {
  if (!value) return true;
  if (key === 'category') return foldSearchText(card.category ?? '') === foldSearchText(value);
  if (key === 'place') {
    const place = foldSearchText(card.place ?? '');
    return placeVariants(value).some((v) => place.includes(foldSearchText(v)));
  }
  if (key === 'stage') return card.stage === value;
  return card.commitment === value;
}

/**
 * What the board shows any member: other people's cards that still take
 * interest, plus agreed ones for thirty days, inside the page's type,
 * remote and word filters.
 */
export function facetBoard(
  cards: readonly FacetCard[],
  { kinds, remoteOnly, search, now }: { kinds: readonly string[]; remoteOnly: boolean; search: string; now: number },
): FacetCard[] {
  const words = search.trim().toLowerCase();
  return cards
    .filter((c) => !c.isMine && kinds.includes(c.kind))
    .filter((c) => c.outcome === 'open' || c.outcome === 'in_discussion' || (c.outcome === 'agreed' && !isInHistory(c.settledAt, now)))
    .filter((c) => !remoteOnly || c.isRemote)
    .filter((c) => !words || `${c.title} ${c.exists} ${c.goal} ${c.missing} ${c.offerRole ?? ''} ${c.category ?? ''} ${c.place ?? ''}`.toLowerCase().includes(words));
}

/** The cards every set chip allows; `except` leaves one chip out (for that chip's own counts). */
export function applyFacetChips(cards: readonly FacetCard[], chips: CardChips, except?: ChipKey): FacetCard[] {
  return cards.filter((c) => CHIP_KEYS.every((k) => k === except || fits(c, k, chips[k])));
}

/**
 * Each chip's choices with how many cards each would show, counted with the
 * other chips applied. A chosen value stays listed even at zero. Stages and
 * commitments keep their product order; category and place sort by count.
 */
export function facetChipCounts(cards: readonly FacetCard[], chips: CardChips): Record<ChipKey, FacetCount[]> {
  const out = {} as Record<ChipKey, FacetCount[]>;
  for (const key of CHIP_KEYS) {
    const pool = applyFacetChips(cards, chips, key);
    let values: string[];
    if (key === 'stage') values = [...CARD_STAGES];
    else if (key === 'commitment') values = [...CARD_COMMITMENTS];
    else {
      const valueOf = (c: FacetCard) => (key === 'category' ? (c.category ?? '').trim() : cityOf(c.place));
      const spellings = new Map<string, Map<string, number>>();
      for (const c of cards) {
        const v = valueOf(c);
        if (!v) continue;
        const forms = spellings.get(foldSearchText(v)) ?? new Map<string, number>();
        forms.set(v, (forms.get(v) ?? 0) + 1);
        spellings.set(foldSearchText(v), forms);
      }
      const named = (folded: string, fallback: string) =>
        [...(spellings.get(folded)?.entries() ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
      const seen = new Map<string, string>();
      for (const c of pool) {
        const v = valueOf(c);
        if (v && !seen.has(foldSearchText(v))) seen.set(foldSearchText(v), named(foldSearchText(v), v));
      }
      if (chips[key] && !seen.has(foldSearchText(chips[key]))) seen.set(foldSearchText(chips[key]), chips[key]);
      values = [...seen.values()];
    }
    const counted = values
      .map((value) => ({ value, count: pool.filter((c) => fits(c, key, value)).length }))
      .filter((o) => o.count > 0 || o.value === chips[key]);
    out[key] = key === 'category' || key === 'place'
      ? counted.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      : counted;
  }
  return out;
}
