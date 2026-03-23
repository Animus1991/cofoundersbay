'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PieChart,
  Users,
  Target,
  Briefcase,
  DollarSign,
  Rocket,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Zap,
  Shield,
  Star,
  Info,
  BrainCircuit,
  Download,
  History,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { assessReadiness, updateReadinessCriterion, type ReadinessOverall } from '@/lib/api';

// ── Static dimension metadata ─────────────────────────────────────────────────
const DIMENSION_META: Record<string, {
  icon: React.ElementType;
  label: string;
  description: string;
  acceleratorWeight: number;
  investorWeight: number;
}> = {
  team:      { icon: Users,     label: 'Team',            description: 'Founder & team strength, commitment, and complementarity',           acceleratorWeight: 25, investorWeight: 30 },
  market:    { icon: Target,    label: 'Market',          description: 'Market size, validation, and competitive positioning',                 acceleratorWeight: 20, investorWeight: 25 },
  product:   { icon: Rocket,    label: 'Product',         description: 'Solution clarity, MVP progress, and product-market fit signals',       acceleratorWeight: 20, investorWeight: 20 },
  business:  { icon: Briefcase, label: 'Business Model',  description: 'Revenue model, pricing, unit economics, and go-to-market clarity',    acceleratorWeight: 15, investorWeight: 15 },
  funding:   { icon: DollarSign, label: 'Funding Readiness', description: 'Pitch deck, financials, data room, and investor targeting readiness',       acceleratorWeight: 10, investorWeight: 5  },
  execution: { icon: PieChart,  label: 'Execution',       description: 'Goal-setting, milestone tracking, metrics, and execution discipline', acceleratorWeight: 10, investorWeight: 5  },
};

// Static fallback criteria when backend is unavailable
const FALLBACK_CRITERIA: Record<string, { id: string; name: string; completed: boolean; weight: number }[]> = {
  team:      [
    { id: 't1', name: 'Co-founder identified',           completed: true,  weight: 30 },
    { id: 't2', name: 'Complementary skills covered',    completed: true,  weight: 25 },
    { id: 't3', name: 'Full-time commitment secured',    completed: true,  weight: 20 },
    { id: 't4', name: 'Previous startup experience',     completed: false, weight: 15 },
    { id: 't5', name: 'Advisory board in place',         completed: false, weight: 10 },
  ],
  market:    [
    { id: 'm1', name: 'Target market defined',           completed: true,  weight: 25 },
    { id: 'm2', name: 'Market size validated (TAM/SAM)', completed: true,  weight: 25 },
    { id: 'm3', name: 'Competitive analysis completed',  completed: false, weight: 20 },
    { id: 'm4', name: 'Customer interviews (10+)',       completed: false, weight: 20 },
    { id: 'm5', name: 'Market timing analysis',          completed: false, weight: 10 },
  ],
  product:   [
    { id: 'p1', name: 'Problem validated with users',    completed: true,  weight: 25 },
    { id: 'p2', name: 'Solution clearly defined',        completed: true,  weight: 25 },
    { id: 'p3', name: 'MVP built and tested',            completed: true,  weight: 20 },
    { id: 'p4', name: 'User feedback collected',         completed: true,  weight: 15 },
    { id: 'p5', name: 'Product roadmap documented',      completed: false, weight: 15 },
  ],
  business:  [
    { id: 'b1', name: 'Revenue model defined',           completed: true,  weight: 30 },
    { id: 'b2', name: 'Pricing strategy validated',      completed: false, weight: 25 },
    { id: 'b3', name: 'Unit economics calculated',       completed: false, weight: 20 },
    { id: 'b4', name: 'Go-to-market strategy defined',   completed: true,  weight: 15 },
    { id: 'b5', name: 'Partnership strategy outlined',   completed: false, weight: 10 },
  ],
  funding:   [
    { id: 'f1', name: 'Pitch deck ready (10-12 slides)', completed: true,  weight: 25 },
    { id: 'f2', name: 'Financial projections (3 years)', completed: false, weight: 25 },
    { id: 'f3', name: 'Data room prepared',              completed: false, weight: 20 },
    { id: 'f4', name: 'Target investor list built',      completed: false, weight: 15 },
    { id: 'f5', name: 'Term sheet knowledge ready',      completed: true,  weight: 15 },
  ],
  execution: [
    { id: 'e1', name: 'OKRs / quarterly goals set',      completed: true,  weight: 25 },
    { id: 'e2', name: 'Key milestones defined',          completed: true,  weight: 25 },
    { id: 'e3', name: 'Core metrics tracked',            completed: true,  weight: 20 },
    { id: 'e4', name: 'Regular retrospectives held',     completed: false, weight: 15 },
    { id: 'e5', name: 'Documentation practices in place',completed: false, weight: 15 },
  ],
};

