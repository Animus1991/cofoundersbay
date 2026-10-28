'use client';

import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useToast } from '@/components/ui/toast';
import { BookingCard } from '@/components/mentoring/BookingCard';
import { SessionDateTile } from '@/components/mentoring/SessionDateTile';
import { fromBooking, isUpcoming, type UnifiedSession } from '@/lib/mentoring/sessions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bilingualAria } from '@/lib/i18n/format';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  BrainCircuit,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Video,
  MessageCircle,
  Star,
  Plus,
  ChevronRight,
  Target,
  Users,
  TrendingUp,
  ListChecks,
  Lightbulb,
  Zap,
  CalendarDays,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailStats } from '@/components/layout/RailParts';
import { choiceControl, ROW_GONE, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import { BilingualText } from '@/components/common/BilingualText';
import { CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { Button } from '@/components/ui/button';
import { WithDisabledReason } from '@/components/common/UnavailableButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { qk } from '@/lib/query-keys';
import {
  getMyMentorships,
  getMentorshipSessions,
  listMentorBookings,
  updateMentorBooking,
  updateMentorshipSession,
  type MentorshipRelationshipItem,
  type MentorshipSessionItem,
} from '@/lib/api';
import { COACHING_AREAS, coachingAreasFrom, directoryHref, type CoachingArea } from '@/lib/mentoring/services';

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
/* The six areas are the directory's coaching areas (lib/mentoring/services). */
type SessionType = CoachingArea;

interface CoachingSession {
  id: string;
  /** The coach's user id, for a message; a sample row has none. */
  coachId?: string;
  coachName: string;
  coachAvatar?: string;
  coachTitle: string;
  /* A MentorshipSession has no type column - these six are the showcase's own
     taxonomy - so a real session carries one only when the relationship's
     focus areas name it, and the chip is omitted otherwise. */
  sessionType?: SessionType;
  status: SessionStatus;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl?: string;
  meetingLocation?: string;
  agenda?: string;
  actionItems?: { task: string; done: boolean }[];
  keyInsights?: string;
  rating?: number;
}

/* Why the two disabled controls are disabled, in both languages. Stated as
   constants because each is used in two places and a `title` that disagreed
   with its `aria-label` would read differently to a mouse and a screen
   reader. */
/* Both controls work on a real session now. They stay disabled only for a
   showcase row, which has no session on the server to open or to rate - so the
   hint names that reason rather than claiming the feature does not exist. */
const JOIN_HINT = bilingualAria(
  'Sample session - there is no meeting to join',
  'Δείγμα συνεδρίας - δεν υπάρχει συνάντηση για σύνδεση',
);
const RATE_HINT = bilingualAria(
  'Sample session - there is nothing to rate',
  'Δείγμα συνεδρίας - δεν υπάρχει τίποτα προς βαθμολόγηση',
);

/** A demo row's id, which no endpoint will accept. */
function isDemoSessionId(id: string): boolean {
  return !id.startsWith('preview-') && /^[0-9]+$/.test(id);
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const DEMO_SESSIONS: CoachingSession[] = [
  {
    id: '1',
    coachName: 'Elena Papadopoulos',
    coachTitle: 'Startup Execution Coach',
    sessionType: 'execution',
    status: 'scheduled',
    title: 'Q1 OKR Review & Sprint Planning',
    scheduledAt: '2026-09-16T10:00:00.000Z',
    durationMinutes: 60,
    meetingUrl: 'https://meet.example.com/coaching-001',
    agenda: 'Review Q1 OKR progress, identify blockers, plan Q2 sprint priorities',
    actionItems: [
      { task: 'Define 3 key metrics for MVP launch', done: false },
      { task: 'Schedule team standup rhythm', done: true },
      { task: 'Draft investor update email', done: false },
    ],
  },
  {
    id: '2',
    coachName: 'Marcus Chen',
    coachTitle: 'Founder Clarity Coach',
    sessionType: 'clarity',
    status: 'completed',
    title: 'Vision Alignment Session',
    scheduledAt: '2026-09-02T14:00:00.000Z',
    durationMinutes: 45,
    keyInsights: 'Core tension identified: growth velocity vs. team culture. Decision: prioritize culture first for 60 days.',
    actionItems: [
      { task: 'Write 1-page vision doc', done: true },
      { task: 'Share with co-founder for feedback', done: true },
      { task: 'Book team offsite', done: false },
    ],
    rating: 5,
  },
  {
    id: '3',
    coachName: 'Elena Papadopoulos',
    coachTitle: 'Startup Execution Coach',
    sessionType: 'accountability',
    status: 'completed',
    title: 'Weekly Accountability Check-in',
    scheduledAt: '2026-08-26T10:00:00.000Z',
    durationMinutes: 30,
    actionItems: [
      { task: 'Launch waitlist page', done: true },
      { task: 'Interview 10 potential users', done: true },
      { task: 'Finalize pricing hypothesis', done: true },
    ],
    rating: 4,
  },
];

/**
 * Locale dates after mount so SSR (UTC) and the browser timezone do not mismatch.
 *
 * It formatted in 'en-GB' with an English "at" whatever the reader's language,
 * so the next-session banner read "Monday 5 Oct at 17:00" on a Greek screen.
 * It also took the weekday in UTC and the hour in the local zone: a session at
 * 23:30 UTC showed Sunday's name with Monday's 01:30. This only renders after
 * mount, so both now come from the reader's own zone.
 */
function LocalWhen({ iso, variant }: { iso: string; variant: 'card' | 'banner' }) {
  const { primary } = useLanguagePreference();
  const [label, setLabel] = useState('—');

  useEffect(() => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setLabel('—');
      return;
    }
    const locale = primary === 'el' ? 'el-GR' : 'en-GB';
    if (variant === 'banner') {
      const day = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
      const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      setLabel(primary === 'el' ? `${day} στις ${time}` : `${day} at ${time}`);
      return;
    }
    setLabel(d.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }));
  }, [iso, variant, primary]);

  return <span>{label}</span>;
}

