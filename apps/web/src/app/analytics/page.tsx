'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsOverview,
  type UserMetrics,
  type AnalyticsProfileView,
  type AnalyticsEngagement,
  type AnalyticsTopContent,
  type WeeklySummary,
} from '@/lib/api';
import {
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  Heart,
  UserPlus,
  Calendar,
  Award,
  Target,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Network,
  Download,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ProfileViewsChart = dynamic(
  () => import('./AnalyticsCharts').then((m) => ({ default: m.ProfileViewsChart })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> }
);
const EngagementBreakdown = dynamic(
  () => import('./AnalyticsCharts').then((m) => ({ default: m.EngagementBreakdown })),
  { ssr: false, loading: () => <Skeleton className="h-[440px] w-full rounded-xl" /> }
);

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: typeof TrendingUp;
  color: string;
}

interface ProfileView {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface EngagementData {
  type: 'connection' | 'message' | 'like' | 'comment' | 'share';
  count: number;
  date: string;
}

interface TopContent {
  id: string;
  type: 'post' | 'comment' | 'profile';
  title: string;
  views: number;
  engagement: number;
  date: string;
}

function metricsToDisplay(m: UserMetrics): AnalyticsMetric[] {
  const changeType = (v: number): 'increase' | 'decrease' | 'neutral' =>
    v > 0 ? 'increase' : v < 0 ? 'decrease' : 'neutral';
  return [
    { label: 'Profile Views', value: m.profileViews, change: m.profileViewsChange, changeType: changeType(m.profileViewsChange), icon: Eye, color: 'text-blue-500' },
    { label: 'New Connections', value: m.newConnections, change: m.newConnectionsChange, changeType: changeType(m.newConnectionsChange), icon: UserPlus, color: 'text-green-500' },
    { label: 'Messages Sent', value: m.messagesSent, change: m.messagesSentChange, changeType: changeType(m.messagesSentChange), icon: MessageCircle, color: 'text-purple-500' },
    { label: 'Engagement Rate', value: m.engagementRate, change: m.engagementRateChange, changeType: changeType(m.engagementRateChange), icon: Heart, color: 'text-red-500' },
    { label: 'Search Appearances', value: m.searchAppearances, change: m.searchAppearancesChange, changeType: changeType(m.searchAppearancesChange), icon: Target, color: 'text-orange-500' },
    { label: 'Activity Score', value: m.activityScore, change: m.activityScoreChange, changeType: changeType(m.activityScoreChange), icon: Activity, color: 'text-cyan-500' },
  ];
}

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const Icon = metric.icon;
  const ChangeIcon =
    metric.changeType === 'increase'
      ? ArrowUp
      : metric.changeType === 'decrease'
      ? ArrowDown
      : Minus;

  return (
    <Card className="card-interactive hover-lift">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-lg bg-secondary/40', metric.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge
            variant={
              metric.changeType === 'increase'
                ? 'default'
                : metric.changeType === 'decrease'
                ? 'destructive'
                : 'secondary'
            }
            className="gap-1"
          >
            <ChangeIcon className="h-3 w-3" />
            {Math.abs(metric.change)}%
          </Badge>
        </div>
        <h3 className="text-xl font-bold mb-1">
          {metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
            ? `${metric.value}%`
            : metric.value.toLocaleString()}
        </h3>
        <p className="text-sm text-muted-foreground">{metric.label}</p>
      </CardContent>
    </Card>
  );
}

