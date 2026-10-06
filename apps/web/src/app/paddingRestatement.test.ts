import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * On desktop, globals.css restates the padding shorthands (`p-*`, `px-*`,
 * `py-*`) in pixels, after Tailwind's utilities. Same specificity, later in
 * the sheet: the shorthand now beats any side class Tailwind emitted before
 * it - unless that side class is restated too, after the shorthands. So every
 * bare `pt-/pr-/pb-/pl-` step the product uses must appear in that list.
 * `pr-24` was missing: /register reserved 96px for its Show button, desktop
 * rendered 12px, and the placeholder ran under the button.
 */
const css = readFileSync('src/app/globals.css', 'utf8');

describe('desktop padding restatement', () => {
  it('restates every side padding step the product uses', () => {
    const start = css.indexOf('The side utilities, restated after the shorthands above');
    expect(start).toBeGreaterThan(0);
    const block = css.slice(start, start + 20000);
    const restated = new Set([...block.matchAll(/^\s*\.(p[trbl]-[\d\\.]+)\s*\{/gm)].map((m) => m[1].replace(/\\/g, '')));
    const src = execSync(
      String.raw`grep -rhoE "(^|[ \"'\x60])p[trbl]-[0-9]+(\.5)?\b" src --include=*.tsx --include=*.ts || true`,
      { encoding: 'utf8' },
    );
    const used = new Set(src.split(/\s+/).map((t) => t.replace(/^["'`]/, '')).filter((t) => /^p[trbl]-\d+(\.5)?$/.test(t)));
    expect([...used].filter((u) => !restated.has(u)).sort()).toEqual([]);
  });
});
