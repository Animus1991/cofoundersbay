import { describe, expect, it } from 'vitest';
import { coveredAreas, teamGaps } from './team-gaps';

describe('team gaps', () => {
  it('reads areas from skill names, short words only as whole words', () => {
    expect(coveredAreas(['React', 'Node.js'])).toEqual(['build']);
    expect(coveredAreas(['UI/UX Design'])).toEqual(['design']);
    expect(coveredAreas(['Sales', 'Fundraising'])).toEqual(['market', 'operate']);
    // "ai" inside "Retail" is not AI.
    expect(coveredAreas(['Retail'])).toEqual([]);
  });

  it('names the areas nobody covers', () => {
    expect(teamGaps(['Product Management', 'Sales'])).toEqual({ covered: ['market', 'operate'], gaps: ['build', 'design'] });
    expect(teamGaps([]).gaps).toHaveLength(4);
  });
});
