'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronRight,
  Star,
  Calendar,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Target,
  Eye,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
            {deal.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{deal.name}</span>
            {deal.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
          </div>
          <p className="text-xs text-muted-foreground">{deal.industry}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/startups/${deal.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Move to Next Stage</DropdownMenuItem>
            <DropdownMenuItem>Schedule Meeting</DropdownMenuItem>
            <DropdownMenuItem>Add Note</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Pass</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="secondary" className="text-[10px]">{deal.stage}</Badge>
        <span className="text-[10px] text-muted-foreground">{deal.readinessScore}% ready</span>
        {deal.askAmount && (
          <span className="text-[10px] font-medium text-emerald-600 ml-auto">${(deal.askAmount / 1000).toFixed(0)}K</span>
        )}
      </div>
      {deal.founderName && (
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <span>👤 {deal.founderName}</span>
          {deal.teamSize && <span>· {deal.teamSize} team</span>}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{deal.lastActivity}</p>
    </div>
  );
}

export default function InvestorPipelinePage() {
  const [search, setSearch] = useState('');

  // Mock data
  const deals: Deal[] = [
    { id: '1', name: 'NeuralFlow AI', industry: 'AI/ML', stage: 'Seed', pipelineStage: 'discovered', readinessScore: 85, askAmount: 500000, addedAt: 'Mar 20', lastActivity: '2 hours ago', starred: true, founderName: 'Alex Georgiou', teamSize: 3 },
    { id: '2', name: 'GreenGrid', industry: 'CleanTech', stage: 'Pre-seed', pipelineStage: 'discovered', readinessScore: 72, askAmount: 200000, addedAt: 'Mar 18', lastActivity: '1 day ago', starred: false, founderName: 'Maria Sotiropoulou', teamSize: 2 },
    { id: '3', name: 'PayStream', industry: 'FinTech', stage: 'Seed', pipelineStage: 'reviewing', readinessScore: 91, askAmount: 750000, addedAt: 'Mar 15', lastActivity: '3 hours ago', starred: true, founderName: 'Nikos Papas', teamSize: 4 },
    { id: '4', name: 'HealthPulse', industry: 'HealthTech', stage: 'Pre-seed', pipelineStage: 'reviewing', readinessScore: 65, askAmount: 300000, addedAt: 'Mar 12', lastActivity: '2 days ago', starred: false, founderName: 'Elena Kosta', teamSize: 2 },
    { id: '5', name: 'DataVault', industry: 'Enterprise', stage: 'Seed', pipelineStage: 'meeting', readinessScore: 78, askAmount: 600000, addedAt: 'Mar 10', lastActivity: 'Meeting tomorrow', starred: true, founderName: 'Dimitris Alexiou', teamSize: 5 },
    { id: '6', name: 'EduLearn', industry: 'EdTech', stage: 'Pre-seed', pipelineStage: 'due_diligence', readinessScore: 82, askAmount: 350000, addedAt: 'Mar 5', lastActivity: '1 week ago', starred: false, founderName: 'Sofia Mela', teamSize: 3 },
    { id: '7', name: 'CloudSecure', industry: 'Cybersecurity', stage: 'Seed', pipelineStage: 'negotiating', readinessScore: 88, askAmount: 1000000, addedAt: 'Feb 28', lastActivity: 'Term sheet sent', starred: true, founderName: 'Kostas Panou', teamSize: 6 },
    { id: '8', name: 'FoodTech Pro', industry: 'FoodTech', stage: 'Seed', pipelineStage: 'invested', readinessScore: 95, askAmount: 450000, addedAt: 'Feb 15', lastActivity: 'Closed Feb 20', starred: true, founderName: 'Ioanna Vlachou', teamSize: 4 },
  ];

  const totalPipelineValue = useMemo(() => deals.reduce((s, d) => s + (d.askAmount ?? 0), 0), []);
  const avgReadiness = useMemo(() => Math.round(deals.reduce((s, d) => s + d.readinessScore, 0) / deals.length), []);

  const filteredDeals = deals.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const getDealsByStage = (stage: PipelineStage) =>
    filteredDeals.filter((d) => d.pipelineStage === stage);

  return (
    <AppShell
      title="Investment Pipeline"
      description="Track deals through your investment process"
      actions={
        <Button asChild>
          <Link href="/investor/scouting">
            <Plus className="mr-2 h-4 w-4" /> Add Deal
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Deals', value: deals.length, icon: FolderKanban, color: 'text-primary' },
            { label: 'Pipeline Value', value: `$${(totalPipelineValue / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: 'text-emerald-600' },
            { label: 'Avg Readiness', value: `${avgReadiness}%`, icon: Target, color: 'text-blue-600' },
            { label: 'Invested', value: deals.filter((d) => d.pipelineStage === 'invested').length, icon: TrendingUp, color: 'text-green-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('h-4 w-4', color)} /></div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Pipeline Conversion</CardTitle>
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
                      <p className="text-[10px] text-muted-foreground">{stage.label}</p>
                      <Progress value={pct} className="h-1 mt-1" />
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
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
