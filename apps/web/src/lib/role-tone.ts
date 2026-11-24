import { roleFamily, type RoleFamily } from './role-family';

/**
 * Role → the tinted wash its avatar fallback wears (mockup, 2026-11-23):
 * the monogram names the family in the family's colour before the badge
 * beside it is read. Photos never touch this — it is the fallback only.
 */
const ROLE_TONE: Record<RoleFamily, string> = {
  founder: 'bg-status-accent-bg text-status-accent',
  mentor: 'bg-status-warning-bg text-status-warning',
  investor: 'bg-status-success-bg text-status-success',
  org: 'bg-primary/10 text-primary-accessible',
};

export function roleTone(role: string | null | undefined): string {
  const family = roleFamily(role);
  return family ? ROLE_TONE[family] : 'bg-primary/10 text-primary-accessible';
}

/**
 * The 3px ring an avatar wears in its role's tone (B1.4): the family colour
 * as an edge, so a face — photo or monogram — names the family before the
 * badge beside it is read. The status border tones are the tint's own edge,
 * firm enough to read on a card.
 */
const ROLE_RING: Record<RoleFamily, string> = {
  founder: 'ring-status-accent-border',
  mentor: 'ring-status-warning-border',
  investor: 'ring-status-success-border',
  org: 'ring-primary/40',
};

export function roleRing(role: string | null | undefined): string {
  const family = roleFamily(role);
  return `ring-[3px] ${family ? ROLE_RING[family] : 'ring-status-neutral-border'}`;
}
