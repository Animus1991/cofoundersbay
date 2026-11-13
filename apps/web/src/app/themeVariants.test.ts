import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { THEME_ROOT, applyTheme, type ThemeName } from '@/lib/themes';
import { THEME_OPTIONS } from '@/components/theme/ThemeSwitcher';
import { translate } from '@/lib/i18n/translate';
import { planCopilotTools } from '@/lib/copilot-planner';
import { listDeclarations } from '@cofounderbay/shared';

/**
 * Three accents beside their originals (docs §125): Bordeaux on Terracotta,
 * Sky on Cyan, Graphite on Light. Each keeps its base's data-theme and swaps
 * the accent tokens with data-variant; the originals keep their own values.
 */

const CSS = readFileSync('src/app/globals.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function block(selector: string): string {
  for (const match of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].split(',').map((s) => s.trim()).includes(selector)) return match[2];
  }
  throw new Error(`Missing rule ${selector}`);
}

function token(body: string, name: string): [number, number, number] {
  const m = new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`).exec(body);
  if (!m) throw new Error(`Missing --${name}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function luminance([h, s, l]: [number, number, number]): number {
  const S = s / 100;
  const L = l / 100;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4));
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const VARIANTS: Array<{ name: ThemeName; base: ThemeName; dataTheme: string; page: string; original: [number, number, number] }> = [
  { name: 'wine', base: 'terra', dataTheme: 'terra', page: '[data-theme="terra"]', original: [335.59, 24.08, 48.04] },
  { name: 'sky', base: 'alliance', dataTheme: 'alliance', page: '[data-theme="alliance"]', original: [198.05, 67.21, 38.7] },
  { name: 'graphite', base: 'light', dataTheme: 'studio', page: 'html[data-theme="studio"]', original: [12, 6.5, 15.1] },
];

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-variant');
  document.documentElement.className = '';
  localStorage.clear();
});

describe('accent variants beside their originals', () => {
  it('ride on the base theme and keep the original as it was', () => {
    for (const v of VARIANTS) {
      expect(THEME_ROOT[v.name as Exclude<ThemeName, 'system'>]).toEqual({ mode: 'light', dataTheme: v.dataTheme, variant: v.name });
      const original = block(`html[data-theme="${v.dataTheme}"]`);
      expect(token(original, 'primary'), `${v.base} keeps its accent`).toEqual(v.original);
    }
  });

  it('carry the owner\'s colours: wine 10 points lighter, the sky fill, the soft ink', () => {
    expect(token(block('html[data-theme="terra"][data-variant="wine"]'), 'primary')).toEqual([329.17, 59.02, 33.92]);
    expect(token(block('html[data-theme="alliance"][data-variant="sky"]'), 'primary')).toEqual([193.7, 71.75, 65.29]);
    expect(token(block('html[data-theme="studio"][data-variant="graphite"]'), 'primary')).toEqual([60, 1.16, 33.73]);
  });

  it('clear the contrast floors on their base page', () => {
    for (const v of VARIANTS) {
      const variant = block(`html[data-theme="${v.dataTheme}"][data-variant="${v.name}"]`);
      const base = block(`html[data-theme="${v.dataTheme}"]`);
      const pick = (name: string) => {
        try { return token(variant, name); } catch { return token(base, name); }
      };
      const page = token(block(v.page), 'background');
      expect(contrast(pick('primary-foreground'), pick('primary')), `${v.name}: label on the fill`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(pick('primary-accessible'), page), `${v.name}: links on the page`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(pick('ring'), page), `${v.name}: focus ring on the page`).toBeGreaterThanOrEqual(3);
    }
  });

  it('give Sky\'s light fill deep letters and its text the link step', () => {
    const sky = block('html[data-theme="alliance"][data-variant="sky"]');
    expect(contrast([0, 0, 100], token(sky, 'primary'))).toBeLessThan(4.5);
    expect(contrast(token(sky, 'primary-foreground'), token(sky, 'primary'))).toBeGreaterThanOrEqual(7);
    expect(block(`html[data-theme="alliance"][data-variant="sky"] [class~='text-primary']`)).toMatch(/hsl\(var\(--primary-accessible\)\)/);
  });

  it('set data-variant on the way in and clear it on the way out', () => {
    applyTheme('sky');
    expect(document.documentElement.getAttribute('data-theme')).toBe('alliance');
    expect(document.documentElement.getAttribute('data-variant')).toBe('sky');
    applyTheme('alliance');
    expect(document.documentElement.getAttribute('data-theme')).toBe('alliance');
    expect(document.documentElement.hasAttribute('data-variant')).toBe(false);
    applyTheme('graphite');
    expect(document.documentElement.getAttribute('data-theme')).toBe('studio');
    expect(document.documentElement.getAttribute('data-variant')).toBe('graphite');
    expect(localStorage.getItem('theme')).toBe('graphite');
  });

  it('are offered beside their originals, named in Greek', () => {
    const names = THEME_OPTIONS.map((o) => o.name);
    for (const v of VARIANTS) {
      expect(names.indexOf(v.name), `${v.name} follows ${v.base}`).toBe(names.indexOf(v.base) + 1);
      const option = THEME_OPTIONS.find((o) => o.name === v.name)!;
      expect(translate('el', option.label)).not.toBe(option.label);
      expect(translate('el', option.description)).not.toBe(option.description);
    }
    // Terracotta had no Greek name.
    expect(translate('el', 'Terracotta')).toBe('Τερακότα');
  });

  it('can be asked for in the chat, and the assistant may set them', () => {
    const theme = (message: string) => planCopilotTools(message).find((t) => t.name === 'set_theme')?.args;
    expect(theme('Βάλε το θέμα μπορντό')).toEqual({ theme: 'wine' });
    expect(theme('Switch to the sky theme')).toEqual({ theme: 'sky' });
    expect(theme('Θέλω το θέμα γραφίτης')).toEqual({ theme: 'graphite' });
    const setTheme = listDeclarations().find((d) => d.id === 'set_theme')!;
    expect(setTheme.params?.[0]?.enumValues).toEqual(expect.arrayContaining(['wine', 'sky', 'graphite']));
  });
});
