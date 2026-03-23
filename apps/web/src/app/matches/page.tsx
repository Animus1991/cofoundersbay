'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ArrowRight, UserPlus, SlidersHorizontal, ArrowUpDown, RefreshCw, BarChart3, Award, Zap, ChevronRight, X } from 'lucide-react';
import { getRecommendations, sendConnectionRequest, type SearchHit } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { MatchCard } from '@/components/common/MatchCard';
import { useToast } from '@/components/ui/toast';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { ProfileCardSkeleton } from '@/components/discover/ProfileCard';
import { cn } from '@/lib/utils';
import type { ProfileCardData } from '@/components/discover/ProfileCard';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const ConnectionRequestDialog = dynamic(() => import('@/components/common/ConnectionRequest').then((m) => ({ default: m.ConnectionRequestDialog })), { ssr: false });

type MatchReason = { type: 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values'; text: string; score: number };

function buildDimensions(score: number) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return [
    { subject: 'Skills',   value: clamp(score + Math.round(score * 0.08)),  fullMark: 100 },
    { subject: 'Stage',    value: clamp(score - Math.round(score * 0.05)),  fullMark: 100 },
    { subject: 'Industry', value: clamp(score + Math.round(score * 0.12)),  fullMark: 100 },
    { subject: 'Location', value: clamp(score - Math.round(score * 0.15)),  fullMark: 100 },
    { subject: 'Values',   value: clamp(score + Math.round(score * 0.04)),  fullMark: 100 },
  ];
}

function CompatibilityModal({ hit, open, onClose }: { hit: SearchHit | null; open: boolean; onClose: () => void }) {
  if (!hit) return null;
  const score = hit.matchScore ?? 50;
  const dims = buildDimensions(score);
  const reasons: MatchReason[] = hit.matchReasons?.length
    ? hit.matchReasons.map((t) => ({ type: 'skills' as const, text: t, score: 0 }))
    : buildMatchReasonsFromScore(score);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Compatibility with {hit.displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 rounded-xl bg-primary/8 p-4">
          <div className="text-center">
            <p className="text-4xl font-extrabold tabular-nums text-primary">{score}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Overall Match</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={dims}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>

        <div className="space-y-2.5">
          {dims.map((d) => (
            <div key={d.subject} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">{d.subject}</span>
                <span className="text-muted-foreground tabular-nums">{d.value}%</span>
              </div>
              <Progress value={d.value} className="h-1.5" />
            </div>
          ))}
        </div>

        {reasons.length > 0 && (
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why you match</p>
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Zap className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{r.text}</span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  const [breakdownTarget, setBreakdownTarget] = useState<SearchHit | null>(null);

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

        {/* Top Match Spotlight */}
        {hasToken && !isLoading && suggestions.length > 0 && counts.excellent > 0 && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {counts.excellent} Excellent Match{counts.excellent !== 1 ? 'es' : ''} Found
                </p>
                <p className="text-xs text-muted-foreground">
                  {filtered[0]?.matchScore ?? 0}% top score · Act now before they connect with someone else
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveFilter('excellent')} className="shrink-0">
              View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
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
                <div key={hit.id} className="space-y-0">
                  <MatchCard
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
                  <div className="flex items-center justify-between px-4 py-2 rounded-b-xl border border-t-0 border-border/40 bg-secondary/20">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] h-5',
                        score >= 80 ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        score >= 65 ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' :
                        score >= 45 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                      'bg-red-500/10 text-red-500 border-red-500/20'
                      )}
                    >
                      {score >= 80 ? 'Excellent' : score >= 65 ? 'Strong' : score >= 45 ? 'Good' : 'Potential'}
                    </Badge>
                    <button
                      onClick={() => setBreakdownTarget(hit)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      <BarChart3 className="h-3 w-3" /> View breakdown
                    </button>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        )}
      </div>

      <CompatibilityModal
        hit={breakdownTarget}
        open={!!breakdownTarget}
        onClose={() => setBreakdownTarget(null)}
      />

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
