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
