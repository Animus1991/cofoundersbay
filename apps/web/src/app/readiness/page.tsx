'use client';

import { useState, useCallback, useEffect, useMemo, useId } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Info,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { usePageRail } from '@/components/layout/PageRailContext';
import { BilingualText } from '@/components/common/BilingualText';
import { readinessEn, readinessEl } from '@/lib/i18n/strings-readiness';
import { bilingualInline, bilingualAria, formatShortDate } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
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
import { usePublishPageSnapshot } from '@/contexts/PageSnapshotContext';
import {
  applyOverlay,
  DEMO_CRITERIA,
  overlayIsEmpty,
  readReadinessOverlay,
  resetReadinessOverlay,
  toggleDemoCriterion,
  type ReadinessOverlay,
} from '@/lib/readiness-demo';
import { isPreviewDemo } from '@/lib/preview-demo';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { AIInsightButton } from '@/components/ai/AIInsightButton';

const RadarFallback = () => <Skeleton className="h-[280px] w-full rounded-xl" />;
const LineFallback = () => <Skeleton className="h-[200px] w-full rounded-xl" />;
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
  glyph: CfbGlyphName;
  labelEn: string;
  labelEl: string;
  descriptionEn: string;
  descriptionEl: string;
  acceleratorWeight: number;
  investorWeight: number;
}> = {
  team:      { glyph: 'people',    labelEn: readinessEn('dim_team'),      labelEl: readinessEl('dim_team'),      descriptionEn: readinessEn('dim_team_desc'),      descriptionEl: readinessEl('dim_team_desc'),      acceleratorWeight: 25, investorWeight: 30 },
  market:    { glyph: 'target',    labelEn: readinessEn('dim_market'),    labelEl: readinessEl('dim_market'),    descriptionEn: readinessEn('dim_market_desc'),    descriptionEl: readinessEl('dim_market_desc'),    acceleratorWeight: 20, investorWeight: 25 },
  product:   { glyph: 'builder',   labelEn: readinessEn('dim_product'),   labelEl: readinessEl('dim_product'),   descriptionEn: readinessEn('dim_product_desc'),   descriptionEl: readinessEl('dim_product_desc'),   acceleratorWeight: 20, investorWeight: 20 },
  business:  { glyph: 'briefcase', labelEn: readinessEn('dim_business'),  labelEl: readinessEl('dim_business'),  descriptionEn: readinessEn('dim_business_desc'),  descriptionEl: readinessEl('dim_business_desc'),  acceleratorWeight: 15, investorWeight: 15 },
  funding:   { glyph: 'wallet',    labelEn: readinessEn('dim_funding'),   labelEl: readinessEl('dim_funding'),   descriptionEn: readinessEn('dim_funding_desc'),   descriptionEl: readinessEl('dim_funding_desc'),   acceleratorWeight: 10, investorWeight: 5  },
  execution: { glyph: 'flag',      labelEn: readinessEn('dim_execution'), labelEl: readinessEl('dim_execution'), descriptionEn: readinessEn('dim_execution_desc'), descriptionEl: readinessEl('dim_execution_desc'), acceleratorWeight: 10, investorWeight: 5  },
};

const CRITERION_EL: Record<string, string> = {
  'Co-founder identified': readinessEl('crit_cofounder_identified'),
  'Complementary skills covered': readinessEl('crit_complementary_skills'),
  'Full-time commitment secured': readinessEl('crit_fulltime_commitment'),
  'Previous startup experience': readinessEl('crit_previous_experience'),
  'Advisory board in place': readinessEl('crit_advisory_board'),
  'Target market defined': readinessEl('crit_target_market'),
  'Market size validated (TAM/SAM)': readinessEl('crit_market_size'),
  'Competitive analysis completed': readinessEl('crit_competitive_analysis'),
  'Customer interviews (10+)': readinessEl('crit_customer_interviews'),
  'Market timing analysis': readinessEl('crit_market_timing'),
  'Problem validated with users': readinessEl('crit_problem_validated'),
  'Solution clearly defined': readinessEl('crit_solution_defined'),
  'MVP built and tested': readinessEl('crit_mvp_built'),
  'User feedback collected': readinessEl('crit_user_feedback'),
  'Product roadmap documented': readinessEl('crit_roadmap'),
  'Revenue model defined': readinessEl('crit_revenue_model'),
  'Pricing strategy validated': readinessEl('crit_pricing_validated'),
  'Unit economics calculated': readinessEl('crit_unit_economics'),
  'Go-to-market strategy defined': readinessEl('crit_gtm_strategy'),
  'Partnership strategy outlined': readinessEl('crit_partnerships'),
  'Pitch deck ready (10-12 slides)': readinessEl('crit_pitch_deck'),
  'Financial projections (3 years)': readinessEl('crit_financial_projections'),
  'Data room prepared': readinessEl('crit_data_room'),
  'Target investor list built': readinessEl('crit_investor_list'),
  'Term sheet knowledge ready': readinessEl('crit_term_sheet'),
  'OKRs / quarterly goals set': readinessEl('crit_okrs'),
  'Key milestones defined': readinessEl('crit_milestones'),
  'Core metrics tracked': readinessEl('crit_metrics_tracked'),
  'Regular retrospectives held': readinessEl('crit_retrospectives'),
  'Documentation practices in place': readinessEl('crit_documentation'),
};

const DEMO_RECS: Record<string, { en: string; el: string }> = {
  team:      { en: 'Add an advisor with proven domain expertise to strengthen your credibility.', el: 'Προσθέστε σύμβουλο με αποδεδειγμένη εμπειρία στον τομέα για αξιοπιστία.' },
  market:    { en: 'Complete a competitive landscape analysis and conduct 10+ structured customer interviews.', el: 'Ολοκληρώστε ανταγωνιστική ανάλυση και κάντε 10+ δομημένες συνεντεύξεις πελατών.' },
  product:   { en: 'Create a detailed product roadmap covering the next 6 months with clear milestones.', el: 'Φτιάξτε αναλυτικό χάρτη προϊόντος για τους επόμενους 6 μήνες με σαφή ορόσημα.' },
  business:  { en: 'Validate your pricing with at least 5 potential customers and calculate unit economics.', el: 'Επικυρώστε την τιμολόγηση με τουλάχιστον 5 δυνητικούς πελάτες και υπολογίστε τα μοναδιαία οικονομικά.' },
  funding:   { en: 'Build a 3-year financial model and prepare your data room before approaching investors.', el: 'Φτιάξτε τριετές οικονομικό μοντέλο και ετοιμάστε το data room πριν προσεγγίσετε επενδυτές.' },
  execution: { en: 'Implement bi-weekly retrospectives and document your processes in a shared wiki.', el: 'Καθιερώστε ανασκοπήσεις ανά δύο εβδομάδες και τεκμηριώστε τις διαδικασίες σε κοινό wiki.' },
};

const REC_EL: Record<string, string> = Object.fromEntries(
  Object.values(DEMO_RECS).map((pair) => [pair.en, pair.el]),
);


