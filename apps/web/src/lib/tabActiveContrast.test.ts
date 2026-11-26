import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A tab whose page changes its active fill says what colour its label is.
 *
 * The strip's active tab is solid primary with white text (components/ui/
 * tabs). Three strips swapped the fill (bg-background, bg-transparent for an
 * underline) and kept the white: the active tab read as an empty pill on
 * Services (`Όλες οι υπηρεσίες`), Edit profile (`Βασικά στοιχεία`) and
 * Reputation (§162, §164).
 */
describe('active tabs stay readable', () => {
  it('sets the active text wherever the active fill is changed', () => {
    const SRC = join(__dirname, '..');
    const files = (dir: string, out: string[] = []): string[] => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) files(path, out);
        else if (name.endsWith('.tsx') && !name.includes('.test.')) out.push(path);
      }
      return out;
    };
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      const rel = relative(SRC, file).replace(/\\/g, '/');
      if (rel === 'components/ui/tabs.tsx') continue;
      for (const m of readFileSync(file, 'utf8').matchAll(/className="([^"]*data-\[state=active\]:bg-(?!primary\b)[^"]*)"/g)) {
        if (!/data-\[state=active\]:text-/.test(m[1])) offenders.push(`${rel}: ${m[1].slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
