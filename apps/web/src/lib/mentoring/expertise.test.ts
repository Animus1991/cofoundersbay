import { describe, expect, it } from 'vitest';
import { expertiseFacets, withExpertise } from './expertise';

const mentors = [
  { name: 'Sarah', expertise: ['Mentoring', 'Go-to-market', 'Leadership'] },
  { name: 'Thanos', expertise: ['Energy markets', 'Hardware'] },
  { name: 'Ioanna', expertise: ['Growth marketing', 'Go-to-market'] },
];

describe('mentor expertise chips', () => {
  it('are the areas the mentors name, most common first, with counts', () => {
    const facets = expertiseFacets(mentors, 'All');
    expect(facets[0]).toEqual({ label: 'Go-to-market', n: 2 });
    expect(facets.map((f) => f.label)).toContain('Energy markets');
    // Every chip finds at least one mentor.
    for (const f of facets) expect(withExpertise(mentors, f.label).length).toBe(f.n);
  });

  it('keep a chosen area that a search narrowed away, so it can be cleared', () => {
    const facets = expertiseFacets(mentors.slice(0, 1), 'Hardware');
    expect(facets.at(-1)).toEqual({ label: 'Hardware', n: 0 });
  });

  it('match the area as the card prints it, case aside', () => {
    expect(withExpertise(mentors, 'growth MARKETING').map((m) => m.name)).toEqual(['Ioanna']);
    expect(withExpertise(mentors, 'All')).toHaveLength(3);
  });

  it('stop at the limit', () => {
    const many = [{ expertise: Array.from({ length: 12 }, (_, i) => `Area ${i}`) }];
    expect(expertiseFacets(many, 'All', 8)).toHaveLength(8);
  });
});
