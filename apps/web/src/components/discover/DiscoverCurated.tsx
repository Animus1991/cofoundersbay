'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { listEvents, listGroups } from '@/lib/api';
import { discoverEl, discoverEn } from '@/lib/i18n/strings-discover';
import { formatShortDate } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { qk } from '@/lib/query-keys';

type Row = { id: string; href: string; title: string; fact: string; image: string | null };

/**
 * One picked row: a picture, a name, one fact. A person who does not yet know
 * what to look for gets something to look at, and the whole card is the link.
 * On a phone the row scrolls sideways instead of adding a screen of height.
 */
function CuratedRow({ title, titleEl, href, rows }: { title: string; titleEl: string; href: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="min-w-0 space-y-3" data-curated-row="">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="card-title"><BilingualText en={title} el={titleEl} compact /></h2>
        <Link href={href} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
          <BilingualText en={discoverEn('curated_all')} el={discoverEl('curated_all')} compact />
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {rows.map((row) => (
          <li key={row.id} className="w-60 shrink-0 snap-start sm:w-auto">
            <Link href={row.href} className="block h-full overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30">
              {row.image ? (
                <img src={row.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-28 w-full object-cover" />
              ) : null}
              <div className="space-y-0.5 p-3">
                <p className="line-clamp-2 text-sm font-medium text-foreground">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.fact}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Under the people: what is happening, for someone browsing rather than searching. */
export function DiscoverCurated() {
  const { primary } = useLanguagePreference();
  const events = useQuery({
    queryKey: qk('events', 'upcoming', 'curated'),
    queryFn: () => listEvents({ scope: 'upcoming', limit: 3 }),
    staleTime: 60_000,
    retry: 0,
  });
  const groups = useQuery({
    queryKey: qk('groups', 'curated'),
    queryFn: () => listGroups({ sort: 'popular', limit: 3 }),
    staleTime: 60_000,
    retry: 0,
  });

  const eventRows: Row[] = (events.data?.events ?? []).slice(0, 3).map((event) => ({
    id: event.id,
    href: `/events/${event.id}`,
    title: event.title,
    fact: [formatShortDate(event.startAt, primary === 'el' ? 'el' : 'en'), event.location].filter(Boolean).join(' · '),
    image: event.coverImageUrl,
  }));
  const groupRows: Row[] = (groups.data?.groups ?? []).slice(0, 3).map((group) => ({
    id: group.id,
    href: `/groups/${group.slug}`,
    title: group.name,
    fact: primary === 'el' ? `${group.memberCount.toLocaleString('el-GR')} μέλη` : `${group.memberCount.toLocaleString('en-GB')} members`,
    image: group.coverImageUrl,
  }));

  return (
    <div className="space-y-6 border-t border-border pt-6" data-discover-curated="">
      <CuratedRow title={discoverEn('curated_events')} titleEl={discoverEl('curated_events')} href="/events" rows={eventRows} />
      <CuratedRow title={discoverEn('curated_groups')} titleEl={discoverEl('curated_groups')} href="/groups" rows={groupRows} />
    </div>
  );
}
