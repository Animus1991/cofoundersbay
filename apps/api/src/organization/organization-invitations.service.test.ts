import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { OrganizationInvitationsService } from './organization-invitations.service';

/*
 * Invitations by email (docs §100): only admins invite; the link's token is
 * stored hashed; only the invited address can answer; accepting makes the
 * membership with the invited role.
 */

type Row = Record<string, any>;

function setup(opts: { admin?: boolean; members?: Row[]; users?: Row[]; seatLimit?: number } = {}) {
  const invitations: Row[] = [];
  const memberships: Row[] = [...(opts.members ?? [])];
  const users: Row[] = opts.users ?? [{ id: 'u-invitee', email: 'Sofia@Meltemi.example' }, { id: 'u-other', email: 'other@x.example' }];
  const notifications: Row[] = [];
  const emails: Row[] = [];
  const prisma: any = {
    organizationMembership: {
      findFirst: vi.fn(async ({ where }: any) => {
        const email = where.user?.email?.equals?.toLowerCase();
        return memberships.find((m) => m.organizationId === where.organizationId && m.isActive && users.find((u) => u.id === m.userId)?.email.toLowerCase() === email) ?? null;
      }),
      findUnique: vi.fn(async ({ where }: any) => memberships.find((m) => m.organizationId === where.organizationId_userId.organizationId && m.userId === where.organizationId_userId.userId) ?? null),
      create: vi.fn(async ({ data }: any) => { memberships.push({ id: `m${memberships.length}`, isActive: true, ...data }); return data; }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(memberships.find((m) => m.id === where.id)!, data)),
      count: vi.fn(async () => memberships.filter((m) => m.isActive).length),
    },
    // An organisation's plan (docs §104): a seat limit only when the test gives one.
    subscription: {
      findFirst: vi.fn(async () => (opts.seatLimit ? { seatLimit: opts.seatLimit, plan: { seatLimit: opts.seatLimit } } : null)),
    },
    organizationInvitation: {
      findFirst: vi.fn(async ({ where }: any) => invitations.find((i) =>
        (where.id ? i.id === where.id : true)
        && i.organizationId === where.organizationId
        && (where.email ? i.email === where.email : true)
        && (where.status ? i.status === where.status : true)
        && (where.expiresAt?.gt ? i.expiresAt > where.expiresAt.gt : true)) ?? null),
      findMany: vi.fn(async () => invitations.map((i) => ({ ...i, invitedBy: { profile: { displayName: 'Alex Demo' } } }))),
      findUnique: vi.fn(async ({ where, include }: any) => {
        const i = invitations.find((x) => x.tokenHash === where.tokenHash);
        if (!i) return null;
        return include ? { ...i, organization: { id: 'org-1', name: 'Aegean Venture Lab', slug: 'aegean-lab', logoUrl: null }, invitedBy: { profile: { displayName: 'Alex Demo' } } } : { ...i };
      }),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `inv${invitations.length}`, status: 'pending', sentAt: new Date(), respondedAt: null, message: null, ...data };
        invitations.push(row);
        return { ...row, invitedBy: { profile: { displayName: 'Alex Demo' } } };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const row = invitations.find((i) => i.id === where.id)!;
        Object.assign(row, data);
        return { ...row, invitedBy: { profile: { displayName: 'Alex Demo' } } };
      }),
      count: vi.fn(async () => invitations.filter((i) => i.status === 'pending').length),
    },
    organization: {
      findUnique: vi.fn(async () => ({ id: 'org-1', name: 'Aegean Venture Lab', slug: 'aegean-lab' })),
    },
    user: {
      findFirst: vi.fn(async ({ where }: any) => users.find((u) => u.email.toLowerCase() === where.email.equals.toLowerCase()) ?? null),
      findUnique: vi.fn(async ({ where }: any) => users.find((u) => u.id === where.id) ?? null),
    },
  };
  prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));
  const organizations: any = {
    checkAdminAccess: vi.fn(async () => {
      if (opts.admin === false) throw new ForbiddenException('Organization owner or admin access required');
      return { role: 'admin' };
    }),
  };
  const config: any = { get: () => 'https://cofounderbay.example' };
  const emailQueue: any = { enqueueSendEmail: vi.fn(async (p: any) => { emails.push(p); return 'queued'; }) };
  const notify: any = { createNotification: vi.fn(async (p: any) => { notifications.push(p); return p; }) };
  const service = new OrganizationInvitationsService(prisma, organizations, config, emailQueue, notify);
  return { service, invitations, memberships, notifications, emails };
}

const tokenOf = (email: Row) => /\/join\/([\w-]+)/.exec(email.text)![1];

