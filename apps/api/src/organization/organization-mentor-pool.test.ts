import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrganizationService } from './organization.service';

/*
 * Adding someone who already asked to join must reuse their row. The pool's
 * unique key is (organisation, user); a second create is a 500 (docs §103).
 */

type Row = Record<string, any>;

function setup(pool: Row[] = []) {
  const prisma: any = {
    organizationMembership: {
      findFirst: vi.fn(async () => ({ id: 'mem', role: 'admin' })),
    },
    organizationMentor: {
      findUnique: vi.fn(async ({ where }: any) => pool.find((r) => r.userId === where.organizationId_userId.userId) ?? null),
      create: vi.fn(async ({ data }: any) => { const r = { id: `om${pool.length}`, ...data }; pool.push(r); return r; }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(pool.find((r) => r.id === where.id)!, data)),
    },
  };
  return { service: new OrganizationService(prisma), pool, prisma };
}

describe('addMentorToPool', () => {
  it('creates a row when the person is new', async () => {
    const { service, pool } = setup();
    await service.addMentorToPool('org-1', 'admin-1', { userId: 'mentor-1', expertiseAreas: ['Pricing'], maxMentees: 4 });
    expect(pool).toHaveLength(1);
    expect(pool[0]).toMatchObject({ userId: 'mentor-1', isActive: true, expertiseAreas: ['Pricing'], maxMentees: 4, assignedBy: 'admin-1', requestedAt: null });
  });

  it('accepts a waiting request instead of creating a second row', async () => {
    const { service, pool } = setup([{ id: 'om-wait', organizationId: 'org-1', userId: 'mentor-1', isActive: false, requestedAt: new Date(), requestNote: 'Thursdays', expertiseAreas: [], maxMentees: null }]);
    await service.addMentorToPool('org-1', 'admin-1', { userId: 'mentor-1' });
    expect(pool).toHaveLength(1);
    expect(pool[0]).toMatchObject({ id: 'om-wait', isActive: true, assignedBy: 'admin-1', requestedAt: null, requestNote: null });
  });

  it('refuses someone already active, and a non-admin', async () => {
    const { service } = setup([{ id: 'om-in', organizationId: 'org-1', userId: 'mentor-1', isActive: true }]);
    await expect(service.addMentorToPool('org-1', 'admin-1', { userId: 'mentor-1' })).rejects.toBeInstanceOf(ConflictException);
    const closed = setup();
    closed.prisma.organizationMembership.findFirst = vi.fn(async () => null);
    await expect(closed.service.addMentorToPool('org-1', 'member-1', { userId: 'mentor-2' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
