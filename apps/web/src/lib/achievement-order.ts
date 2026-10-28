/**
 * The order achievements are listed in (owner, 2026-10-28; docs §90.5, §111).
 *
 * They came in the API's order, so an earned badge could sit below ten locked
 * ones. Earned first, the most recently earned leading; then the ones closest
 * to done, by the share of the way there; then the rest; and last the ones
 * whose eligibility is not known yet. Within a group the API's order holds.
 */
export type Orderable = {
  unlocked: boolean | null;
  unlockedAt?: Date;
  progress: number;
  total: number;
};

function group(a: Orderable): number {
  if (a.unlocked === true) return 0;
  if (a.unlocked === null) return 3;
  return a.total > 0 && a.progress > 0 ? 1 : 2;
}

export function orderAchievements<T extends Orderable>(list: readonly T[]): T[] {
  return list
    .map((item, index) => ({ item, index, g: group(item) }))
    .sort((x, y) => {
      if (x.g !== y.g) return x.g - y.g;
      if (x.g === 0) {
        const byDate = (y.item.unlockedAt?.getTime() ?? 0) - (x.item.unlockedAt?.getTime() ?? 0);
        if (byDate !== 0) return byDate;
      }
      if (x.g === 1) {
        const share = (a: Orderable) => Math.min(1, a.progress / a.total);
        const byShare = share(y.item) - share(x.item);
        if (byShare !== 0) return byShare;
      }
      return x.index - y.index;
    })
    .map(({ item }) => item);
}