const DEMO_HISTORY: { week: string; score: number; accel: number; invest: number }[] = [
  { week: 'W1', score: 38, accel: 32, invest: 28 },
  { week: 'W2', score: 42, accel: 36, invest: 31 },
  { week: 'W3', score: 45, accel: 40, invest: 35 },
  { week: 'W4', score: 51, accel: 46, invest: 42 },
  { week: 'W5', score: 55, accel: 50, invest: 46 },
  { week: 'W6', score: 60, accel: 55, invest: 50 },
  { week: 'W7', score: 65, accel: 58, invest: 52 },
];

type DimCriterion = { id: string; name: string; nameEl?: string; completed: boolean; weight: number };

type DimData = {
  key: string;
  glyph: CfbGlyphName;
  labelEn: string;
  labelEl: string;
  descriptionEn: string;
  descriptionEl: string;
  score: number;
  maxScore: number;
  criteria: DimCriterion[];
  recommendations: { en: string; el?: string }[];
  acceleratorWeight: number;
  investorWeight: number;
};

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

const STATUS_LABEL: Record<ScoreLevel, { en: string; el: string }> = {
  excellent: { en: readinessEn('status_excellent_label'), el: readinessEl('status_excellent_label') },
  good: { en: readinessEn('status_good_label'), el: readinessEl('status_good_label') },
  'needs-work': { en: readinessEn('status_needs_work_label'), el: readinessEl('status_needs_work_label') },
  critical: { en: readinessEn('status_critical_label'), el: readinessEl('status_critical_label') },
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
    key: dimension,
    ...DIMENSION_META[dimension],
    score,
    maxScore,
    criteria: criteria.map((c) => ({ ...c, nameEl: CRITERION_EL[c.name] })),
    recommendations: recommendations.map((r) => ({ en: r, el: REC_EL[r] })),
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

function buildDemoAssessment(overlay: ReadinessOverlay = {}): AssessmentData {
  const dimensions = Object.entries(DEMO_CRITERIA).map(([dimension, seed]) => {
    // Every number on this page is derived from these flags and their weights,
    // which is why the demo can be made writable by overriding the flags alone
    // — dimension score, overall, accelerator and investor readiness all
    // recompute from here rather than being stored anywhere.
    const criteria = applyOverlay(dimension, seed, overlay) as typeof seed;
    return {
      dimension, criteria, maxScore: 100,
      score: criteria.reduce((sum, criterion) => sum + (criterion.completed ? criterion.weight : 0), 0),
      recommendations: [DEMO_RECS[dimension].en],
    };
  });
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

/**
 * The last point on the history chart is today, so it has to follow whatever
 * the visitor has just ticked rather than the seed it was pinned to.
 */
function demoHistoryWith(assessment: AssessmentData): typeof DEMO_HISTORY {
  return DEMO_HISTORY.map((point, index) =>
    index === DEMO_HISTORY.length - 1
      ? {
          ...point,
          week: 'W7',
          score: assessment.overallScore,
          accel: assessment.acceleratorReadiness,
          invest: assessment.investorReadiness,
        }
      : point,
  );
}

function exportHistoryCsv(history: typeof DEMO_HISTORY) {
  const rows = ['week,overall,accelerator,investor', ...history.map((h) => `${h.week},${h.score},${h.accel},${h.invest}`)];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'readiness-history.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function AskAiButton({
  labelEn,
  labelEl,
  prompt,
  variant = 'outline',
  className,
}: {
  labelEn?: string;
  labelEl?: string;
  prompt?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}) {
  const href = prompt ? `/ai?q=${encodeURIComponent(prompt)}` : '/ai';
  return (
    <Button asChild variant={variant} size="sm" className={cn('h-auto min-h-9 gap-1.5 py-1.5 leading-snug', className)}>
      <Link href={href}>
        <CfbGlyph name="spark" className="icon-sm shrink-0" aria-hidden="true" />
        <BilingualText en={labelEn ?? readinessEn('ask_ai')} el={labelEl ?? readinessEl('ask_ai')} compact wrap />
      </Link>
    </Button>
  );
}

const NEXT_TIER: Record<ScoreLevel, { score: number; en: string; el: string } | null> = {
  critical: { score: 40, en: STATUS_LABEL['needs-work'].en, el: STATUS_LABEL['needs-work'].el },
  'needs-work': { score: 60, en: STATUS_LABEL.good.en, el: STATUS_LABEL.good.el },
  good: { score: 80, en: STATUS_LABEL.excellent.en, el: STATUS_LABEL.excellent.el },
  excellent: null,
};

function ScoreEmblem({
  score,
  dimensions,
}: {
  score: number;
  dimensions: { key: string; pct: number; labelEn: string; labelEl: string }[];
}) {
  const glowId = `cfb-score-glow-${useId().replace(/:/g, '')}`;
  const size = 184;
  const pad = 24;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const circ = 2 * Math.PI * r;
  const status = scoreToStatus(score);
  const stroke = SCORE_STROKE[status];
  const colors = scoreColors(status);
  const next = NEXT_TIER[status];
  const ptsToNext = next ? next.score - score : 0;
  const pipR = r + 16;
  const wrap = size + pad * 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: wrap, height: wrap }}
        role="img"
        aria-label={bilingualAria(
          `Overall readiness ${score} out of 100 — ${STATUS_LABEL[status].en}`,
          `Συνολική ετοιμότητα ${score} στα 100 — ${STATUS_LABEL[status].el}`,
        )}
      >
        <div
          className="pointer-events-none absolute inset-[18px] rounded-full opacity-50 blur-3xl"
          style={{ backgroundColor: stroke }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[184px] w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25 bg-gradient-to-b from-primary/20 via-card to-card shadow-[inset_0_1px_0_hsl(var(--primary)/0.25)]"
          aria-hidden="true"
        />
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90"
          aria-hidden="true"
        >
          <defs>
            <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id={`${glowId}-fill`} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--card))" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r - 14} fill={`url(#${glowId}-fill)`} />
          <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="hsl(var(--primary) / 0.18)" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={12} className="text-muted/30" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * circ} ${circ}`}
            filter={`url(#${glowId})`}
          />
          <circle cx={cx} cy={cy} r={r - 18} fill="none" stroke="hsl(var(--primary) / 0.22)" strokeWidth={1.5} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" aria-hidden="true">
          <span className="text-[2.75rem] font-bold leading-none tabular-nums tracking-tight">
            {score}
            <span className="text-sm font-medium text-muted-foreground">/100</span>
          </span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none', colors.bg, colors.text)}>
            <BilingualText en={STATUS_LABEL[status].en} el={STATUS_LABEL[status].el} compact />
          </span>
        </div>
        {dimensions.map((dim, index) => {
          const angle = (-90 + (index * 360) / dimensions.length) * (Math.PI / 180);
          const x = pad + cx + pipR * Math.cos(angle);
          const y = pad + cy + pipR * Math.sin(angle);
          const pipStatus = scoreToStatus(dim.pct);
          return (
            <a
              key={dim.key}
              href={`#dim-${dim.key}`}
              title={`${dim.labelEn} ${dim.pct}%`}
              aria-label={bilingualAria(
                `${dim.labelEn} ${dim.pct}%`,
                `${dim.labelEl} ${dim.pct}%`,
              )}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm ring-2 ring-background transition-transform hover:scale-125"
              style={{
                left: x,
                top: y,
                backgroundColor: SCORE_STROKE[pipStatus],
              }}
            />
          );
        })}
      </div>
      {next && ptsToNext > 0 && (
        <p className="text-xs tabular-nums text-muted-foreground">
          <BilingualText
            en={`${ptsToNext} ${readinessEn('pts_to')} ${next.en}`}
            el={`${ptsToNext} ${readinessEl('pts_to')} ${next.el}`}
            wrap
          />
        </p>
      )}
    </div>
  );
}

