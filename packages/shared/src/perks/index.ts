/**
 * Perks: offers from partner companies that a member claims once - credits,
 * discounts, free months - the "partner discounts" other founder networks
 * keep behind a paid plan. One rule for the API and the demo world.
 *
 * What a member gives up by claiming is nothing: the claim is a row between
 * the member and the platform, the partner gets no list, and the code is
 * revealed to the member alone. Partners learn who someone is only when that
 * person redeems on the partner's own site. A perk's value is the partner's
 * offer as written, never a promise the platform makes about it.
 */

import { CARD_STAGES, isCardStage, type CardStage } from '../commitments/model';

export const PERK_CATEGORIES = ['cloud', 'ai', 'software', 'finance', 'legal', 'marketing', 'design', 'hiring'] as const;
export type PerkCategory = (typeof PERK_CATEGORIES)[number];

export const PERK_CATEGORY_COPY: Record<PerkCategory, { en: string; el: string }> = {
  cloud: { en: 'Cloud and hosting', el: 'Cloud και φιλοξενία' },
  ai: { en: 'AI tools', el: 'Εργαλεία AI' },
  software: { en: 'Software', el: 'Λογισμικό' },
  finance: { en: 'Banking and finance', el: 'Τραπεζικά και οικονομικά' },
  legal: { en: 'Legal and incorporation', el: 'Νομικά και σύσταση εταιρείας' },
  marketing: { en: 'Marketing and sales', el: 'Μάρκετινγκ και πωλήσεις' },
  design: { en: 'Design', el: 'Σχεδιασμός' },
  hiring: { en: 'Hiring and HR', el: 'Προσλήψεις και HR' },
};

/** A perk names the startup stages it suits; none means every stage. */
export const PERK_STAGES = CARD_STAGES;
export type PerkStage = CardStage;

export const PERK_LIMITS = {
  partner: 80,
  title: 120,
  summary: 400,
  value: 80,
  howToRedeem: 600,
  terms: 600,
  code: 64,
  url: 500,
} as const;

/** What a reader sees beside every offer. */
export const PERK_COPY = {
  disclosure: {
    en: 'Offers are set by each partner and can change. Claiming shows the code to you only; we never send your details to a partner - they learn who you are only if you redeem on their site.',
    el: 'Οι προσφορές ορίζονται από κάθε συνεργάτη και μπορεί να αλλάξουν. Η διεκδίκηση δείχνει τον κωδικό μόνο σε εσάς· δεν στέλνουμε ποτέ τα στοιχεία σας σε συνεργάτη - σας γνωρίζει μόνο αν εξαργυρώσετε στον δικό του ιστότοπο.',
  },
} as const;

export interface PerkView {
  id: string;
  partner: string;
  title: string;
  titleEl: string | null;
  summary: string;
  summaryEl: string | null;
  /** The partner's offer in their own words: "$5,000 in credits for a year". */
  value: string;
  valueEl: string | null;
  category: PerkCategory;
  /** The stages it suits; empty for every stage. */
  stages: PerkStage[];
  howToRedeem: string;
  howToRedeemEl: string | null;
  terms: string | null;
  termsEl: string | null;
  expiresAt: string | null;
  active: boolean;
  /** How many members have claimed it: a count, never who. */
  claimCount: number;
  claimed: boolean;
  claimedAt: string | null;
  /** Shown only to a member who has claimed it (and to platform admins). */
  code: string | null;
  redeemUrl: string | null;
}

export interface PerkInput {
  partner: string;
  title: string;
  titleEl: string | null;
  summary: string;
  summaryEl: string | null;
  value: string;
  valueEl: string | null;
  category: PerkCategory;
  stages: PerkStage[];
  howToRedeem: string;
  howToRedeemEl: string | null;
  terms: string | null;
  termsEl: string | null;
  code: string | null;
  redeemUrl: string | null;
  expiresAt: string | null;
  active: boolean;
}

export function isPerkCategory(value: unknown): value is PerkCategory {
  return typeof value === 'string' && (PERK_CATEGORIES as readonly string[]).includes(value);
}

/** Open to claim: switched on and not past its end. */
export function perkIsOpen(perk: { active: boolean; expiresAt: string | Date | null }, now: number): boolean {
  if (!perk.active) return false;
  if (!perk.expiresAt) return true;
  const end = new Date(perk.expiresAt).getTime();
  return Number.isFinite(end) && end > now;
}

/**
 * How a perk suits a startup at `stage`: named for that stage, offered to
 * every stage, or named for other stages only. Without a stage every perk
 * reads as `any`, so nothing is hidden for a member who has not said.
 */
export function perkFit(perk: { stages: readonly string[] }, stage: string | null | undefined): 'match' | 'any' | 'other' {
  if (!perk.stages.length) return 'any';
  if (!stage) return 'any';
  return perk.stages.includes(stage) ? 'match' : 'other';
}

