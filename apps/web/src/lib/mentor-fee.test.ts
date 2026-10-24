import { describe, expect, it } from 'vitest';
import { formatFee } from './mentor-fee';

describe('mentor fees', () => {
  it('are in euros unless the rate was stored in another currency', () => {
    expect(formatFee(150)).toBe('€150');
    expect(formatFee(150, null)).toBe('€150');
    expect(formatFee(1250)).toBe('€1,250');
    expect(formatFee(150, 'USD')).toBe('$150');
    expect(formatFee(37.5, 'EUR', 2)).toBe('€37.50');
  });
});
