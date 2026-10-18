import { isHiddenFromSearch } from '@cofounderbay/shared';
import { computeLevel } from './gamification.types';

/** One member who could appear on the leaderboard, with their XP split as stored. */
export type LeaderboardCandidate = {
  userId: string;
  /** XP from events (the `XPEvent` rows). */
  eventXp: number;
  /** XP from badges awarded (each badge's `xpReward`), as `calculateUserXP` counts it. */
  badgeXp: number;
  /** Suspended and banned members never appear. */
  active: boolean;
  profile: {
    displayName: string;
    avatarUrl: string | null;
    headline: string | null;
    visibilityRules: unknown;
  } | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  totalXp: number;
  level: number;
  levelLabel: string;
  isMe: boolean;
};

export type LeaderboardView = {
  entries: LeaderboardEntry[];
  me: {
    /** Null when the reader is outside the members read for the board. */
    rank: number | null;
    totalXp: number;
    level: number;
    levelLabel: string;
    /** XP still needed to pass the last member shown, when the reader is not on the board. */
    xpToEnter: number | null;
  };
};

/**
 * Ranks members by total XP, the same total each member sees on their own
 * achievements page (event XP plus badge rewards), so "You" on the board and
 * "You" in the header are one number.
 *
 * Who appears: active members with a profile and some XP who have not hidden
 * their profile from search. The reader always sees their own place, hidden or
 * not. Ties share a rank (1, 2, 2, 4) and are listed by name.
 */
export function rankLeaderboard(candidates: LeaderboardCandidate[], viewerId: string, limit: number): LeaderboardView {
  const shown = candidates
    .filter((c) => c.active && c.profile && c.eventXp + c.badgeXp > 0)
    .filter((c) => c.userId === viewerId || !isHiddenFromSearch(c.profile?.visibilityRules))
    .map((c) => ({ ...c, totalXp: c.eventXp + c.badgeXp }))
    .sort((a, b) => b.totalXp - a.totalXp || (a.profile?.displayName ?? '').localeCompare(b.profile?.displayName ?? ''));

  const ranked: LeaderboardEntry[] = [];
  shown.forEach((c, i) => {
    const previous = ranked[i - 1];
    const rank = previous && previous.totalXp === c.totalXp ? previous.rank : i + 1;
    const { level, label } = computeLevel(c.totalXp);
    ranked.push({
      rank,
      userId: c.userId,
      displayName: c.profile?.displayName ?? '',
      avatarUrl: c.profile?.avatarUrl ?? null,
      headline: c.profile?.headline ?? null,
      totalXp: c.totalXp,
      level,
      levelLabel: label,
      isMe: c.userId === viewerId,
    });
  });

  const entries = ranked.slice(0, limit);
  const mine = ranked.find((e) => e.isMe);
  const viewer = candidates.find((c) => c.userId === viewerId);
  const myTotal = mine?.totalXp ?? (viewer ? viewer.eventXp + viewer.badgeXp : 0);
  const myLevel = computeLevel(myTotal);
  const onBoard = entries.some((e) => e.isMe);
  const last = entries[entries.length - 1];

  return {
    entries,
    me: {
      rank: mine?.rank ?? null,
      totalXp: myTotal,
      level: myLevel.level,
      levelLabel: myLevel.label,
      xpToEnter: !onBoard && last && entries.length >= limit ? Math.max(1, last.totalXp - myTotal + 1) : null,
    },
  };
}
