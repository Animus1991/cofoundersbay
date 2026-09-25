'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { BilingualText } from '@/components/common/BilingualText';
import { useHydrated } from '@/components/common/RelativeTime';
import {
  getOrgCohortDetail,
  type CohortParticipant,
  type CohortMatch,
  type CohortSession,
} from '@/lib/api';
import { useParams } from 'next/navigation';
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  GraduationCap,
  Target,
  MessageCircle,
  Link2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Clock3,
  MoreVertical,
  Download,
  Share2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { downloadCsv } from '@/lib/csv';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, initialsOf } from '@/lib/utils';
import Link from 'next/link';
import { qk } from '@/lib/query-keys';

// Types
interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'mentor' | 'investor';
  startup?: string;
  status: 'active' | 'inactive' | 'pending';
  avatarUrl?: string;
  joinDate: string;
  location?: string;
  phone?: string;
  progress?: number;
}

interface Match {
  id: string;
  participant1: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  participant2: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  matchScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  matchedDate: string;
  interactions: number;
  lastInteraction?: string;
}

interface MentoringSession {
  id: string;
  mentor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  mentee: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  topic: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  rating?: number;
  notes?: string;
}

interface CohortStats {
  totalParticipants: number;
  activeStartups: number;
  totalMentors: number;
  completedSessions: number;
  upcomingSessions: number;
  totalMatches: number;
  successfulMatches: number;
  averageMatchScore: number;
}

// Mock data
const DEMO_COHORT = {
  id: '1',
  name: 'Spring 2026 Accelerator',
  program: 'CoFounderBay Accelerator',
  // A spring cohort is not still running in the autumn. The live path derives
  // this from `isActive`; the sample derives it from its own end date so the
  // badge cannot outlive the programme.
  status: new Date('2026-06-01T00:00:00Z') < new Date() ? 'completed' : 'active',
  startDate: '2026-03-01',
  endDate: '2026-06-01',
  description: 'A 12-week intensive program for early-stage startups focusing on product-market fit, growth strategies, and fundraising.',
  location: 'San Francisco, CA',
};

const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: '1',
    name: 'Elena Papadopoulos',
    email: 'elena@techstart.io',
    role: 'founder',
    startup: 'TechStart',
    status: 'active',
    joinDate: '2026-03-01',
    location: 'Athens, Greece',
    phone: '+30 210 123 4567',
    progress: 75,
  },
  {
    id: '2',
    name: 'Marcus Chen',
    email: 'marcus@devstack.com',
    role: 'founder',
    startup: 'DevStack',
    status: 'active',
    joinDate: '2026-03-01',
    location: 'San Francisco, CA',
    phone: '+1 415 555 0123',
    progress: 60,
  },
  {
    id: '3',
    name: 'Dr. Sarah Kim',
    email: 'sarah@mentorpro.com',
    role: 'mentor',
    status: 'active',
    joinDate: '2026-03-01',
    location: 'Palo Alto, CA',
    phone: '+1 650 555 0456',
  },
  {
    id: '4',
    name: 'Alex Dimitriou',
    email: 'alex@investor.vc',
    role: 'investor',
    status: 'active',
    joinDate: '2026-03-15',
    location: 'London, UK',
    phone: '+44 20 7946 0958',
  },
];

const DEMO_MATCHES: Match[] = [
  {
    id: '1',
    participant1: {
      id: '1',
      name: 'Elena Papadopoulos',
      role: 'Founder',
    },
    participant2: {
      id: '3',
      name: 'Dr. Sarah Kim',
      role: 'Mentor',
    },
    matchScore: 92,
    status: 'accepted',
    matchedDate: '2026-03-05',
    interactions: 12,
    lastInteraction: '2026-03-26',
  },
  {
    id: '2',
    participant1: {
      id: '2',
      name: 'Marcus Chen',
      role: 'Founder',
    },
    participant2: {
      id: '4',
      name: 'Alex Dimitriou',
      role: 'Investor',
    },
    matchScore: 85,
    status: 'pending',
    matchedDate: '2026-03-27',
    interactions: 2,
  },
];

