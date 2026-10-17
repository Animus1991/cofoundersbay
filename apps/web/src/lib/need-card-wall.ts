import {
  applyFacetChips,
  facetBoard,
  facetChipCounts,
  CARD_COMMITMENTS,
  CARD_STAGES,
  CHIP_KEYS,
  cityOf,
  NO_CHIPS,
  type CardChips,
  type ChipKey,
  type CommitmentKind,
  type FacetCard,
  type FacetCount,
} from '@cofounderbay/shared';
import type { CommitmentCard } from '@/lib/commitments-api';
import { statusEl } from '@/components/common/StatusText';

export { CHIP_KEYS, NO_CHIPS, cityOf };
export type { CardChips, ChipKey, FacetCount };

/**
 * The need-card wall on /opportunities: which cards the board shows, the four
 * chips that narrow it (category, place, stage, commitment) and the counts
 * each chip offers. One module for the section, the page's assistant
 * controls and the saved-search alert, so the three cannot disagree.
 */

/** The newest cards the board reads at once (the API's own cap per request). */
export const BOARD_LIMIT = 100;

export const CHIP_LABEL: Record<ChipKey, { en: string; el: string }> = {
  category: { en: 'Category', el: 'Κατηγορία' },
  place: { en: 'Place', el: 'Τόπος' },
  stage: { en: 'Stage', el: 'Στάδιο' },
  commitment: { en: 'Commitment', el: 'Δέσμευση' },
};

/** The shared facet row for one card, so the page and the counts endpoint share one filter. */
export function toFacetCard(card: CommitmentCard): FacetCard {
  return {
    isMine: Boolean(card.isMine),
    kind: card.kind,
    outcome: card.outcome,
    settledAt: card.settledAt ?? null,
    isRemote: Boolean(card.isRemote),
    title: card.title ?? '',
    exists: card.exists ?? '',
    goal: card.goal ?? '',
    missing: card.missing ?? '',
    offerRole: card.offer?.role ?? null,
    category: card.category ?? null,
    place: card.place ?? null,
    stage: card.stage ?? '',
    commitment: card.commitment ?? '',
  };
}

/**
 * What the board shows any member: other people's cards that still take
 * interest, plus agreed ones for thirty days, inside the page's type,
 * remote and word filters. The rules live in `@cofounderbay/shared`.
 */
export function boardCards(
  cards: readonly CommitmentCard[],
  opts: { kinds: readonly CommitmentKind[]; remoteOnly: boolean; search: string; now: number },
): CommitmentCard[] {
  const facets = cards.map(toFacetCard);
  const shown = new Set(facetBoard(facets, opts));
  return cards.filter((_, i) => shown.has(facets[i]!));
}

/** The cards every set chip allows; `except` leaves one chip out (for that chip's own counts). */
export function applyChips(cards: readonly CommitmentCard[], chips: CardChips, except?: ChipKey): CommitmentCard[] {
  const facets = cards.map(toFacetCard);
  const shown = new Set(applyFacetChips(facets, chips, except));
  return cards.filter((_, i) => shown.has(facets[i]!));
}

export type ChipOption = { value: string; en: string; el: string; count: number };

