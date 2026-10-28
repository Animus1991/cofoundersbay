import { describe, expect, it } from 'vitest';
import { orderAchievements } from './achievement-order';

const a = (id: string, unlocked: boolean | null, progress: number, total: number, unlockedAt?: string) => ({
  id, unlocked, progress, total, unlockedAt: unlockedAt ? new Date(unlockedAt) : undefined,
});

describe('the order achievements are listed in (docs §111)', () => {
  it('puts earned first (newest leading), then the closest to done, then the rest', () => {
    const list = [
      a('locked-none', false, 0, 10),
      a('half', false, 5, 10),
      a('earned-old', true, 1, 1, '2024-01-15'),
      a('unknown', null, 0, 1),
      a('nearly', false, 9, 10),
      a('earned-new', true, 1, 1, '2024-02-20'),
    ];
    expect(orderAchievements(list).map((x) => x.id)).toEqual(['earned-new', 'earned-old', 'nearly', 'half', 'locked-none', 'unknown']);
  });

  it('keeps the API order within a group, and does not touch the input', () => {
    const list = [a('x', false, 0, 5), a('y', false, 0, 5)];
    expect(orderAchievements(list).map((x) => x.id)).toEqual(['x', 'y']);
    expect(list.map((x) => x.id)).toEqual(['x', 'y']);
  });
});
