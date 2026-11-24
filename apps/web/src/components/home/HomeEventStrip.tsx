'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { SectionSticker } from '@/components/dashboard/SectionSticker';
import { useCoverFailed } from '@/hooks/useCoverFailed';
import { listEvents, type EventItem } from '@/lib/api';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { bilingualAria } from '@/lib/i18n/format';
import { qk } from '@/lib/query-keys';

const STRIP_LIMIT = 6;

function StripCard({ event }: { event: EventItem }) {
  const fmtDate = useDateFormat();
  const cover = useCoverFailed(event.coverImageUrl);
  const start = new Date(event.startAt);
  const fullDate = fmtDate(start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Link
      href={`/events/${event.id}`}
      aria-label={bilingualAria(`${event.title} — ${fullDate}`, `${event.title} — ${fullDate}`)}
      className="focus-ring group w-40 shrink-0 snap-start rounded-xl"
    >
      <div className="relative h-[100px] w-full overflow-hidden rounded-xl">
        {event.coverImageUrl && !cover.failed ? (
          <img ref={cover.ref} onError={cover.onError} src={event.coverImageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
        ) : (
          <div className="h-full w-full bg-status-warning-bg" aria-hidden="true" />
        )}
        <div className="absolute left-2 top-2">
          <div className="flex h-9 w-9 flex-col items-center justify-center rounded-lg bg-card text-center shadow-sm">
            <span className="text-xs font-bold tabular-nums text-primary-accessible" aria-hidden="true">{start.getDate()}</span>
            <span className="card-meta leading-none text-muted-foreground" aria-hidden="true">{fmtDate(start, { month: 'short' })}</span>
          </div>
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary-accessible">{event.title}</p>
    </Link>
  );
}

/**
 * The photo strip under the hero (docs §131.2): up to six upcoming events as
 * small covers with the date badge — the glance at what is on before the
 * lists begin. Hidden when nothing is on; all of them one tap away.
 */
export function HomeEventStrip() {
  const { data, isLoading } = useQuery({
    queryKey: qk('events', 'home-strip'),
    queryFn: () => listEvents({ scope: 'upcoming', limit: STRIP_LIMIT }),
    staleTime: 60_000,
    retry: 0,
  });
  const events = (data?.events ?? []).slice(0, STRIP_LIMIT);
  if (isLoading || events.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="home-events">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SectionSticker glyph="calendar" tint="warning" />
          <h2 id="home-events" className="card-title"><BilingualText en="Events for you" el="Εκδηλώσεις για εσάς" compact /></h2>
        </div>
        <Link href="/events" className="tap-extend-y text-sm font-medium text-primary-accessible hover:underline">
          <BilingualText en="All" el="Όλες" compact />
        </Link>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-gutter:stable]" data-home-events="" aria-label="Events for you">
        {events.map((event) => <StripCard key={event.id} event={event} />)}
      </div>
    </section>
  );
}
