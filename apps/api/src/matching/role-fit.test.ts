import { describe, expect, it, vi } from 'vitest';
import { candidateRoleFor, roleFit, seekerWants } from '@cofounderbay/shared';
import { MatchingService } from './matching.service';

describe('a founder is matched with the people they are looking for', () => {
  it('draws a founder\'s candidates from every role, and the others from founders as before', () => {
    expect(candidateRoleFor('founder')).toBeUndefined();
    expect(candidateRoleFor('mentor')).toBe('founder');
    expect(candidateRoleFor('investor')).toBe('founder');
  });

  it('scores another founder highest for a founder who said nothing, then advisors', () => {
    const wants = seekerWants([], 'founder');
    expect(roleFit('founder', 'founder', wants)).toBe(0.9);
    expect(roleFit('founder', 'mentor', wants)).toBe(0.8);
    expect(roleFit('founder', 'investor', wants)).toBe(0.5);
  });

  it('reads profile "Looking for" values: a CTO is someone to build with, an angel is an investor', () => {
    expect(seekerWants(['CTO', 'Designer'], 'founder')).toEqual(['cofounder']);
    expect(roleFit('founder', 'investor', seekerWants(['Angel'], 'founder'))).toBe(0.9);
    expect(roleFit('founder', 'founder', seekerWants(['Angel'], 'founder'))).toBe(0.5);
  });

  it('keeps the other roles\' fit unchanged', () => {
    expect(roleFit('mentor', 'founder', [])).toBe(0.9);
    expect(roleFit('investor', 'org', [])).toBe(0.9);
    expect(roleFit('unknown', 'founder', [])).toBe(0.5);
  });

  it('no longer filters a founder\'s candidate pool to mentors', async () => {
    const findMany = vi.fn(async () => []);
    const service = new MatchingService({ user: { findMany } } as any, {} as any);
    await (service as any).getPotentialMatches({ userId: 'u1', role: (service as any).getComplementaryRole('founder'), remote: true });
    const where = (findMany.mock.calls[0] as any[])[0].where;
    expect(where.role).toBeUndefined();
  });

  it('scores role fit from the profile\'s rolesSought', () => {
    const service = new MatchingService({} as any, {} as any);
    const founderSeekingAngel = { role: 'founder', profile: { rolePayload: { rolesSought: ['Angel'] } } };
    expect((service as any).calculateRoleCompatibility(founderSeekingAngel, 'investor')).toBe(0.9);
    expect((service as any).calculateRoleCompatibility({ role: 'founder', profile: {} }, 'founder')).toBe(0.9);
  });
});
