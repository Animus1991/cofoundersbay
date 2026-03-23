'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  addedAt: string;
  lastActivity: string;
  starred: boolean;
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
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{deal.lastActivity}</p>
    </div>
  );
}

export default function InvestorPipelinePage() {
  const [search, setSearch] = useState('');

  // Mock data
  const deals: Deal[] = [
    { id: '1', name: 'NeuralFlow AI', industry: 'AI/ML', stage: 'Seed', pipelineStage: 'discovered', readinessScore: 85, addedAt: 'Mar 20', lastActivity: '2 hours ago', starred: true },
    { id: '2', name: 'GreenGrid', industry: 'CleanTech', stage: 'Pre-seed', pipelineStage: 'discovered', readinessScore: 72, addedAt: 'Mar 18', lastActivity: '1 day ago', starred: false },
    { id: '3', name: 'PayStream', industry: 'FinTech', stage: 'Seed', pipelineStage: 'reviewing', readinessScore: 91, addedAt: 'Mar 15', lastActivity: '3 hours ago', starred: true },
    { id: '4', name: 'HealthPulse', industry: 'HealthTech', stage: 'Pre-seed', pipelineStage: 'reviewing', readinessScore: 65, addedAt: 'Mar 12', lastActivity: '2 days ago', starred: false },
    { id: '5', name: 'DataVault', industry: 'Enterprise', stage: 'Seed', pipelineStage: 'meeting', readinessScore: 78, addedAt: 'Mar 10', lastActivity: 'Meeting tomorrow', starred: true },
    { id: '6', name: 'EduLearn', industry: 'EdTech', stage: 'Pre-seed', pipelineStage: 'due_diligence', readinessScore: 82, addedAt: 'Mar 5', lastActivity: '1 week ago', starred: false },
    { id: '7', name: 'CloudSecure', industry: 'Cybersecurity', stage: 'Seed', pipelineStage: 'negotiating', readinessScore: 88, addedAt: 'Feb 28', lastActivity: 'Term sheet sent', starred: true },
    { id: '8', name: 'FoodTech Pro', industry: 'FoodTech', stage: 'Seed', pipelineStage: 'invested', readinessScore: 95, addedAt: 'Feb 15', lastActivity: 'Closed Feb 20', starred: true },
  ];

  const filteredDeals = deals.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const getDealsByStage = (stage: PipelineStage) =>
    filteredDeals.filter((d) => d.pipelineStage === stage);

  return (
    <AppShell>
      <div className="container max-w-full py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Investment Pipeline</h1>
            <p className="text-muted-foreground">
              Track deals through your investment process
            </p>
          </div>
          <Button asChild>
            <Link href="/investor/scouting">
              <Plus className="mr-2 h-4 w-4" />
              Add Deal
            </Link>
          </Button>
        </div>

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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total in Pipeline</p>
              <p className="text-2xl font-bold">{deals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Starred</p>
              <p className="text-2xl font-bold text-amber-600">
                {deals.filter((d) => d.starred).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Due Diligence</p>
              <p className="text-2xl font-bold text-amber-600">
                {deals.filter((d) => d.pipelineStage === 'due_diligence').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Invested</p>
              <p className="text-2xl font-bold text-green-600">
                {deals.filter((d) => d.pipelineStage === 'invested').length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
