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
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeCheck,
  Globe,
  Filter,
} from 'lucide-react';
import { listMentorBookings, updateMentorBooking, createMentorBooking, searchProfiles, summarizeMeetingNotes, type MentorBookingItem, type SearchHit, type MeetingNotesSummary } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { LocalTime } from '@/components/common/LocalTime';

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  confirmed: 'bg-status-success-bg text-status-success border-status-success-border',
  completed: 'bg-primary/15 text-primary-accessible border-primary/30',
  cancelled: 'bg-destructive/15 text-destructive-accessible border-destructive/30',
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
  matchScore?: number;       // 0-100
  availabilityStatus?: 'available' | 'busy' | 'limited'; // derived
  isVerified?: boolean;
  isRemote?: boolean;
  responseTime?: string;     // e.g. "Responds in 2h"
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

const AVAIL_CONFIG = {
  available: { label: 'Available', color: 'text-status-success ', bg: 'bg-status-success-bg', dot: 'bg-emerald-500' },
  busy:      { label: 'Busy',      color: 'text-status-danger',                            bg: 'bg-status-danger-bg',     dot: 'bg-red-500'     },
  limited:   { label: 'Limited',   color: 'text-status-warning',                          bg: 'bg-status-warning-bg',   dot: 'bg-amber-500'   },
} as const;

