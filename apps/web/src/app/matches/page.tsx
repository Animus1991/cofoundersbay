'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ArrowRight, UserPlus, SlidersHorizontal, ArrowUpDown, RefreshCw } from 'lucide-react';
import { getRecommendations, sendConnectionRequest, type SearchHit } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { MatchCard } from '@/components/common/MatchCard';
import { useToast } from '@/components/ui/toast';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { ProfileCardSkeleton } from '@/components/discover/ProfileCard';
import { cn } from '@/lib/utils';
import type { ProfileCardData } from '@/components/discover/ProfileCard';

const ConnectionRequestDialog = dynamic(() => import('@/components/common/ConnectionRequest').then((m) => ({ default: m.ConnectionRequestDialog })), { ssr: false });

type MatchReason = { type: 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values'; text: string; score: number };

function buildMatchReasonsFromScore(score: number): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (score >= 30) reasons.push({ type: 'skills', text: 'Complementary role & skills', score: 30 });
  if (score >= 45) reasons.push({ type: 'stage', text: 'Matching startup stage', score: Math.min(20, score - 30) });
  if (score >= 65) reasons.push({ type: 'industry', text: 'Similar industry focus', score: 15 });
  if (score >= 80) reasons.push({ type: 'location', text: 'Same location', score: 10 });
  if (reasons.length === 0) reasons.push({ type: 'skills', text: 'Potential match', score });
  return reasons;
}

function hitToProfile(hit: SearchHit): ProfileCardData {
  return {
    id: hit.id,
    userId: hit.userId,
    displayName: hit.displayName,
    headline: hit.headline,
    bio: hit.bio,
    avatarUrl: hit.avatarUrl,
    role: hit.role,
    location: hit.location,
    skills: hit.skillNames ?? [],
    matchScore: hit.matchScore,
    lookingFor: hit.lookingFor,
    availability: hit.availability,
  };
}

type FilterKey = 'all' | 'excellent' | 'strong' | 'good' | 'potential';
type SortKey = 'score' | 'name';

const TIER_COLORS = {
  excellent: '#4ADE80',
  strong:    '#22D3EE',
  good:      '#FB923C',
  potential: '#F87171',
};

