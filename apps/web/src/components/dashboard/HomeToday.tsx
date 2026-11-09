'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { useLiveNotices, type LiveNotice } from '@/components/notifications/LiveNotices';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { listNotifications } from '@/lib/api';
import { nowStartingPoints, type HomeAskNow } from '@/lib/home-ask';
import { qk } from '@/lib/query-keys';
import { readLastVisit, sinceLastVisit } from '@/lib/since-last-visit';
import { bilingualAria } from '@/lib/i18n/format';

export type TodayRow = {
  key: string;
  href: string;
  glyph: CfbGlyphName;
  en: string;
  el: string;
  count?: number;
  ask: { en: string; el: string };
};

const NOTICE_GLYPH: Record<string, CfbGlyphName> = { commitment: 'pact', 'follow-up': 'chart', milestone: 'flag' };
const NOW_HREF: Record<string, string> = { 'now-intros': '/connections', 'now-messages': '/messages', 'now-notifications': '/notifications' };

const fromNotice = (notice: LiveNotice, ask?: HomeAskNow): TodayRow => ({
  key: notice.key,
  href: notice.href,
  glyph: NOTICE_GLYPH[notice.key] ?? 'bell',
  en: notice.en,
  el: notice.el,
  ask: ask?.prompt ?? { en: `What should I do next here: ${notice.en}`, el: `Τι να κάνω στη συνέχεια εδώ: ${notice.el}` },
});

const fromNow = (action: HomeAskNow): TodayRow => ({
  key: action.id,
  href: NOW_HREF[action.id] ?? '/notifications',
  glyph: action.glyph ?? 'bell',
  en: action.en,
  el: action.el,
  count: action.count,
  ask: action.prompt ?? { en: action.en, el: action.el },
});

/**
 * Everything that waits on the reader, in one order: a person first, because
 * someone is waiting on the other side; then what has a date; then what can
 * be read at leisure. The chips and the flash above the page said the same
 * things in three places with no order between them. Each row keeps both ways
 * in: the page itself, and asking the assistant about it.
 */
export function todayRows(notices: LiveNotice[], now: HomeAskNow[]): TodayRow[] {
  const notice = (key: string) => notices.find((item) => item.key === key);
  const action = (id: string) => now.find((item) => item.id === id);
  const rows: Array<TodayRow | null> = [
    notice('commitment') ? fromNotice(notice('commitment')!) : null,
    action('now-intros') ? fromNow(action('now-intros')!) : null,
    notice('follow-up') ? fromNotice(notice('follow-up')!, action('now-followups')) : null,
    action('now-messages') ? fromNow(action('now-messages')!) : null,
    notice('milestone') ? fromNotice(notice('milestone')!) : null,
    action('now-notifications') ? fromNow(action('now-notifications')!) : null,
  ];
  return rows.filter((row): row is TodayRow => row !== null);
}

/** What waits on the reader, in Today's order: the card here, the count on the first page. */
export function useTodayRows() {
  const counts = useUnreadCounts();
  const { notices, followUps } = useLiveNotices();
  return { rows: todayRows(notices, nowStartingPoints({ ...counts, followUps: followUps.length })) };
}

export function HomeToday() {
  const { ask } = useAskAssistant();
  const { rows } = useTodayRows();
  // After mount: the clock and the storage are the reader's, not the server's.
  const [lastVisit, setLastVisit] = useState<number | null>(null);
  useEffect(() => { setLastVisit(readLastVisit()); }, []);
  const { data: recent } = useQuery({
    queryKey: qk('notifications', 'recent'),
    queryFn: () => listNotifications({ limit: 30 }),
    enabled: lastVisit !== null,
    staleTime: 60_000,
    retry: 0,
  });
  const since = sinceLastVisit(recent?.notifications ?? [], lastVisit);
  if (rows.length === 0 && !since) return null;
  return (
    <Card data-home-today="">
      <CardContent className="space-y-2">
        <h2 className="card-title"><BilingualText en="Today" el="Σήμερα" compact /></h2>
        {since ? <p className="text-xs text-muted-foreground" data-home-since=""><BilingualText en={since.en} el={since.el} compact wrap /></p> : null}
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3 py-2">
              <span data-keep-icon="" className="shrink-0 text-muted-foreground" aria-hidden="true"><CfbGlyph name={row.glyph} className="icon-sm" /></span>
              <Link href={row.href} className="min-w-0 flex-1 text-sm text-foreground hover:text-primary-accessible">
                <BilingualText en={row.en} el={row.el} compact wrap />
                {row.count ? <span className="ml-1.5 tabular-nums text-muted-foreground">{row.count}</span> : null}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                aria-label={bilingualAria(`Ask about: ${row.en}`, `Ρωτήστε για: ${row.el}`)}
                onClick={() => ask(row.ask)}
              >
                <BilingualText en="Ask" el="Ρωτήστε" compact />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
