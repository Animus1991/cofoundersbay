'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getWorkspaceReadiness,
  getWorkspaceMomentum,
  getWorkspaceContributions,
  getWorkspaceMentorMetrics,
  type GamificationReadinessSummary,
  type GamificationMomentumSummary,
  type GamificationContributionSummary,
  type GamificationMentorMetrics,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Target,
  Zap,
  Users,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Star,
  Activity,
  BarChart3,
  BookOpen,
} from 'lucide-react';

// ── Readiness dimension display config ───────────────────────────────────────

const DIMENSION_CONFIG: Array<{
  key: keyof GamificationReadinessSummary['dimensions'];
  label: string;
  icon: typeof Target;
  description: string;
}> = [
  { key: 'problemClarity',       label: 'Problem Clarity',       icon: Target,        description: 'Problem statement definition' },
  { key: 'solutionClarity',      label: 'Solution Clarity',      icon: CheckCircle2,  description: 'Solution artifact completeness' },
  { key: 'marketUnderstanding',  label: 'Market Understanding',  icon: BarChart3,     description: 'Market analysis depth' },
  { key: 'productDefinition',    label: 'Product Definition',    icon: BookOpen,      description: 'PRD / MVP spec completeness' },
  { key: 'teamCompleteness',     label: 'Team Completeness',     icon: Users,         description: 'Co-founders, mentors, collaborators' },
  { key: 'executionReadiness',   label: 'Execution Readiness',   icon: TrendingUp,    description: 'Milestones × completion rate' },
  { key: 'validationScore',      label: 'Validation Score',      icon: Star,          description: 'Expert reviews + feedback applied' },
  { key: 'artifactCompleteness', label: 'Artifact Completeness', icon: Activity,      description: 'Avg document completion %' },
];

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  if (score >= 25) return 'text-orange-600 dark:text-orange-400';
  return 'text-rose-600 dark:text-rose-400';
}

function scoreBarColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-rose-500';
}

function scoreBadgeVariant(score: number): 'default' | 'secondary' | 'outline' {
  if (score >= 75) return 'default';
  if (score >= 40) return 'secondary';
  return 'outline';
}

// ── Readiness Panel ───────────────────────────────────────────────────────────

interface ReadinessPanelProps {
  workspaceId: string;
  compact?: boolean;
}

