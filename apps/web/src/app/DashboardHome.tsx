'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { Calendar, Compass, MessageCircle, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ActiveMember } from '@/components/dashboard/DashboardMembers';
import type { CalendarEvent } from '@/components/dashboard/DashboardCalendar';
import { AppShell } from '@/components/layout/AppShell';
import { OptimizedLink } from '@/components/common/OptimizedLink';
import { useSession } from '@/hooks/useSession';
import {
  getActivePoll,
  getDashboardActivity,
  getDashboardStats,
  getMeProfile,
  getRecommendations,
  listConnectionRequests,
  listEvents,
  listJobs,
} from '@/lib/api';

const DashboardCardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-border/60 bg-card/70 p-4">
    <div className="mb-3 h-4 w-1/3 rounded bg-secondary" />
    <div className="h-20 w-full rounded bg-secondary/60" />
  </div>
);

const DashboardHero = dynamic(() => import('@/components/dashboard/DashboardHero').then((module) => ({ default: module.DashboardHero })), { loading: () => <DashboardCardSkeleton /> });
const DashboardStats = dynamic(() => import('@/components/dashboard/DashboardStats').then((module) => ({ default: module.DashboardStats })), { loading: () => <DashboardCardSkeleton /> });
const DashboardJobs = dynamic(() => import('@/components/dashboard/DashboardJobs').then((module) => ({ default: module.DashboardJobs })), { loading: () => <DashboardCardSkeleton /> });
const DashboardMembers = dynamic(() => import('@/components/dashboard/DashboardMembers').then((module) => ({ default: module.DashboardMembers })), { loading: () => <DashboardCardSkeleton /> });
const DashboardPoll = dynamic(() => import('@/components/dashboard/DashboardPoll').then((module) => ({ default: module.DashboardPoll })), { loading: () => <DashboardCardSkeleton /> });
const DashboardCalendar = dynamic(() => import('@/components/dashboard/DashboardCalendar').then((module) => ({ default: module.DashboardCalendar })), { loading: () => <DashboardCardSkeleton /> });
const DashboardActivity = dynamic(() => import('@/components/dashboard/DashboardActivity').then((module) => ({ default: module.DashboardActivity })), { loading: () => <DashboardCardSkeleton /> });
const DashboardNewsletter = dynamic(() => import('@/components/dashboard/DashboardNewsletter').then((module) => ({ default: module.DashboardNewsletter })), { loading: () => <DashboardCardSkeleton /> });
const AnimatedCard = dynamic(() => import('@/components/common/AnimatedCard').then((module) => ({ default: module.AnimatedCard })), { ssr: false });

function mapSuggestionsToMembers(
  suggestions: { id: string; userId: string; displayName: string; avatarUrl?: string | null }[],
): ActiveMember[] {
  return suggestions.map((suggestion) => ({
    id: suggestion.userId || suggestion.id,
    displayName: suggestion.displayName,
    initials: suggestion.displayName.slice(0, 2).toUpperCase(),
    avatarUrl: suggestion.avatarUrl ?? null,
    isOnline: true,
  }));
}

function mapEventsToCalendar(
  events: { id: string; title: string; startAt: string }[],
): CalendarEvent[] {
  return events.map((event) => {
    const date = new Date(event.startAt);
    return {
      id: event.id,
      title: event.title,
      date: event.startAt.slice(0, 10),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      href: '/events',
    };
  });
}

