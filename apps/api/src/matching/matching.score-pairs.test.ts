import { describe, expect, it, vi } from 'vitest';
import { MatchingService } from './matching.service';

/*
 * `scorePairs` (docs §102) scores one person against named others with the
 * engine's own score, for a cohort run: no cache, no "Open to" lift (the
 * reader is the programme), suspended people left out.
 */
describe('MatchingService.scorePairs', () => {
  it('scores the named, active people with the engine and nothing else', async () => {
    const findMany = vi.fn(async () => [
      { id: 'b', role: 'founder', profile: { skills: [], location: 'Athens' } },
    ]);
    const prisma: any = {
      user: { findUnique: vi.fn(async () => ({ id: 'a', role: 'founder', profile: { skills: [], location: 'Athens' } })), findMany },
    };
    const cache: any = { getOrSet: vi.fn() };
    const openTo: any = { activeSignals: vi.fn(), isVerified: vi.fn() };
    const service = new MatchingService(prisma, cache, openTo);
    const s = service as any;
    vi.spyOn(s, 'getActiveWeights').mockResolvedValue({ role: 0.35, skills: 0.22, location: 0.12, industry: 0.11, semantic: 0.1, behavioral: 0.06, outcomePrior: 0.04 });
    vi.spyOn(s, 'getOutcomePriorMap').mockResolvedValue(new Map());
    vi.spyOn(s, 'getBehavioralMap').mockResolvedValue(new Map());
    vi.spyOn(s, 'getOrBuildFeatureVector').mockResolvedValue({ keywords: [] });

    const out = await service.scorePairs('a', ['b', 'c']);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['b', 'c'] }, moderationStatus: 'active' } }));
    expect(out).toHaveLength(1);
    expect(out[0].userId).toBe('b');
    expect(out[0].score).toBeGreaterThan(0);
    expect(out[0].score).toBeLessThanOrEqual(1);
    // The pair's one number (docs §106): the score /matches shows, with its
    // reasons. Two founders in Athens, no skills: role 25 and place 5.
    expect(out[0].score).toBe(0.3);
    expect(out[0].reasons).toEqual(['Cofounder match', 'Same or nearby location']);
    expect(cache.getOrSet).not.toHaveBeenCalled();
    expect(openTo.activeSignals).not.toHaveBeenCalled();
  });

  it('answers nothing for no one', async () => {
    const service = new MatchingService({} as any, {} as any);
    await expect(service.scorePairs('a', [])).resolves.toEqual([]);
  });

  it('answers the detailed comparison with the same number the list shows', async () => {
    const users: Record<string, any> = {
      a: { id: 'a', role: 'founder', email: 'a@x.y', profile: { displayName: 'A', skills: [{ skill: { name: 'Product', category: 'business' } }], location: 'Athens, Greece' } },
      b: { id: 'b', role: 'founder', email: 'b@x.y', profile: { displayName: 'B', skills: [{ skill: { name: 'TypeScript', category: 'technical' } }], location: 'Berlin, Germany' } },
    };
    const prisma: any = {
      user: { findUnique: vi.fn(async ({ where }: any) => users[where.id] ?? null) },
      userPreference: { findMany: vi.fn(async () => []) },
    };
    const service = new MatchingService(prisma, { getOrSet: vi.fn() } as any);
    const s = service as any;
    vi.spyOn(s, 'getActiveWeights').mockResolvedValue({ role: 0.35, skills: 0.22, location: 0.12, industry: 0.11, semantic: 0.1, behavioral: 0.06, outcomePrior: 0.04 });
    vi.spyOn(s, 'getOutcomePriorMap').mockResolvedValue(new Map());
    vi.spyOn(s, 'getBehavioralMap').mockResolvedValue(new Map());
    vi.spyOn(s, 'getOrBuildFeatureVector').mockResolvedValue({ keywords: [] });

    const vs = await service.getDetailedVs('a', 'b');
    // Role 25, and TypeScript completes Product (a new family): 15.
    expect(vs.overall.score).toBe(40);
    expect(vs.reasons).toEqual(['Cofounder match', 'Complementary skills']);
    // The skills axis no longer reads 0% for a partner who completes the reader.
    expect(vs.breakdown.find((a: { key: string }) => a.key === 'skills')?.score).toBe(60);
  });
});
