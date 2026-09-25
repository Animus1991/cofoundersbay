'use client';


import Link from 'next/link';
import {
  Building2,
  Users,
  Award,
  Calendar,
  Rocket,
  GraduationCap,
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
import { getTenantMembers, listEvents, listOrganizationPrograms } from '@/lib/api';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { MetricTile } from '@/components/dashboard/MetricTile';
import { EmptyLine, SectionCard } from '@/components/dashboard/SectionCard';
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

export default function TenantDashboardPage() {
  /*
   * The workspace's home, from its own reads.
   *
   * Members and events were read already; the programme list, both charts
   * and three of the four figures were constants ("Spring Accelerator 2025",
   * a workspace growing to 156 members). Programmes come from the
   * organisation that owns the workspace - the same list /tenant/programs and
   * /org/programs show - and a tenant membership's role says who is a founder
   * and who is a mentor, so all four figures are counted.
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
  const { membership } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;
  const { data: programData, isLoading: programsLoading } = useQuery({
    queryKey: qk('programs', 'organization', organizationId),
    queryFn: () => listOrganizationPrograms(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });
  const programs = useMemo(() => programData ?? [], [programData]);
  const runningOrNext = programs.filter((p) => p.status === 'active' || p.status === 'upcoming');

  const stats = {
    totalMembers: members.length,
    activePrograms: programData ? programs.filter((p) => p.status === 'active').length : null,
    startups: membersData ? members.filter((m) => m.role === 'founder').length : null,
    mentors: members.filter((m) => m.role === 'mentor').length,
  };

  // Members at the end of each of the last six months, from join dates.
  const now = Date.now();
  const memberGrowth = Array.from({ length: 6 }, (_, i) => {
    const end = new Date(now);
    end.setDate(1);
    end.setMonth(end.getMonth() - (5 - i) + 1);
    end.setHours(0, 0, 0, 0);
    const label = new Date(end.getTime() - 1).toLocaleDateString('en-GB', { month: 'short' });
    return { month: label, members: members.filter((m) => Date.parse(m.joinedAt) < Math.min(end.getTime(), now + 1)).length };
  });
  const engagement = runningOrNext.map((p) => ({
    name: p.title.split(' · ')[0].replace(/ (Accelerator|Bootcamp|Track)$/, '').slice(0, 14),
    applications: p.applicationCount,
    enrolled: p.participantCount,
  }));

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

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <MetricTile icon={Users} label="Members" labelEl="Μέλη" value={membersData ? stats.totalMembers : '\u2014'} caption="Everyone with a seat" captionEl="Όσοι έχουν θέση" href="/tenant/members" />
          <MetricTile icon={Award} label="Running programs" labelEl="Ενεργά προγράμματα" value={stats.activePrograms ?? '\u2014'} caption={`${programs.filter((p) => p.status === 'upcoming').length} upcoming`} captionEl={`${programs.filter((p) => p.status === 'upcoming').length} προσεχώς`} href="/tenant/programs" />
          <MetricTile icon={Rocket} label="Founders" labelEl="Ιδρυτές" value={stats.startups ?? '\u2014'} caption="Members with the founder role" captionEl="Μέλη με ρόλο ιδρυτή" href="/tenant/members" />
          <MetricTile icon={GraduationCap} label="Mentors" labelEl="Μέντορες" value={membersData ? stats.mentors : '\u2014'} caption="Members with the mentor role" captionEl="Μέλη με ρόλο μέντορα" href="/tenant/members" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Running and upcoming programs, with how full each is. */}
          <SectionCard className="lg:col-span-2" title="Programs" titleEl="Προγράμματα" action={{ href: '/tenant/programs', label: 'Manage', labelEl: 'Διαχείριση' }} contentClassName="space-y-3">
            {programsLoading && [0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
            {runningOrNext.map((program) => {
              const fill = program.capacity ? Math.min(100, Math.round((program.participantCount / program.capacity) * 100)) : 0;
              return (
                <Link key={program.id} href={`/programs/${program.id}`} className="block rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/30 hover:bg-muted/30 focus-ring">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{program.title}</span>
                      <Badge size="sm" variant={program.status === 'active' ? 'success' : 'info'}>{program.status === 'active' ? 'Running' : 'Upcoming'}</Badge>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {program.participantCount}/{program.capacity ?? '—'} places · {program.applicationCount} applications
                    </span>
                  </div>
                  <Progress value={fill} className="h-1.5" aria-label={`${program.title}: ${fill}% of places filled`} />
                </Link>
              );
            })}
            {!programsLoading && runningOrNext.length === 0 && (
              <EmptyLine en="No program is running or taking applications." el="Κανένα πρόγραμμα σε εξέλιξη ή με ανοιχτές αιτήσεις." />
            )}
          </SectionCard>

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
              <MemberGrowthChart data={memberGrowth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Applications and places</CardTitle>
                <Badge variant="secondary" className="text-2xs">Running and upcoming</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ProgramEngagementChart data={engagement} />
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
