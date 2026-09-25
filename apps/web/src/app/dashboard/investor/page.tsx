'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  DollarSign,
  Eye,
  LineChart,
  PieChart,
  Rocket,
  Search,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import {
  getInvestorActivity,
  getInvestorSummary,
  getMeProfile,
  listInvestorDeals,
  type InvestorDeal,
  type PipelineStage,
} from '@/lib/api';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { qk, queryKeys } from '@/lib/query-keys';

/*
 * The investor's home, read from the investor's own board.
 *
 * Every figure here was a constant: "Deal Flow 24, +18% this month", a
 * portfolio of "12" companies worth "$8.7M" at "3.6x", active deals called
 * TechVenture, DataFlow and CloudScale, and a "Recent Activity" of three
 * fixed lines. The pipeline, portfolio and analytics pages beside it read the
 * investor API and told a different story - Kolo Labs, Thalia, Meltemi,
 * Harbor; two investments, €350K deployed - in a different currency. It reads
 * the same three endpoints now (summary, deals, activity), so the home and
 * the pages it links to say the same thing, and a trend is not shown where
 * nothing earlier was recorded to compare against.
 */

const ACTIVE_STAGES: PipelineStage[] = ['reviewing', 'meeting', 'due_diligence', 'negotiating'];
const STAGE_LABEL: Record<string, string> = {
  discovered: 'Discovered',
  reviewing: 'Reviewing',
  meeting: 'Meeting',
  due_diligence: 'Due diligence',
  negotiating: 'Negotiating',
  invested: 'Invested',
  passed: 'Passed',
};
const STAGE_TONE: Record<string, string> = {
  reviewing: 'bg-status-info-bg text-status-info',
  meeting: 'bg-status-accent-bg text-status-accent',
  due_diligence: 'bg-status-warning-bg text-status-warning',
  negotiating: 'bg-status-accent-bg text-status-accent',
};

