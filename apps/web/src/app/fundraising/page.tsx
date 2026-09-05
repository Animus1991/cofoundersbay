'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  DollarSign, TrendingUp, Users, FileText, Target, CheckCircle2,
  Clock, Plus, ChevronRight, Zap, Lock, Unlock, BarChart3,
  Briefcase, Globe, Calendar, PieChart, ArrowUpRight, Circle,
  Building2, MessageCircle, Eye, AlertCircle, Download, Upload,
  Layers, BadgeCheck, Bookmark,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

// ── Types ─────────────────────────────────────────────────────────────────────

type RoundStatus = 'planning' | 'active' | 'closing' | 'closed';
type InvestorStatus = 'prospect' | 'contacted' | 'meeting' | 'dd' | 'committed' | 'passed';
type DocStatus = 'draft' | 'ready' | 'shared';

type Round = {
  id: string;
  name: string;
  type: string;
  target: number;
  raised: number;
  status: RoundStatus;
  closingDate?: string;
  valuation?: number;
  leadInvestor?: string;
  investors: number;
};

type InvestorLead = {
  id: string;
  name: string;
  firm?: string;
  type: string;
  stage: string;
  checkSize: string;
  status: InvestorStatus;
  lastContact?: string;
  notes?: string;
  isVerified: boolean;
};

