import { APP_LOCALES, type AppLocale } from '@/lib/locale';
import { CATALOG } from './catalog';

export const LOCALE_BCP47: Record<AppLocale, string> = {
  en: 'en-US',
  el: 'el-GR',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  zh: 'zh-CN',
  ja: 'ja-JP',
};

export type TranslateVars = Record<string, string | number>;

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined || vars[key] === null ? `{${key}}` : String(vars[key]),
  );
}

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.some((l) => l.value === value);
}

/** Translate an English UI string for the active locale. Unknown strings stay in English. */
export function translate(locale: AppLocale, source: string, vars?: TranslateVars): string {
  if (!source) return source;
  const table = locale === 'en' ? undefined : CATALOG[locale];
  const translated = table?.[source] ?? source;
  return interpolate(translated, vars);
}
