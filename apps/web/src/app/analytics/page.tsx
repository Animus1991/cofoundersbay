'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsOverview,
} from '@/lib/api';
import { ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { isPreviewDemo } from '@/lib/preview-demo';
import { STATUS, TREND } from '@/lib/semantic-colors';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { analyticsEn, analyticsEl } from '@/lib/i18n/strings-analytics';
import { formatShortDate } from '@/lib/i18n/format';
import { metricsToDisplay, type AnalyticsMetric } from './metrics';

const ProfileViewsChart = dynamic(
  () => import('./AnalyticsCharts').then((m) => ({ default: m.ProfileViewsChart })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> }
);
const EngagementBreakdown = dynamic(
  () => import('./AnalyticsCharts').then((m) => ({ default: m.EngagementBreakdown })),
  { ssr: false, loading: () => <Skeleton className="h-[440px] w-full rounded-xl" /> }
);

interface TopContent {
  id: string;
  type: 'post' | 'comment' | 'profile';
  title: string;
  views: number;
  engagement: number;
  date: string;
}

const WEEKDAY_EL: Record<string, string> = {
  Monday: 'Δευτέρα',
  Tuesday: 'Τρίτη',
  Wednesday: 'Τετάρτη',
  Thursday: 'Πέμπτη',
  Friday: 'Παρασκευή',
  Saturday: 'Σάββατο',
  Sunday: 'Κυριακή',
};

function AskAiButton({
  labelEn,
  labelEl,
  variant = 'outline',
  className,
}: {
  labelEn?: string;
  labelEl?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}) {
  const { open } = usePopupChat();
  return (
    <Button type="button" variant={variant} size="sm" className={cn('h-8 gap-1.5 text-xs', className)} onClick={() => open()}>
      <CfbGlyph name="spark" className="icon-sm" />
      <BilingualText en={labelEn ?? analyticsEn('ask_ai')} el={labelEl ?? analyticsEl('ask_ai')} compact />
    </Button>
  );
}

function metricValue(metric: AnalyticsMetric) {
  if (metric.value === null) return '—';
  return metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
    ? `${metric.value}%` : metric.value.toLocaleString('en-GB');
}

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const ChangeIcon =
    metric.changeType === 'increase'
      ? ArrowUp
      : metric.changeType === 'decrease'
      ? ArrowDown
      : Minus;

  return (
    <Card className="card-interactive min-w-0 rounded-xl border-border/60">
      <CardContent className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary-accessible">
            <CfbGlyph name={metric.glyph} className="icon-md" />
          </div>
          <Badge
            variant={
              metric.changeType === 'increase'
                ? 'default'
                : metric.changeType === 'decrease'
                ? 'destructive'
                : 'secondary'
            }
            className="gap-1 text-2xs"
          >
            <ChangeIcon className="icon-sm" />
            {metric.change === null ? '—' : `${Math.abs(metric.change)}%`}
          </Badge>
        </div>
        <h3 className="mb-0.5 text-xl font-bold">{metricValue(metric)}</h3>
        <p className="text-xs leading-snug text-muted-foreground">
          <BilingualText en={metric.label} el={metric.labelEl} />
        </p>
      </CardContent>
    </Card>
  );
}

