import { describe, expect, it, vi } from 'vitest';
import { MatchingService } from './matching.service';

/*
 * `getPotentialMatches` (docs §124) picks the people recommendations can
 * name: verified, unmoderated - and since the first-page cohort, only
 * accounts that finished onboarding. An account that never answered the
 * questions (a one-letter name, no profile) is not someone's first match.
 */
describe('MatchingService.getPotentialMatches', () => {
  it('asks for verified, unmoderated people who finished onboarding', async () => {
    const founder = { id: 'a', role: 'founder', profile: { skills: [], location: 'Athens' } };
    const prisma: any = {
      user: {
        findUnique: vi.fn(async () => founder),
        findMany: vi.fn(async () => []),
      },
    };
    const cache: any = { getOrSet: (_key: string, fn: () => Promise<unknown>) => fn() };
    const openTo: any = { activeSignals: vi.fn(async () => []) };
    const service = new MatchingService(prisma, cache, openTo);
    const s = service as any;
    vi.spyOn(s, 'getActiveWeights').mockResolvedValue({ role: 0.35, skills: 0.22, location: 0.12, industry: 0.11, semantic: 0.1, behavioral: 0.06, outcomePrior: 0.04 });
    vi.spyOn(s, 'getOutcomePriorMap').mockResolvedValue(new Map());
    vi.spyOn(s, 'getBehavioralMap').mockResolvedValue(new Map());
    vi.spyOn(s, 'getOrBuildFeatureVector').mockResolvedValue({ keywords: [] });
    vi.spyOn(s, 'applyOpenTo').mockResolvedValue(undefined);
    vi.spyOn(s, 'logInferences').mockResolvedValue(undefined);

    await service.getRecommendations('a', 5);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          moderationStatus: 'active',
          emailVerified: true,
          hasCompletedOnboarding: true,
        }),
      }),
    );
  });
});
