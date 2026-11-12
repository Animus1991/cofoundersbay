import { describe, expect, it, vi } from 'vitest';
import { haptic, hapticPattern } from './haptics';

const coarse = () => ({ matches: true });
const fine = () => ({ matches: false });

describe('haptics (docs §122)', () => {
  it('has a distinct pattern per outcome', () => {
    expect(hapticPattern('done')).toBe(12);
    expect(hapticPattern('undone')).toEqual([10, 40, 10]);
    expect(hapticPattern('error')).toEqual([30, 50, 30]);
  });

  it('vibrates a phone with the outcome pattern', () => {
    const vibrate = vi.fn(() => true);
    expect(haptic('done', { vibrate }, coarse)).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(12);
  });

  it('leaves a laptop alone even when it could vibrate', () => {
    const vibrate = vi.fn(() => true);
    expect(haptic('done', { vibrate }, fine)).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('is never a prerequisite: unsupported, refused or throwing all read as false', () => {
    expect(haptic('done', {}, coarse)).toBe(false);
    expect(haptic('done', undefined, coarse)).toBe(false);
    expect(haptic('done', { vibrate: () => false }, coarse)).toBe(false);
    expect(haptic('done', { vibrate: () => { throw new Error('blocked'); } }, coarse)).toBe(false);
    expect(haptic('done', { vibrate: () => true }, undefined)).toBe(false);
  });
});
