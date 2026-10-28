'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Calendar,
  Users,
  Loader2,
  BookOpen,
  Star,
  Search,
  Award,
  TrendingUp,
  BadgeCheck,
  X,
  MessageCircle,
  CalendarDays,
} from 'lucide-react';
import { listMentorBookings, updateMentorBooking, createMentorBooking, searchProfiles, getMyMentorships, getMentorshipSessions, discoverMentors, listExperts, type MentorBookingItem, type MentorshipRelationshipItem, type MentorshipSessionItem } from '@/lib/api';
import { BookingCard, MEETING_TYPE_LABEL } from '@/components/mentoring/BookingCard';
import { SessionDateTile } from '@/components/mentoring/SessionDateTile';
import { StatusText } from '@/components/common/StatusText';
import { fromBooking, fromMentorshipSession, isUpcoming, mergeSessions } from '@/lib/mentoring/sessions';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailOptions, RailStats } from '@/components/layout/RailParts';
import { usePageRail } from '@/components/layout/PageRailContext';
import { BilingualText } from '@/components/common/BilingualText';
import { useStoredUser } from '@/hooks/useStoredUser';
import { bilingualInline } from '@/lib/i18n/format';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
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
import { cn, initialsOf } from '@/lib/utils';
import { LocalTime } from '@/components/common/LocalTime';
import { qk } from '@/lib/query-keys';
import { FactLine } from '@/components/common/FactLine';
import { CardHead, CardFoot } from '@/components/common/CardAnatomy';
import { Counter } from '@/components/ui/counter';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { ASK } from '@/lib/page-questions';
import { expertiseFacets, withExpertise } from '@/lib/mentoring/expertise';
import { formatFee } from '@/lib/mentor-fee';
import { RequestReviewDialog } from '@/components/mentoring/RequestReviewDialog';
import { areaChips, areasOf, hitToMentor, mergeDirectory, offers, priceOf, type Mentor } from '@/lib/mentoring/directory';
import { MENTOR_SERVICES, areaKeys, areaLabel, directoryFromParams, type MentorService } from '@/lib/mentoring/services';

const AVAIL_CONFIG = {
  available: { en: 'Available', el: 'Διαθέσιμος', color: 'text-status-success ', bg: 'bg-status-success-bg', dot: 'bg-status-success-mark' },
  busy:      { en: 'Busy',      el: 'Απασχολημένος', color: 'text-status-danger',                            bg: 'bg-status-danger-bg',     dot: 'bg-status-danger-mark'     },
  limited:   { en: 'Limited',   el: 'Περιορισμένη', color: 'text-status-warning',                          bg: 'bg-status-warning-bg',   dot: 'bg-status-warning-mark'   },
} as const;

const PRICE_FILTERS = ['Any', 'Free', 'Paid'] as const;
type PriceFilter = typeof PRICE_FILTERS[number];
const PRICE_OPTIONS = [
  { value: 'Any', en: 'Any price', el: 'Οποιαδήποτε τιμή' },
  { value: 'Free', en: 'Free', el: 'Δωρεάν' },
  { value: 'Paid', en: 'Paid', el: 'Επί πληρωμή' },
] as const satisfies ReadonlyArray<{ value: PriceFilter; en: string; el: string }>;

/**
 * The expertise chips are the areas the listed mentors name, most common
 * first, each with how many mentors it shows (docs §70). They were a fixed
 * list of six, five of which matched none of the mentors on screen: a click
 * on "Fundraising" or "Product Strategy" emptied the page. The filter runs
 * on the areas the cards print, so a chip finds exactly the cards that say it.
 */
const MAX_EXPERTISE_CHIPS = 8;
/** Greek for areas that come in English; the rail showed them in English only. */
const EXPERTISE_EL: Record<string, string> = {
  All: 'Όλοι οι τομείς',
  'Product Strategy': 'Στρατηγική προϊόντος',
  Fundraising: 'Χρηματοδότηση',
  'Growth Marketing': 'Growth marketing',
  'Tech Architecture': 'Τεχνική αρχιτεκτονική',
  'B2B Sales': 'Πωλήσεις B2B',
  'User Research': 'Έρευνα χρηστών',
};

