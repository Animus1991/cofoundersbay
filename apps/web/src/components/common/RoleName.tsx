'use client';

import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { ROLE_FAMILY_LABEL, roleFamily } from '@/lib/role-family';

/**
 * A member's role written as plain text, as the role badge names it: the
 * family ("Founder" for a cofounder, "Investor" for an angel), so a row and
 * the badge beside it, or two pages, never call the same person two things.
 * Marcus Chen was "Cofounder" on /members and in the Explore strip, and
 * "Founder" on every card with a badge (docs §73, §86). A role outside the
 * four families keeps its own word.
 */
export function RoleName({ role }: { role: string | null | undefined }) {
  if (!role) return null;
  const family = roleFamily(role);
  if (!family) return <StatusText value={role} />;
  const label = ROLE_FAMILY_LABEL[family];
  return <BilingualText en={label.en} el={label.el} compact />;
}
