'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus, Clock, ExternalLink, MapPin, Share2, Users, Video } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getEvent, rsvpEvent, type EventItem } from '@/lib/api';
import { cn } from '@/lib/utils';

type Rsvp = 'going' | 'interested' | 'not_going';

const RSVP_OPTIONS: { value: Rsvp; en: string; el: string }[] = [
  { value: 'going', en: 'Going', el: 'Θα έρθω' },
  { value: 'interested', en: 'Interested', el: 'Ενδιαφέρομαι' },
  { value: 'not_going', en: 'Not going', el: 'Δεν θα έρθω' },
];

/** RFC 5545 UTC timestamp: 20260924T170000Z. */
function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** RFC 5545 text escaping for SUMMARY / DESCRIPTION / LOCATION. */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function downloadIcs(event: EventItem) {
  const url = `${window.location.origin}/events/${event.id}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CoFounderBay//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@cofounderbay`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(event.startAt)}`,
    `DTEND:${icsStamp(event.endAt || event.startAt)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(`${event.description ?? ''}\n\n${url}`.trim())}`,
    event.location ? `LOCATION:${icsText(event.location)}` : event.meetingUrl ? `LOCATION:${icsText(event.meetingUrl)}` : '',
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event'}.ics`;
  a.click();
  URL.revokeObjectURL(href);
}

/**
 * One event.
 *
 * Every event card, the events list's Share action and the calendar linked to
 * /events/:id, and the route did not exist - each of those links ended on a
 * 404. GET /events/:eventId was already served (with the viewer's RSVP), so
 * this page reads it and offers what the card offers - RSVP, calendar,
 * share - plus the description, the host and the meeting link.
 */
export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => getEvent(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 0,
  });
  const event = data?.event ?? null;

  const respond = async (status: Rsvp) => {
    if (!event) return;
    try {
      await rsvpEvent(event.id, status);
      queryClient.setQueryData(['events', 'detail', id], (old: { event: EventItem } | undefined) =>
        old
          ? {
              event: {
                ...old.event,
                viewerRsvp: status,
                attendeesCount:
                  old.event.attendeesCount +
                  (status === 'going' && old.event.viewerRsvp !== 'going' ? 1 : 0) -
                  (status !== 'going' && old.event.viewerRsvp === 'going' ? 1 : 0),
              },
            }
          : old,
      );
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      success('RSVP updated');
    } catch (e) {
      showError('RSVP failed', e instanceof Error ? e.message : 'Sign in and try again.');
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${id}`);
      success('Link copied', 'Event link copied to clipboard');
    } catch {
      showError('Could not copy', 'The browser refused clipboard access.');
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Event" titleEl="Εκδήλωση">
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !event) {
    return (
      <AppShell title="Event not found" titleEl="Η εκδήλωση δεν βρέθηκε">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              <BilingualText
                en="This event does not exist, was removed, or is not visible to you."
                el="Η εκδήλωση δεν υπάρχει, αφαιρέθηκε ή δεν είναι ορατή σε εσάς."
                compact
                wrap
              />
            </p>
            <Button variant="outline" className="mt-4 gap-2" asChild>
              <Link href="/events">
                <ArrowLeft className="icon-sm" aria-hidden="true" />
                <BilingualText en="All events" el="Όλες οι εκδηλώσεις" compact />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const tz = event.timezone || undefined;
  const when = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: tz, timeZoneName: 'short',
  });
  const ended = new Date(event.endAt || event.startAt).getTime() < Date.now();
  const full = event.capacity != null && event.attendeesCount >= event.capacity && event.viewerRsvp !== 'going';

  return (
    <AppShell
      title={event.title}
      description={event.eventType.replaceAll('_', ' ')}
      askAi={`Help me prepare for the event "${event.title}".`}
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadIcs(event)}>
            <CalendarPlus className="icon-sm" aria-hidden="true" />
            <BilingualText en="Add to calendar" el="Προσθήκη στο ημερολόγιο" compact />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void share()}>
            <Share2 className="icon-sm" aria-hidden="true" />
            <BilingualText en="Share" el="Κοινοποίηση" compact />
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {event.coverImageUrl && (
            <img src={event.coverImageUrl} alt="" className="aspect-[3/1] w-full rounded-2xl object-cover" />
          )}
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="flex items-start gap-2 text-sm">
                <Clock className="mt-0.5 icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  {when.format(new Date(event.startAt))}
                  {event.endAt && <> – {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date(event.endAt))}</>}
                </span>
              </p>
              <p className="flex items-start gap-2 text-sm">
                {event.isOnline ? (
                  <Video className="mt-0.5 icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <MapPin className="mt-0.5 icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="capitalize">{event.mode.replace('-', ' ')}</span>
                {event.location && <span className="text-muted-foreground">· {event.location}</span>}
              </p>
              {event.meetingUrl && event.viewerRsvp === 'going' && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-accessible hover:underline"
                >
                  <ExternalLink className="icon-sm" aria-hidden="true" />
                  <BilingualText en="Join link" el="Σύνδεσμος συμμετοχής" compact />
                </a>
              )}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="icon-sm shrink-0" aria-hidden="true" />
                {event.attendeesCount}
                {event.capacity != null && ` / ${event.capacity}`}
                <BilingualText en="attending" el="συμμετέχουν" compact />
              </p>
            </CardContent>
          </Card>
          {event.description && (
            <Card>
              <CardContent className="p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-semibold">
                <BilingualText en="Your RSVP" el="Η απάντησή σας" compact />
              </p>
              {ended ? (
                <Badge variant="secondary"><BilingualText en="This event has ended" el="Η εκδήλωση ολοκληρώθηκε" compact /></Badge>
              ) : (
                <div className="grid gap-2" role="radiogroup" aria-label="RSVP">
                  {RSVP_OPTIONS.map((o) => (
                    <Button
                      key={o.value}
                      role="radio"
                      aria-checked={event.viewerRsvp === o.value}
                      variant={event.viewerRsvp === o.value ? 'default' : 'outline'}
                      size="sm"
                      disabled={o.value === 'going' && full}
                      onClick={() => void respond(o.value)}
                      className={cn('justify-start')}
                    >
                      <BilingualText en={o.en} el={o.el} compact />
                    </Button>
                  ))}
                  {full && (
                    <p className="text-xs text-muted-foreground">
                      <BilingualText en="The event is at capacity." el="Η εκδήλωση είναι πλήρης." compact />
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Avatar className="h-10 w-10">
                <AvatarImage src={event.host?.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{event.host?.displayName?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground"><BilingualText en="Hosted by" el="Διοργανωτής" compact /></p>
                {event.host?.id ? (
                  <Link href={`/profiles/${event.host.id}`} className="truncate text-sm font-medium hover:text-primary-accessible">
                    {event.host.displayName}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">—</span>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
