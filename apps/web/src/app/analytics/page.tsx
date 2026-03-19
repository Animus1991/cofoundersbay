'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
        <h3 className="text-2xl font-bold mb-1">
          {metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
            ? `${metric.value}%`
            : metric.value.toLocaleString()}
        </h3>
        <p className="text-sm text-muted-foreground">{metric.label}</p>
      </CardContent>
    </Card>
  );
}

function ProfileViewsChart({ data }: { data: ProfileView[] }) {
  const maxViews = Math.max(...data.map((d) => d.views));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Profile Views (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = (item.views / maxViews) * 100;
            const date = new Date(item.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {dayName}, {dayDate}
                  </span>
                  <span className="text-muted-foreground">
                    {item.views} views ({item.uniqueVisitors} unique)
                  </span>
                </div>
                <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
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
          <TrendingUp className="h-5 w-5" />
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
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-semibold text-sm shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
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

function EngagementBreakdown({ engagement }: { engagement?: AnalyticsEngagement }) {
  const engagementData = [
    { type: 'Connections', value: engagement?.connections ?? 0, color: 'bg-blue-500' },
    { type: 'Messages', value: engagement?.messages ?? 0, color: 'bg-green-500' },
    { type: 'Likes', value: engagement?.likes ?? 0, color: 'bg-red-500' },
    { type: 'Comments', value: engagement?.comments ?? 0, color: 'bg-purple-500' },
    { type: 'Shares', value: engagement?.shares ?? 0, color: 'bg-orange-500' },
  ];

  const total = engagementData.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Engagement Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {engagementData.map((item) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.type}</span>
                  <span className="text-muted-foreground">
                    {item.value} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', item.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
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

  return (
    <AppShell
      title="Analytics Dashboard"
      description="Track your profile performance and engagement"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['7d', '14d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                period === p
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {p === '7d' ? 'Last 7 days' : p === '14d' ? 'Last 14 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="growth" className="gap-2">
            <TrendingUp className="h-4 w-4" />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>

              {weeklySummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
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
