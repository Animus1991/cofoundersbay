import { describe, expect, it } from 'vitest';
import { listActionIds } from '@cofounderbay/shared';
// A plain Node script, so it also runs from the command line.
import { currentControls, loadBaseline, missingControls } from '../../../../scripts/controls-baseline.mjs';

/**
 * Nothing the pages do goes missing (docs §115). Cards are being simplified and
 * their actions moved into menus; the page's controls and the assistant's
 * capabilities must all still be there afterwards.
 */
describe('what the pages can do', () => {
  const baseline = loadBaseline() as { controls: Record<string, string[]>; capabilities: string[] };

  it('keeps every page control', () => {
    expect(missingControls(baseline.controls, currentControls())).toEqual([]);
  });

  it('keeps every capability', () => {
    const now = new Set<string>(listActionIds());
    expect(baseline.capabilities.filter((id) => !now.has(id))).toEqual([]);
  });

  it('would notice one going', () => {
    const current = { '/matches': ['connect_with'] };
    expect(missingControls({ '/matches': ['connect_with', 'pass_match'], '/gone': ['sort'] }, current)).toEqual(['/matches: pass_match', '/gone: sort']);
  });
});
