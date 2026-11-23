'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCoverFailed } from '@/hooks/useCoverFailed';
import {
  MapPin,
  Users,
  Video,
  Share2,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, initialsOf } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CardHead } from '@/components/common/CardAnatomy';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { FactLine } from '@/components/common/FactLine';
import { PhotoChip } from '@/components/common/PhotoChip';

export type EventData = {
  id: string;
  title: string;
  description: string;
  type: 'online' | 'in-person' | 'hybrid';
  startDate: Date;
  endDate: Date;
  location?: string;
  meetingUrl?: string;
  coverImage?: string;
  hostName: string;
  hostAvatar?: string;
  hostRole: string;
  attendeesCount: number;
  maxAttendees?: number;
  isRsvped?: boolean;
  tags?: string[];
};

type EventCardProps = {
  event: EventData;
  variant?: 'default' | 'featured' | 'compact';
  onRsvp?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  className?: string;
};

function formatEventTime(start: Date, end: Date): string {
  // 24-hour digits read the same in both languages ("18:30 - 20:00").
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${startTime} - ${endTime}`;
}

const EVENT_TYPE_LABEL: Record<string, { en: string; el: string }> = {
  online: { en: 'Online', el: 'Διαδικτυακή' },
  'in-person': { en: 'In person', el: 'Δια ζώσης' },
  in_person: { en: 'In person', el: 'Δια ζώσης' },
  hybrid: { en: 'Hybrid', el: 'Υβριδική' },
};

/** The format as a word in the reader's language, not the API's identifier. */
function EventTypeLabel({ type }: { type: string }) {
  const label = EVENT_TYPE_LABEL[type];
  return label ? <BilingualText en={label.en} el={label.el} compact /> : <>{type}</>;
}

function EventTypeIcon({ type }: { type: EventData['type'] }) {
  switch (type) {
    case 'online':
      return <Video className="icon-sm" />;
    case 'in-person':
      return <MapPin className="icon-sm" />;
    case 'hybrid':
      return (
        <div className="flex">
          <Video className="icon-sm" />
          <MapPin className="icon-sm -ml-1" />
        </div>
      );
  }
}

export function EventCard({
  event,
  variant = 'default',
  onRsvp,
  onShare,
  onBookmark,
  isBookmarked = false,
  className,
}: EventCardProps) {
  const fmtDate = useDateFormat();
  const cover = useCoverFailed(event.coverImage);
  const [rsvped, setRsvped] = useState(event.isRsvped || false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleRsvp = () => {
    setRsvped(!rsvped);
    onRsvp?.();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const isFull = event.maxAttendees ? event.attendeesCount >= event.maxAttendees : false;
  const spotsLeft = event.maxAttendees ? event.maxAttendees - event.attendeesCount : null;

  if (variant === 'compact') {
    return (
      <Card className={cn('group hover:border-primary/30 transition-colors', className)}>
        {/* The default card's head, compact: the date mark, the title and
            when beside it, the kind and the count under it on the mark's
            edge, RSVP at the right. It was a column beside the date. */}
        <CardContent className="space-y-2">
          <CardHead
            mark={(
              <div data-card-mark="" className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-status-warning-bg leading-none">
                <span className="text-2xs text-primary-accessible">
                  {fmtDate(event.startDate, { month: 'short' })}
                </span>
                <span className="mt-0.5 text-sm font-bold tabular-nums text-primary-accessible">
                  {event.startDate.getDate()}
                </span>
              </div>
            )}
            title={(
              <Link href={`/events/${event.id}`} className="line-clamp-2 transition-colors hover:text-primary-accessible">
                {event.title}
              </Link>
            )}
            subtitle={formatEventTime(event.startDate, event.endDate)}
            asideStays
            aside={(
              <Button
                size="sm"
                variant={rsvped ? 'secondary' : 'default'}
                onClick={handleRsvp}
                aria-pressed={rsvped}
                disabled={isFull && !rsvped}
                className="flex-shrink-0"
              >
                {rsvped ? (
                  <>
                    <CheckCircle className="icon-sm mr-1" />
                    <BilingualText en="Going" el="Θα έρθω" compact />
                  </>
                ) : isFull ? (
                  <BilingualText en="Full" el="Πλήρες" compact />
                ) : (
                  <BilingualText en="Going" el="Θα έρθω" compact />
                )}
              </Button>
            )}
          />
          <FactLine
            items={[
              <EventTypeLabel key="kind" type={event.type} />,
              <BilingualText key="count" en={`${event.attendeesCount} attending`} el={`${event.attendeesCount} συμμετέχουν`} compact />,
            ]}
          />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className={cn('group overflow-hidden', className)}>
        {/* Cover image. On a phone the card is the first screen's: a lower
            cover, and the sentence, the host and the tags left to the event's
            page, so "Going" is in view and the next card shows under it
            (docs §115). */}
        {event.coverImage && (
          <div className={cn('relative overflow-hidden', cover.failed ? 'h-24 bg-status-warning-bg' : 'h-48 max-sm:h-28')}>
            {cover.failed ? null : (
              <>
                <img
                  ref={cover.ref}
                  onError={cover.onError}
                  src={event.coverImage}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </>
            )}
            {/* Date badge */}
            <div className="absolute top-4 left-4">
              <div className="rounded-lg bg-background/90 backdrop-blur-sm px-3 py-2 text-center">
                <span className="text-xs font-medium text-primary-accessible block">
                  {fmtDate(event.startDate, { month: 'short' })}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {event.startDate.getDate()}
                </span>
              </div>
            </div>
            {/* Type: an opaque chip, so it reads on any photo. */}
            <div className="absolute top-4 right-4">
              <PhotoChip>
                <EventTypeIcon type={event.type} />
                <EventTypeLabel type={event.type} />
              </PhotoChip>
            </div>
          </div>
        )}
        
        <CardContent className="pt-4">
          <Link
            href={`/events/${event.id}`}
            className="card-title text-foreground hover:text-primary-accessible transition-colors"
          >
            {event.title}
          </Link>
          
          <p className="card-body mt-2 text-muted-foreground line-clamp-2 max-sm:hidden">
            {event.description}
          </p>
          
          {/* Meta */}
          <FactLine
            className="mt-3"
            items={[
              `${fmtDate(event.startDate, { weekday: 'short', month: 'short', day: 'numeric' })}, ${formatEventTime(event.startDate, event.endDate)}`,
              event.location,
            ]}
          />
          
          {/* Host */}
          <div className="mt-4 flex items-center gap-3 max-sm:hidden">
            <Avatar className="h-8 w-8">
              {/* The name sits beside it, so the photo is decorative (WCAG 1.1.1). */}
              <AvatarImage src={event.hostAvatar || undefined} alt="" />
              <AvatarFallback className="bg-primary/20 text-primary-accessible text-xs">
                {initialsOf(event.hostName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{event.hostName}</p>
              <p className="text-xs card-meta text-muted-foreground">{event.hostRole}</p>
            </div>
          </div>
          
          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <FactLine className="mt-4 max-sm:hidden" items={event.tags} />
          )}
          
          {/* Actions */}
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-border max-sm:mt-3 max-sm:pt-3">
            <FactLine
              items={[
                <BilingualText key="count" en={`${event.attendeesCount} attending`} el={`${event.attendeesCount} συμμετέχουν`} compact />,
                spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10
                  ? <span key="spots" className="text-status-warning"><BilingualText en={`${spotsLeft} spots left`} el={`${spotsLeft} θέσεις ακόμη`} compact /></span>
                  : null,
              ]}
            />
            <div className="flex items-center gap-2">
              <Button aria-label="Save"
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className={cn('gap-1.5 sm:w-auto sm:px-3', bookmarked && 'text-status-warning ')}
              >
                <Bookmark className={cn('icon-sm', bookmarked && 'fill-current')} />
                <span className="hidden sm:inline"><BilingualText en="Save" el="Αποθήκευση" compact /></span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onShare} aria-label={`Share event ${event.title}`} className="gap-1.5 sm:w-auto sm:px-3">
                <Share2 className="icon-sm" />
                <span className="hidden sm:inline"><BilingualText en="Share" el="Κοινοποίηση" compact /></span>
              </Button>
              <Button
                variant={rsvped ? 'secondary' : 'default'}
                onClick={handleRsvp}
                aria-pressed={rsvped}
                disabled={isFull && !rsvped}
              >
                {rsvped ? (
                  <>
                    <CheckCircle className="icon-sm mr-2" />
                    <BilingualText en="Going" el="Θα έρθω" compact />
                  </>
                ) : isFull ? (
                  <BilingualText en="Full" el="Πλήρες" compact />
                ) : (
                  <BilingualText en="Going" el="Θα έρθω" compact />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant: the image leads — a 16:9 cover (the category's warning
  // wash when there is none) with the date badge on it; then the title, the
  // where·when, who runs it, and the one RSVP verb (docs §130.3).
  const fullDate = fmtDate(event.startDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Card className={cn('group overflow-hidden hover:border-primary/30 transition-colors', className)}>
      <div className="relative aspect-video w-full overflow-hidden">
        {event.coverImage && !cover.failed ? (
          <img ref={cover.ref} onError={cover.onError} src={event.coverImage} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-status-warning-bg" aria-hidden="true" />
        )}
        {/* Date badge on the cover: a solid card square so it reads on any
            photo; the sr-only line carries the full date (docs §130.3). */}
        <div data-card-mark="" className="absolute left-3 top-3">
          <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-card text-center shadow-sm">
            <span className="text-sm font-bold tabular-nums text-primary-accessible" aria-hidden="true">
              {event.startDate.getDate()}
            </span>
            <span className="card-meta leading-none text-muted-foreground" aria-hidden="true">
              {fmtDate(event.startDate, { month: 'short' })}
            </span>
          </div>
          <span className="sr-only">{fullDate}</span>
        </div>
        {/* The format chip is opaque: the same read on photo and wash. */}
        <div className="absolute right-3 top-3">
          <PhotoChip>
            <EventTypeIcon type={event.type} />
            <EventTypeLabel type={event.type} />
          </PhotoChip>
        </div>
      </div>
      <CardContent className="space-y-3">
        <CardHead
          title={(
            <Link
              href={`/events/${event.id}`}
              className="line-clamp-2 hover:text-primary-accessible transition-colors"
            >
              {event.title}
            </Link>
          )}
          subtitle={`${event.location ? `${event.location} · ` : ''}${formatEventTime(event.startDate, event.endDate)}`}
        />

        {/* Who runs it: a small avatar and the name on the card's axis. */}
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={event.hostAvatar || undefined} alt="" />
            <AvatarFallback className="bg-status-warning-bg text-[0.625rem] text-primary-accessible">{initialsOf(event.hostName)}</AvatarFallback>
          </Avatar>
          <span className="card-meta min-w-0 truncate text-muted-foreground">
            <BilingualText en={`By ${event.hostName}`} el={`Από ${event.hostName}`} compact />
          </span>
          <span className="card-meta inline-flex shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-hidden="true">{event.attendeesCount}</span>
            <span className="sr-only">
              <BilingualText en={`${event.attendeesCount} attending`} el={`${event.attendeesCount} συμμετέχουν`} compact />
            </span>
          </span>
        </div>

        {/* Actions, on the card's axis. */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button
            variant={rsvped ? 'secondary' : 'default'}
            size="sm"
            onClick={handleRsvp}
            aria-pressed={rsvped}
            disabled={isFull && !rsvped}
          >
            {rsvped ? (
              <>
                <CheckCircle className="icon-sm mr-1" />
                <BilingualText en="Going" el="Θα έρθω" compact />
              </>
            ) : isFull ? (
              <BilingualText en="Full" el="Πλήρες" compact />
            ) : (
              <BilingualText en="Going" el="Θα έρθω" compact />
            )}
          </Button>
          <Button aria-label="Save"
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={cn('h-8 w-8 gap-1.5 sm:w-auto sm:px-3', bookmarked && 'text-status-warning ')}
          >
            <Bookmark className={cn('icon-sm', bookmarked && 'fill-current')} />
            <span className="hidden sm:inline"><BilingualText en="Save" el="Αποθήκευση" compact /></span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Event card skeleton
export function EventCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' | 'compact' }) {
  if (variant === 'featured') {
    return (
      <Card>
        <div className="h-48 bg-secondary animate-pulse" />
        <CardContent className="pt-4 space-y-4">
          <div className="h-6 w-3/4 bg-secondary rounded animate-pulse" />
          <div className="h-4 w-full bg-secondary rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-secondary rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-secondary rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Same box the card draws: the 16:9 cover, then the title and two lines.
  return (
    <Card>
      <div className="aspect-video w-full bg-secondary animate-pulse" />
      <CardContent className="space-y-2 pt-4">
        <div className="h-5 w-3/4 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-secondary rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
