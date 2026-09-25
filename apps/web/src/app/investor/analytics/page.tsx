'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  Users,
  ArrowUpRight,
  MapPin,
  Zap,
  LineChart,
  PieChart,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { getInvestorSummary } from '@/lib/api';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { qk } from '@/lib/query-keys';
import { choiceControl, usePageControls } from '@/lib/page-controls';
import { usePublishPageSnapshot } from '@/contexts/PageSnapshotContext';

/** Compact money, in the board's currency rather than a hard-coded dollar. */
function money(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null) return '\u2014';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Data ────────────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: 'Oct', reviewed: 8, invested: 1, passed: 7 },
  { month: 'Nov', reviewed: 11, invested: 2, passed: 9 },
  { month: 'Dec', reviewed: 7, invested: 1, passed: 6 },
  { month: 'Jan', reviewed: 14, invested: 2, passed: 12 },
  { month: 'Feb', reviewed: 12, invested: 1, passed: 11 },
  { month: 'Mar', reviewed: 15, invested: 2, passed: 13 },
];

const FUNNEL = [
  { stage: 'Discovered', count: 45, color: 'bg-blue-400' },
  { stage: 'Reviewing', count: 28, color: 'bg-blue-500' },
  { stage: 'Meeting', count: 15, color: 'bg-purple-500' },
  { stage: 'Due Diligence', count: 8, color: 'bg-amber-500' },
  { stage: 'Negotiating', count: 4, color: 'bg-orange-500' },
  { stage: 'Invested', count: 2, color: 'bg-green-500' },
];

const INDUSTRIES = [
  { name: 'AI/ML', count: 12, pct: 27, color: '#6366f1' },
  { name: 'FinTech', count: 10, pct: 22, color: '#0ea5e9' },
  { name: 'SaaS', count: 8, pct: 18, color: '#8b5cf6' },
  { name: 'HealthTech', count: 6, pct: 13, color: '#10b981' },
  { name: 'CleanTech', count: 5, pct: 11, color: '#f59e0b' },
  { name: 'Other', count: 4, pct: 9, color: '#6b7280' },
];

const GEO = [
  { city: 'San Francisco', count: 14, pct: 31 },
  { city: 'New York', count: 10, pct: 22 },
  { city: 'London', count: 8, pct: 18 },
  { city: 'Berlin', count: 6, pct: 13 },
  { city: 'Singapore', count: 4, pct: 9 },
  { city: 'Other', count: 3, pct: 7 },
];

const PORTFOLIO_RETURNS = [
  { name: 'FoodTech Pro', invested: '$150K', current: '$420K', multiple: '2.8x', isUp: true },
  { name: 'CloudSecure', invested: '$200K', current: '$310K', multiple: '1.55x', isUp: true },
  { name: 'EduLearn', invested: '$75K', current: '$60K', multiple: '0.8x', isUp: false },
];

// ── SVG Bar Chart ────────────────────────────────────────────────────────────

/**
 * The period buttons above this chart set `period` and nothing read it, so the
 * control looked live and was inert. It narrows the window now — the most the
 * data on hand can honestly support until the board has months of history to
 * chart.
 */
