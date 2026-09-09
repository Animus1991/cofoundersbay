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
import { getMeProfile } from '@/lib/api';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="icon-md text-primary-emphasis" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/**
 * Shapes for the role-dashboard cards. These mirror the demo fixtures below and
 * the API payloads they stand in for; the cards were previously typed `any`,
 * which hid every field rename behind a runtime undefined.
 */
type Mentee = {
  id: string;
  name: string;
  startup: string | null;
  sessionsCompleted: number;
  avatarUrl: string | null;
};

type MentorSession = {
  id: string;
  menteeName: string;
  /** ISO 8601 */
  scheduledAt: string;
  /** minutes */
  duration: number;
};

type MentorRequest = {
  id: string;
  name: string;
  message: string;
  avatarUrl: string | null;
};

function MenteeCard({ mentee }: { mentee: Mentee }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50">
      <Avatar className="h-10 w-10">
        <AvatarImage src={mentee.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary-emphasis">
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
        <Button aria-label="Message" variant="ghost" size="icon">
          <MessageCircle className="icon-sm" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: MentorSession }) {
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
        <Video className={cn('icon-sm', isUpcoming ? 'text-primary-emphasis' : 'text-muted-foreground')} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.menteeName}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(session.scheduledAt).toLocaleDateString()} at{' '}
          {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isUpcoming ? 'default' : 'secondary'} className="text-xs">
          {session.duration} min
        </Badge>
        {isUpcoming && (
          <Button size="sm" variant="outline">
            Join
          </Button>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: MentorRequest }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={request.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-amber-500/10 text-amber-600">
          {request.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{request.name}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{request.message}</p>
        <div className="flex gap-2 mt-2">
          <Link href="/mentor/requests">
            <Button size="sm" variant="outline">Review Request</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Mentor';

  const mentorStats = showDemoData ? {
    activeMentees: 8,
    totalSessions: 47,
    avgRating: 4.8,
    pendingRequests: 3,
    upcomingSessions: 4,
    hoursThisMonth: 12,
    earningsThisMonth: '$1,280',
  } : {
    activeMentees: 0,
    totalSessions: 0,
    avgRating: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
    hoursThisMonth: 0,
    earningsThisMonth: '$0',
  };

  const mentees = showDemoData ? [
    { id: '1', name: 'Alex Chen', startup: 'TechFlow AI', sessionsCompleted: 6, avatarUrl: null },
    { id: '2', name: 'Sarah Johnson', startup: 'GreenCommute', sessionsCompleted: 4, avatarUrl: null },
    { id: '3', name: 'Mike Rodriguez', startup: 'HealthTrack', sessionsCompleted: 3, avatarUrl: null },
  ] : [];

  const upcomingSessions = showDemoData ? [
    { id: '1', menteeName: 'Alex Chen', scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), duration: 30 },
    { id: '2', menteeName: 'Sarah Johnson', scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), duration: 45 },
  ] : [];

  const pendingRequests = showDemoData ? [
    { id: '1', name: 'Jordan Lee', message: 'Hi! I\'m building a fintech startup and would love your guidance on product-market fit.', avatarUrl: null },
    { id: '2', name: 'Emma Wilson', message: 'Looking for mentorship on scaling my SaaS business. Your experience would be invaluable.', avatarUrl: null },
  ] : [];

  const nextSession = upcomingSessions[0];
  const nextSessionMinsAway = nextSession
    ? Math.round((new Date(nextSession.scheduledAt).getTime() - Date.now()) / 60000)
    : null;

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {getTimeBasedGreeting()}, {displayName}
            </h1>
            <p className="text-muted-foreground">
              Your mentoring impact at a glance
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <GraduationCap className="icon-sm" aria-hidden="true" />
            Mentor
          </Badge>
        </div>

        {/* Next Session Banner */}
        {nextSessionMinsAway !== null && nextSessionMinsAway <= 60 && nextSessionMinsAway > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Video className="icon-sm text-blue-500" aria-hidden="true" />
              <span className="text-sm font-medium">Session with {nextSession!.menteeName} in {nextSessionMinsAway} min</span>
            </div>
            <Link href="/mentor/sessions">
              <button className="rounded-md border border-blue-500/30 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-500/10 transition-colors">
                Join Now
              </button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Users}
            label="Active Mentees"
            value={mentorStats.activeMentees}
            subtext="2 new this month"
          />
          <StatCard
            icon={Video}
            label="Total Sessions"
            value={mentorStats.totalSessions}
            subtext={`${mentorStats.hoursThisMonth}h this month`}
          />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={mentorStats.avgRating}
            subtext="Based on 32 reviews"
          />
          <StatCard
            icon={Clock}
            label="Upcoming"
            value={mentorStats.upcomingSessions}
            subtext="Sessions scheduled"
          />
        </div>

        {/* Earnings Banner */}
        {showDemoData && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/mentor/earnings">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 transition-all hover:border-emerald-500/40 cursor-pointer">
                <DollarSign className="icon-md text-emerald-500 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Earnings this month</p>
                  <p className="text-lg font-bold text-emerald-600">{mentorStats.earningsThisMonth}</p>
                </div>
              </div>
            </Link>
            <Link href="/mentor/reviews">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 transition-all hover:border-amber-500/40 cursor-pointer">
                <Star className="icon-md text-amber-500 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                  <p className="text-lg font-bold text-amber-600">{mentorStats.avgRating} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span></p>
                </div>
              </div>
            </Link>
            <Link href="/mentor/sessions">
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 transition-all hover:border-primary/40 cursor-pointer">
                <Video className="icon-md text-primary-emphasis shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Hours this month</p>
                  <p className="text-lg font-bold text-primary-emphasis">{mentorStats.hoursThisMonth}h</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="icon-sm text-amber-500" aria-hidden="true" />
                      Mentorship Requests ({pendingRequests.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/mentor/requests">
                        View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
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
                    <Calendar className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    Upcoming Sessions
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/sessions">
                      View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
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
                    <UserCheck className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    Your Mentees
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/mentees">
                      View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
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
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/availability">
                    <Clock className="mr-2 icon-sm" aria-hidden="true" />
                    Set Availability
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/requests">
                    <UserCheck className="mr-2 icon-sm" aria-hidden="true" />
                    Mentorship Requests
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/reviews">
                    <Star className="mr-2 icon-sm" aria-hidden="true" />
                    My Reviews
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/earnings">
                    <DollarSign className="mr-2 icon-sm" aria-hidden="true" />
                    Earnings
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/mentor/profile">
                    <TrendingUp className="mr-2 icon-sm" aria-hidden="true" />
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
                    <span className="text-muted-foreground">Mentees helped</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hours mentored</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success stories</span>
                    <span className="font-medium">8</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Star className="icon-sm text-yellow-500 fill-yellow-500" aria-hidden="true" />
                    <span className="text-sm font-medium">Top 10% Mentor</span>
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
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  You have 4 slots available this week
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
