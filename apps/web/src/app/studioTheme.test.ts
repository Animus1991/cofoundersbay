import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { THEME_ROOT, applyTheme } from '@/lib/themes';
import { THEME_OPTIONS } from '@/components/theme/ThemeSwitcher';
import { translate } from '@/lib/i18n/translate';

/**
 * The Light theme is the AI Studio prototype's look (data-theme="studio",
 * docs §63): warm stone, a white card and sidebar, ink as the one action
 * colour, the brand lilac kept for the mark. The previous Light is "Lilac".
 * Colour and surface only: the owner asked for the type to stay as it is.
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

const STUDIO = block('html[data-theme="studio"]');

describe('the Light theme (studio)', () => {
  it('is warm stone with ink, the white card and a 16px corner', () => {
    expect(token(STUDIO, 'background')).toEqual([60, 9.1, 97.8]);
    expect(token(STUDIO, 'card')).toEqual([0, 0, 100]);
    expect(token(STUDIO, 'primary')).toEqual([12, 6.5, 15.1]);
    expect(STUDIO).toMatch(/--radius:\s*16px/);
    // The brand stays as the mark.
    expect(token(STUDIO, 'brand')).toEqual([250, 74, 63.9]);
  });

  it('clears every contrast floor', () => {
    const bg = token(STUDIO, 'background');
    const card = token(STUDIO, 'card');
    const muted = token(STUDIO, 'muted');
    const fg = token(STUDIO, 'foreground');
    const mutedFg = token(STUDIO, 'muted-foreground');
    expect(contrast(fg, bg)).toBeGreaterThan(7);
    for (const surface of [bg, card, muted]) expect(contrast(mutedFg, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(STUDIO, 'primary-foreground'), token(STUDIO, 'primary'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(STUDIO, 'destructive-foreground'), token(STUDIO, 'destructive'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(STUDIO, 'ring'), bg)).toBeGreaterThanOrEqual(3);
    // Hairlines, not frames.
    expect(contrast(token(STUDIO, 'border'), card)).toBeLessThan(1.3);
    expect(contrast(token(STUDIO, 'input'), card)).toBeLessThan(1.45);
  });

  it('draws the selected destination and the next step in ink', () => {
    expect(block(`html[data-theme="studio"] [data-sidenav] a[aria-current='page']`)).toMatch(/background-color:\s*hsl\(var\(--primary\)\)/);
    expect(block(`html[data-theme="studio"] [data-next-step='next']`)).toMatch(/background-color:\s*hsl\(var\(--primary\)\)/);
    expect(block(`html[data-theme="studio"] aside[data-sidenav]`)).toMatch(/background-color:\s*hsl\(var\(--card\)\)/);
    expect(block(`html[data-theme="studio"] .cfb-glyph [data-accent]`)).toMatch(/hsl\(var\(--brand\)\)/);
  });

  it('changes no type: no size, weight, spacing or family in its rules', () => {
    const studioRules = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].includes('data-theme="studio"'));
    expect(studioRules.length).toBeGreaterThan(10);
    for (const [, selector, body] of studioRules) {
      expect(body, selector.trim()).not.toMatch(/font-size|font-weight|letter-spacing|line-height|font-family|--font-size/);
    }
  });
});

describe('theme names', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    localStorage.clear();
  });

  it('maps Light to the studio look and keeps the old Light as Lilac', () => {
    expect(THEME_ROOT.light).toEqual({ mode: 'light', dataTheme: 'studio' });
    expect(THEME_ROOT.lilac).toEqual({ mode: 'light', dataTheme: null });
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('studio');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    applyTheme('lilac');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('lilac');
  });

  it('offers Lilac beside Light, in Greek too', () => {
    const names = THEME_OPTIONS.map((o) => o.name);
    expect(names).toContain('light');
    expect(names).toContain('lilac');
    for (const option of THEME_OPTIONS.filter((o) => o.name === 'light' || o.name === 'lilac')) {
      expect(translate('el', option.label)).not.toBe(option.label);
      expect(translate('el', option.description)).not.toBe(option.description);
    }
  });
});
