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
  type SearchHit,
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
        <ChevronRight className="h-4 w-4 opacity-50" />
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
        <span className="text-[10px] text-muted-foreground">match</span>
      </div>
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
          <UserPlus className="h-3.5 w-3.5" />
        ) : (
          <MessageCircle className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{item.title}</p>
        {item.author && <p className="text-xs text-muted-foreground">{item.author}</p>}
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground">{item.timeAgo}</span>
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
  const recentActivity = activityData ?? [];

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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
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
                <Heart className="h-4 w-4" />
                View Matches
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
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
                    <Zap className="h-4 w-4 text-primary" />
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
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
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
                    <Heart className="h-4 w-4 text-rose-500" />
                    Top Matches
                  </h2>
                  <Link href="/matches" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    See all <ArrowRight className="h-3 w-3" />
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
                    <Users className="h-10 w-10 text-muted-foreground/30" />
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

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
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
                        <ArrowRight className="h-3 w-3" />
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
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Ecosystem Pulse
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground tabular-nums">
                      {statsData?.activeProfiles?.toLocaleString() ?? '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Members</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-foreground tabular-nums">
                      {statsData?.matchesThisWeek ?? '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Matches/Week</p>
                  </div>
                </div>
                {statsData?.trendPercent !== undefined && statsData.trendPercent > 0 && (
                  <p className="mt-3 text-center text-xs text-emerald-500">
                    ↑ {statsData.trendPercent}% growth this month
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h2>
                <div className="space-y-1">
                  {[
                    { href: '/research', label: 'Research Workspace', icon: Sparkles },
                    { href: '/mentoring', label: 'Find a Mentor', icon: Users },
                    { href: '/groups', label: 'Communities', icon: Users },
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