const PRICE_FILTERS = ['Any', 'Free', 'Paid'] as const;
type PriceFilter = typeof PRICE_FILTERS[number];

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
  const avail = mentor.availabilityStatus ?? 'available';
  const availCfg = AVAIL_CONFIG[avail];
  // No invented fallback: a mentor the engine has not scored shows no pill,
  // rather than a number between 70 and 95 that changes on every render.
  const matchPct = mentor.matchScore ?? null;

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300">
      <CardContent className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
              <AvatarImage src={mentor.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold text-sm">
                {mentor.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={cn('absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-background', availCfg.dot)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profiles/${mentor.id}`} className="inline-flex tap-target-y items-center font-semibold text-foreground transition-colors hover:text-primary-accessible">
                {mentor.displayName}
              </Link>
              {mentor.isVerified && <BadgeCheck className="icon-sm text-primary-accessible shrink-0" />}
              {mentor.isFeatured && (
                <Badge variant="secondary" className="gap-1 text-2xs px-1.5 py-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />Featured
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="icon-sm fill-status-warning text-status-warning" />
                <span className="font-medium text-foreground">{mentor.rating > 0 ? mentor.rating.toFixed(1) : 'New'}</span>
                {mentor.totalSessions > 0 && <span>({mentor.totalSessions})</span>}
              </span>
              {mentor.location && (
                <span className="flex items-center gap-1"><MapPin className="icon-sm" />{mentor.location}</span>
              )}
              {mentor.isRemote && (
                <span className="flex items-center gap-1"><Globe className="icon-sm text-status-info" />Remote</span>
              )}
            </div>
          </div>

          {/* Match score pill */}
          {matchPct != null && (
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-2',
                matchPct >= 85 ? 'bg-primary/15 text-primary-accessible ring-primary/30'
                : matchPct >= 70 ? 'bg-status-success-bg text-status-success ring-emerald-500/30'
                : 'bg-muted text-muted-foreground ring-border',
              )}>
                {matchPct}%
              </div>
              <span className="text-2xs text-muted-foreground">match</span>
            </div>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{mentor.bio}</p>

        {/* Expertise tags */}
        <div className="flex flex-wrap gap-1">
          {mentor.expertise.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-md bg-secondary/60 px-2 py-0.5 text-2xs text-secondary-foreground">{skill}</span>
          ))}
          {mentor.expertise.length > 4 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-2xs text-muted-foreground">+{mentor.expertise.length - 4}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            {mentor.hourlyRate ? (
              <span className="flex items-center gap-0.5 text-sm font-semibold text-foreground">
                <DollarSign className="icon-sm text-primary-accessible" />{mentor.hourlyRate}/hr
              </span>
            ) : (
              <Badge variant="outline" className="text-2xs border-status-success-border text-status-success bg-status-success-bg">Free</Badge>
            )}
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium', availCfg.bg, availCfg.color)}>
              {availCfg.label}
            </span>
          </div>
          <Button size="sm" onClick={onBook} className="gap-1.5 h-8 text-xs">
            <Calendar className="icon-sm" />Book
          </Button>
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
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as 'video' | 'in_person' | 'chat')}>
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
              {submitting && <Loader2 className="icon-sm animate-spin" />}
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

  const [showNotes, setShowNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [aiSummary, setAISummary] = useState<MeetingNotesSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const { success: _ns, error: notifyError } = useToast();

  const handleSummarize = async () => {
    if (!sessionNotes.trim()) return;
    setSummarizing(true);
    try {
      const { summary } = await summarizeMeetingNotes(sessionNotes);
      setAISummary(summary);
    } catch {
      notifyError('AI unavailable', 'Could not generate summary right now.');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <Card className="card-interactive">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Link href={`/profiles/${otherUserId}`}>
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={other.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold">
                {other.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link
                href={`/profiles/${otherUserId}`}
                className="inline-flex tap-target-y items-center font-semibold text-foreground transition-colors hover:text-primary-accessible"
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
                <Calendar className="icon-sm" />
                {start.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="icon-sm" />
                <LocalTime value={start} />
                {' – '}
                <LocalTime value={end} />
              </span>
              <span className="flex items-center gap-1">
                <Video className="icon-sm" />
                {booking.meetingType}
              </span>
            </div>

            {booking.notes && (
              <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                &ldquo;{booking.notes}&rdquo;
              </p>
            )}

            {isPast && (booking.status === 'completed' || booking.status === 'confirmed') && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-accessible hover:text-primary/80 transition-colors"
                >
                  <FileText className="icon-sm" />
                  Session Notes & AI Summary
                  {showNotes ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                </button>
                {showNotes && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      placeholder="Add your session notes, key points, decisions..."
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-primary-accessible border-primary/30 hover:bg-primary/5"
                      onClick={handleSummarize}
                      disabled={summarizing || !sessionNotes.trim()}
                    >
                      {summarizing ? <Loader2 className="icon-sm animate-spin" /> : <Sparkles className="icon-sm" />}
                      {summarizing ? 'Summarizing...' : 'Summarize with AI'}
                    </Button>
                    {aiSummary && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="icon-sm text-primary-accessible" />
                          <span className="text-xs font-semibold text-primary-accessible">AI Summary</span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{aiSummary.summary}</p>
                        {aiSummary.actionItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Action Items:</p>
                            <ul className="space-y-0.5">
                              {aiSummary.actionItems.map((item, i) => (
                                <li key={i} className="flex items-start gap-1 text-xs text-foreground">
                                  <CheckCircle className="icon-sm text-primary-accessible mt-0.5 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSummary.followUps.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Follow-ups:</p>
                            <ul className="space-y-0.5">
                              {aiSummary.followUps.map((f, i) => (
                                <li key={i} className="text-xs text-muted-foreground">• {f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {booking.meetingUrl && booking.status === 'confirmed' && (
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary-accessible hover:underline"
              >
                <ExternalLink className="icon-sm" />
                Join meeting
              </a>
            )}
          </div>

          {!isPast && (
            <div className="flex shrink-0 gap-2">
              {isMentor && booking.status === 'requested' && (
                <>
                  <Button size="sm" className="gap-1" onClick={onConfirm} disabled={isActing}>
                    {isActing ? <Loader2 className="icon-sm animate-spin" /> : <CheckCircle className="icon-sm" />}
                    Confirm
                  </Button>
                  <Button aria-label="Decline" size="sm" variant="ghost" onClick={onDecline} disabled={isActing}
                    className="text-muted-foreground hover:text-destructive-accessible">
                    <XCircle className="icon-sm" />
                  </Button>
                </>
              )}
              {!isMentor && booking.status === 'requested' && (
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isActing}
                  className="text-muted-foreground hover:text-destructive-accessible">
                  Cancel
                </Button>
              )}
              {booking.status === 'confirmed' && (
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isActing}
                  className="text-muted-foreground hover:text-destructive-accessible">
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
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('Any');
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

  const filteredMentors = mentorHits.filter((m) => {
    if (priceFilter === 'Free') return !m.hourlyRate;
    if (priceFilter === 'Paid') return !!m.hourlyRate;
    return true;
  });

  // Counted from the mentors on screen, not asserted. A directory that has not
  // been rated yet says so rather than borrowing a plausible-looking 4.8.
  const ratedMentors = filteredMentors.filter((m) => m.rating > 0);
  const avgRating = ratedMentors.length
    ? (ratedMentors.reduce((sum, m) => sum + m.rating, 0) / ratedMentors.length).toFixed(1)
    : null;
  const sessionsDone = filteredMentors.reduce((sum, m) => sum + m.totalSessions, 0);

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
      <div className="pb-10">
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="find" className="gap-2">
            <Search className="icon-sm" />
            Find Mentors
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="icon-sm" />
            My Sessions
            {upcomingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {upcomingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Expert Mentors', value: filteredMentors.length, icon: GraduationCap, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
              { label: 'Avg Rating', value: avgRating ? `${avgRating}★` : '—', icon: Star, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
              { label: 'Sessions Done', value: sessionsDone, icon: Users, color: 'text-status-success', bg: 'bg-status-success-bg' },
            ].map((s) => {
              const SIcon = s.icon;
              return (
                <Card key={s.label} className="border-border/40">
                  <CardContent className="flex items-center gap-2.5 p-3">
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                      <SIcon className="icon-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mentors by name, expertise, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Price filter */}
            <div className="flex items-center gap-2">
              <Filter className="icon-sm text-muted-foreground shrink-0" />
              {PRICE_FILTERS.map((pf) => (
                <button
                  key={pf}
                  onClick={() => setPriceFilter(pf)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    priceFilter === pf
                      ? 'border-primary bg-primary/15 text-primary-accessible'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >{pf}</button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {EXPERTISE_FILTERS.map((expertise) => (
                <button
                  key={expertise}
                  onClick={() => setSelectedExpertise(expertise)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                    selectedExpertise === expertise
                      ? 'border-primary bg-primary/20 text-primary-accessible'
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <MentorSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {featuredMentors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="icon-sm text-primary-accessible" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Featured Mentors
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  askAiPrompt="No mentors are listed. What kind of mentor should a first-time founder look for, and how do I book a session?"
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Tabs value={sessionsTab} onValueChange={(v) => setSessionsTab(v as typeof sessionsTab)}>
            <TabsList>
              <TabsTrigger value="upcoming" className="gap-2">
                <Calendar className="icon-sm" />
                Upcoming
                {upcomingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {upcomingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <BookOpen className="icon-sm" />
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
                    askAiPrompt="I have no mentoring sessions. Recommend who to book and what to ask in the first call."
                    action={
                      t === 'upcoming' ? (
                        <Button variant="secondary" className="gap-2" onClick={() => setMainTab('find')}>
                          <GraduationCap className="icon-sm" />
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
      </div>
    </AppShell>
  );
}