export default function MatchesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [connectionTarget, setConnectionTarget] = useState<ProfileCardData | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');

  const hasToken = useIsAuthenticated();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendations', 'matches', { limit: 30 }],
    queryFn: () => getRecommendations({ limit: 30 }),
    staleTime: 3 * 60_000,
    enabled: hasToken,
  });

  const suggestions: SearchHit[] = data?.suggestions ?? [];

  const counts = useMemo(() => ({
    all:       suggestions.length,
    excellent: suggestions.filter(s => (s.matchScore ?? 0) >= 80).length,
    strong:    suggestions.filter(s => { const sc = s.matchScore ?? 0; return sc >= 65 && sc < 80; }).length,
    good:      suggestions.filter(s => { const sc = s.matchScore ?? 0; return sc >= 45 && sc < 65; }).length,
    potential: suggestions.filter(s => (s.matchScore ?? 0) < 45).length,
  }), [suggestions]);

  const avgScore = useMemo(() => {
    if (!suggestions.length) return 0;
    return Math.round(suggestions.reduce((sum, s) => sum + (s.matchScore ?? 0), 0) / suggestions.length);
  }, [suggestions]);

  const filtered = useMemo(() => {
    let list = [...suggestions];
    if (activeFilter === 'excellent') list = list.filter(s => (s.matchScore ?? 0) >= 80);
    else if (activeFilter === 'strong') list = list.filter(s => { const sc = s.matchScore ?? 0; return sc >= 65 && sc < 80; });
    else if (activeFilter === 'good') list = list.filter(s => { const sc = s.matchScore ?? 0; return sc >= 45 && sc < 65; });
    else if (activeFilter === 'potential') list = list.filter(s => (s.matchScore ?? 0) < 45);
    if (sortBy === 'score') list.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    else if (sortBy === 'name') list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return list;
  }, [suggestions, activeFilter, sortBy]);

  const handleConnect = (profile: ProfileCardData) => {
    setConnectionTarget(profile);
    setShowConnectionDialog(true);
  };

  const handleSendConnection = async (message: string) => {
    if (!connectionTarget) return;
    try {
      await sendConnectionRequest({ receiverId: connectionTarget.userId, message: message || undefined });
      success('Connection request sent!', `Your request to ${connectionTarget.displayName} has been sent.`);
      setShowConnectionDialog(false);
      setConnectionTarget(null);
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err) {
      showError('Could not send request', err instanceof Error ? err.message : 'Please try again');
    }
  };

  const handleMessage = (profile: ProfileCardData) => {
    router.push(`/messages?to=${profile.userId}`);
  };

  const TABS: { key: FilterKey; label: string; color?: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'excellent', label: 'Excellent',  color: TIER_COLORS.excellent },
    { key: 'strong',    label: 'Strong',     color: TIER_COLORS.strong },
    { key: 'good',      label: 'Good',       color: TIER_COLORS.good },
    { key: 'potential', label: 'Potential',  color: TIER_COLORS.potential },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Context Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              Matches
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-ranked co-founder and team matches based on your profile compatibility
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Link href="/discover">
              <Button variant="outline" size="sm" className="gap-2">
                Explore
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {!hasToken && (
          <EmptyState
            title="Sign in to see matches"
            description="Your matches are personalized based on your profile and preferences."
            illustration="connection"
            action={
              <Link href="/login">
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            }
          />
        )}

        {hasToken && isError && (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">Failed to load matches.</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>Retry</Button>
          </CardContent></Card>
        )}

        {hasToken && !isLoading && suggestions.length > 0 && (
          <>
            {/* Stats Overview */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{counts.all}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Matches</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: '#4ADE80' }}>{counts.excellent}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Excellent (≥80%)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: '#22D3EE' }}>{avgScore}%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Average Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: '#FB923C' }}>{counts.strong}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Strong (65-79%)</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {TABS.map(tab => {
                      const isActive = activeFilter === tab.key;
                      const cnt = counts[tab.key];
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveFilter(tab.key)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          {tab.color && (
                            <span className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: tab.color }} />
                          )}
                          {tab.label}
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {cnt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortKey)}
                      className="bg-transparent text-sm text-muted-foreground border-none outline-none cursor-pointer hover:text-foreground transition-colors"
                    >
                      <option value="score">Best Match</option>
                      <option value="name">Name A–Z</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {hasToken && isLoading && (
          <div className="grid gap-5 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <ProfileCardSkeleton key={i} variant="featured" />
            ))}
          </div>
        )}

        {hasToken && !isLoading && suggestions.length === 0 && (
          <EmptyState
            title="No matches yet"
            description="Complete your profile (stage, commitment, roles sought) to get better cofounder and team suggestions."
            illustration="rocket"
            action={
              <Link href="/profile/edit">
                <Button className="gap-2">
                  Complete profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
        )}

        {hasToken && !isLoading && filtered.length === 0 && suggestions.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No matches in this category.</p>
            <button onClick={() => setActiveFilter('all')}
              className="mt-2 text-xs text-primary hover:underline">
              Show all matches
            </button>
          </div>
        )}

        {hasToken && !isLoading && filtered.length > 0 && (
          <AnimatedList
            animation="scale-in"
            staggerDelay={60}
            className="grid gap-5 md:grid-cols-2"
          >
            {filtered.map((hit) => {
              const profile = hitToProfile(hit);
              const score = hit.matchScore ?? 50;
              const matchReasons: MatchReason[] = hit.matchReasons?.length
                ? hit.matchReasons.map((text) => ({ type: 'skills' as const, text, score: 0 }))
                : buildMatchReasonsFromScore(score);
              return (
                <MatchCard
                  key={hit.id}
                  id={hit.id}
                  userId={hit.userId}
                  displayName={hit.displayName}
                  headline={hit.headline}
                  avatarUrl={hit.avatarUrl}
                  role={hit.role}
                  location={hit.location}
                  skills={hit.skillNames ?? []}
                  compatibilityScore={score}
                  matchReasons={matchReasons}
                  onLike={() => handleConnect(profile)}
                  onPass={() => {}}
                  onMessage={() => handleMessage(profile)}
                  onBookmark={() => success('Saved', `${hit.displayName} added to bookmarks`)}
                />
              );
            })}
          </AnimatedList>
        )}
      </div>

      {connectionTarget && (
        <ConnectionRequestDialog
          open={showConnectionDialog}
          onOpenChange={(open) => {
            setShowConnectionDialog(open);
            if (!open) setConnectionTarget(null);
          }}
          recipient={{
            id: connectionTarget.userId,
            displayName: connectionTarget.displayName,
            avatarUrl: connectionTarget.avatarUrl,
            role: connectionTarget.role,
            headline: connectionTarget.headline,
          }}
          onSend={handleSendConnection}
        />
      )}
    </AppShell>
  );
}
