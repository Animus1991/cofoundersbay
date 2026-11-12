import { describe, expect, it } from 'vitest';
import { wantsTourFromUrl } from './tour-replay';

describe('wantsTourFromUrl (docs §122)', () => {
  it('reads ?tour=1 and the tour’s own id, with or without the question mark', () => {
    expect(wantsTourFromUrl('?tour=1', 'matches')).toBe(true);
    expect(wantsTourFromUrl('tour=matches&x=2', 'matches')).toBe(true);
    expect(wantsTourFromUrl('?tour=builder', 'matches')).toBe(false);
    expect(wantsTourFromUrl('?tab=people', 'matches')).toBe(false);
    expect(wantsTourFromUrl('', 'matches')).toBe(false);
  });
});