type DataRoomDoc = {
  id: string;
  name: string;
  category: string;
  status: DocStatus;
  isRequired: boolean;
  lastUpdated?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const ROUND_STATUS_TONE: Record<RoundStatus, StatusTone> = {
  planning: 'neutral',
  active: 'success',
  closing: 'warning',
  closed: 'info',
};

const INVESTOR_STATUS_STYLE: Record<InvestorStatus, { tone: StatusTone; label: string }> = {
  prospect:  { tone: 'neutral', label: 'Prospect' },
  contacted: { tone: 'info', label: 'Contacted' },
  meeting:   { tone: 'accent', label: 'Meeting' },
  dd:        { tone: 'warning', label: 'Due Diligence' },
  committed: { tone: 'success', label: 'Committed' },
  passed:    { tone: 'danger', label: 'Passed' },
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_ROUND: Round = {
  id: 'r1',
  name: 'Seed Round',
  type: 'SAFE',
  target: 750_000,
  raised: 375_000,
  status: 'active',
  closingDate: '2024-06-30',
  valuation: 3_000_000,
  leadInvestor: 'Athens Tech Angels',
  investors: 4,
};

const MOCK_LEADS: InvestorLead[] = [
  { id: 'l1', name: 'Sarah Chen', firm: 'Chen Ventures', type: 'Angel', stage: 'Pre-Seed / Seed', checkSize: '$25K–$150K', status: 'meeting', lastContact: '2d ago', isVerified: true, notes: 'Interested in AI angle. Follow up after demo.' },
  { id: 'l2', name: 'Michael Torres', firm: 'Horizon Capital', type: 'VC', stage: 'Seed / A', checkSize: '$500K–$3M', status: 'contacted', lastContact: '1w ago', isVerified: true, notes: 'Warm intro via Nikos. Waiting for deck review.' },
  { id: 'l3', name: 'Athens Tech Angels', firm: 'Syndicate', type: 'Syndicate', stage: 'Pre-Seed / Seed', checkSize: '€50K–€200K', status: 'committed', lastContact: '3d ago', isVerified: true, notes: 'Lead investor — committed €200K.' },
  { id: 'l4', name: 'Emma Williams', firm: undefined, type: 'Angel', stage: 'Pre-Seed / Seed', checkSize: '$10K–$75K', status: 'prospect', lastContact: undefined, isVerified: true, notes: undefined },
  { id: 'l5', name: 'Sequoia Scout', firm: 'Sequoia Capital', type: 'Scout', stage: 'Pre-Seed', checkSize: '$100K–$500K', status: 'dd', lastContact: '5d ago', isVerified: true, notes: 'Requested financials and cap table.' },
  { id: 'l6', name: 'Klaus Weber', firm: 'Weber Family Office', type: 'Family Office', stage: 'Seed / A', checkSize: '$1M–$5M', status: 'passed', lastContact: '2w ago', isVerified: false, notes: 'Too early for their ticket size.' },
];

const DATA_ROOM_DOCS: DataRoomDoc[] = [
  { id: 'd1', name: 'Pitch Deck', category: 'Pitch', status: 'ready', isRequired: true, lastUpdated: '3d ago' },
  { id: 'd2', name: 'Executive Summary', category: 'Pitch', status: 'ready', isRequired: true, lastUpdated: '1w ago' },
  { id: 'd3', name: '3-Year Financial Model', category: 'Financials', status: 'draft', isRequired: true, lastUpdated: '5d ago' },
  { id: 'd4', name: 'Cap Table', category: 'Legal', status: 'ready', isRequired: true, lastUpdated: '2w ago' },
  { id: 'd5', name: 'SAFE / Term Sheet Template', category: 'Legal', status: 'draft', isRequired: true, lastUpdated: undefined },
  { id: 'd6', name: 'Product Demo Video', category: 'Product', status: 'ready', isRequired: false, lastUpdated: '1d ago' },
  { id: 'd7', name: 'Market Research Report', category: 'Market', status: 'shared', isRequired: false, lastUpdated: '2w ago' },
  { id: 'd8', name: 'Team Bios & LinkedIn', category: 'Team', status: 'ready', isRequired: false, lastUpdated: '3w ago' },
  { id: 'd9', name: 'IP & Patents (if any)', category: 'Legal', status: 'draft', isRequired: false, lastUpdated: undefined },
  { id: 'd10', name: 'Customer Contracts / LOIs', category: 'Traction', status: 'draft', isRequired: false, lastUpdated: undefined },
];

// ── Round Progress Card ────────────────────────────────────────────────────────

function RoundCard({ round }: { round: Round }) {
  const pct = Math.round((round.raised / round.target) * 100);
  const remaining = round.target - round.raised;
  const daysLeft = round.closingDate
    ? Math.max(0, Math.ceil((new Date(round.closingDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{round.name}</h2>
              <Badge variant="outline" className={cn('border', STATUS[ROUND_STATUS_TONE[round.status]].chip)}>
                {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {round.type} · {round.valuation ? `${fmt(round.valuation)} pre-money valuation` : 'Valuation TBD'}
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0">
            <Plus className="icon-sm mr-1.5" />Add Investor
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-sm font-medium">
            <span>{fmt(round.raised)} raised</span>
            <span className="text-muted-foreground">{fmt(round.target)} target</span>
          </div>
          <Progress value={pct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% of target</span>
            <span>{fmt(remaining)} remaining</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Investors', value: round.investors.toString() },
            { icon: Target, label: 'Committed', value: fmt(round.raised) },
            { icon: Calendar, label: 'Closing', value: daysLeft !== null ? `${daysLeft}d left` : 'TBD' },
            { icon: BadgeCheck, label: 'Lead Investor', value: round.leadInvestor ?? 'None yet' },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-background/60 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-sm font-semibold truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Investor Pipeline ──────────────────────────────────────────────────────────

const PIPELINE_STAGES: InvestorStatus[] = ['prospect', 'contacted', 'meeting', 'dd', 'committed', 'passed'];

function PipelineView({ leads }: { leads: InvestorLead[] }) {
  const byStage = PIPELINE_STAGES.reduce<Record<InvestorStatus, InvestorLead[]>>((acc, s) => {
    acc[s] = leads.filter(l => l.status === s);
    return acc;
  }, {} as Record<InvestorStatus, InvestorLead[]>);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {PIPELINE_STAGES.map(stage => {
          const cfg = INVESTOR_STATUS_STYLE[stage];
          const stageColors = STATUS[cfg.tone];
          const items = byStage[stage];
          return (
            <div key={stage} className="w-56 shrink-0">
              <div className={cn('rounded-lg px-2.5 py-1.5 mb-2 flex items-center justify-between border', stageColors.chip)}>
                <span className="text-xs font-semibold">{cfg.label}</span>
                <Badge variant="secondary" size="sm" className="px-1.5">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map(lead => (
                  <Card key={lead.id} className="cursor-pointer hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-7 w-7 rounded-lg shrink-0">
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                            {lead.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{lead.name}</p>
                          {lead.firm && <p className="text-xs text-muted-foreground truncate">{lead.firm}</p>}
                        </div>
                        {lead.isVerified && <BadgeCheck className={cn('icon-sm shrink-0 ml-auto', STATUS.info.icon)} />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="icon-sm" />{lead.checkSize}
                      </div>
                      {lead.lastContact && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="icon-sm" />Last contact: {lead.lastContact}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground border border-dashed border-border/60">
                  <Plus className="icon-sm mr-1" />Add
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Data Room ─────────────────────────────────────────────────────────────────

const DOC_STATUS_STYLE: Record<DocStatus, { tone: StatusTone; icon: React.ElementType; label: string }> = {
  draft:  { tone: 'warning', icon: AlertCircle, label: 'Draft' },
  ready:  { tone: 'success', icon: CheckCircle2, label: 'Ready' },
  shared: { tone: 'info', icon: Globe, label: 'Shared' },
};

const DOC_CATEGORIES = ['All', 'Pitch', 'Financials', 'Legal', 'Product', 'Market', 'Team', 'Traction'];

function DataRoomView({ docs }: { docs: DataRoomDoc[] }) {
  const [catFilter, setCatFilter] = useState('All');
  const filtered = catFilter === 'All' ? docs : docs.filter(d => d.category === catFilter);
  const ready = docs.filter(d => d.status === 'ready' || d.status === 'shared').length;
  const required = docs.filter(d => d.isRequired);
  const requiredReady = required.filter(d => d.status === 'ready' || d.status === 'shared').length;

  return (
    <div className="space-y-4">
      {/* Data room health */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Data Room Health</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {requiredReady}/{required.length} required docs ready · {ready}/{docs.length} total docs ready
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{Math.round((ready / docs.length) * 100)}%</p>
                <p className="text-xs text-muted-foreground">complete</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />Share Room
              </Button>
            </div>
          </div>
          <Progress value={(ready / docs.length) * 100} className="h-2 mt-3" />
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {DOC_CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              catFilter === c ? 'border-primary bg-primary/15 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div className="space-y-2">
        {filtered.map(doc => {
          const cfg = DOC_STATUS_STYLE[doc.status];
          const StatusIcon = cfg.icon;
          return (
            <Card key={doc.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="icon-sm text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    {doc.isRequired && <Badge variant="secondary" size="sm" className={STATUS.danger.chip}>Required</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{doc.category}</span>
                    {doc.lastUpdated && <span>· Updated {doc.lastUpdated}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={cn('flex items-center gap-1 text-xs font-medium', STATUS[cfg.tone].text)}>
                    <StatusIcon className="h-3.5 w-3.5" />{cfg.label}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Upload className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Investor List Table ────────────────────────────────────────────────────────

function InvestorListView({ leads }: { leads: InvestorLead[] }) {
  return (
    <div className="space-y-2">
      {leads.map(lead => {
        const cfg = INVESTOR_STATUS_STYLE[lead.status];
        const leadColors = STATUS[cfg.tone];
        return (
          <Card key={lead.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-10 w-10 rounded-xl shrink-0">
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{lead.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm">{lead.name}</p>
                  {lead.isVerified && <BadgeCheck className={cn('h-3.5 w-3.5', STATUS.info.icon)} />}
                </div>
                <p className="text-xs text-muted-foreground">{lead.firm ? `${lead.firm} · ` : ''}{lead.type} · {lead.checkSize}</p>
                {lead.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.notes}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {lead.lastContact && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    <Clock className="icon-sm inline mr-1" />{lead.lastContact}
                  </p>
                )}
                <Badge variant="outline" className={cn('text-xs border', leadColors.chip)}>
                  {cfg.label}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MessageCircle className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FundraisingPage() {
  const { showDemoData } = useDemoData();
  const round = showDemoData ? MOCK_ROUND : null;
  const leads = showDemoData ? MOCK_LEADS : [];
  const dataRoomDocs = showDemoData ? DATA_ROOM_DOCS : [];
  const pipelineByStage = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => ['contacted', 'meeting', 'dd'].includes(l.status)).length;
  const committed = leads.filter(l => l.status === 'committed').length;

  return (
    <AppShell title="Fundraising" description="Track your round, manage investor pipeline, and organize your data room" showHelp>
      <div className="space-y-6">
        {/* Active Round */}
        {round && <RoundCard round={round} />}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, labelEn: 'Total Leads', labelEl: 'Συνολικές επαφές', value: totalLeads, tone: 'accent' as const },
            { icon: Zap, labelEn: 'Active Conversations', labelEl: 'Ενεργές συζητήσεις', value: activeLeads, tone: 'warning' as const },
            { icon: CheckCircle2, labelEn: 'Committed', labelEl: 'Δεσμευμένοι', value: committed, tone: 'success' as const },
            { icon: BarChart3, labelEn: 'Conversion Rate', labelEl: 'Ποσοστό μετατροπής', value: totalLeads ? `${Math.round((committed / totalLeads) * 100)}%` : '—', tone: 'info' as const },
          ].map(s => (
            <Card key={s.labelEn}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary shrink-0">
                  <s.icon className={cn('icon-sm', STATUS[s.tone].icon)} />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground"><BilingualText en={s.labelEn} el={s.labelEl} compact /></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pipeline">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="pipeline">
                <BilingualText en="Pipeline" el="Αγωγός" compact />
                <Badge variant="secondary" size="sm" className="ml-1.5 px-1.5">{totalLeads}</Badge>
              </TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="dataroom">
                <BilingualText en="Data Room" el="Δωμάτιο δεδομένων" compact />
                <Badge variant="secondary" size="sm" className="ml-1.5 px-1.5">{DATA_ROOM_DOCS.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                <Link href="/investors">
                  <Users className="h-3.5 w-3.5" /><BilingualText en="Find Investors" el="Εύρεση επενδυτών" compact />
                </Link>
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /><BilingualText en="Add Lead" el="Προσθήκη επαφής" compact />
              </Button>
            </div>
          </div>

          <TabsContent value="pipeline" className="mt-4">
            <InvestorListView leads={leads} />
          </TabsContent>

          <TabsContent value="kanban" className="mt-4">
            <PipelineView leads={leads} />
          </TabsContent>

          <TabsContent value="dataroom" className="mt-4">
            <DataRoomView docs={dataRoomDocs} />
          </TabsContent>
        </Tabs>

        {/* Resources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold"><BilingualText en="Fundraising Resources" el="Πόροι χρηματοδότησης" /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { title: 'Seed Fundraising Playbook', href: '/learning', desc: 'Complete guide from pitch to close' },
              { title: 'Find Investors', href: '/investors', desc: 'Browse 200+ active investors on CoFounderBay' },
              { title: 'Readiness Score', href: '/readiness', desc: 'Check how investor-ready your startup is' },
              { title: 'Pitch Deck Builder', href: '/builder/pitch-deck', desc: 'AI-powered deck creation and review' },
            ].map(r => (
              <Link key={r.href} href={r.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <ChevronRight className="icon-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
