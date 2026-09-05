import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { TrendingUp, Rocket, Users, DollarSign, Eye, Star, Calendar, ArrowUpRight, ArrowDownRight, Filter, MoreVertical, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function InvestorDashboardRedirect() {
  redirect('/dashboard/investor');
}


// Canonical investor dashboard is at /dashboard/investor — legacy code preserved below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StatCard(_props: { title: string; value: string | number; change?: string; changeType?: string; icon: React.ElementType }) { return null; }

type Startup = {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  stage: string;
  readinessScore: number;
  teamSize: number;
  lastActivity: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'passed';
};

function StartupCard({ startup }: { startup: Startup }) {
  const statusColors: Record<string, string> = {
    new: 'bg-status-info-bg text-status-info border-status-info-border',
    reviewing: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    shortlisted: 'bg-status-success-bg text-status-success border-status-success-border',
    passed: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={startup.logoUrl} />
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-semibold">
          {startup.name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/startups/${startup.id}`} className="font-medium hover:text-primary-accessible transition-colors">
            {startup.name}
          </Link>
          <Badge variant="outline" className={cn('text-xs', statusColors[startup.status])}>
            {startup.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {startup.industry} · {startup.stage} · {startup.teamSize} founders
        </p>
      </div>
      <div className="text-right hidden md:block">
        <p className="text-sm font-medium">{startup.readinessScore}%</p>
        <p className="text-xs text-muted-foreground">Readiness</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/startups/${startup.id}`}>View Details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Add to Shortlist</DropdownMenuItem>
          <DropdownMenuItem>Schedule Call</DropdownMenuItem>
          <DropdownMenuItem>Pass</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function _InvestorDashboardPage_legacy() {
  // Mock data
  const stats = {
    dealflow: 24,
    shortlisted: 8,
    meetings: 5,
    invested: 2,
  };

  const recentStartups: Startup[] = [
    {
      id: '1',
      name: 'NeuralFlow AI',
      industry: 'AI/ML',
      stage: 'Seed',
      readinessScore: 85,
      teamSize: 3,
      lastActivity: '2 hours ago',
      status: 'new',
    },
    {
      id: '2',
      name: 'GreenGrid Energy',
      industry: 'CleanTech',
      stage: 'Pre-seed',
      readinessScore: 72,
      teamSize: 2,
      lastActivity: '1 day ago',
      status: 'reviewing',
    },
    {
      id: '3',
      name: 'PayStream',
      industry: 'FinTech',
      stage: 'Seed',
      readinessScore: 91,
      teamSize: 4,
      lastActivity: '3 days ago',
      status: 'shortlisted',
    },
    {
      id: '4',
      name: 'HealthPulse',
      industry: 'HealthTech',
      stage: 'Pre-seed',
      readinessScore: 65,
      teamSize: 2,
      lastActivity: '1 week ago',
      status: 'reviewing',
    },
  ];

  const upcomingMeetings = [
    { id: '1', startup: 'NeuralFlow AI', time: 'Today, 3:00 PM', type: 'First Call' },
    { id: '2', startup: 'PayStream', time: 'Tomorrow, 10:00 AM', type: 'Follow-up' },
    { id: '3', startup: 'GreenGrid Energy', time: 'Mar 25, 2:00 PM', type: 'Due Diligence' },
  ];

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deal Flow</h1>
            <p className="text-muted-foreground">
              Track and manage your investment pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/investor/scouting">
                <Eye className="mr-2 h-4 w-4" />
                Scout Startups
              </Link>
            </Button>
            <Button asChild>
              <Link href="/investor/pipeline">
                View Pipeline
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Deal Flow"
            value={stats.dealflow}
            change="+5 this week"
            changeType="positive"
            icon={Rocket}
          />
          <StatCard
            title="Shortlisted"
            value={stats.shortlisted}
            change="+2 this week"
            changeType="positive"
            icon={Star}
          />
          <StatCard
            title="Meetings"
            value={stats.meetings}
            change="This week"
            changeType="neutral"
            icon={Calendar}
          />
          <StatCard
            title="Invested"
            value={stats.invested}
            change="This quarter"
            changeType="neutral"
            icon={DollarSign}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Startups */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Deal Flow</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/investor/pipeline">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Meetings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary-accessible" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{meeting.startup}</p>
                      <p className="text-xs text-muted-foreground">{meeting.time}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {meeting.type}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" size="sm">
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'AI/ML Startups', count: 8 },
                  { label: 'Seed Stage', count: 12 },
                  { label: 'High Readiness (80%+)', count: 5 },
                  { label: 'New This Week', count: 6 },
                ].map((filter) => (
                  <Button
                    key={filter.label}
                    variant="ghost"
                    className="w-full justify-between h-auto py-2"
                  >
                    <span className="text-sm">{filter.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Investment Focus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Focus Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['AI/ML', 'FinTech', 'SaaS', 'B2B', 'Seed', 'Pre-seed'].map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button variant="link" className="px-0 mt-2 text-xs" asChild>
                  <Link href="/settings/investor">Edit Preferences</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
