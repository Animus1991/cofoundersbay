import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';

const step = (id: string, done: boolean) => ({ id, text: `Step ${id}`, done });
const row = {
  id: 'm1', ownerId: 'u1', collaboratorId: null, collaborator: null, title: 'Ship', description: null, status: 'todo', priority: 'medium',
  category: null, dueDate: null, completedAt: null, progress: 0, notes: null, checklist: [], createdAt: new Date(), updatedAt: new Date(),
};

describe('milestone steps', () => {
  const prisma = { milestone: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() } };
  const service = new MilestonesService(prisma as never);
  const controller = new MilestonesController(service);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.milestone.findUnique.mockResolvedValue({ ownerId: 'u1', collaboratorId: null, status: 'todo' });
    prisma.milestone.update.mockImplementation(async ({ data }) => ({ ...row, ...data }));
    prisma.milestone.create.mockImplementation(async ({ data }) => ({ ...row, ...data }));
  });

  it('moves the progress bar with what is ticked', async () => {
    const saved = await service.update('m1', 'u1', { checklist: [step('a', true), step('b', false), step('c', false), step('d', false)] });
    expect(prisma.milestone.update.mock.calls[0][0].data.progress).toBe(25);
    expect(saved.progress).toBe(25);
    expect(saved.checklist).toHaveLength(4);
  });

  it('leaves the figure alone when the last step is removed', async () => {
    await service.update('m1', 'u1', { checklist: [] });
    const { data } = prisma.milestone.update.mock.calls[0][0];
    expect(data.checklist).toEqual([]);
    expect(data.progress).toBeUndefined();
  });

  it('keeps a finished milestone at 100 when a step is unticked', async () => {
    prisma.milestone.findUnique.mockResolvedValue({ ownerId: 'u1', collaboratorId: null, status: 'completed' });
    await service.update('m1', 'u1', { checklist: [step('a', false)] });
    expect(prisma.milestone.update.mock.calls[0][0].data.progress).toBeUndefined();
  });

  it('lets finishing win over the steps in the same save', async () => {
    await service.update('m1', 'u1', { status: 'completed', checklist: [step('a', false), step('b', false)] });
    expect(prisma.milestone.update.mock.calls[0][0].data.progress).toBe(100);
  });

  it('takes steps when a milestone is created', async () => {
    const saved = await service.create('u1', { title: 'Ship', checklist: [step('a', true), step('b', false)] });
    expect(saved.progress).toBe(50);
  });

  it('answers an empty list for a milestone from before steps', async () => {
    prisma.milestone.update.mockResolvedValue({ ...row, checklist: null });
    expect((await service.update('m1', 'u1', { title: 'Renamed' })).checklist).toEqual([]);
  });

  it('refuses what is not a list of steps, before it reaches the service', async () => {
    await expect(controller.update({ id: 'u1' }, 'm1', { checklist: 'nope' as never })).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.create({ id: 'u1' }, { title: 'Ship', checklist: [{ id: 'a' }] as never })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.milestone.update).not.toHaveBeenCalled();
    expect(prisma.milestone.create).not.toHaveBeenCalled();
  });

  it('still lets only the two people on it change the steps', async () => {
    await expect(service.update('m1', 'someone-else', { checklist: [] })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
