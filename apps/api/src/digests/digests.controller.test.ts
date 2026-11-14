import { describe, expect, it, vi } from 'vitest';
import { DIGEST_TOPICS } from '@cofounderbay/shared';
import { DigestsController } from './digests.controller';

function makeController(rows: { category: string; isEnabled: boolean }[] = [], frequency: string | null = null) {
  const prisma = {
    activityDigestPreference: {
      findUnique: vi.fn().mockResolvedValue(frequency ? { frequency } : null),
      upsert: vi.fn((args: unknown) => ({ op: 'digest', args })),
    },
    userNotificationChannel: {
      findMany: vi.fn().mockResolvedValue(rows),
      upsert: vi.fn((args: unknown) => ({ op: 'channel', args })),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  };
  const controller = new DigestsController({} as never, prisma as never);
  return { controller, prisma };
}

describe('GET /digests/preferences', () => {
  it('reports every topic on with no stored row, as the digest job sends them', async () => {
    const { controller, prisma } = makeController();
    const { preferences } = await controller.getDigestPreferences({ id: 'u1' });
    for (const topic of DIGEST_TOPICS) expect(preferences[topic]).toBe(true);
    expect(preferences.weekly).toBe(false);
    // Reads every topic the job reads, matches included.
    expect(prisma.userNotificationChannel.findMany.mock.calls[0][0].where.category.in).toEqual([...DIGEST_TOPICS]);
  });

  it('reports a stored switch and the cadence', async () => {
    const { controller } = makeController([{ category: 'updates', isEnabled: false }, { category: 'matches', isEnabled: false }], 'weekly');
    const { preferences } = await controller.getDigestPreferences({ id: 'u1' });
    expect(preferences.updates).toBe(false);
    expect(preferences.matches).toBe(false);
    expect(preferences.connections).toBe(true);
    expect(preferences.weekly).toBe(true);
  });
});

describe('POST /digests/preferences', () => {
  it('writes only the topic it names and leaves the cadence alone', async () => {
    const { controller, prisma } = makeController();
    await controller.updateDigestPreferences({ matches: false }, { id: 'u1' });
    expect(prisma.activityDigestPreference.upsert).not.toHaveBeenCalled();
    expect(prisma.userNotificationChannel.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.userNotificationChannel.upsert.mock.calls[0][0]).toMatchObject({
      where: { userId_channel_category: { userId: 'u1', channel: 'email', category: 'matches' } },
      update: { isEnabled: false },
    });
  });

  it('refuses two cadences at once', async () => {
    const { controller } = makeController();
    await expect(controller.updateDigestPreferences({ daily: true, weekly: true }, { id: 'u1' })).rejects.toThrow('Choose only one digest frequency');
  });
});
