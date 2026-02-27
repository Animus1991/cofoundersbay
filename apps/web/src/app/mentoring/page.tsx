'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { listMentorBookings, updateMentorBooking, type MentorBookingItem } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  confirmed: 'bg-green-500/15 text-green-500 border-green-500/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
  declined: 'bg-muted text-muted-foreground border-border',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function BookingCard({
  booking,
  userId,
  onConfirm,
  onDecline,
  onCancel,
  isActing,
}: {
  booking: MentorBookingItem;
  userId: string | null;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
  isActing: boolean;
}) {
  const isMentor = booking.mentorId === userId;
  const other = isMentor ? booking.mentee : booking.mentor;
  const otherUserId = isMentor ? booking.menteeId : booking.mentorId;
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const isPast = end < new Date();

  return (
    <Card className="card-interactive">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Avatar + name */}
          <Link href={`/profiles/${otherUserId}`}>
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={other.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {other.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link
                href={`/profiles/${otherUserId}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {other.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">
                {isMentor ? '(mentee)' : '(mentor)'}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs', STATUS_COLORS[booking.status] ?? '')}
              >
                {booking.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                {booking.meetingType}
              </span>
            </div>

            {booking.notes && (
              <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                &ldquo;{booking.notes}&rdquo;
              </p>
            )}

            {booking.meetingUrl && booking.status === 'confirmed' && (
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Join meeting
              </a>
            )}
          </div>

          {/* Actions */}
          {!isPast && (
            <div className="flex shrink-0 gap-2">
              {isMentor && booking.status === 'requested' && (
                <>
                  <Button size="sm" className="gap-1" onClick={onConfirm} disabled={isActing}>
                    {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onDecline} disabled={isActing}
                    className="text-muted-foreground hover:text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {!isMentor && booking.status === 'requested' && (
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isActing}
                  className="text-muted-foreground hover:text-destructive">
                  Cancel
                </Button>
              )}
              {booking.status === 'confirmed' && (
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isActing}
                  className="text-muted-foreground hover:text-destructive">
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-60" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MentoringPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const userId =
    typeof window !== 'undefined'
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('user') ?? 'null')?.id ?? null;
          } catch {
            return null;
          }
        })()
      : null;

  const { data, isLoading } = useQuery({
    queryKey: ['mentoring-bookings'],
    queryFn: () => listMentorBookings('all'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: MentorBookingItem['status'] }) =>
      updateMentorBooking(bookingId, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-bookings'] });
      const label = vars.status === 'confirmed' ? 'confirmed' : 'cancelled';
      success(`Session ${label}`, `The booking has been ${label}.`);
    },
    onError: (err) => showError('Action failed', err instanceof Error ? err.message : 'Please try again'),
  });

  const allBookings = data?.bookings ?? [];
  const now = new Date();

  const filtered = allBookings.filter((b) => {
    const end = new Date(b.endAt);
    if (tab === 'upcoming') return end >= now && b.status !== 'cancelled';
    if (tab === 'past') return end < now || b.status === 'completed';
    return true;
  });

  const upcomingCount = allBookings.filter(
    (b) => new Date(b.endAt) >= now && b.status !== 'cancelled',
  ).length;

  return (
    <AppShell
      title="Mentoring"
      description="Manage your mentoring sessions and availability"
      actions={
        <Link href="/discover?role=mentor">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Find a mentor
          </Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main: bookings */}
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="upcoming" className="gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming
                {upcomingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {upcomingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Past
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {(['upcoming', 'past', 'all'] as const).map((t) => (
              <TabsContent key={t} value={t} className="mt-4 space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <BookingSkeleton key={i} />)
                ) : filtered.length === 0 ? (
                  <EmptyState
                    illustration="calendar"
                    title={t === 'upcoming' ? 'No upcoming sessions' : t === 'past' ? 'No past sessions' : 'No sessions yet'}
                    description={
                      t === 'upcoming'
                        ? 'Browse mentors and request a session to get started.'
                        : 'Your completed sessions will appear here.'
                    }
                    action={
                      t === 'upcoming' ? (
                        <Link href="/discover?role=mentor">
                          <Button variant="secondary" className="gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Find a mentor
                          </Button>
                        </Link>
                      ) : undefined
                    }
                  />
                ) : (
                  filtered.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      userId={userId}
                      isActing={updateMutation.isPending}
                      onConfirm={() => updateMutation.mutate({ bookingId: b.id, status: 'confirmed' })}
                      onDecline={() => updateMutation.mutate({ bookingId: b.id, status: 'cancelled' })}
                      onCancel={() => updateMutation.mutate({ bookingId: b.id, status: 'cancelled' })}
                    />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Sidebar: quick info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                <p>Browse mentors in <Link href="/discover?role=mentor" className="text-primary hover:underline">Discover</Link> and view their profiles.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
                <p>Request a session by choosing a date, time, and type.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
                <p>Once confirmed, join the meeting via the link provided.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Total sessions',
                  value: allBookings.length,
                },
                {
                  label: 'Upcoming',
                  value: upcomingCount,
                },
                {
                  label: 'Completed',
                  value: allBookings.filter((b) => b.status === 'completed').length,
                },
                {
                  label: 'As mentor',
                  value: allBookings.filter((b) => b.mentorId === userId).length,
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-secondary/40 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
