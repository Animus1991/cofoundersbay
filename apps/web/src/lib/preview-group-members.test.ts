import { beforeEach, describe, expect, it } from 'vitest';
import { resolvePreviewApi } from './preview-api';

type GroupRead = { group?: { memberCount: number; members?: Array<{ userId: string; role: string }> } | null; memberRole?: string | null };
const read = (id: string) => resolvePreviewApi(`/api/groups/${id}`) as GroupRead;
const refusal = (fn: () => unknown) => {
  try { fn(); } catch (e) { return e as { status?: number; details?: { reason?: string; messageEl?: string } }; }
  throw new Error('expected a refusal');
};

describe('preview community members', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('a moderator removes a plain member, and the next read agrees', () => {
    const before = read('grp-saas-metrics');
    expect(before.memberRole).toBe('moderator');
    const plain = before.group?.members?.find((m) => m.role === 'member' && m.userId !== 'preview-demo-user');
    expect(plain).toBeTruthy();
    expect(resolvePreviewApi(`/api/groups/grp-saas-metrics/members/${plain!.userId}`, { method: 'DELETE' })).toEqual({ ok: true });
    const after = read('grp-saas-metrics');
    expect(after.group?.members?.some((m) => m.userId === plain!.userId)).toBe(false);
    expect(after.group?.memberCount).toBe((before.group?.memberCount ?? 0) - 1);
  });

  it('protects the owner and refuses a moderator a role change, in the API shape', () => {
    const owner = read('grp-saas-metrics').group?.members?.find((m) => m.role === 'owner');
    const ownerRefusal = refusal(() => resolvePreviewApi(`/api/groups/grp-saas-metrics/members/${owner!.userId}`, { method: 'DELETE' }));
    expect(ownerRefusal.status).toBe(403);
    expect(ownerRefusal.details?.reason).toBe('group_member_owner_protected');
    expect(ownerRefusal.details?.messageEl).toBeTruthy();
    const plain = read('grp-saas-metrics').group?.members?.find((m) => m.role === 'member');
    const roleRefusal = refusal(() => resolvePreviewApi(`/api/groups/grp-saas-metrics/members/${plain!.userId}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) }));
    expect(roleRefusal.details?.reason).toBe('group_member_not_allowed');
  });

  it('a plain member removes nobody', () => {
    const plain = read('grp-athens-founders').group?.members?.find((m) => m.role === 'member' && m.userId !== 'preview-demo-user');
    expect(refusal(() => resolvePreviewApi(`/api/groups/grp-athens-founders/members/${plain!.userId}`, { method: 'DELETE' })).details?.reason).toBe('group_member_not_allowed');
  });
});
