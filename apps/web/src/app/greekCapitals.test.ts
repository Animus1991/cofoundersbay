import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Sentence case must not cost a Greek capital its accent. `uppercase` on a
 * first letter follows Greek's all-caps rule in Chrome and turns «Άνοιγμα»
 * into «Ανοιγμα»; `capitalize` on the same single letter does not.
 */
const CSS = readFileSync('src/app/globals.css', 'utf8');

describe('Greek capitals', () => {
  it('capitalises a first letter without the all-caps rule', () => {
    expect(CSS).toMatch(/:root \[class~='first-letter:uppercase'\]::first-letter\s*\{\s*text-transform:\s*capitalize;/);
  });
});
