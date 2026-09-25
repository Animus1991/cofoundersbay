'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FolderKanban, Search, Filter, Plus, MoreVertical,
  Star, DollarSign, TrendingUp, Target, ArrowRight, Zap,
  MessageSquare, Calendar, Users, Telescope,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { listInvestorDeals, updateInvestorDeal, type InvestorDeal } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

type PipelineStage = 'discovered' | 'reviewing' | 'meeting' | 'due_diligence' | 'negotiating' | 'invested' | 'passed';

type Deal = {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  stage: string;
  pipelineStage: PipelineStage;
  /**
   * The founder's own readiness score, when the platform is allowed to show it
   * to an investor. Null for every deal today: `builderReadinessScore` is the
   * founder's private working state, and surfacing it to people looking at
   * them is a consent decision, not a wiring one. The card omits the line
   * rather than printing a number nobody computed.
   */
  readinessScore: number | null;
  askAmount?: number; // major units of `currency`
  currency?: string;
  addedAt: string;
  /** ISO timestamp. Rendered through `RelativeTime` so it survives hydration. */
  lastActivity: string;
  starred: boolean;
  founderName?: string;
  teamSize?: number;
};

const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'discovered', label: 'Discovered', color: 'bg-gray-500' },
  { key: 'reviewing', label: 'Reviewing', color: 'bg-blue-500' },
  { key: 'meeting', label: 'Meeting', color: 'bg-purple-500' },
  { key: 'due_diligence', label: 'Due Diligence', color: 'bg-amber-500' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-orange-500' },
  { key: 'invested', label: 'Invested', color: 'bg-green-500' },
];

