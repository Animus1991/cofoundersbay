'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  APP_LOCALES,
  LOCALE_CHANGE_EVENT,
  getStoredLocale,
  type AppLocale,
} from '@/lib/locale';
import { LOCALE_BCP47, translate, type TranslateVars } from '@/lib/i18n/translate';

type I18nContextValue = {
  locale: AppLocale;
  bcp47: string;
  t: (source: string, vars?: TranslateVars) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  bcp47: 'en-US',
  t: (source, vars) => translate('en', source, vars),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>('en');

  useEffect(() => {
    setLocale(getStoredLocale());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (APP_LOCALES.some((l) => l.value === next)) setLocale(next as AppLocale);
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  }, []);

  const t = useCallback((source: string, vars?: TranslateVars) => translate(locale, source, vars), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, bcp47: LOCALE_BCP47[locale], t }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
