export const CAP_TABLE_KINDS = ['founder', 'employee', 'investor', 'pool', 'other'] as const;
export type CapTableKind = (typeof CAP_TABLE_KINDS)[number];

/** One line of who owns what. Shares, not percentages: the percentages follow from them. */
export type CapTableHolder = { id: string; name: string; kind: CapTableKind; shares: number };

export const CAP_TABLE_LIMITS = { holders: 50, name: 120, shares: 1e12 } as const;

/** Each holder with their share of the total, in the order they were written. */
export function capTableShares(holders: readonly CapTableHolder[]): Array<CapTableHolder & { share: number }> {
  const total = holders.reduce((sum, holder) => sum + holder.shares, 0);
  return holders.map((holder) => ({ ...holder, share: total > 0 ? holder.shares / total : 0 }));
}

/** A stored cap table, or null when the value is not one. */
export function readCapTable(raw: unknown): CapTableHolder[] | null {
  if (!Array.isArray(raw) || raw.length > CAP_TABLE_LIMITS.holders) return null;
  const holders: CapTableHolder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const { id, name, kind, shares } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !id || typeof name !== 'string' || !name.trim() || name.length > CAP_TABLE_LIMITS.name) return null;
    if (!CAP_TABLE_KINDS.includes(kind as CapTableKind)) return null;
    if (typeof shares !== 'number' || !Number.isFinite(shares) || shares <= 0 || shares > CAP_TABLE_LIMITS.shares) return null;
    holders.push({ id, name: name.trim(), kind: kind as CapTableKind, shares });
  }
  return holders;
}
