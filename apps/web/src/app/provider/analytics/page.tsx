'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  MessageCircle,
  Star,
  Users,
  DollarSign,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Download,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { downloadCsv } from '@/lib/csv';
import { choiceControl, usePageControls } from '@/lib/page-controls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RailStats } from '@/components/layout/RailParts';
import { RowHead } from '@/components/dashboard/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';
import { getAnalyticsOverview, listServiceInquiries } from '@/lib/api';
import { averageRating, bookFigures, changeVs, serviceRows } from '@/lib/provider-book';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { qk } from '@/lib/query-keys';
import { onRadioGroupKeyDown, radioTabIndex } from '@/lib/radio-keys';
import { ASK } from '@/lib/page-questions';
import { FailedLine } from '@/components/dashboard/SectionCard';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';

/** Metric names and funnel stages in Greek (the cards and stages were English only). */
const LABEL_EL: Record<string, string> = {
  'Profile Views': 'Προβολές προφίλ',
  Inquiries: 'Αιτήματα',
  'Active Projects': 'Ενεργά έργα',
  'Avg. Rating': 'Μέση βαθμολογία',
  'Agreed value': 'Συμφωνημένη αξία',
  'Response Rate': 'Ποσοστό απόκρισης',
  'Inquiries received': 'Αιτήματα που ελήφθησαν',
  Answered: 'Απαντήθηκαν',
  'Became projects': 'Έγιναν έργα',
  Completed: 'Ολοκληρώθηκαν',
  'New Connections': 'Νέες συνδέσεις',
  'Messages Sent': 'Μηνύματα που στάλθηκαν',
  'Search Appearances': 'Εμφανίσεις σε αναζητήσεις',
  'Engagement Rate': 'Ποσοστό αλληλεπίδρασης',
  'Avg Response': 'Μέσος χρόνος απόκρισης',
  'Inquiry Sent': 'Στάλθηκε ερώτημα',
  'Response Given': 'Δόθηκε απάντηση',
  'Project Started': 'Ξεκίνησε έργο',
  'Project Completed': 'Ολοκληρώθηκε έργο',
};
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_EL = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'];

// ── Mock analytics data ───────────────────────────────────────────────────────

/*
 * The showcase's profile views and week: there is no profile-view record in
 * the demo. Inquiries, projects, value, response, the funnel and the
 * services are counted from the inquiries in both modes (docs §97); they
 * were constants here (27 inquiries, $8,400, 94%, "Legal Consultation").
 */
const MOCK_PROFILE_VIEWS = { value: 342, change: 18, trend: 'up' as const };

const MOCK_WEEKLY_VIEWS = [
  { day: 'Mon', views: 42 },
  { day: 'Tue', views: 58 },
  { day: 'Wed', views: 35 },
  { day: 'Thu', views: 71 },
  { day: 'Fri', views: 63 },
  { day: 'Sat', views: 28 },
  { day: 'Sun', views: 19 },
];

/** Where visits came from, in Greek; a source the API adds later shows as sent. */
const SOURCE_EL: Record<string, string> = {
  'Direct Search': 'Άμεση αναζήτηση',
  Recommendations: 'Προτάσεις',
  'Community Posts': 'Αναρτήσεις κοινότητας',
  'Mentor Referrals': 'Παραπομπές από μέντορες',
};

const MOCK_TRAFFIC_SOURCES = [
  { source: 'Direct Search', visits: 148, pct: 43 },
  { source: 'Recommendations', visits: 89, pct: 26 },
  { source: 'Community Posts', visits: 62, pct: 18 },
  { source: 'Mentor Referrals', visits: 43, pct: 13 },
];

/* The same four windows GET /analytics/overview accepts. */
const PERIODS: { value: string; en: string; el: string }[] = [
  { value: '7d', en: 'Last 7 days', el: 'Τελευταίες 7 ημέρες' },
  { value: '30d', en: 'Last 30 days', el: 'Τελευταίες 30 ημέρες' },
  { value: '90d', en: 'Last 90 days', el: 'Τελευταίες 90 ημέρες' },
  { value: '1y', en: 'Last year', el: 'Τελευταίο έτος' },
];
const DEFAULT_PERIOD = '30d';
const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
const DAY_MS = 86_400_000;

