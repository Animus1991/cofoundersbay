import type { PageSnapshot } from '@/contexts/PageSnapshotContext';

type HomeSnapshotInput = Omit<PageSnapshot, 'state' | 'figures'> & {
  loading: boolean;
  failed: boolean;
  demo: boolean;
  empty?: boolean;
  figures: Record<string, string | number | null | undefined>;
};

/** A snapshot of the visible screen, never another fetch or a guessed zero. */
export function homeSnapshot({ loading, failed, demo, empty, figures, ...screen }: HomeSnapshotInput): PageSnapshot {
  return {
    ...screen,
    state: failed ? 'error' : loading ? 'loading' : demo ? 'demo' : empty ? 'empty' : 'ready',
    figures: Object.fromEntries(Object.entries(figures).map(([key, value]) => [
      key, value == null || (typeof value === 'number' && !Number.isFinite(value)) ? '—' : value,
    ])),
  };
}

/** Deterministic attention ordering; the other items remain in the dashboard's lists. */
export function mentorHomePriority({ sessionSoon, bookings, requests, session }: {
  sessionSoon: boolean; bookings: number; requests: number; session: boolean;
}): 'soon' | 'booking' | 'request' | 'session' | null {
  if (sessionSoon && session) return 'soon';
  if (bookings > 0) return 'booking';
  if (requests > 0) return 'request';
  return session ? 'session' : null;
}