function mapActivityItems(
  items: { id: string; type: string; title: string; author?: string; timeAgo: string; href: string }[],
) {
  return items.map((item) => ({
    id: item.id,
    type: (item.type === 'connection' ? 'connection' : 'discussion') as 'discussion' | 'connection' | 'event',
    title: item.title,
    author: item.author,
    timeAgo: item.timeAgo,
    href: item.href,
  }));
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
  const displayName = profileData?.profile?.displayName ?? 'there';
  const userRole = profileData?.profile?.role ?? 'founder';
  const greeting = getTimeBasedGreeting();

  const { data: pendingData } = useQuery({
    queryKey: ['connections', 'pending-received'],
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    staleTime: 30_000,
    enabled: queryEnabled,
  });
  const pendingCount = pendingData?.connections?.length ?? 0;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 60_000,
    enabled: queryEnabled,
  });

  const { data: membersData } = useQuery({
    queryKey: ['recommendations', { limit: 5 }],
    queryFn: () => getRecommendations({ limit: 5 }),
    staleTime: 3 * 60_000,
    enabled: queryEnabled,
  });
  const members = membersData?.suggestions ? mapSuggestionsToMembers(membersData.suggestions) : null;

  const { data: eventsData } = useQuery({
    queryKey: ['events', { scope: 'upcoming', limit: 4 }],
    queryFn: () => listEvents({ scope: 'upcoming', limit: 4 }),
    staleTime: 2 * 60_000,
    enabled: queryEnabled,
  });
  const events = eventsData?.events ? mapEventsToCalendar(eventsData.events) : null;

  const { data: activityData } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => getDashboardActivity({ limit: 5 }),
    staleTime: 60_000,
    enabled: queryEnabled,
  });
  const activityItems = activityData ? mapActivityItems(activityData) : null;

  const { data: pollData } = useQuery({
    queryKey: ['polls', 'active'],
    queryFn: getActivePoll,
    staleTime: 5 * 60_000,
    enabled: queryEnabled,
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', { limit: 4 }],
    queryFn: () => listJobs({ limit: 4 }),
    staleTime: 2 * 60_000,
    enabled: queryEnabled,
  });

  const stats = statsData
    ? {
        activeProfiles: statsData.activeProfiles,
        matchesThisWeek: statsData.matchesThisWeek,
        trendPercent: statsData.trendPercent,
        chartData: statsData.chartData,
      }
    : null;

  if (!sessionReady || !hasSession) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground shadow-sm">
          Preparing your dashboard...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-glow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">
                {greeting}, {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {userRole === 'mentor'
                  ? 'Check your upcoming sessions and mentee requests.'
                  : userRole === 'investor'
                    ? 'Discover promising founders and track your portfolio.'
                    : pendingCount > 0
                      ? `You have ${pendingCount} pending connection${pendingCount > 1 ? 's' : ''} to review.`
                      : "Here's what's happening in your network today."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OptimizedLink href="/discover">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                  <Compass className="h-3.5 w-3.5" />
                  Discover
                </button>
              </OptimizedLink>
              <OptimizedLink href="/connections">
                <button className="relative inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70">
                  <UserPlus className="h-3.5 w-3.5" />
                  Connections
                  {pendingCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              </OptimizedLink>
              <OptimizedLink href="/messages">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Messages
                </button>
              </OptimizedLink>
              <OptimizedLink href="/events">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70">
                  <Calendar className="h-3.5 w-3.5" />
                  Events
                </button>
              </OptimizedLink>
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <AnimatedCard index={0}>
              <DashboardHero />
            </AnimatedCard>
            <AnimatedCard index={1}>
              <DashboardActivity items={activityItems} />
            </AnimatedCard>
            <AnimatedCard index={2}>
              <DashboardNewsletter />
            </AnimatedCard>
          </div>
          <div className="space-y-6">
            <AnimatedCard index={3}>
              <DashboardStats data={stats} isLoading={statsLoading} />
            </AnimatedCard>
            <AnimatedCard index={4}>
              <DashboardJobs jobs={jobsData?.jobs ?? null} />
            </AnimatedCard>
          </div>
          <div className="space-y-6">
            <AnimatedCard index={5}>
              <DashboardMembers members={members} />
            </AnimatedCard>
            <AnimatedCard index={6}>
              <DashboardPoll poll={pollData?.poll ?? null} />
            </AnimatedCard>
            <AnimatedCard index={7}>
              <DashboardCalendar events={events} />
            </AnimatedCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
