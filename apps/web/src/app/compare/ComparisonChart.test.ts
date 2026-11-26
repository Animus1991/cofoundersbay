import { describe, expect, it } from 'vitest';
import { dimensionRows } from './ComparisonChart';

const greek = (_en: string, el: string) => el;
const axis = (key: string, label: string, score: number) => ({ key, label, score, color: '' });

describe('the comparison chart reads the engine (§162)', () => {
  it('draws nothing for people the engine has not scored', () => {
    expect(dimensionRows([{ id: 'a', displayName: 'A' }, { id: 'b', displayName: 'B', axes: [] }], greek)).toEqual([]);
  });

  it('charts each dimension the engine scored, in the reader’s language, and leaves a gap where it did not', () => {
    const rows = dimensionRows([
      { id: 'a', displayName: 'A', axes: [axis('skills', 'Skills & Expertise', 82), axis('location', 'Location Fit', 40)] },
      { id: 'b', displayName: 'B', axes: [axis('skills', 'Skills & Expertise', 64)] },
    ], greek);
    expect(rows).toEqual([
      { dimension: 'Δεξιότητες & εμπειρία', profile0: 82, profile1: 64 },
      { dimension: 'Εγγύτητα τοποθεσίας', profile0: 40, profile1: null },
    ]);
  });
});
