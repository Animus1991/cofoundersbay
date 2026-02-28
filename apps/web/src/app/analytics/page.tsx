'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

const DEMO_METRICS: AnalyticsMetric[] = [
  {
    label: 'Profile Views',
    value: 1247,
    change: 12.5,
    changeType: 'increase',
    icon: Eye,
    color: 'text-blue-500',
  },
  {
    label: 'New Connections',
    value: 34,
    change: 8.3,
    changeType: 'increase',
    icon: UserPlus,
    color: 'text-green-500',
  },
  {
    label: 'Messages Sent',
    value: 156,
    change: -2.1,
    changeType: 'decrease',
    icon: MessageCircle,
    color: 'text-purple-500',
  },
  {
    label: 'Engagement Rate',
    value: 24.8,
    change: 0,
    changeType: 'neutral',
    icon: Heart,
    color: 'text-red-500',
  },
  {
    label: 'Search Appearances',
    value: 892,
    change: 15.7,
    changeType: 'increase',
    icon: Target,
    color: 'text-orange-500',
  },
  {
    label: 'Activity Score',
    value: 87,
    change: 5.2,
    changeType: 'increase',
    icon: Activity,
    color: 'text-cyan-500',
  },
];

const DEMO_PROFILE_VIEWS: ProfileView[] = [
  { date: '2024-02-21', views: 45, uniqueVisitors: 38 },
  { date: '2024-02-22', views: 52, uniqueVisitors: 44 },
  { date: '2024-02-23', views: 38, uniqueVisitors: 32 },
  { date: '2024-02-24', views: 61, uniqueVisitors: 53 },
  { date: '2024-02-25', views: 48, uniqueVisitors: 41 },
  { date: '2024-02-26', views: 73, uniqueVisitors: 62 },
  { date: '2024-02-27', views: 58, uniqueVisitors: 49 },
];

const DEMO_TOP_CONTENT: TopContent[] = [
  {
    id: '1',
    type: 'post',
    title: 'Excited to announce our seed round funding! 🎉',
    views: 1234,
    engagement: 156,
    date: '2024-02-25',
  },
  {
    id: '2',
    type: 'profile',
    title: 'Your Profile',
    views: 892,
    engagement: 89,
    date: '2024-02-27',
  },
  {
    id: '3',
    type: 'post',
    title: 'Looking for B2B SaaS co-founders in early stage',
    views: 678,
    engagement: 67,
    date: '2024-02-24',
  },
];

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

function EngagementBreakdown() {
  const engagementData = [
    { type: 'Connections', value: 34, color: 'bg-blue-500' },
    { type: 'Messages', value: 156, color: 'bg-green-500' },
    { type: 'Likes', value: 289, color: 'bg-red-500' },
    { type: 'Comments', value: 67, color: 'bg-purple-500' },
    { type: 'Shares', value: 45, color: 'bg-orange-500' },
  ];

  const total = engagementData.reduce((sum, item) => sum + item.value, 0);

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

function AchievementsCard() {
  const achievements = [
    {
      id: '1',
      title: 'Early Adopter',
      description: 'Joined in the first month',
      icon: Award,
      color: 'text-yellow-500',
      unlocked: true,
    },
    {
      id: '2',
      title: 'Networker',
      description: 'Connected with 50+ members',
      icon: Users,
      color: 'text-blue-500',
      unlocked: true,
    },
    {
      id: '3',
      title: 'Active Contributor',
      description: 'Posted 100+ times',
      icon: MessageCircle,
      color: 'text-green-500',
      unlocked: false,
    },
    {
      id: '4',
      title: 'Influencer',
      description: '1000+ profile views',
      icon: Eye,
      color: 'text-purple-500',
      unlocked: true,
    },
  ];

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

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['analytics', 'metrics'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return DEMO_METRICS;
    },
  });

  return (
    <AppShell
      title="Analytics Dashboard"
      description="Track your profile performance and engagement"
    >
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

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {isLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics?.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>

              {/* Charts and Lists */}
              <div className="grid gap-4 lg:grid-cols-2">
                <ProfileViewsChart data={DEMO_PROFILE_VIEWS} />
                <EngagementBreakdown />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <TopContentList content={DEMO_TOP_CONTENT} />
                <AchievementsCard />
              </div>

              {/* Additional Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Most Active Day</p>
                      <p className="text-lg font-semibold">Monday</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Peak Hour</p>
                      <p className="text-lg font-semibold">2:00 PM - 3:00 PM</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                      <p className="text-lg font-semibold">2.3 hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
