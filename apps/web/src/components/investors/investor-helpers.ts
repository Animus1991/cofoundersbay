/**
 * The investor directory's shared wording: the option sets the page's
 * filters show, the labels and the cheque formatting its card and its
 * row text share (docs §125).
 */
export type InvestorType = 'angel_investor' | 'vc' | 'vc_scout' | 'syndicate' | 'cvc' | 'family_office';

export function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
export function formatCheckSize(min?: number, max?: number) {
  if (!min && !max) return null;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `≤ ${fmt(max!)}`;
}

export const TYPE_OPTIONS = [
  { value: 'all', en: 'All types', el: 'Όλοι οι τύποι' },
  { value: 'angel_investor', en: 'Angel', el: 'Angel' },
  { value: 'vc', en: 'VC fund', el: 'Ταμείο VC' },
  { value: 'vc_scout', en: 'VC scout', el: 'Scout VC' },
  { value: 'syndicate', en: 'Syndicate', el: 'Syndicate' },
  { value: 'family_office', en: 'Family office', el: 'Family office' },
  { value: 'cvc', en: 'Corporate VC', el: 'Εταιρικό VC' },
] as const satisfies ReadonlyArray<{ value: InvestorType | 'all'; en: string; el: string }>;

export const STAGE_OPTIONS = [
  { value: 'all', en: 'All stages', el: 'Όλα τα στάδια' },
  { value: 'pre-seed', en: 'Pre-seed', el: 'Pre-seed' },
  { value: 'seed', en: 'Seed', el: 'Seed' },
  { value: 'series-a', en: 'Series A', el: 'Series A' },
  { value: 'series-b', en: 'Series B', el: 'Series B' },
  { value: 'growth', en: 'Growth', el: 'Ανάπτυξη' },
] as const satisfies ReadonlyArray<{ value: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth' | 'all'; en: string; el: string }>;

export const TYPE_LABEL: Record<InvestorType, { en: string; el: string }> = Object.fromEntries(
  TYPE_OPTIONS.filter((o) => o.value !== 'all').map((o) => [o.value, { en: o.en, el: o.el }]),
) as Record<InvestorType, { en: string; el: string }>;

export const STAGE_COPY: Record<string, { en: string; el: string }> = Object.fromEntries(
  STAGE_OPTIONS.filter((o) => o.value !== 'all').map((o) => [o.value, { en: o.en, el: o.el }]),
);