function money(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  href?: string;
}) {
  const content = (
    <Card className="h-full transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <Icon className="icon-md text-primary-accessible" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block h-full rounded-xl focus-ring">{content}</Link> : content;
}

function DealRow({ deal, trailing }: { deal: InvestorDeal; trailing: React.ReactNode }) {
  return (
    <Link
      href={`/startups/${deal.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <Avatar className="h-10 w-10 shrink-0 rounded-lg">
        <AvatarImage src={deal.logoUrl ?? undefined} />
        <AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary-accessible">
          {deal.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{deal.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[deal.industry, deal.companyStage].filter(Boolean).join(' · ') || deal.tagline || '—'}
        </p>
      </div>
      <div className="shrink-0 text-right">{trailing}</div>
    </Link>
  );
}

export default function InvestorDashboard() {
  const { hasSession, mounted } = useSession();

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });
  const { data: summary } = useQuery({
    queryKey: qk('investor', 'summary'),
    queryFn: getInvestorSummary,
    staleTime: 60_000,
    retry: 0,
  });
  const { data: dealsPage, isLoading: dealsLoading } = useQuery({
    queryKey: qk('investor', 'deals', 'all'),
    queryFn: () => listInvestorDeals({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });
  const { data: activityPage } = useQuery({
    queryKey: qk('investor', 'activity'),
    queryFn: () => getInvestorActivity(20),
    staleTime: 60_000,
    retry: 0,
  });

  const displayName = profile?.profile?.displayName || 'Investor';
  const deals = dealsPage?.deals ?? [];
  const discovered = deals.filter((d) => d.pipelineStage === 'discovered').slice(0, 4);
  const active = deals.filter((d) => ACTIVE_STAGES.includes(d.pipelineStage));
  const invested = deals.filter((d) => d.pipelineStage === 'invested');
  const activity = (activityPage?.activity ?? []).slice(0, 5);
  const currency = invested[0]?.currency ?? deals[0]?.currency ?? 'EUR';

  // What the board leans toward, counted from it - not a preference set
  // nobody entered. The profile is where an investor states theirs.
  const topOf = (values: (string | null)[]) =>
    Object.entries(
      values.filter((v): v is string => Boolean(v)).reduce<Record<string, number>>((acc, v) => {
        acc[v] = (acc[v] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([v]) => v);
  const leaningIndustries = topOf(deals.map((d) => d.industry));
  const leaningStages = topOf(deals.map((d) => d.companyStage));

  const multiple = (d: InvestorDeal) =>
    d.investedCents && d.currentValueCents != null ? d.currentValueCents / d.investedCents : null;

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 py-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      description="Pipeline health, deal flow, and portfolio performance — in one view."
      actions={
        <Badge variant="outline" className="gap-1.5">
          <DollarSign className="icon-sm" aria-hidden="true" />
          Investor
        </Badge>
      }
    >
      <div className="space-y-6">
        <DashboardGreeting name={displayName} lead={{ en: dashboardEn('investor_lead'), el: dashboardEl('investor_lead') }} />

        {/* The four figures, each linking to the page that holds its rows. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatCard icon={Briefcase} label="Deal flow" value={summary?.totalDeals ?? '—'} subtext="Deals on your board" href="/investor/pipeline" />
          <StatCard icon={Target} label="Active deals" value={summary ? active.length : '—'} subtext="Reviewing to negotiating" href="/investor/pipeline" />
          <StatCard icon={Building2} label="Portfolio" value={summary?.investments ?? '—'} subtext={summary ? `${money(summary.currentValueCents, currency)} current value` : undefined} href="/investor/portfolio" />
          <StatCard
            icon={TrendingUp}
            label="Return"
            value={summary?.returnPct == null ? '—' : `${summary.returnPct > 0 ? '+' : ''}${summary.returnPct}%`}
            subtext={summary ? `on ${money(summary.deployedCents, currency)} deployed` : undefined}
            href="/investor/analytics"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Active deals first: they are what needs a decision. */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="icon-sm text-primary-accessible" aria-hidden="true" />
                    Active deals
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/investor/pipeline">
                      Pipeline <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {dealsLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
                {!dealsLoading && active.map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    trailing={
                      <>
                        <Badge size="sm" className={cn(STAGE_TONE[deal.pipelineStage] ?? '')}>
                          {STAGE_LABEL[deal.pipelineStage] ?? deal.pipelineStage}
                        </Badge>
                        {deal.askAmountCents != null && (
                          <p className="mt-1 text-xs text-muted-foreground">asking {money(deal.askAmountCents, deal.currency)}</p>
                        )}
                      </>
                    }
                  />
                ))}
                {!dealsLoading && active.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No deal is between review and term sheet right now.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="icon-sm text-primary-accessible" aria-hidden="true" />
                    Portfolio
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/investor/portfolio">
                      All companies <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {invested.map((deal) => {
                  const x = multiple(deal);
                  return (
                    <DealRow
                      key={deal.id}
                      deal={deal}
                      trailing={
                        <>
                          <p className={cn('text-sm font-semibold tabular-nums', x == null ? 'text-muted-foreground' : x >= 1 ? 'text-status-success' : 'text-status-danger')}>
                            {x == null ? '—' : `${x.toFixed(1)}x`}
                          </p>
                          <p className="text-xs text-muted-foreground">{money(deal.currentValueCents ?? deal.investedCents, deal.currency)}</p>
                        </>
                      }
                    />
                  );
                })}
                {!dealsLoading && invested.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Mark a deal as invested in the pipeline to track it here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Rocket className="icon-sm text-primary-accessible" aria-hidden="true" />
                    Recently discovered
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/investor/scouting">
                      Scout more <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {discovered.map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    trailing={
                      deal.askAmountCents != null ? (
                        <p className="text-sm font-semibold text-primary-accessible">{money(deal.askAmountCents, deal.currency)}</p>
                      ) : null
                    }
                  />
                ))}
                {!dealsLoading && discovered.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Startups you watch from Scouting appear here first.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* A navigation list, not a stack of full-width outlined buttons. */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Go to</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav aria-label="Investor pages" className="flex flex-col">
                  {[
                    { href: '/investor/scouting', icon: Search, label: 'Scout startups' },
                    { href: '/investor/watchlist', icon: Star, label: 'Watchlist' },
                    { href: '/investor/pipeline', icon: Target, label: 'Deal pipeline' },
                    { href: '/investor/portfolio', icon: LineChart, label: 'Portfolio' },
                    { href: '/investor/analytics', icon: BarChart3, label: 'Analytics' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60"
                    >
                      <Icon className="icon-sm text-muted-foreground group-hover:text-primary-accessible" aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      <ChevronRight className="icon-sm text-muted-foreground/60" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Where your board leans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {leaningIndustries.length ? leaningIndustries.map((i) => <Badge key={i} variant="outline">{i}</Badge>) : <span className="text-sm text-muted-foreground">{'—'}</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Company stages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {leaningStages.length ? leaningStages.map((s) => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-sm text-muted-foreground">{'—'}</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Counted from the deals on your board. State your own focus on your profile.
                </p>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/profile/edit">Edit investment focus</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="icon-sm" aria-hidden="true" />
                  Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activity.map((a) => (
                  <Link key={a.id} href={`/startups/${a.dealId}`} className="flex items-start gap-2 rounded-md text-sm hover:text-foreground">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{a.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {a.dealName} · <RelativeTime date={a.createdAt} />
                      </span>
                    </span>
                  </Link>
                ))}
                {activity.length === 0 && (
                  <p className="text-sm text-muted-foreground">Moves, notes and meetings on your deals show up here.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