function MentorCard({
  mentor,
  service,
  isMe,
  onBook,
  onRequestReview,
}: {
  mentor: Mentor;
  service: MentorService;
  isMe: boolean;
  onBook: () => void;
  onRequestReview: () => void;
}) {
  // Shown only when known: search results carry no availability, and a green
  // "Available" on every card was a claim nothing had checked.
  const availCfg = mentor.availabilityStatus ? AVAIL_CONFIG[mentor.availabilityStatus] : null;
  // No invented fallback: a mentor the engine has not scored shows no pill,
  // rather than a number between 70 and 95 that changes on every render.
  const matchPct = mentor.matchScore ?? null;
  // What the reader came for leads the card (docs §111): a reviewer's
  // standing, fee and review areas, or the coaching areas, or the mentor's
  // own words.
  const asReviewer = service === 'review' ? mentor.review ?? null : null;
  const areas = areasOf(mentor, service)
    .map((key) => areaLabel(service, key))
    .filter((label): label is { en: string; el: string } => label != null);

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300">
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={mentor.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                  {initialsOf(mentor.displayName)}
                </AvatarFallback>
              </Avatar>
              {availCfg && <span className={cn('absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-background', availCfg.dot)} aria-hidden="true" />}
            </div>
          )}
          title={(
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <PersonHovercard userId={mentor.id}><Link href={`/profiles/${mentor.id}`} className="person-name transition-colors hover:text-primary-accessible">{mentor.displayName}</Link></PersonHovercard>
              {mentor.isVerified && <BadgeCheck className="icon-sm text-muted-foreground shrink-0" aria-label={bilingualInline('Verified', 'Επαληθευμένος')} />}
              {mentor.isFeatured && (
                <Badge variant="secondary" className="gap-1 text-xs px-1.5 py-0.5 font-normal">
                  <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                  <BilingualText en="Featured" el="Προτεινόμενος" compact />
                </Badge>
              )}
            </span>
          )}
          // Search results carry no rating, so a star with "New" beside
          // every mentor claimed each one was unreviewed. The slot shows a
          // rating only when one is known.
          meta={(
            <FactLine
              items={[
                asReviewer ? (
                  asReviewer.rating != null || asReviewer.completed > 0 ? (
                    <span key="reviews" data-keep-icon="" className="inline-flex items-center gap-0.5">
                      {asReviewer.rating != null ? (
                        <>
                          <Star className="icon-sm fill-status-warning text-status-warning" aria-hidden="true" />
                          <span className="font-semibold text-foreground">{asReviewer.rating.toFixed(1)}</span>
                        </>
                      ) : null}
                      <BilingualText
                        en={`${asReviewer.rating != null ? '(' : ''}${asReviewer.completed} ${asReviewer.completed === 1 ? 'review' : 'reviews'}${asReviewer.rating != null ? ')' : ''}`}
                        el={`${asReviewer.rating != null ? '(' : ''}${asReviewer.completed} ${asReviewer.completed === 1 ? 'αξιολόγηση' : 'αξιολογήσεις'}${asReviewer.rating != null ? ')' : ''}`}
                        compact
                      />
                    </span>
                  ) : null
                ) : mentor.rating > 0 ? (
                  <span key="rating" data-keep-icon="" className="inline-flex items-center gap-0.5">
                    <Star className="icon-sm fill-status-warning text-status-warning" aria-hidden="true" />
                    <span className="font-semibold text-foreground">{mentor.rating.toFixed(1)}</span>
                    {mentor.totalSessions > 0 && <span>({mentor.totalSessions})</span>}
                  </span>
                ) : null,
                mentor.location || null,
                mentor.isRemote ? <BilingualText key="remote" en="Remote" el="Εξ αποστάσεως" compact /> : null,
              ]}
            />
          )}
          // The match score is the head's one state: a pill at the right.
          aside={matchPct != null ? (
            <Badge
              variant="outline"
              className={cn(
                'text-xs tabular-nums',
                matchPct >= 85 ? 'border-primary/30 bg-primary/10 text-primary-accessible'
                : matchPct >= 70 ? 'border-status-success-border bg-status-success-bg text-status-success'
                : 'text-muted-foreground',
              )}
            >
              <BilingualText en={`${matchPct}% match`} el={`${matchPct}% ταίριασμα`} compact />
            </Badge>
          ) : undefined}
        />

        <p className="card-body line-clamp-2 text-muted-foreground first-letter:uppercase">{mentor.bio}</p>

        {/* What they help with: the service's areas when the person names
            any, else their own words, on one fact line. */}
        {areas.length > 0 ? (
          <FactLine items={areas.slice(0, 4).map((label) => <BilingualText key={label.en} en={label.en} el={label.el} compact />)} />
        ) : (
          <FactLine items={[...mentor.expertise.slice(0, 4), mentor.expertise.length > 4 ? `+${mentor.expertise.length - 4}` : null]} />
        )}

        <CardFoot
          meta={(
            <span className="flex flex-wrap items-center gap-2">
              {asReviewer ? (
                asReviewer.feeFrom != null ? (
                  <span className="font-semibold tabular-nums text-foreground">
                    <BilingualText en="From" el="Από" compact /> {formatFee(asReviewer.feeFrom, asReviewer.currency)}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-xs border-status-success-border text-status-success bg-status-success-bg">
                    <BilingualText en="Free" el="Δωρεάν" compact />
                  </Badge>
                )
              ) : mentor.hourlyRate ? (
                <span className="font-semibold tabular-nums text-foreground">
                  {/* In the currency the mentor bills in, when known. */}
                  {formatFee(mentor.hourlyRate, mentor.currency)}
                  <BilingualText en="/hr" el="/ώρα" compact />
                </span>
              ) : (
                <Badge variant="outline" className="text-xs border-status-success-border text-status-success bg-status-success-bg">
                  <BilingualText en="Free" el="Δωρεάν" compact />
                </Badge>
              )}
              {availCfg && (
                <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', availCfg.bg, availCfg.color)}>
                  <BilingualText en={availCfg.en} el={availCfg.el} compact />
                </span>
              )}
            </span>
          )}
        >
          {asReviewer ? (
            // A review request goes to the person on the card; asking
            // oneself is refused by the API, so the button is not offered.
            isMe ? null : (
              <Button size="sm" onClick={onRequestReview} className="gap-1.5" aria-label={bilingualInline(`Request a review from ${mentor.displayName}`, `Αίτημα αξιολόγησης προς ${mentor.displayName}`)}>
                <Award className="icon-sm" aria-hidden="true" />
                <BilingualText en="Request a review" el="Αίτημα αξιολόγησης" compact />
              </Button>
            )
          ) : (
            <Button size="sm" onClick={onBook} className="gap-1.5" aria-label={bilingualInline(`Book a session with ${mentor.displayName}`, `Κράτηση συνεδρίας με ${mentor.displayName}`)}>
              <Calendar className="icon-sm" aria-hidden="true" />
              <BilingualText en="Book" el="Κράτηση" compact />
            </Button>
          )}
        </CardFoot>
      </CardContent>
    </Card>
  );
}

function localIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function BookingModal({
  mentor,
  open,
  initialNotes = '',
  onClose,
  onBook,
}: {
  mentor: Mentor | null;
  open: boolean;
  /** The request's first line, e.g. the coaching area the directory is narrowed to. */
  initialNotes?: string;
  onClose: () => void;
  onBook: (mentorId: string, startAt: string, endAt: string, meetingType: 'video' | 'in_person' | 'chat', notes: string) => Promise<void>;
}) {
  const sayOne = useBilingualString();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [meetingType, setMeetingType] = useState<'video' | 'in_person' | 'chat'>('video');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { error: showError } = useToast();
  useEffect(() => {
    if (open) setNotes(initialNotes);
  }, [open, initialNotes]);

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
      showError(bilingualInline('Booking failed', 'Η κράτηση απέτυχε'), err instanceof Error ? err.message : bilingualInline('Please try again', 'Δοκιμάστε ξανά'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!mentor) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <BilingualText en={`Book a session with ${mentor.displayName}`} el={`Κράτηση συνεδρίας με ${mentor.displayName}`} />
          </DialogTitle>
          <DialogDescription>
            <BilingualText en="Choose a date, a time and how you would like to meet. The mentor confirms the request." el="Επιλέξτε ημερομηνία, ώρα και τρόπο συνάντησης. Ο μέντορας επιβεβαιώνει το αίτημα." wrap />
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date"><BilingualText en="Date" el="Ημερομηνία" compact /></Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                // The reader's today: the UTC date let an Athens reader book
                // yesterday between midnight and 03:00 (docs §70).
                min={localIsoDate()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time"><BilingualText en="Time" el="Ώρα" compact /></Label>
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
              <Label htmlFor="duration"><BilingualText en="Duration" el="Διάρκεια" compact /></Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30"><BilingualText en="30 minutes" el="30 λεπτά" compact /></SelectItem>
                  <SelectItem value="60"><BilingualText en="60 minutes" el="60 λεπτά" compact /></SelectItem>
                  <SelectItem value="90"><BilingualText en="90 minutes" el="90 λεπτά" compact /></SelectItem>
                  <SelectItem value="120"><BilingualText en="2 hours" el="2 ώρες" compact /></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-type"><BilingualText en="Meeting type" el="Τύπος συνάντησης" compact /></Label>
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as 'video' | 'in_person' | 'chat')}>
                <SelectTrigger id="meeting-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['video', 'chat', 'in_person'] as const).map((t) => (
                    <SelectItem key={t} value={t}><BilingualText en={MEETING_TYPE_LABEL[t].en} el={MEETING_TYPE_LABEL[t].el} compact /></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes"><BilingualText en="Notes (optional)" el="Σημειώσεις (προαιρετικά)" compact /></Label>
            <Textarea
              id="notes"
              placeholder={sayOne('What would you like to discuss?', 'Τι θα θέλατε να συζητήσετε;')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {mentor.hourlyRate && (
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground"><BilingualText en="Estimated cost" el="Εκτιμώμενο κόστος" compact /></span>
                <span className="font-semibold text-foreground">
                  {formatFee(Math.round((mentor.hourlyRate * parseInt(duration)) / 60))}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              <BilingualText en="Cancel" el="Ακύρωση" compact />
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="icon-sm animate-spin" aria-hidden="true" />}
              <BilingualText en="Request booking" el="Αίτημα κράτησης" compact />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
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

/**
 * A mentorship session shown read-only on this tab: its actions (reschedule,
 * notes, cancel) live on /coaching for the mentee side and /mentor/sessions
 * for the mentor side, so the row links there instead of copying them.
 */
function MentorshipSessionRow({ rel, session, userId }: { rel: MentorshipRelationshipItem; session: MentorshipSessionItem; userId: string | null }) {
  const u = fromMentorshipSession(session, rel, userId);
  const start = new Date(u.startAt);
  const end = u.endAt ? new Date(u.endAt) : null;
  const other = u.counterpart;
  const home = rel.mentorId === userId ? '/mentor/sessions' : '/coaching';
  // The booking card's anatomy: the date tile is the mark, and the facts
  // and the link on the tile's edge.
  return (
    <Card>
      <CardContent className="space-y-3">
        <CardHead
          mark={<SessionDateTile date={start} />}
          title={(
            <span className="flex flex-wrap items-baseline gap-x-2">
              <PersonHovercard userId={other.id}><Link href={`/profiles/${other.id}`} className="person-name transition-colors hover:text-primary-accessible">{other.displayName}</Link></PersonHovercard>
              <span className="text-xs font-normal text-muted-foreground">
                {rel.mentorId === userId
                  ? <BilingualText en="(mentee)" el="(καθοδηγούμενος)" compact />
                  : <BilingualText en="(mentor)" el="(μέντορας)" compact />}
              </span>
            </span>
          )}
          subtitle={(
            <>
              <LocalTime value={start} />
              {end ? <> {' – '} <LocalTime value={end} /> </> : null}
            </>
          )}
          aside={(
            <>
              <Badge variant="outline" className="text-xs">
                <StatusText value={u.status} />
              </Badge>
              <span className="text-xs text-muted-foreground">
                · <BilingualText en="Mentorship" el="Σχέση καθοδήγησης" compact />
              </span>
            </>
          )}
        />
        <FactLine
          items={[
            u.durationMin != null ? <BilingualText key="len" en={`${u.durationMin} min`} el={`${u.durationMin} λεπτά`} compact /> : null,
            u.title ? <span key="title" className="first-letter:uppercase">{u.title}</span> : null,
          ]}
        />
        <CardFoot>
          <Button size="sm" variant="outline" asChild>
            <Link href={home}>
              {rel.mentorId === userId
                ? <BilingualText en="Open in Mentor sessions" el="Άνοιγμα στις συνεδρίες μέντορα" compact />
                : <BilingualText en="Open in Coaching" el="Άνοιγμα στο Coaching" compact />}
            </Link>
          </Button>
        </CardFoot>
      </CardContent>
    </Card>
  );
}

function MentorSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4">
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
  const sayOne = useBilingualString();
  const router = useRouter();
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
  const { openRailSection } = usePageRail();
  // Read after mount: reading localStorage during render gave the server and
  // the first client render different answers for "am I the mentor here?".
  const userId = useStoredUser()?.id ?? null;

  /*
   * What the reader needs: a mentor, coaching or an expert review, and the
   * area within it. Coaching and Expert reviews listed the same people and
   * link here now with both set (owner, 2026-10-28; docs §90.5, §111); the
   * address bar mirrors them so a narrowed list can be linked.
   */
  const [service, setServiceState] = useState<MentorService>('mentoring');
  const [area, setAreaState] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Mentor | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  useEffect(() => {
    const fromLink = directoryFromParams(new URLSearchParams(window.location.search));
    setServiceState(fromLink.service);
    setAreaState(fromLink.area);
  }, []);
  const mirrorDirectory = (nextService: MentorService, nextArea: string | null) => {
    try {
      const url = new URL(window.location.href);
      if (nextService === 'mentoring') url.searchParams.delete('service');
      else url.searchParams.set('service', nextService);
      if (nextArea) url.searchParams.set('area', nextArea);
      else url.searchParams.delete('area');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* the address bar is a convenience */ }
  };
  const setService = (next: MentorService) => {
    setServiceState(next);
    setAreaState(null);
    setSelectedExpertise('All');
    setMainTab('find');
    mirrorDirectory(next, null);
  };
  const setArea = (next: string | null) => {
    setAreaState(next);
    mirrorDirectory(service, next);
  };

  // Load real mentors from search API. The search words sit under their own
  // segment: as the second segment, a search for "admin" or "directory" read
  // another screen's cached list (docs §111).
  const { isLoading: mentorsQueryLoading, isError: mentorsError } = useQuery({
    queryKey: qk('mentors', 'search', searchQuery),
    queryFn: async () => {
      const res = await searchProfiles({
        q: searchQuery.trim() || undefined,
        roles: ['mentor'],
        limit: 50,
      });
      setMentorHits(res.hits.map(hitToMentor));
      return res;
    },
    staleTime: 60_000,
    enabled: mainTab === 'find',
  });
  // What the mentorship directory knows about the same people (ratings,
  // sessions, availability, currency), and who takes review requests: the
  // reads Coaching and Expert reviews made for their own lists (docs §111).
  const { data: profileData } = useQuery({
    queryKey: qk('mentors', 'directory'),
    queryFn: () => discoverMentors({ limit: 50 }),
    staleTime: 5 * 60_000,
    retry: 0,
    enabled: mainTab === 'find',
  });
  const { data: expertData, isLoading: expertsLoading, isError: expertsError, refetch: refetchExperts } = useQuery({
    queryKey: qk('expert-reviews', 'experts'),
    queryFn: () => listExperts({ limit: 50 }),
    staleTime: 5 * 60_000,
    retry: 0,
    enabled: mainTab === 'find',
  });

  const { data, isLoading } = useQuery({
    queryKey: qk('mentorships', 'bookings'),
    queryFn: () => listMentorBookings('all'),
    enabled: mainTab === 'sessions',
    staleTime: 30_000,
  });

  /*
   * The other session store: mentorship sessions hang off relationships on
   * both sides of the reader. They render beside bookings as read-only rows -
   * their actions live on /coaching and /mentor/sessions.
   */
  const { data: menteeRelData } = useQuery({
    queryKey: qk('mentorships', 'mentee'),
    queryFn: () => getMyMentorships('mentee'),
    enabled: mainTab === 'sessions',
    staleTime: 60_000,
    retry: 0,
  });
  const { data: mentorRelData } = useQuery({
    queryKey: qk('mentorships', 'mentor'),
    queryFn: () => getMyMentorships('mentor'),
    enabled: mainTab === 'sessions',
    staleTime: 60_000,
    retry: 0,
  });
  const mentoringRelationships = useMemo(() => {
    const byId = new Map<string, MentorshipRelationshipItem>();
    for (const r of menteeRelData?.relationships ?? []) byId.set(r.id, r);
    for (const r of mentorRelData?.relationships ?? []) byId.set(r.id, r);
    return [...byId.values()];
  }, [menteeRelData, mentorRelData]);
  const relById = useMemo(() => new Map(mentoringRelationships.map((r) => [r.id, r])), [mentoringRelationships]);
  const mentorshipSessionQueries = useQueries({
    queries: mentoringRelationships.map((r) => ({
      queryKey: qk('mentorships', 'sessions', r.id),
      queryFn: () => getMentorshipSessions(r.id),
      enabled: mainTab === 'sessions',
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: MentorBookingItem['status'] }) =>
      updateMentorBooking(bookingId, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: qk('mentorships', 'bookings') });
      if (vars.status === 'confirmed') {
        success(bilingualInline('Session confirmed', 'Η συνεδρία επιβεβαιώθηκε'), bilingualInline('The booking has been confirmed.', 'Η κράτηση επιβεβαιώθηκε.'));
      } else {
        success(bilingualInline('Session cancelled', 'Η συνεδρία ακυρώθηκε'), bilingualInline('The booking has been cancelled.', 'Η κράτηση ακυρώθηκε.'));
      }
    },
    onError: (err) => showError(bilingualInline('Action failed', 'Η ενέργεια απέτυχε'), err instanceof Error ? err.message : bilingualInline('Please try again', 'Δοκιμάστε ξανά')),
  });

  const directory = useMemo(
    () => mergeDirectory({
      hits: mentorHits,
      profiles: profileData?.mentors ?? [],
      experts: expertData?.experts ?? [],
      searching: searchQuery.trim() !== '',
    }),
    [mentorHits, profileData, expertData, searchQuery],
  );
  const pricedMentors = directory.filter((m) => {
    if (!offers(m, service)) return false;
    const price = priceOf(m, service);
    if (priceFilter === 'Free') return !price;
    if (priceFilter === 'Paid') return !!price;
    return true;
  });
  // A mentor is chosen by the areas they name, most common first, with
  // counts; coaching and reviews by the service's own areas (docs §111).
  const facets = service === 'mentoring' ? expertiseFacets(pricedMentors, selectedExpertise, MAX_EXPERTISE_CHIPS) : [];
  const chips = areaChips(pricedMentors, service, areaKeys(service), area);
  const filteredMentors = service === 'mentoring'
    ? withExpertise(pricedMentors, selectedExpertise)
    : area ? pricedMentors.filter((m) => areasOf(m, service).includes(area)) : pricedMentors;
  // Reviewers come from their own read; a list not yet read is not empty.
  const directoryLoading = mentorsQueryLoading || (service === 'review' && expertsLoading);
  const reviewersFailed = service === 'review' && expertsError && !expertData;

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

  /*
   * Both stores, one list. Bookings keep their BookingCard actions;
   * mentorship sessions render read-only and link to the page that owns
   * them.
   */
  const mentorshipSessionsLoading = mentorshipSessionQueries.some((q) => q.isLoading);
  const unifiedSessions = useMemo(() => mergeSessions([
    ...allBookings.map((b) => fromBooking(b, userId)),
    ...mentorshipSessionQueries
      .flatMap((q) => q.data?.sessions ?? [])
      .filter((s) => relById.has(s.relationshipId))
      .map((s) => fromMentorshipSession(s, relById.get(s.relationshipId)!, userId)),
    // The query array is new each render; its data is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]), [allBookings, relById, userId, mentorshipSessionQueries.map((q) => q.dataUpdatedAt).join(',')]);

  const upcomingSessions = unifiedSessions.filter(
    (u) => isUpcoming(u) && (!u.endAt || new Date(u.endAt) >= now),
  );
  const pastSessions = unifiedSessions.filter(
    (u) => !isUpcoming(u) || (u.endAt != null && new Date(u.endAt) < now),
  );
  const filteredSessions =
    sessionsTab === 'upcoming' ? upcomingSessions
    : sessionsTab === 'past' ? pastSessions
    : unifiedSessions;

  const upcomingCount = upcomingSessions.length;
  // Requests that wait on the reader's answer, as the mentor. The list is a
  // schedule, so it stays in date order; the line above it says what waits
  // and takes the reader there (a request sat sixth of seven; docs §70).
  const awaitingMe = upcomingSessions.filter(
    (u) => u.source === 'booking' && u.status === 'requested' && u.mentorId === userId,
  );
  const sessionsLoading = isLoading || mentorshipSessionsLoading;

  const handleBookMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    // Coaching asked for by area says so in the request's first line, which
    // the reader can change before sending.
    const coachingArea = service === 'coaching' ? (area ?? areasOf(mentor, 'coaching')[0] ?? null) : null;
    const label = coachingArea ? areaLabel('coaching', coachingArea) : null;
    setBookingNotes(
      service !== 'coaching' ? ''
      : label ? sayOne(`Coaching on ${label.en.toLowerCase()}. `, `Καθοδήγηση: ${label.el.toLowerCase()}. `)
      : sayOne('Coaching session. ', 'Συνεδρία καθοδήγησης. '),
    );
    setBookingModalOpen(true);
  };

  const handleCreateBooking = async (mentorId: string, startAt: string, endAt: string, meetingType: 'video' | 'in_person' | 'chat', notes: string) => {
    await createMentorBooking({ mentorId, startAt, endAt, meetingType, notes: notes || undefined });
    queryClient.invalidateQueries({ queryKey: qk('mentorships', 'bookings') });
    success(bilingualInline('Booking requested', 'Η κράτηση ζητήθηκε'), bilingualInline('Your session request has been sent to the mentor.', 'Το αίτημα στάλθηκε στον μέντορα.'));
  };

  // Offered to the assistant: the two sections, the session filter and the
  // rail's filters through the same setters, and Book, which opens the same
  // booking form the card's button opens (the request itself is sent there).
  const activeFilters = (priceFilter !== 'Any' ? 1 : 0) + (selectedExpertise !== 'All' ? 1 : 0) + (area ? 1 : 0);
  const clearFilters = () => { setPriceFilter('Any'); setSelectedExpertise('All'); setArea(null); };
  const reviewers = directory.filter((m) => m.review && m.id !== userId);
  usePageControls([
    choiceControl('mentoring_section', 'Mentoring section', 'Ενότητα καθοδήγησης', [
      { value: 'find', en: 'Find mentors', el: 'Εύρεση μεντόρων' },
      { value: 'sessions', en: 'My sessions', el: 'Οι συνεδρίες μου' },
    ], mainTab, (v) => setMainTab(v as typeof mainTab)),
    choiceControl('sessions_filter', 'Sessions shown', 'Συνεδρίες που εμφανίζονται', [
      { value: 'upcoming', en: 'Upcoming', el: 'Επερχόμενες' },
      { value: 'past', en: 'Past', el: 'Παρελθούσες' },
      { value: 'all', en: 'All', el: 'Όλες' },
    ], sessionsTab, (v) => setSessionsTab(v as typeof sessionsTab)),
    choiceControl('mentor_price', 'Mentor price', 'Τιμή μέντορα', [...PRICE_OPTIONS], priceFilter, (v) => setPriceFilter(v as PriceFilter)),
    choiceControl('mentor_service', 'What you need', 'Τι χρειάζεστε', MENTOR_SERVICES.map((o) => ({ value: o.value, en: o.en, el: o.el })), service, (v) => setService(v as MentorService)),
    ...(service === 'mentoring' ? [
      choiceControl('mentor_expertise', 'Mentor expertise', 'Εξειδίκευση μέντορα', [
        { value: 'All', en: 'All areas', el: 'Όλοι οι τομείς' },
        ...facets.map((f) => ({ value: f.label, en: f.label, el: EXPERTISE_EL[f.label] ?? f.label })),
      ], selectedExpertise, setSelectedExpertise),
    ] : [
      choiceControl(
        'mentor_area',
        service === 'coaching' ? 'Coaching area' : 'Review area',
        service === 'coaching' ? 'Τομέας καθοδήγησης' : 'Τομέας αξιολόγησης',
        [
          { value: 'any', en: 'All areas', el: 'Όλοι οι τομείς' },
          ...chips.map((c) => ({ value: c.key, en: `${areaLabel(service, c.key)?.en ?? c.key} (${c.count})`, el: `${areaLabel(service, c.key)?.el ?? c.key} (${c.count})` })),
        ],
        area ?? 'any',
        (v) => setArea(v === 'any' ? null : v),
      ),
    ]),
    {
      id: 'open_booking',
      labelEn: 'Open the booking form for mentor',
      labelEl: 'Άνοιγμα φόρμας κράτησης για μέντορα',
      writes: false,
      options: rowOptions(filteredMentors, (m) => m.id, (m) => m.displayName),
      run: (v) => {
        const mentor = filteredMentors.find((m) => m.id === v);
        if (mentor) handleBookMentor(mentor);
      },
    },
    {
      // The same form the card's "Request a review" opens; the request is sent there.
      id: 'open_review_request',
      labelEn: 'Open the review request form for expert',
      labelEl: 'Άνοιγμα φόρμας αιτήματος αξιολόγησης για ειδικό',
      writes: false,
      options: rowOptions(reviewers, (m) => m.id, (m) => m.displayName),
      unavailableEn: reviewers.length ? undefined : 'No expert on this screen takes review requests.',
      unavailableEl: reviewers.length ? undefined : 'Κανένας ειδικός σε αυτή την οθόνη δεν δέχεται αιτήματα αξιολόγησης.',
      run: (v) => {
        const mentor = reviewers.find((m) => m.id === v);
        if (!mentor) return;
        if (service !== 'review') setService('review');
        setReviewTarget(mentor);
      },
    },
  ]);
  usePageList([
    {
      id: 'mentors',
      labelEn: 'Mentors',
      labelEl: 'Μέντορες',
      rows: directoryLoading ? undefined : filteredMentors.map((m) => {
        const named = service === 'mentoring' ? m.expertise : areasOf(m, service).map((key) => areaLabel(service, key)?.en ?? key);
        const price = service === 'review'
          ? (m.review?.feeFrom != null ? `reviews from ${formatFee(m.review.feeFrom, m.review.currency)}` : 'free reviews')
          : (m.hourlyRate ? `${formatFee(m.hourlyRate, m.currency)}/hr` : 'free');
        const standing = service === 'review'
          ? ` · ${m.review?.completed ?? 0} reviews done${m.review?.rating != null ? ` · ${m.review.rating.toFixed(1)}★` : ''}`
          : (m.rating > 0 ? ` · ${m.rating.toFixed(1)}★` : '');
        return `${m.displayName}${m.location ? ` · ${m.location}` : ''}${named.length ? ` · ${named.join(', ')}` : ''} · ${price}${standing}`;
      }),
    },
    {
      id: 'sessions',
      labelEn: 'My sessions',
      labelEl: 'Οι συνεδρίες μου',
      rows: sessionsLoading ? undefined : filteredSessions.map((u) =>
        `${u.counterpart.displayName} (${u.mentorId === userId ? 'mentee' : 'mentor'}) · ${u.startAt.slice(0, 16).replace('T', ' ')} UTC · ${u.meetingType ?? 'session'} · ${u.status} · ${u.source}`,
      ),
    },
  ]);

  /*
   * The column leads with the two sections, the search and the mentors. The
   * directory figures and the price filter are auxiliary, so they live in the
   * rail. Expertise is how a mentor is chosen, so its chips moved under the
   * search, in view (the AI Studio prototype's mentors page does the same):
   * in the rail, usually closed, the main filter was out of sight.
   */
  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'mentor',
      labelEn: 'Mentors at a glance',
      labelEl: 'Μέντορες με μια ματιά',
      content: (
        <RailStats
          items={[
            { key: 'mentors', label: 'Mentors shown', labelEl: 'Μέντορες που εμφανίζονται', value: mentorsQueryLoading ? '—' : filteredMentors.length, icon: GraduationCap, tone: 'bg-status-accent-bg text-status-accent' },
            { key: 'free', label: 'Free to book', labelEl: 'Δωρεάν κράτηση', value: mentorsQueryLoading ? '—' : filteredMentors.filter((m) => !m.hourlyRate).length, icon: Users, tone: 'bg-status-success-bg text-status-success' },
            // The directory search carries no ratings or session counts, so
            // these appear only when some mentor on screen actually has one:
            // a 0 here would read as "nobody has mentored", not "unknown".
            ...(avgRating ? [{ key: 'rating', label: 'Average rating', labelEl: 'Μέση βαθμολογία', value: `${avgRating}★`, icon: Star, tone: 'bg-status-warning-bg text-status-warning' }] : []),
            ...(sessionsDone > 0 ? [{ key: 'sessions', label: 'Sessions given', labelEl: 'Συνεδρίες που έγιναν', value: sessionsDone, icon: Users, tone: 'bg-status-info-bg text-status-info' }] : []),
            ...(upcomingCount > 0 ? [{ key: 'upcoming', label: 'Your upcoming sessions', labelEl: 'Οι επερχόμενες συνεδρίες σας', value: upcomingCount, icon: Calendar, tone: 'bg-status-info-bg text-status-info' }] : []),
          ]}
        />
      ),
    },
    {
      id: 'filters',
      glyph: 'sliders',
      labelEn: 'Filters',
      labelEl: 'Φίλτρα',
      // The rail holds the price filter only now; expertise shows on the page.
      badge: priceFilter !== 'Any' ? 1 : null,
      content: (
        <div className="space-y-4">
          {mainTab !== 'find' && (
            <p className="px-2.5 text-xs leading-relaxed text-muted-foreground">
              <BilingualText en="These filters narrow Find mentors." el="Αυτά τα φίλτρα περιορίζουν την Εύρεση μεντόρων." wrap />
            </p>
          )}
          <RailOptions title="Price" titleEl="Τιμή" options={PRICE_OPTIONS} value={priceFilter} onChange={(v) => { setPriceFilter(v); setMainTab('find'); }} />
          {activeFilters > 0 && (
            <RailAction icon={X} en="Clear filters" el="Καθαρισμός φίλτρων" onClick={clearFilters} />
          )}
        </div>
      ),
    },
    {
      id: 'related',
      glyph: 'flag',
      labelEn: 'Linked pages',
      labelEl: 'Συνδεδεμένες σελίδες',
      content: (
        <div className="space-y-1">
          <RailAction icon={Calendar} en="Open calendar" el="Άνοιγμα ημερολογίου" onClick={() => router.push('/calendar')} />
          <RailAction icon={CalendarDays} en="Open events" el="Άνοιγμα εκδηλώσεων" onClick={() => router.push('/events')} />
          <RailAction icon={MessageCircle} en="Open messages" el="Άνοιγμα μηνυμάτων" onClick={() => router.push('/messages')} />
        </div>
      ),
    },
  ];

  return (
    <AppShell showHelp rail={rail} askAi={ASK.mentoring}>
      <div className="pb-10">
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="find" className="gap-2">
            <Search className="icon-sm" aria-hidden="true" />
            <BilingualText en="Find mentors" el="Εύρεση μεντόρων" compact />
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="icon-sm" aria-hidden="true" />
            <BilingualText en="My sessions" el="Οι συνεδρίες μου" compact />
            {upcomingCount > 0 && (
              <Counter value={upcomingCount} />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder={sayOne('Search mentors by name, expertise or bio…', 'Αναζήτηση μεντόρων με όνομα, εξειδίκευση ή βιογραφικό…')}
                aria-label={bilingualInline('Search mentors', 'Αναζήτηση μεντόρων')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* What the reader needs leads: it picks the chips below, what
                each card stresses and its button (docs §90.5, §111). */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-labelledby="mentor-service-label">
              <span id="mentor-service-label" className="mr-1 text-xs font-medium text-muted-foreground">
                <BilingualText en="What you need" el="Τι χρειάζεστε" compact />
              </span>
              {MENTOR_SERVICES.map((option) => {
                const on = service === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setService(option.value)}
                    className={cn(
                      'tap-target-y inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    <BilingualText en={option.en} el={option.el} compact />
                  </button>
                );
              })}
            </div>
            {service !== 'mentoring' ? (
              <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label={service === 'coaching' ? bilingualInline('Coaching area', 'Τομέας καθοδήγησης') : bilingualInline('Review area', 'Τομέας αξιολόγησης')}>
                {([{ key: null, count: pricedMentors.length }] as Array<{ key: string | null; count: number }>).concat(chips).map(({ key, count }) => {
                  const on = area === key;
                  const label = key ? areaLabel(service, key) : null;
                  return (
                    <button
                      key={key ?? 'all'}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setArea(key)}
                      className={cn(
                        'tap-target-y inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        on ? 'border-primary bg-primary/10 text-primary-accessible' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      <BilingualText en={label?.en ?? 'All areas'} el={label?.el ?? 'Όλοι οι τομείς'} compact />
                      {!directoryLoading ? <span className="tabular-nums opacity-70">{count}</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label={bilingualInline('Expertise', 'Εξειδίκευση')}>
              {[{ label: 'All', n: pricedMentors.length }, ...facets].map(({ label, n }) => {
                const on = selectedExpertise.toLocaleLowerCase() === label.toLocaleLowerCase();
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelectedExpertise(label)}
                    className={cn(
                      'tap-target-y inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      on ? 'border-primary bg-primary/10 text-primary-accessible' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    <BilingualText en={label === 'All' ? 'All areas' : label} el={label === 'All' ? 'Όλοι οι τομείς' : EXPERTISE_EL[label] ?? label} compact />
                    {!mentorsQueryLoading ? <span className="tabular-nums opacity-70">{n}</span> : null}
                  </button>
                );
              })}
            </div>
            )}
          </div>

          {mentorsError || reviewersFailed ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {mentorsError ? (
                  <BilingualText en="Mentors could not be loaded." el="Δεν ήταν δυνατή η φόρτωση των μεντόρων." wrap />
                ) : (
                  <BilingualText en="The reviewers could not be read just now." el="Οι αξιολογητές δεν διαβάστηκαν αυτή τη στιγμή." wrap />
                )}
              </p>
              <Button variant="outline" size="sm" onClick={() => { void queryClient.invalidateQueries({ queryKey: qk('mentors') }); if (reviewersFailed) void refetchExperts(); }}>
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </Button>
            </CardContent></Card>
          ) : directoryLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <MentorSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {featuredMentors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="icon-sm text-muted-foreground" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-foreground">
                      <BilingualText en="Featured mentors" el="Προτεινόμενοι μέντορες" compact />
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {featuredMentors.map((mentor) => (
                      <MentorCard key={mentor.id} mentor={mentor} service={service} isMe={mentor.id === userId} onBook={() => handleBookMentor(mentor)} onRequestReview={() => setReviewTarget(mentor)} />
                    ))}
                  </div>
                </div>
              )}

              {regularMentors.length > 0 && (
                <div className="space-y-3">
                  {featuredMentors.length > 0 && (
                    <h2 className="text-base font-semibold text-foreground">
                      <BilingualText en="All mentors" el="Όλοι οι μέντορες" compact />
                    </h2>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {regularMentors.map((mentor) => (
                      <MentorCard key={mentor.id} mentor={mentor} service={service} isMe={mentor.id === userId} onBook={() => handleBookMentor(mentor)} onRequestReview={() => setReviewTarget(mentor)} />
                    ))}
                  </div>
                </div>
              )}

              {filteredMentors.length === 0 && (
                <EmptyState
                  illustration="search"
                  title={<BilingualText en="No mentors found" el="Δεν βρέθηκαν μέντορες" />}
                  description={
                    // Expertise is the chips above; only price is in the side
                    // panel. The line sent people to the panel for both.
                    area ? <BilingualText en={`No one here lists ${areaLabel(service, area)?.en ?? area}. Show all areas, or search.`} el={`Κανείς εδώ δεν αναφέρει: ${areaLabel(service, area)?.el ?? area}. Δείτε όλους τους τομείς ή κάντε αναζήτηση.`} />
                    : service === 'review' && !searchQuery.trim() && activeFilters === 0
                      ? <BilingualText en="No mentor takes review requests yet. Mentors who accept requests appear here." el="Κανένας μέντορας δεν δέχεται ακόμη αιτήματα αξιολόγησης. Όσοι δέχονται αιτήματα εμφανίζονται εδώ." />
                    : selectedExpertise !== 'All'
                      ? <BilingualText en={`No mentor here names “${selectedExpertise}”. Show all areas, or search for it.`} el={`Κανένας μέντορας εδώ δεν αναφέρει «${EXPERTISE_EL[selectedExpertise] ?? selectedExpertise}». Δείτε όλους τους τομείς ή αναζητήστε το.`} />
                      : activeFilters > 0
                      ? <BilingualText en="The price filter in the side panel may be hiding mentors." el="Το φίλτρο τιμής στο πλευρικό πάνελ ίσως κρύβει μέντορες." />
                      : searchQuery.trim()
                        ? <BilingualText en="Try a different name or area of expertise." el="Δοκιμάστε άλλο όνομα ή τομέα εξειδίκευσης." />
                        : <BilingualText en="No mentor profiles have been created yet. Mentors who register and complete their profile will appear here." el="Δεν υπάρχουν ακόμα προφίλ μεντόρων. Οι μέντορες που εγγράφονται και ολοκληρώνουν το προφίλ τους θα εμφανιστούν εδώ." />
                  }
                  askAiPrompt={ASK.mentorsEmpty}
                  action={
                    area ? (
                      <Button variant="secondary" onClick={() => setArea(null)}>
                        <BilingualText en="Show all areas" el="Όλοι οι τομείς" compact />
                      </Button>
                    ) : selectedExpertise !== 'All' ? (
                      <Button variant="secondary" onClick={() => setSelectedExpertise('All')}>
                        <BilingualText en="Show all areas" el="Όλοι οι τομείς" compact />
                      </Button>
                    ) : activeFilters > 0 ? (
                      <Button variant="secondary" onClick={() => openRailSection('filters')}>
                        <BilingualText en="Show filters" el="Εμφάνιση φίλτρων" compact />
                      </Button>
                    ) : searchQuery.trim() ? (
                      <Button variant="secondary" onClick={() => setSearchQuery('')}>
                        <BilingualText en="Clear search" el="Καθαρισμός αναζήτησης" compact />
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </>
          )}

          {/* Where the rest of each service lives (docs §111). */}
          {service === 'coaching' ? (
            <>
              <p className="text-xs text-muted-foreground">
                <BilingualText en="Your coaching sessions, action items and insights are on" el="Οι συνεδρίες, οι ενέργειες και τα στοιχεία της καθοδήγησής σας είναι στη σελίδα" wrap />{' '}
                <Link href="/coaching" className="font-medium text-primary-accessible hover:underline">
                  <BilingualText en="Coaching" el="Καθοδήγηση" compact />
                </Link>
              </p>
              {/* For becoming a coach: it stood under Coaching's own list,
                  which this one replaces. */}
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <BookOpen className="icon-xl mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                <p className="mb-1 text-sm font-semibold text-foreground"><BilingualText en="Become a coach on CoFounderBay" el="Γίνετε coach στο CoFounderBay" /></p>
                <p className="mb-3 text-xs text-muted-foreground"><BilingualText en="Share your expertise and earn while helping founders grow." el="Μοιραστείτε την εμπειρογνωμοσύνη σας και κερδίστε βοηθώντας ιδρυτές να αναπτυχθούν." /></p>
                {/* Mentor signup is the form that exists and is wired. */}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/mentor/profile">
                    <BilingualText en="Apply as coach" el="Αίτηση ως coach" compact wrap />
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
          {service === 'review' ? (
            <>
              <p className="text-xs text-muted-foreground">
                <BilingualText en="Your requests and the reviews you received are on" el="Τα αιτήματά σας και οι αξιολογήσεις που λάβατε είναι στη σελίδα" wrap />{' '}
                <Link href="/expert-reviews" className="font-medium text-primary-accessible hover:underline">
                  <BilingualText en="Expert reviews" el="Αξιολογήσεις ειδικών" compact />
                </Link>
              </p>
              {/* For becoming a reviewer: it stood under Expert reviews' own
                  list, which this one replaces. */}
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <Award className="icon-xl mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                <p className="mb-1 text-sm font-medium text-foreground">
                  <BilingualText en="Are you a domain expert?" el="Είστε ειδικός στον τομέα σας;" />
                </p>
                <p className="mb-3 text-xs leading-snug text-muted-foreground">
                  <BilingualText en="Join as an expert reviewer and earn while helping founders." el="Γίνετε αξιολογητής και κερδίστε βοηθώντας ιδρυτές." />
                </p>
                {/* Mentor signup is the form that exists and is wired. */}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/mentor/profile">
                    <BilingualText en="Apply as expert" el="Αίτηση ως ειδικός" compact wrap />
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Tabs value={sessionsTab} onValueChange={(v) => setSessionsTab(v as typeof sessionsTab)}>
            <TabsList>
              <TabsTrigger value="upcoming" className="gap-2">
                <Calendar className="icon-sm" aria-hidden="true" />
                <BilingualText en="Upcoming" el="Επερχόμενες" compact />
                {upcomingCount > 0 && (
                  <Counter value={upcomingCount} />
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <BookOpen className="icon-sm" aria-hidden="true" />
                <BilingualText en="Past" el="Παρελθούσες" compact />
              </TabsTrigger>
              <TabsTrigger value="all"><BilingualText en="All" el="Όλες" compact /></TabsTrigger>
            </TabsList>

            {(['upcoming', 'past', 'all'] as const).map((t) => (
              <TabsContent key={t} value={t} className="mt-4 space-y-3">
                {t !== 'past' && !sessionsLoading && awaitingMe.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-status-warning-border bg-status-warning-bg px-4 py-3">
                    <p className="text-sm text-foreground">
                      <BilingualText
                        en={awaitingMe.length === 1 ? '1 booking request waits for your answer' : `${awaitingMe.length} booking requests wait for your answer`}
                        el={awaitingMe.length === 1 ? '1 αίτημα κράτησης περιμένει την απάντησή σας' : `${awaitingMe.length} αιτήματα κράτησης περιμένουν την απάντησή σας`}
                        wrap
                      />
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById(`session-${awaitingMe[0].key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    >
                      <BilingualText en="Show it" el="Εμφάνιση" compact />
                    </Button>
                  </div>
                ) : null}
                {sessionsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <BookingSkeleton key={i} />)
                ) : filteredSessions.length === 0 ? (
                  <EmptyState
                    illustration="calendar"
                    title={t === 'upcoming'
                      ? <BilingualText en="No upcoming sessions" el="Δεν υπάρχουν επερχόμενες συνεδρίες" />
                      : t === 'past'
                        ? <BilingualText en="No past sessions" el="Δεν υπάρχουν παρελθούσες συνεδρίες" />
                        : <BilingualText en="No sessions yet" el="Δεν υπάρχουν συνεδρίες ακόμα" />}
                    description={
                      t === 'upcoming'
                        ? <BilingualText en="Browse mentors and request a session to get started." el="Δείτε τους μέντορες και ζητήστε μια συνεδρία για να ξεκινήσετε." />
                        : <BilingualText en="Your completed sessions will appear here." el="Οι ολοκληρωμένες συνεδρίες σας θα εμφανίζονται εδώ." />
                    }
                    askAiPrompt={ASK.sessionsEmpty}
                    action={
                      t === 'upcoming' ? (
                        <Button variant="secondary" className="gap-2" onClick={() => setMainTab('find')}>
                          <GraduationCap className="icon-sm" aria-hidden="true" />
                          <BilingualText en="Find a mentor" el="Βρείτε μέντορα" compact />
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  filteredSessions.map((u) => u.source === 'booking' && u.booking ? (
                    <div key={u.key} id={`session-${u.key}`} className="scroll-mt-24">
                    <BookingCard
                      booking={u.booking}
                      userId={userId}
                      showSource
                      isActing={updateMutation.isPending}
                      onConfirm={() => updateMutation.mutate({ bookingId: u.id, status: 'confirmed' })}
                      onDecline={() => updateMutation.mutate({ bookingId: u.id, status: 'cancelled' })}
                      onCancel={() => updateMutation.mutate({ bookingId: u.id, status: 'cancelled' })}
                    />
                    </div>
                  ) : u.session && u.relationship ? (
                    <MentorshipSessionRow key={u.key} rel={u.relationship} session={u.session} userId={userId} />
                  ) : null)
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>

      <BookingModal
        mentor={selectedMentor}
        open={bookingModalOpen}
        initialNotes={bookingNotes}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedMentor(null);
        }}
        onBook={handleCreateBooking}
      />
      <RequestReviewDialog expert={reviewTarget} defaultArea={service === 'review' ? area : null} onClose={() => setReviewTarget(null)} />
      </div>
    </AppShell>
  );
}
