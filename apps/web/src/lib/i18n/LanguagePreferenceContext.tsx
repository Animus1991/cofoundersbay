'use client';

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react';

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

type LanguageSnapshot = {
  primary: PrimaryLanguage;
  displayMode: LanguageDisplayMode;
  mounted: boolean;
};

/**
 * The preference lives in a module store read through `useSyncExternalStore`,
 * not in provider state handed down through context.
 *
 * The distinction only matters during hydration, and there it is the whole
 * fix: Next 15 pages suspend on their async `params`/`searchParams`, so the
 * page subtree hydrates *after* the root layout. By then a context provider
 * had already applied the stored preference (Greek, primary-only), the late
 * subtree hydrated against text the server never rendered, and React threw
 * "Hydration failed because the server rendered text didn't match the
 * client" on every page whose visitor had changed either setting — the dev
 * overlay's permanent red badge.
 *
 * `useSyncExternalStore` renders every hydration pass from
 * `getServerSnapshot` — the same defaults the server used — so the HTML
 * always matches, and subscribers re-render to the stored preference
 * immediately afterwards.
 */
const SERVER_SNAPSHOT: LanguageSnapshot = { primary: 'en', displayMode: 'bilingual', mounted: false };

let snapshot: LanguageSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LanguageSnapshot {
  return snapshot;
}

function getServerSnapshot(): LanguageSnapshot {
  return SERVER_SNAPSHOT;
}

function setSnapshot(partial: Partial<LanguageSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  listeners.forEach((listener) => listener());
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/**
 * Applies the stored preference once the app is interactive, and mirrors the
 * current preference onto <html> (lang + data attributes the stylesheet keys
 * on). Reading state is not gated on being inside it — see the store above.
 */
export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let primary: PrimaryLanguage = 'en';
    let displayMode: LanguageDisplayMode = 'bilingual';
    try {
      const storedPrimary = localStorage.getItem(PRIMARY_STORAGE_KEY);
      if (storedPrimary === 'en' || storedPrimary === 'el') primary = storedPrimary;

      const storedDisplay = localStorage.getItem(DISPLAY_STORAGE_KEY);
      if (storedDisplay === 'bilingual' || storedDisplay === 'primary-only') {
        displayMode = storedDisplay;
      }
    } catch {
      /* ignore */
    }
    // Unconditional on purpose: a fresh provider (tests, remounts) resets a
    // stale module store to what storage actually holds.
    setSnapshot({ primary, displayMode, mounted: true });
  }, []);

  useEffect(() => {
    if (!snap.mounted) return;
    document.documentElement.lang = snap.primary;
    document.documentElement.dataset.primaryLang = snap.primary;
    document.documentElement.dataset.languageDisplay = snap.displayMode;
  }, [snap.mounted, snap.primary, snap.displayMode]);

  return <>{children}</>;
}

export function useLanguagePreference(): LanguagePreferenceContextValue {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPrimary = useCallback((lang: PrimaryLanguage) => {
    setSnapshot({ primary: lang });
    persist(PRIMARY_STORAGE_KEY, lang);
  }, []);

  const setDisplayMode = useCallback((mode: LanguageDisplayMode) => {
    setSnapshot({ displayMode: mode });
    persist(DISPLAY_STORAGE_KEY, mode);
  }, []);

  const togglePrimary = useCallback(() => {
    const next = getSnapshot().primary === 'en' ? 'el' : 'en';
    setSnapshot({ primary: next });
    persist(PRIMARY_STORAGE_KEY, next);
  }, []);

  return {
    primary: snap.primary,
    setPrimary,
    togglePrimary,
    displayMode: snap.displayMode,
    setDisplayMode,
    showSecondary: snap.displayMode === 'bilingual',
    mounted: snap.mounted,
  };
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

