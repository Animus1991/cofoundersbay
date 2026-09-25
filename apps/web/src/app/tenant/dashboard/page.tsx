'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  Calendar,
  MoreVertical,
  ChevronRight,
  Rocket,
  GraduationCap,
  Target,
  Activity,
  Settings,
  UserPlus,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/components/providers/TenantContext';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { getTenantMembers, listEvents } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { qk } from '@/lib/query-keys';

const ChartFallback = () => <Skeleton className="h-[160px] w-full rounded-lg" />;
const MemberGrowthChart = dynamic(
  () => import('./TenantDashboardCharts').then((m) => ({ default: m.MemberGrowthChart })),
  { ssr: false, loading: ChartFallback },
);
const ProgramEngagementChart = dynamic(
  () => import('./TenantDashboardCharts').then((m) => ({ default: m.ProgramEngagementChart })),
  { ssr: false, loading: ChartFallback },
);

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', iconColor || 'bg-primary/10')}>
            <Icon className={cn('icon-md', iconColor ? 'text-white' : 'text-primary-accessible')} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {change && (
              <p className="text-xs text-muted-foreground">{change}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown to a workspace whose programme calendar is still empty. */
const SEED_PROGRAMS = [
  { id: 'seed-1', name: 'Spring Accelerator 2025', startups: 12, progress: 65, status: 'active' },
  { id: 'seed-2', name: 'AI Innovation Lab', startups: 8, progress: 30, status: 'active' },
  { id: 'seed-3', name: 'Pre-seed Bootcamp', startups: 8, progress: 90, status: 'ending_soon' },
];

export default function TenantDashboardPage() {
  /*
   * Four header figures, three recent members and three upcoming events, all
   * written into the source. Members and events are read now — both endpoints
   * and their clients have existed all along.
   *
   * Programme counts stay as the illustrative list: `Program` carries a
   * `tenantId` but nothing queries by it yet, so there is no honest way to
   * count a workspace's programmes from here. Startups and mentors read a
   * dash for the same reason — a tenant membership records a role, not
   * whether the person is a founder with a company or a mentor in a pool.
   */
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? null;

  const { data: membersData } = useQuery({
    queryKey: qk('tenant', 'members', tenantId),
    queryFn: () => getTenantMembers(tenantId!, { limit: 100 }),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    retry: 0,
  });
  const { data: eventsData } = useQuery({
    queryKey: qk('events', 'tenant'),
    queryFn: () => listEvents({ scope: 'upcoming', limit: 5 }),
    staleTime: 60_000,
    retry: 0,
  });

  const members = useMemo(() => (Array.isArray(membersData) ? membersData : []), [membersData]);

  const stats = {
    totalMembers: members.length,
    activePrograms: null as number | null,
    startups: null as number | null,
    mentors: members.filter((m) => m.role === 'mentor').length,
  };

  const recentMembers = members
    .slice()
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
    .slice(0, 3)
    .map((m) => ({
      id: m.id,
      name: m.user.profile?.displayName ?? m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
      avatarUrl: m.user.profile?.avatarUrl ?? '',
    }));

  const activePrograms = SEED_PROGRAMS;

  const upcomingEvents = (eventsData?.events ?? []).slice(0, 3).map((event) => ({
    id: event.id,
    name: event.title,
    // UTC on both sides of hydration, as every other date here is.
    date: new Date(event.startAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    type: event.eventType === 'workshop' ? 'Session' : 'Event',
  }));

  return (
    <AppShell
      title="Tenant Dashboard"
      description="Manage your organization on CoFounderBay"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tenant/branding"><Building2 className="mr-1.5 icon-sm" /> Branding</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/tenant/settings"><Settings className="mr-1.5 icon-sm" /> Settings</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={Users}
          />
          <StatCard
            title="Active Programs"
            value={stats.activePrograms ?? '—'}
            icon={Award}
            iconColor="bg-purple-500"
          />
          <StatCard
            title="Startups"
            value={stats.startups ?? '—'}
            icon={Rocket}
            iconColor="bg-blue-500"
          />
          <StatCard
            title="Mentors"
            value={stats.mentors}
            icon={GraduationCap}
            iconColor="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Active Programs */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Programs</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tenant/programs">
                  View All
                  <ChevronRight className="ml-1 icon-sm" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePrograms.map((program) => (
                <div key={program.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{program.name}</span>
                      <Badge variant={program.status === 'ending_soon' ? 'destructive' : 'secondary'} className="text-xs">
                        {program.status === 'ending_soon' ? 'Ending Soon' : 'Active'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{program.startups} startups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={program.progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-10">{program.progress}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <RelativeTime date={member.joinedAt} format={formatRelativeTime} />
                  </span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" size="sm" asChild>
                <Link href="/tenant/members">View All Members</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Member Growth</CardTitle>
                <Badge variant="secondary" className="text-2xs">6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <MemberGrowthChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Program Engagement</CardTitle>
                <Badge variant="secondary" className="text-2xs">Active programs</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ProgramEngagementChart />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <Link href="/events/create">
                <Calendar className="icon-sm" aria-hidden="true" /> Add Event
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="icon-sm text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                  </div>
                  <p className="font-medium text-sm">{event.name}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{event.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Invite Members', icon: UserPlus, href: '/tenant/members', color: 'text-status-info' },
            { label: 'Manage Programs', icon: Award, href: '/tenant/programs', color: 'text-status-accent' },
            { label: 'View Analytics', icon: Activity, href: '/tenant/analytics', color: 'text-status-success' },
            { label: 'Branding', icon: Building2, href: '/tenant/branding', color: 'text-status-warning' },
          ].map(({ label, icon: Icon, href, color }) => (
            <Button key={label} variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href={href}>
                <Icon className={cn('icon-md', color)} />
                <span className="text-xs">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
