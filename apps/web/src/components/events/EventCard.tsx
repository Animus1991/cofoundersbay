'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ExternalLink,
  Share2,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

function formatEventDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatEventTime(start: Date, end: Date): string {
  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startTime} - ${endTime}`;
}

function EventTypeIcon({ type }: { type: EventData['type'] }) {
  switch (type) {
    case 'online':
      return <Video className="icon-sm" aria-hidden="true" />;
    case 'in-person':
      return <MapPin className="icon-sm" aria-hidden="true" />;
    case 'hybrid':
      return (
        <div className="flex">
          <Video className="icon-sm" aria-hidden="true" />
          <MapPin className="icon-sm -ml-1" aria-hidden="true" />
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
      <Card className={cn('group hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Date box */}
            <div className="flex-shrink-0 text-center">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-primary-emphasis">
                  {event.startDate.toLocaleDateString([], { month: 'short' })}
                </span>
                <span className="text-lg font-bold text-primary-emphasis">
                  {event.startDate.getDate()}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/events/${event.id}`}
                className="font-semibold text-foreground hover:text-primary-emphasis transition-colors line-clamp-1"
              >
                {event.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="icon-2xs" aria-hidden="true" />
                {formatEventTime(event.startDate, event.endDate)}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <EventTypeIcon type={event.type} />
                  {event.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {event.attendeesCount} attending
                </span>
              </div>
            </div>
            
            {/* RSVP */}
            <Button
              size="sm"
              variant={rsvped ? 'secondary' : 'default'}
              onClick={handleRsvp}
              disabled={isFull && !rsvped}
              className="flex-shrink-0"
            >
              {rsvped ? (
                <>
                  <CheckCircle className="icon-sm mr-1" aria-hidden="true" />
                  Going
                </>
              ) : isFull ? (
                'Full'
              ) : (
                'RSVP'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className={cn('group overflow-hidden', className)}>
        {/* Cover image */}
        {event.coverImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            {/* Date badge */}
            <div className="absolute top-4 left-4">
              <div className="rounded-lg bg-background/90 backdrop-blur-sm px-3 py-2 text-center">
                <span className="text-xs font-medium text-primary-emphasis block">
                  {event.startDate.toLocaleDateString([], { month: 'short' })}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {event.startDate.getDate()}
                </span>
              </div>
            </div>
            {/* Type badge */}
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="gap-1">
                <EventTypeIcon type={event.type} />
                {event.type}
              </Badge>
            </div>
          </div>
        )}
        
        <CardContent className="pt-4">
          <Link
            href={`/events/${event.id}`}
            className="text-xl font-bold text-foreground hover:text-primary-emphasis transition-colors"
          >
            {event.title}
          </Link>
          
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
          
          {/* Meta */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="icon-sm" aria-hidden="true" />
              {formatEventDate(event.startDate)} • {formatEventTime(event.startDate, event.endDate)}
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="icon-sm" aria-hidden="true" />
                {event.location}
              </div>
            )}
          </div>
          
          {/* Host */}
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.hostAvatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-emphasis text-xs">
                {event.hostName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{event.hostName}</p>
              <p className="text-xs text-muted-foreground">{event.hostRole}</p>
            </div>
          </div>
          
          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/40">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="icon-sm" aria-hidden="true" />
              {event.attendeesCount} attending
              {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                <span className="text-amber-600 dark:text-amber-400">• {spotsLeft} spots left</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button aria-label="Save"
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className={cn(bookmarked && 'text-amber-500 dark:text-amber-400')}
              >
                <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} aria-hidden="true" />
              </Button>
              <Button aria-label="Share" variant="ghost" size="icon" onClick={onShare}>
                <Share2 className="icon-sm" aria-hidden="true" />
              </Button>
              <Button
                variant={rsvped ? 'secondary' : 'default'}
                onClick={handleRsvp}
                disabled={isFull && !rsvped}
              >
                {rsvped ? (
                  <>
                    <CheckCircle className="icon-sm mr-2" aria-hidden="true" />
                    Going
                  </>
                ) : isFull ? (
                  'Full'
                ) : (
                  'RSVP'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardContent className="pt-5">
        <div className="flex gap-4">
          {/* Date box */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-primary-emphasis">
                {event.startDate.toLocaleDateString([], { month: 'short' })}
              </span>
              <span className="text-2xl font-bold text-primary-emphasis">
                {event.startDate.getDate()}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/events/${event.id}`}
                className="font-semibold text-foreground hover:text-primary-emphasis transition-colors line-clamp-2"
              >
                {event.title}
              </Link>
              <Badge variant="outline" className="flex-shrink-0 gap-1">
                <EventTypeIcon type={event.type} />
                {event.type}
              </Badge>
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatEventTime(event.startDate, event.endDate)}
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
            
            {/* Host & attendees */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={event.hostAvatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary-emphasis text-2xs">
                    {event.hostName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">by {event.hostName}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {event.attendeesCount} attending
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-border/40">
          <Button aria-label="Save"
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={cn('h-8 w-8', bookmarked && 'text-amber-500 dark:text-amber-400')}
          >
            <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} aria-hidden="true" />
          </Button>
          <Button
            variant={rsvped ? 'secondary' : 'default'}
            size="sm"
            onClick={handleRsvp}
            disabled={isFull && !rsvped}
          >
            {rsvped ? (
              <>
                <CheckCircle className="icon-sm mr-1" aria-hidden="true" />
                Going
              </>
            ) : isFull ? (
              'Full'
            ) : (
              'RSVP'
            )}
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

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex gap-4">
          <div className="h-16 w-16 bg-secondary rounded-xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-secondary rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
