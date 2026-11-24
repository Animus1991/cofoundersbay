import { describe, expect, it } from 'vitest';
import { DESKTOP_FIRST, PHONE_FIRST, foldedCardClass, showAllClass } from './firstScreen';

describe('capabilities first screen', () => {
  it('folds the seventh card on a phone and the tenth everywhere, until the section opens', () => {
    expect(foldedCardClass(PHONE_FIRST - 1, false, false)).toBeUndefined();
    expect(foldedCardClass(PHONE_FIRST, false, false)).toBe('max-sm:hidden');
    expect(foldedCardClass(DESKTOP_FIRST, false, false)).toBe('hidden');
    expect(foldedCardClass(DESKTOP_FIRST, true, false)).toBeUndefined();
  });

  it('a search shows every match', () => {
    expect(foldedCardClass(50, false, true)).toBeUndefined();
    expect(showAllClass(50, false, true)).toBeNull();
  });

  it('offers Show all only where cards are folded', () => {
    expect(showAllClass(PHONE_FIRST, false, false)).toBeNull();
    expect(showAllClass(PHONE_FIRST + 1, false, false)).toBe('mt-3 w-full sm:hidden');
    expect(showAllClass(DESKTOP_FIRST + 1, false, false)).toBe('mt-3 w-full sm:w-auto');
    expect(showAllClass(50, true, false)).toBeNull();
  });
});
