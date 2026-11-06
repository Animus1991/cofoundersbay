import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ZodError } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PORTFOLIO_LIMIT, PortfolioService, portfolioItemSchema } from './portfolio.service';

/** A member's own work on their profile, seen as the profile is seen (docs §111). */

const item = { id: 'i1', userId: 'me', type: 'project', title: 'Harbor', description: null, url: null, createdAt: new Date('2026-11-06T10:00:00Z') };

function setup() {
  const prisma: Record<string, any> = {
    profile: { findUnique: vi.fn(async () => ({ visibilityRules: null }) as unknown) },
    profilePortfolioItem: {
      findMany: vi.fn(async () => [item]),
      count: vi.fn(async () => 0),
      create: vi.fn(async () => item),
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
  };
  return { service: new PortfolioService(prisma as never), prisma };
}

let t: ReturnType<typeof setup>;
beforeEach(() => { t = setup(); });

describe('the portfolio', () => {
  it('adds an item for the member and answers with the list', async () => {
    const out = await t.service.add('me', portfolioItemSchema.parse({ title: ' Harbor ', url: 'https://harbor.example' }));
    expect(t.prisma.profilePortfolioItem.create.mock.calls[0][0].data).toMatchObject({ userId: 'me', title: 'Harbor', type: 'project', url: 'https://harbor.example' });
    expect(out.items[0]).toMatchObject({ id: 'i1', title: 'Harbor' });
  });

  it('stops at the limit', async () => {
    t.prisma.profilePortfolioItem.count.mockResolvedValue(PORTFOLIO_LIMIT);
    await expect(t.service.add('me', portfolioItemSchema.parse({ title: 'x' }))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('changes and removes the member’s own items only', async () => {
    await t.service.update('me', 'i1', { title: 'New' });
    expect(t.prisma.profilePortfolioItem.updateMany.mock.calls[0][0].where).toEqual({ id: 'i1', userId: 'me' });
    t.prisma.profilePortfolioItem.updateMany.mockResolvedValue({ count: 0 });
    t.prisma.profilePortfolioItem.deleteMany.mockResolvedValue({ count: 0 });
    await expect(t.service.update('me', 'theirs', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(t.service.remove('me', 'theirs')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('is seen as the profile is: not at all without a session on a members-only one', async () => {
    await expect(t.service.ofMember('them')).resolves.toMatchObject({ items: [{ id: 'i1' }] });
    t.prisma.profile.findUnique.mockResolvedValue({ visibilityRules: { profile: 'members' } });
    await expect(t.service.ofMember('them')).rejects.toBeInstanceOf(NotFoundException);
    await expect(t.service.ofMember('them', 'a-member')).resolves.toMatchObject({ items: [{ id: 'i1' }] });
    t.prisma.profile.findUnique.mockResolvedValue(null);
    await expect(t.service.ofMember('nobody', 'a-member')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('takes a web address and nothing that could run', () => {
    expect(() => portfolioItemSchema.parse({ title: 'x', url: 'javascript:alert(1)' })).toThrow(ZodError);
    expect(() => portfolioItemSchema.parse({ title: 'x', url: 'ftp://x.test/a' })).toThrow(ZodError);
    expect(() => portfolioItemSchema.parse({ title: '' })).toThrow(ZodError);
    expect(portfolioItemSchema.parse({ title: 'x', url: '' }).url).toBeNull();
  });
});