const DEMO_MENTORING_SESSIONS: MentoringSession[] = [
  {
    id: '1',
    mentor: {
      id: '3',
      name: 'Dr. Sarah Kim',
    },
    mentee: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    topic: 'Product Strategy & Market Fit',
    scheduledDate: '2026-03-28T14:00:00Z',
    duration: 60,
    status: 'scheduled',
  },
  {
    id: '2',
    mentor: {
      id: '3',
      name: 'Dr. Sarah Kim',
    },
    mentee: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    topic: 'Fundraising Strategy',
    scheduledDate: '2026-03-20T15:00:00Z',
    duration: 90,
    status: 'completed',
    rating: 5,
    notes: 'Excellent session. Discussed Series A preparation and investor outreach.',
  },
];

/**
 * Counted from the three arrays above, not written beside them.
 *
 * These tiles used to claim 24 participants over a list of four and 45
 * sessions over two, sitting a few pixels from tab labels that counted the
 * same arrays correctly.
 */
const DEMO_STATS: CohortStats = (() => {
  const accepted = DEMO_MATCHES.filter((m) => m.status === 'accepted');
  const scores = DEMO_MATCHES.map((m) => m.matchScore);
  return {
    totalParticipants: DEMO_PARTICIPANTS.length,
    activeStartups: DEMO_PARTICIPANTS.filter((p) => p.role === 'founder').length,
    totalMentors: DEMO_PARTICIPANTS.filter((p) => p.role === 'mentor').length,
    completedSessions: DEMO_MENTORING_SESSIONS.filter((x) => x.status === 'completed').length,
    upcomingSessions: DEMO_MENTORING_SESSIONS.filter((x) => x.status === 'scheduled').length,
    totalMatches: DEMO_MATCHES.length,
    successfulMatches: accepted.length,
    averageMatchScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
  };
})();

/** The cohort's own people, in the shape this page has always rendered. */
function toParticipant(row: CohortParticipant): Participant {
  return {
    id: row.userId,
    name: row.name ?? 'A participant',
    email: row.email,
    role: row.role,
    // No column names a startup; a founder's headline is the line they write
    // about what they are building.
    startup: row.headline ?? undefined,
    status: row.status,
    avatarUrl: row.avatarUrl ?? undefined,
    joinDate: row.joinedAt,
    location: row.location ?? undefined,
  };
}

/**
 * A match inside the cohort.
 *
 * The page speaks in pending / accepted / rejected; a suggestion has five
 * states. "Connected" is the one that actually became a relationship, and
 * "dismissed" is the one somebody turned down - the three in between are all
 * still open.
 */
const MATCH_STATE: Record<CohortMatch['status'], Match['status']> = {
  pending: 'pending',
  viewed: 'pending',
  saved: 'pending',
  connected: 'accepted',
  dismissed: 'rejected',
};

function toMatch(row: CohortMatch): Match {
  return {
    id: row.id,
    participant1: {
      id: row.a?.id ?? '',
      name: row.a?.name ?? 'A participant',
      role: row.a?.role ?? '',
      avatarUrl: row.a?.avatarUrl ?? undefined,
    },
    participant2: {
      id: row.b?.id ?? '',
      name: row.b?.name ?? 'A participant',
      role: row.b?.role ?? '',
      avatarUrl: row.b?.avatarUrl ?? undefined,
    },
    matchScore: row.score,
    status: MATCH_STATE[row.status] ?? 'pending',
    matchedDate: row.generatedAt,
    // Nothing counts interactions per pair, so the card shows none rather than
    // a number nobody measured.
    interactions: 0,
  };
}

function toSession(row: CohortSession): MentoringSession {
  return {
    id: row.id,
    mentor: {
      id: row.mentor?.id ?? '',
      name: row.mentor?.name ?? 'A mentor',
      avatarUrl: row.mentor?.avatarUrl ?? undefined,
    },
    mentee: {
      id: row.mentee?.id ?? '',
      name: row.mentee?.name ?? 'A participant',
      avatarUrl: row.mentee?.avatarUrl ?? undefined,
    },
    topic: row.title?.trim() || 'Mentoring session',
    scheduledDate: row.scheduledAt,
    duration: row.duration,
    // The page has no "no show"; it ends the appointment the same way.
    status: row.status === 'no_show' ? 'cancelled' : row.status,
    rating: row.rating ?? undefined,
  };
}

