'use client';

import { useEffect, useState } from 'react';
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
  Eye,
  MessageCircle,
  Heart,
  UserPlus,
  Calendar,
  Award,
  Target,
  Activity,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Network,
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

function metricsToDisplay(m?: UserMetrics | null): AnalyticsMetric[] {
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const changeType = (v: number): 'increase' | 'decrease' | 'neutral' =>
    v > 0 ? 'increase' : v < 0 ? 'decrease' : 'neutral';
  const profileViewsChange = num(m?.profileViewsChange);
  const newConnectionsChange = num(m?.newConnectionsChange);
  const messagesSentChange = num(m?.messagesSentChange);
  const engagementRateChange = num(m?.engagementRateChange);
  const searchAppearancesChange = num(m?.searchAppearancesChange);
  const activityScoreChange = num(m?.activityScoreChange);
  return [
    { label: 'Profile Views', value: num(m?.profileViews), change: profileViewsChange, changeType: changeType(profileViewsChange), icon: Eye, color: 'text-blue-500' },
    { label: 'New Connections', value: num(m?.newConnections), change: newConnectionsChange, changeType: changeType(newConnectionsChange), icon: UserPlus, color: 'text-green-500' },
    { label: 'Messages Sent', value: num(m?.messagesSent), change: messagesSentChange, changeType: changeType(messagesSentChange), icon: MessageCircle, color: 'text-purple-500' },
    { label: 'Engagement Rate', value: num(m?.engagementRate), change: engagementRateChange, changeType: changeType(engagementRateChange), icon: Heart, color: 'text-red-500' },
    { label: 'Search Appearances', value: num(m?.searchAppearances), change: searchAppearancesChange, changeType: changeType(searchAppearancesChange), icon: Target, color: 'text-orange-500' },
    { label: 'Activity Score', value: num(m?.activityScore), change: activityScoreChange, changeType: changeType(activityScoreChange), icon: Activity, color: 'text-cyan-500' },
  ];
}

