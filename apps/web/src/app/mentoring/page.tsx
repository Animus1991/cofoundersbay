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
  Star,
  MapPin,
  DollarSign,
  Search,
  Award,
  TrendingUp,
} from 'lucide-react';
import { listMentorBookings, updateMentorBooking, createMentorBooking, searchProfiles, type MentorBookingItem, type SearchHit } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  confirmed: 'bg-green-500/15 text-green-500 border-green-500/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
  declined: 'bg-muted text-muted-foreground border-border',
};

interface Mentor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  expertise: string[];
  hourlyRate?: number;
  rating: number;
  totalSessions: number;
  location?: string;
  isFeatured?: boolean;
}

function hitToMentor(hit: SearchHit): Mentor {
  const rp = (hit as unknown as { rolePayload?: Record<string, unknown> }).rolePayload ?? {};
  const expertise = Array.isArray(rp.expertiseAreas)
    ? (rp.expertiseAreas as string[])
    : hit.skillNames ?? [];
  const hourlyRate = typeof rp.hourlyRate === 'string' ? parseFloat(rp.hourlyRate) : undefined;
  return {
    id: hit.userId,
    displayName: hit.displayName,
    avatarUrl: hit.avatarUrl ?? null,
    bio: hit.bio ?? '',
    expertise: expertise.slice(0, 5),
    hourlyRate: hourlyRate && !isNaN(hourlyRate) ? hourlyRate : undefined,
    rating: 0,
    totalSessions: 0,
    location: hit.location ?? undefined,
    isFeatured: false,
  };
}

const EXPERTISE_FILTERS = [
  'All',
  'Product Strategy',
  'Fundraising',
  'Growth Marketing',
  'Tech Architecture',
  'B2B Sales',
  'User Research',
];

