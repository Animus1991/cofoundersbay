'use client';

import type { ReactNode } from 'react';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

/**
 * A member's own words, in the quotation marks of the reader's language:
 * «…» in Greek, “…” in English. The notes on requests and saved profiles
 * were printed in English marks around Greek text (§162).
 */
export function Quoted({ children }: { children: ReactNode }) {
  const { primary } = useLanguagePreference();
  return primary === 'el' ? <>«{children}»</> : <>&ldquo;{children}&rdquo;</>;
}
