import { describe, expect, it } from 'vitest';
import { isMilestoneDueSoon, isMilestoneOverdue, orderMilestones } from './milestone-order';

// 22 October 2026, 10:00 local.
const now = new Date(2026, 9, 22, 10, 0).getTime();

describe('milestone dates', () => {
  it('is not overdue on its own day', () => {
    expect(isMilestoneOverdue({ status: 'todo', dueDate: '2026-10-22' }, now)).toBe(false);
    expect(isMilestoneOverdue({ status: 'todo', dueDate: '2026-10-22T00:00:00.000Z' }, now)).toBe(false);
    expect(isMilestoneOverdue({ status: 'todo', dueDate: '2026-10-21' }, now)).toBe(true);
  });

  it('is never due soon or overdue once finished', () => {
    expect(isMilestoneDueSoon({ status: 'completed', dueDate: '2026-10-24' }, now)).toBe(false);
    expect(isMilestoneOverdue({ status: 'completed', dueDate: '2026-10-01' }, now)).toBe(false);
    expect(isMilestoneDueSoon({ status: 'in_progress', dueDate: '2026-10-24' }, now)).toBe(true);
    expect(isMilestoneDueSoon({ status: 'in_progress', dueDate: '2026-10-22' }, now)).toBe(true);
  });

  it('orders by importance: overdue and nearest first, undated after, finished last', () => {
    const items = [
      { id: 'later', status: 'todo', dueDate: '2026-11-26' },
      { id: 'done-old', status: 'completed', dueDate: '2026-08-01' },
      { id: 'undated', status: 'todo', dueDate: null },
      { id: 'overdue', status: 'todo', dueDate: '2026-10-09' },
      { id: 'soon', status: 'in_progress', dueDate: '2026-10-24' },
      { id: 'done-new', status: 'completed', dueDate: '2026-10-06' },
    ];
    expect(orderMilestones(items, now).map((m) => m.id)).toEqual(['overdue', 'soon', 'later', 'undated', 'done-new', 'done-old']);
  });
});
