import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MatchingService } from './matching.service';
import { RestoreMatchFeedbackDto } from './dto/restore-feedback.dto';

/**
 * "Pass" on /matches can be taken back exactly: the feedback answers with
 * the outcome it replaced and the signal it wrote, and restore puts the one
 * back and deletes the other. Before, Undo brought the card back on screen
 * while the server kept the pass (prior 0.1, a -1 signal) for good.
 */

function setup(existing: { feedback: string; connectionStarted: boolean; conversationStarted: boolean } | null) {
  const prisma = {
    matchOutcome: {
      findUnique: vi.fn().mockResolvedValue(existing),
      upsert: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    userBehaviorSignal: {
      create: vi.fn().mockResolvedValue({ id: 'sig-1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const cache = { invalidateByTag: vi.fn().mockResolvedValue(undefined), del: vi.fn().mockResolvedValue(undefined) };
  return { service: new MatchingService(prisma as never, cache as never), prisma, cache };
}

describe('match feedback and its undo', () => {
  it('answers a first pass with no previous outcome and the signal it wrote', async () => {
    const { service, prisma } = setup(null);
    await expect(service.recordFeedback({ sourceUserId: 'me', targetUserId: 'elena', feedback: 'declined' }))
      .resolves.toEqual({ previous: null, signalId: 'sig-1' });
    expect(prisma.userBehaviorSignal.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'me', signalType: 'match_feedback', targetId: 'elena', value: -1 }),
    }));
  });

  it('answers with what it replaced when there was an outcome already', async () => {
    const before = { feedback: 'accepted', connectionStarted: true, conversationStarted: false };
    const { service } = setup(before);
    await expect(service.recordFeedback({ sourceUserId: 'me', targetUserId: 'elena', feedback: 'declined' }))
      .resolves.toEqual({ previous: before, signalId: 'sig-1' });
  });

  it('removes the outcome a first pass created, and its signal, for the member only', async () => {
    const { service, prisma, cache } = setup(null);
    await service.restoreFeedback({ sourceUserId: 'me', targetUserId: 'elena', previous: null, signalId: 'sig-1' });
    expect(prisma.matchOutcome.deleteMany).toHaveBeenCalledWith({ where: { sourceUserId: 'me', targetUserId: 'elena' } });
    expect(prisma.matchOutcome.upsert).not.toHaveBeenCalled();
    expect(prisma.userBehaviorSignal.deleteMany).toHaveBeenCalledWith({
      where: { id: 'sig-1', userId: 'me', signalType: 'match_feedback', targetId: 'elena' },
    });
    expect(cache.invalidateByTag).toHaveBeenCalledWith('matches:v2:me');
  });

  it('puts the earlier outcome back when there was one', async () => {
    const before = { feedback: 'accepted', connectionStarted: true, conversationStarted: false };
    const { service, prisma } = setup(before);
    await service.restoreFeedback({ sourceUserId: 'me', targetUserId: 'elena', previous: before });
    expect(prisma.matchOutcome.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: { feedback: 'accepted', connectionStarted: true, conversationStarted: false },
    }));
    expect(prisma.matchOutcome.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userBehaviorSignal.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses a restore body that is not an outcome it could have answered', () => {
    const errors = (body: unknown) => validateSync(plainToInstance(RestoreMatchFeedbackDto, body)).length;
    expect(errors({ targetUserId: 'elena' })).toBe(0);
    expect(errors({ targetUserId: 'elena', previous: null, signalId: 'sig-1' })).toBe(0);
    expect(errors({ targetUserId: 'elena', previous: { feedback: 'accepted', connectionStarted: true, conversationStarted: false } })).toBe(0);
    expect(errors({ targetUserId: 'elena', previous: { feedback: 'adored', connectionStarted: true, conversationStarted: false } })).toBeGreaterThan(0);
    expect(errors({ targetUserId: 'elena', previous: { feedback: 'accepted' } })).toBeGreaterThan(0);
    expect(errors({})).toBeGreaterThan(0);
  });
});
