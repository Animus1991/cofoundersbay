/**
 * Who viewed your profile, the way a professional network shows it, with two
 * rules the usual version lacks:
 *
 * - Reciprocal and opt-in. A member is named to the people whose profiles
 *   they open only after turning on "Show my name when I view profiles" (off
 *   by default), and a member who views privately sees no names either.
 * - k-anonymous. Everyone else is a count; private viewers are grouped by role
 *   only where a role holds at least `PRIVATE_GROUP_MIN` of them, so a group
 *   of one never singles a person out.
 *
 * One rule for the API and the demo world.
 */

export const VIEWERS_WINDOW_DAYS = 90;
/** The smallest group of private viewers a role is named for. */
export const PRIVATE_GROUP_MIN = 3;
/** Named viewers shown at most. */
export const NAMED_VIEWERS_LIMIT = 20;

export const PROFILE_VIEW_SOURCES = ['direct', 'search', 'recommendation', 'group', 'event', 'external'] as const;
export type ProfileViewSource = (typeof PROFILE_VIEW_SOURCES)[number];

export function readViewSource(value: unknown): ProfileViewSource {
  return typeof value === 'string' && (PROFILE_VIEW_SOURCES as readonly string[]).includes(value) ? (value as ProfileViewSource) : 'direct';
}

export const PROFILE_VIEWERS_COPY = {
  setting: {
    en: 'Show my name when I view profiles',
    el: 'Να φαίνεται το όνομά μου όταν βλέπω προφίλ',
  },
  settingHelp: {
    en: 'Off by default. When it is on, the people whose profiles you open can see it was you, and you can see who among your viewers did the same. When it is off, you are counted, never named, and you see counts only.',
    el: 'Απενεργοποιημένο από προεπιλογή. Όταν είναι ενεργό, όσοι των οποίων ανοίγετε το προφίλ βλέπουν ότι ήσασταν εσείς, και βλέπετε ποιοι από τους επισκέπτες σας έκαναν το ίδιο. Όταν είναι ανενεργό, μετράτε χωρίς να κατονομάζεστε, και βλέπετε μόνο πλήθη.',
  },
} as const;

/** One recorded view, joined with what the summary may need about its viewer. */
export interface ProfileViewRow {
  viewerId: string | null;
  viewedAt: string | Date;
}

export interface ViewerPerson {
  id: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  role: string | null;
  /** Their own setting: named when they view. */
  shareName: boolean;
}

export interface NamedViewer {
  id: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  role: string | null;
  lastViewedAt: string;
  views: number;
}

export interface ProfileViewersView {
  windowDays: number;
  /** Every recorded view in the window, signed in or not. */
  totalViews: number;
  /** Distinct signed-in members who viewed. */
  members: number;
  /** Named to this reader: they share their name and so does the reader. */
  named: NamedViewer[];
  /** Signed-in viewers this reader cannot see by name. */
  privateCount: number;
  /** Private viewers by role, only for roles with at least `PRIVATE_GROUP_MIN`. */
  privateByRole: Array<{ role: string; count: number }>;
  /** Views from people who were not signed in (the public page). */
  signedOutViews: number;
  readerSharesName: boolean;
}

/**
 * Summarises the views of a profile for its owner. Views older than the
 * window are ignored; a viewer counts once among members however often they
 * looked; a viewer with no person row (deleted since) counts as private.
 */
export function summariseViewers(
  rows: readonly ProfileViewRow[],
  people: ReadonlyMap<string, ViewerPerson>,
  opts: { readerSharesName: boolean; now: number; readerId?: string },
): ProfileViewersView {
  const since = opts.now - VIEWERS_WINDOW_DAYS * 86_400_000;
  const perViewer = new Map<string, { last: number; views: number }>();
  let totalViews = 0;
  let signedOutViews = 0;
  for (const row of rows) {
    const at = new Date(row.viewedAt).getTime();
    if (!Number.isFinite(at) || at < since || at > opts.now + 60_000) continue;
    if (row.viewerId && row.viewerId === opts.readerId) continue;
    totalViews += 1;
    if (!row.viewerId) {
      signedOutViews += 1;
      continue;
    }
    const seen = perViewer.get(row.viewerId);
    if (seen) {
      seen.views += 1;
      seen.last = Math.max(seen.last, at);
    } else {
      perViewer.set(row.viewerId, { last: at, views: 1 });
    }
  }

  const named: NamedViewer[] = [];
  const privateRoles = new Map<string, number>();
  let privateCount = 0;
  for (const [id, { last, views }] of perViewer) {
    const person = people.get(id);
    if (person && opts.readerSharesName && person.shareName) {
      named.push({
        id,
        displayName: person.displayName,
        headline: person.headline,
        avatarUrl: person.avatarUrl,
        role: person.role,
        lastViewedAt: new Date(last).toISOString(),
        views,
      });
    } else {
      privateCount += 1;
      const role = person?.role ?? 'member';
      privateRoles.set(role, (privateRoles.get(role) ?? 0) + 1);
    }
  }
  named.sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt));
  const privateByRole = [...privateRoles.entries()]
    .filter(([, count]) => count >= PRIVATE_GROUP_MIN)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));

  return {
    windowDays: VIEWERS_WINDOW_DAYS,
    totalViews,
    members: perViewer.size,
    named: named.slice(0, NAMED_VIEWERS_LIMIT),
    privateCount,
    privateByRole,
    signedOutViews,
    readerSharesName: opts.readerSharesName,
  };
}
