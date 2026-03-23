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
import {
  getDashboardStats,
  getMeProfile,
  getRecommendations,
  listConnectionRequests,
  type SearchHit,
} from '@/lib/api';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_MILESTONES = [
  { id: '1', title: 'Complete MVP v1', status: 'in_progress', progress: 65, dueDate: '2026-04-15', priority: 'high' },
  { id: '2', title: 'First 100 active users', status: 'in_progress', progress: 23, dueDate: '2026-05-01', priority: 'high' },
  { id: '3', title: 'Seed funding round', status: 'pending', progress: 10, dueDate: '2026-06-30', priority: 'medium' },
  { id: '4', title: 'Build founding team', status: 'pending', progress: 0, dueDate: '2026-04-30', priority: 'high' },
];

const DEMO_ACTIVITY = [
  { id: '1', type: 'match', text: 'New 87% match — Nikos Papadakis, CTO', time: '2h ago', icon: Sparkles, color: 'text-primary' },
  { id: '2', type: 'connection', text: 'Elena Papadopoulos accepted your request', time: '5h ago', icon: UserPlus, color: 'text-emerald-500' },
  { id: '3', type: 'message', text: 'New message from Marcus Chen', time: '8h ago', icon: MessageCircle, color: 'text-blue-500' },
  { id: '4', type: 'view', text: 'Your profile was viewed 12 times today', time: '1d ago', icon: Eye, color: 'text-amber-500' },
];

const READINESS_DIMENSIONS = [
  { label: 'Idea & Vision', score: 85, icon: Lightbulb, color: 'text-amber-500' },
  { label: 'Market Fit', score: 62, icon: Target, color: 'text-blue-500' },
  { label: 'Team', score: 40, icon: Users, color: 'text-red-500' },
  { label: 'Fundraising', score: 30, icon: DollarSign, color: 'text-purple-500' },
  { label: 'MVP / Product', score: 65, icon: Rocket, color: 'text-emerald-500' },
  { label: 'Traction', score: 20, icon: TrendingUp, color: 'text-orange-500' },
];

