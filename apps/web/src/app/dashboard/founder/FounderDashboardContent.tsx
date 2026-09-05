'use client';

import Link from 'next/link';
import {
  ArrowRight, Briefcase, Calendar, CheckCircle, ChevronRight,
  FileText, Flag, Lightbulb, MessageCircle, Rocket, Sparkles,
  Target, TrendingUp, UserPlus, Users, Zap, DollarSign, Eye,
  Award, BrainCircuit, GraduationCap, BarChart3, Clock,
  BookOpen, Store, Globe, Shield, Gauge, Activity, Star,
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
import { STATUS, TREND, type StatusTone } from '@/lib/semantic-colors';
import { queryKeys } from '@/lib/query-keys';
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
import { XPProgressWidget } from '@/components/gamification/XPProgressWidget';
import { BadgesWidget } from '@/components/gamification/BadgesWidget';
import { BilingualText } from '@/components/common/BilingualText';
import { dashboardEn, dashboardEl } from '@/lib/i18n/strings-dashboard';
import { bilingualAria } from '@/lib/i18n/format';

function getTimeBasedGreeting(): { en: string; el: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { en: dashboardEn('good_morning'), el: dashboardEl('good_morning') };
  if (hour < 17) return { en: dashboardEn('good_afternoon'), el: dashboardEl('good_afternoon') };
  return { en: dashboardEn('good_evening'), el: dashboardEl('good_evening') };
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_MILESTONES = [
  { id: '1', title: 'Complete MVP v1', status: 'in_progress', progress: 65, dueDate: '2026-04-15', priority: 'high' },
  { id: '2', title: 'First 100 active users', status: 'in_progress', progress: 23, dueDate: '2026-05-01', priority: 'high' },
  { id: '3', title: 'Seed funding round', status: 'pending', progress: 10, dueDate: '2026-06-30', priority: 'medium' },
  { id: '4', title: 'Build founding team', status: 'pending', progress: 0, dueDate: '2026-04-30', priority: 'high' },
];

const DEMO_ACTIVITY = [
  { id: '1', type: 'match', text: 'New 87% match — Nikos Papadakis, CTO', time: '2h ago', icon: Sparkles, color: 'text-primary-accessible' },
  { id: '2', type: 'connection', text: 'Elena Papadopoulos accepted your request', time: '5h ago', icon: UserPlus, color: STATUS.success.icon },
  { id: '3', type: 'message', text: 'New message from Marcus Chen', time: '8h ago', icon: MessageCircle, color: STATUS.info.icon },
  { id: '4', type: 'view', text: 'Your profile was viewed 12 times today', time: '1d ago', icon: Eye, color: STATUS.warning.icon },
];

const READINESS_DIM_ICONS: Record<string, { icon: React.ElementType; tone: StatusTone }> = {
  problemClarity:      { icon: Lightbulb,    tone: 'warning' },
  solutionClarity:     { icon: Rocket,       tone: 'success' },
  marketUnderstanding: { icon: Target,       tone: 'info' },
  productDefinition:   { icon: Briefcase,    tone: 'accent' },
  teamCompleteness:    { icon: Users,        tone: 'danger' },
  executionReadiness:  { icon: TrendingUp,   tone: 'warning' },
  validationScore:     { icon: Award,        tone: 'accent' },
  artifactCompleteness:{ icon: FileText,     tone: 'success' },
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
const EVENT_CONFIG: Record<EventType, StatusTone> = {
  mentorship: 'accent',
  deadline: 'danger',
  event: 'info',
  pitch: 'success',
};

const DEMO_EVENTS = [
  { id: '1', title: 'Mentor Session — Dr. Sarah Chen', type: 'mentorship' as EventType, date: '2026-03-26', time: '14:00', daysLeft: 2 },
  { id: '2', title: 'Pitch Deck Deadline', type: 'deadline' as EventType, date: '2026-03-28', time: '23:59', daysLeft: 4 },
  { id: '3', title: 'Startup Networking Mixer', type: 'event' as EventType, date: '2026-04-02', time: '18:00', daysLeft: 9 },
  { id: '4', title: 'Investor Demo Day', type: 'pitch' as EventType, date: '2026-04-10', time: '10:00', daysLeft: 17 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, trend, href, accent,
}: {
  icon: React.ElementType; label: string; value: number | string;
  trend?: { value: number; positive: boolean }; href?: string; accent?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden transition-all hover:shadow-md cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? TREND.up : TREND.down)}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% this week
              </p>
            )}
          </div>
          <div className={cn('rounded-lg p-2', accent ?? 'bg-primary/10')}>
            <Icon className={cn('icon-md', accent ? 'text-white' : 'text-primary-accessible')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function MatchPreviewCard({ match }: { match: SearchHit }) {
  const score = match.matchScore ?? 0;
  const scoreColor = score >= 85 ? STATUS.success.icon : score >= 70 ? STATUS.info.icon : STATUS.warning.icon;
  return (
    <Link href={`/matches/${match.userId}`} className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={match.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm font-semibold">
          {match.displayName?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{match.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{match.headline}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn('text-sm font-bold tabular-nums flex items-center gap-0.5', scoreColor)}>
          <Sparkles className="icon-sm" />{score}%
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

function MilestoneRow({ milestone }: { milestone: typeof DEMO_MILESTONES[0] }) {
  const isComplete = milestone.status === 'completed';
  const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && !isComplete;
  return (
    <div className="flex items-center gap-3">
      <div className={cn('shrink-0 rounded-full p-1.5', isComplete ? STATUS.success.bg : isOverdue ? STATUS.danger.bg : 'bg-primary/10')}>
        {isComplete
          ? <CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} />
          : isOverdue
          ? <AlertCircle className={cn('icon-sm', STATUS.danger.icon)} />
          : <Circle className="icon-sm text-primary-accessible" />}
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

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: hasSession && mounted,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', { limit: 5 }],
    queryFn: () => getRecommendations({ limit: 5 }),
    enabled: hasSession && mounted,
  });

  const { data: connectionRequests } = useQuery({
    queryKey: queryKeys.connections.pendingReceived(),
    queryFn: () => listConnectionRequests(),
    enabled: hasSession && mounted,
  });

  const { data: xpData } = useQuery({
    queryKey: ['my-xp'],
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
    unreadMessages:  3,
  });

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${getTimeBasedGreeting().en}, ${displayName}`}
      description="Your startup command center \u2014 track progress, find team, and close your round."
      showHelp
      actions={
        <>
          <Badge variant="outline" className="gap-1.5">
            <Rocket className="icon-sm" /> <BilingualText en="Founder" el="Ιδρυτής" compact />
          </Badge>
          <Link href="/readiness">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Gauge className="icon-sm" />
              <BilingualText en={`Readiness: ${avgReadiness}%`} el={`Ετοιμότητα: ${avgReadiness}%`} compact />
            </Button>
          </Link>
        </>
      }
    >
      <div className="space-y-6">

        {/* Onboarding Checklist */}
        <OnboardingChecklist steps={onboardingSteps} userName={displayName} />

        {/* Next Action Banner — only when no pending requests (handled by checklist otherwise) */}
        {nextAction && <NextActionBanner action={nextAction} />
        }

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard icon={Users} label={bilingualAria(dashboardEn('profile_views'), dashboardEl('profile_views'))} value={stats?.activeProfiles ?? 48} trend={{ value: 12, positive: true }} href="/analytics" accent="bg-primary" />
          <StatCard icon={Sparkles} label={bilingualAria(dashboardEn('top_matches'), dashboardEl('top_matches'))} value={stats?.matchesThisWeek ?? 7} trend={{ value: 3, positive: true }} href="/matches" />
          <StatCard icon={MessageCircle} label={bilingualAria('Unread Messages', 'Αδιάβαστα μηνύματα')} value={3} href="/messages" />
          <StatCard icon={Target} label={bilingualAria(dashboardEn('milestones'), dashboardEl('milestones'))} value={`${DEMO_MILESTONES.filter(m => m.progress === 100).length}/${DEMO_MILESTONES.length}`} href="/milestones" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Venture Readiness Score */}
            {vrs && <VentureReadinessCard data={vrs} />}

            {/* Startup Readiness — real dimensions from VRS API */}
            {vrs && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gauge className="icon-sm text-primary-accessible" /> <BilingualText en={dashboardEn('startup_readiness')} el={dashboardEl('startup_readiness')} />
                    </CardTitle>
                    <Link href="/readiness">
                      <Button variant="ghost" size="sm">
                        Full report <ArrowRight className="ml-1 icon-sm" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                          strokeDasharray={`${(avgReadiness / 100) * 97.4} 97.4`}
                          className={cn(avgReadiness >= 70 ? 'stroke-status-success' : avgReadiness >= 50 ? 'stroke-status-warning' : 'stroke-status-danger')}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-bold text-foreground">{avgReadiness}%</span>
                        <span className="text-xs text-muted-foreground">Ready</span>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
                      {vrs.dimensions.slice(0, 6).map((dim) => {
                        const cfg = READINESS_DIM_ICONS[dim.key] ?? { icon: Activity, tone: 'neutral' as const };
                        const dimColors = STATUS[cfg.tone];
                        return (
                          <div key={dim.key}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-muted-foreground truncate">{dim.label}</span>
                              <span className={cn('text-xs font-semibold', dimColors.icon)}>{dim.score}%</span>
                            </div>
                            <Progress value={dim.score} className="h-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className={cn('icon-sm', STATUS.success.icon)} /> <BilingualText en={dashboardEn('fundraising')} el={dashboardEl('fundraising')} />
                  </CardTitle>
                  <Link href="/fundraising">
                    <Button variant="ghost" size="sm">
                      Open tracker <ArrowRight className="ml-1 icon-sm" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{FUNDRAISING_DEMO.roundName}</p>
                      <p className="text-xl font-bold text-foreground">
                        {FUNDRAISING_DEMO.currency}{(FUNDRAISING_DEMO.raisedAmount / 1000).toFixed(0)}K
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {FUNDRAISING_DEMO.currency}{(FUNDRAISING_DEMO.targetAmount / 1000).toFixed(0)}K
                        </span>
                      </p>
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      fundingPct >= 75 ? STATUS.success.icon : fundingPct >= 40 ? STATUS.warning.icon : 'text-muted-foreground'
                    )}>
                      {fundingPct}%
                    </span>
                  </div>
                  <Progress value={fundingPct} className="h-2.5" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="icon-sm" /> {FUNDRAISING_DEMO.leadCount} leads tracked</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} /> {FUNDRAISING_DEMO.committedCount} committed</span>
                  </div>
                  <div className="flex gap-2">
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="icon-sm text-primary-accessible" /> <BilingualText en="Top Matches for You" el="Κορυφαίες αντιστοιχίσεις" />
                  </CardTitle>
                  <Link href="/matches">
                    <Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 icon-sm" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations?.suggestions?.slice(0, 4).map((match: SearchHit) => (
                  <MatchPreviewCard key={match.userId} match={match} />
                ))}
                {(!recommendations?.suggestions || recommendations.suggestions.length === 0) && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      <BilingualText en="Complete your profile to get personalized matches" el="Ολοκληρώστε το προφίλ σας για εξατομικευμένες αντιστοιχίσεις" />
                    </p>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                        <BilingualText en="Complete profile" el="Ολοκλήρωση προφίλ" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="icon-sm text-primary-accessible" /> <BilingualText en={dashboardEn('milestones')} el={dashboardEl('milestones')} />
                  </CardTitle>
                  <Link href="/milestones">
                    <Button variant="ghost" size="sm">Manage <ArrowRight className="ml-1 icon-sm" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {DEMO_MILESTONES.map((m) => <MilestoneRow key={m.id} milestone={m} />)}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Behavioral Nudge */}
            <BehavioralNudge surface="dashboard" />

            {/* XP Progress Widget (new comprehensive version) */}
            <XPProgressWidget />

            {/* Badges Widget */}
            <BadgesWidget />

            {/* XP Progress Strip (legacy - can be removed after testing) */}
            {false && xpData ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className={cn('icon-sm', STATUS.warning.icon)} />
                    XP Progress
                    {(xpData?.streak?.currentStreak ?? 0) > 0 && (
                      <span className={cn('ml-auto text-xs font-normal', STATUS.warning.icon)}>
                        🔥 {xpData?.streak?.currentStreak}-day streak
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Level {xpData?.level ?? 1} — {xpData?.levelLabel ?? 'Member'}</span>
                    <span className="text-muted-foreground tabular-nums">{(xpData?.totalXp ?? 0).toLocaleString()} XP</span>
                  </div>
                  <Progress value={(xpData?.levelProgress ?? 0) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {(xpData?.xpToNextLevel ?? 0) > 0
                      ? `${xpData?.xpToNextLevel.toLocaleString()} XP to next level`
                      : 'Maximum level reached'}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Profile Strength */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="icon-sm text-primary-accessible" /> <BilingualText en="Profile Strength" el="Ισχύς προφίλ" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className={cn('font-bold', profilePct >= 80 ? STATUS.success.icon : STATUS.warning.icon)}>{profilePct}%</span>
                </div>
                <Progress value={profilePct} className="h-2" />
                <div className="space-y-1.5">
                  {[
                    { labelEn: 'Photo & headline', labelEl: 'Φωτογραφία & τίτλος', done: true },
                    { labelEn: 'Skills (5+)', labelEl: 'Δεξιότητες (5+)', done: profilePct > 50 },
                    { labelEn: 'Work experience', labelEl: 'Εργασιακή εμπειρία', done: profilePct > 70 },
                    { labelEn: 'Startup idea linked', labelEl: 'Σύνδεση ιδέας νεοφυούς', done: profilePct > 80 },
                  ].map((item) => (
                    <div key={item.labelEn} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={cn('icon-sm shrink-0', item.done ? STATUS.success.icon : 'text-muted-foreground/30')} />
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                        <BilingualText en={item.labelEn} el={item.labelEl} compact />
                      </span>
                    </div>
                  ))}
                </div>
                {profilePct < 100 && (
                  <Link href="/profile/edit">
                    <Button variant="secondary" size="sm" className="w-full">
                      <BilingualText en="Complete profile" el="Ολοκλήρωση προφίλ" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm"><BilingualText en={dashboardEn('quick_actions')} el={dashboardEl('quick_actions')} /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/discover', icon: Users, labelEn: 'Find Co-founders', labelEl: 'Εύρεση συνιδρυτών', tone: 'accent' as const },
                    { href: '/mentoring', icon: GraduationCap, labelEn: 'Find Mentors', labelEl: 'Εύρεση μεντόρων', tone: 'info' as const },
                    { href: '/coaching', icon: BrainCircuit, labelEn: 'Coaching', labelEl: 'Καθοδήγηση', tone: 'accent' as const },
                    { href: '/expert-reviews', icon: Award, labelEn: 'Expert Review', labelEl: 'Αξιολόγηση ειδικού', tone: 'warning' as const },
                    { href: '/opportunities', icon: Briefcase, labelEn: 'Opportunities', labelEl: 'Ευκαιρίες', tone: 'success' as const },
                    { href: '/programs', icon: BookOpen, labelEn: 'Programs', labelEl: 'Προγράμματα', tone: 'success' as const },
                    { href: '/marketplace', icon: Store, labelEn: 'Services', labelEl: 'Υπηρεσίες', tone: 'warning' as const },
                    { href: '/analytics', icon: BarChart3, labelEn: 'Analytics', labelEl: 'Αναλυτικά', tone: 'info' as const },
                  ].map(({ href, icon: Icon, labelEn, labelEl, tone }) => (
                    <Link key={href} href={href} className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card p-3 text-center transition-all hover:bg-muted/50 hover:border-border">
                      <Icon className={cn('icon-md', STATUS[tone].icon)} />
                      <span className="text-xs font-medium text-foreground leading-tight">
                        <BilingualText en={labelEn} el={labelEl} compact />
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="icon-sm text-muted-foreground" /> <BilingualText en={dashboardEn('recent_activity')} el={dashboardEl('recent_activity')} />
                  </CardTitle>
                  <Link href="/activity">
                    <Button variant="ghost" size="sm">All</Button>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="icon-sm" /> <BilingualText en={dashboardEn('upcoming')} el={dashboardEl('upcoming')} />
                  </CardTitle>
                  <Link href="/events">
                    <Button variant="ghost" size="sm">View all</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {showDemoData ? (
                  DEMO_EVENTS.slice(0, 3).map((event) => {
                    const tone = EVENT_CONFIG[event.type];
                    const cfg = STATUS[tone];
                    const isUrgent = event.daysLeft <= 3;
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors',
                          isUrgent ? cn('border', cfg.border, cfg.bg) : 'border-border/60'
                        )}
                      >
                        <div className={cn('mt-0.5 rounded-md p-1.5 shrink-0', cfg.bg)}>
                          <Calendar className={cn('icon-sm', cfg.icon)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {event.time}
                            </span>
                            <span className={cn(
                              'text-xs font-medium',
                              isUrgent ? STATUS.danger.icon : event.daysLeft <= 7 ? STATUS.warning.icon : 'text-muted-foreground'
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
                    <p className="text-xs text-muted-foreground">
                      <BilingualText en="No events this week" el="Δεν υπάρχουν εκδηλώσεις αυτή την εβδομάδα" />
                    </p>
                    <Link href="/events">
                      <Button variant="ghost" size="sm" className="mt-1.5 gap-1">
                        <BilingualText en="Browse events" el="Περιήγηση εκδηλώσεων" /> <ArrowRight className="icon-sm" />
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