// SVG sparkline helper
function Sparkline({ values, color = '#8b5cf6' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const w = 80; const h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// Profile Funnel
function ProfileFunnel({ metrics }: { metrics: AnalyticsMetric[] }) {
  const views = metrics.find((m) => m.label === 'Profile Views')?.value ?? 0;
  const connections = metrics.find((m) => m.label === 'New Connections')?.value ?? 0;
  const messages = metrics.find((m) => m.label === 'Messages Sent')?.value ?? 0;
  const stages = [
    { label: 'Profile Views', value: views, pct: 100, color: 'bg-violet-500' },
    { label: 'Connection Requests', value: Math.round(views * 0.12), pct: views ? Math.round((connections / views) * 100 * 12) : 0, color: 'bg-blue-500' },
    { label: 'Accepted Connections', value: connections, pct: views ? Math.round((connections / views) * 100) : 0, color: 'bg-emerald-500' },
    { label: 'Conversations Started', value: messages, pct: connections ? Math.round((messages / connections) * 100) : 0, color: 'bg-amber-500' },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Network className="icon-sm" aria-hidden="true" />Profile Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-semibold text-foreground">{s.value.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-700', s.color)} style={{ width: `${Math.min(s.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Network velocity widget
function NetworkVelocity({ metrics }: { metrics: AnalyticsMetric[] }) {
  const items = metrics.slice(0, 3).map((m) => ({
    label: m.label,
    change: m.change,
    changeType: m.changeType,
    icon: m.icon,
    color: m.color,
  }));
  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="icon-sm text-primary-emphasis" aria-hidden="true" />
          <span className="text-sm font-semibold">Network Velocity</span>
          <Badge variant="secondary" className="text-2xs ml-auto">vs prev period</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg mx-auto mb-1 bg-secondary/60', item.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className={cn('text-xs font-bold',
                  item.changeType === 'increase' ? 'text-emerald-600 dark:text-emerald-400'
                  : item.changeType === 'decrease' ? 'text-red-500'
                  : 'text-muted-foreground'
                )}>
                  {item.changeType === 'increase' ? '+' : item.changeType === 'decrease' ? '-' : ''}{Math.abs(item.change)}%
                </p>
                <p className="text-2xs text-muted-foreground leading-tight mt-0.5">{item.label.replace(' ', '\n')}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TopContentList({ content }: { content: TopContent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="icon-md" aria-hidden="true" />
          Top Performing Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {content.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary-emphasis font-semibold text-sm shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="icon-2xs" aria-hidden="true" />
                    {item.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="icon-2xs" aria-hidden="true" />
                    {item.engagement} engagements
                  </span>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {item.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementsCard({ achievements: rawAchievements }: { achievements?: { id: string; title: string; description: string; icon: string; unlocked: boolean }[] }) {
  const achievements = (rawAchievements ?? []).slice(0, 4).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: Award,
    color: 'text-yellow-500',
    unlocked: a.unlocked,
  }));

  if (!achievements.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="icon-md" aria-hidden="true" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={cn(
                  'p-3 rounded-lg border transition-all',
                  achievement.unlocked
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border/40 bg-secondary/20 opacity-60'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('h-5 w-5', achievement.color)} />
                  {achievement.unlocked && (
                    <Badge variant="default" className="text-xs">
                      Unlocked
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-10 w-10 mb-3" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'growth'>('overview');
  const [period, setPeriod] = useState('7d');

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => getAnalyticsOverview(period, 5),
    staleTime: 60_000,
    retry: 1,
  });

  const metrics = overview ? metricsToDisplay(overview.metrics) : [];
  const profileViews = overview?.profileViews;
  const engagement = overview?.engagement;
  const topContent = overview?.topContent;
  const weeklySummary = overview?.weeklySummary;

  // Demo sparkline seeds (replaced by real data when available)
  const demoSparklines: Record<string, number[]> = {
    'Profile Views': [12, 19, 8, 24, 18, 31, 27],
    'New Connections': [2, 5, 3, 7, 4, 9, 6],
    'Messages Sent': [5, 8, 12, 6, 14, 10, 18],
    'Engagement Rate': [42, 47, 44, 51, 49, 55, 58],
    'Search Appearances': [30, 25, 40, 35, 48, 42, 55],
    'Activity Score': [60, 65, 62, 70, 68, 74, 72],
  };

  return (
    <AppShell
      title="Analytics"
      description="Track your profile performance and network growth"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['7d', '14d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                period === p
                  ? 'border-primary bg-primary/20 text-primary-emphasis'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {p === '7d' ? '7 days' : p === '14d' ? '14 days' : p === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => refetch()}>
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="icon-sm" aria-hidden="true" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="growth" className="gap-2">
            <TrendingUp className="icon-sm" aria-hidden="true" />
            Growth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">Failed to load analytics data.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </CardContent></Card>
          ) : isLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {/* Network velocity + funnel side-by-side */}
              {metrics.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <NetworkVelocity metrics={metrics} />
                  </div>
                  <div className="lg:col-span-2">
                    <ProfileFunnel metrics={metrics} />
                  </div>
                </div>
              )}

              {/* Metric cards with sparklines */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => {
                  const sparkValues = demoSparklines[metric.label] ?? [];
                  return (
                    <Card key={metric.label} className="card-interactive hover-lift relative overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className={cn('p-2 rounded-lg bg-secondary/40', metric.color)}>
                            <metric.icon className="h-4 w-4" />
                          </div>
                          <Badge
                            variant={metric.changeType === 'increase' ? 'default' : metric.changeType === 'decrease' ? 'destructive' : 'secondary'}
                            className="gap-1 text-2xs"
                          >
                            {metric.changeType === 'increase' ? <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" /> : metric.changeType === 'decrease' ? <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" /> : <Minus className="h-2.5 w-2.5" aria-hidden="true" />}
                            {Math.abs(metric.change)}%
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold mb-0.5">
                          {metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
                            ? `${metric.value}%`
                            : metric.value.toLocaleString()}
                        </h3>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        {sparkValues.length > 0 && (
                          <div className="absolute bottom-3 right-3 opacity-50">
                            <Sparkline values={sparkValues} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {weeklySummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="icon-md" aria-hidden="true" />
                      Weekly Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Most Active Day</p>
                        <p className="text-lg font-semibold">{weeklySummary.mostActiveDay || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Peak Hour</p>
                        <p className="text-lg font-semibold">{weeklySummary.peakHour || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                        <p className="text-lg font-semibold">{weeklySummary.avgResponseTime || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Interactions</p>
                        <p className="text-lg font-semibold">{weeklySummary.totalInteractions ?? 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="mt-4 space-y-4">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">Failed to load analytics data.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </CardContent></Card>
          ) : isLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <EngagementBreakdown engagement={engagement} />
                {topContent && topContent.length > 0 ? (
                  <TopContentList content={topContent} />
                ) : (
                  <Card>
                    <CardContent className="py-16 text-center text-sm text-muted-foreground">
                      No engagement data available yet.
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="growth" className="mt-4 space-y-4">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">Failed to load analytics data.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </CardContent></Card>
          ) : isLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {profileViews && profileViews.length > 0 ? (
                <ProfileViewsChart data={profileViews} />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    Not enough profile-view data yet.
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
