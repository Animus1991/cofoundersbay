'use client';

import { useState } from 'react';
import {
  BarChart3,
  Rocket,
  GraduationCap,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { STATUS, TREND, type StatusTone } from '@/lib/semantic-colors';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ChartFallback = () => <Skeleton className="h-[180px] w-full rounded-lg" />;
const PieFallback = () => <Skeleton className="h-[140px] w-[140px] rounded-full" />;
const ApplicationsTrendChart = dynamic(
  () => import('./OrgAnalyticsCharts').then((m) => ({ default: m.ApplicationsTrendChart })),
  { ssr: false, loading: ChartFallback },
);
const MentorSessionsChart = dynamic(
  () => import('./OrgAnalyticsCharts').then((m) => ({ default: m.MentorSessionsChart })),
  { ssr: false, loading: ChartFallback },
);
const IndustryPieChart = dynamic(
  () => import('./OrgAnalyticsCharts').then((m) => ({ default: m.IndustryPieChart })),
  { ssr: false, loading: PieFallback },
);

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {change && (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-1',
                changeType === 'positive' && TREND.up,
                changeType === 'negative' && TREND.down,
                changeType === 'neutral' && 'text-muted-foreground'
              )}>
                {changeType === 'positive' && <ArrowUpRight className="icon-sm" />}
                {changeType === 'negative' && <ArrowDownRight className="icon-sm" />}
                {change}
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="icon-md text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color?: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={percentage} className={cn('h-2', color)} />
    </div>
  );
}

const APPLICATIONS_TREND = [
  { month: 'Oct', applications: 18, accepted: 5 },
  { month: 'Nov', applications: 22, accepted: 7 },
  { month: 'Dec', applications: 15, accepted: 4 },
  { month: 'Jan', applications: 30, accepted: 9 },
  { month: 'Feb', applications: 28, accepted: 8 },
  { month: 'Mar', applications: 35, accepted: 12 },
];

const SESSIONS_BY_MONTH = [
  { month: 'Oct', sessions: 18 },
  { month: 'Nov', sessions: 24 },
  { month: 'Dec', sessions: 14 },
  { month: 'Jan', sessions: 32 },
  { month: 'Feb', sessions: 29 },
  { month: 'Mar', sessions: 38 },
];

const CHART_SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--status-info-fg))',
  'hsl(var(--status-success-fg))',
  'hsl(var(--status-warning-fg))',
  'hsl(var(--status-accent-fg))',
] as const;

const INDUSTRY_PIE = [
  { name: 'AI/ML',          value: 14, color: CHART_SERIES_COLORS[0] },
  { name: 'FinTech',        value: 10, color: CHART_SERIES_COLORS[1] },
  { name: 'HealthTech',     value: 8,  color: CHART_SERIES_COLORS[2] },
  { name: 'CleanTech',      value: 7,  color: CHART_SERIES_COLORS[3] },
  { name: 'SaaS',           value: 6,  color: CHART_SERIES_COLORS[4] },
];

const FUNNEL_STEPS = [
  { label: 'Applications', value: 120, bar: 'bg-status-neutral' },
  { label: 'Reviewed', value: 95, bar: 'bg-status-warning' },
  { label: 'Shortlisted', value: 45, bar: 'bg-status-info' },
  { label: 'Interviewed', value: 30, bar: 'bg-status-accent' },
  { label: 'Accepted', value: 15, bar: 'bg-status-success' },
] as const;

export default function OrgAnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  // Mock data
  const stats = {
    totalStartups: 45,
    activeStartups: 32,
    graduatedStartups: 10,
    totalMentors: 28,
    activeMentorships: 42,
    totalSessions: 156,
    avgReadinessScore: 68,
    applicationRate: 85,
  };

  const programMetrics = [
    { name: 'AI Accelerator 2025', startups: 12, progress: 75 },
    { name: 'Climate Innovation', startups: 8, progress: 60 },
    { name: 'FinTech Bootcamp', startups: 6, progress: 90 },
    { name: 'Fall 2024 Cohort', startups: 6, progress: 100 },
  ];

  const stageDistribution = [
    { stage: 'Idea', count: 8 },
    { stage: 'Pre-seed', count: 15 },
    { stage: 'Seed', count: 12 },
    { stage: 'Series A', count: 5 },
  ];

  const industryDistribution = [
    { industry: 'AI/ML', count: 14 },
    { industry: 'FinTech', count: 10 },
    { industry: 'HealthTech', count: 8 },
    { industry: 'CleanTech', count: 7 },
    { industry: 'Enterprise SaaS', count: 6 },
  ];

  const maxIndustry = Math.max(...industryDistribution.map((i) => i.count));

  return (
    <AppShell
      title="Org Analytics"
      description="Cohort health, program impact, application funnel, and member growth in one dashboard."
      actions={(
        <>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" title="Refresh">
            <RefreshCw className="icon-sm" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="icon-sm" /> Export
          </Button>
        </>
      )}
    >
      <div className="space-y-6">

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Startups"
            value={stats.totalStartups}
            change="+5 this month"
            changeType="positive"
            icon={Rocket}
          />
          <StatCard
            title="Active Mentorships"
            value={stats.activeMentorships}
            change="+8 this month"
            changeType="positive"
            icon={GraduationCap}
          />
          <StatCard
            title="Avg. Readiness Score"
            value={`${stats.avgReadinessScore}%`}
            change="+3% from last month"
            changeType="positive"
            icon={Target}
          />
          <StatCard
            title="Mentor Sessions"
            value={stats.totalSessions}
            change="+24 this month"
            changeType="positive"
            icon={Calendar}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Applications Trend */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Applications Trend</CardTitle>
                <Badge variant="secondary" size="sm">6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ApplicationsTrendChart data={APPLICATIONS_TREND} />
            </CardContent>
          </Card>

          {/* Mentor Sessions Bar */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Mentor Sessions / Month</CardTitle>
                <Badge variant="secondary" size="sm">6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <MentorSessionsChart data={SESSIONS_BY_MONTH} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Program Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Program Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {programMetrics.map((program) => (
                <div key={program.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{program.name}</span>
                    <span className="text-muted-foreground">{program.startups} startups · {program.progress}%</span>
                  </div>
                  <Progress value={program.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stageDistribution.map((item) => (
                  <MetricBar
                    key={item.stage}
                    label={item.stage}
                    value={item.count}
                    max={Math.max(...stageDistribution.map((s) => s.count))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Distribution — PieChart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Industry Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <IndustryPieChart data={INDUSTRY_PIE} />
                <div className="flex-1 space-y-2">
                  {INDUSTRY_PIE.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mentor Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mentor Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Active Mentors</p>
                  <p className="text-xl font-bold">{stats.totalMentors}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Sessions/Month</p>
                  <p className="text-xl font-bold">24</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-xl font-bold">4.8</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <p className="text-xl font-bold">78%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {FUNNEL_STEPS.map((step, index) => (
                <div key={step.label} className="flex-1 text-center">
                  <div className={cn('h-24 rounded-lg flex items-center justify-center', step.bar)}>
                    <span className="text-xl font-bold text-primary-foreground">{step.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{step.label}</p>
                  {index < FUNNEL_STEPS.length - 1 && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round((step.value / 120) * 100)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