function trendOf(change: number | null): 'up' | 'down' | 'neutral' {
  return change == null || change === 0 ? 'neutral' : change > 0 ? 'up' : 'down';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <ArrowUp className="icon-sm text-status-success" />;
  if (trend === 'down') return <ArrowDown className="icon-sm text-status-danger" />;
  return <Minus className="icon-sm text-muted-foreground" />;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit = '',
  change,
  trend,
  format = 'number',
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit?: string;
  change?: number | null;
  trend: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percent';
}) {
  const displayValue = typeof value === 'string'
    ? value
    : format === 'currency'
    ? `$${value.toLocaleString('en-GB')}`
    : format === 'percent'
    ? `${value}%`
    : value.toLocaleString('en-GB');

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-muted-foreground"><BilingualText en={label} el={LABEL_EL[label]} compact /></p>
          <div className="rounded-md bg-primary/10 p-1.5">
            <Icon className="icon-sm text-muted-foreground" />
          </div>
        </div>
        <p className="page-stat text-2xl font-bold tabular-nums">{displayValue}{unit}</p>
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          trend === 'up' ? 'text-status-success' : trend === 'down' ? 'text-status-danger' : 'text-muted-foreground'
        )}>
          {change == null ? null : <TrendIcon trend={trend} />}
          <span>
            {/* "vs last period" with no figure said nothing; with no change
                recorded the line is left out. */}
            {change == null
              ? null
              : trend !== 'neutral'
                ? <BilingualText en={`${Math.abs(change)}% vs last period`} el={`${Math.abs(change)}% έναντι προηγούμενης περιόδου`} compact />
                : <BilingualText en="No change vs last period" el="Καμία αλλαγή έναντι προηγούμενης περιόδου" compact />}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProviderAnalyticsPage() {
  const sayOne = useBilingualString();
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const activePeriod = PERIODS.find((p) => p.value === period) ?? PERIODS[1];

  /* The analytics API serves the signed-in user's own numbers - the mock
     grid only fills in when the demo toggle is on. */
  const overviewQuery = useQuery({
    queryKey: qk('analytics', 'overview', period),
    queryFn: () => getAnalyticsOverview(period),
    enabled: hasSession && mounted && !showDemoData,
    staleTime: 60_000,
    retry: 0,
  });
  const live = overviewQuery.data ?? null;

  /*
   * The provider's book: every inquiry, counted for the window and the one
   * before it (docs §97). Read in both modes - the showcase answers with its
   * own inquiries, so these cards agree with the provider home.
   */
  const inquiriesQuery = useQuery({
    queryKey: qk('provider', 'inquiries', 'analytics', period),
    queryFn: () => {
      const span = (PERIOD_DAYS[period] ?? 30) * 2;
      const since = new Date(Date.now() - span * DAY_MS).toISOString();
      return listServiceInquiries({ side: 'provider', limit: 100, since });
    },
    enabled: hasSession && mounted,
    staleTime: 60_000,
    retry: 0,
  });
  const bookRows = inquiriesQuery.data?.inquiries ?? [];
  const bookFailed = inquiriesQuery.isError && !inquiriesQuery.data;
  const bookRead = Boolean(inquiriesQuery.data);
  const windowMs = (PERIOD_DAYS[period] ?? 30) * DAY_MS;
  const nowMs = mounted ? Date.now() : 0;
  const from = nowMs - windowMs;
  const book = bookFigures(bookRows, from, nowMs + 1);
  const bookBefore = bookFigures(bookRows, nowMs - 2 * windowMs, from);
  const rating = averageRating(bookRows, from, nowMs + 1);
  const activeProjectCount = bookRows.filter((r) => {
    const t = Date.parse(r.createdAt);
    return r.status === 'accepted' && t >= from && t < nowMs + 1;
  }).length;
  const bookTruncated = (inquiriesQuery.data?.total ?? 0) > bookRows.length;
  const services = serviceRows(bookRows, nowMs - windowMs, nowMs + 1);
  const money = (amount: number | null, currency: string | null) => {
    if (amount == null) return '—';
    const fmt = (locale: string) => new Intl.NumberFormat(locale, { style: 'currency', currency: currency ?? 'EUR', maximumFractionDigits: 0 }).format(amount);
    return sayOne(fmt('en-GB'), fmt('el-GR'));
  };
  const inquiryChange = changeVs(book.inquiries, bookBefore.inquiries);
  const valueChange = changeVs(book.agreedValue, bookBefore.agreedValue);
  // Relative, like the other cards ("N% vs last period"), not points.
  const responseChange = changeVs(book.responseRate, bookBefore.responseRate);
  const bookMetrics = bookRead
    ? [
        { icon: MessageCircle, label: 'Inquiries', value: book.inquiries as number | string, change: inquiryChange },
        { icon: Users, label: 'Active Projects', value: activeProjectCount as number | string, change: null },
        { icon: DollarSign, label: 'Agreed value', value: money(book.agreedValue, book.currency) as number | string, change: valueChange },
        { icon: Clock, label: 'Response Rate', value: (book.responseRate == null ? '—' : `${book.responseRate}%`) as number | string, change: responseChange },
        { icon: Star, label: 'Avg. Rating', value: (rating.value == null ? '—' : rating.value.toFixed(1)) as number | string, change: null },
      ]
    : [];
  // Unread, the page said "0 profile views" and "No profile views recorded
  // in this period" (docs §95).
  const failed = !showDemoData && overviewQuery.isError && !overviewQuery.data;

  const trafficSources = showDemoData ? MOCK_TRAFFIC_SOURCES : [];
  // The funnel is the window's inquiries and what became of them; each bar
  // is its share of those received.
  const conversions = bookRead && book.inquiries > 0
    ? [
        { stage: 'Inquiries received', count: book.inquiries, color: 'bg-primary' },
        { stage: 'Answered', count: book.answered, color: 'bg-status-accent-mark' },
        { stage: 'Became projects', count: book.projects, color: 'bg-status-info-mark' },
        { stage: 'Completed', count: book.completed, color: 'bg-status-success-mark' },
      ].map((st) => ({ ...st, pct: Math.round((st.count / book.inquiries) * 100) }))
    : [];

  /* Daily profile views: the demo week or the API's per-day rows, labelled
     by weekday. Inquiries per day are counted from the book for those days
     (the last seven in the demo). */
  const inquiriesOn = (when: Date) =>
    bookRows.filter((r) => {
      const t = new Date(r.createdAt);
      return t.getUTCFullYear() === when.getUTCFullYear() && t.getUTCMonth() === when.getUTCMonth() && t.getUTCDate() === when.getUTCDate();
    }).length;
  const weeklyViews: { day: string; views: number; inquiries: number }[] = showDemoData
    ? MOCK_WEEKLY_VIEWS.map((d) => {
        // The sample day's most recent date (today counts as its own weekday).
        const back = (7 + new Date(nowMs).getUTCDay() - DAYS_EN.indexOf(d.day)) % 7;
        return { ...d, inquiries: mounted ? inquiriesOn(new Date(nowMs - back * DAY_MS)) : 0 };
      })
    : (live?.profileViews ?? []).map((d) => {
        const date = new Date(d.date);
        return { day: DAYS_EN[date.getUTCDay()], views: d.views, inquiries: inquiriesOn(date) };
      });
  const maxViews = Math.max(1, ...weeklyViews.map(d => d.views));
  const maxInquiries = Math.max(1, ...weeklyViews.map(d => d.inquiries));

  /* Live metric cards only claim what the overview actually measures; the
     demo grid keeps its six authored tiles under the sample-data notice. */
  const liveMetrics = live
    ? [
        { icon: Eye, label: 'Profile Views', value: live.metrics?.profileViews, change: live.metrics?.profileViewsChange },
        { icon: Users, label: 'New Connections', value: live.metrics?.newConnections, change: live.metrics?.newConnectionsChange },
        { icon: MessageCircle, label: 'Messages Sent', value: live.metrics?.messagesSent, change: live.metrics?.messagesSentChange },
        { icon: Eye, label: 'Search Appearances', value: live.metrics?.searchAppearances ?? '—', change: live.metrics?.searchAppearancesChange },
        { icon: Star, label: 'Engagement Rate', value: live.metrics?.engagementRate ?? '—', change: live.metrics?.engagementRateChange },
        { icon: Clock, label: 'Avg Response', value: live.weeklySummary?.avgResponseTime ?? '—', change: null },
      ]
    : [];

  /* One set of numbers for the export: the book's cards, then the profile
     figures (the sample week's views in the demo, the API's otherwise). */
  const metricRows: { label: string; value: string | number; change: number | null }[] = [
    ...bookMetrics.map((m) => ({ label: m.label, value: m.value, change: m.change })),
    ...(showDemoData
      ? [{ label: 'Profile Views', value: MOCK_PROFILE_VIEWS.value, change: MOCK_PROFILE_VIEWS.change }]
      : liveMetrics.map((m) => ({ label: m.label, value: m.value ?? '—', change: typeof m.change === 'number' ? m.change : null }))),
  ];

  /* The week's shape: what the API summarises when live, and the same three
     readings taken from the sample week in demo mode. */
  const busiest = weeklyViews.length ? weeklyViews.reduce((a, b) => (b.views > a.views ? b : a)) : null;
  const glance = showDemoData
    ? [
        { id: 'day', en: 'Most active day', el: 'Πιο ενεργή ημέρα', value: busiest?.day ?? '—' },
        { id: 'interactions', en: 'Interactions', el: 'Αλληλεπιδράσεις', value: String(weeklyViews.reduce((n, d) => n + d.views + d.inquiries, 0)) },
        { id: 'response', en: 'Response rate', el: 'Ποσοστό απόκρισης', value: book.responseRate == null ? '—' : `${book.responseRate}%` },
      ]
    : [
        { id: 'day', en: 'Most active day', el: 'Πιο ενεργή ημέρα', value: live?.weeklySummary?.mostActiveDay ?? '—' },
        { id: 'hour', en: 'Peak hour', el: 'Ώρα αιχμής', value: live?.weeklySummary?.peakHour ?? '—' },
        { id: 'interactions', en: 'Interactions', el: 'Αλληλεπιδράσεις', value: live?.weeklySummary?.totalInteractions?.toString() ?? '—' },
        { id: 'response', en: 'Avg. response', el: 'Μέσος χρόνος απόκρισης', value: live?.weeklySummary?.avgResponseTime ?? '—' },
      ];

  const exportDaily = () =>
    downloadCsv(
      `provider-analytics-daily-${period}`,
      ['Day', 'Profile views', 'Inquiries'],
      weeklyViews.map((d) => [d.day, d.views, d.inquiries]),
    );
  const exportMetrics = () =>
    downloadCsv(
      `provider-analytics-metrics-${period}`,
      ['Metric', 'Value', 'Change vs last period (%)'],
      metricRows.map((m) => [m.label, m.value, m.change]),
    );

  /*
   * The page rail. The column is the metric grid and the three charts - what
   * the page is for. The window that bounds them, the refresh, a reading of
   * the week's shape and the exports are about those numbers, so they sit one
   * gesture away; the period's badge shows only when it is not the default.
   */
  const rail: PageRailSection[] = [
    {
      id: 'period',
      glyph: 'calendar',
      labelEn: 'Period',
      labelEl: 'Περίοδος',
      badge: period !== DEFAULT_PERIOD ? 1 : null,
      content: (
        <div className="space-y-3">
          <div className="space-y-1" role="radiogroup" aria-label={bilingualAria('Period', 'Περίοδος')} onKeyDown={(e) => onRadioGroupKeyDown(e)}>
            {PERIODS.map((p, i) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={period === p.value}
                tabIndex={radioTabIndex(period === p.value, i, PERIODS.some((x) => x.value === period))}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'tap-target flex min-h-9 w-full items-center rounded-lg px-2.5 text-left text-sm transition-colors',
                  period === p.value ? 'bg-primary/10 font-medium text-primary-accessible' : 'hover:bg-muted/70',
                )}
              >
                <BilingualText en={p.en} el={p.el} compact wrap />
              </button>
            ))}
          </div>
          {/* Only the live numbers can be fetched again; the sample grid is fixed. */}
          <button
            type="button"
            onClick={() => void overviewQuery.refetch()}
            disabled={showDemoData || !hasSession || overviewQuery.isFetching}
            className="tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cn('icon-sm shrink-0', overviewQuery.isFetching && 'animate-spin')} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <BilingualText en="Refresh analytics" el="Ανανέωση στατιστικών" compact wrap />
            </span>
          </button>
        </div>
      ),
    },
    {
      id: 'glance',
      glyph: 'chart',
      labelEn: 'At a glance',
      labelEl: 'Με μια ματιά',
      content: (
        // The rail's own figures, not framed tiles: the rail is a flat
        // surface like the sidebar (RailParts).
        <RailStats items={glance.map((g) => ({ key: g.id, label: g.en, labelEl: g.el, value: g.value }))} />
      ),
    },
    {
      id: 'export',
      glyph: 'book',
      labelEn: 'Export',
      labelEl: 'Εξαγωγή',
      content: (
        <div className="space-y-1">
          <button
            type="button"
            onClick={exportMetrics}
            disabled={!metricRows.length}
            className="tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="icon-sm shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <BilingualText en={`Export ${metricRows.length} metrics as CSV`} el={`Εξαγωγή ${metricRows.length} δεικτών σε CSV`} compact wrap />
            </span>
          </button>
          <button
            type="button"
            onClick={exportDaily}
            disabled={!weeklyViews.length}
            className="tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="icon-sm shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <BilingualText en={`Export ${weeklyViews.length} daily rows as CSV`} el={`Εξαγωγή ${weeklyViews.length} ημερήσιων γραμμών σε CSV`} compact wrap />
            </span>
          </button>
        </div>
      ),
    },
  ];

  // Offered to the assistant: the rail's period, refresh and both exports.
  usePageControls([
    choiceControl('period', 'Analytics period', 'Περίοδος στατιστικών', PERIODS, period, setPeriod),
    {
      id: 'refresh',
      labelEn: 'Refresh analytics',
      labelEl: 'Ανανέωση στατιστικών',
      writes: false,
      unavailableEn: showDemoData ? 'Sample figures are fixed; turn off sample data to load your own.' : undefined,
      unavailableEl: showDemoData ? 'Τα δείγματα είναι σταθερά· απενεργοποιήστε τα δείγματα για να φορτώσετε τα δικά σας.' : undefined,
      run: () => void overviewQuery.refetch(),
    },
    { id: 'export_metrics', labelEn: 'Export metrics as CSV', labelEl: 'Εξαγωγή δεικτών σε CSV', writes: false, unavailableEn: metricRows.length ? undefined : 'There are no metrics to export yet.', run: exportMetrics },
    { id: 'export_daily', labelEn: 'Export daily views as CSV', labelEl: 'Εξαγωγή ημερήσιων προβολών σε CSV', writes: false, unavailableEn: weeklyViews.length ? undefined : 'There are no daily rows to export yet.', run: exportDaily },
  ]);

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-10 w-60" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell rail={rail}>
      <div className="space-y-6">
        {showDemoData && (
          <SampleDataNotice
            surface="Provider analytics"
            detail="Profile views and traffic sources are illustrative; inquiries, projects, agreed value, response, the funnel and the services are counted from the demo's inquiries, as the provider home counts them."
            askAiPrompt={ASK.providerAnalyticsSample}
          />
        )}

        {/* The period lives in the rail; the column still says which one is
            on, because numbers with no stated window read as all-time. */}
        {failed ? (
          <Card>
            <CardContent className="pt-6">
              <FailedLine en="Your analytics could not be read just now." el="Τα στατιστικά σας δεν διαβάστηκαν αυτή τη στιγμή." busy={overviewQuery.isFetching} onRetry={() => void overviewQuery.refetch()} />
            </CardContent>
          </Card>
        ) : (
        <p className="text-sm text-muted-foreground">
          {/* The window only: "· 316 profile views" repeated the Profile
              Views card beside it (docs §97). */}
          <BilingualText
            en={`Period: ${activePeriod.en}`}
            el={`Περίοδος: ${activePeriod.el}`}
            compact
            wrap
          />
        </p>
        )}

        {/* The book: counted from the inquiries in both modes (docs §97). */}
        {bookFailed ? (
          <Card>
            <CardContent className="pt-6">
              <FailedLine en="Your inquiries could not be read just now." el="Τα αιτήματά σας δεν διαβάστηκαν αυτή τη στιγμή." busy={inquiriesQuery.isFetching} onRetry={() => void inquiriesQuery.refetch()} />
            </CardContent>
          </Card>
        ) : bookRead ? (
          <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-3', showDemoData ? 'kpi-odd-span-md lg:grid-cols-6' : 'kpi-odd-span-md lg:grid-cols-5')}>
            {showDemoData && (
              <MetricCard icon={Eye} label="Profile Views" value={MOCK_PROFILE_VIEWS.value} change={MOCK_PROFILE_VIEWS.change} trend={MOCK_PROFILE_VIEWS.trend} />
            )}
            {bookMetrics.map((m) => (
              <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value} change={m.change} trend={trendOf(m.change)} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        )}
        {bookTruncated && (
          <p className="text-xs text-muted-foreground">
            <BilingualText
              en="This period has more than 100 inquiries, so these figures count the latest 100."
              el="Αυτή η περίοδος έχει πάνω από 100 αιτήματα, οπότε οι αριθμοί μετρούν τα 100 πιο πρόσφατα."
              wrap
            />
          </p>
        )}
        {!showDemoData && live && (
          <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-3 lg:grid-cols-6">
            {liveMetrics.map((m) => (
              <MetricCard
                key={m.label}
                icon={m.icon}
                label={m.label}
                value={m.value}
                change={m.change}
                trend={typeof m.change === 'number' ? (m.change > 0 ? 'up' : m.change < 0 ? 'down' : 'neutral') : 'neutral'}
              />
            ))}
          </div>
        )}

        {failed ? null : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview"><BilingualText en="Traffic" el="Κίνηση" compact /></TabsTrigger>
            <TabsTrigger value="funnel"><BilingualText en="Conversion Funnel" el="Χοάνη μετατροπής" compact /></TabsTrigger>
            <TabsTrigger value="services"><BilingualText en="Services" el="Υπηρεσίες" compact /></TabsTrigger>
          </TabsList>

          {/* Traffic */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  {/* Live rows carry views only: "& Inquiries" over a chart
                      with no inquiries in it. */}
                  <CardTitle><BilingualText en="Daily profile views & inquiries" el="Ημερήσιες προβολές προφίλ & αιτήματα" compact /></CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyViews.length === 0 && (
                    <p className="py-16 text-center text-sm text-muted-foreground"><BilingualText en="No profile views recorded in this period." el="Δεν καταγράφηκαν προβολές προφίλ σε αυτή την περίοδο." wrap /></p>
                  )}
                  {/* Bars are proportions of a fixed plot area. They were pixel
                      heights (views up to 140px plus inquiries) in a 176px box
                      that also held the day label, so the tallest day grew up
                      through the card title. */}
                  <div data-chart="" className="flex h-44 items-stretch gap-2">
                    {weeklyViews.map(d => (
                      <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex w-full flex-1 flex-col justify-end gap-0.5">
                          <div
                            className="w-full rounded-t bg-primary/80 min-h-[2px] transition-all"
                            style={{ height: `${(d.views / maxViews) * 78}%` }}
                          />
                          <div
                            className="w-full bg-status-accent-bg min-h-[2px]"
                            style={{ height: `${(d.inquiries / maxInquiries) * 18}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{sayOne(d.day, DAYS_EL[DAYS_EN.indexOf(d.day)] ?? d.day)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary/80 inline-block" /><BilingualText en="Profile Views" el="Προβολές προφίλ" compact /></span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-accent-bg inline-block" /><BilingualText en="Inquiries" el="Αιτήματα" compact /></span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle><BilingualText en="Traffic Sources" el="Πηγές κίνησης" compact /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trafficSources.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground"><BilingualText en="Traffic sources are not tracked yet." el="Οι πηγές κίνησης δεν καταγράφονται ακόμα." wrap /></p>
                  )}
                  {trafficSources.map(src => (
                    <div key={src.source}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground"><BilingualText en={src.source} el={SOURCE_EL[src.source]} compact /></span>
                        <span className="font-medium">{src.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${src.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funnel */}
          <TabsContent value="funnel">
            <Card>
              <CardHeader>
                <CardTitle><BilingualText en="Client Acquisition Funnel" el="Χοάνη απόκτησης πελατών" compact /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookFailed && (
                  <FailedLine en="Your inquiries could not be read just now." el="Τα αιτήματά σας δεν διαβάστηκαν αυτή τη στιγμή." busy={inquiriesQuery.isFetching} onRetry={() => void inquiriesQuery.refetch()} />
                )}
                {bookRead && conversions.length === 0 && (
                  <p className="text-sm text-muted-foreground"><BilingualText en={`No inquiry arrived in this period (${activePeriod.en.toLowerCase()}).`} el={`Κανένα αίτημα δεν ήρθε σε αυτή την περίοδο (${activePeriod.el.toLowerCase()}).`} wrap /></p>
                )}
                {conversions.map((stage, i) => (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="font-medium"><BilingualText en={stage.stage} el={LABEL_EL[stage.stage]} compact /></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">{stage.count.toLocaleString('en-GB')}</span>
                        <Badge variant="outline" className="text-xs tabular-nums">{stage.pct}%</Badge>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={cn('h-2 rounded-full transition-all', stage.color)}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                {conversions.length > 0 && (
                  // Was "4.1%, above the platform average of 2.8%" - two
                  // constants. Counted now, with no average nobody measured.
                  <p className="text-xs text-muted-foreground pt-2">
                    <BilingualText
                      en={`${book.projects} of ${book.inquiries} ${book.inquiries === 1 ? 'inquiry' : 'inquiries'} in this period became projects (${book.conversionRate}%).`}
                      el={`${book.projects} από ${book.inquiries} ${book.inquiries === 1 ? 'αίτημα' : 'αιτήματα'} αυτής της περιόδου έγιναν έργα (${book.conversionRate}%).`}
                      wrap
                    />
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle><BilingualText en="Service Performance" el="Απόδοση υπηρεσιών" compact /></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {bookFailed && (
                    <div className="px-4 py-4 sm:px-6">
                      <FailedLine en="Your inquiries could not be read just now." el="Τα αιτήματά σας δεν διαβάστηκαν αυτή τη στιγμή." busy={inquiriesQuery.isFetching} onRetry={() => void inquiriesQuery.refetch()} />
                    </div>
                  )}
                  {bookRead && services.length === 0 && (
                    <p className="px-4 py-4 text-sm text-muted-foreground sm:px-6"><BilingualText en="No service was asked about in this period." el="Καμία υπηρεσία δεν ζητήθηκε σε αυτή την περίοδο." wrap /></p>
                  )}
                  {services.map(svc => (
                    <div key={svc.id} className="px-4 py-3 sm:px-6">
                      <RowHead
                        title={svc.title}
                        subtitle={<BilingualText en={`${svc.inquiries} ${svc.inquiries === 1 ? 'inquiry' : 'inquiries'} · ${svc.projects} became ${svc.projects === 1 ? 'a project' : 'projects'}`} el={`${svc.inquiries} ${svc.inquiries === 1 ? 'αίτημα' : 'αιτήματα'} · ${svc.projects} ${svc.projects === 1 ? 'έγινε έργο' : 'έγιναν έργα'}`} compact />}
                        asideStays
                        aside={(
                          <>
                            <span className="text-right">
                              <span className="block card-body font-semibold tabular-nums text-foreground">{money(svc.agreedValue, svc.currency)}</span>
                              <span className="block text-xs text-muted-foreground"><BilingualText en="Agreed" el="Συμφωνημένα" compact /></span>
                            </span>
                            {svc.rating != null ? (
                              <span className="flex shrink-0 items-center gap-1">
                                <Star className="icon-sm text-status-warning fill-status-warning" aria-hidden="true" />
                                <span className="card-body font-medium tabular-nums text-foreground">{svc.rating}</span>
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-xs shrink-0"><BilingualText en="No reviews" el="Χωρίς κριτικές" compact /></Badge>
                            )}
                          </>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </AppShell>
  );
}
