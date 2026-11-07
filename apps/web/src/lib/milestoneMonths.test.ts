import { describe, expect, it } from 'vitest';
import { milestoneMonths } from './milestone-order';

const NOW = new Date('2026-11-07T12:00:00Z');
const at = (id: string, dueDate: string | null, status = 'todo') => ({ id, dueDate, status });
const months = (items: ReturnType<typeof at>[]) => milestoneMonths(items, NOW).map((group) => group.month);

describe('milestones by month', () => {
  it('runs from this month on, each in date order', () => {
    const groups = milestoneMonths([at('c', '2026-12-02'), at('b', '2026-11-20'), at('a', '2026-11-08')], NOW);
    expect(groups.map((g) => g.month)).toEqual(['2026-11', '2026-12']);
    expect(groups[0]?.items.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('leads with what needs work, not with what is done', () => {
    expect(months([
      at('old', '2026-08-22', 'completed'),
      at('older', '2026-07-01', 'cancelled'),
      at('now', '2026-11-20'),
      at('later', '2026-12-02'),
    ])).toEqual(['2026-11', '2026-12', '2026-08', '2026-07']);
  });

  it('keeps a past month with something open at the top: overdue is not history', () => {
    expect(months([at('late', '2026-09-10', 'in_progress'), at('now', '2026-11-20')])).toEqual(['2026-09', '2026-11']);
  });

  it('puts what has no date after the work, before the past', () => {
    expect(months([at('x', null), at('now', '2026-11-20'), at('old', '2026-08-22', 'completed')])).toEqual(['2026-11', null, '2026-08']);
  });

  it('drops nothing', () => {
    const items = [at('a', '2026-01-01', 'completed'), at('b', null), at('c', '2027-01-01'), at('d', null)];
    expect(milestoneMonths(items, NOW).flatMap((g) => g.items)).toHaveLength(items.length);
  });

  it('reads the month from the stored date, not the local clock', () => {
    expect(months([at('a', '2026-12-01T00:00:00.000Z')])).toEqual(['2026-12']);
  });
});
