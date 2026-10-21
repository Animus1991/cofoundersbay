import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { NotificationsController } from './notifications.controller';
import { MarkNotificationsUnreadDto, MARK_UNREAD_MAX_IDS } from './dto/mark-notifications-unread.dto';

/**
 * "Mark all read" can be taken back: it answers with the ids it marked, and
 * mark-unread makes exactly those unread again, for the member's own rows.
 */

function setup(unreadIds: string[]) {
  const prisma = {
    notification: {
      findMany: vi.fn().mockResolvedValue(unreadIds.map((id) => ({ id }))),
      updateMany: vi.fn().mockResolvedValue({ count: unreadIds.length }),
    },
  };
  return { controller: new NotificationsController(prisma as never), prisma };
}

const me = { id: 'me' };

describe('mark all read, and its undo', () => {
  it('answers with the ids it marked, and marks only those', async () => {
    const { controller, prisma } = setup(['n1', 'n2']);
    await expect(controller.markAllRead(me)).resolves.toEqual({ ok: true, ids: ['n1', 'n2'] });
    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'me', readAt: null } }));
    const write = prisma.notification.updateMany.mock.calls[0][0];
    expect(write.where).toEqual({ userId: 'me', id: { in: ['n1', 'n2'] }, readAt: null });
    expect(write.data.readAt).toBeInstanceOf(Date);
  });

  it('writes nothing when nothing is unread', async () => {
    const { controller, prisma } = setup([]);
    await expect(controller.markAllRead(me)).resolves.toEqual({ ok: true, ids: [] });
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it('makes the named ones unread again, the member’s own and read ones only', async () => {
    const { controller, prisma } = setup(['n1']);
    await expect(controller.markUnread(me, { ids: ['n1', 'n2'] })).resolves.toEqual({ ok: true, count: 1 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'me', id: { in: ['n1', 'n2'] }, readAt: { not: null } },
      data: { readAt: null },
    });
  });

  it('marks only the named ones read, the member’s own unread ones, and answers with them', async () => {
    const { controller, prisma } = setup(['n2']);
    await expect(controller.markSomeRead(me, { ids: ['n1', 'n2'] })).resolves.toEqual({ ok: true, ids: ['n2'] });
    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'me', id: { in: ['n1', 'n2'] }, readAt: null } }));
    const write = prisma.notification.updateMany.mock.calls[0][0];
    expect(write.where).toEqual({ userId: 'me', id: { in: ['n2'] }, readAt: null });
  });

  it('refuses a body that is not a short list of ids', () => {
    const errors = (body: unknown) => validateSync(plainToInstance(MarkNotificationsUnreadDto, body)).length;
    expect(errors({ ids: ['n1'] })).toBe(0);
    expect(errors({ ids: [] })).toBeGreaterThan(0);
    expect(errors({ ids: 'n1' })).toBeGreaterThan(0);
    expect(errors({ ids: [1, 2] })).toBeGreaterThan(0);
    expect(errors({ ids: Array.from({ length: MARK_UNREAD_MAX_IDS + 1 }, (_, i) => `n${i}`) })).toBeGreaterThan(0);
  });
});
