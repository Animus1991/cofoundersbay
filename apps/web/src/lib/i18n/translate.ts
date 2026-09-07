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

export async function ensureExtraCatalog(locale: AppLocale): Promise<void> {
  if (locale === 'en') return;
  if (extraCache[locale]) return;
  const mod = await extraLoaders[locale]();
  extraCache[locale] = mod.default as Record<string, string>;
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
  const extra = locale === 'en' ? undefined : extraCache[locale];
  const translated = CATALOG[locale]?.[source] ?? extra?.[source] ?? source;
  return interpolate(translated, vars);
}
