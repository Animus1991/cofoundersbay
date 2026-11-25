'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { DateBadge } from '@/components/common/DateBadge';
import { SectionLink } from '@/components/home/SectionLink';
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
  const going = event.viewerRsvp === 'going'
    ? { en: 'Going', el: 'Θα πάτε' }
    : event.viewerRsvp === 'interested' ? { en: 'Interested', el: 'Σας ενδιαφέρει' } : null;
  return (
    <Link
      href={`/events/${event.id}`}
      aria-label={bilingualAria(`${event.title} — ${fullDate}${going ? ` — ${going.en}` : ''}`, `${event.title} — ${fullDate}${going ? ` — ${going.el}` : ''}`)}
      className="focus-ring group w-[160px] max-w-[220px] shrink-0 grow basis-[160px] snap-start rounded-xl"
    >
      {/* The photo is placed, not flowed: the phone rule `#main-content img
          { height: auto }` left it shorter than its 16:10 frame, and the
          "Going" mark fell under it (docs §143). */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
        {event.coverImageUrl && !cover.failed ? (
          <img ref={cover.ref} onError={cover.onError} src={event.coverImageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" data-fill="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 bg-status-warning-bg" aria-hidden="true" />
        )}
        <DateBadge date={start} size="sm" />
        {/* What the reader already said yes to, on the cover itself (docs §143). */}
        {going ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-card/95 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
            <BilingualText en={going.en} el={going.el} compact />
          </span>
        ) : null}
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
          {/* "Coming up", not "for you": the strip is the next six, in date
              order, for everyone (docs §143). */}
          <h2 id="home-events" className="card-title"><BilingualText en="Coming up" el="Επόμενες εκδηλώσεις" compact /></h2>
        </div>
        <SectionLink href="/events" en="All" el="Όλες" />
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-gutter:stable]" data-home-events="" aria-label="Coming up">
        {events.map((event) => <StripCard key={event.id} event={event} />)}
      </div>
    </section>
  );
}
