import { describe, expect, it } from 'vitest';
import { promotedLayout } from './discover-promoted';

describe('promotedLayout', () => {
  it('leads the results grid with up to two paid cards', () => {
    expect(promotedLayout(0)).toBe('inline');
    expect(promotedLayout(1)).toBe('inline');
    expect(promotedLayout(2)).toBe('inline');
  });

  it('keeps three or more in their own section', () => {
    expect(promotedLayout(3)).toBe('section');
    expect(promotedLayout(10)).toBe('section');
  });
});
