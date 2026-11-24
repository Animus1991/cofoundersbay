import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = (rel: string) => readFileSync(join(__dirname, rel), 'utf8');

/* The wave-4 shell rules the unit tests cannot see (docs §135). */
describe('Wave 4 shell', () => {
  it('keeps the page ask field in the DOM on phones, collapsed behind its icon', () => {
    const shell = readFileSync(join(__dirname, '../components/layout/AppShell.tsx'), 'utf8');
    // The toggle exposes its state; the field hides under sm rather than unmounting.
    expect(shell).toContain('aria-expanded={askOpen}');
    expect(shell).toContain('page-ask-ai');
    expect(shell).toMatch(/!askOpen\s*&&\s*!titleSrOnly\s*&&\s*'max-sm:hidden'/);
  });

  it('renders the dashboards\' figures before Today (docs §135 A4)', () => {
    for (const f of [
      'dashboard/founder/FounderDashboardContent.tsx',
      'dashboard/mentor/page.tsx',
      'dashboard/investor/page.tsx',
      'dashboard/incubator/page.tsx',
      'dashboard/provider/page.tsx',
      'admin/dashboard/page.tsx',
      'tenant/dashboard/page.tsx',
    ]) {
      const page = src(f);
      const tiles = page.indexOf('<MetricTile');
      const today = page.indexOf('<HomeToday');
      expect(tiles, `${f}: no MetricTile grid`).toBeGreaterThan(-1);
      expect(today, `${f}: no HomeToday`).toBeGreaterThan(-1);
      expect(tiles, `${f}: figures must precede Today`).toBeLessThan(today);
    }
  });

  it('keeps one role control on discover: the chips and the tiles draw the same items (docs §135 A5)', () => {
    const page = src('discover/page.tsx');
    // Both drawings map the same roleChips and call the same setter.
    expect(page.match(/roleChips\.map/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page).not.toContain('INTENT_TILES.map');
    expect(page).toContain('data-intent-tiles');
  });

  it('caps CoverImage so a cover never fills a first screen (docs §135 A3)', () => {
    const cover = readFileSync(join(__dirname, '../components/common/CoverImage.tsx'), 'utf8');
    expect(cover).toContain('sm:max-h-[240px]');
  });

  it('marks every metric family with a tinted well (docs §134.C)', () => {
    const tile = readFileSync(join(__dirname, '../components/dashboard/MetricTile.tsx'), 'utf8');
    expect(tile).toContain('family');
  });
});
