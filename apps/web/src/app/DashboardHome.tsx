'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronRight,
  Flag,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
  Gauge,
  Rocket,
  GraduationCap,
  Briefcase,
  BarChart3,
  BookOpen,
  Target,
  Activity,
  Star,
  Building2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import {
  getDashboardActivity,
  getDashboardMe,
  getDashboardStats,
  getMeProfile,
  getRecommendations,
  listConnectionRequests,
  listEvents,
  listMilestones,
  getMilestoneSummary,
  discoverMentors,
  getMyGroups,
  type SearchHit,
  type Milestone,
  type MilestoneSummary,
  type MentorProfileItem,
} from '@/lib/api';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function ActionItem({
  icon: Icon,
  label,
  count,
  href,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
  variant?: 'default' | 'primary' | 'warning';
}) {
  const colors = {
    default: 'bg-secondary/60 text-foreground hover:bg-secondary',
    primary: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
    warning: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20',
  };

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all',
        colors[variant]
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold tabular-nums">
          {count}
        </span>
        <ChevronRight className="icon-sm opacity-50" aria-hidden="true" />
      </div>
    </Link>
  );
}

function MatchPreviewCard({ match }: { match: SearchHit }) {
  const score = match.matchScore ?? 0;
  const tierColor = score >= 80 ? '#4ADE80' : score >= 65 ? '#22D3EE' : score >= 45 ? '#FB923C' : '#94A3B8';

  return (
    <Link
      href={`/matches/${match.userId}`}
      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={match.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {match.displayName?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {match.displayName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{match.headline ?? match.role}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-bold tabular-nums" style={{ color: tierColor }}>
          {score}%
        </span>
        <span className="text-2xs text-muted-foreground">match</span>
      </div>
    </Link>
  );
}

function MentorSuggestionCard({ mentor }: { mentor: MentorProfileItem }) {
  return (
    <Link
      href={`/mentoring?mentor=${mentor.userId}`}
      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={mentor.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-sm font-semibold">
          {mentor.displayName?.[0]?.toUpperCase() ?? 'M'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{mentor.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{mentor.headline ?? 'Mentor'}</p>
      </div>
      {mentor.isFree ? (
        <span className="shrink-0 text-2xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">Free</span>
      ) : mentor.hourlyRate ? (
        <span className="shrink-0 text-2xs text-muted-foreground">${mentor.hourlyRate}/h</span>
      ) : null}
    </Link>
  );
}

function CommunityRow({ group }: { group: { id: string; name: string; memberCount: number; category?: string | null; avatarUrl?: string | null } }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {group.avatarUrl ? (
          <img src={group.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <Building2 className="icon-sm text-primary" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{group.name}</p>
        <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
      </div>
      <ChevronRight className="icon-sm shrink-0 opacity-40" aria-hidden="true" />
    </Link>
  );
}

function ActivityRow({
  item,
}: {
  item: { id: string; type: string; title: string; author?: string; timeAgo: string; href: string };
}) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          item.type === 'connection' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'
        )}
      >
        {item.type === 'connection' ? (
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{item.title}</p>
        {item.author && <p className="text-xs text-muted-foreground">{item.author}</p>}
      </div>
      <span className="shrink-0 text-2xs text-muted-foreground">{item.timeAgo}</span>
    </Link>
  );
}

export function DashboardHome() {
  const router = useRouter();
  const { hasSession, mounted: sessionReady } = useSession();

  useEffect(() => {
    if (sessionReady && !hasSession) {
      router.replace('/login');
    }
  }, [hasSession, router, sessionReady]);

  const queryEnabled = sessionReady && hasSession;

  const { data: profileData } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: getMeProfile,
    staleTime: 5 * 60_000,
    enabled: queryEnabled,
  });
  const profile = profileData?.profile;
  const displayName = profile?.displayName ?? 'there';
  const greeting = getTimeBasedGreeting();

  const { data: pendingData } = useQuery({
    queryKey: ['connections', 'pending-received'],
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    staleTime: 30_000,
    enabled: queryEnabled,
  });
  const pendingCount = pendingData?.connections?.filter((c) => c.status === 'pending').length ?? 0;

  const { data: meSummary } = useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: getDashboardMe,
    staleTime: 60_000,
    enabled: queryEnabled,
  });

  const { data: statsData } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 60_000,
    enabled: queryEnabled,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['recommendations', { limit: 4 }],
    queryFn: () => getRecommendations({ limit: 4 }),
    staleTime: 3 * 60_000,
    enabled: queryEnabled,
  });
  const topMatches = (matchesData?.suggestions ?? []) as SearchHit[];

  const { data: eventsData } = useQuery({
    queryKey: ['events', { scope: 'upcoming', limit: 3 }],
    queryFn: () => listEvents({ scope: 'upcoming', limit: 3 }),
    staleTime: 2 * 60_000,
    enabled: queryEnabled,
  });
  const upcomingEvents = eventsData?.events ?? [];

  const { data: activityData } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => getDashboardActivity({ limit: 4 }),
    staleTime: 60_000,
    enabled: queryEnabled,
  });
  const recentActivity = activityData?.items ?? [];

  const { data: milestonesData } = useQuery({
    queryKey: ['milestones', 'in_progress', 3],
    queryFn: () => listMilestones({ status: 'in_progress' as const, limit: 3 }),
    staleTime: 60_000,
    enabled: queryEnabled,
  });
  const activeMilestonesList: Milestone[] = milestonesData?.milestones ?? [];

  const { data: milestoneSummary } = useQuery<MilestoneSummary>({
    queryKey: ['milestones', 'summary'],
    queryFn: getMilestoneSummary,
    staleTime: 5 * 60_000,
    enabled: queryEnabled,
  });

  const { data: mentorsData } = useQuery({
    queryKey: ['mentors', 'dashboard-suggestions'],
    queryFn: () => discoverMentors({ limit: 3, availabilityStatus: 'available' }),
    staleTime: 5 * 60_000,
    enabled: queryEnabled,
  });
  const mentorSuggestions: MentorProfileItem[] = (mentorsData?.mentors ?? []).slice(0, 3);

  const { data: myGroupsData } = useQuery({
    queryKey: ['groups', 'my'],
    queryFn: getMyGroups,
    staleTime: 2 * 60_000,
    enabled: queryEnabled,
  });
  const myGroups = (myGroupsData?.groups ?? []).slice(0, 4);

  const unreadMessages = meSummary?.unreadMessages ?? 0;
  const activeMilestones = meSummary?.activeMilestones ?? 0;
  const totalActions = pendingCount + unreadMessages + activeMilestones;

  const profileCompletion = profile
    ? Math.round(
        ([
          !!profile.displayName,
          !!profile.headline,
          !!profile.bio,
          (profile.skills?.length ?? 0) >= 3,
          !!profile.location,
          !!profile.avatarUrl,
        ].filter(Boolean).length /
          6) *
          100
      )
    : 0;

  if (!sessionReady || !hasSession) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground">Preparing your workspace...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Context Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalActions > 0 ? (
                <>
                  <span className="font-medium text-foreground">{totalActions} action{totalActions > 1 ? 's' : ''}</span>{' '}
                  need your attention
                </>
              ) : (
                "You're all caught up. Explore new matches or continue your research."
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/matches">
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="icon-sm" aria-hidden="true" />
                View Matches
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="sm" className="gap-2">
                <Sparkles className="icon-sm" aria-hidden="true" />
                Explore
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Priority Actions + Activity */}
          <div className="space-y-6 lg:col-span-4">
            {/* Priority Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Zap className="icon-sm text-primary" aria-hidden="true" />
                    Priority Actions
                  </h2>
                  {totalActions > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {totalActions}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {pendingCount > 0 && (
                    <ActionItem
                      icon={UserPlus}
                      label="Connection requests"
                      count={pendingCount}
                      href="/connections"
                      variant="primary"
                    />
                  )}
                  {unreadMessages > 0 && (
                    <ActionItem
                      icon={MessageCircle}
                      label="Unread messages"
                      count={unreadMessages}
                      href="/messages"
                      variant="default"
                    />
                  )}
                  {activeMilestones > 0 && (
                    <ActionItem
                      icon={Flag}
                      label="Active milestones"
                      count={activeMilestones}
                      href="/milestones"
                      variant="warning"
                    />
                  )}
                  {totalActions === 0 && (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <CheckCircle className="icon-xl text-emerald-500" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">All caught up!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                  <Link href="/activity" className="text-xs text-primary hover:underline">
                    View all
                  </Link>
                </div>
                {recentActivity.length > 0 ? (
                  <div className="space-y-1">
                    {recentActivity.map((item) => (
                      <ActivityRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Column: Top Matches */}
          <div className="space-y-6 lg:col-span-5">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Heart className="icon-sm text-rose-500" aria-hidden="true" />
                    Top Matches
                  </h2>
                  <Link href="/matches" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    See all <ArrowRight className="icon-2xs" aria-hidden="true" />
                  </Link>
                </div>
                {matchesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topMatches.length > 0 ? (
                  <div className="space-y-3">
                    {topMatches.map((match) => (
                      <MatchPreviewCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">No matches yet</p>
                      <p className="text-xs text-muted-foreground">Complete your profile to get matched</p>
                    </div>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm">
                        Complete Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mentor Suggestions */}
            {mentorSuggestions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <GraduationCap className="icon-sm text-emerald-500" aria-hidden="true" />
                      Mentor Suggestions
                    </h2>
                    <Link href="/mentoring" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      Browse all <ArrowRight className="icon-2xs" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {mentorSuggestions.map((mentor) => (
                      <MentorSuggestionCard key={mentor.userId} mentor={mentor} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Communities */}
            {myGroups.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="icon-sm text-blue-500" aria-hidden="true" />
                      My Communities
                    </h2>
                    <Link href="/groups" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      All groups <ArrowRight className="icon-2xs" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {myGroups.map((group) => (
                      <CommunityRow key={group.id} group={group} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="icon-sm text-purple-500" aria-hidden="true" />
                      Upcoming Events
                    </h2>
                    <Link href="/events" className="text-xs text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary"
                      >
                        <span className="truncate text-sm text-foreground">{event.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(event.startAt).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Progress + Stats */}
          <div className="space-y-6 lg:col-span-3">
            {/* Profile Progress */}
            {profileCompletion < 100 && (
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-3 text-sm font-semibold text-foreground">Your Progress</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Profile completion</span>
                        <span className="font-semibold text-foreground">{profileCompletion}%</span>
                      </div>
                      <Progress value={profileCompletion} className="h-2" />
                    </div>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        Complete Profile
                        <ArrowRight className="icon-2xs" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ecosystem Stats */}
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="icon-sm text-emerald-500" aria-hidden="true" />
                  Ecosystem Pulse
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground tabular-nums">
                      {statsData?.activeProfiles?.toLocaleString() ?? '—'}
                    </p>
                    <p className="text-2xs text-muted-foreground uppercase tracking-wide">Active Members</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground tabular-nums">
                      {statsData?.matchesThisWeek ?? '—'}
                    </p>
                    <p className="text-2xs text-muted-foreground uppercase tracking-wide">Matches/Week</p>
                  </div>
                </div>
                {statsData?.trendPercent !== undefined && statsData.trendPercent > 0 && (
                  <p className="mt-3 text-center text-xs text-emerald-500">
                    ↑ {statsData.trendPercent}% growth this month
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Milestone Summary */}
            {milestoneSummary && milestoneSummary.total > 0 && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Gauge className="icon-sm text-primary" aria-hidden="true" />
                      Milestone Progress
                    </h2>
                    <Link href="/milestones" className="text-xs text-primary hover:underline">Details</Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-secondary" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary"
                          strokeDasharray={`${milestoneSummary.completionRate * 87.96 / 100} 87.96`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-base font-bold text-foreground">{milestoneSummary.completionRate}%</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium">{milestoneSummary.total}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">In Progress</span>
                        <span className="font-medium text-amber-600">{milestoneSummary.counts.in_progress ?? 0}</span>
                      </div>
                      {milestoneSummary.overdue > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Overdue</span>
                          <span className="font-medium text-red-600">{milestoneSummary.overdue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href="/readiness">
                    <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 text-xs">
                      <Target className="h-3.5 w-3.5" aria-hidden="true" />
                      View Readiness
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Active Milestones */}
            {activeMilestonesList.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Flag className="icon-sm text-amber-500" aria-hidden="true" />
                      Active Milestones
                    </h2>
                    <Link href="/milestones" className="text-xs text-primary hover:underline">View all</Link>
                  </div>
                  <div className="space-y-2">
                    {activeMilestonesList.map((m: { id: string; title: string; priority: string; dueDate?: string | null }) => (
                      <Link key={m.id} href="/milestones"
                        className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary"
                      >
                        <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', m.priority === 'high' ? 'bg-red-500' : m.priority === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground')} />
                        <span className="flex-1 truncate text-xs text-foreground">{m.title}</span>
                        {m.dueDate && (
                          <span className="shrink-0 text-2xs text-muted-foreground">
                            {new Date(m.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h2>
                <div className="space-y-1">
                  {[
                    { href: '/builder', label: 'Startup Builder', icon: Rocket },
                    { href: '/mentoring', label: 'Find a Mentor', icon: GraduationCap },
                    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
                    { href: '/groups', label: 'Communities', icon: Building2 },
                    { href: '/learning', label: 'Learning Hub', icon: BookOpen },
                    { href: '/analytics', label: 'My Analytics', icon: BarChart3 },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
