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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useChartTheme } from '@/lib/chart-theme';

const MEMBER_GROWTH = [
  { month: 'Oct', members: 98 },
  { month: 'Nov', members: 112 },
  { month: 'Dec', members: 125 },
  { month: 'Jan', members: 134 },
  { month: 'Feb', members: 145 },
  { month: 'Mar', members: 156 },
];

const PROGRAM_ENGAGEMENT = [
  { name: 'Spring Accel', sessions: 24, milestones: 18 },
  { name: 'AI Lab', sessions: 12, milestones: 8 },
  { name: 'Bootcamp', sessions: 32, milestones: 28 },
];

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
            <Icon className={cn('h-5 w-5', iconColor ? 'text-white' : 'text-primary-emphasis')} />
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

export default function TenantDashboardPage() {
  const theme = useChartTheme();
  // Mock data
  const stats = {
    totalMembers: 156,
    activePrograms: 4,
    startups: 28,
    mentors: 12,
  };

  const recentMembers = [
    { id: '1', name: 'John Doe', role: 'Founder', joinedAt: '2 days ago', avatarUrl: '' },
    { id: '2', name: 'Jane Smith', role: 'Mentor', joinedAt: '3 days ago', avatarUrl: '' },
    { id: '3', name: 'Mike Johnson', role: 'Founder', joinedAt: '1 week ago', avatarUrl: '' },
  ];

  const activePrograms = [
    { id: '1', name: 'Spring Accelerator 2025', startups: 12, progress: 65, status: 'active' },
    { id: '2', name: 'AI Innovation Lab', startups: 8, progress: 30, status: 'active' },
    { id: '3', name: 'Pre-seed Bootcamp', startups: 8, progress: 90, status: 'ending_soon' },
  ];

  const upcomingEvents = [
    { id: '1', name: 'Demo Day', date: 'Mar 28, 2025', type: 'Event' },
    { id: '2', name: 'Mentor Office Hours', date: 'Mar 25, 2025', type: 'Session' },
    { id: '3', name: 'Investor Pitch Night', date: 'Apr 5, 2025', type: 'Event' },
  ];

  return (
    <AppShell
      title="Tenant Dashboard"
      description="Manage your organization on CoFounderBay"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tenant/branding"><Building2 className="mr-1.5 icon-sm" aria-hidden="true" /> Branding</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/tenant/settings"><Settings className="mr-1.5 icon-sm" aria-hidden="true" /> Settings</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            change="+12 this month"
            icon={Users}
          />
          <StatCard
            title="Active Programs"
            value={stats.activePrograms}
            icon={Award}
            iconColor="bg-purple-500"
          />
          <StatCard
            title="Startups"
            value={stats.startups}
            change="+5 this month"
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Programs */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Active Programs</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tenant/programs">
                  View All
                  <ChevronRight className="ml-1 icon-sm" aria-hidden="true" />
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
                  <span className="text-xs text-muted-foreground">{member.joinedAt}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" size="sm" asChild>
                <Link href="/tenant/members">View All Members</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Member Growth</CardTitle>
                <Badge variant="secondary" className="text-2xs">6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={MEMBER_GROWTH} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="memberFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="members" stroke="hsl(var(--primary))" fill="url(#memberFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={PROGRAM_ENGAGEMENT} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessions" />
                  <Bar dataKey="milestones" fill={theme.series[2]} radius={[4, 4, 0, 0]} name="Milestones" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Add Event
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="icon-sm text-muted-foreground" aria-hidden="true" />
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
            { label: 'Invite Members', icon: UserPlus, href: '/tenant/members', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Manage Programs', icon: Award, href: '/tenant/programs', color: 'text-purple-600 dark:text-purple-400' },
            { label: 'View Analytics', icon: Activity, href: '/tenant/analytics', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Branding', icon: Building2, href: '/tenant/branding', color: 'text-amber-600 dark:text-amber-400' },
          ].map(({ label, icon: Icon, href, color }) => (
            <Button key={label} variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href={href}>
                <Icon className={cn('h-5 w-5', color)} />
                <span className="text-xs">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
