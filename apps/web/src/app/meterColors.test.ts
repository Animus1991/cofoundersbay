import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Achievement meters use the other themes' accents, never the accent of the
 * theme they sit in. Mint stays on the pair it already had: apricot for an
 * ordinary bar, lilac for a weighted bar (data-meter="lilac").
 */

const CSS = readFileSync('src/app/globals.css', 'utf8');

function rule(selector: string): string {
  const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of rules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(',').map((part) => part.trim());
    if (selectors.includes(selector)) return match[2];
  }
  throw new Error(`Missing rule ${selector}`);
}

function fill(selector: string): string {
  const value = /background-color:\s*([^;]+)/.exec(rule(selector))?.[1]?.trim();
  if (!value) throw new Error(`No fill for ${selector}`);
  return value;
}

describe('achievement meter colours', () => {
  it('keeps Mint on apricot and lilac', () => {
    expect(fill("html[data-theme=\"minimal\"] #main-content [role='progressbar'] > *")).toBe(
      'hsl(var(--meter-apricot))',
    );
    expect(fill("html[data-theme=\"minimal\"] #main-content [data-meter='lilac'][role='progressbar'] > *")).toBe(
      'hsl(var(--meter-lilac))',
    );
  });

  it('paints Light bars with mint, apricot and cyan', () => {
    const light = "html.light:not([data-theme]) #main-content";
    expect(fill(`${light} [data-meter-slot='0'][role='progressbar'] > *`)).toBe('hsl(var(--meter-mint))');
    expect(fill(`${light} [data-meter-slot='1'][role='progressbar'] > *`)).toBe('hsl(var(--meter-apricot))');
    expect(fill(`${light} [data-meter-slot='2'][role='progressbar'] > *`)).toBe('hsl(var(--meter-cyan))');
    expect(fill(`${light} [role='progressbar'] > *`)).not.toContain('meter-lilac');
  });

  it('paints Apricot bars with mint, lilac and cyan', () => {
    const theme = 'html[data-theme="apricot"] #main-content';
    expect(fill(`${theme} [data-meter-slot='0'][role='progressbar'] > *`)).toBe('hsl(var(--meter-mint))');
    expect(fill(`${theme} [data-meter-slot='1'][role='progressbar'] > *`)).toBe('hsl(var(--meter-lilac))');
    expect(fill(`${theme} [data-meter-slot='2'][role='progressbar'] > *`)).toBe('hsl(var(--meter-cyan))');
    expect(fill(`${theme} [role='progressbar'] > *`)).not.toContain('meter-apricot');
  });

  it('paints Cyan bars with mint, apricot and lilac', () => {
    const theme = 'html[data-theme="alliance"] #main-content';
    expect(fill(`${theme} [data-meter-slot='0'][role='progressbar'] > *`)).toBe('hsl(var(--meter-mint))');
    expect(fill(`${theme} [data-meter-slot='1'][role='progressbar'] > *`)).toBe('hsl(var(--meter-apricot))');
    expect(fill(`${theme} [data-meter-slot='2'][role='progressbar'] > *`)).toBe('hsl(var(--meter-lilac))');
    expect(fill(`${theme} [role='progressbar'] > *`)).not.toContain('meter-cyan');
  });

  it('does not change type size inside the meter rules', () => {
    const from = CSS.indexOf('Achievement meters borrow');
    expect(from).toBeGreaterThan(0);
    expect(CSS.slice(from, from + 2800)).not.toMatch(/font-size|line-height|margin|padding/);
  });
});
