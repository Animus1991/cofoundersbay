'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePublishPageSnapshot } from '@/contexts/PageSnapshotContext';
import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsAchievements,
  getAnalyticsOverview,
} from '@/lib/api';
import { ArrowUp, ArrowDown, ArrowRight, RefreshCw } from 'lucide-react';
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
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { analyticsEn, analyticsEl } from '@/lib/i18n/strings-analytics';
import { formatShortDate } from '@/lib/i18n/format';
import { metricsToDisplay, type AnalyticsMetric } from './metrics';
import { BadgesWidget } from '@/components/gamification/BadgesWidget';

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

/** "3h 20m" → "3ω 20λ": the API sends English duration units. */
function durationEl(value: string): string {
  return value.replace(/(\d+)\s*h\b/g, '$1ω').replace(/(\d+)\s*m(in)?\b/g, '$1λ');
}

function AskAiButton({
  labelEn,
  labelEl,
  prompt,
  variant = 'outline',
  className,
}: {
  labelEn?: string;
  labelEl?: string;
  prompt?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}) {
  const href = prompt ? `/ai?q=${encodeURIComponent(prompt)}` : '/ai';
  return (
    <Button asChild variant={variant} size="sm" className={cn('h-auto min-h-9 gap-1.5 py-1.5 leading-snug', className)}>
      <Link href={href}>
        <CfbGlyph name="spark" className="icon-sm shrink-0" aria-hidden="true" />
        <BilingualText en={labelEn ?? analyticsEn('ask_ai')} el={labelEl ?? analyticsEl('ask_ai')} compact wrap />
      </Link>
    </Button>
  );
}

type AnalyticsTab = 'overview' | 'engagement' | 'growth';

function metricHref(label: string): string | null {
  if (label === 'Profile Views') return '/profile';
  if (label === 'New Connections') return '/connections';
  if (label === 'Messages Sent') return '/messages';
  if (label === 'Search Appearances') return '/discover';
  return null;
}

function analyticsHref(period: Period, tab: AnalyticsTab): string {
  const params = new URLSearchParams();
  if (period !== '7d') params.set('period', period);
  if (tab !== 'overview') params.set('tab', tab);
  const query = params.toString();
  return query ? `/analytics?${query}` : '/analytics';
}

function isTab(value: string | null): value is AnalyticsTab {
  return value === 'overview' || value === 'engagement' || value === 'growth';
}

function metricValue(metric: AnalyticsMetric) {
  if (metric.value === null) return '—';
  return metric.label === 'Engagement Rate' || metric.label === 'Activity Score'
    ? `${metric.value}%` : metric.value.toLocaleString('en-GB');
}

