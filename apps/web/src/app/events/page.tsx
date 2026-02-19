'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Grid, List, MapPin, Plus, Search, Video } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCard, EventCardSkeleton, type EventData } from '@/components/events/EventCard';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { useToast } from '@/components/ui/toast';
import { listEvents, rsvpEvent, type EventItem } from '@/lib/api';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type EventFilter = 'all' | 'online' | 'in-person' | 'hybrid';

function toEventData(item: EventItem): EventData {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.mode,
    startDate: new Date(item.startAt),
    endDate: new Date(item.endAt),
    location: item.location ?? undefined,
    meetingUrl: item.meetingUrl ?? undefined,
    coverImage: item.coverImageUrl ?? undefined,
    hostName: item.host.displayName,
    hostAvatar: item.host.avatarUrl ?? undefined,
    hostRole: item.host.role,
    attendeesCount: item.attendeesCount,
    maxAttendees: item.capacity ?? undefined,
    isRsvped: item.viewerRsvp === 'going' || item.viewerRsvp === 'interested',
    tags: [item.eventType.replaceAll('_', ' ')],
  };
}

export default function EventsPage() {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my-events' | 'past'>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [eventsRaw, setEventsRaw] = useState<EventItem[]>([]);

  const hasToken = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const scope =
          activeTab === 'my-events' ? 'mine' : activeTab === 'past' ? 'past' : 'upcoming';
        if (scope === 'mine' && !hasToken) {
          if (!cancelled) setEventsRaw([]);
          return;
        }
        const res = await listEvents({
          scope,
          q: searchQuery.trim() || undefined,
          mode: filter === 'all' ? undefined : filter,
          limit: 48,
        });
        if (!cancelled) setEventsRaw(res.events);
      } catch (e) {
        if (!cancelled) {
          setEventsRaw([]);
          showError('Failed to load events', e instanceof Error ? e.message : 'Please try again');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, filter, hasToken, searchQuery, showError]);

  const events = useMemo(() => eventsRaw.map(toEventData), [eventsRaw]);
  const featured = viewMode === 'grid' ? events[0] : null;
  const rest = viewMode === 'grid' ? events.slice(1) : events;

  const handleRsvp = async (event: EventItem) => {
    try {
      const nextStatus = event.viewerRsvp === 'going' ? 'not_going' : 'going';
      await rsvpEvent(event.id, nextStatus);
      setEventsRaw((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? {
                ...item,
                viewerRsvp: nextStatus,
                attendeesCount:
                  item.attendeesCount + (nextStatus === 'going' ? 1 : item.viewerRsvp === 'going' ? -1 : 0),
              }
            : item,
        ),
      );
      success('RSVP updated', nextStatus === 'going' ? 'You are going to this event' : 'RSVP removed');
    } catch (e) {
      showError('RSVP failed', e instanceof Error ? e.message : 'Please try again');
    }
  };

  const handleShare = (event: EventData) => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    success('Link copied', 'Event link copied to clipboard');
  };

  return (
    <AppShell
      title="Events"
      description="Discover networking events, workshops, and meetups"
      actions={
        <Link href="/events/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="my-events" className="gap-2">
              My Events
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              Past
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {(['all', 'online', 'in-person', 'hybrid'] as EventFilter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize gap-1"
              >
                {f === 'online' && <Video className="h-3 w-3" />}
                {f === 'in-person' && <MapPin className="h-3 w-3" />}
                {f}
              </Button>
            ))}
          </div>
        </div>

        {(['upcoming', 'my-events', 'past'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {loading ? (
              <div className={cn('grid gap-4', viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <EventCardSkeleton key={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                title={tab === 'my-events' ? 'No events yet' : 'No events found'}
                description={
                  tab === 'my-events'
                    ? hasToken
                      ? "You have not RSVP'd to any events yet."
                      : 'Sign in to view your event activity.'
                    : searchQuery || filter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No events available right now'
                }
                illustration="calendar"
                action={
                  tab === 'my-events' && !hasToken ? (
                    <Link href="/login">
                      <Button>Sign in</Button>
                    </Link>
                  ) : (
                    <Link href="/events/create">
                      <Button>Create an event</Button>
                    </Link>
                  )
                }
              />
            ) : (
              <>
                {featured && (
                  <div className="mb-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Featured</h2>
                    <EventCard
                      event={featured}
                      variant="featured"
                      onRsvp={() => {
                        const raw = eventsRaw.find((x) => x.id === featured.id);
                        if (raw) void handleRsvp(raw);
                      }}
                      onShare={() => handleShare(featured)}
                    />
                  </div>
                )}

                <AnimatedList
                  animation="fade-in-up"
                  staggerDelay={50}
                  className={cn(
                    'grid gap-4',
                    viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
                  )}
                >
                  {rest.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                      onRsvp={() => {
                        const raw = eventsRaw.find((x) => x.id === event.id);
                        if (raw) void handleRsvp(raw);
                      }}
                      onShare={() => handleShare(event)}
                    />
                  ))}
                </AnimatedList>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
