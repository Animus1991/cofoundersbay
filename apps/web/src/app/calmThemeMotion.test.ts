import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// On Windows the checkout may be CRLF; normalise before matching rules that
// span line breaks (same pattern as railSurface.test.ts).
const src = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const css = src('src/app/globals.css');
const animatedList = src('src/components/common/AnimatedList.tsx');

/**
 * The minimal theme kills the entrance animations it wants calm — but only
 * killing `animation` leaves a child the component (or the keyframe) kept at
 * opacity 0 frozen forever. The rule has to render the final state, the same
 * way prefers-reduced-motion does.
 */
// The unlayered minimal block is the only `[data-theme="minimal"] {` at
// column 0; everything inside it is indented, so the next `}` at column 0
// closes it.
const blockStart = css.indexOf('\n[data-theme="minimal"] {') + 1;
const block = css.slice(blockStart, css.indexOf('\n}', blockStart));

describe('minimal theme motion', () => {
  it('renders entrance-animated children at their final state', () => {
    const rules = [...block.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const entranceRules = rules.filter(
      ([, selectors, declarations]) =>
        /\.animate-(fade-in-up|scale-in)\b/.test(selectors) && /\banimation:\s*none\b/.test(declarations),
    );
    expect(entranceRules.length).toBeGreaterThan(0);
    for (const [, , declarations] of entranceRules) {
      expect(declarations).toMatch(/\bopacity:\s*1\b/);
    }
  });

  it('leaves AnimatedList children visible once animation is off', () => {
    expect(animatedList).not.toContain('opacity-0');
  });
});
