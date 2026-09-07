'use client';

import Link from 'next/link';
import {
  ArrowRight, Briefcase, Calendar, ChevronRight,
  FileText, Flag, Lightbulb, MessageCircle, Rocket, Sparkles,
  Target, TrendingUp, UserPlus, Users, Zap, DollarSign, Eye,
  Award, BrainCircuit, GraduationCap, BarChart3,
  BookOpen, Store, Globe, Shield, Gauge, Activity,
  CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';
import {
  getDashboardStats,
  getMeProfile,
  getRecommendations,
  listConnectionRequests,
  getVentureReadiness,
  getMyXP,
  type SearchHit,
} from '@/lib/api';
import { OnboardingChecklist, buildOnboardingSteps } from '@/components/gamification/OnboardingChecklist';
import { NextActionBanner, deriveNextAction } from '@/components/gamification/NextActionBanner';
import { VentureReadinessCard } from '@/components/gamification/VentureReadinessCard';
import { BehavioralNudge } from '@/components/behavioral/BehavioralNudge';
import { queryKeys } from '@/lib/query-keys';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { AIInsightButton } from '@/components/ai/AIInsightButton';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Calendar date N days from today at noon, so demo due-dates stay in the future. */
function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Demo data ─────────────────────────────────────────────────────────────────

type DemoMilestone = {
  id: string;
  title: string;
  status: 'in_progress' | 'pending' | 'completed';
  progress: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
};

function getDemoMilestones(): DemoMilestone[] {
  return [
    { id: '1', title: 'Complete MVP v1', status: 'in_progress', progress: 65, dueDate: isoDaysFromNow(21), priority: 'high' },
    { id: '2', title: 'First 100 active users', status: 'in_progress', progress: 23, dueDate: isoDaysFromNow(36), priority: 'high' },
    { id: '3', title: 'Seed funding round', status: 'pending', progress: 10, dueDate: isoDaysFromNow(90), priority: 'medium' },
    { id: '4', title: 'Build founding team', status: 'pending', progress: 0, dueDate: isoDaysFromNow(45), priority: 'high' },
  ];
}

const DEMO_ACTIVITY = [
  { id: '1', type: 'match', text: 'New 87% match — Nikos Papadakis, CTO', time: '2h ago', icon: Sparkles, color: 'text-primary' },
  { id: '2', type: 'connection', text: 'Elena Papadopoulos accepted your request', time: '5h ago', icon: UserPlus, color: 'text-emerald-500' },
  { id: '3', type: 'message', text: 'New message from Marcus Chen', time: '8h ago', icon: MessageCircle, color: 'text-blue-500' },
  { id: '4', type: 'view', text: 'Your profile was viewed 12 times today', time: '1d ago', icon: Eye, color: 'text-amber-500' },
];

const READINESS_DIM_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  problemClarity:      { icon: Lightbulb,    color: 'text-amber-500' },
  solutionClarity:     { icon: Rocket,       color: 'text-emerald-500' },
  marketUnderstanding: { icon: Target,       color: 'text-blue-500' },
  productDefinition:   { icon: Briefcase,    color: 'text-indigo-500' },
  teamCompleteness:    { icon: Users,        color: 'text-red-500' },
  executionReadiness:  { icon: TrendingUp,   color: 'text-orange-500' },
  validationScore:     { icon: Award,        color: 'text-violet-500' },
  artifactCompleteness:{ icon: FileText,     color: 'text-teal-500' },
};

const FUNDRAISING_DEMO = {
  roundName: 'Pre-Seed Round',
  targetAmount: 300000,
  raisedAmount: 85000,
  currency: '€',
  leadCount: 8,
  committedCount: 2,
};