// ── Configs ───────────────────────────────────────────────────────────────────

/** An area's two names, from the directory's vocabulary, so both pages say the same. */
const areaNames = (key: SessionType) => ({ label: COACHING_AREAS[key].en, labelEl: COACHING_AREAS[key].el });

const SESSION_TYPE_CONFIG: Record<SessionType, { label: string; labelEl: string; color: string; icon: React.ElementType }> = {
  accountability: { ...areaNames('accountability'), color: 'bg-status-info-bg text-status-info', icon: ListChecks },
  clarity:        { ...areaNames('clarity'),        color: 'bg-status-accent-bg text-status-accent', icon: Lightbulb },
  team_dynamics:  { ...areaNames('team_dynamics'),  color: 'bg-status-success-bg text-status-success', icon: Users },
  execution:      { ...areaNames('execution'),      color: 'bg-status-warning-bg text-status-warning', icon: Zap },
  strategy:       { ...areaNames('strategy'),       color: 'bg-status-accent-bg text-status-accent', icon: Target },
  wellbeing:      { ...areaNames('wellbeing'),      color: 'bg-status-success-bg text-status-success', icon: BrainCircuit },
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; labelEl: string; color: string; icon: React.ElementType }> = {
  scheduled:   { label: 'Scheduled',   labelEl: 'Προγραμματισμένη', color: 'bg-status-info-bg text-status-info',    icon: Calendar },
  in_progress: { label: 'In Progress', labelEl: 'Σε εξέλιξη',       color: 'bg-status-warning-bg text-status-warning',  icon: Clock },
  completed:   { label: 'Completed',   labelEl: 'Ολοκληρωμένη',     color: 'bg-status-success-bg text-status-success', icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   labelEl: 'Ακυρωμένη',        color: 'bg-muted text-muted-foreground',  icon: XCircle },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: CoachingSession }) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(false);
  const queryClient = useQueryClient();

  /*
   * The founder's own rating of the session. `menteeRating` is the founder's
   * side of the pair - `mentorRating` belongs to the coach and is not this
   * page's to write.
   */
  const rate = useMutation({
    mutationFn: (score: number) => updateMentorshipSession(session.id, { menteeRating: score }),
    onSuccess: () => {
      setRating(false);
      queryClient.invalidateQueries({ queryKey: qk('mentorships', 'sessions') });
    },
  });

  const isSample = isDemoSessionId(session.id);
  const status = STATUS_CONFIG[session.status];
  const type = session.sessionType ? SESSION_TYPE_CONFIG[session.sessionType] : null;
  const StatusIcon = status.icon;
  const completedActions = session.actionItems?.filter((a) => a.done).length ?? 0;
  const totalActions = session.actionItems?.length ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3">
        <CardHead
          mark={<SessionDateTile date={new Date(session.scheduledAt)} />}
          title={session.title}
          subtitle={<BilingualText en={`With ${session.coachName} · ${session.coachTitle}`} el={`Με ${session.coachName} · ${session.coachTitle}`} compact wrap />}
          aside={(
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', status.color)}>
              <StatusIcon className="icon-sm" />
              <BilingualText en={status.label} el={status.labelEl} compact />
            </span>
          )}
        />

        {/* The kind, the time, the length and the room: facts, one line. */}
        <FactLine
          items={[
            type ? <BilingualText key="type" en={type.label} el={type.labelEl} compact /> : null,
            <LocalWhen key="when" iso={session.scheduledAt} variant="card" />,
            <BilingualText key="length" en={`${session.durationMinutes} min`} el={`${session.durationMinutes} λεπτά`} compact />,
            session.meetingUrl ? <BilingualText key="video" en="Video" el="Βιντεοκλήση" compact /> : null,
          ]}
        />

        {/* Action items progress */}
        {totalActions > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <BilingualText en="Action items" el="Ενέργειες" compact />
              </span>
              <span className="font-semibold tabular-nums text-foreground">{completedActions}/{totalActions}</span>
            </div>
            <Progress value={(completedActions / totalActions) * 100} className="h-1.5" />
          </div>
        )}

        {/* Rating */}
        {session.rating && (
          // The stars are the rating: data-keep-icon keeps them past the
          // card's decorative-icon rule, which hid them once this became a Card.
          <div className="flex items-center gap-2">
            <span data-keep-icon="" role="img" aria-label={bilingualAria(`${session.rating} of 5`, `${session.rating} από 5`)} className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('icon-sm', i < session.rating! ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/30')} aria-hidden="true" />
              ))}
            </span>
            <span className="text-xs text-muted-foreground">
              <BilingualText en="Your rating" el="Η βαθμολογία σας" compact />
            </span>
          </div>
        )}

        {/* Actions row: on the card's axis, the details toggle at the right. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            {session.status === 'scheduled' && session.meetingUrl && (
              isSample ? (
                <WithDisabledReason reasonEn="Sample session - there is no meeting to join" reasonEl="Δείγμα συνεδρίας - δεν υπάρχει συνάντηση για σύνδεση">
                  <Button size="sm" className="gap-1" aria-label={JOIN_HINT} disabled>
                    <Video className="icon-sm" aria-hidden="true" />
                    <BilingualText en="Join session" el="Σύνδεση στη συνεδρία" compact wrap />
                  </Button>
                </WithDisabledReason>
              ) : (
                <Button size="sm" className="gap-1" asChild>
                  <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="icon-sm" aria-hidden="true" />
                    <BilingualText en="Join session" el="Σύνδεση στη συνεδρία" compact wrap />
                  </a>
                </Button>
              )
            )}
            {session.status === 'completed' && !session.rating && (
              isSample ? (
                <WithDisabledReason reasonEn="Sample session - there is nothing to rate" reasonEl="Δείγμα συνεδρίας - δεν υπάρχει τίποτα προς βαθμολόγηση">
                  <Button size="sm" variant="outline" className="gap-1" aria-label={RATE_HINT} disabled>
                    <Star className="icon-sm" aria-hidden="true" />
                    <BilingualText en="Rate session" el="Βαθμολόγηση" compact wrap />
                  </Button>
                </WithDisabledReason>
              ) : rating ? (
                /* Five buttons rather than a dialog: the whole interaction is
                   one click, and a dialog would be three. */
                <div className="flex items-center gap-0.5" role="group" aria-label={bilingualAria('Rate this session', 'Βαθμολογήστε τη συνεδρία')}>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      disabled={rate.isPending}
                      onClick={() => rate.mutate(score)}
                      className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-status-warning focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={bilingualAria(`${score} of 5`, `${score} από 5`)}
                    >
                      <Star className="icon-sm" aria-hidden="true" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRating(false)}
                    className="ml-1 text-xs text-muted-foreground underline underline-offset-2"
                  >
                    <BilingualText en="Cancel" el="Ακύρωση" compact />
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setRating(true)}>
                  <Star className="icon-sm" aria-hidden="true" />
                  <BilingualText en="Rate session" el="Βαθμολόγηση" compact wrap />
                </Button>
              )
            )}
            {/* The row's own coach, not the directory: "Find a mentor" on every
                row went to /mentoring, where "Book a session" above already
                goes (docs §90). */}
            {session.coachId && !isSample ? (
              <Button size="sm" variant="outline" className="gap-1" asChild>
                <Link
                  href={`/messages?to=${encodeURIComponent(session.coachId)}`}
                  aria-label={bilingualAria(`Message ${session.coachName}`, `Μήνυμα: ${session.coachName}`)}
                >
                  <MessageCircle className="icon-sm" aria-hidden="true" />
                  <BilingualText en="Message" el="Μήνυμα" compact wrap />
                </Link>
              </Button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex items-center gap-0.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {expanded ? <BilingualText en="Collapse" el="Σύμπτυξη" compact /> : <BilingualText en="Details" el="Λεπτομέρειες" compact />}
            <ChevronRight className={cn('icon-sm transition-transform', expanded && 'rotate-90')} aria-hidden="true" />
          </button>
        </div>
      </CardContent>

      {/* Expanded details, on the card's own padding so the labels keep its axis. */}
      {expanded && (
        <div className="space-y-3 border-t border-border bg-muted/30 p-4 sm:p-6">
          {session.agenda && (
            <div>
              <p className="mb-0.5 text-xs font-medium text-muted-foreground"><BilingualText en="Agenda" el="Ατζέντα" compact /></p>
              <p className="card-body text-foreground">{session.agenda}</p>
            </div>
          )}
          {session.keyInsights && (
            <div>
              <p className="mb-0.5 text-xs font-medium text-muted-foreground"><BilingualText en="Key insights" el="Βασικά συμπεράσματα" compact /></p>
              <p className="card-body italic text-foreground">“{session.keyInsights}”</p>
            </div>
          )}
          {session.actionItems && session.actionItems.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground"><BilingualText en="Action items" el="Ενέργειες" compact /></p>
              <ul className="space-y-1.5">
                {session.actionItems.map((item, idx) => (
                  <li key={idx} className="card-body flex items-center gap-2">
                    <CheckCircle2 className={cn('icon-sm shrink-0', item.done ? 'text-status-success' : 'text-muted-foreground/40')} />
                    <span className={item.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{item.task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** A read that failed, said once, with the way to try again (docs §90). */
function FailedRead({ en, el, onRetry, busy = false, bare = false }: { en: string; el: string; onRetry: () => void; busy?: boolean; bare?: boolean }) {
  return (
    <div className={cn('space-y-3 text-sm text-muted-foreground', !bare && 'rounded-xl border border-border bg-card p-4')}>
      <p role="alert"><BilingualText en={en} el={el} wrap /></p>
      <Button size="sm" variant="outline" disabled={busy} onClick={onRetry}>
        <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

/** The action items a session stores, defensively - the column is free JSON. */
function toActionItems(raw: MentorshipSessionItem['actionItems']): { task: string; done: boolean }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const task = typeof entry?.task === 'string' ? entry.task : typeof entry?.title === 'string' ? entry.title : '';
      return { task, done: entry?.done === true || entry?.completed === true };
    })
    .filter((item) => item.task.length > 0);
}

/**
 * One coaching session, from the mentorship session it already is.
 *
 * The coach's name lives on the relationship, not the session, which is why
 * this takes both. `no_show` folds into `cancelled`: the page speaks in four
 * states and the model in four different ones, and both of those end the
 * appointment without the work happening.
 */
function toCoachingSession(
  row: MentorshipSessionItem,
  relationship: MentorshipRelationshipItem | undefined,
): CoachingSession {
  const focus = relationship?.focusAreas ?? [];
  const [specialty] = coachingAreasFrom(focus);
  return {
    id: row.id,
    coachId: relationship?.mentorId ?? undefined,
    coachName: relationship?.mentor?.displayName ?? 'Your coach',
    coachAvatar: relationship?.mentor?.avatarUrl ?? undefined,
    coachTitle: relationship?.mentor?.headline ?? '',
    sessionType: specialty,
    status: row.status === 'no_show' ? 'cancelled' : row.status,
    title: row.title?.trim() || 'Coaching session',
    scheduledAt: row.scheduledAt,
    durationMinutes: row.duration,
    meetingUrl: row.meetingUrl ?? undefined,
    meetingLocation: row.meetingLocation ?? undefined,
    agenda: row.agenda ?? undefined,
    actionItems: toActionItems(row.actionItems),
    // The founder's own notes and the rating the founder gave - not the
    // coach's, which belong to the coach's side of the same session.
    keyInsights: row.menteeNotes ?? undefined,
    rating: row.menteeRating ?? undefined,
  };
}

export default function CoachingPage() {
  const [activeTab, setActiveTab] = useState('sessions');
  const { showDemoData } = useDemoData();
  const router = useRouter();
  /*
   * Coaching is mentorship seen from the founder's side.
   *
   * The relationships carry the coach; the sessions hang off them. Sessions
   * are listable per relationship only, which is the right shape here - a
   * founder has a handful of coaches, and asking per relationship keeps the
   * coach's name beside every session without a second lookup.
   */
  const { data: relationshipData, isLoading: relationshipsLoading, isError: relationshipsError, refetch: refetchRelationships } = useQuery({
    queryKey: qk('mentorships', 'mentee'),
    queryFn: () => getMyMentorships('mentee'),
    staleTime: 60_000,
    retry: 0,
  });

  /*
   * Sessions booked directly on /mentoring live in the booking store, not a
   * relationship. Until this read they were invisible on the founder's own
   * coaching page.
   */
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const userId = useStoredUser()?.id ?? null;
  const { data: bookingData, isLoading: bookingsLoading, isError: bookingsError, refetch: refetchBookings } = useQuery({
    queryKey: qk('mentorships', 'bookings', 'mentee'),
    queryFn: () => listMentorBookings('mentee'),
    staleTime: 30_000,
    retry: 0,
  });
  const [bookingActing, setBookingActing] = useState(false);
  const cancelBooking = async (id: string) => {
    setBookingActing(true);
    try {
      await updateMentorBooking(id, { status: 'cancelled' });
      toastSuccess('Booking cancelled');
      await queryClient.invalidateQueries({ queryKey: qk('mentorships', 'bookings') });
    } catch (e) {
      toastError('Could not cancel the booking', e instanceof Error ? e.message : undefined);
      return { error: e instanceof Error && e.message ? e.message : 'The booking is still live.' };
    } finally {
      setBookingActing(false);
    }
  };
  const bookingRows = (bookingData?.bookings ?? []).map((b) => fromBooking(b, userId));

  const relationships = useMemo(
    () => relationshipData?.relationships ?? [],
    [relationshipData],
  );

  const sessionQueries = useQueries({
    queries: relationships.map((relationship) => ({
      queryKey: qk('mentorships', 'sessions', relationship.id),
      queryFn: () => getMentorshipSessions(relationship.id),
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const sessionsLoading = relationshipsLoading || sessionQueries.some((q) => q.isLoading);

  const liveSessions = useMemo(() => {
    const byId = new Map(relationships.map((r) => [r.id, r]));
    return sessionQueries
      .flatMap((query) => query.data?.sessions ?? [])
      .map((row) => toCoachingSession(row, byId.get(row.relationshipId)))
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    // `sessionQueries` is a fresh array each render; its data is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationships, sessionQueries.map((q) => q.dataUpdatedAt).join(',')]);

  const sessions =
    liveSessions.length > 0
      ? liveSessions
      : sessionsLoading
        ? []
        : showDemoData
          ? DEMO_SESSIONS
          : [];

  /*
   * The coach list was the mentor directory again - the same people, read a
   * second time, with "Book" sending the reader to Mentors without the
   * person. Coaches are found in the one directory now, with Coaching
   * chosen and the area set (owner, 2026-10-28; docs §90.5, §111).
   */

  /*
   * A list not yet read is not empty (docs §90): a failed read of the
   * mentorships, a coach's sessions or the bookings said "No coaching
   * sessions yet" and offered to find a coach.
   */
  const showingSampleSessions = liveSessions.length === 0 && !sessionsLoading && showDemoData;
  const sessionsReadFailed =
    !showingSampleSessions &&
    ((relationshipsError && !relationshipData) ||
      sessionQueries.some((q) => q.isError && !q.data) ||
      (bookingsError && !bookingData));
  const listsLoading = sessionsLoading || bookingsLoading;
  const retrySessions = () => {
    void refetchRelationships();
    void refetchBookings();
    for (const q of sessionQueries) if (q.isError) void q.refetch();
  };

  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress');
  const completed = sessions.filter((s) => s.status === 'completed');

  // Bookings merge into the same upcoming/completed groupings the page
  // already draws, earliest first.
  const upcomingBookings = bookingRows.filter(isUpcoming);
  const completedBookings = bookingRows.filter((u) => u.status === 'completed');
  type Row = { kind: 'session'; s: CoachingSession; at: string } | { kind: 'booking'; u: UnifiedSession; at: string };
  const upcomingMerged: Row[] = [
    ...upcoming.map((s) => ({ kind: 'session' as const, s, at: s.scheduledAt })),
    ...upcomingBookings.map((u) => ({ kind: 'booking' as const, u, at: u.startAt })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const completedMerged: Row[] = [
    ...completed.map((s) => ({ kind: 'session' as const, s, at: s.scheduledAt })),
    ...completedBookings.map((u) => ({ kind: 'booking' as const, u, at: u.startAt })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const renderRow = (row: Row) =>
    row.kind === 'session' ? (
      <SessionCard key={`session:${row.s.id}`} session={row.s} />
    ) : row.u.booking ? (
      <BookingCard
        key={row.u.key}
        booking={row.u.booking}
        userId={userId}
        showSource
        isActing={bookingActing}
        onConfirm={() => void cancelBooking(row.u.id)}
        onDecline={() => void cancelBooking(row.u.id)}
        onCancel={() => void cancelBooking(row.u.id)}
      />
    ) : null;
  const hasRows = upcomingMerged.length + completedMerged.length > 0;
  const sessionsEmpty = !listsLoading && !sessionsReadFailed && sessions.length === 0 && bookingRows.length === 0;
  const totalActionItems = sessions.flatMap((s) => s.actionItems ?? []);
  const completedActions = totalActionItems.filter((a) => a.done).length;

  /*
   * The four figures, and the six filters.
   *
   * They used to sit above the sessions, so the first thing a founder met on
   * their coaching page was a row of totals. They are still exactly the same
   * figures and the same chips - reachable from the strip on the right, and
   * kept open by anyone who wants them there.
   */
  /*
   * "Total sessions" counted the coaching sessions only (3) over a list of
   * four rows with the booking; it now counts the rows listed. The average
   * divided by the rated sessions, and printed "NaN/5" when none was rated.
   * A figure that was not read is a dash (docs §90).
   */
  const rated = completed.filter((s) => s.rating);
  const unread = sessionsReadFailed;
  const railStats = [
    { labelEn: 'Total sessions', labelEl: 'Συνολικές συνεδρίες', value: unread ? '—' : upcomingMerged.length + completedMerged.length, icon: Calendar, color: 'text-primary-accessible', bg: 'bg-primary/10' },
    { labelEn: 'Upcoming', labelEl: 'Επερχόμενες', value: unread ? '—' : upcomingMerged.length, icon: Clock, color: 'text-status-info', bg: 'bg-status-info-bg' },
    { labelEn: 'Action items done', labelEl: 'Ολοκληρωμένες ενέργειες', value: unread ? '—' : `${completedActions}/${totalActionItems.length}`, icon: ListChecks, color: 'text-status-success', bg: 'bg-status-success-bg' },
    { labelEn: 'Avg rating', labelEl: 'Μέση βαθμολογία', value: !unread && rated.length ? `${(rated.reduce((a, s) => a + (s.rating ?? 0), 0) / rated.length).toFixed(1)}/5` : '—', icon: Star, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
  ];

  usePageList([
    {
      id: 'sessions',
      labelEn: 'Coaching sessions',
      labelEl: 'Συνεδρίες coaching',
      rows: sessionsLoading || bookingsLoading ? undefined : [
        ...sessions.map((s) => `${s.scheduledAt.slice(0, 10)} · ${s.title} · with ${s.coachName} · ${s.status} · ${s.durationMinutes} min`),
        ...bookingRows.map((u) => `${u.startAt.slice(0, 10)} · ${u.counterpart.displayName} · ${u.status} · ${u.durationMin != null ? `${u.durationMin} min` : '—'} · booking`),
      ],
      sample: liveSessions.length === 0 && showDemoData,
    },
  ]);
  // Offered to the assistant: the tab, and finding a coach by area, which
  // opens the one mentor directory with Coaching and the area chosen.
  usePageControls([
    choiceControl('tab', 'Coaching tab', 'Καρτέλα coaching', [
      { value: 'sessions', en: 'My Sessions', el: 'Οι συνεδρίες μου' },
      { value: 'actions', en: 'Action Items', el: 'Ενέργειες' },
      { value: 'insights', en: 'Insights', el: 'Αναλύσεις' },
    ], activeTab, setActiveTab),
    {
      id: 'find_coach',
      labelEn: 'Find a coach in the mentor directory, for',
      labelEl: 'Εύρεση coach στον κατάλογο μεντόρων, για',
      writes: false,
      options: [
        { value: 'any', labelEn: 'Any area', labelEl: 'Οποιοσδήποτε τομέας' },
        ...(Object.entries(SESSION_TYPE_CONFIG) as [SessionType, (typeof SESSION_TYPE_CONFIG)[SessionType]][]).map(([key, cfg]) => ({ value: key, labelEn: cfg.label, labelEl: cfg.labelEl })),
      ],
      run: (v) => router.push(directoryHref('coaching', v && v !== 'any' ? v : null)),
    },
    {
      id: 'cancel_booking',
      labelEn: 'Cancel booking',
      labelEl: 'Ακύρωση κράτησης',
      writes: true,
      options: rowOptions(upcomingBookings, (u) => u.id, (u) => `${u.counterpart.displayName} · ${u.startAt.slice(0, 16).replace('T', ' ')}`),
      run: (v) => (v && bookingData?.bookings?.some((b) => b.id === v) ? cancelBooking(v) : ROW_GONE),
    },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'chart',
      labelEn: 'Summary',
      labelEl: 'Σύνοψη',
      content: (
        // The shared rail figures: a soft tile per figure, not a framed card.
        <RailStats
          items={railStats.map(({ labelEn, labelEl, value, icon, color, bg }) => ({
            key: labelEn,
            label: labelEn,
            labelEl,
            value,
            icon,
            tone: cn(bg, color),
          }))}
        />
      ),
    },
    {
      id: 'find',
      glyph: 'target',
      labelEn: 'Find a coach',
      labelEl: 'Εύρεση coach',
      content: (
        // The six areas filtered a coach list here; the list is the mentor
        // directory now, so each opens it narrowed to that area (docs §111).
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <BilingualText
              en="Coaches are in the mentor directory. Pick what you want help with."
              el="Οι coaches βρίσκονται στον κατάλογο μεντόρων. Διαλέξτε σε τι θέλετε βοήθεια."
              stacked
              wrap
            />
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(SESSION_TYPE_CONFIG) as [SessionType, typeof SESSION_TYPE_CONFIG[SessionType]][]).map(([key, cfg]) => (
              <Link
                key={key}
                href={directoryHref('coaching', key)}
                className={cn(
                  'flex min-h-9 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all hover:opacity-80',
                  cfg.color,
                )}
              >
                <cfg.icon className="icon-sm" aria-hidden="true" />
                <BilingualText en={cfg.label} el={cfg.labelEl} compact />
              </Link>
            ))}
          </div>
          <RailAction icon={Users} en="All coaches" el="Όλοι οι coaches" onClick={() => router.push(directoryHref('coaching'))} />
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
    <AppShell
      rail={rail}
      title="Coaching"
      titleEl="Καθοδήγηση"
      description="Accountability, clarity, and execution coaching for founders and teams"
      descriptionEl="Καθοδήγηση λογοδοσίας, διαύγειας και εκτέλεσης για ιδρυτές και ομάδες"
    >
      <div className="space-y-6 pb-10">

        {/* Upcoming session banner. On My Sessions the same session is the
            first row under "Upcoming", with its own Join: the banner repeated
            it there, so it shows over the other tabs only (docs §90). */}
        {upcomingMerged.length > 0 && activeTab !== 'sessions' && (() => {
          const next = upcomingMerged[0];
          const nextBooking = next.kind === 'booking' ? next.u : null;
          const nextTitle = next.kind === 'session' ? next.s.title : nextBooking?.title ?? null;
          const nextName = next.kind === 'session' ? next.s.coachName : nextBooking?.counterpart?.displayName ?? '';
          const nextUrl = next.kind === 'session' ? next.s.meetingUrl : nextBooking?.meetingUrl ?? undefined;
          const nextId = next.kind === 'session' ? next.s.id : nextBooking?.id ?? '';
          return (
          <div data-card="" className="rounded-2xl border border-status-info-border bg-status-info-bg p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                <p className="mb-0.5 text-xs font-medium text-status-info"><BilingualText en="Next session" el="Επόμενη συνεδρία" compact /></p>
                <h2 className="card-title text-foreground">
                  {nextTitle ?? <BilingualText en="Mentoring session" el="Συνεδρία καθοδήγησης" compact />}
                </h2>
                <p className="card-subtitle mt-0.5">
                  <BilingualText en={`With ${nextName}`} el={`Με ${nextName}`} compact /> · <LocalWhen iso={next.at} variant="banner" />
                </p>
              </div>
              {nextUrl && (
                isDemoSessionId(nextId) ? (
                  <WithDisabledReason reasonEn="Sample session - there is no meeting to join" reasonEl="Δείγμα συνεδρίας - δεν υπάρχει συνάντηση για σύνδεση">
                    <Button size="sm" className="shrink-0 gap-1.5" aria-label={JOIN_HINT} disabled>
                      <Video className="icon-sm" aria-hidden="true" />
                      <BilingualText en="Join" el="Σύνδεση" compact wrap />
                    </Button>
                  </WithDisabledReason>
                ) : (
                  <Button size="sm" className="shrink-0 gap-1.5" asChild>
                    <a href={nextUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="icon-sm" aria-hidden="true" />
                      <BilingualText en="Join" el="Σύνδεση" compact wrap />
                    </a>
                  </Button>
                )
              )}
            </div>
          </div>
          );
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Wraps rather than clips: four tabs and a primary action do not
              fit one row once the rail takes its width. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-9 flex-wrap">
              <TabsTrigger value="sessions" className="text-xs"><BilingualText en="My Sessions" el="Οι συνεδρίες μου" compact /></TabsTrigger>
              <TabsTrigger value="actions" className="text-xs"><BilingualText en="Action Items" el="Ενέργειες" compact /></TabsTrigger>
              <TabsTrigger value="insights" className="text-xs"><BilingualText en="Insights" el="Αναλύσεις" compact /></TabsTrigger>
            </TabsList>
            {/* Hidden while the empty My Sessions carries its own way in. */}
            {sessionsEmpty && activeTab === 'sessions' ? null : (
              <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
                <Link href={directoryHref('coaching')}>
                  <Plus className="icon-sm" aria-hidden="true" />
                  <BilingualText en="Book a session" el="Κράτηση συνεδρίας" compact wrap />
                </Link>
              </Button>
            )}
          </div>

          {/* My Sessions */}
          <TabsContent value="sessions" className="mt-4 space-y-3">
            {listsLoading && !hasRows ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : sessionsReadFailed && !hasRows ? (
              <FailedRead
                en="Your sessions could not be read just now."
                el="Οι συνεδρίες σας δεν διαβάστηκαν αυτή τη στιγμή."
                onRetry={retrySessions}
              />
            ) : sessionsEmpty ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <BrainCircuit className="h-7 w-7 text-primary-accessible" />
                </div>
                <div>
                  <p className="font-semibold text-foreground"><BilingualText en="No coaching sessions yet" el="Δεν υπάρχουν συνεδρίες coaching ακόμα" /></p>
                  <p className="mt-1 text-sm text-muted-foreground"><BilingualText en="Book your first session with a coach to get started." el="Κλείστε την πρώτη σας συνεδρία με coach για να ξεκινήσετε." /></p>
                </div>
                <Button size="sm" asChild>
                  <Link href={directoryHref('coaching')}><BilingualText en="Find a coach" el="Εύρεση coach" compact /></Link>
                </Button>
              </div>
            ) : (
              <>
                {sessionsReadFailed ? (
                  // Some stores answered and one did not: the rows are real,
                  // and the list says it may be missing some.
                  <FailedRead
                    en="Some of your sessions could not be read just now."
                    el="Μερικές από τις συνεδρίες σας δεν διαβάστηκαν αυτή τη στιγμή."
                    onRetry={retrySessions}
                  />
                ) : null}
                {upcomingMerged.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><BilingualText en="Upcoming" el="Επερχόμενες" compact /></p>
                    <div className="space-y-3">{upcomingMerged.map(renderRow)}</div>
                  </div>
                )}
                {completedMerged.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><BilingualText en="Completed" el="Ολοκληρωμένες" compact /></p>
                    <div className="space-y-3">{completedMerged.map(renderRow)}</div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Action Items */}
          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle><BilingualText en="All Action Items" el="Όλες οι ενέργειες" compact /></CardTitle>
              </CardHeader>
              {/* One row per item on the card's axis, hairlines between them:
                  the rows were inset 8px with a hover box of their own. */}
              <CardContent className="card-rows">
                {totalActionItems.length === 0 ? (
                  sessionsReadFailed ? (
                    <FailedRead
                      en="Your action items could not be read just now."
                      el="Οι ενέργειές σας δεν διαβάστηκαν αυτή τη στιγμή."
                      onRetry={retrySessions}
                      bare
                    />
                  ) : (
                    // The card had a title and nothing under it.
                    <p className="text-sm text-muted-foreground">
                      <BilingualText
                        en="No action items yet. Your coach adds them to a session; they gather here from every session."
                        el="Δεν υπάρχουν ακόμη ενέργειες. Ο coach σας τις προσθέτει σε μια συνεδρία· εδώ συγκεντρώνονται από όλες."
                        wrap
                      />
                    </p>
                  )
                ) : null}
                {sessions.flatMap((session) =>
                  (session.actionItems ?? []).map((item, idx) => (
                    <div key={`${session.id}-${idx}`} className="flex items-start gap-3">
                      <CheckCircle2 className={cn('mt-0.5 icon-sm shrink-0', item.done ? 'text-status-success' : 'text-muted-foreground/30')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', item.done ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.task}</p>
                        <p className="text-xs text-muted-foreground"><BilingualText en={`From: ${session.title}`} el={`Από: ${session.title}`} compact wrap /></p>
                      </div>
                      {!item.done && (
                        <Badge variant="outline" className="shrink-0 text-2xs"><BilingualText en="Pending" el="Εκκρεμεί" compact /></Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="mt-4 space-y-4">
            {sessions.length === 0 ? (
              // Two cards of "0 of 0" and no themes said nothing.
              sessionsReadFailed ? (
                <FailedRead
                  en="Your sessions could not be read just now."
                  el="Οι συνεδρίες σας δεν διαβάστηκαν αυτή τη στιγμή."
                  onRetry={retrySessions}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  <BilingualText
                    en="Insights appear after your first coaching session: its themes, how many action items you closed, and the key takeaways."
                    el="Οι αναλύσεις εμφανίζονται μετά την πρώτη σας συνεδρία coaching: τα θέματά της, πόσες ενέργειες κλείσατε και τα βασικά συμπεράσματα."
                    wrap
                  />
                </div>
              )
            ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="icon-sm text-muted-foreground" /> <BilingualText en="Session Themes" el="Θέματα συνεδριών" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!sessions.some((s) => s.sessionType) ? (
                    <p className="text-sm text-muted-foreground">
                      <BilingualText en="No session names a theme yet." el="Καμία συνεδρία δεν ορίζει ακόμη θέμα." wrap />
                    </p>
                  ) : null}
                  {(Object.keys(SESSION_TYPE_CONFIG) as SessionType[]).map((type) => {
                    const count = sessions.filter((s) => s.sessionType === type).length;
                    if (!count) return null;
                    const cfg = SESSION_TYPE_CONFIG[type];
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-2xs w-32', cfg.color)}><BilingualText en={cfg.label} el={cfg.labelEl} compact /></span>
                        <Progress value={(count / sessions.length) * 100} className="flex-1 h-1.5" />
                        <span className="text-xs text-muted-foreground w-4">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="icon-sm text-status-success" /> <BilingualText en="Execution Rate" el="Ποσοστό εκτέλεσης" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                        <circle
                          cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                          strokeDasharray={`${(completedActions / Math.max(totalActionItems.length, 1)) * 97.4} 97.4`}
                          className="stroke-status-success" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-foreground">
                          {totalActionItems.length ? Math.round((completedActions / totalActionItems.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground"><BilingualText en="Action completion" el="Ολοκλήρωση ενεργειών" compact /></p>
                      <p className="text-xs text-muted-foreground"><BilingualText en={`${completedActions} of ${totalActionItems.length} items done`} el={`${completedActions} από ${totalActionItems.length} ολοκληρώθηκαν`} compact wrap /></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key insight quotes */}
            {sessions.filter((s) => s.keyInsights).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="icon-sm text-status-warning" /> <BilingualText en="Key Insights" el="Βασικές αναλύσεις" compact />
                  </CardTitle>
                </CardHeader>
                {/* Quotes as rows on the card's axis, not a tinted box each. */}
                <CardContent className="card-rows">
                  {sessions.filter((s) => s.keyInsights).map((s) => (
                    <figure key={s.id}>
                      <blockquote className="card-body italic text-muted-foreground">“{s.keyInsights}”</blockquote>
                      <figcaption className="mt-1 text-xs text-muted-foreground">— {s.title}</figcaption>
                    </figure>
                  ))}
                </CardContent>
              </Card>
            )}
            </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
