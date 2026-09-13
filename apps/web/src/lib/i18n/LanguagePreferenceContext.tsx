'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/** Which language appears first (larger); the other is secondary (smaller). */
export type PrimaryLanguage = 'en' | 'el';

/** Whether secondary language is shown alongside primary. */
export type LanguageDisplayMode = 'bilingual' | 'primary-only';

const PRIMARY_STORAGE_KEY = 'cfb:primary-language';
const DISPLAY_STORAGE_KEY = 'cfb:language-display';

type LanguagePreferenceContextValue = {
  primary: PrimaryLanguage;
  setPrimary: (lang: PrimaryLanguage) => void;
  togglePrimary: () => void;
  displayMode: LanguageDisplayMode;
  setDisplayMode: (mode: LanguageDisplayMode) => void;
  /** True when secondary line should render in UI. */
  showSecondary: boolean;
  mounted: boolean;
};

const LanguagePreferenceContext = createContext<LanguagePreferenceContextValue>({
  primary: 'en',
  setPrimary: () => {},
  togglePrimary: () => {},
  displayMode: 'bilingual',
  setDisplayMode: () => {},
  showSecondary: true,
  mounted: false,
});

export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {
  const [primary, setPrimaryState] = useState<PrimaryLanguage>('en');
  const [displayMode, setDisplayModeState] = useState<LanguageDisplayMode>('bilingual');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedPrimary = localStorage.getItem(PRIMARY_STORAGE_KEY);
      if (storedPrimary === 'en' || storedPrimary === 'el') setPrimaryState(storedPrimary);

      const storedDisplay = localStorage.getItem(DISPLAY_STORAGE_KEY);
      if (storedDisplay === 'bilingual' || storedDisplay === 'primary-only') {
        setDisplayModeState(storedDisplay);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = primary;
    document.documentElement.dataset.primaryLang = primary;
    document.documentElement.dataset.languageDisplay = displayMode;
  }, [primary, displayMode, mounted]);

  const setPrimary = useCallback((lang: PrimaryLanguage) => {
    setPrimaryState(lang);
    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, []);

  const setDisplayMode = useCallback((mode: LanguageDisplayMode) => {
    setDisplayModeState(mode);
    try {
      localStorage.setItem(DISPLAY_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePrimary = useCallback(() => {
    setPrimary(primary === 'en' ? 'el' : 'en');
  }, [primary, setPrimary]);

  const showSecondary = displayMode === 'bilingual';

  return (
    <LanguagePreferenceContext.Provider
      value={{
        primary,
        setPrimary,
        togglePrimary,
        displayMode,
        setDisplayMode,
        showSecondary,
        mounted,
      }}
    >
      {children}
    </LanguagePreferenceContext.Provider>
  );
}

export function useLanguagePreference() {
  return useContext(LanguagePreferenceContext);
}

/** Resolve primary/secondary text + lang codes for BilingualText. */
/**
 * One string, in the reader's language, for a slot that cannot take a node.
 *
 * `bilingualInline` joins both languages unconditionally, which is right for an
 * `aria-label` — a screen reader benefits from hearing both — and wrong for a
 * visible `placeholder`, where it doubles the text and truncates: the
 * endorsement dialog's skill field read "A skill, e.g. Fundraising · Μια
 * δεξιότητα, π.χ. Χρηματοδοτ…" for a reader who had chosen one language.
 *
 * This resolves to the primary alone, honouring the same preference
 * `BilingualText` reads. Use it for placeholders and any other visible
 * string-only slot; keep `bilingualInline` for aria and for toast bodies,
 * where both languages are wanted.
 */
export function useBilingualString() {
  const { primary, showSecondary } = useLanguagePreference();
  return (en: string, el: string) => resolveBilingualPair(en, el, primary, showSecondary).primaryText;
}

export function resolveBilingualPair(
  en: string,
  el: string | null | undefined,
  primary: PrimaryLanguage,
  showSecondary = true,
): {
  primaryText: string;
  secondaryText: string | null;
  primaryLang: 'en' | 'el';
  secondaryLang: 'en' | 'el' | null;
} {
  if (!el || el === en) {
    return { primaryText: en, secondaryText: null, primaryLang: 'en', secondaryLang: null };
  }
  if (primary === 'el') {
    return {
      primaryText: el,
      secondaryText: showSecondary ? en : null,
      primaryLang: 'el',
      secondaryLang: showSecondary ? 'en' : null,
    };
  }
  return {
    primaryText: en,
    secondaryText: showSecondary ? el : null,
    primaryLang: 'en',
    secondaryLang: showSecondary ? 'el' : null,
  };
}

