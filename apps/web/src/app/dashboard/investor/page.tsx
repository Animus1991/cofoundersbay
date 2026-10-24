'use client';

import Link from 'next/link';
import {
  BarChart3,
  Briefcase,
  Building2,
  Eye,
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
import { BilingualText } from '@/components/common/BilingualText';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { HomeNextStep } from '@/components/dashboard/HomeNextStep';
import { MetricTile } from '@/components/dashboard/MetricTile';
import { EmptyLine, FailedLine, QuickLinks, RowHead, SectionCard } from '@/components/dashboard/SectionCard';
import { RelativeTime } from '@/components/common/RelativeTime';
import { StatusText } from '@/components/common/StatusText';
import { useSession } from '@/hooks/useSession';
import { cn, companyStageLabel, initialsOf } from '@/lib/utils';
import {
  getInvestorActivity,
  getInvestorSummary,
  getMeProfile,
  listInvestorDeals,
  type InvestorDeal,
  type PipelineStage,
} from '@/lib/api';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { qk, queryKeys } from '@/lib/query-keys';
import { formatCompactMoney } from '@/lib/i18n/format';
import { WhatsNewPanel } from '@/components/dashboard/WhatsNewPanel';
import { dealEventTitleEl } from '@/lib/i18n/deal-events';
import { HomeAskHero } from '@/components/dashboard/HomeAskHero';

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
// The pipeline page's own words for each stage, in both languages.
const STAGE_LABEL: Record<string, { en: string; el: string }> = {
  discovered: { en: 'Discovered', el: 'Εντοπίστηκε' },
  reviewing: { en: 'Reviewing', el: 'Υπό εξέταση' },
  meeting: { en: 'Meeting', el: 'Συνάντηση' },
  due_diligence: { en: 'Due diligence', el: 'Δέουσα επιμέλεια' },
  negotiating: { en: 'Negotiating', el: 'Διαπραγμάτευση' },
  invested: { en: 'Invested', el: 'Επένδυση' },
  passed: { en: 'Passed', el: 'Απορρίφθηκε' },
};
const STAGE_TONE: Record<string, string> = {
  reviewing: 'bg-status-info-bg text-status-info',
  meeting: 'bg-status-accent-bg text-status-accent',
  due_diligence: 'bg-status-warning-bg text-status-warning',
  negotiating: 'bg-status-accent-bg text-status-accent',
};

function money(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null) return '—';
  return formatCompactMoney(cents / 100, currency, 1);
}

/**
 * How the board splits on one attribute: each value with its share drawn as a
 * bar against the whole board, so "two of seven" reads at a glance instead of
 * as a row of equal chips that hid the counts.
 */
function Distribution({ title, titleEl, rows, total }: { title: string; titleEl: string; rows: [string, number][]; total: number }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        <BilingualText en={title} el={titleEl} />
      </p>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map(([value, count]) => (
            <li key={value} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
              <span className="truncate">{value}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {count} / {total}
              </span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-primary/70" style={{ width: `${total ? Math.round((count / total) * 100) : 0}%` }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{'—'}</p>
      )}
    </div>
  );
}

