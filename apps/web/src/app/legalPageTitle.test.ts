import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The legal pages' titles are the platform's page-title size (docs §69). They
 * were text-3xl, 26px at 1440px against 16.8px on every other page.
 */
describe('legal page titles', () => {
  for (const page of ['privacy', 'terms']) {
    it(`${page} uses the page-title size`, () => {
      const src = readFileSync(`src/app/${page}/page.tsx`, 'utf8');
      const h1 = src.match(/<h1 className="([^"]+)"/)?.[1] ?? '';
      expect(h1).toContain('page-title');
      expect(h1).not.toMatch(/\btext-(2|3|4)xl\b/);
    });
  }
});
