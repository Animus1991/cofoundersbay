import { describe, expect, it } from 'vitest';
import { milestoneMonths } from './milestone-order';

const at = (id: string, dueDate: string | null) => ({ id, dueDate });

describe('milestones by month', () => {
  it('runs from the earliest month, each in date order', () => {
    const groups = milestoneMonths([at('c', '2026-12-02'), at('b', '2026-11-20'), at('a', '2026-11-03')]);
    expect(groups.map((g) => g.month)).toEqual(['2026-11', '2026-12']);
    expect(groups[0]?.items.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('keeps a milestone with no date, at the end', () => {
    const groups = milestoneMonths([at('x', null), at('a', '2026-11-03')]);
    expect(groups.map((g) => g.month)).toEqual(['2026-11', null]);
    expect(groups[1]?.items.map((m) => m.id)).toEqual(['x']);
  });

  it('drops nothing', () => {
    const items = [at('a', '2026-01-01'), at('b', null), at('c', '2027-01-01'), at('d', null)];
    expect(milestoneMonths(items).flatMap((g) => g.items)).toHaveLength(items.length);
  });

  it('reads the month from the stored date, not the local clock', () => {
    expect(milestoneMonths([at('a', '2026-12-01T00:00:00.000Z')])[0]?.month).toBe('2026-12');
  });
});