const FUNDRAISING_DEMO = {
  roundName: 'Pre-Seed Round',
  targetAmount: 300000,
  raisedAmount: 85000,
  currency: '€',
  leadCount: 8,
  committedCount: 2,
};

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
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {trend && (
              <p className={cn('text-[11px] font-medium', trend.positive ? 'text-emerald-500' : 'text-red-500')}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% this week
              </p>
            )}
          </div>
          <div className={cn('rounded-lg p-2', accent ?? 'bg-primary/10')}>
            <Icon className={cn('h-5 w-5', accent ? 'text-white' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
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
      <div className="flex items-center gap-1.5">
        <span className={cn('text-sm font-bold tabular-nums flex items-center gap-0.5', scoreColor)}>
          <Sparkles className="h-3 w-3" />{score}%
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
      <div className={cn('shrink-0 rounded-full p-1.5', isComplete ? 'bg-emerald-500/10' : isOverdue ? 'bg-red-500/10' : 'bg-primary/10')}>
        {isComplete
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          : isOverdue
          ? <AlertCircle className="h-4 w-4 text-red-500" />
          : <Circle className="h-4 w-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{milestone.title}</p>
          {milestone.priority === 'high' && <Badge variant="destructive" className="h-4 px-1.5 text-[10px] shrink-0">High</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Progress value={milestone.progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground shrink-0 w-8 text-right">{milestone.progress}%</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Due {new Date(milestone.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}

export default function FounderDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
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
    queryKey: ['connection-requests'],
    queryFn: () => listConnectionRequests(),
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Founder';
  const pendingRequests = connectionRequests?.connections?.filter((r: any) => r.status === 'pending')?.length ?? 0;
  const profilePct = profile?.hasCompletedOnboarding ? 100 : 52;
  const avgReadiness = Math.round(READINESS_DIMENSIONS.reduce((a, d) => a + d.score, 0) / READINESS_DIMENSIONS.length);
  const fundingPct = Math.round((FUNDRAISING_DEMO.raisedAmount / FUNDRAISING_DEMO.targetAmount) * 100);

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
    <AppShell>
      <div className="py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getTimeBasedGreeting()}, {displayName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Your startup command center — track progress, find team, and close your round.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="gap-1.5">
              <Rocket className="h-3.5 w-3.5" /> Founder
            </Badge>
            <Link href="/readiness">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Gauge className="h-3.5 w-3.5" />
                Readiness: {avgReadiness}%
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Required Banner */}
        {pendingRequests > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-foreground">{pendingRequests} pending connection request{pendingRequests > 1 ? 's' : ''}</span>
            </div>
            <Link href="/connections?tab=requests">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                Review <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard icon={Users} label="Profile Views (7d)" value={stats?.activeProfiles ?? 48} trend={{ value: 12, positive: true }} href="/analytics" accent="bg-primary" />
          <StatCard icon={Sparkles} label="New Matches" value={stats?.matchesThisWeek ?? 7} trend={{ value: 3, positive: true }} href="/matches" />
          <StatCard icon={MessageCircle} label="Unread Messages" value={3} href="/messages" />
          <StatCard icon={Target} label="Milestone Progress" value={`${DEMO_MILESTONES.filter(m => m.progress === 100).length}/${DEMO_MILESTONES.length}`} href="/milestones" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Startup Health */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" /> Startup Readiness
                  </CardTitle>
                  <Link href="/readiness">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Full report <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  {/* Donut */}
                  <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                        strokeDasharray={`${(avgReadiness / 100) * 97.4} 97.4`}
                        className={cn(avgReadiness >= 70 ? 'stroke-emerald-500' : avgReadiness >= 50 ? 'stroke-amber-500' : 'stroke-red-500')}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-sm font-bold text-foreground">{avgReadiness}%</span>
                      <span className="text-[9px] text-muted-foreground">Ready</span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
                    {READINESS_DIMENSIONS.map((dim) => (
                      <div key={dim.label}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-muted-foreground">{dim.label}</span>
                          <span className={cn('text-[11px] font-semibold', dim.color)}>{dim.score}%</span>
                        </div>
                        <Progress value={dim.score} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/builder" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" /> Open Builder
                    </Button>
                  </Link>
                  <Link href="/expert-reviews" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <Award className="h-3.5 w-3.5" /> Get Expert Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Fundraising widget */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" /> Fundraising
                  </CardTitle>
                  <Link href="/fundraising">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Open tracker <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{FUNDRAISING_DEMO.roundName}</p>
                      <p className="text-2xl font-bold text-foreground">
                        {FUNDRAISING_DEMO.currency}{(FUNDRAISING_DEMO.raisedAmount / 1000).toFixed(0)}K
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {FUNDRAISING_DEMO.currency}{(FUNDRAISING_DEMO.targetAmount / 1000).toFixed(0)}K
                        </span>
                      </p>
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      fundingPct >= 75 ? 'text-emerald-500' : fundingPct >= 40 ? 'text-amber-500' : 'text-muted-foreground'
                    )}>
                      {fundingPct}%
                    </span>
                  </div>
                  <Progress value={fundingPct} className="h-2.5" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {FUNDRAISING_DEMO.leadCount} leads tracked</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {FUNDRAISING_DEMO.committedCount} committed</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/fundraising" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        <TrendingUp className="h-3.5 w-3.5" /> Manage Pipeline
                      </Button>
                    </Link>
                    <Link href="/investors" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" /> Find Investors
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
                    <Sparkles className="h-4 w-4 text-primary" /> Top Matches for You
                  </CardTitle>
                  <Link href="/matches">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations?.suggestions?.slice(0, 4).map((match: SearchHit) => (
                  <MatchPreviewCard key={match.userId} match={match} />
                ))}
                {(!recommendations?.suggestions || recommendations.suggestions.length === 0) && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Complete your profile to get personalized matches</p>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs">
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="h-4 w-4 text-primary" /> Milestones
                  </CardTitle>
                  <Link href="/milestones">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Manage <ArrowRight className="ml-1 h-3 w-3" /></Button>
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

            {/* Profile Strength */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Profile Strength
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
                      <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', item.done ? 'text-emerald-500' : 'text-muted-foreground/30')} />
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {profilePct < 100 && (
                  <Link href="/profile/edit">
                    <Button variant="secondary" size="sm" className="w-full text-xs">Complete profile</Button>
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
                    { href: '/discover', icon: Users, label: 'Find Co-founders', color: 'text-primary' },
                    { href: '/mentoring', icon: GraduationCap, label: 'Find Mentors', color: 'text-blue-500' },
                    { href: '/coaching', icon: BrainCircuit, label: 'Coaching', color: 'text-purple-500' },
                    { href: '/expert-reviews', icon: Award, label: 'Expert Review', color: 'text-amber-500' },
                    { href: '/opportunities', icon: Briefcase, label: 'Opportunities', color: 'text-teal-500' },
                    { href: '/programs', icon: BookOpen, label: 'Programs', color: 'text-emerald-500' },
                    { href: '/marketplace', icon: Store, label: 'Services', color: 'text-orange-500' },
                    { href: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-indigo-500' },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link key={href} href={href} className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card p-3 text-center transition-all hover:bg-muted/50 hover:border-border">
                      <Icon className={cn('h-5 w-5', color)} />
                      <span className="text-[11px] font-medium text-foreground leading-tight">{label}</span>
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
                    <Activity className="h-4 w-4 text-muted-foreground" /> Recent Activity
                  </CardTitle>
                  <Link href="/activity">
                    <Button variant="ghost" size="sm" className="h-6 text-[11px]">All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEMO_ACTIVITY.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <div className={cn('mt-0.5 shrink-0 rounded-full bg-muted/60 p-1.5', item.color)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{item.text}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
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
                    <Calendar className="h-4 w-4" /> Upcoming
                  </CardTitle>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="h-6 text-[11px]">View all</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">No events this week</p>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="mt-1.5 h-6 text-[11px] gap-1">
                      Browse events <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
