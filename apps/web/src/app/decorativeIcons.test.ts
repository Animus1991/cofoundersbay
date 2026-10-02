import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The decorative-icon rules hide glyphs beside copy and keep the icon of an
 * icon-only control. Two ways they have broken, both silent in the browser:
 *
 * - `:has(> :not(svg))` read a screen-reader name as a visible label and hid
 *   the only thing a sighted reader could see (364 blank buttons);
 * - a `:has()` nested in another `:has()` is invalid, and one invalid
 *   selector drops its whole rule, so every decorative glyph came back.
 */
const css = readFileSync('src/app/globals.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The argument of each `:has(` in the stylesheet, with balanced parentheses. */
function hasArguments(source: string): string[] {
  const out: string[] = [];
  let at = source.indexOf(':has(');
  while (at !== -1) {
    let depth = 0;
    let end = at + 4;
    for (; end < source.length; end++) {
      if (source[end] === '(') depth++;
      else if (source[end] === ')' && --depth === 0) break;
    }
    out.push(source.slice(at + 5, end));
    at = source.indexOf(':has(', at + 5);
  }
  return out;
}

describe('decorative icon rules', () => {
  const args = hasArguments(css);

  it('never nest :has()', () => {
    expect(args.filter((arg) => arg.includes(':has('))).toEqual([]);
  });

  it('do not read a screen-reader name as a label', () => {
    const labelTests = args.filter((arg) => /^>\s*:not\(svg\)/.test(arg));
    expect(labelTests.length).toBeGreaterThan(10);
    expect(labelTests.filter((arg) => !arg.includes(':not(.sr-only)'))).toEqual([]);
  });
});