const FALLBACK_RECOMMENDATIONS: Record<string, string[]> = {
  team:      ['Add an advisor with proven domain expertise to strengthen your credibility.'],
  market:    ['Complete a competitive landscape analysis and conduct 10+ structured customer interviews.'],
  product:   ['Create a detailed product roadmap covering the next 6 months with clear milestones.'],
  business:  ['Validate your pricing with at least 5 potential customers and calculate unit economics.'],
  funding:   ['Build a 3-year financial model and prepare your data room before approaching investors.'],
  execution: ['Implement bi-weekly retrospectives and document your processes in a shared wiki.'],
};

const DEMO_HISTORY: { week: string; score: number; accel: number; invest: number }[] = [
  { week: 'W1', score: 38, accel: 32, invest: 28 },
  { week: 'W2', score: 42, accel: 36, invest: 31 },
  { week: 'W3', score: 45, accel: 40, invest: 35 },
  { week: 'W4', score: 51, accel: 46, invest: 42 },
  { week: 'W5', score: 55, accel: 50, invest: 46 },
  { week: 'W6', score: 60, accel: 55, invest: 50 },
  { week: 'W7', score: 65, accel: 58, invest: 52 },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type DimCriterion = { id: string; name: string; completed: boolean; weight: number };

type DimData = {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  score: number;
  maxScore: number;
  criteria: DimCriterion[];
  recommendations: string[];
  acceleratorWeight: number;
  investorWeight: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreToStatus(pct: number): 'excellent' | 'good' | 'needs-work' | 'critical' {
  if (pct >= 80) return 'excellent';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'needs-work';
  return 'critical';
}

const STATUS_COLORS = {
  excellent:   { bg: 'bg-green-500/10',  text: 'text-green-600',  border: 'border-green-500/20',  bar: 'bg-green-500'  },
  good:        { bg: 'bg-blue-500/10',   text: 'text-blue-600',   border: 'border-blue-500/20',   bar: 'bg-blue-500'   },
  'needs-work':{ bg: 'bg-amber-500/10',  text: 'text-amber-600',  border: 'border-amber-500/20',  bar: 'bg-amber-500'  },
  critical:    { bg: 'bg-red-500/10',    text: 'text-red-600',    border: 'border-red-500/20',    bar: 'bg-red-500'    },
};

function buildDimensions(apiData?: ReadinessOverall): DimData[] {
  return Object.entries(DIMENSION_META).map(([key, meta]) => {
    const apiDim = apiData?.dimensions.find((d) => d.dimension === key);
    const criteria = apiDim?.criteria ?? FALLBACK_CRITERIA[key] ?? [];
    const score   = apiDim?.score    ?? criteria.filter((c) => c.completed).reduce((s, c) => s + c.weight, 0);
    const maxScore = apiDim?.maxScore ?? 100;
    const recommendations = apiDim?.recommendations ?? FALLBACK_RECOMMENDATIONS[key] ?? [];
    return { key, ...meta, score, maxScore, criteria, recommendations };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const status = scoreToStatus(score);
  const colorMap = { excellent: '#22c55e', good: '#3b82f6', 'needs-work': '#f59e0b', critical: '#ef4444' };
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-muted/20" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={colorMap[status]} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
      />
    </svg>
  );
}

function DimensionCard({
  dim,
  workspaceId,
  onToggle,
  isMutating,
}: {
  dim: DimData;
  workspaceId: string | null;
  onToggle: (dimKey: string, cId: string, current: boolean) => void;
  isMutating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((dim.score / dim.maxScore) * 100);
  const status = scoreToStatus(pct);
  const colors = STATUS_COLORS[status];
  const done = dim.criteria.filter((c) => c.completed).length;
  const Icon = dim.icon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-lg p-2.5 flex-shrink-0', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm">{dim.label}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">{dim.description}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" className={cn('text-xs capitalize', colors.bg, colors.text, colors.border)}>
                {status.replace('-', ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Progress value={pct} className="flex-1 h-1.5" />
              <span className="text-sm font-semibold tabular-nums w-9 text-right">{pct}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{done}/{dim.criteria.length} criteria completed</p>

            <div className="mt-3 space-y-1.5">
              {(expanded ? dim.criteria : dim.criteria.slice(0, 3)).map((c) => (
                <button
                  key={c.id}
                  disabled={!workspaceId || isMutating}
                  onClick={() => workspaceId && onToggle(dim.key, c.id, c.completed)}
                  className={cn(
                    'w-full flex items-center gap-2 text-sm rounded-md px-1.5 py-1 transition-colors text-left',
                    workspaceId ? 'hover:bg-secondary/60 cursor-pointer' : 'cursor-default',
                  )}
                >
                  {c.completed
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />}
                  <span className={cn('truncate', c.completed && 'text-muted-foreground line-through')}>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{c.weight}%</span>
                </button>
              ))}
              {dim.criteria.length > 3 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-xs text-primary/70 hover:text-primary pl-6 transition-colors"
                >
                  {expanded ? 'Show less' : `+${dim.criteria.length - 3} more`}
                </button>
              )}
            </div>

            {dim.recommendations.length > 0 && status !== 'excellent' && (
              <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border/60">
                <p className="text-xs font-medium flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  Recommendation
                </p>
                <p className="text-xs text-muted-foreground">{dim.recommendations[0]}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessRadarChart({ dimensions }: { dimensions: DimData[] }) {
  const data = dimensions.map((d) => ({
    dimension: d.label,
    score: Math.round((d.score / d.maxScore) * 100),
    benchmark: 65,
  }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Readiness Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid className="stroke-border/40" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} tickCount={4} />
            <Radar name="Your Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
            <Radar name="Benchmark" dataKey="benchmark" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
            <RechartsTooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(val: number, name: string) => [`${val}%`, name]}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-primary/60" />Your Score</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-slate-400/40" />Benchmark (65%)</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreHistoryChart({ history }: { history: typeof DEMO_HISTORY }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Score Progression (7 weeks)
          </CardTitle>
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Download className="h-3.5 w-3.5" />Export
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <RechartsTooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(val: number, name: string) => [`${val}%`, name]}
            />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
            <Line type="monotone" dataKey="accel" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2.5 }} name="Accelerator" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="invest" stroke="#22c55e" strokeWidth={2} dot={{ r: 2.5 }} name="Investor" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-primary" />Overall</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-violet-500" />Accelerator</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-green-500" />Investor</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReadinessPage() {
  const { error: toastError } = useToast();
  const qc = useQueryClient();
  const [workspaceId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('cfb_default_workspace') : null,
  );

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['readiness', workspaceId],
    queryFn: () => workspaceId
      ? assessReadiness({ workspaceId })
      : Promise.resolve<{ assessment: ReadinessOverall }>({
          assessment: { overallScore: 65, overallMax: 100, dimensions: [], lastAssessedAt: null, acceleratorReadiness: 58, investorReadiness: 52 },
        }),
    staleTime: 5 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ dimKey, criterionId, completed }: { dimKey: string; criterionId: string; completed: boolean }) =>
      updateReadinessCriterion(workspaceId!, { dimension: dimKey, criterionId, completed: !completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readiness', workspaceId] }),
    onError: () => toastError('Failed to update criterion'),
  });

  const handleToggle = useCallback((dimKey: string, cId: string, current: boolean) => {
    toggleMutation.mutate({ dimKey, criterionId: cId, completed: current });
  }, [toggleMutation]);

  const apiData = data?.assessment;
  const dimensions = buildDimensions(apiData);

  const overallScore  = apiData?.overallScore  ?? Math.round(dimensions.reduce((s, d) => s + (d.score / d.maxScore) * 100, 0) / dimensions.length);
  const accelScore    = apiData?.acceleratorReadiness ?? Math.round(dimensions.reduce((s, d) => s + (d.score / d.maxScore) * d.acceleratorWeight, 0) / 100 * 100);
  const investScore   = apiData?.investorReadiness    ?? Math.round(dimensions.reduce((s, d) => s + (d.score / d.maxScore) * d.investorWeight, 0) / 100 * 100);
  const overallStatus = scoreToStatus(overallScore);
  const overallColors = STATUS_COLORS[overallStatus];
  const weakDims      = dimensions.filter((d) => scoreToStatus(Math.round((d.score / d.maxScore) * 100)) === 'critical' || scoreToStatus(Math.round((d.score / d.maxScore) * 100)) === 'needs-work');

  if (isLoading) {
    return <AppShell><div className="container max-w-5xl py-6"><ReadinessSkeleton /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Startup Readiness Score</h1>
            <p className="text-muted-foreground text-sm">
              Assess your startup&apos;s readiness across 6 key dimensions
              {apiData?.lastAssessedAt && (
                <span className="ml-2 text-muted-foreground/60">· Last assessed {new Date(apiData.lastAssessedAt).toLocaleDateString()}</span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            Reassess
          </Button>
        </div>

        {/* Overall Score + Readiness Benchmarks */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main score ring */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="relative">
                <ScoreRing score={overallScore} size={140} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold tabular-nums">{overallScore}</span>
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', overallColors.text)}>
                    {overallStatus.replace('-', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold">Overall Readiness</p>
                <p className="text-xs text-muted-foreground mt-0.5">Based on {dimensions.length} dimensions</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {weakDims.slice(0, 3).map((d) => (
                  <Badge key={d.key} variant="outline" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {d.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accelerator readiness */}
          <Card>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-violet-500/10">
                  <Building2 className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Accelerator Readiness</p>
                  <p className="text-xs text-muted-foreground">Program & cohort applications</p>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold tabular-nums">{accelScore}%</span>
                {accelScore >= 70
                  ? <span className="text-xs text-green-600 flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3" /> Ready to apply</span>
                  : accelScore >= 50
                  ? <span className="text-xs text-amber-600 flex items-center gap-1 mb-1"><Minus className="h-3 w-3" /> Almost ready</span>
                  : <span className="text-xs text-red-600 flex items-center gap-1 mb-1"><TrendingDown className="h-3 w-3" /> Not ready yet</span>
                }
              </div>
              <Progress value={accelScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Most accelerators expect 65–75%+ readiness. Focus on team, market, and product dimensions.
              </p>
              <Button size="sm" variant="outline" asChild className="mt-auto">
                <Link href="/programs"><Zap className="h-3.5 w-3.5 mr-1.5" />Browse Programs</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Investor readiness */}
          <Card>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Investor Readiness</p>
                  <p className="text-xs text-muted-foreground">Seed & pre-seed fundraising</p>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold tabular-nums">{investScore}%</span>
                {investScore >= 70
                  ? <span className="text-xs text-green-600 flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3" /> Fundable signal</span>
                  : investScore >= 50
                  ? <span className="text-xs text-amber-600 flex items-center gap-1 mb-1"><Minus className="h-3 w-3" /> Building traction</span>
                  : <span className="text-xs text-red-600 flex items-center gap-1 mb-1"><TrendingDown className="h-3 w-3" /> Pre-investment stage</span>
                }
              </div>
              <Progress value={investScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Investors weight team (30%) and market (25%) most heavily. Build strong validation first.
              </p>
              <Button size="sm" variant="outline" asChild className="mt-auto">
                <Link href="/investors"><Star className="h-3.5 w-3.5 mr-1.5" />Find Investors</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Radar + AI Insights row */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ReadinessRadarChart dimensions={dimensions} />
          </div>
          <div className="lg:col-span-2 space-y-3">
            {/* AI Insight Panel */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  AI Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {weakDims.slice(0, 3).map((d) => (
                  <div key={d.key} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/60">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{d.label} — {Math.round((d.score / d.maxScore) * 100)}%</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d.recommendations[0]}</p>
                    </div>
                  </div>
                ))}
                {weakDims.length === 0 && (
                  <div className="flex items-center gap-2 p-2.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">All dimensions look strong. Keep up the momentum!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Score delta card */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Score change (7 weeks)</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold tabular-nums">{overallScore}</span>
                  <span className="text-xs text-green-600 flex items-center gap-0.5 mb-1">
                    <TrendingUp className="h-3 w-3" />+{overallScore - DEMO_HISTORY[0].score} pts
                  </span>
                </div>
                <div className="flex gap-0.5 mt-2 h-6 items-end">
                  {DEMO_HISTORY.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/40 transition-all"
                      style={{ height: `${(h.score / 100) * 100}%`, opacity: 0.4 + (i / DEMO_HISTORY.length) * 0.6 }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs: Dimensions / Priority Actions / Benchmarks / History */}
        <Tabs defaultValue="dimensions">
          <TabsList>
            <TabsTrigger value="dimensions">All Dimensions</TabsTrigger>
            <TabsTrigger value="actions">Priority Actions</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="dimensions" className="mt-4">
            {!workspaceId && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">No workspace connected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create a workspace in the <Link href="/builder" className="underline hover:no-underline">Startup Builder</Link> to track and update your readiness criteria.
                  </p>
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {dimensions.map((dim) => (
                <DimensionCard
                  key={dim.key}
                  dim={dim}
                  workspaceId={workspaceId}
                  onToggle={handleToggle}
                  isMutating={toggleMutation.isPending}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Priority Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weakDims.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="font-medium">Excellent! All dimensions are strong.</p>
                    <p className="text-sm text-muted-foreground mt-1">Keep iterating and maintain your momentum.</p>
                  </div>
                ) : (
                  weakDims
                    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))
                    .flatMap((d) =>
                      d.recommendations.map((rec, i) => ({
                        key: `${d.key}-${i}`,
                        dimLabel: d.label,
                        pct: Math.round((d.score / d.maxScore) * 100),
                        status: scoreToStatus(Math.round((d.score / d.maxScore) * 100)),
                        rec,
                      }))
                    )
                    .slice(0, 8)
                    .map((item) => (
                      <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                        <div className={cn('rounded-full p-1.5 mt-0.5', STATUS_COLORS[item.status].bg)}>
                          <ChevronRight className={cn('h-3 w-3', STATUS_COLORS[item.status].text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{item.dimLabel}</p>
                            <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[item.status].bg, STATUS_COLORS[item.status].text, STATUS_COLORS[item.status].border)}>
                              {item.pct}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{item.rec}</p>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarks" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Accelerator benchmark */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-violet-600" />
                    Accelerator Benchmark
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dimensions.map((d) => {
                    const pct = Math.round((d.score / d.maxScore) * 100);
                    return (
                      <div key={d.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{d.label}</span>
                          <span className="font-medium tabular-nums">{pct}%</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted/50">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-violet-500/60" style={{ width: `${pct}%` }} />
                          <div className="absolute inset-y-0 rounded-full w-0.5 bg-violet-600" style={{ left: '65%' }} title="Target: 65%" />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1">
                    <span className="inline-block w-0.5 h-3 bg-violet-600 mr-1 align-middle" />
                    Vertical line = typical accelerator threshold (65%)
                  </p>
                </CardContent>
              </Card>

              {/* Investor benchmark */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    Investor Benchmark
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dimensions.map((d) => {
                    const pct = Math.round((d.score / d.maxScore) * 100);
                    return (
                      <div key={d.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{d.label}</span>
                          <span className="font-medium tabular-nums">{pct}%</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted/50">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                          <div className="absolute inset-y-0 rounded-full w-0.5 bg-emerald-600" style={{ left: '70%' }} title="Target: 70%" />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1">
                    <span className="inline-block w-0.5 h-3 bg-emerald-600 mr-1 align-middle" />
                    Vertical line = investor-ready threshold (70%)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weighted score breakdown */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Dimension Weights & Weighted Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {dimensions.map((d) => {
                    const pct = Math.round((d.score / d.maxScore) * 100);
                    const accelContrib = Math.round(pct * d.acceleratorWeight / 100);
                    const investContrib = Math.round(pct * d.investorWeight / 100);
                    return (
                      <div key={d.key} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40">
                        <d.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{d.label}</p>
                          <p className="text-xs text-muted-foreground">Score: {pct}%</p>
                        </div>
                        <div className="text-right text-xs space-y-0.5">
                          <p className="text-violet-600 font-medium">+{accelContrib} <span className="text-muted-foreground font-normal">accel</span></p>
                          <p className="text-emerald-600 font-medium">+{investContrib} <span className="text-muted-foreground font-normal">invest</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              <ScoreHistoryChart history={DEMO_HISTORY} />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Assessment Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DEMO_HISTORY.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                        {h.week}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{h.score}% overall</span>
                          {i < DEMO_HISTORY.length - 1 && (
                            <span className="text-xs text-green-600 flex items-center gap-0.5">
                              <TrendingUp className="h-3 w-3" />+{h.score - DEMO_HISTORY[DEMO_HISTORY.length - 2 - i].score}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Accel: {h.accel}% · Investor: {h.invest}%</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {scoreToStatus(h.score).replace('-', ' ')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild className="h-auto py-3 flex-col gap-1">
            <Link href="/builder">
              <Rocket className="h-4 w-4" />
              <span className="text-sm font-medium">Open Builder</span>
              <span className="text-xs opacity-70">Build your workspace</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
            <Link href="/mentoring">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">Find a Mentor</span>
              <span className="text-xs opacity-70">Get expert guidance</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
            <Link href="/programs">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Browse Programs</span>
              <span className="text-xs opacity-70">Accelerators & cohorts</span>
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
