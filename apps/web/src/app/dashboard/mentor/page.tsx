'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
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
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
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
        <AvatarFallback className="bg-primary/10 text-primary">
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MessageCircle className="h-4 w-4" />
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
        <Video className={cn('h-4 w-4', isUpcoming ? 'text-primary' : 'text-muted-foreground')} />
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

function RequestCard({ request }: { request: any }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={request.avatarUrl} />
        <AvatarFallback className="bg-amber-500/10 text-amber-600">
          {request.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{request.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{request.message}</p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="default" className="h-7 text-xs">
            Accept
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const { hasSession, mounted } = useSession();

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Mentor';

  // Mock data - replace with actual API calls
  const mentorStats = {
    activeMentees: 8,
    totalSessions: 47,
    avgRating: 4.8,
    pendingRequests: 3,
    upcomingSessions: 4,
    hoursThisMonth: 12,
  };

  const mentees = [
    { id: '1', name: 'Alex Chen', startup: 'TechFlow AI', sessionsCompleted: 6, avatarUrl: null },
    { id: '2', name: 'Sarah Johnson', startup: 'GreenCommute', sessionsCompleted: 4, avatarUrl: null },
    { id: '3', name: 'Mike Rodriguez', startup: 'HealthTrack', sessionsCompleted: 3, avatarUrl: null },
  ];

  const upcomingSessions = [
    { id: '1', menteeName: 'Alex Chen', scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), duration: 30 },
    { id: '2', menteeName: 'Sarah Johnson', scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), duration: 45 },
  ];

  const pendingRequests = [
    { id: '1', name: 'Jordan Lee', message: 'Hi! I\'m building a fintech startup and would love your guidance on product-market fit.', avatarUrl: null },
    { id: '2', name: 'Emma Wilson', message: 'Looking for mentorship on scaling my SaaS business. Your experience would be invaluable.', avatarUrl: null },
  ];

  if (!mounted) {
    return (
      <AppShell>
        <div className="container max-w-7xl py-6 space-y-6">
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
      <div className="container max-w-7xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getTimeBasedGreeting()}, {displayName}
            </h1>
            <p className="text-muted-foreground">
              Your mentoring impact at a glance
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Mentor
          </Badge>
        </div>

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
            subtext="Next in 2 hours"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Mentorship Requests ({pendingRequests.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/mentor/requests">
                        View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                    <Calendar className="h-4 w-4 text-primary" />
                    Upcoming Sessions
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/sessions">
                      View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                    <UserCheck className="h-4 w-4 text-primary" />
                    Your Mentees
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentor/mentees">
                      View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                    <Clock className="mr-2 h-4 w-4" />
                    Set Availability
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/learning">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Share Resources
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/profile/edit">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Update Profile
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
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
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
