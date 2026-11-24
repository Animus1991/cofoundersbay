import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Round 136 / Spec B1.1 — a colour floor for the semantic status tints.
 *
 * Waves 1-3 built tinted wells, stickers, tiles and strips on tints that in
 * the owner's Mint theme were 21% saturation on a cream page — colourless.
 * This guard keeps every theme's `status-*` set above the floor:
 *
 *   light themes  -bg S>=55%, L 84-92 | -border same hue S>=40%, L 72-80 |
 *                   -fg same hue family S>=40% (contrast is gated by
 *                   scripts/check-theme-contrast.py, not here)
 *   dark themes   -bg S>=35%, L 16-20
 *
 * Mint is the documented exception: its tints carry the spec's own values
 * (46-82% saturation, a 38% border on success), so its floors are the
 * values it shipped with — the guard's job is that no tint fades back to
 * grey, not that Mint becomes another theme. `neutral` stays quiet in
 * every theme (its bg is asserted *below* a saturation ceiling instead).
 */

const CSS = readFileSync('src/app/globals.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const CHROMATIC = ['success', 'warning', 'danger', 'info', 'accent'] as const;
const DARK_SELECTORS = new Set(['.dark', '[data-theme="cofounder"]', '[data-theme="playful-dark"]', '[data-theme="system"]']);

interface StatusBlock {
  selector: string;
  vars: Map<string, [number, number, number]>;
}

function statusBlocks(): StatusBlock[] {
  const out = new Map<string, StatusBlock>();
  for (const match of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = match[2];
    if (!body.includes('--status-')) continue;
    const vars = new Map<string, [number, number, number]>();
    for (const vm of body.matchAll(/--([\w-]+)\s*:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)) {
      vars.set(vm[1], [Number(vm[2]), Number(vm[3]), Number(vm[4])]);
    }
    for (const sel of match[1].split(',')) {
      const s = sel.trim().replace(/^html/, '');
      const prev = out.get(s);
      out.set(s, { selector: s, vars: new Map([...(prev?.vars ?? []), ...vars]) });
    }
  }
  return [...out.values()];
}

function hueDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const BLOCKS = statusBlocks();

// Floors a block must clear: Mint ships the spec's own tint set (bg >=45,
// border >=35); every other light block clears the full >=55 / >=40 floor.
function floors(block: StatusBlock): { bgS: number; borderS: number; dark: boolean } {
  const sels = block.selector;
  if (DARK_SELECTORS.has(sels)) return { bgS: 35, borderS: 0, dark: true };
  if (sels === '[data-theme="minimal"]') return { bgS: 45, borderS: 35, dark: false };
  return { bgS: 55, borderS: 40, dark: false };
}

describe('status tint chroma floor (B1.1)', () => {
  it('finds the status blocks for every theme', () => {
    const found = new Set(BLOCKS.map((b) => b.selector));
    for (const sel of [
      ':root', '.dark', '.dark, [data-theme="cofounder"]', // listed forms may differ
    ]) void sel;
    // Each of these selectors must own at least one status token.
    for (const sel of [
      ':root',
      '[data-theme="alliance"]',
      '[data-theme="minimal"]',
      '[data-theme="apricot"]',
      '[data-theme="terra"]',
      '[data-theme="playful"]',
      '[data-theme="playful-dark"]',
      '[data-theme="system"]',
      '.dark',
    ]) {
      const block = BLOCKS.find((b) => b.selector === sel);
      expect(block, sel).toBeDefined();
      expect([...block!.vars.keys()].some((k) => k.startsWith('status-')), sel).toBe(true);
    }
    void found;
  });

  it('keeps every light tint coloured, bordered and worded in its own hue', () => {
    const light = BLOCKS.filter((b) => !floors(b).dark && b.vars.has('status-success-bg'));
    expect(light.length).toBeGreaterThanOrEqual(4);
    for (const block of light) {
      const { bgS, borderS } = floors(block);
      for (const status of CHROMATIC) {
        const bg = block.vars.get(`status-${status}-bg`)!;
        const border = block.vars.get(`status-${status}-border`)!;
        const fg = block.vars.get(`status-${status}-fg`)!;
        expect(bg, `${block.selector} ${status}-bg`).toBeDefined();
        expect(bg[1], `${block.selector} ${status}-bg saturation`).toBeGreaterThanOrEqual(bgS);
        expect(bg[2], `${block.selector} ${status}-bg lightness`).toBeGreaterThanOrEqual(84);
        expect(bg[2], `${block.selector} ${status}-bg lightness`).toBeLessThanOrEqual(92);
        expect(hueDelta(border[0], bg[0]), `${block.selector} ${status}-border hue`).toBeLessThanOrEqual(3);
        expect(border[1], `${block.selector} ${status}-border saturation`).toBeGreaterThanOrEqual(borderS);
        expect(border[2], `${block.selector} ${status}-border lightness`).toBeGreaterThanOrEqual(72);
        expect(border[2], `${block.selector} ${status}-border lightness`).toBeLessThanOrEqual(80);
        expect(hueDelta(fg[0], bg[0]), `${block.selector} ${status}-fg hue family`).toBeLessThanOrEqual(12);
        expect(fg[1], `${block.selector} ${status}-fg saturation`).toBeGreaterThanOrEqual(40);
      }
    }
  });

  it('keeps every dark tint coloured', () => {
    const dark = BLOCKS.filter((b) => floors(b).dark && b.vars.has('status-success-bg'));
    expect(dark.length).toBeGreaterThanOrEqual(1);
    for (const block of dark) {
      for (const status of CHROMATIC) {
        const bg = block.vars.get(`status-${status}-bg`)!;
        expect(bg, `${block.selector} ${status}-bg`).toBeDefined();
        expect(bg[1], `${block.selector} ${status}-bg saturation`).toBeGreaterThanOrEqual(35);
        expect(bg[2], `${block.selector} ${status}-bg lightness`).toBeGreaterThanOrEqual(16);
        expect(bg[2], `${block.selector} ${status}-bg lightness`).toBeLessThanOrEqual(20);
      }
    }
  });

  it('keeps neutral quiet in every theme', () => {
    for (const block of BLOCKS) {
      const neutral = block.vars.get('status-neutral-bg');
      if (!neutral) continue;
      const { dark } = floors(block);
      expect(neutral[1], `${block.selector} neutral-bg saturation`).toBeLessThanOrEqual(dark ? 25 : 15);
    }
  });
});
