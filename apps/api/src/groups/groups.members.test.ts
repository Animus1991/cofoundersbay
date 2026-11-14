import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { canRemoveGroupMember, groupRoleChoices } from '@cofounderbay/shared';
import { GroupsService } from './groups.service';

type Role = 'owner' | 'admin' | 'moderator' | 'member';

function makeService(roles: Record<string, Role>) {
  const prisma = {
    groupMember: {
      findUnique: vi.fn(async ({ where }: { where: { groupId_userId: { userId: string } } }) => {
        const role = roles[where.groupId_userId.userId];
        return role ? { userId: where.groupId_userId.userId, role } : null;
      }),
      update: vi.fn(async ({ where, data }: { where: { groupId_userId: { userId: string } }; data: { role: Role } }) => ({ userId: where.groupId_userId.userId, role: data.role })),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
  return { service: new GroupsService(prisma as never), prisma };
}

describe('the shared member rule', () => {
  it('lets the owner and admins give roles, never to the owner, and moderators none', () => {
    expect(groupRoleChoices('owner', 'member')).toEqual(['admin', 'moderator']);
    expect(groupRoleChoices('admin', 'moderator')).toEqual(['admin', 'member']);
    expect(groupRoleChoices('admin', 'owner')).toEqual([]);
    expect(groupRoleChoices('moderator', 'member')).toEqual([]);
    expect(groupRoleChoices('member', 'member')).toEqual([]);
    expect(groupRoleChoices(null, 'member')).toEqual([]);
  });

  it('lets a moderator remove plain members only', () => {
    expect(canRemoveGroupMember('moderator', 'member')).toBe(true);
    expect(canRemoveGroupMember('moderator', 'moderator')).toBe(false);
    expect(canRemoveGroupMember('moderator', 'admin')).toBe(false);
    expect(canRemoveGroupMember('admin', 'admin')).toBe(true);
    expect(canRemoveGroupMember('owner', 'admin')).toBe(true);
    expect(canRemoveGroupMember('admin', 'owner')).toBe(false);
    expect(canRemoveGroupMember('member', 'member')).toBe(false);
  });
});

describe('GroupsService member management', () => {
  it('refuses a moderator who removes an admin, with the reason in Greek', async () => {
    const { service, prisma } = makeService({ mod: 'moderator', adm: 'admin' });
    const err = await service.removeMember('g1', 'mod', 'adm').catch((e) => e);
    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse().error.details).toMatchObject({ reason: 'group_member_not_allowed' });
    expect(err.getResponse().error.details.messageEl).toMatch(/[Α-ω]/);
    expect(prisma.groupMember.delete).not.toHaveBeenCalled();
  });

  it('lets a moderator remove a member and an admin remove a moderator', async () => {
    const { service, prisma } = makeService({ mod: 'moderator', adm: 'admin', m1: 'member' });
    await expect(service.removeMember('g1', 'mod', 'm1')).resolves.toEqual({ ok: true });
    await expect(service.removeMember('g1', 'adm', 'mod')).resolves.toEqual({ ok: true });
    expect(prisma.groupMember.delete).toHaveBeenCalledTimes(2);
  });

  it('never removes or re-roles the owner', async () => {
    const { service } = makeService({ own: 'owner', adm: 'admin' });
    const removed = await service.removeMember('g1', 'adm', 'own').catch((e) => e);
    expect(removed.getResponse().error.details).toMatchObject({ reason: 'group_member_owner_protected' });
    const changed = await service.updateMemberRole('g1', 'adm', 'own', { role: 'member' }).catch((e) => e);
    expect(changed.getResponse().error.details).toMatchObject({ reason: 'group_member_owner_protected' });
  });

  it('lets an admin make a member a moderator, and refuses a moderator who tries', async () => {
    const { service } = makeService({ adm: 'admin', mod: 'moderator', m1: 'member' });
    await expect(service.updateMemberRole('g1', 'adm', 'm1', { role: 'moderator' })).resolves.toEqual({ member: { userId: 'm1', role: 'moderator' } });
    await expect(service.updateMemberRole('g1', 'mod', 'm1', { role: 'moderator' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