function MentorCard({ mentor, onBook }: { mentor: Mentor; onBook: () => void }) {
  return (
    <Card className="card-interactive hover-lift group transition-all duration-300">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={mentor.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg">
              {mentor.displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <Link
                  href={`/profiles/${mentor.id}`}
                  className="font-display text-lg font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {mentor.displayName}
                </Link>
                {mentor.isFeatured && (
                  <Badge variant="secondary" className="ml-2 gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-foreground">{mentor.rating.toFixed(1)}</span>
                <span>({mentor.totalSessions} sessions)</span>
              </div>
              {mentor.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {mentor.location}
                  </div>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {mentor.bio}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {mentor.expertise.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              {mentor.hourlyRate && (
                <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {mentor.hourlyRate}/hour
                </div>
              )}
              <Button size="sm" onClick={onBook} className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Book Session
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingModal({
  mentor,
  open,
  onClose,
  onBook,
}: {
  mentor: Mentor | null;
  open: boolean;
  onClose: () => void;
  onBook: (mentorId: string, startAt: string, endAt: string, meetingType: 'video' | 'in_person' | 'chat', notes: string) => Promise<void>;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [meetingType, setMeetingType] = useState<'video' | 'in_person' | 'chat'>('video');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { error: showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor || !date || !time) return;
    setSubmitting(true);
    try {
      const startAt = new Date(`${date}T${time}`).toISOString();
      const endAt = new Date(new Date(`${date}T${time}`).getTime() + parseInt(duration) * 60000).toISOString();
      await onBook(mentor.id, startAt, endAt, meetingType, notes);
      setDate(''); setTime(''); setNotes('');
      onClose();
    } catch (err) {
      showError('Booking failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mentor) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Session with {mentor.displayName}</DialogTitle>
          <DialogDescription>
            Choose your preferred date, time, and session details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-type">Meeting Type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger id="meeting-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="What would you like to discuss?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {mentor.hourlyRate && (
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Cost:</span>
                <span className="font-semibold text-foreground">
                  ${((mentor.hourlyRate * parseInt(duration)) / 60).toFixed(0)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Request Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

function MentorSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MentoringPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [mainTab, setMainTab] = useState<'find' | 'sessions'>('find');
  const [sessionsTab, setSessionsTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [mentorHits, setMentorHits] = useState<Mentor[]>([]);

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

  // Load real mentors from search API
  const { isLoading: mentorsQueryLoading, isError: mentorsError } = useQuery({
    queryKey: ['mentors', searchQuery, selectedExpertise],
    queryFn: async () => {
      const expertise = selectedExpertise !== 'All' ? [selectedExpertise] : undefined;
      const res = await searchProfiles({
        q: searchQuery.trim() || undefined,
        roles: ['mentor'],
        skills: expertise,
        limit: 24,
      });
      setMentorHits(res.hits.map(hitToMentor));
      return res;
    },
    staleTime: 60_000,
    enabled: mainTab === 'find',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['mentoring-bookings'],
    queryFn: () => listMentorBookings('all'),
    enabled: mainTab === 'sessions',
    staleTime: 30_000,
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

  const filteredMentors = mentorHits;

  const featuredMentors = filteredMentors.filter((m) => m.isFeatured);
  const regularMentors = filteredMentors.filter((m) => !m.isFeatured);

  const allBookings = data?.bookings ?? [];
  const now = new Date();

  const filteredBookings = allBookings.filter((b) => {
    const end = new Date(b.endAt);
    if (sessionsTab === 'upcoming') return end >= now && b.status !== 'cancelled';
    if (sessionsTab === 'past') return end < now || b.status === 'completed';
    return true;
  });

  const upcomingCount = allBookings.filter(
    (b) => new Date(b.endAt) >= now && b.status !== 'cancelled',
  ).length;

  const handleBookMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setBookingModalOpen(true);
  };

  const handleCreateBooking = async (mentorId: string, startAt: string, endAt: string, meetingType: 'video' | 'in_person' | 'chat', notes: string) => {
    await createMentorBooking({ mentorId, startAt, endAt, meetingType, notes: notes || undefined });
    queryClient.invalidateQueries({ queryKey: ['mentoring-bookings'] });
    success('Booking requested!', 'Your session request has been sent to the mentor.');
  };

  return (
    <AppShell
      title="Mentoring"
      description="Find expert mentors and manage your sessions"
    >
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="find" className="gap-2">
            <Search className="h-4 w-4" />
            Find Mentors
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            My Sessions
            {upcomingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {upcomingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mentors by name, expertise, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {EXPERTISE_FILTERS.map((expertise) => (
                <button
                  key={expertise}
                  onClick={() => setSelectedExpertise(expertise)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                    selectedExpertise === expertise
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {expertise}
                </button>
              ))}
            </div>
          </div>

          {mentorsError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">Failed to load mentors.</p>
            </CardContent></Card>
          ) : mentorsQueryLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <MentorSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {featuredMentors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Featured Mentors
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {featuredMentors.map((mentor) => (
                      <MentorCard key={mentor.id} mentor={mentor} onBook={() => handleBookMentor(mentor)} />
                    ))}
                  </div>
                </div>
              )}

              {regularMentors.length > 0 && (
                <div className="space-y-3">
                  {featuredMentors.length > 0 && (
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Mentors</h2>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {regularMentors.map((mentor) => (
                      <MentorCard key={mentor.id} mentor={mentor} onBook={() => handleBookMentor(mentor)} />
                    ))}
                  </div>
                </div>
              )}

              {filteredMentors.length === 0 && (
                <EmptyState
                  illustration="search"
                  title="No mentors found"
                  description="No mentor profiles have been created yet. Mentors who register and complete their profile will appear here."
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Tabs value={sessionsTab} onValueChange={(v) => setSessionsTab(v as typeof sessionsTab)}>
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
                ) : filteredBookings.length === 0 ? (
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
                        <Button variant="secondary" className="gap-2" onClick={() => setMainTab('find')}>
                          <GraduationCap className="h-4 w-4" />
                          Find a mentor
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  filteredBookings.map((b) => (
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
        </TabsContent>
      </Tabs>

      <BookingModal
        mentor={selectedMentor}
        open={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedMentor(null);
        }}
        onBook={handleCreateBooking}
      />
    </AppShell>
  );
}
