import type { BilingualPair } from './types';

/**
 * Join EN + EL for `aria-label` / `title` / `alt` ONLY — the full stop makes a
 * screen reader pause between the two languages.
 *
 * Do NOT use for visible text: the result renders as an unstyled "English. Ελληνικά"
 * run-on with no typographic hierarchy. For visible text use `<BilingualText>`
 * (styled, `lang`-tagged, honours the user's display preference), or
 * `bilingualInline` when the slot only accepts a string (placeholder, toast).
 */
export function bilingualAria(en: string, el?: string | null): string {
  if (!el || el === en) return en;
  return `${en}. ${el}`;
}

/**
 * Inline bilingual string for visible slots that only accept a `string`
 * (e.g. `placeholder`, toast bodies). Prefer `<BilingualText>` wherever a
 * ReactNode is allowed.
 */
export function bilingualInline(en: string, el?: string | null): string {
  if (!el || el === en) return en;
  return `${en} · ${el}`;
}

export function fromPair(pair: BilingualPair): { en: string; el: string } {
  return { en: pair.en, el: pair.el };
}
