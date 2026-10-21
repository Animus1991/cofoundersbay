import { describe, expect, it } from 'vitest';
import { industryFit, locationFit, matchFrictions, matchStrengths, skillsFit } from '@cofounderbay/shared';

describe('the comparison names what differs, so a page can say it in Greek', () => {
  const base = { sourceSkills: [] as string[], targetSkills: [] as string[], locationScore: 1 };

  it('keys each point and carries both sides’ values, the reader’s first', () => {
    const points = matchFrictions({
      ...base,
      sourceLocation: 'Athens, Greece',
      targetLocation: 'Berlin, Germany',
      locationScore: 0.3,
      sourcePayload: { stage: 'idea', commitment: 'full-time' },
      targetPayload: { stage: 'traction', commitment: 'part-time' },
    });
    expect(points.map((p) => [p.key, p.values])).toEqual([
      ['location', { mine: 'Athens, Greece', theirs: 'Berlin, Germany' }],
      ['stage', { mine: 'idea', theirs: 'traction' }],
      ['commitment', { mine: 'full-time', theirs: 'part-time' }],
    ]);
    // The English stays for readers that print it.
    expect(points[0].title).toBe('Location Difference');
  });

  it('raises a place only when the places are far apart', () => {
    const near = matchFrictions({ ...base, sourceLocation: 'Athens, Greece', targetLocation: 'Patras, Greece', locationScore: 0.7 });
    expect(near).toEqual([]);
    const same = matchFrictions({ ...base, sourceLocation: 'Athens, Greece', targetLocation: 'Athens, Greece', locationScore: 0.3 });
    expect(same).toEqual([]);
  });

  it('notes two technical profiles, and nothing for missing payloads', () => {
    const tech = matchFrictions({ ...base, sourceSkills: ['Software engineering'], targetSkills: ['Developer tools'] });
    expect(tech.map((p) => p.key)).toEqual(['tech_overlap']);
    expect(matchFrictions({ ...base, sourcePayload: null, targetPayload: { stage: 'mvp' } })).toEqual([]);
  });

  // Moved from the matching service's private methods to the shared package
  // so the demo computes with them too; the values are the service's own.
  it('scores places, skills and stages as the matching service did', () => {
    expect(locationFit('Athens, Greece', 'athens, greece')).toBe(1);
    expect(locationFit('Athens, Greece', 'Patras, Greece')).toBe(0.7);
    expect(locationFit('Athens, Greece', 'Berlin, Germany')).toBe(0.3);
    expect(locationFit(null, 'Berlin, Germany')).toBe(0.5);
    expect(skillsFit({ userKeys: [], candidateKeys: ['a'], userNames: [], candidateNames: ['x'] })).toBe(0.4);
    // One of three ids shared (0.7 × 1/3) and one complementary pair of five (0.3 × 1/5).
    expect(skillsFit({ userKeys: ['a', 'b'], candidateKeys: ['b', 'c'], userNames: ['technical lead'], candidateNames: ['business development'] }))
      .toBeCloseTo(0.7 / 3 + 0.3 / 5, 10);
    expect(industryFit(null, { stage: 'idea' })).toBe(0.5);
    expect(industryFit({ industry: 'SaaS', stage: 'idea' }, { industry: 'SaaS', stage: 'mvp' })).toBeCloseTo(0.5 + 0.3 + 0.13, 10);
    expect(industryFit({ stage: 'idea' }, { stage: 'scaling' })).toBe(0.5);
  });

  it('says which shared strengths are skills and which are themes', () => {
    expect(matchStrengths(['Product'], ['fintech', 'climate', 'b2b', 'ai'])).toEqual([
      { kind: 'skill', icon: 'terminal', label: 'Product' },
      { kind: 'theme', icon: 'lightbulb', label: 'Fintech' },
      { kind: 'theme', icon: 'lightbulb', label: 'Climate' },
      { kind: 'theme', icon: 'lightbulb', label: 'B2b' },
    ]);
  });
});
