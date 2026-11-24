import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

/**
 * Every stylesheet parses. jsdom never loads them, so the rest of the suite
 * stayed green while a merge left `globals.css` with an unclosed
 * `@media` block (two sides both ending on `}`, docs §142), and every page
 * of the dev server answered 500.
 */
function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

describe('stylesheets', () => {
  const files = cssFiles('src');

  it('are found', () => {
    expect(files.some((f) => f.endsWith('globals.css'))).toBe(true);
  });

  it.each(files)('%s parses', (file) => {
    expect(() => postcss.parse(readFileSync(file, 'utf8'), { from: file })).not.toThrow();
  });
});
