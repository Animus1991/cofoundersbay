'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { LOCALE_CHANGE_EVENT, getStoredLocale, type AppLocale } from '@/lib/locale';
import { LOCALE_BCP47, ensureExtraCatalog, translate, type TranslateVars } from '@/lib/i18n/translate';

type I18nContextValue = {
  locale: AppLocale;
  bcp47: string;
  t: (source: string, vars?: TranslateVars) => string;
};

/**
 * The locale is read through `useSyncExternalStore` **inside `useI18n`**, not
 * held in provider state, on purpose. React consults the server snapshot only
 * for the fiber it is hydrating right now — which is what makes this fix work
 * for Suspense boundaries that Next hydrates late. When the locale lived in
 * `useState` + a mount effect (and later in a store read at the provider), a
 * Greek reader's `locale` had already flipped to 'el' by the time a deferred
 * page subtree — `/settings`, `/messages`, `/search`, the auth shell — ran its
 * hydration render, so `t()` produced "Γλώσσα" over the server's "Language"
 * and React logged a hydration mismatch (`aria-label` on the language
 * switcher, docs §138). With the snapshot read per consumer, every hydration
 * render — however late the subtree streams — evaluates `t()` in English
 * exactly as the server did, then re-renders in the stored locale afterwards.
 */
const I18nContext = createContext<number>(0);

const localeListeners = new Set<() => void>();
let windowListening = false;
const notifyLocaleListeners = () => {
  localeListeners.forEach((notify) => notify());
};

function subscribeLocale(notify: () => void) {
  if (!windowListening) {
    windowListening = true;
    window.addEventListener(LOCALE_CHANGE_EVENT, notifyLocaleListeners);
    // 'storage' covers a second tab changing the language; the snapshot is a
    // cheap string read and React bails out when it has not changed.
    window.addEventListener('storage', notifyLocaleListeners);
  }
  localeListeners.add(notify);
  return () => {
    localeListeners.delete(notify);
  };
}

const getClientLocale = (): AppLocale => getStoredLocale();
// React re-invokes the server snapshot while hydrating; it must return the
// same value every call, so it is a module-level constant.
const getServerLocale = (): AppLocale => 'en';

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getClientLocale, getServerLocale);
  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Only invalidate `t` when a catalog was genuinely added. Bumping the tick
    // unconditionally re-created `t`, then the context value, re-rendering every
    // useI18n consumer in the tree and re-running DomI18n's whole-document pass —
    // on every locale-effect run, including English, where nothing can change.
    ensureExtraCatalog(locale).then((loaded) => {
      if (loaded && !cancelled) setCatalogTick((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return <I18nContext.Provider value={catalogTick}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const catalogTick = useContext(I18nContext);
  const locale = useSyncExternalStore(subscribeLocale, getClientLocale, getServerLocale);

  const t = useCallback((source: string, vars?: TranslateVars) => translate(locale, source, vars), [locale, catalogTick]);

  return useMemo<I18nContextValue>(
    () => ({ locale, bcp47: LOCALE_BCP47[locale], t }),
    [locale, t],
  );
}
