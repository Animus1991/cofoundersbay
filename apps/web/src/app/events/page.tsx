'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Calendar, Grid, List, MapPin, Plus, Search, Video, CheckCircle2 } from 'lucide-react';
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
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { Card, CardContent } from '@/components/ui/card';

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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my-events' | 'past'>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const hasToken = useIsAuthenticated();

  const scope = activeTab === 'my-events' ? 'mine' : activeTab === 'past' ? 'past' : 'upcoming';

  const { data: eventsResult, isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['events', scope, searchQuery, filter],
    queryFn: () =>
      listEvents({
        scope,
        q: searchQuery.trim() || undefined,
        mode: filter === 'all' ? undefined : filter,
        limit: 48,
      }),
    enabled: scope !== 'mine' || hasToken,
    staleTime: 60_000,
    retry: 1,
  });

  const eventsRaw = eventsResult?.events ?? [];
  const events = useMemo(() => eventsRaw.map(toEventData), [eventsRaw]);
  const featured = viewMode === 'grid' ? events[0] : null;
  const rest = viewMode === 'grid' ? events.slice(1) : events;

  const handleRsvp = async (event: EventItem): Promise<void> => {
    try {
      const nextStatus = event.viewerRsvp === 'going' ? 'not_going' : 'going';
      await rsvpEvent(event.id, nextStatus);
      queryClient.setQueryData(
        ['events', scope, searchQuery, filter],
        (old: { events: EventItem[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            events: old.events.map((item) =>
              item.id === event.id
                ? {
                    ...item,
                    viewerRsvp: nextStatus,
                    attendeesCount:
                      item.attendeesCount + (nextStatus === 'going' ? 1 : item.viewerRsvp === 'going' ? -1 : 0),
                  }
                : item,
            ),
          };
        },
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
            <Plus className="icon-sm" aria-hidden="true" />
            Create Event
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 pb-10">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Events', value: events.length || '40+', icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Online', value: events.filter((e) => e.type === 'online').length || '15+', icon: Video, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'In-Person', value: events.filter((e) => e.type === 'in-person').length || '20+', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'RSVP\'d', value: events.filter((e) => e.isRsvped).length, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((s) => {
          const SIcon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm border-border/50">
              <CardContent className="flex items-center gap-2.5 p-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                  <SIcon className="icon-sm" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="icon-sm" aria-hidden="true" />
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
            <Button aria-label="Grid view"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="icon-sm" aria-hidden="true" />
            </Button>
            <Button aria-label="List view"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="icon-sm" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                {f === 'online' && <Video className="icon-sm" aria-hidden="true" />}
                {f === 'in-person' && <MapPin className="icon-sm" aria-hidden="true" />}
                {f}
              </Button>
            ))}
          </div>
        </div>

        {(['upcoming', 'my-events', 'past'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {isError ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-muted-foreground">Failed to load events.</p>
                <button onClick={() => refetch()} className="text-sm text-primary-emphasis hover:underline">Try again</button>
              </div>
            ) : loading ? (
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
      </div>
    </AppShell>
  );
}
