import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { cohortMatchPairs } from '@cofounderbay/shared';
import { OrgService } from './org.service';

/*
 * A cohort-wide match run (docs §102): only the people who run the
 * organisation start one; it scores the pairs a programme introduces with
 * the engine and keeps the suggestions worth it, rescoring - never
 * resetting - the ones already there.
 */

type Row = Record<string, any>;

function setup(opts: { staff?: boolean; members?: Row[]; suggestions?: Row[]; scores?: Record<string, number>; organizer?: string } = {}) {
  const suggestions: Row[] = opts.suggestions ?? [];
  const members = opts.members ?? [
    { userId: 'f1', role: 'participant', user: { role: 'founder', moderationStatus: 'active' } },
    { userId: 'f2', role: 'participant', user: { role: 'founder', moderationStatus: 'active' } },
    { userId: 'm1', role: 'mentor', user: { role: 'founder', moderationStatus: 'active' } },
    { userId: 'i1', role: 'participant', user: { role: 'investor', moderationStatus: 'active' } },
  ];
  const prisma: any = {
    user: {
      findFirst: vi.fn(async () => ({ id: 'org-user' })),
      findUnique: vi.fn(async ({ where }: any) => ({ role: where.id === 'platform-admin' ? 'admin' : 'founder' })),
    },
    organizationMembership: {
      findFirst: vi.fn(async ({ where }: any) => (opts.staff !== false && where.userId === 'manager' ? { id: 'om1' } : null)),
    },
    cohort: { findUnique: vi.fn(async () => ({ id: 'c1', organizerId: opts.organizer ?? 'org-user' })) },
    cohortMember: { findMany: vi.fn(async () => members) },
    matchSuggestion: {
      findFirst: vi.fn(async ({ where }: any) => suggestions.find((s) => where.OR.some((o: any) => o.sourceUserId === s.sourceUserId && o.targetUserId === s.targetUserId)) ?? null),
      update: vi.fn(async ({ where, data }: any) => Object.assign(suggestions.find((s) => s.id === where.id)!, data)),
      create: vi.fn(async ({ data }: any) => { suggestions.push({ id: `s${suggestions.length}`, status: 'pending', ...data }); return data; }),
    },
  };
  const scores = opts.scores ?? {};
  const matching: any = {
    scorePairs: vi.fn(async (source: string, targets: string[]) => targets.map((t) => ({ userId: t, score: scores[`${source}>${t}`] ?? 0.5, confidence: 0.6, reasons: [`${source}->${t}`] }))),
  };
  return { service: new OrgService(prisma, matching), prisma, matching, suggestions };
}

describe('the pairs a cohort run scores', () => {
  it('founders with each other once, and each founder with each mentor and investor', () => {
    const pairs = cohortMatchPairs([
      { userId: 'f2', role: 'founder' },
      { userId: 'f1', role: 'founder' },
      { userId: 'm1', role: 'mentor' },
      { userId: 'm2', role: 'mentor' },
      { userId: 'i1', role: 'investor' },
      { userId: 'f1', role: 'founder' },
    ]);
    expect(pairs.map((p) => `${p.source}-${p.target}:${p.kind}`)).toEqual([
      'f1-f2:founders',
      'f1-m1:founder_mentor', 'f1-m2:founder_mentor', 'f1-i1:founder_investor',
      'f2-m1:founder_mentor', 'f2-m2:founder_mentor', 'f2-i1:founder_investor',
    ]);
  });
});

describe('OrgService.runCohortMatching', () => {
  it('only the people who run the organisation start one', async () => {
    const { service } = setup({ staff: false });
    await expect(service.runCohortMatching('aegean-lab', 'c1', 'someone')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(setup().service.runCohortMatching('aegean-lab', 'c1', 'manager')).resolves.toMatchObject({ scored: 5 });
    await expect(setup().service.runCohortMatching('aegean-lab', 'c1', 'org-user')).resolves.toMatchObject({ scored: 5 });
    await expect(setup().service.runCohortMatching('aegean-lab', 'c1', 'platform-admin')).resolves.toMatchObject({ scored: 5 });
  });

  it("refuses another organisation's cohort and a cohort with no founder", async () => {
    await expect(setup({ organizer: 'someone-else' }).service.runCohortMatching('aegean-lab', 'c1', 'manager')).rejects.toBeInstanceOf(NotFoundException);
    const noFounders = setup({ members: [{ userId: 'm1', role: 'mentor', user: { role: 'mentor', moderationStatus: 'active' } }] });
    await expect(noFounders.service.runCohortMatching('aegean-lab', 'c1', 'manager')).rejects.toMatchObject({ response: { error: { details: { problem: 'no_founders' } } } });
  });

  it('averages two founders from both sides, keeps a new pair only from the threshold up', async () => {
    const { service, suggestions } = setup({ scores: { 'f1>f2': 0.9, 'f2>f1': 0.7, 'f1>i1': 0.2, 'f2>i1': 0.2 } });
    const out = await service.runCohortMatching('aegean-lab', 'c1', 'manager');
    expect(out).toMatchObject({ scored: 5, created: 3, updated: 0, belowThreshold: 2 });
    const founders = suggestions.find((s) => s.sourceUserId === 'f1' && s.targetUserId === 'f2');
    expect(founders).toMatchObject({ overallScore: 80, algorithmVersion: 'cohort-v1' });
    expect(founders!.reasons).toEqual(['f1->f2', 'f2->f1']);
    expect(suggestions.some((s) => s.targetUserId === 'i1')).toBe(false);
  });

  it('rescores a suggestion already there, in either direction, and keeps its status', async () => {
    const { service, suggestions } = setup({
      scores: { 'f1>i1': 0.1 },
      suggestions: [{ id: 'old', sourceUserId: 'i1', targetUserId: 'f1', overallScore: 70, status: 'connected', reasons: [] }],
    });
    const out = await service.runCohortMatching('aegean-lab', 'c1', 'manager');
    expect(out.updated).toBe(1);
    expect(suggestions.find((s) => s.id === 'old')).toMatchObject({ overallScore: 10, status: 'connected' });
  });

  it('skips suspended members', async () => {
    const { service, matching } = setup({
      members: [
        { userId: 'f1', role: 'participant', user: { role: 'founder', moderationStatus: 'active' } },
        { userId: 'f2', role: 'participant', user: { role: 'founder', moderationStatus: 'suspended' } },
        { userId: 'm1', role: 'mentor', user: { role: 'mentor', moderationStatus: 'active' } },
      ],
    });
    const out = await service.runCohortMatching('aegean-lab', 'c1', 'manager');
    expect(out.scored).toBe(1);
    expect(matching.scorePairs).toHaveBeenCalledWith('f1', ['m1']);
  });
});
