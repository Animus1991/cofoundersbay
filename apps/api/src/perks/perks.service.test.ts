import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { perkFit, perkIsOpen, rankPerksForStage, readPerkInput } from '@cofounderbay/shared';
import { PerksService } from './perks.service';

const NOW = new Date('2026-10-12T10:00:00Z').getTime();

function perk(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    partner: `Partner ${id}`,
    title: `Offer ${id}`,
    titleEl: null,
    summary: 'Summary',
    summaryEl: null,
    value: '$1,000 in credits',
    valueEl: null,
    category: 'cloud',
    stages: [] as string[],
    howToRedeem: 'Use the code at checkout',
    howToRedeemEl: null,
    terms: null,
    termsEl: null,
    code: `CODE-${id}`,
    redeemUrl: 'https://partner.example/deal',
    expiresAt: null as Date | null,
    active: true,
    createdAt: new Date(NOW - Number(id.replace(/\D/g, '') || 0) * 1000),
    ...over,
  };
}

function setup(initial = [perk('p1'), perk('p2', { stages: ['idea'] }), perk('p3', { active: false })]) {
  const perks = initial.map((p) => ({ ...p }));
  const claims: Array<{ perkId: string; userId: string; createdAt: Date }> = [];
  const withCount = (p: (typeof perks)[number]) => ({ ...p, _count: { claims: claims.filter((c) => c.perkId === p.id).length } });
  const prisma = {
    perk: {
      findMany: vi.fn(async ({ where }: any = {}) =>
        perks
          .filter((p) => (where?.active === undefined || p.active === where.active) && (!where?.category || p.category === where.category))
          .filter((p) => !where?.OR || p.expiresAt === null || p.expiresAt.getTime() > Date.now())
          .map(withCount),
      ),
      findUnique: vi.fn(async ({ where }: any) => {
        const p = perks.find((x) => x.id === where.id);
        return p ? withCount(p) : null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const row = { ...perk(`p${perks.length + 1}`), ...data };
        perks.push(row);
        return withCount(row);
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const p = perks.find((x) => x.id === where.id)!;
        Object.assign(p, data);
        return withCount(p);
      }),
    },
    perkClaim: {
      findMany: vi.fn(async ({ where, select }: any) => {
        const mine = claims.filter((c) => c.userId === where.userId);
        if (select?.perk) return mine.map((c) => ({ createdAt: c.createdAt, perk: withCount(perks.find((p) => p.id === c.perkId)!) }));
        return mine;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const k = where.perkId_userId;
        return claims.find((c) => c.perkId === k.perkId && c.userId === k.userId) ?? null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const row = { ...data, createdAt: new Date(NOW) };
        claims.push(row);
        return row;
      }),
    },
  };
  return { service: new PerksService(prisma as never), prisma, perks, claims };
}

describe('perk rules', () => {
  it('is open only while switched on and before its end', () => {
    expect(perkIsOpen({ active: true, expiresAt: null }, NOW)).toBe(true);
    expect(perkIsOpen({ active: false, expiresAt: null }, NOW)).toBe(false);
    expect(perkIsOpen({ active: true, expiresAt: new Date(NOW - 1).toISOString() }, NOW)).toBe(false);
    expect(perkIsOpen({ active: true, expiresAt: new Date(NOW + 60_000) }, NOW)).toBe(true);
  });

  it('ranks the perks named for a stage first and hides none', () => {
    const list = [{ id: 'a', stages: ['scaling'] }, { id: 'b', stages: [] }, { id: 'c', stages: ['idea', 'building'] }];
    expect(rankPerksForStage(list, 'idea').map((p) => p.id)).toEqual(['c', 'b', 'a']);
    expect(rankPerksForStage(list, null).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(perkFit({ stages: [] }, 'idea')).toBe('any');
    expect(perkFit({ stages: ['scaling'] }, 'idea')).toBe('other');
  });

  it('reads an admin’s perk: https links only, a code or a link, a real end date, known stages', () => {
    const base = { partner: 'Northwind Cloud', title: 'Credits', summary: 'For early teams', value: '$5,000', category: 'cloud', howToRedeem: 'Apply' };
    expect(readPerkInput({ ...base, code: 'X' })).toMatchObject({ ok: true, value: { active: true, stages: [] } });
    expect(readPerkInput({ ...base })).toEqual({ ok: false, error: 'A perk needs a code or a redeem link' });
    expect(readPerkInput({ ...base, redeemUrl: 'http://plain.example' })).toMatchObject({ ok: false });
    expect(readPerkInput({ ...base, code: 'X', category: 'snacks' })).toMatchObject({ ok: false });
    expect(readPerkInput({ ...base, code: 'X', expiresAt: 'soon' })).toMatchObject({ ok: false });
    expect(readPerkInput({ ...base, code: 'X', stages: ['idea', 'idea', 'moon'] })).toMatchObject({ ok: true, value: { stages: ['idea'] } });
    expect(readPerkInput({ ...base, code: 'X', title: 'x'.repeat(121) })).toMatchObject({ ok: false });
  });
});

describe('perks service', () => {
  it('lists open perks without their codes until claimed, the reader’s stage first', async () => {
    const { service } = setup();
    const { perks } = await service.list('u1', { stage: 'idea' });
    expect(perks.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(perks.every((p) => p.code === null && p.redeemUrl === null && !p.claimed)).toBe(true);
    await expect(service.list('u1', { category: 'snacks' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('claims once, reveals the code to the claimer only, and counts without naming', async () => {
    const { service, prisma } = setup();
    const first = await service.claim('u1', 'p1');
    expect(first.perk).toMatchObject({ claimed: true, code: 'CODE-p1', claimCount: 1 });
    await service.claim('u1', 'p1');
    expect(prisma.perkClaim.create).toHaveBeenCalledTimes(1);
    const other = (await service.list('u2', {})).perks.find((p) => p.id === 'p1')!;
    expect(other).toMatchObject({ claimed: false, code: null, claimCount: 1 });
    expect(JSON.stringify(other)).not.toContain('u1');
  });

  it('refuses a perk that is off or unknown, and keeps a claim after the perk is switched off', async () => {
    const { service } = setup();
    await expect(service.claim('u1', 'p3')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.claim('u1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
    await service.claim('u1', 'p1');
    await service.update('p1', { active: false });
    expect((await service.list('u1', {})).perks.map((p) => p.id)).not.toContain('p1');
    expect((await service.claimed('u1')).perks).toMatchObject([{ id: 'p1', code: 'CODE-p1', active: false }]);
    // Claiming again answers with the kept claim even though it is off now.
    expect((await service.claim('u1', 'p1')).perk.code).toBe('CODE-p1');
  });

  it('lets an admin create and edit a perk through the same reader', async () => {
    const { service } = setup();
    await expect(service.create('admin', { partner: 'X' })).rejects.toBeInstanceOf(BadRequestException);
    const { perk: created } = await service.create('admin', {
      partner: 'Lumen Legal', title: 'Incorporation at cost', summary: 'Fixed fee', value: '30% off', category: 'legal', howToRedeem: 'Book a call', redeemUrl: 'https://lumen.example',
    });
    expect(created).toMatchObject({ partner: 'Lumen Legal', redeemUrl: 'https://lumen.example', active: true });
    const all = await service.adminList();
    expect(all.perks.find((p) => p.id === 'p1')?.code).toBe('CODE-p1');
  });
});