function DimensionCard({
  dim,
  canToggle,
  onToggle,
  isMutating,
}: {
  dim: DimData;
  // Whether a criterion can be changed, stated outright. This used to be the
  // workspace id doing double duty, which is why the demo — which has no
  // workspace and needs none — could only be read.
  canToggle: boolean;
  onToggle: (dimKey: string, cId: string, current: boolean) => void;
  isMutating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((dim.score / dim.maxScore) * 100);
  const status = scoreToStatus(pct);
  const colors = scoreColors(status);
  const done = dim.criteria.filter((c) => c.completed).length;
  const hiddenCount = dim.criteria.length - 3;
  const statusCopy = STATUS_LABEL[status];
  // Heaviest first: if only one thing is worth naming, name the one that
  // moves the score most.
  const remaining = dim.criteria
    .filter((criterion) => !criterion.completed)
    .sort((a, b) => b.weight - a.weight);
  const recPrompt = dim.recommendations[0]
    ? `Help me improve ${dim.labelEn} readiness (${pct}%). Next step: ${dim.recommendations[0].en}`
    : `Help me improve ${dim.labelEn} readiness (${pct}%). What should I do next?`;

  return (
    <Card id={`dim-${dim.key}`} className="min-w-0 scroll-mt-24 transition-colors hover:border-border">
      {/* `h-full` down the chain, so the box at the foot of this card can sit
          at the foot of it. The grid matches these cards' heights; without it
          the shorter of a pair ended on empty space instead of its own
          content. */}
      <CardContent className="h-full p-4 sm:p-5">
        {/* One column: the dimension glyph sits on the title row only.
            A side well beside the body left an empty tab under the icon,
            so criteria, “+N more”, and the recommendation started to the
            right of the title. Everything below now starts on the same
            left edge as that icon. */}
        <div className="flex h-full min-w-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5">
                  <CfbGlyph name={dim.glyph} className="icon-md text-primary-accessible" />
                </div>
                <h3 className="text-sm font-semibold">
                  <BilingualText en={dim.labelEn} el={dim.labelEl} compact wrap />
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* WCAG 2.5.8 wants 24x24 CSS px. The icon stays 16px; the negative margin cancels the extra 8px so nothing moves, only the hit area grows. */}
                      <button
                        type="button"
                        className="-m-1 inline-flex tap-target items-center justify-center text-muted-foreground/50 hover:text-muted-foreground"
                        aria-label={bilingualAria(dim.descriptionEn, dim.descriptionEl)}
                      >
                        <Info className="icon-sm cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      <BilingualText en={dim.descriptionEn} el={dim.descriptionEl} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" className={cn('border text-xs', colors.chip)}>
                <BilingualText en={statusCopy.en} el={statusCopy.el} compact />
              </Badge>
            </div>

            <div className="mt-3.5 flex items-center gap-3">
              <Progress value={pct} label={`${dim.labelEn} readiness`} className="h-2 min-w-0 flex-1" />
              <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums">{pct}%</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {done}/{dim.criteria.length}{' '}
              <BilingualText en={readinessEn('criteria_completed')} el={readinessEl('criteria_completed')} compact />
            </p>

            {/* `mb-4` here, not `mt-4` on the box below: that box carries
                `mt-auto` so it settles at the foot of the card, and an
                explicit top margin would cancel it. */}
            <div className="mt-4 mb-4 space-y-1.5">
              {(expanded ? dim.criteria : dim.criteria.slice(0, 3)).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={!canToggle || isMutating}
                  onClick={() => canToggle && onToggle(dim.key, c.id, c.completed)}
                  className={cn(
                    'flex min-h-11 w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors',
                    canToggle ? 'cursor-pointer hover:bg-secondary/60' : 'cursor-default',
                  )}
                >
                  {c.completed
                    ? <CheckCircle2 className={cn('mt-0.5 icon-sm shrink-0', STATUS.success.icon)} />
                    : <AlertCircle className="mt-0.5 icon-sm shrink-0 text-muted-foreground/50" />}
                  <span className={cn('min-w-0 flex-1 leading-snug', c.completed && 'text-muted-foreground line-through')}>
                    <BilingualText en={c.name} el={c.nameEl} compact wrap />
                  </span>
                  <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">{c.weight}%</span>
                </button>
              ))}
              {dim.criteria.length > 3 && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="flex min-h-11 w-full items-center rounded-lg px-2.5 py-2.5 text-left text-xs text-primary-accessible transition-colors hover:bg-secondary/60"
                >
                  <span className="min-w-0 flex-1">
                    {expanded
                      ? <BilingualText en={readinessEn('show_less')} el={readinessEl('show_less')} compact />
                      : <BilingualText en={`+${hiddenCount} ${readinessEn('show_n_more').toLowerCase()}`} el={`+${hiddenCount} ${readinessEl('show_n_more').toLowerCase()}`} compact />}
                  </span>
                </button>
              )}
            </div>

            {/* A strong dimension used to say nothing at all here, while the
                weak one beside it carried a recommendation — and because the
                grid matches their heights, "Προϊόν" ended with 182px of empty
                card. What a nearly-finished dimension has to say is the one
                thing still open, which is more useful than silence and fills
                the space honestly. */}
            {status === 'excellent' && (
              <div className="mt-auto space-y-2.5 rounded-xl border border-border/60 bg-secondary/50 px-2.5 py-3.5">
                <p className="mb-1.5 flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className={cn('icon-sm shrink-0', STATUS.success.icon)} />
                  <BilingualText
                    en={remaining.length ? 'What is left' : 'Fully covered'}
                    el={remaining.length ? 'Τι απομένει' : 'Πλήρως καλυμμένη'}
                    compact
                  />
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {remaining.length ? (
                    <BilingualText en={remaining[0].name} el={remaining[0].nameEl ?? remaining[0].name} />
                  ) : (
                    <BilingualText
                      en="Every criterion in this dimension is met."
                      el="Κάθε κριτήριο αυτής της διάστασης είναι καλυμμένο."
                    />
                  )}
                </p>
                {remaining.length > 1 && (
                  <p className="text-2xs text-muted-foreground">
                    <BilingualText
                      en={`and ${remaining.length - 1} more`}
                      el={`και ${remaining.length - 1} ακόμη`}
                      compact
                    />
                  </p>
                )}
                <AIInsightButton prompt={recPrompt} className="h-8" />
              </div>
            )}

            {dim.recommendations.length > 0 && status !== 'excellent' && (
              <div className="mt-auto space-y-2.5 rounded-xl border border-border/60 bg-secondary/50 px-2.5 py-3.5">
                <p className="mb-1.5 flex items-center gap-2 text-xs font-medium">
                  <CfbGlyph name="spark" className={cn('icon-sm shrink-0', STATUS.warning.icon)} />
                  <BilingualText en={readinessEn('recommendation')} el={readinessEl('recommendation')} compact />
                </p>
                {remaining[0] && (
                  <p className="text-xs font-medium leading-snug">
                    <BilingualText en={readinessEn('next_open')} el={readinessEl('next_open')} wrap />
                    {': '}
                    <BilingualText en={remaining[0].name} el={remaining[0].nameEl ?? remaining[0].name} wrap />
                    <span className="ml-1 font-normal text-muted-foreground">· {remaining[0].weight}%</span>
                  </p>
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <BilingualText en={dim.recommendations[0].en} el={dim.recommendations[0].el} />
                </p>
                <AIInsightButton prompt={recPrompt} className="h-8" />
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessRadarChart({ dimensions }: { dimensions: DimData[] }) {
  const { primary } = useLanguagePreference();
  const data = dimensions.map((d) => ({
    dimension: primary === 'el' ? d.labelEl : d.labelEn,
    score: Math.round((d.score / d.maxScore) * 100),
    benchmark: 65,
  }));
  return (
    /* The radar sits beside a two-card column that runs 275px taller, so the
       row stretched this cell and left the space under the card empty. Filling
       it is not a matter of padding: the radar is the one thing on the page
       that reads better at size, so the height goes to the chart. */
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CfbGlyph name="chart" className="icon-sm text-primary-accessible" />
          <BilingualText en={readinessEn('readiness_radar')} el={readinessEl('readiness_radar')} compact />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* `flex-1` takes whatever the row gives; `min-h-[280px]` is the floor,
            and the one that matters on a phone, where the cell does not stretch
            and `h-full` resolves to auto. (`basis-[280px]` would be dead here —
            `flex-1` is shorthand for `flex: 1 1 0%` and resets the basis.) */}
        <div className="min-h-[280px] flex-1">
          <ReadinessRadarChartInner
            height="100%"
            data={data}
            scoreName={primary === 'el' ? readinessEl('your_score') : readinessEn('your_score')}
            benchmarkName={primary === 'el' ? readinessEl('benchmark') : readinessEn('benchmark')}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-primary/60" /><BilingualText en={readinessEn('your_score')} el={readinessEl('your_score')} compact /></span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-muted-foreground/30" /><BilingualText en={readinessEn('benchmark')} el={readinessEl('benchmark')} compact /></span>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreHistoryChart({ history }: { history: typeof DEMO_HISTORY }) {
  const { primary } = useLanguagePreference();
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CfbGlyph name="chart" className="icon-sm text-primary-accessible" />
            <BilingualText en={readinessEn('score_progression')} el={readinessEl('score_progression')} compact />
          </CardTitle>
          <button
            type="button"
            onClick={() => exportHistoryCsv(history)}
            className="inline-flex min-h-8 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label={bilingualAria(readinessEn('export_history'), readinessEl('export_history'))}
          >
            <Download className="icon-sm" /><BilingualText en={readinessEn('export')} el={readinessEl('export')} compact />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScoreHistoryChartInner
          history={history}
          overallName={primary === 'el' ? readinessEl('overall') : readinessEn('overall')}
          acceleratorName={primary === 'el' ? readinessEl('accelerator') : readinessEn('accelerator')}
          investorName={primary === 'el' ? readinessEl('investor') : readinessEn('investor')}
        />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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

export default function ReadinessPage() {
  const { error: toastError } = useToast();
  const qc = useQueryClient();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'demo' | null>(null);
  const [demoOverlay, setDemoOverlay] = useState<ReadinessOverlay>({});
  const isDemo = mode === 'demo';
  // Read here, with the component's other context: the Priority-actions tab
  // sends the reader to the rail's AI panel rather than duplicating it.
  const { openRailSection } = usePageRail();

  // Read after mount, never during render: the server has no session storage,
  // so reading it while rendering would make the markup disagree on which
  // boxes are ticked.
  useEffect(() => {
    setDemoOverlay(readReadinessOverlay());
  }, []);

  const demoAssessment = useMemo(() => buildDemoAssessment(demoOverlay), [demoOverlay]);
  const demoHistory = useMemo(() => demoHistoryWith(demoAssessment), [demoAssessment]);

  useEffect(() => {
    try {
      setWorkspaceId(localStorage.getItem('cfb_default_workspace')?.trim() || null);
    } catch {
      setWorkspaceId(null);
    }
    setMode(isPreviewDemo() ? 'demo' : 'live');
  }, []);

  /**
   * The assistant can tick a criterion and create the workspace this page
   * needs, and neither goes through the mutation below — so neither would show
   * until a manual refresh. It announces both on the window, the way the rest
   * of the app announces a login or a lost API, and this picks the workspace up
   * and drops the stale scores.
   */
  useEffect(() => {
    const onChanged = () => {
      try {
        setWorkspaceId(localStorage.getItem('cfb_default_workspace')?.trim() || null);
      } catch {
        /* a blocked read leaves the current selection alone */
      }
      void qc.invalidateQueries({ queryKey: ['readiness'] });
    };
    window.addEventListener('cfb:readiness-updated', onChanged);
    return () => window.removeEventListener('cfb:readiness-updated', onChanged);
  }, [qc]);

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
    onError: () => toastError(bilingualInline(readinessEn('update_failed'), readinessEl('update_failed'))),
  });

  const handleToggle = useCallback((dimKey: string, cId: string, current: boolean) => {
    // The showcase keeps its changes for the session rather than refusing them.
    // Every score it displays is derived from these flags, so the page behaves
    // exactly as the live one does — it just has nowhere to send them.
    if (mode === 'demo') {
      setDemoOverlay(toggleDemoCriterion(dimKey, cId, !current));
      return;
    }
    if (!workspaceId || mode !== 'live' || !data || isError || toggleMutation.isPending) return;
    toggleMutation.mutate({ dimKey, criterionId: cId, completed: current });
  }, [workspaceId, mode, data, isError, toggleMutation]);

  const apiData = isDemo ? demoAssessment : data;

  /**
   * Tell the assistant what is actually on this screen.
   *
   * Published before the early returns below, because it has to describe the
   * empty and error states too — those are exactly the moments the reader most
   * needs to be told what to do next, and the states in which the assistant
   * previously described criteria the page was not showing.
   */
  usePublishPageSnapshot(
    '/readiness',
    !mode
      ? null
      : {
          title: 'Readiness Score',
          state: !isDemo && !workspaceId
            ? 'empty'
            : !isDemo && isLoading
              ? 'loading'
              : (isError && !isDemo) || !apiData
                ? 'error'
                : isDemo
                  ? 'demo'
                  : 'ready',
          summary: !isDemo && !workspaceId
            ? 'No workspace is selected, so no criteria can be scored yet.'
            : apiData
              ? `Six readiness dimensions scored from ${apiData.dimensions.reduce((n, d) => n + d.criteria.length, 0)} criteria.`
              : undefined,
          ...(apiData
            ? {
                figures: {
                  Overall: `${Math.round((apiData.overallScore / apiData.overallMax) * 100)}%`,
                  Accelerator: `${apiData.acceleratorReadiness}%`,
                  Investor: `${apiData.investorReadiness}%`,
                  Remaining: apiData.dimensions.reduce((n, d) => n + d.criteria.filter((c) => !c.completed).length, 0),
                  ...Object.fromEntries(
                    apiData.dimensions.map((d) => [
                      d.dimension,
                      `${d.criteria.filter((c) => c.completed).length}/${d.criteria.length}`,
                    ]),
                  ),
                },
              }
            : {}),
          actions: !isDemo && !workspaceId
            ? ['workspace_create']
            : ['readiness_tick_criterion', 'navigate'],
        },
  );

  const reassessAction = (
    <div className="flex flex-wrap gap-2.5">
      {/* No Ask AI here: AppShell renders one from `askAi`, and that one carries
          this page's readiness prompt. This was a second, promptless copy of
          the same button sitting immediately beside it. */}
      <Button variant="outline" size="sm" disabled={!mode || toggleMutation.isPending} onClick={() => setMode(isDemo ? 'live' : 'demo')}>
        <BilingualText en={isDemo ? 'View live readiness' : 'View demo showcase'} el={isDemo ? readinessEl('view_live_readiness') : readinessEl('view_demo_showcase')} compact />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { if (workspaceId && mode === 'live') void refetch(); }}
        disabled={!workspaceId || mode !== 'live' || isLoading || isRefetching || toggleMutation.isPending}
      >
        {isRefetching ? <Loader2 className="icon-sm mr-1.5 animate-spin" /> : <RefreshCw className="icon-sm mr-1.5" />}
        <BilingualText en={readinessEn('reassess')} el={readinessEl('reassess')} compact />
      </Button>
    </div>
  );

  if (!mode || (!isDemo && isLoading)) {
    return (
      <AppShell actions={reassessAction} showHelp>
        <div className="py-6"><ReadinessSkeleton /></div>
      </AppShell>
    );
  }

  if (!isDemo && !workspaceId) {
    return (
      <AppShell actions={reassessAction} showHelp>
        <Card><CardContent className="space-y-4 p-6">
          <p><BilingualText en="Create or select a workspace to assess readiness." el="Δημιουργήστε ή επιλέξτε χώρο εργασίας για να αξιολογήσετε την ετοιμότητα." /></p>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/builder"><BilingualText en="Open Startup Builder" el="Άνοιγμα Startup Builder" /></Link></Button>
            <AskAiButton
              variant="ghost"
              prompt="I have no workspace yet. How do I start a readiness assessment in Builder?"
              labelEn={readinessEn('ask_ai_plan')}
              labelEl={readinessEl('ask_ai_plan')}
            />
          </div>
        </CardContent></Card>
      </AppShell>
    );
  }

  if (isError && !isDemo || !apiData) {
    return (
      <AppShell actions={reassessAction} showHelp>
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
  const doneCriteria = dimensions.reduce((n, d) => n + d.criteria.filter((c) => c.completed).length, 0);
  const totalCriteria = dimensions.reduce((n, d) => n + d.criteria.length, 0);
  const weakDims = dimensions.filter((dimension) => dimension.score / dimension.maxScore < 0.6);
  const nextOpen = dimensions
    .flatMap((d) => d.criteria
      .filter((c) => !c.completed)
      .map((c) => ({ ...c, dimKey: d.key, dimLabelEn: d.labelEn, dimLabelEl: d.labelEl })))
    .sort((a, b) => b.weight - a.weight)[0];
  const askPrompt = `My overall startup readiness is ${overallScore}%. Weakest dimensions: ${weakDims.map((d) => `${d.labelEn} ${Math.round((d.score / d.maxScore) * 100)}% — ${d.recommendations[0]?.en ?? 'needs work'}`).join('; ') || 'none'}. What should I do next in Builder, interviews, or fundraising?`;

  /*
   * What sits around the answer rather than being it.
   *
   * The gauge, the radar and the six dimensions are why this page exists.
   * These four - the same score read for two audiences, the seven-week
   * trend, the AI plan and the four ways out - used to occupy the top of
   * the page, so the dimensions were below the fold. Same cards, same
   * buttons, same CSV export; one gesture away instead of first.
   */
  const rail: PageRailSection[] = [
    {
      id: 'audiences',
      glyph: 'target',
      labelEn: 'Readiness by audience',
      labelEl: 'Ετοιμότητα ανά κοινό',
      content: <div className="space-y-3">
        {/* Accelerator readiness */}
        <Card className="min-w-0">
        {/* `h-full`: the grid stretches the Card, but this column was only as
        tall as its own content, so the `mt-auto` on the button below had
        nothing to push against and left 85px of empty card under it. */}
        <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
        <CfbGlyph name="award" className="icon-sm text-primary-accessible" />
        </div>
        <div className="min-w-0">
        <p className="text-sm font-semibold"><BilingualText en={readinessEn('accelerator_readiness')} el={readinessEl('accelerator_readiness')} stacked wrap /></p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground"><BilingualText en={readinessEn('accel_programs_cohorts')} el={readinessEl('accel_programs_cohorts')} wrap /></p>
        </div>
        </div>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-2xl font-bold tabular-nums">{accelScore}%</span>
        {accelScore >= 70
        ? <span className={cn('mb-1 flex items-center gap-1 text-xs', readinessSignalText(accelScore))}><TrendingUp className="icon-sm" /> <BilingualText en={readinessEn('ready_to_apply')} el={readinessEl('ready_to_apply')} compact /></span>
        : accelScore >= 50
        ? <span className={cn('mb-1 flex items-center gap-1 text-xs', readinessSignalText(accelScore))}><Minus className="icon-sm" /> <BilingualText en={readinessEn('almost_ready')} el={readinessEl('almost_ready')} compact /></span>
        : <span className={cn('mb-1 flex items-center gap-1 text-xs', readinessSignalText(accelScore))}><TrendingDown className="icon-sm" /> <BilingualText en={readinessEn('not_ready_yet')} el={readinessEl('not_ready_yet')} compact /></span>
        }
        </div>
        <Progress value={accelScore} label="Accelerator readiness" className="h-2" />
        <p className="text-xs leading-relaxed text-muted-foreground">
        <BilingualText en={readinessEn('accel_threshold_note')} el={readinessEl('accel_threshold_note')} />
        </p>
        <Button size="sm" variant="outline" asChild className="mt-auto min-h-10">
        <Link href="/programs"><CfbGlyph name="award" className="icon-sm mr-1.5 shrink-0" aria-hidden="true" /><BilingualText en={readinessEn('browse_programs')} el={readinessEl('browse_programs')} compact wrap /></Link>
        </Button>
        </CardContent>
        </Card>

        {/* Investor readiness */}
        <Card className="min-w-0">
        {/* `h-full`: the grid stretches the Card, but this column was only as
        tall as its own content, so the `mt-auto` on the button below had
        nothing to push against and left 85px of empty card under it. */}
        <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
        <CfbGlyph name="wallet" className="icon-sm text-primary-accessible" />
        </div>
        <div className="min-w-0">
        <p className="text-sm font-semibold"><BilingualText en={readinessEn('investor_readiness')} el={readinessEl('investor_readiness')} stacked wrap /></p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground"><BilingualText en={readinessEn('investor_seed_preseed')} el={readinessEl('investor_seed_preseed')} wrap /></p>
        </div>
        </div>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-2xl font-bold tabular-nums">{investScore}%</span>
        {investScore >= 70
        ? <span className={cn('mb-1 flex items-center gap-1 text-xs', readinessSignalText(investScore))}><TrendingUp className="icon-sm" /> <BilingualText en={readinessEn('fundable_signal')} el={readinessEl('fundable_signal')} compact /></span>
        : investScore >= 50
        ? <span className={cn('mb-1 flex items-center gap-1 text-xs', readinessSignalText(investScore))}><Minus className="icon-sm" /> <BilingualText en={readinessEn('building_traction')} el={readinessEl('building_traction')} compact /></span>
        : <span className={cn('mb-1 flex items-center gap-1 text-xs', readinessSignalText(investScore))}><TrendingDown className="icon-sm" /> <BilingualText en={readinessEn('pre_investment_stage')} el={readinessEl('pre_investment_stage')} compact /></span>
        }
        </div>
        <Progress value={investScore} label="Investor readiness" className="h-2" />
        <p className="text-xs leading-relaxed text-muted-foreground">
        <BilingualText en={readinessEn('investor_weight_note')} el={readinessEl('investor_weight_note')} />
        </p>
        <Button size="sm" variant="outline" asChild className="mt-auto min-h-10">
        <Link href="/investors"><CfbGlyph name="discover" className="icon-sm mr-1.5 shrink-0" aria-hidden="true" /><BilingualText en={readinessEn('find_investors')} el={readinessEl('find_investors')} compact wrap /></Link>
        </Button>
        </CardContent>
        </Card>
      </div>,
    },
    {
      id: 'plan',
      glyph: 'spark',
      labelEn: 'AI plan',
      labelEl: 'Πλάνο AI',
      content: <div className="space-y-3">
        {/* AI Insight Panel */}
        <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-sm">
        <CfbGlyph name="spark" className="icon-sm text-primary-accessible" />
        <BilingualText en={readinessEn('ai_insight')} el={readinessEl('ai_insight')} compact />
        </CardTitle>
        <AIInsightButton
        className="h-8"
        prompt={`${askPrompt} Draft a 7-day plan.`}
        />
        </div>
        </CardHeader>
        <CardContent className="space-y-3">
        {weakDims.slice(0, 3).map((d) => (
        <div key={d.key} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3">
        <CfbGlyph name="spark" className={cn('mt-0.5 icon-sm flex-shrink-0', STATUS.warning.icon)} />
        <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">
        <BilingualText en={d.labelEn} el={d.labelEl} wrap /> — {Math.round((d.score / d.maxScore) * 100)}%
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        <BilingualText en={d.recommendations[0]?.en ?? ''} el={d.recommendations[0]?.el} />
        </p>
        </div>
        </div>
        ))}
        {weakDims.length === 0 && (
        <div className="flex items-center gap-2.5 p-3">
        <CheckCircle2 className={cn('icon-sm flex-shrink-0', STATUS.success.icon)} />
        <p className="text-xs text-muted-foreground"><BilingualText en={readinessEn('all_dimensions_strong')} el={readinessEl('all_dimensions_strong')} /></p>
        </div>
        )}
        <AskAiButton
        variant="ghost"
        className="w-full"
        prompt={askPrompt}
        labelEn={readinessEn('ask_ai_plan')}
        labelEl={readinessEl('ask_ai_plan')}
        />
        </CardContent>
        </Card>
      </div>,
    },
    {
      id: 'history',
      glyph: 'chart',
      labelEn: 'Score history',
      labelEl: 'Ιστορικό βαθμολογίας',
      content: <div className="space-y-3">
        <Card>
        <CardContent className="p-4">
        <p className="mb-2.5 text-xs leading-snug text-muted-foreground"><BilingualText en={readinessEn('score_change_7_weeks')} el={readinessEl('score_change_7_weeks')} compact wrap /></p>
        {isDemo ? <>
        <div className="flex items-end gap-2.5">
        <span className="text-xl font-bold tabular-nums">{overallScore}</span>
        <span className={cn('mb-1 flex items-center gap-0.5 text-xs', TREND.up)}>
        <TrendingUp className="icon-sm" />+{overallScore - demoHistory[0].score}{' '}
        <BilingualText en={readinessEn('pts')} el={readinessEl('pts')} compact />
        </span>
        </div>
        {/* 40px, not 24. The seven weeks span 38→61, and in a 20px
        strip that whole journey was five pixels — the bars read as
        one flat row. The baseline stays at zero rather than at the
        minimum, so the rise is shown without being exaggerated. */}
        <div className="mt-3 flex h-10 items-end gap-1 lg:h-[40px]">
        {demoHistory.map((h, i) => (
        // Dimmed once, not twice: bg-primary/40 under an opacity
        // starting at 0.4 left the oldest bar at ~16% alpha, and the
        // 38→61 climb read as one flat row of pale blocks. Full
        // colour, and the fade alone carries the passage of weeks.
        <div
        key={i}
        className="flex-1 rounded-sm bg-primary transition-all"
        style={{ height: `${Math.max(h.score, 4)}%`, opacity: 0.35 + (i / (demoHistory.length - 1 || 1)) * 0.65 }}
        />
        ))}
        </div>
        </> : <p className="text-sm text-muted-foreground"><BilingualText en="Readiness history is not available yet." el="Το ιστορικό ετοιμότητας δεν είναι ακόμη διαθέσιμο." /></p>}
        </CardContent>
        </Card>
      </div>,
    },
    {
      id: 'next',
      glyph: 'flag',
      labelEn: 'Next steps',
      labelEl: 'Επόμενα βήματα',
      content: <div className="space-y-3">
        {/* Quick Actions */}
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Button asChild className="h-auto min-h-16 flex-col gap-1.5 py-4">
        <Link href="/builder">
        <CfbGlyph name="builder" className="icon-sm" />
        <span className="text-sm font-medium"><BilingualText en={readinessEn('open_builder')} el={readinessEl('open_builder')} compact /></span>
        <span className="text-xs text-muted-foreground"><BilingualText en={readinessEn('build_workspace')} el={readinessEl('build_workspace')} compact /></span>
        </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto min-h-16 flex-col gap-1.5 py-4">
        <Link href="/mentoring">
        <CfbGlyph name="mentor" className="icon-sm" />
        <span className="text-sm font-medium"><BilingualText en={readinessEn('find_mentor')} el={readinessEl('find_mentor')} compact /></span>
        <span className="text-xs text-muted-foreground"><BilingualText en={readinessEn('get_expert_guidance')} el={readinessEl('get_expert_guidance')} compact /></span>
        </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto min-h-16 flex-col gap-1.5 py-4">
        <Link href="/programs">
        <CfbGlyph name="award" className="icon-sm" />
        <span className="text-sm font-medium"><BilingualText en={readinessEn('browse_programs')} el={readinessEl('browse_programs')} compact /></span>
        <span className="text-xs text-muted-foreground"><BilingualText en={readinessEn('accelerators_cohorts')} el={readinessEl('accelerators_cohorts')} compact /></span>
        </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto min-h-16 flex-col gap-1.5 py-4">
        <Link href="/expert-reviews">
        <CfbGlyph name="shield" className="icon-sm" />
        <span className="text-sm font-medium"><BilingualText en={readinessEn('expert_review')} el={readinessEl('expert_review')} compact /></span>
        <span className="text-xs text-muted-foreground"><BilingualText en={readinessEn('expert_review_hint')} el={readinessEl('expert_review_hint')} compact /></span>
        </Link>
        </Button>
        </div>
      </div>,
    },
  ];
  return (
    <AppShell
      rail={rail} actions={reassessAction} showHelp askAi={askPrompt}>
      <div className="min-w-0 space-y-6 overflow-x-clip">
        {apiData.lastAssessedAt && (
          <p className="text-sm text-muted-foreground">
            <BilingualText
              en={`${readinessEn('last_assessed_prefix')} ${formatShortDate(apiData.lastAssessedAt, 'en')}. ${readinessEn('reassess_reloads')}`}
              el={`${readinessEl('last_assessed_prefix')} ${formatShortDate(apiData.lastAssessedAt, 'el')}. ${readinessEl('reassess_reloads')}`}
            />
          </p>
        )}
        {isDemo && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-info-border bg-status-info-bg p-4 text-sm text-status-info">
            <BilingualText
              en="Demo showcase — tick criteria freely; scores recalculate and nothing is kept."
              el="Επίδειξη — σημειώστε ελεύθερα κριτήρια· οι βαθμολογίες επανυπολογίζονται και τίποτα δεν αποθηκεύεται."
            />
            {!overlayIsEmpty(demoOverlay) && (
              <Button variant="outline" size="sm" onClick={() => setDemoOverlay(resetReadinessOverlay())}>
                <BilingualText en="Reset the demo" el="Επαναφορά επίδειξης" compact />
              </Button>
            )}
          </div>
        )}

        {/* One card now: the two audience readouts moved to the rail, so the
            gauge no longer shares a row with two restatements of itself. */}
        <div className="grid min-w-0 gap-5">
          <Card className="min-w-0 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-indigo-500/5 to-transparent lg:col-span-1">
            <CardContent className="flex h-full flex-col items-center gap-4 p-5 text-center">
              <ScoreEmblem
                score={overallScore}
                dimensions={dimensions.map((d) => ({
                  key: d.key,
                  pct: Math.round((d.score / d.maxScore) * 100),
                  labelEn: d.labelEn,
                  labelEl: d.labelEl,
                }))}
              />
              <div>
                <p className="font-semibold"><BilingualText en={readinessEn('overall_readiness')} el={readinessEl('overall_readiness')} /></p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <BilingualText
                    en={`Based on ${dimensions.length} dimensions · ${doneCriteria}/${totalCriteria} criteria`}
                    el={`Βάσει ${dimensions.length} διαστάσεων · ${doneCriteria}/${totalCriteria} κριτήρια`}
                    wrap
                  />
                </p>
              </div>
              {nextOpen && (
                <Link
                  href={`#dim-${nextOpen.dimKey}`}
                  className="w-full rounded-2xl border border-border/70 bg-card/80 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                >
                  <p className="text-[11px] text-muted-foreground">
                    <BilingualText en={readinessEn('next_open')} el={readinessEl('next_open')} wrap />
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug">
                    <BilingualText en={nextOpen.name} el={nextOpen.nameEl ?? nextOpen.name} wrap />
                    <span className="ml-1 text-muted-foreground">· {nextOpen.weight}%</span>
                  </p>
                </Link>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {weakDims.slice(0, 3).map((d) => (
                  <Link key={d.key} href={`#dim-${d.key}`}>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <AlertCircle className="icon-sm" />
                      <BilingualText en={d.labelEn} el={d.labelEl} compact />
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Radar + AI Insights row */}
        <div className="grid min-w-0 gap-5">
          <div className="min-w-0">
            <ReadinessRadarChart dimensions={dimensions} />
          </div>
        </div>

        {/* Tabs: Dimensions / Priority Actions / Benchmarks / History */}
        <Tabs defaultValue="dimensions" className="min-w-0">
          <TabsList className="flex w-full justify-start">
            <TabsTrigger value="dimensions" className="px-3 text-xs sm:px-4 sm:text-sm"><BilingualText en={readinessEn('tab_all_dimensions')} el={readinessEl('tab_all_dimensions')} compact /></TabsTrigger>
            <TabsTrigger value="actions" className="px-3 text-xs sm:px-4 sm:text-sm"><BilingualText en={readinessEn('tab_priority_actions')} el={readinessEl('tab_priority_actions')} compact /></TabsTrigger>
            <TabsTrigger value="benchmarks" className="px-3 text-xs sm:px-4 sm:text-sm"><BilingualText en={readinessEn('tab_benchmarks')} el={readinessEl('tab_benchmarks')} compact /></TabsTrigger>
            <TabsTrigger value="history" className="px-3 text-xs sm:px-4 sm:text-sm"><BilingualText en={readinessEn('tab_history')} el={readinessEl('tab_history')} compact /></TabsTrigger>
          </TabsList>

          <TabsContent value="dimensions" className="mt-5">
            {/* The showcase has a workspace - /builder opens it - and its own
                banner above already says the scores are illustrative. Telling a
                demo visitor that no workspace is connected contradicted the
                page one click away. */}
            {!workspaceId && !isDemo && (
              <div className={cn('mb-5 flex items-start gap-3 rounded-xl border p-4', STATUS.warning.border, STATUS.warning.bg)}>
                <AlertCircle className={cn('mt-0.5 icon-sm flex-shrink-0', STATUS.warning.icon)} />
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium', STATUS.warning.text)}><BilingualText en={readinessEn('no_workspace_title')} el={readinessEl('no_workspace_title')} /></p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    <BilingualText en={readinessEn('no_workspace_desc')} el={readinessEl('no_workspace_desc')} />
                    {' '}
                    <Link href="/builder" className="underline hover:no-underline"><BilingualText en={readinessEn('open_builder')} el={readinessEl('open_builder')} compact /></Link>
                  </p>
                </div>
              </div>
            )}
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              {dimensions.map((dim) => (
                <DimensionCard
                  key={dim.key}
                  dim={dim}
                  canToggle={isDemo || (!!workspaceId && mode === 'live' && !isError)}
                  onToggle={handleToggle}
                  isMutating={toggleMutation.isPending}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="spark" className={cn('icon-sm', STATUS.warning.icon)} />
                  <BilingualText en={readinessEn('priority_action_plan')} el={readinessEl('priority_action_plan')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weakDims.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className={cn('mx-auto mb-3 h-10 w-10', STATUS.success.icon)} />
                    <p className="font-medium"><BilingualText en={readinessEn('all_dimensions_excellent')} el={readinessEl('all_dimensions_excellent')} /></p>
                    <p className="mt-1 text-sm text-muted-foreground"><BilingualText en={readinessEn('keep_iterating')} el={readinessEl('keep_iterating')} /></p>
                  </div>
                ) : (
                  weakDims
                    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))
                    .flatMap((d) =>
                      d.recommendations.map((rec, i) => ({
                        key: `${d.key}-${i}`,
                        dimKey: d.key,
                        labelEn: d.labelEn,
                        labelEl: d.labelEl,
                        pct: Math.round((d.score / d.maxScore) * 100),
                        status: scoreToStatus(Math.round((d.score / d.maxScore) * 100)),
                        rec,
                      }))
                    )
                    .slice(0, 8)
                    .map((item) => {
                      const itemColors = scoreColors(item.status);
                      return (
                      <div key={item.key} className="flex items-start gap-3 rounded-xl border border-border/40 bg-secondary/50 p-3.5">
                        <div className={cn('mt-0.5 rounded-full p-2', itemColors.bg)}>
                          <ChevronRight className={cn('icon-sm', itemColors.icon)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold"><BilingualText en={item.labelEn} el={item.labelEl} compact /></p>
                            <Badge variant="outline" className={cn('border text-xs', itemColors.chip)}>
                              {item.pct}%
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            <BilingualText en={item.rec.en} el={item.rec.el} />
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" asChild>
                              <Link href={`#dim-${item.dimKey}`}>
                                <BilingualText en={readinessEn('jump_to')} el={readinessEl('jump_to')} compact />
                              </Link>
                            </Button>
                            <AIInsightButton
                              className="h-8"
                              prompt={`Help me improve ${item.labelEn} readiness (${item.pct}%). Next step: ${item.rec.en}`}
                            />
                          </div>
                        </div>
                      </div>
                    );})
                )}
                {/* The AI plan lives in the rail now. Rather than a second
                    button with the same prompt, this opens that section - the
                    reader ends up at the panel, not at a copy of its trigger. */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => openRailSection('plan')}
                >
                  <CfbGlyph name="spark" className="icon-sm mr-1.5" aria-hidden="true" />
                  <BilingualText en="Open the AI plan" el="Άνοιγμα πλάνου AI" compact />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarks" className="mt-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CfbGlyph name="award" className={cn('icon-sm', STATUS.accent.icon)} />
                    <BilingualText en={readinessEn('accelerator_benchmark')} el={readinessEl('accelerator_benchmark')} compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  {dimensions.map((d) => {
                    const pct = Math.round((d.score / d.maxScore) * 100);
                    return (
                      <div key={d.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground"><BilingualText en={d.labelEn} el={d.labelEl} compact /></span>
                          <span className="font-medium tabular-nums">{pct}%</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted/50">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-status-accent/60" style={{ width: `${pct}%` }} />
                          <div className="absolute inset-y-0 w-0.5 rounded-full bg-status-accent" style={{ left: '65%' }} title={readinessEn('target_65')} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="pt-1 text-xs text-muted-foreground">
                    <span className="mr-1 inline-block h-3 w-0.5 align-middle bg-status-accent" />
                    <BilingualText en={readinessEn('accel_threshold_line')} el={readinessEl('accel_threshold_line')} compact />
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CfbGlyph name="shield" className={cn('icon-sm', STATUS.success.icon)} />
                    <BilingualText en={readinessEn('investor_benchmark')} el={readinessEl('investor_benchmark')} compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  {dimensions.map((d) => {
                    const pct = Math.round((d.score / d.maxScore) * 100);
                    return (
                      <div key={d.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground"><BilingualText en={d.labelEn} el={d.labelEl} compact /></span>
                          <span className="font-medium tabular-nums">{pct}%</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted/50">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-status-success/60" style={{ width: `${pct}%` }} />
                          <div className="absolute inset-y-0 w-0.5 rounded-full bg-status-success" style={{ left: '70%' }} title={readinessEn('target_70')} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="pt-1 text-xs text-muted-foreground">
                    <span className="mr-1 inline-block h-3 w-0.5 align-middle bg-status-success" />
                    <BilingualText en={readinessEn('investor_threshold_line')} el={readinessEl('investor_threshold_line')} compact />
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5">
              <CardHeader>
                <CardTitle className="text-sm"><BilingualText en={readinessEn('dimension_weights')} el={readinessEl('dimension_weights')} /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {dimensions.map((d) => {
                    const pct = Math.round((d.score / d.maxScore) * 100);
                    const accelContrib = Math.round(pct * d.acceleratorWeight / 100);
                    const investContrib = Math.round(pct * d.investorWeight / 100);
                    return (
                      <div key={d.key} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
                        <CfbGlyph name={d.glyph} className="h-4 w-4 flex-shrink-0 text-primary-accessible" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium"><BilingualText en={d.labelEn} el={d.labelEl} compact /></p>
                          <p className="text-xs text-muted-foreground">
                            <BilingualText en={`${readinessEn('score_pct')}: ${pct}%`} el={`${readinessEl('score_pct')}: ${pct}%`} compact />
                          </p>
                        </div>
                        <div className="space-y-0.5 text-right text-xs">
                          <p className={cn('font-medium', STATUS.accent.text)}>+{accelContrib} <span className="font-normal text-muted-foreground"><BilingualText en={readinessEn('accel_short')} el={readinessEl('accel_short')} compact /></span></p>
                          <p className={cn('font-medium', STATUS.success.text)}>+{investContrib} <span className="font-normal text-muted-foreground"><BilingualText en={readinessEn('invest_short')} el={readinessEl('invest_short')} compact /></span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-5">
            {isDemo ? <div className="space-y-5">
              <ScoreHistoryChart history={demoHistory} />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CfbGlyph name="chart" className="icon-sm text-muted-foreground" />
                    <BilingualText en={readinessEn('assessment_log')} el={readinessEl('assessment_log')} compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {DEMO_HISTORY.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-border/40 py-3 last:border-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-accessible">
                        {h.week}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{h.score}% <BilingualText en={readinessEn('overall_short')} el={readinessEl('overall_short')} compact /></span>
                          {i < DEMO_HISTORY.length - 1 && (
                            <span className={cn('flex items-center gap-0.5 text-xs', TREND.up)}>
                              <TrendingUp className="icon-sm" />+{h.score - DEMO_HISTORY[DEMO_HISTORY.length - 2 - i].score}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <BilingualText en={readinessEn('accelerator')} el={readinessEl('accelerator')} compact />: {h.accel}% · <BilingualText en={readinessEn('investor')} el={readinessEl('investor')} compact />: {h.invest}%
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <BilingualText en={STATUS_LABEL[scoreToStatus(h.score)].en} el={STATUS_LABEL[scoreToStatus(h.score)].el} compact />
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div> : <Card><CardContent className="p-6 text-sm text-muted-foreground"><BilingualText en="Historical assessments are not available. The current score reflects saved criteria, not a simulated trend." el="Οι ιστορικές αξιολογήσεις δεν είναι διαθέσιμες. Η τρέχουσα βαθμολογία βασίζεται σε αποθηκευμένα κριτήρια, όχι σε προσομοίωση τάσης." /></CardContent></Card>}
          </TabsContent>
        </Tabs>

      </div>
    </AppShell>
  );
}
