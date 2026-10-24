import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { readOrgPolicies } from '@cofounderbay/shared';
import { OrganizationPoliciesService } from './organization-policies.service';
import { OrgService } from '../org/org.service';

/*
 * The organisation's access policies (docs §103): stored under
 * `settings.policies`, read here, and applied - mentors asking to join the
 * pool, the founders' workspaces, the public reads and the cohort detail.
 */

type Row = Record<string, any>;

function setup(opts: { settings?: Row | null; role?: string; listing?: boolean; admin?: boolean } = {}) {
  const org: Row = { id: 'org-1', name: 'Aegean Venture Lab', displayName: null, slug: 'aegean-lab', isActive: true, settings: opts.settings ?? null };
  const pool: Row[] = [];
  const notes: Row[] = [];
  const prisma: any = {
    organization: {
      findUnique: vi.fn(async () => org),
      update: vi.fn(async ({ data }: any) => Object.assign(org, data)),
      findMany: vi.fn(async () => [org]),
    },
    organizationMentor: {
      findUnique: vi.fn(async ({ where }: any) => pool.find((r) => r.userId === where.organizationId_userId.userId) ?? null),
      findFirst: vi.fn(async ({ where }: any) => pool.find((r) => r.id === where.id && !r.isActive && r.requestedAt) ?? null),
      findMany: vi.fn(async () => pool.filter((r) => !r.isActive && r.requestedAt).map((r) => ({ ...r, user: { profile: { displayName: 'Dr. Sarah Kim' }, mentorProfile: { skills: ['Product'], industries: ['Healthcare'] } } }))),
      create: vi.fn(async ({ data }: any) => { const r = { id: `om${pool.length}`, ...data }; pool.push(r); return r; }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(pool.find((r) => r.id === where.id)!, data)),
      delete: vi.fn(async ({ where }: any) => { pool.splice(pool.findIndex((r) => r.id === where.id), 1); }),
    },
    organizationMembership: {
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => [{ userId: 'owner-1' }, { userId: 'admin-1' }]),
    },
    user: { findUnique: vi.fn(async () => ({ role: opts.role ?? 'mentor' })) },
    mentorProfile: { findUnique: vi.fn(async () => (opts.listing ? { id: 'mp' } : null)) },
    profile: { findUnique: vi.fn(async () => ({ displayName: 'Dr. Sarah Kim' })) },
  };
  const organizations: any = {
    checkAdminAccess: vi.fn(async () => {
      if (opts.admin === false) throw new ForbiddenException('Organization owner or admin access required');
      return { role: 'admin' };
    }),
    checkMemberAccess: vi.fn(async () => ({ role: 'member' })),
  };
  const notify: any = { createNotification: vi.fn(async (n: Row) => { notes.push(n); return n; }) };
  return { service: new OrganizationPoliciesService(prisma, organizations, notify), org, pool, notes, prisma };
}

