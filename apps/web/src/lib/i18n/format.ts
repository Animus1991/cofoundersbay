import type { BilingualPair } from './types';

/** Join EN + EL for aria-label / title attributes (screen readers get both). */
export function bilingualAria(en: string, el?: string | null): string {
  if (!el || el === en) return en;
  return `${en}. ${el}`;
}

/** Inline bilingual string — English first, Greek second. */
export function bilingualInline(en: string, el?: string | null): string {
  if (!el || el === en) return en;
  return `${en} · ${el}`;
}

export function fromPair(pair: BilingualPair): { en: string; el: string } {
  return { en: pair.en, el: pair.el };
}
