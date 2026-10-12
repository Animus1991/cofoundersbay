import type { PerkCategory, PerkInput, PerkStage, PerkView } from '@cofounderbay/shared';
import { apiRequest } from '@/lib/api';

function perksOf(res: { perks?: unknown } | null | undefined): PerkView[] {
  const list = Array.isArray(res?.perks) ? (res.perks as PerkView[]) : [];
  return list
    .filter((p) => p && typeof p.id === 'string')
    .map((p) => ({ ...p, stages: Array.isArray(p.stages) ? p.stages : [], claimCount: typeof p.claimCount === 'number' ? p.claimCount : 0 }));
}

/** Open partner offers (`/api/perks`), the reader's stage first. Always an array. */
export async function listPerks(filter: { category?: PerkCategory; stage?: PerkStage } = {}): Promise<PerkView[]> {
  const q = new URLSearchParams();
  if (filter.category) q.set('category', filter.category);
  if (filter.stage) q.set('stage', filter.stage);
  const qs = q.toString();
  return perksOf(await apiRequest<{ perks?: unknown }>(`/api/perks${qs ? `?${qs}` : ''}`));
}

/** The perks the reader claimed, with their codes - including ones since switched off. */
export async function listClaimedPerks(): Promise<PerkView[]> {
  return perksOf(await apiRequest<{ perks?: unknown }>('/api/perks/claimed'));
}

export async function claimPerk(id: string): Promise<PerkView | null> {
  const res = await apiRequest<{ perk?: PerkView }>(`/api/perks/${encodeURIComponent(id)}/claim`, { method: 'POST' });
  return res?.perk ?? null;
}

/** Every perk with codes and counts: platform admins only. */
export async function adminListPerks(): Promise<PerkView[]> {
  return perksOf(await apiRequest<{ perks?: unknown }>('/api/perks/admin/all'));
}

export async function createPerk(input: Partial<PerkInput>): Promise<PerkView | null> {
  const res = await apiRequest<{ perk?: PerkView }>('/api/perks/admin', { method: 'POST', body: JSON.stringify(input) });
  return res?.perk ?? null;
}

/** Switches a perk on or off; every claim is kept either way. */
export async function setPerkActive(id: string, active: boolean): Promise<PerkView | null> {
  const res = await apiRequest<{ perk?: PerkView }>(`/api/perks/admin/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ active }) });
  return res?.perk ?? null;
}