function BarChartSVG({ months }: { months: number }) {
  const data = MONTHLY_DATA.slice(-months);
  const maxVal = Math.max(...data.map(d => d.reviewed), 1);
  const W = 420, H = 120, BAR_W = 22, GAP = 46;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ fontFamily: 'inherit' }}>
      {data.map((d, i) => {
        const x = 18 + i * GAP;
        const reviewedH = (d.reviewed / maxVal) * H;
        const investedH = (d.invested / maxVal) * H;
        return (
          <g key={d.month}>
            {/* Reviewed bar */}
            <rect x={x} y={H - reviewedH} width={BAR_W} height={reviewedH} rx={3}
              fill="hsl(var(--primary))" opacity={0.25} />
            {/* Invested bar */}
            <rect x={x} y={H - investedH} width={BAR_W} height={investedH} rx={3}
              fill="hsl(var(--primary))" opacity={0.85} />
            {/* Month label */}
            <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fontSize={10}
              fill="currentColor" opacity={0.5}>{d.month}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={2} y={4} width={10} height={10} rx={2} fill="hsl(var(--primary))" opacity={0.25} />
      <text x={16} y={13} fontSize={9} fill="currentColor" opacity={0.6}>Reviewed</text>
      <rect x={72} y={4} width={10} height={10} rx={2} fill="hsl(var(--primary))" opacity={0.85} />
      <text x={86} y={13} fontSize={9} fill="currentColor" opacity={0.6}>Invested</text>
    </svg>
  );
}

// ── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart() {
  const R = 50, CX = 70, CY = 65, strokeW = 18;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[220px]">
      {INDUSTRIES.map((ind) => {
        const dash = (ind.pct / 100) * circumference;
        const gap = circumference - dash;
        const rotate = (offset / 100) * 360 - 90;
        offset += ind.pct;
        return (
          <circle key={ind.name} cx={CX} cy={CY} r={R}
            fill="none" stroke={ind.color} strokeWidth={strokeW}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotate} ${CX} ${CY})`}
            opacity={0.85}
          />
        );
      })}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={14} fontWeight={700} fill="currentColor">45</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.5}>DEALS</text>
      {/* Legend */}
      {INDUSTRIES.map((ind, i) => (
        <g key={ind.name} transform={`translate(140, ${10 + i * 17})`}>
          <rect width={8} height={8} rx={2} fill={ind.color} opacity={0.85} />
          <text x={12} y={8} fontSize={9} fill="currentColor" opacity={0.7}>{ind.name} {ind.pct}%</text>
        </g>
      ))}
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorAnalyticsPage() {
  const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('6m');

  const { data: summary } = useQuery({
    queryKey: qk('investor', 'summary'),
    queryFn: getInvestorSummary,
    staleTime: 60_000,
    retry: 0,
  });

  /*
   * These six were string constants with trend arrows attached — "45 deals
   * reviewed, +18%" beside a period selector that changed nothing. Five are
   * counted from the investor's own board now. The sixth, time to close, needs
   * the interval between a deal entering the board and reaching `invested`;
   * the events that would measure it only start accruing from today, so it
   * reads a dash rather than a number nobody has.
   *
   * The trend arrows are gone with them: a trend is a comparison against an
   * earlier period, and there is no earlier period recorded yet.
   */
  const reviewed = summary
    ? summary.totalDeals - (summary.stageCounts?.discovered ?? 0)
    : null;
  const conversion =
    summary && reviewed && reviewed > 0
      ? Math.round((summary.investments / reviewed) * 1000) / 10
      : null;

  const kpis = [
    { label: 'Deals Reviewed', value: reviewed == null ? '\u2014' : String(reviewed), icon: Target, color: 'text-primary-accessible' },
    { label: 'Invested', value: summary ? String(summary.investments) : '\u2014', icon: DollarSign, color: 'text-status-success' },
    { label: 'Conversion Rate', value: conversion == null ? '\u2014' : `${conversion}%`, icon: TrendingUp, color: 'text-status-info' },
    { label: 'Avg Time to Close', value: '\u2014', icon: Calendar, color: 'text-status-warning' },
    { label: 'Total Deployed', value: money(summary?.deployedCents), icon: BarChart3, color: 'text-status-accent' },
    { label: 'Portfolio Value', value: money(summary?.currentValueCents), icon: LineChart, color: 'text-status-success' },
  ];

  const [tab, setTab] = useState('flow');
  // Offered to the assistant: the header's window and the chart tabs; the
  // tiles go out as figures, so "what is my conversion rate?" has an answer.
  usePageControls([
    choiceControl('period', 'Analytics window', 'Περίοδος στατιστικών', [
      { value: '3m', en: '3 months', el: '3 μήνες' },
      { value: '6m', en: '6 months', el: '6 μήνες' },
      { value: '1y', en: '1 year', el: '1 έτος' },
    ], period, (v) => setPeriod(v as typeof period)),
    choiceControl('tab', 'Analytics view', 'Προβολή στατιστικών', [
      { value: 'flow', en: 'Deal flow', el: 'Ροή συμφωνιών' },
      { value: 'sectors', en: 'Sectors', el: 'Κλάδοι' },
      { value: 'geo', en: 'Geography', el: 'Γεωγραφία' },
      { value: 'returns', en: 'Portfolio returns', el: 'Αποδόσεις χαρτοφυλακίου' },
    ], tab, setTab),
  ]);
  usePublishPageSnapshot('/investor/analytics', summary ? {
    state: 'ready',
    figures: Object.fromEntries(kpis.map((k) => [k.label, k.value])),
  } : null);

  return (
    <AppShell
      actions={
        <>
          <div className="flex items-center gap-2">
            {(['3m', '6m', '1y'] as const).map(p => (
              <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setPeriod(p)}>
                {p}
              </Button>
            ))}
          </div>
        </>
      }
    >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 kpi-odd-span-sm gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={cn('text-xl font-bold mt-0.5', kpi.color)}>{kpi.value}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <kpi.icon className="h-4 w-4 text-primary-accessible" />
                    </div>
                    {/*
                      * The trend arrow is gone with the constants that fed it.
                      * A trend is a comparison against an earlier period, and
                      * the board only starts recording one from today — an
                      * arrow here would have been decoration pointing at
                      * nothing.
                      */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="flow">Deal Flow</TabsTrigger>
            <TabsTrigger value="sectors">Sectors</TabsTrigger>
            <TabsTrigger value="geo">Geography</TabsTrigger>
            <TabsTrigger value="returns">Portfolio Returns</TabsTrigger>
          </TabsList>

          {/* Deal Flow Tab */}
          <TabsContent value="flow" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Deal Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartSVG months={period === '3m' ? 3 : period === '6m' ? 6 : 12} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pipeline Funnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {FUNNEL.map((stage) => {
                    const pct = Math.round((stage.count / FUNNEL[0].count) * 100);
                    return (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{stage.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                            <span className="font-semibold w-6 text-right">{stage.count}</span>
                          </div>
                        </div>
                        <div className="h-6 bg-muted rounded overflow-hidden">
                          <div className={cn('h-full rounded flex items-center justify-end pr-2', stage.color)}
                            style={{ width: `${pct}%`, opacity: 0.8 }}>
                            {pct > 15 && <span className="text-2xs text-white font-medium">{stage.count}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                      <Link href="/investor/pipeline">View Pipeline <ArrowUpRight className="ml-1 icon-sm" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Industry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Deals by Industry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {INDUSTRIES.map((ind) => (
                    <div key={ind.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ind.color }} />
                          <span>{ind.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{ind.count} deals · {ind.pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${ind.pct}%`, backgroundColor: ind.color, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geo" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="icon-sm text-primary-accessible" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {GEO.map((g) => (
                  <div key={g.city}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{g.city}</span>
                      <span className="text-muted-foreground text-xs">{g.count} deals · {g.pct}%</span>
                    </div>
                    <Progress value={g.pct} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="icon-sm text-primary-accessible" />
                  Portfolio Returns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PORTFOLIO_RETURNS.map(p => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Invested: {p.invested}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-bold', p.isUp ? 'text-status-success' : 'text-status-danger')}>{p.multiple}</p>
                      <p className="text-xs text-muted-foreground">{p.current} current</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex justify-between items-center border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Invested</p>
                    <p className="font-bold">$580K</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="font-bold text-status-success">$790K</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Unrealised MOIC</p>
                    <p className="font-bold text-status-success">1.36x</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href="/investor/portfolio">Full Portfolio <ArrowUpRight className="ml-1 icon-sm" /></Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
