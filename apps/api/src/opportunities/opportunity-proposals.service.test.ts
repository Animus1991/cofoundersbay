import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ZodError } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpportunityProposalsService, sendProposalSchema } from './opportunity-proposals.service';

/** A proposal on a listing: the owner answers, the sender withdraws, nobody else sees it (docs §111). */

const listing = { id: 'o1', title: 'CTO wanted', isActive: true, createdById: 'owner', deadline: null as Date | null };
const row = (over: Record<string, unknown> = {}) => ({
  id: 'p1', opportunityId: 'o1', fromId: 'sender', scope: 'I would build the first version.', timeframe: '3 months', compensation: 'Equity', status: 'pending',
  respondedAt: null, createdAt: new Date('2026-11-06T10:00:00Z'),
  opportunity: { title: 'CTO wanted', createdById: 'owner' },
  from: { role: 'cofounder', profile: { displayName: 'Ada', avatarUrl: null, headline: 'Engineer' } },
  ...over,
});
const input = { scope: 'I would build the first version.', timeframe: '3 months', compensation: 'Equity' };

function setup() {
  const prisma: Record<string, any> = {
    opportunity: { findUnique: vi.fn(async () => listing as unknown) },
    userBlock: { findFirst: vi.fn(async () => null as unknown) },
    opportunityProposal: {
      findUnique: vi.fn(async () => null as unknown),
      findMany: vi.fn(async () => [row()]),
      create: vi.fn(async () => row()),
      update: vi.fn(async ({ data }: any) => row(data)),
    },
  };
  const notifications = { createNotification: vi.fn(async () => undefined) };
  return { service: new OpportunityProposalsService(prisma as never, notifications as never), prisma, notifications };
}

let t: ReturnType<typeof setup>;
beforeEach(() => { t = setup(); });

describe('sending a proposal', () => {
  it('reaches the listing’s owner, with a way to it', async () => {
    const { proposal } = await t.service.send('sender', 'o1', input);
    expect(t.prisma.opportunityProposal.create.mock.calls[0][0].data).toMatchObject({ opportunityId: 'o1', fromId: 'sender', status: 'pending' });
    expect(proposal).toMatchObject({ opportunityTitle: 'CTO wanted', status: 'pending', from: { displayName: 'Ada' } });
    expect(t.notifications.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'owner', link: '/opportunities?tab=proposals' }));
  });

  it('is refused on the sender’s own listing, a closed one, or one that is gone', async () => {
    await expect(t.service.send('owner', 'o1', input)).rejects.toBeInstanceOf(BadRequestException);
    t.prisma.opportunity.findUnique.mockResolvedValueOnce({ ...listing, deadline: new Date('2020-01-01') });
    await expect(t.service.send('sender', 'o1', input)).rejects.toBeInstanceOf(BadRequestException);
    t.prisma.opportunity.findUnique.mockResolvedValueOnce({ ...listing, isActive: false });
    await expect(t.service.send('sender', 'o1', input)).rejects.toBeInstanceOf(NotFoundException);
    t.prisma.opportunity.findUnique.mockResolvedValueOnce(null);
    await expect(t.service.send('sender', 'o1', input)).rejects.toBeInstanceOf(NotFoundException);
    expect(t.prisma.opportunityProposal.create).not.toHaveBeenCalled();
  });

  it('is refused when either side blocked the other', async () => {
    t.prisma.userBlock.findFirst.mockResolvedValue({ id: 'b1' });
    await expect(t.service.send('sender', 'o1', input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(t.prisma.userBlock.findFirst.mock.calls[0][0].where.OR).toEqual([
      { blockerId: 'owner', blockedId: 'sender' },
      { blockerId: 'sender', blockedId: 'owner' },
    ]);
  });

  it('happens once per listing, unless the sender withdrew', async () => {
    t.prisma.opportunityProposal.findUnique.mockResolvedValueOnce({ id: 'p1', status: 'declined' });
    await expect(t.service.send('sender', 'o1', input)).rejects.toBeInstanceOf(ConflictException);
    t.prisma.opportunityProposal.findUnique.mockResolvedValueOnce({ id: 'p1', status: 'withdrawn' });
    await t.service.send('sender', 'o1', input);
    expect(t.prisma.opportunityProposal.update.mock.calls[0][0].data).toMatchObject({ status: 'pending', respondedAt: null });
  });

  it('asks for a real description', () => {
    expect(() => sendProposalSchema.parse({ scope: 'hi' })).toThrow(ZodError);
    expect(sendProposalSchema.parse({ scope: 'I would build the first version.', timeframe: ' ' })).toMatchObject({ timeframe: null, compensation: null });
  });
});

describe('answering a proposal', () => {
  beforeEach(() => { t.prisma.opportunityProposal.findUnique.mockResolvedValue(row()); });

  it('is the owner’s to accept or decline, and tells the sender', async () => {
    const { proposal } = await t.service.answer('owner', 'p1', 'accepted');
    expect(proposal.status).toBe('accepted');
    expect(t.prisma.opportunityProposal.update.mock.calls[0][0].data.respondedAt).toBeInstanceOf(Date);
    expect(t.notifications.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'sender', title: 'Your proposal for CTO wanted was accepted' }));
  });

  it('is the sender’s to withdraw, without telling anyone', async () => {
    await t.service.answer('sender', 'p1', 'withdrawn');
    expect(t.notifications.createNotification).not.toHaveBeenCalled();
    await expect(t.service.answer('owner', 'p1', 'withdrawn')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(t.service.answer('sender', 'p1', 'accepted')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not exist for anyone else', async () => {
    await expect(t.service.answer('stranger', 'p1', 'accepted')).rejects.toBeInstanceOf(NotFoundException);
    t.prisma.opportunityProposal.findUnique.mockResolvedValue(null);
    await expect(t.service.answer('owner', 'gone', 'accepted')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cannot be changed once given', async () => {
    t.prisma.opportunityProposal.findUnique.mockResolvedValue(row({ status: 'declined' }));
    await expect(t.service.answer('owner', 'p1', 'accepted')).rejects.toBeInstanceOf(ConflictException);
    expect(t.prisma.opportunityProposal.update).not.toHaveBeenCalled();
  });
});

describe('the two lists', () => {
  it('show the owner what came in, without withdrawn ones, and the sender what they sent', async () => {
    await t.service.incoming('owner');
    expect(t.prisma.opportunityProposal.findMany.mock.calls[0][0].where).toEqual({ opportunity: { createdById: 'owner' }, status: { not: 'withdrawn' } });
    await t.service.sent('sender');
    expect(t.prisma.opportunityProposal.findMany.mock.calls[1][0].where).toEqual({ fromId: 'sender' });
  });
});