const VELOCITY_SHORT: Record<string, string> = {
  'Profile Views': 'Views',
  'New Connections': 'Connects',
  'Messages Sent': 'Messages',
};

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const Icon = metric.icon;
  const ChangeIcon =
    metric.changeType === 'increase'
      ? ArrowUp
      : metric.changeType === 'decrease'
      ? ArrowDown
      : Minus;

  return (
    <Card className="min-w-0 card-interactive hover-lift">
      <CardContent className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className={cn('rounded-lg bg-secondary/40 p-2', metric.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <Badge
            variant={
              metric.changeType === 'increase'
                ? 'default'
                : metric.changeType === 'decrease'
                ? 'destructive'
                : 'secondary'
            }
            className="gap-1 text-[10px]"
          >
            <ChangeIcon className="h-3 w-3" />
            {Math.abs(metric.change)}%
          </Badge>
        </div>
        <h3 className="mb-0.5 text-xl font-bold">
          {metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
            ? `${metric.value}%`
            : metric.value.toLocaleString()}
        </h3>
        <p className="text-xs leading-snug text-muted-foreground">{metric.label}</p>
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
  const requests = Math.round(views * 0.12);
  const max = Math.max(views, requests, connections, messages, 1);
  const stages = [
    { label: 'Profile Views', value: views, pct: (views / max) * 100, color: 'bg-violet-500' },
    { label: 'Connection Requests', value: requests, pct: (requests / max) * 100, color: 'bg-blue-500' },
    { label: 'Accepted Connections', value: connections, pct: (connections / max) * 100, color: 'bg-emerald-500' },
    { label: 'Conversations Started', value: messages, pct: (messages / max) * 100, color: 'bg-amber-500' },
  ];
  return (
    <Card className="min-w-0">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Network className="h-4 w-4 shrink-0" />Profile Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
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
    <Card className="min-w-0 border-primary/20 bg-primary/[0.02]">
      <CardContent className="p-3 sm:p-4">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <Zap className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 truncate text-sm font-semibold">Network Velocity</span>
          <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">vs prev</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="min-w-0 text-center">
                <div className={cn('mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60', item.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className={cn('text-xs font-bold',
                  item.changeType === 'increase' ? 'text-emerald-600 dark:text-emerald-400'
                  : item.changeType === 'decrease' ? 'text-red-500'
                  : 'text-muted-foreground'
                )}>
                  {item.changeType === 'increase' ? '+' : item.changeType === 'decrease' ? '-' : ''}{Math.abs(item.change)}%
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                  <span className="sm:hidden">{VELOCITY_SHORT[item.label] ?? item.label}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </p>
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
    <Card className="min-w-0">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 shrink-0" />
          Top Performing Content
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-3">
          {content.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-semibold text-sm shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 line-clamp-2 text-sm font-medium">{item.title}</h4>
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 shrink-0" />
                    {item.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 shrink-0" />
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
          <Award className="h-5 w-5" />
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="min-w-0">
            <CardContent className="p-3">
              <Skeleton className="mb-3 h-8 w-8" />
              <Skeleton className="mb-2 h-6 w-16" />
              <Skeleton className="h-3 w-24" />
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => getAnalyticsOverview(period, 5),
    staleTime: 60_000,
    retry: 1,
    enabled: mounted,
  });

  const waiting = !mounted || isLoading;
  const metrics = metricsToDisplay(overview?.metrics);
  const profileViews = overview?.profileViews;
  const engagement = overview?.engagement;
  const topContent = overview?.topContent;
  const weeklySummary = overview?.weeklySummary;

  const viewsMetric = metrics.find((m) => m.label === 'Profile Views');
  const connMetric = metrics.find((m) => m.label === 'New Connections');
  const msgMetric = metrics.find((m) => m.label === 'Messages Sent');
  const engMetric = metrics.find((m) => m.label === 'Engagement Rate');
  const periodLabel = period === '7d' ? '7 days' : period === '14d' ? '14 days' : period === '30d' ? '30 days' : '90 days';
  const askPrompt = waiting
    ? 'Summarize my profile analytics and tell me the next action on Discover, Messages, or my profile.'
    : `Analytics last ${periodLabel}: ${viewsMetric?.value ?? 0} profile views (${viewsMetric?.change ?? 0}%), ${connMetric?.value ?? 0} new connections, ${msgMetric?.value ?? 0} messages sent, ${engMetric?.value ?? 0}% engagement. What should I do next on Discover, Messages, or my profile to grow this?`;

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
      askAi={askPrompt}
      contentClassName="overflow-x-clip"
    >
      <div className="min-w-0 space-y-4 overflow-x-clip">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
          {([
            { id: '7d' as const, short: '7d', long: '7 days' },
            { id: '14d' as const, short: '14d', long: '14 days' },
            { id: '30d' as const, short: '30d', long: '30 days' },
            { id: '90d' as const, short: '90d', long: '90 days' },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'min-h-10 rounded-full px-3 text-xs font-medium border transition-colors',
                period === p.id
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              <span className="sm:hidden">{p.short}</span>
              <span className="hidden sm:inline">{p.long}</span>
            </button>
          ))}
        <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs" onClick={() => refetch()}>
          <Activity className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="overview" className="min-h-10 gap-1.5 px-2 text-xs sm:gap-2 sm:text-sm">
            <BarChart3 className="h-4 w-4 shrink-0" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="min-h-10 gap-1.5 px-2 text-xs sm:gap-2 sm:text-sm">
            <Activity className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">Engage</span>
            <span className="hidden sm:inline">Engagement</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="min-h-10 gap-1.5 px-2 text-xs sm:gap-2 sm:text-sm">
            <TrendingUp className="h-4 w-4 shrink-0" />
            Growth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">Failed to load analytics data.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </CardContent></Card>
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {/* Network velocity + funnel side-by-side */}
              {metrics.length > 0 && (
                <div className="grid min-w-0 gap-3 lg:grid-cols-3">
                  <div className="min-w-0 lg:col-span-1">
                    <NetworkVelocity metrics={metrics} />
                  </div>
                  <div className="min-w-0 lg:col-span-2">
                    <ProfileFunnel metrics={metrics} />
                  </div>
                </div>
              )}

              {/* Metric cards with sparklines */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {metrics.map((metric) => {
                  const sparkValues = demoSparklines[metric.label] ?? [];
                  return (
                    <Card key={metric.label} className="card-interactive hover-lift relative min-w-0 overflow-hidden">
                      <CardContent className="p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className={cn('rounded-lg bg-secondary/40 p-2', metric.color)}>
                            <metric.icon className="h-4 w-4" />
                          </div>
                          <Badge
                            variant={metric.changeType === 'increase' ? 'default' : metric.changeType === 'decrease' ? 'destructive' : 'secondary'}
                            className="gap-1 text-[10px]"
                          >
                            {metric.changeType === 'increase' ? <ArrowUp className="h-2.5 w-2.5" /> : metric.changeType === 'decrease' ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                            {Math.abs(metric.change)}%
                          </Badge>
                        </div>
                        <h3 className="mb-0.5 text-xl font-bold">
                          {metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
                            ? `${metric.value}%`
                            : metric.value.toLocaleString()}
                        </h3>
                        <p className="text-xs leading-snug text-muted-foreground">{metric.label}</p>
                        {sparkValues.length > 0 && (
                          <div className="mt-2 opacity-60">
                            <Sparkline values={sparkValues} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {weeklySummary && (
                <Card className="min-w-0">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 shrink-0" />
                      Weekly Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground">Most Active Day</p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.mostActiveDay || '—'}</p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground">Peak Hour</p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.peakHour || '—'}</p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground">Avg. Response Time</p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.avgResponseTime || '—'}</p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground">Total Interactions</p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.totalInteractions ?? 0}</p>
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
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <EngagementBreakdown engagement={engagement} />
                {topContent && topContent.length > 0 ? (
                  <TopContentList content={topContent} />
                ) : (
                  <Card className="min-w-0">
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
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
          ) : waiting ? (
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
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  );
}
