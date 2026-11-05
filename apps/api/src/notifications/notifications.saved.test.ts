import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsController } from './notifications.controller';
import { SetNotificationSavedDto } from './dto/set-notification-saved.dto';

/** Save keeps a notification for later; the Saved view lists those, and Delete all leaves them (docs §111). */

function setup(count = 1) {
  const savedAt = new Date('2026-11-05T09:00:00Z');
  const prisma = {
    notification: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'n1', type: 'message', title: 'Ada wrote', body: null, link: '/messages', meta: null, createdAt: savedAt, readAt: null, savedAt },
      ]),
      updateMany: vi.fn().mockResolvedValue({ count }),
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  };
  return { controller: new NotificationsController(prisma as never), prisma };
}

const me = { id: 'me' };

describe('saving a notification', () => {
  it('saves and unsaves the member’s own notification only, and answers with the new savedAt', async () => {
    const { controller, prisma } = setup();
    const saved = await controller.setSaved(me, 'n1', { saved: true });
    expect(saved.ok).toBe(true);
    expect(typeof saved.savedAt).toBe('string');
    expect(prisma.notification.updateMany).toHaveBeenLastCalledWith({ where: { id: 'n1', userId: 'me' }, data: { savedAt: expect.any(Date) } });
    await expect(controller.setSaved(me, 'n1', { saved: false })).resolves.toEqual({ ok: true, savedAt: null });
    expect(prisma.notification.updateMany).toHaveBeenLastCalledWith({ where: { id: 'n1', userId: 'me' }, data: { savedAt: null } });
  });

  it('is a 404 for a notification that is not the member’s', async () => {
    const { controller } = setup(0);
    await expect(controller.setSaved(me, 'someone-elses', { saved: true })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('takes a boolean and nothing else', () => {
    expect(validateSync(plainToInstance(SetNotificationSavedDto, { saved: true }))).toHaveLength(0);
    expect(validateSync(plainToInstance(SetNotificationSavedDto, { saved: 'yes' })).length).toBeGreaterThan(0);
    expect(validateSync(plainToInstance(SetNotificationSavedDto, {})).length).toBeGreaterThan(0);
  });

  it('lists the saved ones in the Saved view, with savedAt on every row', async () => {
    const { controller, prisma } = setup();
    const list = await controller.list(me, undefined, undefined, undefined, undefined, 'true');
    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'me', savedAt: { not: null } } }));
    expect(list.notifications[0].savedAt).toBe('2026-11-05T09:00:00.000Z');
    await controller.list(me);
    expect(prisma.notification.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: 'me' } }));
  });

  it('keeps the saved ones when the inbox is cleared, unless they are asked for too', async () => {
    const { controller, prisma } = setup();
    await controller.deleteAll(me);
    expect(prisma.notification.deleteMany).toHaveBeenLastCalledWith({ where: { userId: 'me', savedAt: null } });
    await controller.deleteAll(me, 'true');
    expect(prisma.notification.deleteMany).toHaveBeenLastCalledWith({ where: { userId: 'me' } });
  });
});