export default function CohortDetailPage() {
  const params = useParams();
  const cohortId = params?.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  const { slug } = useCurrentOrg();

  /*
   * One request for the whole dashboard. The id in the URL used to be read and
   * then ignored, so every cohort an organiser opened was the same one.
   */
  const { data, isLoading } = useQuery({
    queryKey: qk('org', slug, 'cohort', cohortId),
    queryFn: () => getOrgCohortDetail(slug!, cohortId),
    enabled: Boolean(slug && cohortId),
    staleTime: 60_000,
    retry: 0,
  });

  const live = data ?? null;

  const cohort = live
    ? {
        id: live.cohort.id,
        name: live.cohort.name,
        // The organiser is the programme; the cohort is one run of it.
        program: live.cohort?.tags?.[0] ?? '',
        status: live.cohort.isActive ? 'active' : 'completed',
        startDate: live.cohort?.startDate ?? '',
        endDate: live.cohort?.endDate ?? '',
        description: live.cohort?.description ?? '',
        // No column records where a cohort meets.
        location: '',
      }
    : DEMO_COHORT;

  const participants = useMemo(
    () => (live ? live.participants.map(toParticipant) : isLoading ? [] : DEMO_PARTICIPANTS),
    [live, isLoading],
  );
  const matches = useMemo(
    () => (live ? live.matches.map(toMatch) : isLoading ? [] : DEMO_MATCHES),
    [live, isLoading],
  );
  const sessions = useMemo(
    () => (live ? live.sessions.map(toSession) : isLoading ? [] : DEMO_MENTORING_SESSIONS),
    [live, isLoading],
  );

  const stats: CohortStats = live
    ? {
        totalParticipants: live.stats.participants,
        activeStartups: live.stats.founders,
        totalMentors: live.stats.mentors,
        completedSessions: live.stats.completedSessions,
        upcomingSessions: live.stats.upcomingSessions,
        totalMatches: live.stats.matches,
        successfulMatches: live.stats.connectedMatches,
        averageMatchScore: live.stats?.avgMatchScore ?? 0,
      }
    : DEMO_STATS;

  /*
   * How far through the programme this cohort is.
   *
   * The tile used to read 67% for every cohort on every day. `useHydrated`
   * keeps the clock out of the server pass - the server and the browser would
   * otherwise disagree on "now" and React would discard the tree - and a
   * cohort with no dates has no progress to report rather than a default one.
   */
  const hydrated = useHydrated();
  const programProgress = useMemo(() => {
    if (!hydrated || !cohort.startDate || !cohort.endDate) return null;
    const start = new Date(cohort.startDate).getTime();
    const end = new Date(cohort.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    const ratio = (Date.now() - start) / (end - start);
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }, [hydrated, cohort.startDate, cohort.endDate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short',
      day: 'numeric',
      year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      active: { variant: 'default', className: 'bg-status-success-bg text-status-success border-status-success-border' },
      inactive: { variant: 'secondary', className: 'bg-muted text-foreground' },
      pending: { variant: 'outline', className: 'bg-status-warning-bg text-status-warning border-status-warning-border' },
      scheduled: { variant: 'outline', className: 'bg-status-info-bg text-status-info border-status-info-border' },
      completed: { variant: 'default', className: 'bg-status-success-bg text-status-success border-status-success-border' },
      cancelled: { variant: 'destructive', className: '' },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      founder: 'bg-status-info-bg text-status-info border-status-info-border',
      mentor: 'bg-status-accent-bg text-status-accent border-status-accent-border',
      investor: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    };

    return (
      <Badge variant="outline" className={colors[role] || colors.founder}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <AppShell
      title={cohort.name}
      description={`${cohort.program} • ${formatDate(cohort.startDate)} - ${formatDate(cohort.endDate)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* All three had no handler. Share copies this page; Export is
              the participant list; a message to everyone has no group
              thread to go to yet. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigator.clipboard?.writeText(window.location.href)}
          >
            <Share2 className="icon-sm mr-2" aria-hidden="true" />
            <BilingualText en="Share" el="Κοινοποίηση" compact />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={participants.length === 0}
            onClick={() =>
              downloadCsv(
                `cohort-${cohort.name}`,
                ['name', 'email', 'role', 'startup', 'status', 'joined', 'location', 'progress'],
                participants.map((pt) => [pt.name, pt.email, pt.role, pt.startup, pt.status, pt.joinDate, pt.location, pt.progress]),
              )
            }
          >
            <Download className="icon-sm mr-2" aria-hidden="true" />
            <BilingualText en="Export" el="Εξαγωγή" compact />
          </Button>
          {/* There is no group thread for a cohort, but every participant row
              carries an address: one email with the cohort in Bcc reaches
              everyone without exposing their addresses to each other. */}
          {participants.some((pt) => pt.email) ? (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:?bcc=${encodeURIComponent(participants.map((pt) => pt.email).filter(Boolean).join(','))}&subject=${encodeURIComponent(cohort.name)}`}>
                <Mail className="icon-sm mr-2" aria-hidden="true" />
                <BilingualText en="Email all" el="Email σε όλους" compact />
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled title="Nobody in this cohort has an email address on file">
              <Mail className="icon-sm mr-2" aria-hidden="true" />
              <BilingualText en="Email all" el="Email σε όλους" compact />
            </Button>
          )}
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BilingualText en="Overview" el="Επισκόπηση" compact />
          </TabsTrigger>
          <TabsTrigger value="participants">
            <BilingualText
              en={`Participants (${participants.length})`}
              el={`Συμμετέχοντες (${participants.length})`}
              compact
            />
          </TabsTrigger>
          <TabsTrigger value="matches">
            <BilingualText
              en={`Matches (${matches.length})`}
              el={`Αντιστοιχίσεις (${matches.length})`}
              compact
            />
          </TabsTrigger>
          <TabsTrigger value="mentoring">
            <BilingualText
              en={`Mentoring (${sessions.length})`}
              el={`Καθοδήγηση (${sessions.length})`}
              compact
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 kpi-odd-span-md md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <BilingualText en="Total Participants" el="Σύνολο συμμετεχόντων" compact wrap />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                  <Users className="icon-sm text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <BilingualText
                    en={`${stats.activeStartups} active startups • ${stats.totalMentors} mentors`}
                    el={`${stats.activeStartups} νεοφυείς • ${stats.totalMentors} μέντορες`}
                    compact
                    wrap
                  />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <BilingualText en="Mentoring Sessions" el="Συνεδρίες καθοδήγησης" compact wrap />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.completedSessions}</div>
                  <GraduationCap className="icon-sm text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <BilingualText
                    en={`${stats.upcomingSessions} upcoming sessions`}
                    el={`${stats.upcomingSessions} επερχόμενες συνεδρίες`}
                    compact
                    wrap
                  />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <BilingualText en="Successful Matches" el="Επιτυχείς αντιστοιχίσεις" compact wrap />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {stats.successfulMatches}/{stats.totalMatches}
                  </div>
                  <Target className="icon-sm text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <BilingualText
                    en={`Avg. score: ${stats.averageMatchScore}%`}
                    el={`Μέση βαθμολογία: ${stats.averageMatchScore}%`}
                    compact
                    wrap
                  />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <BilingualText en="Program Progress" el="Πρόοδος προγράμματος" compact wrap />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {programProgress == null ? '\u2014' : `${programProgress}%`}
                  </div>
                  <TrendingUp className="icon-sm text-status-success" />
                </div>
                <Progress value={programProgress ?? 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Cohort Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                <BilingualText en="About This Cohort" el="Σχετικά με τον κύκλο" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{cohort.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="icon-sm text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm">
                    {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                  </span>
                </div>
                {cohort.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="icon-sm text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">{cohort.location}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Award className="icon-sm text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm">{cohort.program}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <BilingualText en="Recent Matches" el="Πρόσφατες αντιστοιχίσεις" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.slice(0, 3).map((match) => (
                    <div key={match.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex -space-x-2">
                        <Avatar className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="bg-muted text-2xs font-semibold">
                            {initialsOf(match.participant1.name)}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="bg-primary/15 text-2xs font-semibold text-primary-accessible">
                            {initialsOf(match.participant2.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {match.participant1.name} ↔ {match.participant2.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Match score: {match.matchScore}%
                          {match.interactions > 0 && ` • ${match.interactions} interactions`}
                        </p>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <BilingualText en="Upcoming Sessions" el="Επερχόμενες συνεδρίες" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions
                    .filter((s) => s.status === 'scheduled')
                    .slice(0, 3)
                    .map((session) => (
                      <div key={session.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {initialsOf(session.mentor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.mentor.name} → {session.mentee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(session.scheduledDate)} • {session.duration} min
                          </p>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Participants</CardTitle>
              <Button size="sm" disabled title="Cohort membership is managed by platform administrators for now">
                <Users className="icon-sm mr-2" aria-hidden="true" />
                Add Participant
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {initialsOf(participant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(participant.role)}</TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="icon-sm" aria-hidden="true" />
                          {participant.location}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(participant.joinDate)}</TableCell>
                      <TableCell>
                        {participant.progress !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Progress value={participant.progress} className="w-20" />
                            <span className="text-xs">{participant.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label="More options" variant="ghost" size="icon">
                              <MoreVertical className="icon-sm" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* None had a handler. A participant's id is their
                                user id (toParticipant), so profile and thread
                                are addressable; progress is the row itself. */}
                            <DropdownMenuItem asChild>
                              <Link href={`/profiles/${participant.id}`}>View Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/messages?to=${participant.id}`}>Send Message</Link>
                            </DropdownMenuItem>
                            <UnavailableMenuItem
                              en="View Progress"
                              el="Πρόοδος"
                              reasonEn={participant.progress !== undefined ? `${participant.progress}% - no milestone breakdown yet.` : 'No progress is tracked for this participant yet.'}
                              reasonEl={participant.progress !== undefined ? `${participant.progress}% - δεν υπάρχει ακόμη ανάλυση ορόσημων.` : 'Δεν καταγράφεται ακόμη πρόοδος για αυτό το μέλος.'}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matches</CardTitle>
              <Button size="sm" asChild>
                <Link href="/matches">
                  <Target className="icon-sm mr-2" aria-hidden="true" />
                  Generate Matches
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex -space-x-3">
                      <Avatar className="h-12 w-12 border-2 border-card">
                        <AvatarFallback className="bg-muted text-sm font-semibold">
                          {initialsOf(match.participant1.name)}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-12 w-12 border-2 border-card">
                        <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary-accessible">
                          {initialsOf(match.participant2.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {match.participant1.name} ↔ {match.participant2.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.participant1.role} • {match.participant2.role}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Matched: {formatDate(match.matchedDate)}</span>
                        <span>•</span>
                        {match.interactions > 0 && <span>{match.interactions} interactions</span>}
                        {match.lastInteraction && (
                          <>
                            <span>•</span>
                            <span>Last: {formatDate(match.lastInteraction)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-accessible">{match.matchScore}%</div>
                        <div className="text-xs text-muted-foreground">Match Score</div>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentoring">
          <div className="space-y-6">
            {/* Mentoring Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Upcoming
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1">
                    <div className="text-2xl font-bold">4.8</div>
                    <Star className="icon-sm text-status-warning fill-status-warning" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sessions List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Sessions</CardTitle>
                <Button size="sm" asChild>
                  <Link href="/mentor/sessions?new=1">
                    <Calendar className="icon-sm mr-2" aria-hidden="true" />
                    Schedule Session
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Mentee</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {initialsOf(session.mentor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{session.mentor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {initialsOf(session.mentee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{session.mentee.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{session.topic}</TableCell>
                        <TableCell>{formatDate(session.scheduledDate)}</TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          {session.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="icon-sm text-status-warning fill-status-warning" />
                              <span>{session.rating}/5</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
