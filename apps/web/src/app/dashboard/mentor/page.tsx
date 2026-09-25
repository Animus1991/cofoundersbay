'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  GraduationCap,
  MessageCircle,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';
import { ATTENTION_ROW } from '@/lib/semantic-colors';
import {
  getMeProfile,
  getMentorDashboardStats,
  getMyMentorships,
  getMyReceivedMentorRequests,
  getUpcomingMentorshipSessions,
} from '@/lib/api';
import { mentorDemoMonthEarnings, mentorDemoRating } from '@/lib/demo/mentor-world';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { qk, queryKeys } from '@/lib/query-keys';

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  href?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="icon-md text-primary-accessible" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function MenteeCard({ mentee }: { mentee: any }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50">
      <Avatar className="h-10 w-10">
        <AvatarImage src={mentee.avatarUrl} />
        <AvatarFallback className="bg-primary/10 text-primary-accessible">
          {mentee.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{mentee.name}</p>
        <p className="text-xs text-muted-foreground truncate">{mentee.startup || 'No startup yet'}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {mentee.sessionsCompleted} sessions
        </Badge>
        {/* Three of these rendered per dashboard with no name at all: axe
            reported `button-name (critical)`, and a screen reader announced
            "button" three times with nothing to tell them apart. Naming the
            mentee is what makes them distinguishable, not just present. */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Message ${mentee.name}`}
          asChild
        >
          <Link href={mentee.id ? `/messages?to=${mentee.id}` : '/messages'}>
            <MessageCircle className="icon-sm" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: any }) {
  const isUpcoming = new Date(session.scheduledAt) > new Date();
  
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border p-3',
      isUpcoming && 'border-primary/30 bg-primary/5'
    )}>
      <div className={cn(
        'rounded-full p-2',
        isUpcoming ? 'bg-primary/10' : 'bg-muted'
      )}>
        <Video className={cn('icon-sm', isUpcoming ? 'text-primary-accessible' : 'text-muted-foreground')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.menteeName}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(session.scheduledAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })} at{' '}
          {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isUpcoming ? 'default' : 'secondary'} className="text-xs">
          {session.duration} min
        </Badge>
        {isUpcoming && (
          <Button size="sm" variant="outline" asChild>
            {session.meetingUrl ? (
              <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">Join</a>
            ) : (
              <Link href="/mentor/sessions">Join</Link>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: any }) {
  return (
    <div className={cn('flex items-start gap-3', ATTENTION_ROW)}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={request.avatarUrl} />
        <AvatarFallback className="bg-muted text-foreground">
          {request.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{request.name}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{request.message}</p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/mentor/requests">Review Request</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Mentor';

  /*
   * Read from the mentorship endpoints the mentor pages use. The figures
   * were constants - 8 mentees, 47 sessions, a 4.8 "based on 32 reviews",
   * "2 new this month", "24 mentees helped", "Top 10% mentor" - with mentees
   * and requests nobody on /mentor/mentees or /mentor/requests had heard of.
   * Earnings and reviews have no endpoint yet; in the showcase they come from
   * the same rows /mentor/earnings and /mentor/reviews list, and outside it
   * the cards say there is nothing recorded rather than showing a number.
   */
  const enabled = hasSession && mounted;
  const { data: stats } = useQuery({
    queryKey: qk('mentorships', 'dashboard', 'mentor'),
    queryFn: getMentorDashboardStats,
    enabled,
    retry: 0,
  });
  const { data: relData } = useQuery({
    queryKey: qk('mentorships', 'mentor'),
    queryFn: () => getMyMentorships('mentor'),
    enabled,
    retry: 0,
  });
  const { data: sessionData } = useQuery({
    queryKey: qk('mentorships', 'sessions-upcoming'),
    queryFn: getUpcomingMentorshipSessions,
    enabled,
    retry: 0,
  });
  const { data: requestData } = useQuery({
    queryKey: qk('mentorships', 'requests-received'),
    queryFn: getMyReceivedMentorRequests,
    enabled,
    retry: 0,
  });

  const relationships = relData?.relationships ?? [];
  const activeRelationships = relationships.filter((r) => r.status === 'active');
  const relById = new Map(relationships.map((r) => [r.id, r]));
  // The endpoint returns both sides of the reader's calendar; this page is
  // the sessions they give.
  const upcomingSessions = (sessionData?.sessions ?? [])
    .filter((x) => relById.has(x.relationshipId))
    .map((x) => ({
      id: x.id,
      menteeName: relById.get(x.relationshipId)?.mentee?.displayName ?? 'Mentee',
      scheduledAt: x.scheduledAt,
      duration: x.duration,
      meetingUrl: x.meetingUrl,
    }));
  const mentees = activeRelationships.map((r) => ({
    id: r.menteeId,
    name: r.mentee?.displayName ?? 'Mentee',
    startup: r.mentee?.headline?.replace(/^Founder at /, '') ?? null,
    sessionsCompleted: r.totalSessions,
    avatarUrl: r.mentee?.avatarUrl ?? null,
  }));
  const pendingRequests = (requestData?.requests ?? [])
    .filter((r) => r.status === 'pending')
    .map((r) => ({ id: r.id, name: r.requester?.displayName ?? 'Founder', message: r.message, avatarUrl: r.requester?.avatarUrl ?? null }));

  const month = showDemoData ? mentorDemoMonthEarnings() : null;
  const rating = showDemoData ? mentorDemoRating() : null;
  const averageRating = stats?.averageRating ?? rating?.average ?? null;
  const mentorStats = {
    activeMentees: stats?.activeMentees ?? activeRelationships.length,
    totalSessions: stats?.totalSessions ?? relationships.reduce((sum, r) => sum + r.totalSessions, 0),
    completedMentorships: stats?.completedMentorships ?? relationships.filter((r) => r.status === 'completed').length,
    upcomingSessions: upcomingSessions.length,
    avgRating: averageRating == null ? '\u2014' : averageRating.toFixed(1),
    hoursThisMonth: month ? Math.round((month.minutes / 60) * 10) / 10 : null,
    earningsThisMonth: month ? `$${month.amount.toLocaleString('en-US')}` : null,
  };

  const nextSession = upcomingSessions[0];
  const nextSessionMinsAway = nextSession
    ? Math.round((new Date(nextSession.scheduledAt).getTime() - Date.now()) / 60000)
    : null;

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      description="Sessions, mentee requests, reviews, and earnings at a glance."
      actions={
        <Badge variant="outline" className="gap-1.5">
          <GraduationCap className="icon-sm" />
          Mentor
        </Badge>
      }
    >
      <div className="space-y-6">
        <DashboardGreeting name={displayName} lead={{ en: dashboardEn('mentor_lead'), el: dashboardEl('mentor_lead') }} />

        {/* Next Session Banner */}
        {nextSessionMinsAway !== null && nextSessionMinsAway <= 60 && nextSessionMinsAway > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-status-info-border bg-status-info-bg px-4 py-3">
            <div className="flex items-center gap-2">
              <Video className="icon-sm text-status-info" />
              <span className="text-sm font-medium">Session with {nextSession!.menteeName} in {nextSessionMinsAway} min</span>
            </div>
            <Link href="/mentor/sessions">
              <button className="rounded-xl border border-status-info-border px-3 py-1 text-xs font-medium text-status-info hover:bg-status-info-bg transition-colors">
                Join Now
              </button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
          <StatCard
            icon={Users}
            label="Active Mentees"
            value={mentorStats.activeMentees}
            subtext={mentorStats.completedMentorships ? `${mentorStats.completedMentorships} completed before` : 'In progress now'}
            href="/mentor/mentees"
          />
          <StatCard
            icon={Video}
            label="Total Sessions"
            value={mentorStats.totalSessions}
            subtext={mentorStats.hoursThisMonth != null ? `${mentorStats.hoursThisMonth}h this month` : 'Across your mentorships'}
            href="/mentor/sessions"
          />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={mentorStats.avgRating}
            subtext={rating ? `From ${rating.count} reviews` : 'No reviews recorded yet'}
            href="/mentor/reviews"
          />
          <StatCard
            icon={Clock}
            label="Upcoming"
            value={mentorStats.upcomingSessions}
            subtext="Sessions scheduled"
            href="/mentor/sessions"
          />
        </div>

        {/* Earnings Banner */}
        {showDemoData && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/mentor/earnings">
              <div className="flex items-center gap-3 rounded-xl border border-status-success-border bg-status-success-bg px-4 py-3 transition-all hover:border-status-success-border cursor-pointer">
                <DollarSign className="icon-md text-status-success shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Earnings this month</p>
                  <p className="text-lg font-bold text-status-success">{mentorStats.earningsThisMonth ?? '\u2014'}</p>
                </div>
              </div>
            </Link>
            <Link href="/mentor/reviews">
              <div className="flex items-center gap-3 rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-3 transition-all hover:border-status-warning-border cursor-pointer">
                <Star className="icon-md text-status-warning shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                  <p className="text-lg font-bold text-status-warning">{mentorStats.avgRating} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span></p>
                </div>
              </div>
            </Link>
            <Link href="/mentor/sessions">
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 transition-all hover:border-primary/40 cursor-pointer">
                <Video className="icon-md text-primary-accessible shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Hours this month</p>
                  <p className="text-lg font-bold text-primary-accessible">{mentorStats.hoursThisMonth ?? 0}h</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="icon-sm text-status-warning" />
                      Mentorship Requests ({pendingRequests.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/mentor/requests">
                        View all <ArrowRight className="ml-1 icon-sm" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="icon-sm text-primary-accessible" />
                    Upcoming Sessions
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/sessions">
                      View all <ArrowRight className="ml-1 icon-sm" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
                {upcomingSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming sessions scheduled
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Mentees */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="icon-sm text-primary-accessible" />
                    Your Mentees
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/mentees">
                      View all <ArrowRight className="ml-1 icon-sm" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {mentees.map((mentee) => (
                  <MenteeCard key={mentee.id} mentee={mentee} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/availability">
                    <Clock className="mr-2 icon-sm" />
                    Set Availability
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/requests">
                    <UserCheck className="mr-2 icon-sm" />
                    Mentorship Requests
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/reviews">
                    <Star className="mr-2 icon-sm" />
                    My Reviews
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/earnings">
                    <DollarSign className="mr-2 icon-sm" />
                    Earnings
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/profile">
                    <TrendingUp className="mr-2 icon-sm" />
                    Mentor Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Impact Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Founders mentored</span>
                    <span className="font-medium tabular-nums">{relationships.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessions given</span>
                    <span className="font-medium tabular-nums">{mentorStats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mentorships completed</span>
                    <span className="font-medium tabular-nums">{mentorStats.completedMentorships}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Accepting requests</span>
                  {/* `bg-green-500` with the default variant's white text measured 2.28:1 —
                      axe `color-contrast (serious)`. The `success` variant exists for
                      exactly this and is the pair the status scale guarantees; it is
                      also the last raw palette class on this page after the ~2,000-class
                      migration. */}
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Founders can request you while this is on. Set the hours you offer on the availability page.
                </div>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/mentor/availability">
                    Manage Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