function Sparkline({ values, color = 'hsl(var(--primary))' }: { values: number[]; color?: string }) {
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

function ProfileFunnel({ metrics }: { metrics: AnalyticsMetric[] }) {
  const views = metrics.find((m) => m.label === 'Profile Views')?.value ?? null;
  const connections = metrics.find((m) => m.label === 'New Connections')?.value ?? null;
  const stages = [
    { key: 'views', labelEn: analyticsEn('stage_views'), labelEl: analyticsEl('stage_views'), value: views, bar: 'bg-primary/70' },
    { key: 'requests', labelEn: analyticsEn('stage_requests'), labelEl: analyticsEl('stage_requests'), value: null, bar: 'bg-status-info' },
    { key: 'accepted', labelEn: analyticsEn('stage_accepted'), labelEl: analyticsEl('stage_accepted'), value: connections, bar: 'bg-status-success' },
    { key: 'conversations', labelEn: analyticsEn('stage_conversations'), labelEl: analyticsEl('stage_conversations'), value: null, bar: 'bg-status-warning' },
  ];
  const maximum = Math.max(1, ...stages.map((stage) => stage.value ?? 0));
  return (
    <Card className="min-w-0 rounded-xl">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CfbGlyph name="people" className="icon-sm shrink-0 text-primary-accessible" />
          <BilingualText en={analyticsEn('profile_funnel')} el={analyticsEl('profile_funnel')} compact />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
        <p className="text-xs text-muted-foreground">
          <BilingualText en={analyticsEn('funnel_note')} el={analyticsEl('funnel_note')} />
        </p>
        {stages.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground"><BilingualText en={s.labelEn} el={s.labelEl} compact /></span>
              <span className="font-semibold text-foreground">{s.value === null ? '—' : s.value.toLocaleString('en-GB')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
              <div className={cn('h-full rounded-full transition-all duration-700', s.bar)} style={{ width: `${(s.value ?? 0) / maximum * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NetworkVelocity({ metrics }: { metrics: AnalyticsMetric[] }) {
  const items = metrics.slice(0, 3).map((m) => ({
    label: m.label,
    labelEl: m.labelEl,
    change: m.change,
    changeType: m.changeType,
    glyph: m.glyph,
  }));
  return (
    <Card className="min-w-0 rounded-xl border-primary/20 bg-primary/[0.03]">
      <CardContent className="p-3 sm:p-4">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <CfbGlyph name="spark" className="icon-sm shrink-0 text-primary-accessible" />
          <span className="min-w-0 truncate text-sm font-semibold">
            <BilingualText en={analyticsEn('network_velocity')} el={analyticsEl('network_velocity')} compact />
          </span>
          <Badge variant="secondary" className="ml-auto shrink-0 text-2xs">
            <BilingualText en={analyticsEn('vs_prev')} el={analyticsEl('vs_prev')} compact />
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {items.map((item) => (
            <div key={item.label} className="min-w-0 text-center">
              <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary-accessible">
                <CfbGlyph name={item.glyph} className="icon-sm" />
              </div>
              <p className={cn('text-xs font-bold',
                item.changeType === 'increase' ? TREND.up
                : item.changeType === 'decrease' ? TREND.down
                : TREND.flat
              )}>
                {item.change === null ? '—' : `${item.changeType === 'increase' ? '+' : item.changeType === 'decrease' ? '-' : ''}${Math.abs(item.change)}%`}
              </p>
              <p className="mt-0.5 text-2xs leading-tight text-muted-foreground">
                <BilingualText en={item.label} el={item.labelEl} compact />
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopContentList({ content }: { content: TopContent[] }) {
  return (
    <Card className="min-w-0 rounded-xl">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <CfbGlyph name="chart" className="icon-md shrink-0 text-primary-accessible" />
          <BilingualText en={analyticsEn('top_content')} el={analyticsEl('top_content')} compact />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-3">
          {content.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/40"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary-accessible">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 line-clamp-2 text-sm font-medium">{item.title}</h4>
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CfbGlyph name="profile" className="icon-sm shrink-0" />
                    {item.views.toLocaleString('en-GB')} <BilingualText en={analyticsEn('views')} el={analyticsEl('views')} compact />
                  </span>
                  <span className="flex items-center gap-1">
                    <CfbGlyph name="spark" className="icon-sm shrink-0" />
                    {item.engagement} <BilingualText en={analyticsEn('engagements')} el={analyticsEl('engagements')} compact />
                  </span>
                  <span>
                    <BilingualText en={formatShortDate(item.date, 'en')} el={formatShortDate(item.date, 'el')} compact />
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">{item.type}</Badge>
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
    unlocked: a.unlocked,
  }));

  if (!achievements.length) return null;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CfbGlyph name="award" className="icon-md text-primary-accessible" />
          <BilingualText en={analyticsEn('achievements')} el={analyticsEl('achievements')} compact />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                'rounded-xl border p-3 transition-all',
                achievement.unlocked
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-border/40 bg-secondary/20 opacity-60'
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <CfbGlyph name="award" className={cn('icon-md', STATUS.warning.icon)} />
                {achievement.unlocked && (
                  <Badge variant="default" className="text-xs">
                    <BilingualText en={analyticsEn('unlocked')} el={analyticsEl('unlocked')} compact />
                  </Badge>
                )}
              </div>
              <h4 className="mb-1 text-sm font-semibold">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
          ))}
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
          <Card key={i} className="min-w-0 rounded-xl">
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          <BilingualText en={analyticsEn('load_failed')} el={analyticsEl('load_failed')} />
        </p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <BilingualText en={analyticsEn('try_again')} el={analyticsEl('try_again')} compact />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'growth'>('overview');
  const [period, setPeriod] = useState('7d');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: overview, isLoading, isError, isFetching, refetch } = useQuery({
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
      showHelp
      title="Analytics"
      description="Track your profile performance and network growth"
      askAi={askPrompt}
      contentClassName="overflow-x-clip"
    >
      <div className="min-w-0 space-y-4 overflow-x-clip">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-2">
          {(['7d', '14d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                'min-h-10 rounded-full px-3 py-1 text-xs font-medium border transition-colors focus-ring',
                period === p
                  ? 'border-primary bg-primary/20 text-primary-accessible'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {p === '7d' ? <BilingualText en="7 days" el="7 ημέρες" compact /> : p === '14d' ? <BilingualText en="14 days" el="14 ημέρες" compact /> : p === '30d' ? <BilingualText en="30 days" el="30 ημέρες" compact /> : <BilingualText en="90 days" el="90 ημέρες" compact />}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <AskAiButton />
          <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="icon-sm" /><BilingualText en="Refresh" el="Ανανέωση" compact />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid h-auto w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="min-h-10 gap-1.5 px-2 text-xs sm:gap-2 sm:text-sm">
            <CfbGlyph name="chart" className="icon-sm shrink-0" />
            <BilingualText en={analyticsEn('tab_overview')} el={analyticsEl('tab_overview')} compact />
          </TabsTrigger>
          <TabsTrigger value="engagement" className="min-h-10 gap-1.5 px-2 text-xs sm:gap-2 sm:text-sm">
            <CfbGlyph name="spark" className="icon-sm shrink-0" />
            <BilingualText en={analyticsEn('tab_engagement')} el={analyticsEl('tab_engagement')} compact />
          </TabsTrigger>
          <TabsTrigger value="growth" className="min-h-10 gap-1.5 px-2 text-xs sm:gap-2 sm:text-sm">
            <CfbGlyph name="target" className="icon-sm shrink-0" />
            <BilingualText en={analyticsEn('tab_growth')} el={analyticsEl('tab_growth')} compact />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              <p className="text-xs text-muted-foreground"><BilingualText en={isPreviewDemo() ? 'Demo showcase — sample metrics, not account activity.' : 'Recorded account activity. A dash means unavailable, not zero; trends require a comparable previous period.'} el={isPreviewDemo() ? 'Επίδειξη — ενδεικτικές μετρήσεις, όχι δραστηριότητα λογαριασμού.' : 'Καταγεγραμμένη δραστηριότητα λογαριασμού. Η παύλα σημαίνει μη διαθέσιμο, όχι μηδέν· οι τάσεις απαιτούν συγκρίσιμη προηγούμενη περίοδο.'} /></p>
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
                  const sparkValues = isPreviewDemo() ? demoSparklines[metric.label] ?? []
                    : metric.label === 'Profile Views' ? (profileViews ?? []).map((point) => point.views) : [];
                  return (
                    <Card key={metric.label} className="card-interactive relative min-w-0 overflow-hidden rounded-xl border-border/60">
                      <CardContent className="p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary-accessible">
                            <CfbGlyph name={metric.glyph} className="h-4 w-4" />
                          </div>
                          <Badge
                            variant={metric.changeType === 'increase' ? 'default' : metric.changeType === 'decrease' ? 'destructive' : 'secondary'}
                            className="gap-1 text-2xs"
                          >
                            {metric.changeType === 'increase' ? <ArrowUp className="h-2.5 w-2.5" /> : metric.changeType === 'decrease' ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                            {metric.change === null ? '—' : `${Math.abs(metric.change)}%`}
                          </Badge>
                        </div>
                        <h3 className="mb-0.5 text-xl font-bold">{metricValue(metric)}</h3>
                        <p className="text-xs leading-snug text-muted-foreground">
                          <BilingualText en={metric.label} el={metric.labelEl} compact />
                        </p>
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
                <Card className="min-w-0 rounded-xl">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CfbGlyph name="calendar" className="icon-md shrink-0 text-primary-accessible" />
                      <BilingualText en={analyticsEn('weekly_summary')} el={analyticsEl('weekly_summary')} compact />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('most_active_day')} el={analyticsEl('most_active_day')} compact /></p>
                        <p className="text-base font-semibold sm:text-lg">
                          {weeklySummary.mostActiveDay
                            ? <BilingualText en={weeklySummary.mostActiveDay} el={WEEKDAY_EL[weeklySummary.mostActiveDay] ?? weeklySummary.mostActiveDay} compact />
                            : '—'}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('peak_hour')} el={analyticsEl('peak_hour')} compact /></p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.peakHour || '—'}</p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('avg_response')} el={analyticsEl('avg_response')} compact /></p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.avgResponseTime || '—'}</p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('total_interactions')} el={analyticsEl('total_interactions')} compact /></p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.totalInteractions ?? '—'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <AskAiButton variant="ghost" labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="mt-4 space-y-4">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <EngagementBreakdown engagement={engagement} />
              {topContent && topContent.length > 0 ? (
                <TopContentList content={topContent} />
              ) : (
                <Card className="min-w-0 rounded-xl">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    <p><BilingualText en={analyticsEn('no_engagement')} el={analyticsEl('no_engagement')} /></p>
                    <div className="mt-3 flex justify-center">
                      <AskAiButton variant="ghost" labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="growth" className="mt-4 space-y-4">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {profileViews && profileViews.length > 0 ? (
                <ProfileViewsChart data={profileViews} />
              ) : (
                <Card className="rounded-xl">
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    <p><BilingualText en={analyticsEn('no_views')} el={analyticsEl('no_views')} /></p>
                    <div className="mt-3 flex justify-center">
                      <AskAiButton variant="ghost" labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                    </div>
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
