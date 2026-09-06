'use client';

import { useState, useCallback, useEffect } from 'react';
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
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { readinessEn, readinessEl } from '@/lib/i18n/strings-readiness';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { STATUS, TREND, type StatusChipClasses, type StatusTone } from '@/lib/semantic-colors';
import { assessReadiness, updateReadinessCriterion, type ReadinessOverall } from '@/lib/api';
import { isPreviewDemo } from '@/lib/preview-demo';

const RadarFallback = () => <Skeleton className="h-[280px] w-full rounded-lg" />;
const LineFallback = () => <Skeleton className="h-[200px] w-full rounded-lg" />;
const ReadinessRadarChartInner = dynamic(
  () => import('./ReadinessCharts').then((m) => ({ default: m.ReadinessRadarChartInner })),
  { ssr: false, loading: RadarFallback },
);
const ScoreHistoryChartInner = dynamic(
  () => import('./ReadinessCharts').then((m) => ({ default: m.ScoreHistoryChartInner })),
  { ssr: false, loading: LineFallback },
);

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
const DEMO_CRITERIA: Record<string, { id: string; name: string; completed: boolean; weight: number }[]> = {
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

const DEMO_RECOMMENDATIONS: Record<string, string[]> = {
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
type ScoreLevel = 'excellent' | 'good' | 'needs-work' | 'critical';

function scoreToStatus(pct: number): ScoreLevel {
  if (pct >= 80) return 'excellent';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'needs-work';
  return 'critical';
}

const SCORE_TONE: Record<ScoreLevel, StatusTone> = {
  excellent: 'success',
  good: 'info',
  'needs-work': 'warning',
  critical: 'danger',
};

function scoreColors(level: ScoreLevel): StatusChipClasses {
  return STATUS[SCORE_TONE[level]];
}

const SCORE_STROKE: Record<ScoreLevel, string> = {
  excellent: 'hsl(var(--status-success-fg))',
  good: 'hsl(var(--status-info-fg))',
  'needs-work': 'hsl(var(--status-warning-fg))',
  critical: 'hsl(var(--status-danger-fg))',
};

function readinessSignalText(pct: number): string {
  if (pct >= 70) return STATUS.success.text;
  if (pct >= 50) return STATUS.warning.text;
  return STATUS.danger.text;
}

type AssessmentData = Omit<ReadinessOverall, 'dimensions'> & {
  dimensions: Pick<ReadinessOverall['dimensions'][number], 'dimension' | 'score' | 'maxScore' | 'criteria' | 'recommendations'>[];
};

function buildDimensions(apiData: AssessmentData): DimData[] {
  return apiData.dimensions.map(({ dimension, score, maxScore, criteria, recommendations }) => ({
    key: dimension, ...DIMENSION_META[dimension], score, maxScore, criteria, recommendations,
  }));
}

function isAssessmentData(value: unknown): value is AssessmentData {
  if (!value || typeof value !== 'object') return false;
  const assessment = value as AssessmentData;
  const validScore = (score: unknown, max: number) => typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= max;
  return typeof assessment.overallMax === 'number' && Number.isFinite(assessment.overallMax) && assessment.overallMax > 0
    && validScore(assessment.overallScore, assessment.overallMax)
    && validScore(assessment.acceleratorReadiness, 100) && validScore(assessment.investorReadiness, 100)
    && (assessment.lastAssessedAt === null || (typeof assessment.lastAssessedAt === 'string' && Number.isFinite(Date.parse(assessment.lastAssessedAt))))
    && Array.isArray(assessment.dimensions) && assessment.dimensions.length > 0
    && assessment.dimensions.every((d) => d && Object.prototype.hasOwnProperty.call(DIMENSION_META, d.dimension)
      && typeof d.maxScore === 'number' && Number.isFinite(d.maxScore) && d.maxScore > 0 && validScore(d.score, d.maxScore)
      && Array.isArray(d.criteria) && d.criteria.every((c) => c && typeof c.id === 'string' && typeof c.name === 'string'
        && typeof c.completed === 'boolean' && validScore(c.weight, 100))
      && Array.isArray(d.recommendations) && d.recommendations.every((r) => typeof r === 'string'))
    && new Set(assessment.dimensions.map((d) => d.dimension)).size === assessment.dimensions.length;
}

function buildDemoAssessment(): AssessmentData {
  const dimensions = Object.entries(DEMO_CRITERIA).map(([dimension, criteria]) => ({
    dimension, criteria, maxScore: 100,
    score: criteria.reduce((sum, criterion) => sum + (criterion.completed ? criterion.weight : 0), 0),
    recommendations: DEMO_RECOMMENDATIONS[dimension],
  }));
  const weightedScore = (audience: 'acceleratorWeight' | 'investorWeight') => Math.round(
    dimensions.reduce((sum, d) => sum + (d.score / d.maxScore) * DIMENSION_META[d.dimension][audience], 0),
  );
  return {
    dimensions, overallScore: Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length),
    overallMax: 100, lastAssessedAt: null,
    acceleratorReadiness: weightedScore('acceleratorWeight'), investorReadiness: weightedScore('investorWeight'),
  };
}

const DEMO_ASSESSMENT = buildDemoAssessment();
DEMO_HISTORY[DEMO_HISTORY.length - 1] = {
  week: 'W7', score: DEMO_ASSESSMENT.overallScore,
  accel: DEMO_ASSESSMENT.acceleratorReadiness, invest: DEMO_ASSESSMENT.investorReadiness,
};

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const status = scoreToStatus(score);
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-muted/20" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={SCORE_STROKE[status]} strokeWidth={8} strokeLinecap="round"
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
  const colors = scoreColors(status);
  const done = dim.criteria.filter((c) => c.completed).length;
  const Icon = dim.icon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-lg p-2.5 flex-shrink-0', colors.bg)}>
            <Icon className={cn('icon-md', colors.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm">{dim.label}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="icon-sm text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">{dim.description}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" className={cn('text-xs capitalize border', colors.chip)}>
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
                    ? <CheckCircle2 className={cn('icon-sm flex-shrink-0', STATUS.success.icon)} />
                    : <AlertCircle className="icon-sm text-muted-foreground/50 flex-shrink-0" />}
                  <span className={cn('truncate', c.completed && 'text-muted-foreground line-through')}>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{c.weight}%</span>
                </button>
              ))}
              {dim.criteria.length > 3 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-xs text-primary/70 hover:text-primary-accessible pl-6 transition-colors"
                >
                  {expanded ? <BilingualText en="Show less" el="Λιγότερα" compact /> : `+${dim.criteria.length - 3}`}
                </button>
              )}
            </div>

            {dim.recommendations.length > 0 && status !== 'excellent' && (
              <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border/60">
                <p className="text-xs font-medium flex items-center gap-1.5 mb-1">
                  <Lightbulb className={cn('icon-sm', STATUS.warning.icon)} />
                  <BilingualText en="Recommendation" el="Σύσταση" compact />
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
          <Target className="icon-sm text-primary-accessible" />
          <BilingualText en={readinessEn('readiness_radar')} el={readinessEl('readiness_radar')} compact />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReadinessRadarChartInner data={data} />
        <div className="flex items-center justify-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-primary/60" /><BilingualText en={readinessEn('your_score')} el={readinessEl('your_score')} compact /></span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-slate-400/40" /><BilingualText en={readinessEn('benchmark')} el={readinessEl('benchmark')} compact /></span>
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
            <History className="icon-sm text-primary-accessible" />
            <BilingualText en={readinessEn('score_progression')} el={readinessEl('score_progression')} compact />
          </CardTitle>
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Download className="icon-sm" /><BilingualText en={readinessEn('export')} el={readinessEl('export')} compact />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScoreHistoryChartInner history={history} />
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-primary" /><BilingualText en={readinessEn('overall')} el={readinessEl('overall')} compact /></span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-status-accent" /><BilingualText en={readinessEn('accelerator')} el={readinessEl('accelerator')} compact /></span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-status-success" /><BilingualText en={readinessEn('investor')} el={readinessEl('investor')} compact /></span>
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
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'demo' | null>(null);
  const isDemo = mode === 'demo';

  useEffect(() => {
    try {
      setWorkspaceId(localStorage.getItem('cfb_default_workspace')?.trim() || null);
    } catch {
      setWorkspaceId(null);
    }
    setMode(isPreviewDemo() ? 'demo' : 'live');
  }, []);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['readiness', workspaceId, 'canonical'],
    enabled: mode === 'live' && !!workspaceId,
    queryFn: async () => {
      if (!workspaceId || isDemo) throw new Error('A live workspace is required');
      const response = await assessReadiness({ workspaceId });
      if (!isAssessmentData(response?.assessment)) throw new Error('Readiness assessment is unavailable');
      return response.assessment;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ dimKey, criterionId, completed }: { dimKey: string; criterionId: string; completed: boolean }) => {
      if (!workspaceId || mode !== 'live' || !data || isError) throw new Error('A live assessment is required');
      return updateReadinessCriterion(workspaceId, { dimension: dimKey, criterionId, completed: !completed });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readiness', workspaceId] }),
    onError: () => toastError('Failed to update criterion'),
  });

  const handleToggle = useCallback((dimKey: string, cId: string, current: boolean) => {
    if (!workspaceId || mode !== 'live' || !data || isError || toggleMutation.isPending) return;
    toggleMutation.mutate({ dimKey, criterionId: cId, completed: current });
  }, [workspaceId, mode, data, isError, toggleMutation]);

  const apiData = isDemo ? DEMO_ASSESSMENT : data;

  const reassessAction = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={!mode || toggleMutation.isPending} onClick={() => setMode(isDemo ? 'live' : 'demo')}>
        <BilingualText en={isDemo ? 'View live readiness' : 'View demo showcase'} el={isDemo ? 'Πραγματική ετοιμότητα' : 'Προβολή επίδειξης'} compact />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { if (workspaceId && mode === 'live') void refetch(); }}
        disabled={!workspaceId || mode !== 'live' || isLoading || isRefetching || toggleMutation.isPending}
      >
        {isRefetching ? <Loader2 className="icon-sm animate-spin mr-1.5" /> : <RefreshCw className="icon-sm mr-1.5" />}
        <BilingualText en={readinessEn('reassess')} el={readinessEl('reassess')} compact />
      </Button>
    </div>
  );

  const readinessDescription = apiData?.lastAssessedAt
    ? `Last saved assessment ${new Date(apiData.lastAssessedAt).toLocaleDateString()} · Reassess reloads saved scores.`
    : 'Assess your startup\u2019s readiness across 6 key dimensions and see what to fix next.';

  if (!mode || (!isDemo && isLoading)) {
    return (
      <AppShell
        title={readinessEn('page_title')}
        description={readinessEn('page_description')}
        actions={reassessAction}
        showHelp
      >
        <div className="py-6"><ReadinessSkeleton /></div>
      </AppShell>
    );
  }

  if (!isDemo && !workspaceId) {
    return (
      <AppShell title={readinessEn('page_title')} description={readinessDescription} actions={reassessAction} showHelp>
        <Card><CardContent className="space-y-4 p-6">
          <p><BilingualText en="Create or select a workspace to assess readiness." el="Δημιουργήστε ή επιλέξτε χώρο εργασίας για να αξιολογήσετε την ετοιμότητα." /></p>
          <Button asChild><Link href="/builder"><BilingualText en="Open Startup Builder" el="Άνοιγμα Startup Builder" /></Link></Button>
        </CardContent></Card>
      </AppShell>
    );
  }

  if (isError && !isDemo || !apiData) {
    return (
      <AppShell title={readinessEn('page_title')} description={readinessDescription} actions={reassessAction} showHelp>
        <Card><CardContent className="space-y-4 p-6">
          <p role="alert"><BilingualText en="Readiness is unavailable. Your saved data has not been replaced with sample scores." el="Η ετοιμότητα δεν είναι διαθέσιμη. Τα αποθηκευμένα δεδομένα σας δεν αντικαταστάθηκαν με ενδεικτικές βαθμολογίες." /></p>
          <Button onClick={() => void refetch()} disabled={isRefetching}><BilingualText en="Retry" el="Επανάληψη" /></Button>
        </CardContent></Card>
      </AppShell>
    );
  }

  const dimensions = buildDimensions(apiData);
  const overallScore = Math.round(apiData.overallScore / apiData.overallMax * 100);
  const accelScore = apiData.acceleratorReadiness;
  const investScore = apiData.investorReadiness;
  const overallStatus = scoreToStatus(overallScore);
  const overallColors = scoreColors(overallStatus);
  const weakDims = dimensions.filter((dimension) => dimension.score / dimension.maxScore < 0.6);

  return (
    <AppShell
      title={readinessEn('page_title')}
      description={readinessDescription}
      actions={reassessAction}
      showHelp
    >
      <div className="space-y-6">
        {isDemo && <p role="status" className="rounded-lg border border-status-info-border bg-status-info-bg p-4 text-sm text-status-info"><BilingualText en="Demo showcase — simulated scores and history. Changes are disabled." el="Επίδειξη — ενδεικτικές βαθμολογίες και ιστορικό. Οι αλλαγές είναι απενεργοποιημένες." /></p>}

        {/* Overall Score + Readiness Benchmarks */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main score ring */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="relative">
                <ScoreRing score={overallScore} size={140} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold tabular-nums">{overallScore}</span>
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', overallColors.text)}>
                    {overallStatus.replace('-', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold"><BilingualText en={readinessEn('overall_readiness')} el={readinessEl('overall_readiness')} /></p>
                <p className="text-xs text-muted-foreground mt-0.5"><BilingualText en={`Based on ${dimensions.length} dimensions`} el={`Βάσει ${dimensions.length} διαστάσεων`} compact /></p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {weakDims.slice(0, 3).map((d) => (
                  <Badge key={d.key} variant="outline" className="text-xs gap-1">
                    <AlertCircle className="icon-sm" />
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
                <div className={cn('rounded-lg p-2', STATUS.accent.bg)}>
                  <Building2 className={cn('icon-sm', STATUS.accent.icon)} />
                </div>
                <div>
                  <p className="font-semibold text-sm"><BilingualText en={readinessEn('accelerator_readiness')} el={readinessEl('accelerator_readiness')} /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en={readinessEn('accel_programs_cohorts')} el={readinessEl('accel_programs_cohorts')} compact /></p>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold tabular-nums">{accelScore}%</span>
                {accelScore >= 70
                  ? <span className={cn('text-xs flex items-center gap-1 mb-1', readinessSignalText(accelScore))}><TrendingUp className="icon-sm" /> <BilingualText en={readinessEn('ready_to_apply')} el={readinessEl('ready_to_apply')} compact /></span>
                  : accelScore >= 50
                  ? <span className={cn('text-xs flex items-center gap-1 mb-1', readinessSignalText(accelScore))}><Minus className="icon-sm" /> <BilingualText en={readinessEn('almost_ready')} el={readinessEl('almost_ready')} compact /></span>
                  : <span className={cn('text-xs flex items-center gap-1 mb-1', readinessSignalText(accelScore))}><TrendingDown className="icon-sm" /> <BilingualText en={readinessEn('not_ready_yet')} el={readinessEl('not_ready_yet')} compact /></span>
                }
              </div>
              <Progress value={accelScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                <BilingualText en={readinessEn('accel_threshold_note')} el={readinessEl('accel_threshold_note')} />
              </p>
              <Button size="sm" variant="outline" asChild className="mt-auto">
                <Link href="/programs"><Zap className="icon-sm mr-1.5" /><BilingualText en={readinessEn('browse_programs')} el={readinessEl('browse_programs')} compact /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Investor readiness */}
          <Card>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className={cn('rounded-lg p-2', STATUS.success.bg)}>
                  <DollarSign className={cn('icon-sm', STATUS.success.icon)} />
                </div>
                <div>
                  <p className="font-semibold text-sm"><BilingualText en={readinessEn('investor_readiness')} el={readinessEl('investor_readiness')} /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en={readinessEn('investor_seed_preseed')} el={readinessEl('investor_seed_preseed')} compact /></p>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold tabular-nums">{investScore}%</span>
                {investScore >= 70
                  ? <span className={cn('text-xs flex items-center gap-1 mb-1', readinessSignalText(investScore))}><TrendingUp className="icon-sm" /> <BilingualText en={readinessEn('fundable_signal')} el={readinessEl('fundable_signal')} compact /></span>
                  : investScore >= 50
                  ? <span className={cn('text-xs flex items-center gap-1 mb-1', readinessSignalText(investScore))}><Minus className="icon-sm" /> <BilingualText en={readinessEn('building_traction')} el={readinessEl('building_traction')} compact /></span>
                  : <span className={cn('text-xs flex items-center gap-1 mb-1', readinessSignalText(investScore))}><TrendingDown className="icon-sm" /> <BilingualText en={readinessEn('pre_investment_stage')} el={readinessEl('pre_investment_stage')} compact /></span>
                }
              </div>
              <Progress value={investScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                <BilingualText en={readinessEn('investor_weight_note')} el={readinessEl('investor_weight_note')} />
              </p>
              <Button size="sm" variant="outline" asChild className="mt-auto">
                <Link href="/investors"><Star className="icon-sm mr-1.5" /><BilingualText en={readinessEn('find_investors')} el={readinessEl('find_investors')} compact /></Link>
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
                  <BrainCircuit className="icon-sm text-primary-accessible" />
                  <BilingualText en={readinessEn('ai_insight')} el={readinessEl('ai_insight')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {weakDims.slice(0, 3).map((d) => (
                  <div key={d.key} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/60">
                    <Sparkles className={cn('icon-sm mt-0.5 flex-shrink-0', STATUS.warning.icon)} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{d.label} — {Math.round((d.score / d.maxScore) * 100)}%</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d.recommendations[0]}</p>
                    </div>
                  </div>
                ))}
                {weakDims.length === 0 && (
                  <div className="flex items-center gap-2 p-2.5">
                    <CheckCircle2 className={cn('icon-sm flex-shrink-0', STATUS.success.icon)} />
                    <p className="text-xs text-muted-foreground"><BilingualText en={readinessEn('all_dimensions_strong')} el={readinessEl('all_dimensions_strong')} /></p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Score delta card */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2"><BilingualText en={readinessEn('score_change_7_weeks')} el={readinessEl('score_change_7_weeks')} compact /></p>
                {isDemo ? <>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold tabular-nums">{overallScore}</span>
                  <span className={cn('text-xs flex items-center gap-0.5 mb-1', TREND.up)}>
                    <TrendingUp className="icon-sm" />+{overallScore - DEMO_HISTORY[0].score} pts
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
                </> : <p className="text-sm text-muted-foreground"><BilingualText en="Readiness history is not available yet." el="Το ιστορικό ετοιμότητας δεν είναι ακόμη διαθέσιμο." /></p>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs: Dimensions / Priority Actions / Benchmarks / History */}
        <Tabs defaultValue="dimensions">
          <TabsList>
            <TabsTrigger value="dimensions"><BilingualText en={readinessEn('tab_all_dimensions')} el={readinessEl('tab_all_dimensions')} compact /></TabsTrigger>
            <TabsTrigger value="actions"><BilingualText en={readinessEn('tab_priority_actions')} el={readinessEl('tab_priority_actions')} compact /></TabsTrigger>
            <TabsTrigger value="benchmarks"><BilingualText en={readinessEn('tab_benchmarks')} el={readinessEl('tab_benchmarks')} compact /></TabsTrigger>
            <TabsTrigger value="history"><BilingualText en={readinessEn('tab_history')} el={readinessEl('tab_history')} compact /></TabsTrigger>
          </TabsList>

          <TabsContent value="dimensions" className="mt-4">
            {!workspaceId && (
              <div className={cn('mb-4 rounded-lg border p-4 flex items-start gap-3', STATUS.warning.border, STATUS.warning.bg)}>
                <AlertCircle className={cn('icon-sm mt-0.5 flex-shrink-0', STATUS.warning.icon)} />
                <div>
                  <p className={cn('text-sm font-medium', STATUS.warning.text)}><BilingualText en={readinessEn('no_workspace_title')} el={readinessEl('no_workspace_title')} /></p>
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
                  workspaceId={isDemo ? null : workspaceId}
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
                  <Lightbulb className={cn('icon-sm', STATUS.warning.icon)} />
                  <BilingualText en={readinessEn('priority_action_plan')} el={readinessEl('priority_action_plan')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weakDims.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className={cn('h-10 w-10 mx-auto mb-3', STATUS.success.icon)} />
                    <p className="font-medium"><BilingualText en={readinessEn('all_dimensions_excellent')} el={readinessEl('all_dimensions_excellent')} /></p>
                    <p className="text-sm text-muted-foreground mt-1"><BilingualText en={readinessEn('keep_iterating')} el={readinessEl('keep_iterating')} /></p>
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
                    .map((item) => {
                      const itemColors = scoreColors(item.status);
                      return (
                      <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                        <div className={cn('rounded-full p-1.5 mt-0.5', itemColors.bg)}>
                          <ChevronRight className={cn('icon-sm', itemColors.icon)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{item.dimLabel}</p>
                            <Badge variant="outline" className={cn('text-xs border', itemColors.chip)}>
                              {item.pct}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{item.rec}</p>
                        </div>
                      </div>
                    );})
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
                    <Building2 className={cn('icon-sm', STATUS.accent.icon)} />
                    <BilingualText en={readinessEn('accelerator_benchmark')} el={readinessEl('accelerator_benchmark')} compact />
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
                          <div className="absolute inset-y-0 left-0 rounded-full bg-status-accent/60" style={{ width: `${pct}%` }} />
                          <div className="absolute inset-y-0 rounded-full w-0.5 bg-status-accent" style={{ left: '65%' }} title="Target: 65%" />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1">
                    <span className="inline-block w-0.5 h-3 bg-status-accent mr-1 align-middle" />
                    <BilingualText en={readinessEn('accel_threshold_line')} el={readinessEl('accel_threshold_line')} compact />
                  </p>
                </CardContent>
              </Card>

              {/* Investor benchmark */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className={cn('icon-sm', STATUS.success.icon)} />
                    <BilingualText en={readinessEn('investor_benchmark')} el={readinessEl('investor_benchmark')} compact />
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
                          <div className="absolute inset-y-0 left-0 rounded-full bg-status-success/60" style={{ width: `${pct}%` }} />
                          <div className="absolute inset-y-0 rounded-full w-0.5 bg-status-success" style={{ left: '70%' }} title="Target: 70%" />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1">
                    <span className="inline-block w-0.5 h-3 bg-status-success mr-1 align-middle" />
                    <BilingualText en={readinessEn('investor_threshold_line')} el={readinessEl('investor_threshold_line')} compact />
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weighted score breakdown */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm"><BilingualText en={readinessEn('dimension_weights')} el={readinessEl('dimension_weights')} /></CardTitle>
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
                          <p className={cn('font-medium', STATUS.accent.text)}>+{accelContrib} <span className="text-muted-foreground font-normal">accel</span></p>
                          <p className={cn('font-medium', STATUS.success.text)}>+{investContrib} <span className="text-muted-foreground font-normal">invest</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {isDemo ? <div className="space-y-4">
              <ScoreHistoryChart history={DEMO_HISTORY} />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="icon-sm text-muted-foreground" />
                    <BilingualText en={readinessEn('assessment_log')} el={readinessEl('assessment_log')} compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DEMO_HISTORY.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary-accessible flex-shrink-0">
                        {h.week}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{h.score}% overall</span>
                          {i < DEMO_HISTORY.length - 1 && (
                            <span className={cn('text-xs flex items-center gap-0.5', TREND.up)}>
                              <TrendingUp className="icon-sm" />+{h.score - DEMO_HISTORY[DEMO_HISTORY.length - 2 - i].score}
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
            </div> : <Card><CardContent className="p-6 text-sm text-muted-foreground"><BilingualText en="Historical assessments are not available. The current score reflects saved criteria, not a simulated trend." el="Οι ιστορικές αξιολογήσεις δεν είναι διαθέσιμες. Η τρέχουσα βαθμολογία βασίζεται σε αποθηκευμένα κριτήρια, όχι σε προσομοίωση τάσης." /></CardContent></Card>}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild className="h-auto py-3 flex-col gap-1">
            <Link href="/builder">
              <Rocket className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={readinessEn('open_builder')} el={readinessEl('open_builder')} compact /></span>
              <span className="text-xs opacity-70"><BilingualText en={readinessEn('build_workspace')} el={readinessEl('build_workspace')} compact /></span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
            <Link href="/mentoring">
              <Lightbulb className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={readinessEn('find_mentor')} el={readinessEl('find_mentor')} compact /></span>
              <span className="text-xs opacity-70"><BilingualText en={readinessEn('get_expert_guidance')} el={readinessEl('get_expert_guidance')} compact /></span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
            <Link href="/programs">
              <Building2 className="icon-sm" />
              <span className="text-sm font-medium"><BilingualText en={readinessEn('browse_programs')} el={readinessEl('browse_programs')} compact /></span>
              <span className="text-xs opacity-70"><BilingualText en={readinessEn('accelerators_cohorts')} el={readinessEl('accelerators_cohorts')} compact /></span>
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
