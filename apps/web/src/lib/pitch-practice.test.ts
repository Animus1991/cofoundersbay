import { describe, expect, it } from 'vitest';
import { isPitchPractice } from './pitch-practice';

describe('isPitchPractice', () => {
  it('recognises only the pitch-practice preset', () => {
    expect(isPitchPractice('pitch-practice')).toBe(true);
    expect(isPitchPractice('workshop')).toBe(false);
    expect(isPitchPractice(null)).toBe(false);
  });
});
