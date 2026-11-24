import { describe, expect, it } from 'vitest';
import { dedupeWaitingRows } from './home-waiting';
import type { TodayRow } from '@/components/dashboard/HomeToday';

const row = (key: string): TodayRow => ({
  key,
  href: '/x',
  glyph: 'bell',
  en: key,
  el: key,
  ask: { en: key, el: key },
});

describe('dedupeWaitingRows', () => {
  const rows = [row('commitment'), row('milestone'), row('now-messages')];

  it('drops the milestone row when Continue carries the next milestone', () => {
    const kept = dedupeWaitingRows(rows, { id: 'm1' });
    expect(kept.map((r) => r.key)).toEqual(['commitment', 'now-messages']);
  });

  it('keeps every row when there is no next milestone', () => {
    expect(dedupeWaitingRows(rows, null)).toHaveLength(3);
    expect(dedupeWaitingRows(rows, undefined)).toHaveLength(3);
  });
});