describe('organisation policies', () => {
  it('read over the defaults, ignoring anything that is not a switch', () => {
    expect(readOrgPolicies(null)).toEqual({ publicProfile: true, openApplications: true, mentorSelfRegistration: false, workspaceAccess: true });
    expect(readOrgPolicies({ policies: { publicProfile: false, workspaceAccess: 'no' } })).toMatchObject({ publicProfile: false, workspaceAccess: true });
  });

  it('are changed by admins only, and the rest of the settings is kept', async () => {
    const { service, org } = setup({ settings: { brand: 'teal', policies: { publicProfile: true } } });
    await service.update('org-1', 'admin-1', { publicProfile: false, mentorSelfRegistration: true, other: true });
    expect(org.settings).toEqual({ brand: 'teal', policies: { publicProfile: false, openApplications: true, mentorSelfRegistration: true, workspaceAccess: true } });
    await expect(setup({ admin: false }).service.update('org-1', 'member-1', { publicProfile: false })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('mentors asking to join the pool', () => {
  it('are refused while the policy is off, and when they are not mentors', async () => {
    await expect(setup().service.requestToJoin('org-1', 'u1', {})).rejects.toMatchObject({ response: { error: { details: { problem: 'mentor_requests_closed' } } } });
    const open = { settings: { policies: { mentorSelfRegistration: true } } };
    await expect(setup({ ...open, role: 'founder' }).service.requestToJoin('org-1', 'u1', {})).rejects.toMatchObject({ response: { error: { details: { problem: 'not_a_mentor' } } } });
    // A founder with a mentor listing is a mentor.
    await expect(setup({ ...open, role: 'founder', listing: true }).service.requestToJoin('org-1', 'u1', {})).resolves.toHaveProperty('request');
  });

  it('wait inactive, tell the owners and admins, and are not made twice', async () => {
    const { service, pool, notes } = setup({ settings: { policies: { mentorSelfRegistration: true } } });
    await service.requestToJoin('org-1', 'sarah', { note: '  Healthcare founders, Thursdays  ' });
    expect(pool[0]).toMatchObject({ userId: 'sarah', isActive: false, requestNote: 'Healthcare founders, Thursdays' });
    expect(pool[0].requestedAt).toBeInstanceOf(Date);
    expect(notes.map((n) => n.userId)).toEqual(['owner-1', 'admin-1']);
    expect(notes[0]).toMatchObject({ type: 'mentor_request', link: '/org/mentors#requests' });
    await expect(service.requestToJoin('org-1', 'sarah', {})).rejects.toMatchObject({ response: { error: { details: { problem: 'already_requested' } } } });
    expect((await service.standing('aegean-lab', 'sarah')).standing).toBe('requested');
  });

  it('are listed to admins, accepted into the pool or declined away; the mentor can withdraw', async () => {
    const { service, pool, notes } = setup({ settings: { policies: { mentorSelfRegistration: true } } });
    await service.requestToJoin('org-1', 'sarah', {});
    const { requests } = await service.listRequests('org-1', 'admin-1');
    expect(requests[0]).toMatchObject({ userId: 'sarah', displayName: 'Dr. Sarah Kim', expertise: ['Product', 'Healthcare'] });
    await service.answer('org-1', 'admin-1', requests[0].id, true);
    expect(pool[0]).toMatchObject({ isActive: true, assignedBy: 'admin-1' });
    expect(notes.at(-1)).toMatchObject({ userId: 'sarah', title: 'Aegean Venture Lab added you to its mentor pool' });
    expect((await service.standing('aegean-lab', 'sarah')).standing).toBe('in_pool');
    await expect(service.requestToJoin('org-1', 'sarah', {})).rejects.toMatchObject({ response: { error: { details: { problem: 'already_in_pool' } } } });

    const other = setup({ settings: { policies: { mentorSelfRegistration: true } } });
    await other.service.requestToJoin('org-1', 'nikos', {});
    await other.service.answer('org-1', 'admin-1', other.pool[0].id, false);
    expect(other.pool).toHaveLength(0);
    await other.service.requestToJoin('org-1', 'nikos', {});
    await other.service.withdraw('org-1', 'nikos');
    expect(other.pool).toHaveLength(0);
    await expect(other.service.withdraw('org-1', 'nikos')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('say where a mentor stands', async () => {
    expect((await setup().service.standing('aegean-lab', 'u1')).standing).toBe('closed');
    expect((await setup({ settings: { policies: { mentorSelfRegistration: true } } }).service.standing('aegean-lab', 'u1'))).toMatchObject({ standing: 'can_request', isMentor: true, organizationId: 'org-1' });
  });
});

describe('founders\' workspaces', () => {
  it('stay closed to the organisation while "Startup workspace access" is off', async () => {
    await expect(setup({ settings: { policies: { workspaceAccess: false } } }).service.assertWorkspaceAccess('tenant-1')).rejects.toMatchObject({ response: { error: { details: { problem: 'workspace_access_off' } } } });
    await expect(setup().service.assertWorkspaceAccess('tenant-1')).resolves.toBeUndefined();
  });
});

describe('the organisation\'s public reads and cohort detail (OrgService)', () => {
  function org(opts: { publicProfile?: boolean; member?: boolean; role?: string } = {}) {
    const prisma: any = {
      organization: { findUnique: vi.fn(async () => ({ settings: { policies: { publicProfile: opts.publicProfile ?? true } } })) },
      user: {
        findFirst: vi.fn(async () => ({ id: 'org-user' })),
        findUnique: vi.fn(async () => ({ role: opts.role ?? 'founder' })),
      },
      organizationMembership: { findFirst: vi.fn(async () => (opts.member ? { id: 'm' } : null)) },
    };
    return new OrgService(prisma);
  }

  it('answer outsiders only while the organisation is public', async () => {
    await expect(org().assertOrgVisible('aegean-lab', undefined)).resolves.toBeUndefined();
    await expect(org({ publicProfile: false }).assertOrgVisible('aegean-lab', undefined)).rejects.toBeInstanceOf(NotFoundException);
    await expect(org({ publicProfile: false }).assertOrgVisible('aegean-lab', 'outsider')).rejects.toBeInstanceOf(NotFoundException);
    await expect(org({ publicProfile: false, member: true }).assertOrgVisible('aegean-lab', 'member')).resolves.toBeUndefined();
    await expect(org({ publicProfile: false }).assertOrgVisible('aegean-lab', 'org-user')).resolves.toBeUndefined();
  });

  it('give a cohort\'s people only to the organisation\'s members', async () => {
    await expect(org().assertOrgMember('aegean-lab', undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(org().assertOrgMember('aegean-lab', 'outsider')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(org({ member: true }).assertOrgMember('aegean-lab', 'mentor-in-org')).resolves.toBeUndefined();
    await expect(org({ role: 'admin' }).assertOrgMember('aegean-lab', 'platform-admin')).resolves.toBeUndefined();
  });
});