export function WorkspaceReadinessPanel({ workspaceId, compact = false }: ReadinessPanelProps) {
  const { data, isLoading } = useQuery<GamificationReadinessSummary>({
    queryKey: ['gamification-readiness', workspaceId],
    queryFn: () => getWorkspaceReadiness(workspaceId),
    staleTime: 2 * 60_000,
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const dims = compact ? DIMENSION_CONFIG.slice(0, 4) : DIMENSION_CONFIG;
  const isGated = data.bottleneckFactor < 0.95;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="icon-sm text-primary" aria-hidden="true" />
            Startup Readiness
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-2xl font-bold tabular-nums', scoreColor(data.score))}>
              {data.score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
        <Progress value={data.score} className="h-2 mt-1" />
        {isGated && (
          <p className="text-2xs text-amber-600 dark:text-amber-400 mt-1">
            Bottleneck suppression active (×{data.bottleneckFactor.toFixed(2)}) — strengthen critical dimensions
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5">
        {dims.map(({ key, label, icon: Icon }) => {
          const score   = data.dimensions[key];
          const detail  = data.dimensionBreakdown?.[key];
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium truncate">{label}</span>
                  {detail?.weight && (
                    <span className="text-2xs text-muted-foreground hidden md:block">
                      ×{(detail.weight * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {detail?.detail && (
                    <span className="text-2xs text-muted-foreground hidden sm:block max-w-[140px] truncate">
                      {detail.detail}
                    </span>
                  )}
                  <Badge
                    variant={scoreBadgeVariant(score)}
                    className="text-2xs px-1.5 py-0 h-4 tabular-nums"
                  >
                    {score}%
                  </Badge>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', scoreBarColor(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
        {compact && (
          <p className="text-2xs text-muted-foreground pt-1">
            Showing top 4 dimensions · Full view in Readiness tab
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Team Momentum Panel ───────────────────────────────────────────────────────

interface MomentumPanelProps {
  workspaceId: string;
}

export function TeamMomentumPanel({ workspaceId }: MomentumPanelProps) {
  const { data, isLoading } = useQuery<GamificationMomentumSummary>({
    queryKey: ['gamification-momentum', workspaceId],
    queryFn: () => getWorkspaceMomentum(workspaceId),
    staleTime: 2 * 60_000,
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-4 w-36" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const bd = data.breakdown;
  const momentumLevel = bd.momentumLevel ?? (data.score >= 75 ? 'High-Velocity' : data.score >= 55 ? 'Strong' : data.score >= 35 ? 'Steady' : data.score >= 15 ? 'Low' : 'Stalled');
  const momentumColor = momentumLevel === 'High-Velocity' || momentumLevel === 'Strong' ? 'text-emerald-600 dark:text-emerald-400' : momentumLevel === 'Steady' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

  const componentBars = [
    { label: 'Velocity',           value: bd.velocityScore             ?? 0 },
    { label: 'Recent Activity',    value: bd.recentActivityScore       ?? 0 },
    { label: 'Collaboration',      value: bd.collaborationDensityScore ?? 0 },
    { label: 'Feedback Loops',     value: bd.feedbackLoopScore         ?? 0 },
    { label: 'Milestone Rate',     value: bd.milestoneRateScore        ?? 0 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="icon-sm text-amber-500" aria-hidden="true" />
            Team Momentum
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium', momentumColor)}>{momentumLevel}</span>
            <span className={cn('text-2xl font-bold tabular-nums', scoreColor(data.score))}>
              {data.score}
              <span className="text-xs text-muted-foreground font-normal">/100</span>
            </span>
          </div>
        </div>
        <Progress value={data.score} className="h-1.5 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-lg font-bold tabular-nums">{data.velocity.toFixed(2)}</p>
            <p className="text-2xs text-muted-foreground">actions/day (14d)</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-lg font-bold tabular-nums">{bd.activeContributors}</p>
            <p className="text-2xs text-muted-foreground">contributors</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-lg font-bold tabular-nums">{bd.meaningful7d ?? 0}</p>
            <p className="text-2xs text-muted-foreground">actions (7d)</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-lg font-bold tabular-nums">{bd.feedbackLoopsCompleted}</p>
            <p className="text-2xs text-muted-foreground">feedback loops</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {componentBars.map(({ label, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full', scoreBarColor(value))} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Contribution Panel ────────────────────────────────────────────────────────

interface ContributionPanelProps {
  workspaceId: string;
}

export function ContributionPanel({ workspaceId }: ContributionPanelProps) {
  const { data: contributors, isLoading } = useQuery<GamificationContributionSummary[]>({
    queryKey: ['gamification-contributions', workspaceId],
    queryFn: () => getWorkspaceContributions(workspaceId),
    staleTime: 2 * 60_000,
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-4 w-40" /></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!contributors || contributors.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="icon-sm text-blue-500" aria-hidden="true" />
          Contributions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contributors.slice(0, 5).map((c, idx) => {
          const bd = c.breakdown;
          const recentActivity = (bd.recentArtifactsCreated ?? 0) + (bd.recentArtifactsImproved ?? 0) + (bd.recentFeedbackApplied ?? 0);
          return (
            <div key={c.userId} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">#{idx + 1}</span>
                  <span className="text-xs font-medium truncate">{c.userId.slice(0, 8)}…</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-2xs text-muted-foreground">
                  <span title="Artifacts created/improved">{bd.artifactsCreated}C·{bd.artifactsImproved}I</span>
                  <span title="Feedback applied">·{bd.feedbackApplied}FA</span>
                  {recentActivity > 0 && (
                    <span title="Recent activity (14d)" className="text-emerald-600 dark:text-emerald-400">·{recentActivity}↑</span>
                  )}
                  <Badge variant={scoreBadgeVariant(c.score)} className="text-2xs px-1.5 py-0 h-4 ml-1">
                    {c.score}
                  </Badge>
                </div>
              </div>
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full', scoreBarColor(c.score))}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              {c.rawScore > 0 && idx === 0 && (
                <p className="text-2xs text-muted-foreground">{c.explain}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Mentor Metrics Panel ──────────────────────────────────────────────────────

interface MentorMetricsPanelProps {
  workspaceId: string;
}

export function MentorMetricsPanel({ workspaceId }: MentorMetricsPanelProps) {
  const { data, isLoading } = useQuery<GamificationMentorMetrics>({
    queryKey: ['gamification-mentor-metrics', workspaceId],
    queryFn: () => getWorkspaceMentorMetrics(workspaceId),
    staleTime: 2 * 60_000,
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-4 w-44" /></CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="icon-sm text-violet-500" aria-hidden="true" />
            Mentor Feedback Loop
          </CardTitle>
          <Badge variant={scoreBadgeVariant(data.improvementScore)} className="tabular-nums">
            {data.improvementScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-base font-bold">{data.feedbackCount}</p>
            <p className="text-2xs text-muted-foreground">received</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-base font-bold">{data.appliedFeedbackCount}</p>
            <p className="text-2xs text-muted-foreground">applied</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-base font-bold">{Math.round(data.appliedFeedbackRate * 100)}%</p>
            <p className="text-2xs text-muted-foreground">apply rate</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {[
            { label: 'Apply Rate',  value: Math.round((data.appliedFeedbackRate ?? 0) * 100) },
            { label: 'Speed',       value: Math.round((data.speedScore ?? 0) * 100) },
            { label: 'Depth',       value: Math.round((data.depthScore ?? 0) * 100) },
            { label: 'Low Burden',  value: Math.round((data.burdenScore ?? 0) * 100) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value}%</span>
              </div>
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full', scoreBarColor(value))} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {(data.unresolvedFeedback ?? 0) > 0 && (
          <p className="text-2xs text-amber-600 dark:text-amber-400">
            {data.unresolvedFeedback} unresolved feedback item{data.unresolvedFeedback !== 1 ? 's' : ''} — consider applying
          </p>
        )}

        {data.avgResponseTimeHrs > 0 && (
          <p className="text-2xs text-muted-foreground">
            Avg. response time: <span className="font-medium">{data.avgResponseTimeHrs.toFixed(1)}h</span>
          </p>
        )}
        {data.lastFeedbackAt && (
          <p className="text-2xs text-muted-foreground">
            Last feedback: {new Date(data.lastFeedbackAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Composite panel (all four in a responsive grid) ───────────────────────────

interface WorkspaceMetricsPanelsProps {
  workspaceId: string;
  compact?: boolean;
}

export function WorkspaceMetricsPanels({ workspaceId, compact = false }: WorkspaceMetricsPanelsProps) {
  if (!workspaceId) return null;

  return (
    <div className="space-y-3">
      <WorkspaceReadinessPanel workspaceId={workspaceId} compact={compact} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TeamMomentumPanel workspaceId={workspaceId} />
        <MentorMetricsPanel workspaceId={workspaceId} />
      </div>
      <ContributionPanel workspaceId={workspaceId} />
    </div>
  );
}
