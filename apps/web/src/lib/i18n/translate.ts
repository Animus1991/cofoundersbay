import { APP_LOCALES, type AppLocale } from '@/lib/locale';
import { CATALOG } from './catalog';

const extraCache: Partial<Record<Exclude<AppLocale, 'en'>, Record<string, string>>> = {};

const extraLoaders: Record<Exclude<AppLocale, 'en'>, () => Promise<{ default: Record<string, string> }>> = {
  el: () => import('./messages/el.json'),
  es: () => import('./messages/es.json'),
  fr: () => import('./messages/fr.json'),
  de: () => import('./messages/de.json'),
  it: () => import('./messages/it.json'),
  pt: () => import('./messages/pt.json'),
  zh: () => import('./messages/zh.json'),
  ja: () => import('./messages/ja.json'),
};

/**
 * Loads the on-demand message catalog for a locale.
 *
 * Returns whether this call actually added a catalog. Callers use that to decide
 * whether re-rendering is warranted: English has no catalog and an already-cached
 * locale has nothing new, so in both cases the translation output is unchanged and
 * invalidating consumers would be pure churn.
 */
export async function ensureExtraCatalog(locale: AppLocale): Promise<boolean> {
  if (locale === 'en') return false;
  if (extraCache[locale]) return false;
  const mod = await extraLoaders[locale]();
  extraCache[locale] = mod.default as Record<string, string>;
  return true;
}

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
  if (locale === 'en') return interpolate(source, vars);
  const extra = extraCache[locale];
  const translated = CATALOG[locale]?.[source] ?? extra?.[source] ?? source;
  return interpolate(translated, vars);
}