function DealRow({ deal, trailing }: { deal: InvestorDeal; trailing: React.ReactNode }) {
  // A startup's rounded square, its name over sector and stage, and the
  // stage or figure at the right: a CardHead row, on the section's axis.
  return (
    <Link
      href={`/startups/${deal.id}`}
      className="axis-row group block rounded-md transition-colors hover:bg-accent focus-ring"
    >
      <RowHead
        mark={(
          <Avatar className="h-10 w-10 rounded-xl">
            <AvatarImage src={deal.logoUrl ?? undefined} alt="" />
            <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary-accessible">
              {initialsOf(deal.name)}
            </AvatarFallback>
          </Avatar>
        )}
        title={<span className="block truncate">{deal.name}</span>}
        subtitle={(
          <span className="block truncate">
            {[deal.industry, companyStageLabel(deal.companyStage)].filter(Boolean).join(' · ') || deal.tagline || '—'}
          </span>
        )}
        aside={trailing ? <div className="text-left sm:text-right">{trailing}</div> : undefined}
      />
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
  const { data: dealsPage, isLoading: dealsLoading, isError: dealsError, isFetching: dealsFetching, refetch: refetchDeals } = useQuery({
    queryKey: qk('investor', 'deals', 'all'),
    queryFn: () => listInvestorDeals({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });
  const { data: activityPage, isLoading: activityLoading, isError: activityError, isFetching: activityFetching, refetch: refetchActivity } = useQuery({
    queryKey: qk('investor', 'activity'),
    queryFn: () => getInvestorActivity(20),
    staleTime: 60_000,
    retry: 0,
  });

  const deals = dealsPage?.deals ?? [];
  /*
   * With the board unread, the sections said "No deal is between review and
   * term sheet", "Mark a deal as invested…" and "Startups you watch… appear
   * here": three claims about a board nobody read. One section says the
   * deals were not read, with Try again; the two that list the same rows
   * wait for it (docs §93).
   */
  const dealsFailed = dealsError && !dealsPage;
  const activityFailed = activityError && !activityPage;
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
      .slice(0, 4);
  const leaningIndustries = topOf(deals.map((d) => d.industry));
  const leaningStages = topOf(deals.map((d) => companyStageLabel(d.companyStage) || null));

  const multiple = (d: InvestorDeal) =>
    d.investedCents && d.currentValueCents != null ? d.currentValueCents / d.investedCents : null;

  if (!mounted) {
    return (
      <AppShell showHelp>
        <div className="space-y-6">
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
    <AppShell askAi={false} showHelp
      description="Pipeline health, deal flow, and portfolio performance — in one view."
      descriptionEl="Κατάσταση της ροής επενδύσεων, νέες ευκαιρίες και απόδοση χαρτοφυλακίου — σε μία προβολή."
    >
      <div className="space-y-6">
        <HomeAskHero role="investor" name={profile?.profile?.displayName} lead={{ en: dashboardEn('investor_lead'), el: dashboardEl('investor_lead') }} />

        {!dealsLoading && active[0] ? (
          <HomeNextStep
            kickerEn="Active deal"
            kickerEl="Ενεργή συμφωνία"
            title={active[0].name}
            reasonEn={STAGE_LABEL[active[0].pipelineStage]?.en}
            reasonEl={STAGE_LABEL[active[0].pipelineStage]?.el}
            // "Open" over one named deal opened the whole board; it opens
            // the deal.
            href={`/startups/${active[0].id}`}
            actionEn="Open"
            actionEl="Άνοιγμα"
          />
        ) : null}

        {/* The four figures, each linking to the page that holds its rows. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <MetricTile icon={Briefcase} label="Deal flow" labelEl="Ροή συμφωνιών" value={summary?.totalDeals ?? '—'} caption="Deals on your board" captionEl="Συμφωνίες στον πίνακά σας" href="/investor/pipeline" />
          <MetricTile icon={Target} label="Active deals" labelEl="Ενεργές συμφωνίες" value={dealsPage ? active.length : '—'} caption="Reviewing to negotiating" captionEl="Από αξιολόγηση έως διαπραγμάτευση" href="/investor/pipeline" />
          <MetricTile
            icon={Building2}
            label="Portfolio"
            labelEl="Χαρτοφυλάκιο"
            value={summary?.investments ?? '—'}
            caption={summary ? `${money(summary.currentValueCents, currency)} current value` : undefined}
            captionEl={summary ? `${money(summary.currentValueCents, currency)} τρέχουσα αξία` : undefined}
            href="/investor/portfolio"
          />
          <MetricTile
            icon={TrendingUp}
            label="Return"
            labelEl="Απόδοση"
            value={summary?.returnPct == null ? '—' : `${summary.returnPct > 0 ? '+' : ''}${summary.returnPct}%`}
            caption={summary ? `on ${money(summary.deployedCents, currency)} deployed` : undefined}
            captionEl={summary ? `επί ${money(summary.deployedCents, currency)} επενδυμένων` : undefined}
            href="/investor/analytics"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Active deals first: they are what needs a decision. */}
            <SectionCard title="Active deals" titleEl="Ενεργές συμφωνίες" icon={BarChart3} action={{ href: '/investor/pipeline', label: 'Pipeline', labelEl: 'Pipeline' }} contentClassName="card-rows">
              {dealsLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              {!dealsLoading && active.map((deal) => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  trailing={
                    <>
                      <Badge size="sm" className={cn(STAGE_TONE[deal.pipelineStage] ?? '')}>
                        {STAGE_LABEL[deal.pipelineStage]
                          ? <BilingualText en={STAGE_LABEL[deal.pipelineStage].en} el={STAGE_LABEL[deal.pipelineStage].el} compact />
                          : <StatusText value={deal.pipelineStage} />}
                      </Badge>
                      {deal.askAmountCents != null && (
                        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                          <BilingualText en={`Asking ${money(deal.askAmountCents, deal.currency)}`} el={`Ζητά ${money(deal.askAmountCents, deal.currency)}`} compact />
                        </p>
                      )}
                    </>
                  }
                />
              ))}
              {dealsFailed ? (
                <FailedLine
                  en="Your deals could not be read just now, so active deals, the portfolio and new finds are not shown."
                  el="Οι συμφωνίες σας δεν διαβάστηκαν αυτή τη στιγμή, οπότε δεν εμφανίζονται ενεργές συμφωνίες, χαρτοφυλάκιο και νέες ανακαλύψεις."
                  busy={dealsFetching}
                  onRetry={() => void refetchDeals()}
                />
              ) : null}
              {!dealsLoading && !dealsFailed && active.length === 0 && (
                <EmptyLine en="No deal is between review and term sheet right now." el="Καμία συμφωνία δεν είναι αυτή τη στιγμή μεταξύ αξιολόγησης και term sheet." />
              )}
            </SectionCard>

            {dealsFailed ? null : (
            <SectionCard title="Portfolio" titleEl="Χαρτοφυλάκιο" icon={PieChart} action={{ href: '/investor/portfolio', label: 'All companies', labelEl: 'Όλες οι εταιρείες' }} contentClassName="card-rows">
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
                        <p className="text-xs tabular-nums text-muted-foreground">{money(deal.currentValueCents ?? deal.investedCents, deal.currency)}</p>
                      </>
                    }
                  />
                );
              })}
              {!dealsLoading && invested.length === 0 && (
                <EmptyLine en="Mark a deal as invested in the pipeline to track it here." el="Σημειώστε μια συμφωνία ως επένδυση στο pipeline για να την παρακολουθείτε εδώ." />
              )}
            </SectionCard>
            )}

            {dealsFailed ? null : (
            <SectionCard title="Recently discovered" titleEl="Πρόσφατες ανακαλύψεις" icon={Rocket} action={{ href: '/investor/scouting', label: 'Scout more', labelEl: 'Περισσότερα' }} contentClassName="card-rows">
              {discovered.map((deal) => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  // "€200K" alone, in the accent, beside "Asking €750K" in
                  // the section above: the same figure says what it is.
                  trailing={
                    deal.askAmountCents != null ? (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        <BilingualText en={`Asking ${money(deal.askAmountCents, deal.currency)}`} el={`Ζητά ${money(deal.askAmountCents, deal.currency)}`} compact />
                      </p>
                    ) : null
                  }
                />
              ))}
              {!dealsLoading && discovered.length === 0 && (
                <EmptyLine en="Startups you watch from Scouting appear here first." el="Οι startups που παρακολουθείτε από την Ανίχνευση εμφανίζονται πρώτα εδώ." />
              )}
            </SectionCard>
            )}
          </div>

          <div className="space-y-6">
{/* The role's pages this home does not already open from a tile or a section: the rest were listed twice on one screen (docs §101). */}
            <QuickLinks
              label="Investor pages"
              labelEl="Σελίδες επενδυτή"
              links={[
                // "Recently discovered" opens Scouting unless the deals were not read.
                ...(dealsFailed ? [{ href: '/investor/scouting', icon: Search, label: 'Scout startups', labelEl: 'Ανίχνευση startups' }] : []),
                { href: '/investor/watchlist', icon: Star, label: 'Watchlist', labelEl: 'Λίστα παρακολούθησης' },
              ]}
            />

            <SectionCard title="Board mix" titleEl="Σύνθεση πίνακα" contentClassName="space-y-4">
              {dealsLoading ? (
                <Skeleton className="h-16" />
              ) : dealsFailed ? (
                // Two "—" under "Counted from the deals on your board".
                <p className="text-sm text-muted-foreground">
                  <BilingualText en="Your deals could not be read just now." el="Οι συμφωνίες σας δεν διαβάστηκαν αυτή τη στιγμή." stacked wrap />
                </p>
              ) : (
                <>
                  <Distribution title="Industries" titleEl="Κλάδοι" rows={leaningIndustries} total={deals.length} />
                  <Distribution title="Company stages" titleEl="Στάδια εταιρειών" rows={leaningStages} total={deals.length} />
                </>
              )}
              <p className="text-xs text-muted-foreground">
                <BilingualText
                  en="Counted from the deals on your board. State your own focus on your profile."
                  el="Μετρημένο από τις συμφωνίες του πίνακά σας. Δηλώστε τη δική σας εστίαση στο προφίλ."
                  stacked
                  wrap
                />
              </p>
              <Button variant="secondary" size="sm" className="w-full" asChild>
                <Link href="/profile/edit">
                  <BilingualText en="Edit investment focus" el="Επεξεργασία εστίασης" />
                </Link>
              </Button>
            </SectionCard>

            <SectionCard title="Recent activity" titleEl="Πρόσφατη δραστηριότητα" icon={Eye} contentClassName="card-rows">
              {/* Activity rows on the section's axis: the move, then the
                  company and when, without a bullet column in front. */}
              {activity.map((a) => (
                <Link key={a.id} href={`/startups/${a.dealId}`} className="axis-row block rounded-md transition-colors hover:bg-accent focus-ring">
                  <RowHead
                    title={<span className="block truncate first-letter:uppercase"><BilingualText en={a.title} el={dealEventTitleEl(a.title)} compact /></span>}
                    subtitle={<>{a.dealName} · <RelativeTime date={a.createdAt} /></>}
                  />
                </Link>
              ))}
              {activityLoading ? (
                <Skeleton className="h-12" />
              ) : activityFailed ? (
                <FailedLine en="Recent activity could not be read just now." el="Η πρόσφατη δραστηριότητα δεν διαβάστηκε αυτή τη στιγμή." busy={activityFetching} onRetry={() => void refetchActivity()} />
              ) : activity.length === 0 && (
                <EmptyLine en="Moves, notes and meetings on your deals show up here." el="Κινήσεις, σημειώσεις και συναντήσεις στις συμφωνίες σας εμφανίζονται εδώ." />
              )}
            </SectionCard>
          </div>
        </div>

        {/* After the work. The active deal and the figures stay the first
            glance; this list is what shipped, and it is still one press away. */}
        <WhatsNewPanel audience="investor" />
      </div>
    </AppShell>
  );
}
