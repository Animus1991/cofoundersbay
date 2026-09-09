'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  Building,
  Calendar,
  ChevronRight,
  FileText,
  Flag,
  GraduationCap,
  LayoutGrid,
  MessageCircle,
  Plus,
  Rocket,
  Settings,
  Target,
  TrendingUp,
  UserPlus,
  Users,
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
  trend,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  trend?: { value: number; positive: boolean };
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
            {trend && (
              <p className={cn('text-xs', trend.positive ? 'text-green-500' : 'text-red-500')}>
                {trend.positive ? '+' : ''}{trend.value}% vs last cohort
              </p>
            )}
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

type Program = {
  id: string;
  name: string;
  cohort: string;
  status: string;
  startups: number;
  mentors: number;
};

type CohortStartup = {
  id: string;
  name: string;
  program: string;
  progress: number;
  logoUrl: string | null;
};

type Application = {
  id: string;
  name: string;
  industry: string;
  stage: string;
  program: string;
  logoUrl: string | null;
};

type UpcomingMilestone = {
  id: string;
  title: string;
  startup: string;
  date: string;
  completed: boolean;
};

function ProgramCard({ program }: { program: Program }) {
  const statusColors: Record<string, string> = {
    'active': 'bg-green-500/10 text-green-600 border-green-500/20',
    'upcoming': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'completed': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    'draft': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  return (
    <Link
      href={`/org/programs`}
      className="group flex items-start gap-3 rounded-lg border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="rounded-lg bg-primary/10 p-2">
        <Rocket className="icon-md text-primary-emphasis" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{program.name}</p>
          <Badge variant="outline" size="sm" className={cn(statusColors[program.status] || '')}>
            {program.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{program.cohort}</p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="icon-sm" aria-hidden="true" />
            {program.startups} startups
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <GraduationCap className="icon-sm" aria-hidden="true" />
            {program.mentors} mentors
          </div>
        </div>
      </div>
      <ChevronRight className="icon-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
    </Link>
  );
}

function StartupCard({ startup }: { startup: CohortStartup }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={startup.logoUrl ?? undefined} />
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary-emphasis">
          {startup.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{startup.name}</p>
        <p className="text-xs text-muted-foreground">{startup.program}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1">
          <Progress value={startup.progress} className="w-16 h-1.5" />
          <span className="text-xs text-muted-foreground">{startup.progress}%</span>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={application.logoUrl ?? undefined} />
        <AvatarFallback className="rounded-lg bg-amber-500/10 text-amber-600">
          {application.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{application.name}</p>
        <p className="text-xs text-muted-foreground">{application.industry} · {application.stage}</p>
        <p className="text-xs text-muted-foreground mt-1">Applied for: {application.program}</p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="default">
            Review
          </Button>
          <Button size="sm" variant="outline">
            Schedule Call
          </Button>
        </div>
      </div>
    </div>
  );
}

function MilestoneItem({ milestone }: { milestone: UpcomingMilestone }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn(
        'rounded-full p-1.5',
        milestone.completed ? 'bg-green-500/10' : 'bg-muted'
      )}>
        {milestone.completed ? (
          <Award className="icon-sm text-green-500" aria-hidden="true" />
        ) : (
          <Target className="icon-sm text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{milestone.title}</p>
        <p className="text-xs text-muted-foreground">{milestone.startup}</p>
      </div>
      <span className="text-xs text-muted-foreground">{milestone.date}</span>
    </div>
  );
}

export default function IncubatorDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Admin';

  const incubatorStats = showDemoData ? {
    activePrograms: 3,
    totalStartups: 42,
    activeMentors: 28,
    pendingApplications: 12,
    avgProgress: 67,
    graduationRate: 85,
  } : {
    activePrograms: 0,
    totalStartups: 0,
    activeMentors: 0,
    pendingApplications: 0,
    avgProgress: 0,
    graduationRate: 0,
  };

  const programs = showDemoData ? [
    { id: '1', name: 'AI Accelerator 2025', cohort: 'Cohort 3', status: 'active', startups: 12, mentors: 8 },
    { id: '2', name: 'FinTech Bootcamp', cohort: 'Spring 2025', status: 'upcoming', startups: 0, mentors: 6 },
    { id: '3', name: 'Climate Innovation', cohort: 'Cohort 2', status: 'active', startups: 8, mentors: 5 },
  ] : [];

  const topStartups = showDemoData ? [
    { id: '1', name: 'NeuralFlow', program: 'AI Accelerator', progress: 85, logoUrl: null },
    { id: '2', name: 'GreenGrid', program: 'Climate Innovation', progress: 72, logoUrl: null },
    { id: '3', name: 'PayFlow', program: 'FinTech Bootcamp', progress: 68, logoUrl: null },
  ] : [];

  const pendingApplications = showDemoData ? [
    { id: '1', name: 'DataVault', industry: 'Enterprise SaaS', stage: 'Seed', program: 'AI Accelerator', logoUrl: null },
    { id: '2', name: 'EcoTrack', industry: 'CleanTech', stage: 'Pre-seed', program: 'Climate Innovation', logoUrl: null },
  ] : [];

  const upcomingMilestones = showDemoData ? [
    { id: '1', title: 'Demo Day Presentation', startup: 'NeuralFlow', date: 'Feb 15', completed: false },
    { id: '2', title: 'MVP Launch', startup: 'GreenGrid', date: 'Feb 18', completed: false },
    { id: '3', title: 'Investor Pitch', startup: 'PayFlow', date: 'Feb 20', completed: false },
  ] : [];

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
              Manage your programs and portfolio companies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Building className="icon-sm" aria-hidden="true" />
              Incubator Admin
            </Badge>
            <Button size="sm" asChild>
              <Link href="/org/programs/new">
                <Plus className="mr-1.5 icon-sm" aria-hidden="true" />
                New Program
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={LayoutGrid}
            label="Active Programs"
            value={incubatorStats.activePrograms}
            href="/org/programs"
          />
          <StatCard
            icon={Rocket}
            label="Portfolio Startups"
            value={incubatorStats.totalStartups}
            trend={{ value: 15, positive: true }}
          />
          <StatCard
            icon={GraduationCap}
            label="Active Mentors"
            value={incubatorStats.activeMentors}
          />
          <StatCard
            icon={UserPlus}
            label="Applications"
            value={incubatorStats.pendingApplications}
            subtext="Pending review"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Applications */}
            {pendingApplications.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="icon-sm text-amber-500" aria-hidden="true" />
                      Pending Applications ({pendingApplications.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/org/applications">
                        View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Programs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LayoutGrid className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    Your Programs
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/org/programs">
                      Manage <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {programs.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </CardContent>
            </Card>

            {/* Top Performing Startups */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    Top Performing Startups
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/org/startups">
                      View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {topStartups.map((startup) => (
                  <StartupCard key={startup.id} startup={startup} />
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
                  <Link href="/org/programs/new">
                    <Plus className="mr-2 icon-sm" aria-hidden="true" />
                    Create Program
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/org/applications">
                    <UserPlus className="mr-2 icon-sm" aria-hidden="true" />
                    Review Applications
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/org/mentors">
                    <GraduationCap className="mr-2 icon-sm" aria-hidden="true" />
                    Manage Mentors
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/org/analytics">
                    <BarChart3 className="mr-2 icon-sm" aria-hidden="true" />
                    Cohort Reports
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/org/settings">
                    <Settings className="mr-2 icon-sm" aria-hidden="true" />
                    Organization Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="icon-sm" aria-hidden="true" />
                    Upcoming Milestones
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="divide-y">
                {upcomingMilestones.map((milestone) => (
                  <MilestoneItem key={milestone.id} milestone={milestone} />
                ))}
              </CardContent>
            </Card>

            {/* Program Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Program Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Progress</span>
                    <span className="font-medium">{incubatorStats.avgProgress}%</span>
                  </div>
                  <Progress value={incubatorStats.avgProgress} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Graduation Rate</span>
                    <span className="font-medium">{incubatorStats.graduationRate}%</span>
                  </div>
                  <Progress value={incubatorStats.graduationRate} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    <span>12 startups graduated this year</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