describe('organisation invitations', () => {
  it('only an owner or admin invites', async () => {
    const { service } = setup({ admin: false });
    await expect(service.create('org-1', 'u-member', { email: 'a@b.example' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('stores the link token hashed, emails the link and notifies an existing account', async () => {
    const { service, invitations, emails, notifications } = setup();
    const out = await service.create('org-1', 'u-admin', { email: ' Sofia@Meltemi.example ', role: 'mentor', message: 'Join our pool' });
    expect(out.invitation).toMatchObject({ email: 'sofia@meltemi.example', role: 'mentor', status: 'pending' });
    const token = tokenOf(emails[0]);
    expect(invitations[0].tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(JSON.stringify(invitations[0])).not.toContain(token);
    expect(emails[0].text).toMatch(/Aegean Venture Lab/);
    expect(emails[0].text).toMatch(/σας προσκάλεσε/);
    expect(notifications[0]).toMatchObject({ userId: 'u-invitee', type: 'organization_invite', link: `/join/${token}` });
    expect(out.link).toBe(`https://cofounderbay.example/join/${token}`);
  });

  it('refuses a bad address, an unknown role, a member and a second open invitation', async () => {
    const { service } = setup({ members: [{ id: 'm0', organizationId: 'org-1', userId: 'u-other', isActive: true }] });
    await expect(service.create('org-1', 'u-admin', { email: 'not-an-email' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('org-1', 'u-admin', { email: 'a@b.example', role: 'owner' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('org-1', 'u-admin', { email: 'OTHER@x.example' })).rejects.toBeInstanceOf(ConflictException);
    await service.create('org-1', 'u-admin', { email: 'new@person.example' });
    await expect(service.create('org-1', 'u-admin', { email: 'new@person.example' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('shows the link without an account, with the address masked', async () => {
    const { service, emails } = setup();
    await service.create('org-1', 'u-admin', { email: 'sofia@meltemi.example', role: 'reviewer' });
    const { invitation } = await service.preview(tokenOf(emails[0]));
    expect(invitation).toMatchObject({ organization: { name: 'Aegean Venture Lab' }, role: 'reviewer', emailMasked: 's•••@meltemi.example', status: 'pending' });
  });

  it('only the invited address answers; accepting makes the membership with the role', async () => {
    const { service, emails, memberships, invitations } = setup();
    await service.create('org-1', 'u-admin', { email: 'sofia@meltemi.example', role: 'mentor' });
    const token = tokenOf(emails[0]);
    await expect(service.accept(token, 'u-other')).rejects.toMatchObject({ response: { error: { details: { problem: 'wrong_email' } } } });
    const out = await service.accept(token, 'u-invitee');
    expect(out.organization).toMatchObject({ slug: 'aegean-lab' });
    expect(memberships).toContainEqual(expect.objectContaining({ organizationId: 'org-1', userId: 'u-invitee', role: 'mentor', invitedBy: 'u-admin' }));
    expect(invitations[0]).toMatchObject({ status: 'accepted', acceptedById: 'u-invitee' });
    await expect(service.accept(token, 'u-invitee')).rejects.toMatchObject({ response: { error: { details: { problem: 'not_pending' } } } });
  });

  it('an expired link says so, and a cancelled one cannot be accepted', async () => {
    const { service, emails, invitations } = setup();
    await service.create('org-1', 'u-admin', { email: 'sofia@meltemi.example' });
    invitations[0].expiresAt = new Date(Date.now() - 1000);
    await expect(service.accept(tokenOf(emails[0]), 'u-invitee')).rejects.toMatchObject({ response: { error: { details: { problem: 'expired' } } } });
    expect(invitations[0].status).toBe('expired');
    await service.resend('org-1', 'u-admin', invitations[0].id);
    expect(invitations[0].status).toBe('pending');
    await service.cancel('org-1', 'u-admin', invitations[0].id);
    await expect(service.accept(tokenOf(emails[1]), 'u-invitee')).rejects.toMatchObject({ response: { error: { details: { problem: 'not_pending' } } } });
  });

  it('resending issues a new link; the old one stops working', async () => {
    const { service, emails } = setup();
    await service.create('org-1', 'u-admin', { email: 'sofia@meltemi.example' });
    const first = tokenOf(emails[0]);
    const created = await service.list('org-1', 'u-admin');
    await service.resend('org-1', 'u-admin', created.invitations[0].id);
    const second = tokenOf(emails[1]);
    expect(second).not.toBe(first);
    await expect(service.preview(first)).rejects.toThrow(/not found/);
  });

  it('counts the seats of the plan: members and invitations still waiting (docs §104)', async () => {
    const full = setup({ seatLimit: 2, members: [{ id: 'm0', organizationId: 'org-1', userId: 'a', isActive: true }, { id: 'm1', organizationId: 'org-1', userId: 'b', isActive: true }] });
    await expect(full.service.create('org-1', 'u-admin', { email: 'sofia@meltemi.example' })).rejects.toMatchObject({ response: { error: { details: { problem: 'seats_full' } } } });
    const oneLeft = setup({ seatLimit: 2, members: [{ id: 'm0', organizationId: 'org-1', userId: 'a', isActive: true }] });
    await oneLeft.service.create('org-1', 'u-admin', { email: 'sofia@meltemi.example' });
    await expect(oneLeft.service.create('org-1', 'u-admin', { email: 'nikos@andreou.example' })).rejects.toMatchObject({ response: { error: { details: { problem: 'seats_full' } } } });
  });
});
