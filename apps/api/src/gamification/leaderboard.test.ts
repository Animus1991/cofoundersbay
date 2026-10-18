import { describe, expect, it } from 'vitest';
import { rankLeaderboard, type LeaderboardCandidate } from './leaderboard';

const member = (userId: string, eventXp: number, extra: Partial<LeaderboardCandidate> = {}): LeaderboardCandidate => ({
  userId,
  eventXp,
  badgeXp: 0,
  active: true,
  profile: { displayName: userId.toUpperCase(), avatarUrl: null, headline: null, visibilityRules: null },
  ...extra,
});

describe('the leaderboard', () => {
  it('ranks by the same total a member sees for themselves: event XP plus badge rewards', () => {
    const view = rankLeaderboard([member('a', 300), member('b', 200, { badgeXp: 150 }), member('me', 100)], 'me', 10);
    expect(view.entries.map((e) => [e.userId, e.rank, e.totalXp])).toEqual([['b', 1, 350], ['a', 2, 300], ['me', 3, 100]]);
    expect(view.me).toMatchObject({ rank: 3, totalXp: 100, xpToEnter: null });
  });

  it('leaves out suspended members, members without XP and members hidden from search, but always shows the reader', () => {
    const hidden = { displayName: 'H', avatarUrl: null, headline: null, visibilityRules: { search: 'hidden' } };
    const view = rankLeaderboard([
      member('a', 300),
      member('banned', 900, { active: false }),
      member('zero', 0),
      member('hidden', 800, { profile: hidden }),
      member('me', 50, { profile: hidden }),
    ], 'me', 10);
    const ids = view.entries.map((e) => e.userId);
    expect(ids).not.toContain('banned');
    expect(ids).not.toContain('zero');
    expect(ids).toEqual(['a', 'me']);
  });

  it('gives ties one rank and lists them by name', () => {
    const view = rankLeaderboard([member('c', 100), member('a', 100), member('b', 50)], 'b', 10);
    expect(view.entries.map((e) => [e.userId, e.rank])).toEqual([['a', 1], ['c', 1], ['b', 3]]);
  });

  it('tells a reader below the board how much XP gets them onto it', () => {
    const view = rankLeaderboard([member('a', 500), member('b', 400), member('c', 300), member('me', 120)], 'me', 3);
    expect(view.entries).toHaveLength(3);
    expect(view.me).toMatchObject({ rank: 4, totalXp: 120, xpToEnter: 181 });
  });

  it('works for a reader with no XP yet', () => {
    const view = rankLeaderboard([member('a', 500)], 'me', 10);
    expect(view.me).toMatchObject({ rank: null, totalXp: 0, xpToEnter: null });
  });
});