const FIT_ORDER = { match: 0, any: 1, other: 2 } as const;

/**
 * Perks for a reader at `stage`: those named for the stage first, then the
 * ones for every stage, then the rest - each group in the order given (the
 * API gives newest first). Nothing is dropped: a later-stage offer is still
 * an offer, it only sits lower.
 */
export function rankPerksForStage<T extends { stages: readonly string[] }>(perks: readonly T[], stage: string | null | undefined): T[] {
  return perks
    .map((perk, i) => ({ perk, i, fit: FIT_ORDER[perkFit(perk, stage)] }))
    .sort((a, b) => a.fit - b.fit || a.i - b.i)
    .map((x) => x.perk);
}

function text(b: Record<string, unknown>, key: string, max: number, required: boolean): string | null | { error: string } {
  const raw = b[key];
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return required ? { error: `${key} is required` } : null;
  }
  if (typeof raw !== 'string') return { error: `${key} must be text` };
  const value = raw.trim();
  if (value.length > max) return { error: `${key} is longer than ${max} characters` };
  return value;
}

/**
 * Reads a perk an admin creates or edits. A redeem link must be https, and an
 * end date must be a real date; the stages are kept only when known.
 */
export function readPerkInput(body: unknown): { ok: true; value: PerkInput } | { ok: false; error: string } {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const fields = {
    partner: text(b, 'partner', PERK_LIMITS.partner, true),
    title: text(b, 'title', PERK_LIMITS.title, true),
    titleEl: text(b, 'titleEl', PERK_LIMITS.title, false),
    summary: text(b, 'summary', PERK_LIMITS.summary, true),
    summaryEl: text(b, 'summaryEl', PERK_LIMITS.summary, false),
    value: text(b, 'value', PERK_LIMITS.value, true),
    valueEl: text(b, 'valueEl', PERK_LIMITS.value, false),
    howToRedeem: text(b, 'howToRedeem', PERK_LIMITS.howToRedeem, true),
    howToRedeemEl: text(b, 'howToRedeemEl', PERK_LIMITS.howToRedeem, false),
    terms: text(b, 'terms', PERK_LIMITS.terms, false),
    termsEl: text(b, 'termsEl', PERK_LIMITS.terms, false),
    code: text(b, 'code', PERK_LIMITS.code, false),
    redeemUrl: text(b, 'redeemUrl', PERK_LIMITS.url, false),
  };
  for (const v of Object.values(fields)) {
    if (v && typeof v === 'object') return { ok: false, error: v.error };
  }
  if (!isPerkCategory(b.category)) return { ok: false, error: 'category is not one of the perk categories' };
  const redeemUrl = fields.redeemUrl as string | null;
  if (redeemUrl) {
    let url: URL;
    try {
      url = new URL(redeemUrl);
    } catch {
      return { ok: false, error: 'redeemUrl is not a link' };
    }
    if (url.protocol !== 'https:') return { ok: false, error: 'redeemUrl must start with https://' };
  }
  if (!fields.code && !redeemUrl) return { ok: false, error: 'A perk needs a code or a redeem link' };
  let expiresAt: string | null = null;
  if (b.expiresAt !== undefined && b.expiresAt !== null && b.expiresAt !== '') {
    const t = typeof b.expiresAt === 'string' ? Date.parse(b.expiresAt) : NaN;
    if (!Number.isFinite(t)) return { ok: false, error: 'expiresAt is not a date' };
    expiresAt = new Date(t).toISOString();
  }
  const stages = Array.isArray(b.stages) ? [...new Set(b.stages.filter(isCardStage))] : [];
  return {
    ok: true,
    value: {
      partner: fields.partner as string,
      title: fields.title as string,
      titleEl: fields.titleEl as string | null,
      summary: fields.summary as string,
      summaryEl: fields.summaryEl as string | null,
      value: fields.value as string,
      valueEl: fields.valueEl as string | null,
      category: b.category,
      stages,
      howToRedeem: fields.howToRedeem as string,
      howToRedeemEl: fields.howToRedeemEl as string | null,
      terms: fields.terms as string | null,
      termsEl: fields.termsEl as string | null,
      code: fields.code as string | null,
      redeemUrl,
      expiresAt,
      active: b.active === undefined ? true : b.active === true,
    },
  };
}

/**
 * What a member may see of a perk: the code and the redeem link only once
 * they have claimed it (an admin sees both). `claimCount` is a number.
 */
export function perkForReader<T extends PerkView>(perk: T, opts: { claimed: boolean; admin?: boolean }): PerkView {
  const reveal = opts.claimed || opts.admin === true;
  return {
    ...perk,
    claimed: opts.claimed,
    claimedAt: opts.claimed ? perk.claimedAt : null,
    code: reveal ? perk.code : null,
    redeemUrl: reveal ? perk.redeemUrl : null,
  };
}
