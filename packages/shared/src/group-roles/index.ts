/**
 * Who may change what about a community's members.
 *
 * `PATCH /groups/:id/members/:userId/role` and `DELETE /groups/:id/members/:userId`
 * existed with no screen, and the removal check let a moderator remove an
 * admin or another moderator (only the owner was protected). One rule here
 * for the API, the members list and the demo world:
 *
 * - the owner's role never changes and the owner is never removed;
 * - the owner and admins give or take the admin, moderator and member roles;
 * - the owner and admins remove anyone but the owner;
 * - a moderator removes plain members only, and changes no role.
 *
 * The members list offers nothing on the reader's own row: leaving is the
 * member's own action, in the header.
 */
export const GROUP_ROLES = ['owner', 'admin', 'moderator', 'member'] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

/** The roles one member may hand to another. */
export const ASSIGNABLE_GROUP_ROLES = ['admin', 'moderator', 'member'] as const;
export type AssignableGroupRole = (typeof ASSIGNABLE_GROUP_ROLES)[number];

export const GROUP_ROLE_COPY: Readonly<Record<GroupRole, { en: string; el: string }>> = {
  owner: { en: 'Owner', el: 'Ιδιοκτήτης' },
  admin: { en: 'Admin', el: 'Διαχειριστής' },
  moderator: { en: 'Moderator', el: 'Συντονιστής' },
  member: { en: 'Member', el: 'Μέλος' },
};

export function isGroupRole(value: unknown): value is GroupRole {
  return typeof value === 'string' && (GROUP_ROLES as readonly string[]).includes(value);
}

/** The roles `actor` may give `target` now (never the one the target already has). */
export function groupRoleChoices(actor: GroupRole | null | undefined, target: GroupRole): AssignableGroupRole[] {
  if (actor !== 'owner' && actor !== 'admin') return [];
  if (target === 'owner') return [];
  return ASSIGNABLE_GROUP_ROLES.filter((r) => r !== target);
}

export function canRemoveGroupMember(actor: GroupRole | null | undefined, target: GroupRole): boolean {
  if (target === 'owner') return false;
  if (actor === 'owner' || actor === 'admin') return true;
  return actor === 'moderator' && target === 'member';
}

export const GROUP_MEMBER_PROBLEM_COPY = {
  owner_protected: { en: 'The owner’s role cannot change, and the owner cannot be removed.', el: 'Ο ρόλος του ιδιοκτήτη δεν αλλάζει και ο ιδιοκτήτης δεν αφαιρείται.' },
  not_allowed: { en: 'Your role in this community does not allow that.', el: 'Ο ρόλος σας σε αυτή την κοινότητα δεν το επιτρέπει.' },
} as const;
export type GroupMemberProblem = keyof typeof GROUP_MEMBER_PROBLEM_COPY;
