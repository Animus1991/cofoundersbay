'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban, Search, Filter, Plus, MoreVertical,
  Star, DollarSign, TrendingUp, Target, ArrowRight, Zap,
  MessageSquare, Calendar, Users, Telescope,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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
  readinessScore: number;
  askAmount?: number; // in USD
  addedAt: string;
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

function DealCard({ deal }: { deal: Deal }) {
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
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="icon-sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/startups/${deal.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Move to Next Stage</DropdownMenuItem>
            <DropdownMenuItem>Schedule Meeting</DropdownMenuItem>
            <DropdownMenuItem>Add Note</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive-accessible">Pass</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="secondary" className="text-2xs">{deal.stage}</Badge>
        <span className="text-2xs text-muted-foreground">{deal.readinessScore}% ready</span>
        {deal.askAmount && (
          <span className="text-2xs font-medium text-status-success ml-auto">${(deal.askAmount / 1000).toFixed(0)}K</span>
        )}
      </div>
      {deal.founderName && (
        <p className="text-2xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <span>👤 {deal.founderName}</span>
          {deal.teamSize && <span>· {deal.teamSize} team</span>}
        </p>
      )}
      <p className="text-2xs text-muted-foreground mt-1">{deal.lastActivity}</p>
    </div>
  );
}

const MOCK_DEALS: Deal[] = [
    { id: '1', name: 'NeuralFlow AI', industry: 'AI/ML', stage: 'Seed', pipelineStage: 'discovered', readinessScore: 85, askAmount: 500000, addedAt: 'Mar 20', lastActivity: '2 hours ago', starred: true, founderName: 'Alex Georgiou', teamSize: 3 },
    { id: '2', name: 'GreenGrid', industry: 'CleanTech', stage: 'Pre-seed', pipelineStage: 'discovered', readinessScore: 72, askAmount: 200000, addedAt: 'Mar 18', lastActivity: '1 day ago', starred: false, founderName: 'Maria Sotiropoulou', teamSize: 2 },
    { id: '3', name: 'PayStream', industry: 'FinTech', stage: 'Seed', pipelineStage: 'reviewing', readinessScore: 91, askAmount: 750000, addedAt: 'Mar 15', lastActivity: '3 hours ago', starred: true, founderName: 'Nikos Papas', teamSize: 4 },
    { id: '4', name: 'HealthPulse', industry: 'HealthTech', stage: 'Pre-seed', pipelineStage: 'reviewing', readinessScore: 65, askAmount: 300000, addedAt: 'Mar 12', lastActivity: '2 days ago', starred: false, founderName: 'Elena Kosta', teamSize: 2 },
    { id: '5', name: 'DataVault', industry: 'Enterprise', stage: 'Seed', pipelineStage: 'meeting', readinessScore: 78, askAmount: 600000, addedAt: 'Mar 10', lastActivity: 'Meeting tomorrow', starred: true, founderName: 'Dimitris Alexiou', teamSize: 5 },
    { id: '6', name: 'EduLearn', industry: 'EdTech', stage: 'Pre-seed', pipelineStage: 'due_diligence', readinessScore: 82, askAmount: 350000, addedAt: 'Mar 5', lastActivity: '1 week ago', starred: false, founderName: 'Sofia Mela', teamSize: 3 },
    { id: '7', name: 'CloudSecure', industry: 'Cybersecurity', stage: 'Seed', pipelineStage: 'negotiating', readinessScore: 88, askAmount: 1000000, addedAt: 'Feb 28', lastActivity: 'Term sheet sent', starred: true, founderName: 'Kostas Panou', teamSize: 6 },
    { id: '8', name: 'FoodTech Pro', industry: 'FoodTech', stage: 'Seed', pipelineStage: 'invested', readinessScore: 95, askAmount: 450000, addedAt: 'Feb 15', lastActivity: 'Closed Feb 20', starred: true, founderName: 'Ioanna Vlachou', teamSize: 4 },
  ];

export default function InvestorPipelinePage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [showPassed, setShowPassed] = useState(false);

  const deals = showDemoData ? MOCK_DEALS : [];

  const totalPipelineValue = useMemo(() => deals.reduce((s, d) => s + (d.askAmount ?? 0), 0), [deals]);
  const avgReadiness = useMemo(() => deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.readinessScore, 0) / deals.length) : 0, [deals]);

  const filteredDeals = deals.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const getDealsByStage = (stage: PipelineStage) =>
    filteredDeals.filter((d) => d.pipelineStage === stage);

  const visibleStages = showPassed
    ? PIPELINE_STAGES
    : PIPELINE_STAGES.filter((s) => s.key !== 'passed' as PipelineStage);

  if (!showDemoData && deals.length === 0) {
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
        <div className="flex gap-2">
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
            { label: 'Avg Readiness', value: `${avgReadiness}%`, icon: Target, color: 'text-status-info' },
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
          <Button variant="outline">
            <Filter className="mr-2 icon-sm" />
            Filters
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
                    <DealCard key={deal.id} deal={deal} />
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
            <div className="flex items-center gap-2">
              {PIPELINE_STAGES.map((stage, i) => {
                const count = getDealsByStage(stage.key).length;
                const pct = deals.length > 0 ? Math.round((count / deals.length) * 100) : 0;
                return (
                  <div key={stage.key} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold tabular-nums">{count}</p>
                      <p className="text-2xs text-muted-foreground">{stage.label}</p>
                      <Progress value={pct} className="h-1 mt-1" />
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && <ArrowRight className="icon-sm text-muted-foreground/40 shrink-0" />}
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