/** The next stage forward on the board; null at the end or once passed. */
function nextStage(stage: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ['discovered', 'reviewing', 'meeting', 'due_diligence', 'negotiating', 'invested'];
  const i = order.indexOf(stage);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

type DealActions = {
  /** Absent on demo rows: there is no deal behind them to move. */
  onMove?: (deal: Deal, stage: PipelineStage) => void;
};

function DealCard({ deal, onMove }: { deal: Deal } & DealActions) {
  const next = nextStage(deal.pipelineStage);
  return (
    <div className="p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage src={deal.logoUrl} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-semibold text-sm">
            {deal.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{deal.name}</span>
            {deal.starred && <Star className="icon-sm text-status-warning fill-status-warning" />}
          </div>
          <p className="text-xs text-muted-foreground">{deal.industry}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" aria-label={`Open actions for ${deal.name}`}>
              <MoreVertical className="icon-sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/startups/${deal.id}`}>View Details</Link>
            </DropdownMenuItem>
            {/* Four items here had no handler. Move and Pass write the
                deal's stage; notes live on the deal page, which also has
                the full history. */}
            <DropdownMenuItem
              disabled={!onMove || !next}
              onSelect={() => { if (onMove && next) onMove(deal, next); }}
            >
              Move to Next Stage{next ? ` (${next.replace('_', ' ')})` : ''}
            </DropdownMenuItem>
            <UnavailableMenuItem
              en="Schedule Meeting"
              el="Προγραμματισμός συνάντησης"
              reasonEn="Meetings with founders are not scheduled in-app yet - message them from the deal page."
              reasonEl="Οι συναντήσεις με ιδρυτές δεν προγραμματίζονται ακόμη εδώ - στείλτε μήνυμα από τη σελίδα της συμφωνίας."
            />
            <DropdownMenuItem asChild>
              <Link href={`/startups/${deal.id}`}>Add Note</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive-accessible"
              disabled={!onMove || deal.pipelineStage === 'passed'}
              onSelect={() => onMove?.(deal, 'passed')}
            >
              Pass
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="secondary" className="text-2xs">{deal.stage}</Badge>
        {deal.readinessScore != null && (
          <span className="text-2xs text-muted-foreground">{deal.readinessScore}% ready</span>
        )}
        {deal.askAmount ? (
          <span className="text-2xs font-medium text-status-success ml-auto">
            {formatAsk(deal.askAmount, deal.currency)}
          </span>
        ) : null}
      </div>
      {deal.founderName && (
        <p className="text-2xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <span>👤 {deal.founderName}</span>
          {deal.teamSize && <span>· {deal.teamSize} team</span>}
        </p>
      )}
      <p className="text-2xs text-muted-foreground mt-1">
        <RelativeTime date={deal.lastActivity} format={formatRelativeTime} />
      </p>
    </div>
  );
}

/**
 * The board's own row from the API row.
 *
 * Money crosses the wire in minor units and is turned into major units once,
 * here, so no arithmetic downstream has to remember which it is holding.
 */
function toPageDeal(deal: InvestorDeal): Deal {
  return {
    id: deal.id,
    name: deal.name,
    logoUrl: deal.logoUrl ?? undefined,
    industry: deal.industry ?? '—',
    stage: deal.companyStage ?? '—',
    pipelineStage: deal.pipelineStage as PipelineStage,
    readinessScore: null,
    askAmount: deal.askAmountCents != null ? deal.askAmountCents / 100 : undefined,
    currency: deal.currency,
    addedAt: deal.createdAt,
    lastActivity: deal.lastActivityAt,
    starred: deal.starred,
    founderName: deal.founder?.displayName ?? undefined,
    teamSize: deal.teamSize ?? undefined,
  };
}

/** Compact money, in the deal's own currency rather than a hard-coded dollar. */
function formatAsk(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * What an empty board shows while the "demo data" switch is on. Timestamps are
 * real ISO instants rather than phrases like "2 hours ago": the cards render
 * them through `RelativeTime` now, and a phrase would reach `new Date()` as an
 * invalid date.
 */
const MOCK_DEALS: Deal[] = [
  { id: 'demo-1', name: 'NeuralFlow AI', industry: 'AI/ML', stage: 'Seed', pipelineStage: 'discovered', readinessScore: 85, askAmount: 500000, currency: 'EUR', addedAt: '2026-03-20T09:00:00.000Z', lastActivity: '2026-09-04T08:00:00.000Z', starred: true, founderName: 'Alex Georgiou', teamSize: 3 },
  { id: 'demo-2', name: 'GreenGrid', industry: 'CleanTech', stage: 'Pre-seed', pipelineStage: 'discovered', readinessScore: 72, askAmount: 200000, currency: 'EUR', addedAt: '2026-03-18T09:00:00.000Z', lastActivity: '2026-09-03T10:00:00.000Z', starred: false, founderName: 'Maria Sotiropoulou', teamSize: 2 },
  { id: 'demo-3', name: 'PayStream', industry: 'FinTech', stage: 'Seed', pipelineStage: 'reviewing', readinessScore: 91, askAmount: 750000, currency: 'EUR', addedAt: '2026-03-15T09:00:00.000Z', lastActivity: '2026-09-04T07:00:00.000Z', starred: true, founderName: 'Nikos Papas', teamSize: 4 },
  { id: 'demo-4', name: 'HealthPulse', industry: 'HealthTech', stage: 'Pre-seed', pipelineStage: 'reviewing', readinessScore: 65, askAmount: 300000, currency: 'EUR', addedAt: '2026-03-12T09:00:00.000Z', lastActivity: '2026-09-02T09:00:00.000Z', starred: false, founderName: 'Elena Kosta', teamSize: 2 },
  { id: 'demo-5', name: 'DataVault', industry: 'Enterprise', stage: 'Seed', pipelineStage: 'meeting', readinessScore: 78, askAmount: 600000, currency: 'EUR', addedAt: '2026-03-10T09:00:00.000Z', lastActivity: '2026-09-01T14:00:00.000Z', starred: true, founderName: 'Dimitris Alexiou', teamSize: 5 },
  { id: 'demo-6', name: 'EduLearn', industry: 'EdTech', stage: 'Pre-seed', pipelineStage: 'due_diligence', readinessScore: 82, askAmount: 350000, currency: 'EUR', addedAt: '2026-03-05T09:00:00.000Z', lastActivity: '2026-08-28T09:00:00.000Z', starred: false, founderName: 'Sofia Mela', teamSize: 3 },
  { id: 'demo-7', name: 'CloudSecure', industry: 'Cybersecurity', stage: 'Seed', pipelineStage: 'negotiating', readinessScore: 88, askAmount: 1000000, currency: 'EUR', addedAt: '2026-02-28T09:00:00.000Z', lastActivity: '2026-08-30T11:00:00.000Z', starred: true, founderName: 'Kostas Panou', teamSize: 6 },
  { id: 'demo-8', name: 'FoodTech Pro', industry: 'FoodTech', stage: 'Seed', pipelineStage: 'invested', readinessScore: 95, askAmount: 450000, currency: 'EUR', addedAt: '2026-02-15T09:00:00.000Z', lastActivity: '2026-08-20T09:00:00.000Z', starred: true, founderName: 'Ioanna Vlachou', teamSize: 4 },
];

export default function InvestorPipelinePage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [showPassed, setShowPassed] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);

  /*
   * The board is server state now. The demo fixtures stay as what an empty
   * board shows while the "demo data" switch is on — the switch is a feature,
   * not scaffolding — but a real deal always wins over an illustrative one.
   */
  const { data: dealsPage, isLoading } = useQuery({
    queryKey: ['investor', 'deals'],
    queryFn: () => listInvestorDeals({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });

  const liveDeals = useMemo(
    () => (dealsPage?.deals ?? []).map(toPageDeal),
    [dealsPage],
  );
  const deals = liveDeals.length > 0 ? liveDeals : showDemoData ? MOCK_DEALS : [];
  const isLive = liveDeals.length > 0;
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  const moveDeal = async (deal: Deal, stage: PipelineStage) => {
    if (stage === 'passed') {
      const ok = await confirm({
        title: `Pass on ${deal.name}?`,
        description: 'It leaves the active pipeline. You can bring it back from its deal page.',
        confirmLabel: 'Pass',
      });
      if (!ok) return;
    }
    try {
      await updateInvestorDeal(deal.id, { pipelineStage: stage });
      success('Deal moved', `${deal.name} → ${stage.replace('_', ' ')}`);
    } catch (e) {
      toastError('Could not move the deal', e instanceof Error ? e.message : undefined);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['investor'] });
    }
  };

  const totalPipelineValue = useMemo(() => deals.reduce((s, d) => s + (d.askAmount ?? 0), 0), [deals]);
  // Averaged over the deals that carry a score, not over all of them: dividing
  // by the whole board would report a lower readiness the more deals you add.
  const avgReadiness = useMemo(() => {
    const scored = deals.filter((d) => d.readinessScore != null);
    return scored.length > 0
      ? Math.round(scored.reduce((sum, d) => sum + (d.readinessScore ?? 0), 0) / scored.length)
      : null;
  }, [deals]);

  const filteredDeals = deals.filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) && (!starredOnly || d.starred)
  );

  const getDealsByStage = (stage: PipelineStage) =>
    filteredDeals.filter((d) => d.pipelineStage === stage);

  const visibleStages = showPassed
    ? PIPELINE_STAGES
    : PIPELINE_STAGES.filter((s) => s.key !== 'passed' as PipelineStage);

  if (!isLoading && !showDemoData && deals.length === 0) {
    return (
      <AppShell title="Investment Pipeline" description="Track deals through your investment process">
        <EmptyState
          illustration="rocket"
          title="No deals in pipeline"
          description="Start scouting startups to build your investment pipeline."
          askAiPrompt="My investment pipeline is empty. How should I scout startups on CoFounderBay and what to shortlist first?"
          action={<Button asChild><Link href="/investor/scouting"><Telescope className="mr-2 icon-sm" />Scout Startups</Link></Button>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Investment Pipeline"
      description="Track deals through your investment process"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPassed(!showPassed)}>
            {showPassed ? 'Hide Passed' : 'Show Passed'}
          </Button>
          <Button asChild size="sm">
            <Link href="/investor/scouting"><Plus className="mr-2 icon-sm" />Add Deal</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Deals', value: deals.length, icon: FolderKanban, color: 'text-primary-accessible' },
            { label: 'Pipeline Value', value: `$${(totalPipelineValue / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: 'text-status-success' },
            { label: 'Avg Readiness', value: avgReadiness == null ? '—' : `${avgReadiness}%`, icon: Target, color: 'text-status-info' },
            { label: 'Invested', value: deals.filter((d) => d.pipelineStage === 'invested').length, icon: TrendingUp, color: 'text-status-success' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('icon-sm', color)} /></div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-2xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* "Filters" had no handler. The one filter the board's data
              supports beyond search is the star an investor puts on a deal. */}
          <Button variant={starredOnly ? 'default' : 'outline'} aria-pressed={starredOnly} onClick={() => setStarredOnly((v) => !v)}>
            <Filter className="mr-2 icon-sm" aria-hidden="true" />
            Starred only
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.key);
            return (
              <div key={stage.key} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                  <h3 className="font-medium text-sm">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {stageDeals.length}
                  </Badge>
                </div>
                <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onMove={isLive ? (d, st) => void moveDeal(d, st) : undefined} />
                  ))}
                  {stageDeals.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No deals in this stage
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>


        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Zap className="icon-sm text-primary-accessible" /> Pipeline Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Seven stages do not fit one row on a phone: a 4-column grid
                there, the arrowed funnel from sm up. */}
            <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:flex sm:items-center sm:gap-2">
              {PIPELINE_STAGES.map((stage, i) => {
                const count = getDealsByStage(stage.key).length;
                const pct = deals.length > 0 ? Math.round((count / deals.length) * 100) : 0;
                return (
                  <div key={stage.key} className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="min-w-0 flex-1 text-center">
                      <p className="text-lg font-bold tabular-nums">{count}</p>
                      <p className="truncate text-2xs text-muted-foreground">{stage.label}</p>
                      <Progress value={pct} className="h-1 mt-1" />
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && <ArrowRight className="hidden icon-sm shrink-0 text-muted-foreground/40 sm:block" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
