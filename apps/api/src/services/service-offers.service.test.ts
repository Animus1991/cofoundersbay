import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { readProjectDelivery } from '@cofounderbay/shared';
import { ServiceOffersService } from './service-offers.service';

/*
 * Progress and the due date on agreed work (docs §97): kept for projects
 * only, a whole number 0-100 and a calendar day, cleared with null, and a
 * completed project is at 100%.
 */

function setup(status: string) {
  const row: Record<string, unknown> = { id: 'inq-1', providerId: 'provider-1', status };
  const prisma = {
    serviceInquiry: {
      findUnique: vi.fn(async () => ({ ...row })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(row, data)),
    },
  };
  const service = new ServiceOffersService(prisma as never);
  return { service, prisma, row };
}

async function refusalOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    return (err as BadRequestException).getResponse() as { error: { message: string; details: Record<string, unknown> } };
  }
  throw new Error('expected a refusal');
}

describe('project delivery', () => {
  it('stores progress and a due date on an accepted project', async () => {
    const { service, prisma } = setup('accepted');
    await service.updateInquiry('provider-1', 'inq-1', { progress: 40, dueDate: '2026-11-05' });
    const data = prisma.serviceInquiry.update.mock.calls[0][0].data;
    expect(data.progress).toBe(40);
    expect(data.dueDate).toEqual(new Date('2026-11-05T00:00:00.000Z'));
  });

  it('clears them with null', async () => {
    const { service, prisma } = setup('accepted');
    await service.updateInquiry('provider-1', 'inq-1', { progress: null, dueDate: null });
    const data = prisma.serviceInquiry.update.mock.calls[0][0].data;
    expect(data).toMatchObject({ progress: null, dueDate: null });
  });

  it('leaves them alone when they are not sent', async () => {
    const { service, prisma } = setup('accepted');
    await service.updateInquiry('provider-1', 'inq-1', { responseMessage: 'On it' });
    const data = prisma.serviceInquiry.update.mock.calls[0][0].data;
    expect('progress' in data).toBe(false);
    expect('dueDate' in data).toBe(false);
  });

  it('refuses them on an inquiry that is not agreed work, in both languages', async () => {
    const { service, prisma } = setup('open');
    const body = await refusalOf(service.updateInquiry('provider-1', 'inq-1', { progress: 10 }));
    expect(body.error.details).toMatchObject({ reason: 'project_delivery_invalid', field: 'progress' });
    expect(String(body.error.details.messageEl)).toMatch(/αποδεχτείτε/);
    expect(prisma.serviceInquiry.update).not.toHaveBeenCalled();
  });

  it('accepts them in the same update that accepts the inquiry', async () => {
    const { service, prisma } = setup('in_discussion');
    await service.updateInquiry('provider-1', 'inq-1', { status: 'accepted', dueDate: '2026-12-01' });
    expect(prisma.serviceInquiry.update.mock.calls[0][0].data.dueDate).toEqual(new Date('2026-12-01T00:00:00.000Z'));
  });

  it('completing sets progress to 100, and a completed project cannot read less', async () => {
    const { service, prisma } = setup('accepted');
    await service.updateInquiry('provider-1', 'inq-1', { status: 'completed' });
    expect(prisma.serviceInquiry.update.mock.calls[0][0].data.progress).toBe(100);
    const done = setup('completed');
    const body = await refusalOf(done.service.updateInquiry('provider-1', 'inq-1', { progress: 60 }));
    expect(body.error.details).toMatchObject({ field: 'progress' });
  });

  it('refuses a day that does not exist and progress outside 0-100', () => {
    expect(readProjectDelivery({ dueDate: '2026-02-30' }, 'accepted')).toMatchObject({ ok: false, field: 'dueDate' });
    expect(readProjectDelivery({ progress: 101 }, 'accepted')).toMatchObject({ ok: false, field: 'progress' });
    expect(readProjectDelivery({ progress: 12.5 }, 'accepted')).toMatchObject({ ok: false, field: 'progress' });
  });
});