type EventType = 'mentorship' | 'deadline' | 'event' | 'pitch';
const EVENT_CONFIG: Record<EventType, { color: string; bg: string }> = {
  mentorship: { color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  deadline: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  event: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  pitch: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

function getDemoEvents() {
  return [
    { id: '1', title: 'Mentor Session — Dr. Sarah Chen', type: 'mentorship' as EventType, date: isoDaysFromNow(2), time: '14:00', daysLeft: 2 },
    { id: '2', title: 'Pitch Deck Deadline', type: 'deadline' as EventType, date: isoDaysFromNow(4), time: '23:59', daysLeft: 4 },
    { id: '3', title: 'Startup Networking Mixer', type: 'event' as EventType, date: isoDaysFromNow(9), time: '18:00', daysLeft: 9 },
    { id: '4', title: 'Investor Demo Day', type: 'pitch' as EventType, date: isoDaysFromNow(17), time: '10:00', daysLeft: 17 },
  ];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, trend, href, accent,
}: {
  icon: React.ElementType; label: string; value: number | string;
  trend?: { value: number; positive: boolean }; href?: string; accent?: string;
}) {
  const content = (
    <Card className="relative h-full overflow-hidden transition-all hover:shadow-md cursor-pointer">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">{label}</p>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
            {trend && (
              <p className={cn('text-[11px] font-medium sm:text-xs', trend.positive ? 'text-emerald-500' : 'text-red-500')}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% this week
              </p>
            )}
          </div>
          <div className={cn('shrink-0 rounded-lg p-1.5 sm:p-2', accent ?? 'bg-primary/10')}>
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', accent ? 'text-white' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function CardLinkHeader({
  icon: Icon,
  title,
  href,
  linkLabel,
  iconClassName,
}: {
  icon: React.ElementType;
  title: string;
  href: string;
  linkLabel: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <CardTitle className="flex min-w-0 items-center gap-2 text-base">
        <Icon className={cn('icon-sm shrink-0', iconClassName)} />
        <span className="min-w-0 truncate">{title}</span>
      </CardTitle>
      <Link href={href} className="shrink-0">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs sm:text-sm">
          {linkLabel} <ArrowRight className="ml-1 icon-sm" />
        </Button>
      </Link>
    </div>
  );
}

function MatchPreviewCard({ match }: { match: SearchHit }) {
  const score = match.matchScore ?? 0;
  const scoreColor = score >= 85 ? 'text-emerald-500' : score >= 70 ? 'text-blue-500' : 'text-amber-500';
  return (
    <Link href={`/matches/${match.userId}`} className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={match.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {match.displayName?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{match.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{match.headline}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn('flex items-center gap-0.5 text-sm font-bold tabular-nums', scoreColor)}>
          <Sparkles className="icon-sm" />{score}%
        </span>
        <ChevronRight className="hidden h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
      </div>
    </Link>
  );
}

function MilestoneRow({ milestone }: { milestone: DemoMilestone }) {
  const isComplete = milestone.status === 'completed';
  const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && !isComplete;
  return (
    <div className="flex items-center gap-3">
      <div className={cn('shrink-0 rounded-full p-1.5', isComplete ? 'bg-emerald-500/10' : isOverdue ? 'bg-red-500/10' : 'bg-primary/10')}>
        {isComplete
          ? <CheckCircle2 className="icon-sm text-emerald-500" />
          : isOverdue
          ? <AlertCircle className="icon-sm text-red-500" />
          : <Circle className="icon-sm text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{milestone.title}</p>
          {milestone.priority === 'high' && <Badge variant="destructive" size="sm" className="shrink-0">High</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Progress value={milestone.progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{milestone.progress}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Due {new Date(milestone.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}

export default function FounderDashboardContent() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();
  const { messages: unreadMessages } = useUnreadCounts();

  const { data: profile } = useQuery({
    queryKey: queryKeys.profileMe,
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: hasSession && mounted,
  });

  const { data: recommendations } = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: () => getRecommendations({ limit: 5 }),
    enabled: hasSession && mounted,
  });

  const { data: connectionRequests } = useQuery({
    queryKey: queryKeys.connectionsPending,
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    enabled: hasSession && mounted,
  });

  const { data: xpData } = useQuery({
    queryKey: queryKeys.xpMe,
    queryFn: getMyXP,
    enabled: hasSession && mounted,
    staleTime: 5 * 60_000,
  });

  const { data: vrs } = useQuery({
    queryKey: ['venture-readiness'],
    queryFn: getVentureReadiness,
    enabled: hasSession && mounted,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = profile?.profile?.displayName || 'Founder';
  const pendingRequests = connectionRequests?.connections?.filter((r: any) => r.status === 'pending')?.length ?? 0;
  const profilePct = profile?.hasCompletedOnboarding ? 100 : 52;
  const avgReadiness = vrs?.overall ?? 0;
  const fundingPct = Math.round((FUNDRAISING_DEMO.raisedAmount / FUNDRAISING_DEMO.targetAmount) * 100);
  const demoMilestones = getDemoMilestones();
  const demoEvents = getDemoEvents();

  const onboardingSteps = buildOnboardingSteps({
    hasProfile:      !!(profile?.profile?.displayName && profile?.profile?.headline),
    hasPreferences:  !!((profile?.profile as any)?.lookingFor && ((profile?.profile as any)?.lookingFor as unknown[])?.length > 0),
    hasConnection:   (vrs?.signals?.connectionCount ?? 0) > 0,
    hasBoard:        (vrs?.signals?.boardCount ?? 0) > 0,
    hasArtifact:     (vrs?.signals?.docCount ?? 0) > 0,
  });

  const nextAction = deriveNextAction({
    hasProfile:      !!(profile?.profile?.displayName && profile?.profile?.headline),
    hasPreferences:  !!((profile?.profile as any)?.lookingFor && ((profile?.profile as any)?.lookingFor as unknown[])?.length > 0),
    connectionCount: vrs?.signals?.connectionCount ?? 0,
    boardCount:      vrs?.signals?.boardCount ?? 0,
    docCount:        vrs?.signals?.docCount ?? 0,
    vrsLowestKey:    vrs?.lowestDimension?.key,
    pendingRequests,
    unreadMessages,
  });

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-w-0 space-y-6 overflow-x-clip py-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {getTimeBasedGreeting()}, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              Your startup command center — track progress, find team, and close your round.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <AIInsightButton
              prompt="Summarize my founder graph and tell me the next action: intros, matches, messages, or profile gaps."
              className="h-8"
            />
            <Badge variant="outline" className="h-8 gap-1.5">
              <Rocket className="icon-sm" /> Founder
            </Badge>
            <Link href="/readiness">
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Gauge className="icon-sm" />
                Readiness: {avgReadiness}%
              </Button>
            </Link>
          </div>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist steps={onboardingSteps} userName={displayName} />

        {/* Next Action Banner — only when no pending requests (handled by checklist otherwise) */}
        {nextAction && <NextActionBanner action={nextAction} />
        }

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Profile Views (7d)" value={stats?.activeProfiles ?? 48} trend={{ value: 12, positive: true }} href="/analytics" accent="bg-primary" />
          <StatCard icon={Sparkles} label="New Matches" value={stats?.matchesThisWeek ?? 7} trend={{ value: 3, positive: true }} href="/matches" />
          <StatCard icon={MessageCircle} label="Unread Messages" value={unreadMessages} href="/messages" />
          <StatCard icon={Target} label="Milestone Progress" value={`${demoMilestones.filter(m => m.progress === 100).length}/${demoMilestones.length}`} href="/milestones" />
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="min-w-0 space-y-5 lg:col-span-2">

            {/* Venture Readiness Score */}
            {vrs && <VentureReadinessCard data={vrs} />}

            {/* Startup Readiness — real dimensions from VRS API */}
            {vrs && (
              <Card>
                <CardHeader className="pb-3">
                  <CardLinkHeader
                    icon={Gauge}
                    title="Startup Readiness"
                    href="/readiness"
                    linkLabel="Full report"
                    iconClassName="text-primary"
                  />
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                          strokeDasharray={`${(avgReadiness / 100) * 97.4} 97.4`}
                          className={cn(avgReadiness >= 70 ? 'stroke-emerald-500' : avgReadiness >= 50 ? 'stroke-amber-500' : 'stroke-red-500')}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-foreground">{avgReadiness}%</span>
                        <span className="text-xs text-muted-foreground">Ready</span>
                      </div>
                    </div>
                    <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      {vrs.dimensions.slice(0, 6).map((dim) => {
                        const cfg = READINESS_DIM_ICONS[dim.key] ?? { icon: Activity, color: 'text-muted-foreground' };
                        return (
                          <div key={dim.key} className="min-w-0">
                            <div className="mb-0.5 flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate text-xs text-muted-foreground">{dim.label}</span>
                              <span className={cn('shrink-0 text-xs font-semibold tabular-nums', cfg.color)}>{dim.score}%</span>
                            </div>
                            <Progress value={dim.score} className="h-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/builder" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <FileText className="icon-sm" /> Open Builder
                      </Button>
                    </Link>
                    <Link href="/expert-reviews" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <Award className="icon-sm" /> Get Expert Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fundraising widget */}
            <Card>
              <CardHeader className="pb-3">
                <CardLinkHeader
                  icon={DollarSign}
                  title="Fundraising"
                  href="/fundraising"
                  linkLabel="Open tracker"
                  iconClassName="text-emerald-500"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">Sample pipeline — live tracker is on Fundraising.</p>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{FUNDRAISING_DEMO.roundName}</p>
                      <p className="text-xl font-bold text-foreground">
                        {FUNDRAISING_DEMO.currency}{(FUNDRAISING_DEMO.raisedAmount / 1000).toFixed(0)}K
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          / {FUNDRAISING_DEMO.currency}{(FUNDRAISING_DEMO.targetAmount / 1000).toFixed(0)}K
                        </span>
                      </p>
                    </div>
                    <span className={cn(
                      'shrink-0 text-sm font-bold',
                      fundingPct >= 75 ? 'text-emerald-500' : fundingPct >= 40 ? 'text-amber-500' : 'text-muted-foreground'
                    )}>
                      {fundingPct}%
                    </span>
                  </div>
                  <Progress value={fundingPct} className="h-2.5" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="icon-sm" /> {FUNDRAISING_DEMO.leadCount} leads tracked</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="icon-sm text-emerald-500" /> {FUNDRAISING_DEMO.committedCount} committed</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/fundraising" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <TrendingUp className="icon-sm" /> Manage Pipeline
                      </Button>
                    </Link>
                    <Link href="/investors" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <Globe className="icon-sm" /> Find Investors
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Matches */}
            <Card>
              <CardHeader className="pb-3">
                <CardLinkHeader
                  icon={Sparkles}
                  title="Top Matches for You"
                  href="/matches"
                  linkLabel="View all"
                  iconClassName="text-primary"
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations?.suggestions?.slice(0, 4).map((match: SearchHit) => (
                  <MatchPreviewCard key={match.userId} match={match} />
                ))}
                {(!recommendations?.suggestions || recommendations.suggestions.length === 0) && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Complete your profile to get personalized matches</p>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                        Complete profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <CardLinkHeader
                  icon={Flag}
                  title="Milestones"
                  href="/milestones"
                  linkLabel="Manage"
                  iconClassName="text-primary"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[11px] text-muted-foreground">Sample timeline — manage live items on Milestones.</p>
                {demoMilestones.map((m) => <MilestoneRow key={m.id} milestone={m} />)}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-5">

            {/* Behavioral Nudge */}
            <BehavioralNudge surface="dashboard" />

            {/* XP Progress Strip */}
            {xpData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                    <Zap className="icon-sm text-amber-500" />
                    XP Progress
                    {(xpData.streak?.currentStreak ?? 0) > 0 && (
                      <span className="ml-auto text-xs font-normal text-orange-500">
                        🔥 {xpData.streak?.currentStreak}-day streak
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Level {xpData.level ?? 1} — {xpData.levelLabel ?? 'Member'}</span>
                    <span className="text-muted-foreground tabular-nums">{(xpData.totalXp ?? 0).toLocaleString()} XP</span>
                  </div>
                  <Progress value={xpData.levelProgress * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {xpData.xpToNextLevel > 0
                      ? `${xpData.xpToNextLevel.toLocaleString()} XP to next level`
                      : 'Maximum level reached'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Profile Strength */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="icon-sm text-primary" /> Profile Strength
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className={cn('font-bold', profilePct >= 80 ? 'text-emerald-500' : 'text-amber-500')}>{profilePct}%</span>
                </div>
                <Progress value={profilePct} className="h-2" />
                <div className="space-y-1.5">
                  {[
                    { label: 'Photo & headline', done: true },
                    { label: 'Skills (5+)', done: profilePct > 50 },
                    { label: 'Work experience', done: profilePct > 70 },
                    { label: 'Startup idea linked', done: profilePct > 80 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={cn('icon-sm shrink-0', item.done ? 'text-emerald-500' : 'text-muted-foreground/30')} />
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {profilePct < 100 && (
                  <Link href="/profile/edit">
                    <Button variant="secondary" size="sm" className="w-full">Complete profile</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/ai', icon: Sparkles, label: 'Ask AI', color: 'text-violet-500' },
                    { href: '/discover', icon: Users, label: 'Find Co-founders', color: 'text-primary' },
                    { href: '/mentoring', icon: GraduationCap, label: 'Find Mentors', color: 'text-blue-500' },
                    { href: '/coaching', icon: BrainCircuit, label: 'Coaching', color: 'text-purple-500' },
                    { href: '/expert-reviews', icon: Award, label: 'Expert Review', color: 'text-amber-500' },
                    { href: '/opportunities', icon: Briefcase, label: 'Opportunities', color: 'text-teal-500' },
                    { href: '/programs', icon: BookOpen, label: 'Programs', color: 'text-emerald-500' },
                    { href: '/marketplace', icon: Store, label: 'Services', color: 'text-orange-500' },
                    { href: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-indigo-500' },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link key={href} href={href} className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card p-3 text-center transition-all hover:border-border hover:bg-muted/50">
                      <Icon className={cn('icon-md', color)} />
                      <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="icon-sm text-muted-foreground" /> Recent Activity
                  </CardTitle>
                  <Link href="/activity">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEMO_ACTIVITY.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <div className={cn('mt-0.5 shrink-0 rounded-full bg-muted/60 p-1.5', item.color)}>
                        <Icon className="icon-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{item.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Calendar className="icon-sm" /> Upcoming
                  </CardTitle>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">View all</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {showDemoData ? (
                  demoEvents.slice(0, 3).map((event) => {
                    const cfg = EVENT_CONFIG[event.type];
                    const isUrgent = event.daysLeft <= 3;
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors',
                          isUrgent ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10' : 'border-border/60'
                        )}
                      >
                        <div className={cn('mt-0.5 rounded-md p-1.5 shrink-0', cfg.bg)}>
                          <Calendar className={cn('icon-sm', cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {event.time}
                            </span>
                            <span className={cn(
                              'text-xs font-medium',
                              isUrgent ? 'text-rose-600' : event.daysLeft <= 7 ? 'text-amber-600' : 'text-muted-foreground'
                            )}>
                              {event.daysLeft === 0 ? 'Today' : event.daysLeft === 1 ? 'Tomorrow' : `In ${event.daysLeft}d`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">No events this week</p>
                    <Link href="/events">
                      <Button variant="ghost" size="sm" className="mt-1.5 gap-1">
                        Browse events <ArrowRight className="icon-sm" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