function humanize(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function enumLabel(value: string): { en: string; el: string } {
  const el = statusEl(value);
  return { en: humanize(value), el: el ? el.charAt(0).toUpperCase() + el.slice(1) : humanize(value) };
}

/**
 * Each chip's choices with how many cards each would show, counted with the
 * other chips applied (faceted), so a choice never promises cards it would
 * not show. A chosen value stays listed even at zero, so it can be seen and
 * changed; stages and commitments keep their product order.
 */
function labelFor(key: ChipKey, value: string): { en: string; el: string } {
  return key === 'stage' || key === 'commitment' ? enumLabel(value) : { en: value, el: value };
}

export function chipOptions(cards: readonly CommitmentCard[], chips: CardChips): Record<ChipKey, ChipOption[]> {
  const counts = facetChipCounts(cards.map(toFacetCard), chips);
  return overlayChipCounts(emptyOptions(), counts);
}

/** Labels with no counts, so a server payload can fill them in. */
function emptyOptions(): Record<ChipKey, ChipOption[]> {
  return { category: [], place: [], stage: [], commitment: [] };
}

/**
 * The counts endpoint's numbers, with this page's Greek labels.
 * A value the loaded board has never seen (a card past the newest 100)
 * still gets a label.
 */
export function overlayChipCounts(
  local: Record<ChipKey, ChipOption[]>,
  remote: Record<ChipKey, FacetCount[]>,
): Record<ChipKey, ChipOption[]> {
  const out = {} as Record<ChipKey, ChipOption[]>;
  for (const key of CHIP_KEYS) {
    const known = new Map(local[key].map((o) => [o.value, o]));
    out[key] = (remote[key] ?? []).map((row) => {
      const prev = known.get(row.value);
      const label = prev ? { en: prev.en, el: prev.el } : labelFor(key, row.value);
      return { value: row.value, ...label, count: row.count };
    });
  }
  return out;
}

/** The chosen chips in reading order, for the empty state and the alert's name. */
export function chipSummary(chips: CardChips): { en: string; el: string } | null {
  const set = CHIP_KEYS.filter((k) => chips[k]);
  if (!set.length) return null;
  const valueOf = (k: ChipKey, lang: 'en' | 'el') =>
    k === 'stage' || k === 'commitment' ? enumLabel(chips[k])[lang] : chips[k];
  return {
    en: set.map((k) => `${CHIP_LABEL[k].en}: ${valueOf(k, 'en')}`).join(' · '),
    el: set.map((k) => `${CHIP_LABEL[k].el}: ${valueOf(k, 'el')}`).join(' · '),
  };
}

export function activeChipCount(chips: CardChips): number {
  return CHIP_KEYS.filter((k) => chips[k]).length;
}

/** Chips from a link (`?category=&place=&stage=&commitment=`), keeping only valid stage and commitment values. */
export function chipsFromParams(params: URLSearchParams): CardChips {
  const stage = params.get('stage') ?? '';
  const commitment = params.get('commitment') ?? '';
  return {
    category: (params.get('category') ?? '').slice(0, 60),
    place: (params.get('place') ?? '').slice(0, 60),
    stage: (CARD_STAGES as readonly string[]).includes(stage) ? stage : '',
    commitment: (CARD_COMMITMENTS as readonly string[]).includes(commitment) ? commitment : '',
  };
}

/** The saved-search filters the API's need-card alert reads (`categories`, `places`, `stage`, `commitments`). */
export function chipsToSavedFilters(chips: CardChips): Record<string, string[]> {
  return {
    ...(chips.category ? { categories: [chips.category] } : {}),
    ...(chips.place ? { places: [chips.place] } : {}),
    ...(chips.stage ? { stage: [chips.stage] } : {}),
    ...(chips.commitment ? { commitments: [chips.commitment] } : {}),
  };
}

/** The other way, for opening a saved need-card search in /opportunities. */
export function savedFiltersToParams(filters: Partial<Record<string, string[]>> | undefined, params: URLSearchParams): void {
  const first = (key: string) => filters?.[key]?.[0];
  const pairs: [ChipKey, string | undefined][] = [
    ['category', first('categories')],
    ['place', first('places')],
    ['stage', first('stage')],
    ['commitment', first('commitments')],
  ];
  for (const [key, value] of pairs) if (value) params.set(key, value);
}

/** The chips as `listCommitmentCards` filters, for the server once the board is full. */
export function chipsToCardFilters(chips: CardChips): Partial<Record<ChipKey, string>> {
  const out: Partial<Record<ChipKey, string>> = {};
  for (const key of CHIP_KEYS) if (chips[key]) out[key] = chips[key];
  return out;
}