function MetricCard({
  metric,
  sparkValues,
  onOpenTab,
}: {
  metric: AnalyticsMetric;
  sparkValues?: number[];
  onOpenTab?: (tab: AnalyticsTab) => void;
}) {
  const ChangeIcon =
    metric.changeType === 'increase'
      ? ArrowUp
      : metric.changeType === 'decrease'
      ? ArrowDown
      : ArrowRight;
  const href = metricHref(metric.label);
  const tab: AnalyticsTab | null =
    metric.label === 'Engagement Rate' ? 'engagement'
    : metric.label === 'Activity Score' || metric.label === 'Profile Views' ? 'growth'
    : null;

  const body = (
    <Card className="min-w-0 border-border/60 transition-colors hover:border-border">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <CfbGlyph name={metric.glyph} className="icon-sm text-muted-foreground/70" />
          <span
            className={cn(
              'flex items-center gap-1 text-2xs font-medium tabular-nums',
              metric.changeType === 'increase'
                ? TREND.up
                : metric.changeType === 'decrease'
                ? TREND.down
                : 'text-muted-foreground',
            )}
          >
            <ChangeIcon className="icon-sm" />
            {metric.change === null ? '—' : `${Math.abs(metric.change)}%`}
          </span>
        </div>
        <h3 className="mb-1 text-xl font-semibold tabular-nums tracking-tight">{metricValue(metric)}</h3>
        <p className="text-xs leading-snug text-muted-foreground">
          <BilingualText en={metric.label} el={metric.labelEl} compact wrap />
        </p>
        {sparkValues && sparkValues.length > 1 && (
          <div className="mt-3">
            <Sparkline values={sparkValues} />
            <p className="mt-1 text-2xs text-muted-foreground">
              <BilingualText en={analyticsEn('spark_caption')} el={analyticsEl('spark_caption')} wrap />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="min-w-0 rounded-2xl focus-ring">
        {body}
      </Link>
    );
  }
  if (tab && onOpenTab) {
    return (
      <button type="button" className="min-w-0 rounded-2xl text-left focus-ring" onClick={() => onOpenTab(tab)}>
        {body}
      </button>
    );
  }
  return body;
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
    { key: 'views', labelEn: analyticsEn('stage_views'), labelEl: analyticsEl('stage_views'), value: views, bar: 'bg-primary/70', href: '/profile' as const },
    { key: 'requests', labelEn: analyticsEn('stage_requests'), labelEl: analyticsEl('stage_requests'), value: null, bar: 'bg-status-info', href: '/discover' as const },
    { key: 'accepted', labelEn: analyticsEn('stage_accepted'), labelEl: analyticsEl('stage_accepted'), value: connections, bar: 'bg-status-success', href: '/connections' as const },
    { key: 'conversations', labelEn: analyticsEn('stage_conversations'), labelEl: analyticsEl('stage_conversations'), value: null, bar: 'bg-status-warning', href: '/messages' as const },
  ];
  const maximum = Math.max(1, ...stages.map((stage) => stage.value ?? 0));
  const conversion =
    typeof views === 'number' && views > 0 && typeof connections === 'number'
      ? Math.round((connections / views) * 1000) / 10
      : null;
  return (
    <Card className="min-w-0">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CfbGlyph name="people" className="icon-sm shrink-0 text-primary-accessible" />
          <BilingualText en={analyticsEn('profile_funnel')} el={analyticsEl('profile_funnel')} wrap />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5 p-3 pt-0 sm:p-6 sm:pt-0">
        <p className="text-xs text-muted-foreground">
          <BilingualText en={analyticsEn('funnel_note')} el={analyticsEl('funnel_note')} />
        </p>
        {stages.map((s) => (
          <Link key={s.key} href={s.href} className="block space-y-1.5 rounded-lg focus-ring">
            <div className="flex items-center justify-between text-xs">
              <span className="min-w-0 text-muted-foreground"><BilingualText en={s.labelEn} el={s.labelEl} wrap /></span>
              <span className="shrink-0 font-semibold text-foreground">{s.value === null ? '—' : s.value.toLocaleString('en-GB')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
              <div className={cn('h-full rounded-full transition-all duration-700', s.bar)} style={{ width: `${(s.value ?? 0) / maximum * 100}%` }} />
            </div>
          </Link>
        ))}
        {conversion !== null && (
          <p className="pt-1 text-xs font-medium tabular-nums text-foreground">
            {conversion}%{' '}
            <span className="font-normal text-muted-foreground">
              <BilingualText en={analyticsEn('view_to_connect')} el={analyticsEl('view_to_connect')} wrap />
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function WindowHighlights({ metrics }: { metrics: AnalyticsMetric[] }) {
  const views = metrics.find((m) => m.label === 'Profile Views')?.value ?? null;
  const connections = metrics.find((m) => m.label === 'New Connections')?.value ?? null;
  const conversion =
    typeof views === 'number' && views > 0 && typeof connections === 'number'
      ? Math.round((connections / views) * 1000) / 10
      : null;
  const movers = metrics.filter((m) => m.change !== null);
  if (movers.length === 0 && conversion === null) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2 rounded-2xl border border-border/60 px-4 py-3 text-xs">
      <span className="font-medium text-foreground">
        <BilingualText en={analyticsEn('window_highlights')} el={analyticsEl('window_highlights')} wrap />
      </span>
      {movers.map((m) => (
        <span
          key={m.label}
          className={cn(
            'tabular-nums',
            m.changeType === 'increase' ? TREND.up : m.changeType === 'decrease' ? TREND.down : 'text-muted-foreground',
          )}
        >
          <BilingualText
            en={`${m.changeType === 'increase' ? '+' : m.changeType === 'decrease' ? '−' : ''}${Math.abs(m.change ?? 0)}% ${m.label}`}
            el={`${m.changeType === 'increase' ? '+' : m.changeType === 'decrease' ? '−' : ''}${Math.abs(m.change ?? 0)}% ${m.labelEl}`}
            wrap
          />
        </span>
      ))}
      {conversion !== null && (
        <span className="text-muted-foreground">
          {conversion}% <BilingualText en={analyticsEn('view_to_connect')} el={analyticsEl('view_to_connect')} wrap />
        </span>
      )}
    </div>
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
    /* `h-full` + a flex column: this card shares a grid row with the funnel,
       which is the taller of the two. The row stretched the cell and the card
       kept its natural height, leaving 122px of empty page under it. */
    <Card className="flex h-full min-w-0 flex-col border-primary/20 bg-primary/[0.03]">
      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        {/* The period badge sits under the title, not beside it. Bilingual,
            "vs prev period · vs προηγ. περίοδο" is about 210px wide; in the
            340px this card gets at `lg` that left the title 100px and it
            truncated to "Netw… · Ταχύ…". It is metadata about the numbers
            below, not a peer of the heading, so it reads correctly on its own
            line and the title gets the full width. */}
        <div className="mb-4 min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <CfbGlyph name="spark" className="icon-sm shrink-0 text-primary-accessible" />
            <span className="min-w-0 text-sm font-semibold">
              <BilingualText en={analyticsEn('network_velocity')} el={analyticsEl('network_velocity')} compact wrap />
            </span>
          </div>
          <Badge variant="secondary" className="mt-1.5 max-w-full text-2xs">
            <span className="truncate">
              <BilingualText en={analyticsEn('vs_prev')} el={analyticsEl('vs_prev')} compact />
            </span>
          </Badge>
        </div>
        {/* Two layouts for two shapes of box. Full width on a phone, three
            across reads fine. In the third of a row this card occupies from
            `lg`, three columns are about 110px each — too narrow for
            "Μηνύματα που στάλθηκαν", which is why it needed `wrap` — and they
            filled a third of the height the row gives us. Stacked, each metric
            takes a full line, the label stops wrapping, and the three rows
            divide the height between them, so the card ends where the row
            ends. */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:flex lg:flex-1 lg:flex-col lg:gap-0 lg:divide-y lg:divide-primary/10">
          {items.map((item) => {
            const href = metricHref(item.label);
            const inner = (
              <>
              <div className="mx-auto mb-1.5 flex shrink-0 items-center justify-center text-muted-foreground lg:mx-0 lg:mb-0">
                <CfbGlyph name={item.glyph} className="icon-sm" />
              </div>
              <p className={cn('text-xs font-bold tabular-nums lg:order-3 lg:shrink-0',
                item.changeType === 'increase' ? TREND.up
                : item.changeType === 'decrease' ? TREND.down
                : TREND.flat
              )}>
                {item.change === null ? '—' : `${item.changeType === 'increase' ? '+' : item.changeType === 'decrease' ? '-' : ''}${Math.abs(item.change)}%`}
              </p>
              <p className="mt-0.5 text-2xs leading-tight text-muted-foreground lg:order-2 lg:mt-0 lg:min-w-0 lg:flex-1 lg:text-xs">
                <BilingualText en={item.label} el={item.labelEl} compact wrap />
              </p>
              </>
            );
            const rowClass = 'min-w-0 text-center lg:flex lg:flex-1 lg:items-center lg:gap-3 lg:text-left';
            return href ? (
              <Link key={item.label} href={href} className={cn(rowClass, 'rounded-lg focus-ring')}>
                {inner}
              </Link>
            ) : (
              <div key={item.label} className={rowClass}>
                {inner}
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
          <CfbGlyph name="chart" className="icon-md shrink-0 text-primary-accessible" />
          <BilingualText en={analyticsEn('top_content')} el={analyticsEl('top_content')} compact />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-3.5">
          {content.map((item, index) => (
            <Link
              key={item.id}
              href={item.type === 'profile' ? '/profile' : '/feed'}
              className="flex items-start gap-3 rounded-2xl p-3.5 transition-colors hover:bg-secondary/40"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center text-sm font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 line-clamp-2 text-sm font-medium">{item.title}</h4>
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
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
              <Badge variant="secondary" className="h-auto max-w-[7rem] whitespace-normal">
                <BilingualText
                  en={item.type}
                  el={item.type === 'post' ? 'ανάρτηση' : item.type === 'comment' ? 'σχόλιο' : 'προφίλ'}
                  wrap
                />
              </Badge>
            </Link>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CfbGlyph name="award" className="icon-md text-primary-accessible" />
          <BilingualText en={analyticsEn('achievements')} el={analyticsEl('achievements')} wrap />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {achievements.map((achievement) => (
            <Link
              key={achievement.id}
              href="/achievements"
              className={cn(
                'relative flex flex-col items-center rounded-2xl border p-4 text-center',
                achievement.unlocked
                  ? 'border-primary/25 bg-gradient-to-b from-primary/12 via-card to-card shadow-sm'
                  : 'border-border/40 opacity-60',
              )}
            >
              {achievement.unlocked && (
                <div className="pointer-events-none absolute inset-x-6 top-3 h-10 rounded-full bg-primary/20 blur-xl" aria-hidden="true" />
              )}
              <div className={cn(
                'relative mb-2.5 flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-background',
                achievement.unlocked ? cn(STATUS.warning.icon, 'bg-gradient-to-b from-primary/20 to-muted/40') : 'bg-muted/40 text-muted-foreground',
              )}>
                <CfbGlyph name="award" className="icon-md" />
              </div>
              {achievement.unlocked && (
                <Badge variant="default" className="mb-2 text-xs">
                  <BilingualText en={analyticsEn('unlocked')} el={analyticsEl('unlocked')} compact />
                </Badge>
              )}
              <h4 className="relative mb-1.5 text-sm font-semibold leading-snug">{achievement.title}</h4>
              <p className="relative text-xs text-muted-foreground">{achievement.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/achievements">
              <BilingualText en={analyticsEn('open_achievements')} el={analyticsEl('open_achievements')} wrap />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="min-w-0">
            <CardContent className="p-4">
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
    <Card>
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

/** The windows this page can show. `7d` is the one it opens on. */
const PERIODS = ['7d', '14d', '30d', '90d'] as const;
type Period = (typeof PERIODS)[number];

function isPeriod(value: string | null): value is Period {
  return value !== null && (PERIODS as readonly string[]).includes(value);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [period, setPeriodState] = useState<Period>('7d');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * The window is readable from the address, so it can be linked, shared and
   * set by something other than a click — which is what lets the assistant
   * change it without a second, hidden way of driving this page.
   *
   * It is read after mount rather than during render on purpose: the server
   * renders the default window, and reading the address during the first
   * render would leave the server's markup and the client's disagreeing about
   * which button is pressed.
   */
  useEffect(() => {
    const fromUrl = searchParams?.get('period') ?? null;
    const fromTab = searchParams?.get('tab') ?? null;
    if (isPeriod(fromUrl)) setPeriodState(fromUrl);
    if (isTab(fromTab)) setActiveTab(fromTab);
  }, [searchParams]);

  const setPeriod = useCallback(
    (next: Period) => {
      setPeriodState(next);
      // `replace`, not `push`: stepping through four windows should not leave
      // four entries for Back to walk out of. The default window drops the
      // parameter rather than spelling it, so `/analytics` stays the canonical
      // address for the page as it opens.
      router.replace(analyticsHref(next, activeTab), { scroll: false });
    },
    [router, activeTab],
  );

  const setTab = useCallback(
    (next: AnalyticsTab) => {
      setActiveTab(next);
      router.replace(analyticsHref(period, next), { scroll: false });
    },
    [router, period],
  );

  const { data: overview, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => getAnalyticsOverview(period, 5),
    staleTime: 60_000,
    retry: 1,
    enabled: mounted,
  });

  const { data: achievements } = useQuery({
    queryKey: ['analytics', 'achievements'],
    queryFn: getAnalyticsAchievements,
    staleTime: 60_000,
    retry: 0,
    enabled: mounted,
  });

  const waiting = !mounted || isLoading;
  const metrics = metricsToDisplay(overview?.metrics);

  /**
   * What this screen is showing, for the assistant.
   *
   * The window is part of it: "engagement is down" means nothing without
   * knowing whether the reader is looking at seven days or ninety.
   */
  usePublishPageSnapshot('/analytics', {
    title: 'Analytics',
    state: waiting ? 'loading' : isError ? 'error' : isPreviewDemo() ? 'demo' : 'ready',
    summary: `Account activity over the last ${period.replace('d', '')} days.`,
    figures: {
      Window: period,
      ...Object.fromEntries(
        metrics
          .filter((m) => m.value !== null && m.value !== undefined)
          .map((m) => [m.label, String(m.value)]),
      ),
    },
    actions: ['analytics_set_period', 'navigate'],
  });
  const profileViews = overview?.profileViews;
  const engagement = overview?.engagement;
  const topContent = overview?.topContent;
  const weeklySummary = overview?.weeklySummary;

  const viewsMetric = metrics.find((m) => m.label === 'Profile Views');
  const connMetric = metrics.find((m) => m.label === 'New Connections');
  const msgMetric = metrics.find((m) => m.label === 'Messages Sent');
  const engMetric = metrics.find((m) => m.label === 'Engagement Rate');
  const periodLabel = period === '7d' ? '7 days' : period === '14d' ? '14 days' : period === '30d' ? '30 days' : '90 days';
  const declining = metrics.filter((m) => m.changeType === 'decrease' && m.change !== null);
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
      askAi={askPrompt}
      contentClassName="overflow-x-clip"
    >
      <div className="min-w-0 space-y-5 overflow-x-clip">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                'min-h-10 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors focus-ring',
                period === p
                  ? 'border-primary bg-primary/20 text-primary-accessible'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {p === '7d' ? <BilingualText en="7 days" el="7 ημέρες" wrap /> : p === '14d' ? <BilingualText en="14 days" el="14 ημέρες" wrap /> : p === '30d' ? <BilingualText en="30 days" el="30 ημέρες" wrap /> : <BilingualText en="90 days" el="90 ημέρες" wrap />}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {/* AppShell's Ask AI carries this page's analytics prompt; this was a
              promptless duplicate beside it. `h-10` is gone too — it overrode
              the button ladder with a height that belongs to no step of it. */}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="icon-sm" /><BilingualText en="Refresh" el="Ανανέωση" compact />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { if (isTab(v)) setTab(v); }}>
        {/* Three equal columns capped at `max-w-md` is right on a phone, where
            the strip should span the screen. On desktop that cap is 367px once
            the 82% root is applied, which left ~76px per label and clipped
            "Επισκόπηση" while its two neighbours fit. From `lg` the strip is
            sized by its own labels instead. */}
        <TabsList className="grid h-auto w-full max-w-md grid-cols-3 lg:inline-grid lg:w-auto lg:max-w-none lg:grid-cols-[repeat(3,auto)]">
          <TabsTrigger value="overview" className="min-h-10 gap-1 px-2 text-xs leading-tight sm:gap-2 sm:px-3 sm:text-sm">
            <CfbGlyph name="chart" className="icon-sm shrink-0" />
            <BilingualText en={analyticsEn('tab_overview')} el={analyticsEl('tab_overview')} wrap />
          </TabsTrigger>
          <TabsTrigger value="engagement" className="min-h-10 gap-1 px-2 text-xs leading-tight sm:gap-2 sm:px-3 sm:text-sm">
            <CfbGlyph name="spark" className="icon-sm shrink-0" />
            <BilingualText en={analyticsEn('tab_engagement')} el={analyticsEl('tab_engagement')} wrap />
          </TabsTrigger>
          <TabsTrigger value="growth" className="min-h-10 gap-1 px-2 text-xs leading-tight sm:gap-2 sm:px-3 sm:text-sm">
            <CfbGlyph name="target" className="icon-sm shrink-0" />
            <BilingualText en={analyticsEn('tab_growth')} el={analyticsEl('tab_growth')} wrap />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              <p className="text-xs text-muted-foreground"><BilingualText en={isPreviewDemo() ? 'Demo showcase — sample metrics, not account activity.' : 'Recorded account activity. A dash means unavailable, not zero; trends require a comparable previous period.'} el={isPreviewDemo() ? 'Επίδειξη — ενδεικτικές μετρήσεις, όχι δραστηριότητα λογαριασμού.' : 'Καταγεγραμμένη δραστηριότητα λογαριασμού. Η παύλα σημαίνει μη διαθέσιμο, όχι μηδέν· οι τάσεις απαιτούν συγκρίσιμη προηγούμενη περίοδο.'} /></p>
              {declining.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-warning-border/50 bg-status-warning-bg/40 p-4">
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium">
                      <BilingualText en={analyticsEn('declining_prefix')} el={analyticsEl('declining_prefix')} wrap />
                    </p>
                    <p className="text-muted-foreground">
                      {declining.map((m, i) => (
                        <span key={m.label}>
                          {i > 0 ? ' · ' : ''}
                          <BilingualText
                            en={`${m.label} ${Math.abs(m.change ?? 0)}%`}
                            el={`${m.labelEl} ${Math.abs(m.change ?? 0)}%`}
                            wrap
                          />
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {metricHref(declining[0].label) && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={metricHref(declining[0].label)!}>
                          <BilingualText
                            en={declining[0].label === 'Messages Sent' ? analyticsEn('open_messages') : analyticsEn('open_profile')}
                            el={declining[0].label === 'Messages Sent' ? analyticsEl('open_messages') : analyticsEl('open_profile')}
                            compact wrap
                          />
                        </Link>
                      </Button>
                    )}
                    <AskAiButton variant="ghost" prompt={askPrompt} labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                  </div>
                </div>
              )}
              {metrics.length > 0 && (
                <>
                  <WindowHighlights metrics={metrics} />
                  <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                    <div className="min-w-0 lg:col-span-1">
                      <NetworkVelocity metrics={metrics} />
                    </div>
                    <div className="min-w-0 lg:col-span-2">
                      <ProfileFunnel metrics={metrics} />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {metrics.map((metric) => {
                  const sparkValues = isPreviewDemo() ? demoSparklines[metric.label] ?? []
                    : metric.label === 'Profile Views' ? (profileViews ?? []).map((point) => point.views) : [];
                  return (
                    <MetricCard
                      key={metric.label}
                      metric={metric}
                      sparkValues={sparkValues}
                      onOpenTab={setTab}
                    />
                  );
                })}
              </div>

              {weeklySummary && (
                <Card className="min-w-0">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CfbGlyph name="calendar" className="icon-md shrink-0 text-primary-accessible" />
                      <BilingualText en={analyticsEn('weekly_summary')} el={analyticsEl('weekly_summary')} compact />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={analyticsEn('most_active_day')} el={analyticsEl('most_active_day')} compact wrap /></p>
                        <p className="text-base font-semibold sm:text-lg">
                          {weeklySummary.mostActiveDay
                            ? <BilingualText en={weeklySummary.mostActiveDay} el={WEEKDAY_EL[weeklySummary.mostActiveDay] ?? weeklySummary.mostActiveDay} compact />
                            : '—'}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={analyticsEn('peak_hour')} el={analyticsEl('peak_hour')} compact wrap /></p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.peakHour || '—'}</p>
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={analyticsEn('avg_response')} el={analyticsEl('avg_response')} compact wrap /></p>
                        <p className="text-base font-semibold sm:text-lg">
                          {weeklySummary.avgResponseTime
                            ? (durationEl(weeklySummary.avgResponseTime) !== weeklySummary.avgResponseTime
                              ? <BilingualText en={weeklySummary.avgResponseTime} el={durationEl(weeklySummary.avgResponseTime)} compact />
                              : weeklySummary.avgResponseTime)
                            : '—'}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={analyticsEn('total_interactions')} el={analyticsEl('total_interactions')} compact wrap /></p>
                        <p className="text-base font-semibold sm:text-lg">{weeklySummary.totalInteractions ?? '—'}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/calendar"><BilingualText en={analyticsEn('peak_hour')} el={analyticsEl('peak_hour')} compact wrap /></Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/messages"><BilingualText en={analyticsEn('reply_faster')} el={analyticsEl('reply_faster')} compact wrap /></Link>
                      </Button>
                      <AskAiButton variant="ghost" prompt={askPrompt} labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                    </div>
                  </CardContent>
                </Card>
              )}
              <AchievementsCard
                achievements={Array.isArray(achievements)
                  ? achievements.map((item) => ({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      icon: item.icon,
                      unlocked: Boolean(item.unlocked),
                    }))
                  : undefined}
              />
              {(!Array.isArray(achievements) || achievements.length === 0) && <BadgesWidget />}
            </>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="mt-5 space-y-5">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <div className="grid min-w-0 gap-5 lg:grid-cols-2">
              <EngagementBreakdown engagement={engagement} />
              {topContent && topContent.length > 0 ? (
                <div className="space-y-3">
                  <TopContentList content={topContent} />
                  <AskAiButton variant="ghost" prompt={askPrompt} labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                </div>
              ) : (
                <Card className="min-w-0">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    <p><BilingualText en={analyticsEn('no_engagement')} el={analyticsEl('no_engagement')} /></p>
                    <div className="mt-3 flex justify-center">
                      <AskAiButton variant="ghost" prompt={askPrompt} labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="growth" className="mt-5 space-y-5">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : waiting ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              {profileViews && profileViews.length > 0 ? (
                <ProfileViewsChart data={profileViews} />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    <p><BilingualText en={analyticsEn('no_views')} el={analyticsEl('no_views')} /></p>
                    <div className="mt-3 flex justify-center">
                      <AskAiButton variant="ghost" prompt={askPrompt} labelEn={analyticsEn('ask_ai_insights')} labelEl={analyticsEl('ask_ai_insights')} />
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {metrics.map((metric) => {
                  const sparkValues = isPreviewDemo() ? demoSparklines[metric.label] ?? []
                    : metric.label === 'Profile Views' ? (profileViews ?? []).map((point) => point.views) : [];
                  return (
                    <MetricCard
                      key={metric.label}
                      metric={metric}
                      sparkValues={sparkValues}
                      onOpenTab={setTab}
                    />
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Button asChild className="h-auto min-h-16 flex-col gap-1.5 py-4">
            <Link href="/profile">
              <CfbGlyph name="profile" className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={analyticsEn('open_profile')} el={analyticsEl('open_profile')} wrap /></span>
              <span className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('build_profile')} el={analyticsEl('build_profile')} wrap /></span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-16 flex-col gap-1.5 py-4">
            <Link href="/discover">
              <CfbGlyph name="discover" className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={analyticsEn('open_discover')} el={analyticsEl('open_discover')} wrap /></span>
              <span className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('grow_network')} el={analyticsEl('grow_network')} wrap /></span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-16 flex-col gap-1.5 py-4">
            <Link href="/messages">
              <CfbGlyph name="messages" className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={analyticsEn('open_messages')} el={analyticsEl('open_messages')} wrap /></span>
              <span className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('reply_faster')} el={analyticsEl('reply_faster')} wrap /></span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-16 flex-col gap-1.5 py-4">
            <Link href="/connections">
              <CfbGlyph name="people" className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={analyticsEn('open_connections')} el={analyticsEl('open_connections')} wrap /></span>
              <span className="text-xs text-muted-foreground"><BilingualText en={analyticsEn('grow_network')} el={analyticsEl('grow_network')} wrap /></span>
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
