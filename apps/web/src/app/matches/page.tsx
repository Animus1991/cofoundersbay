'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, ArrowRight, UserPlus, ArrowUpDown, RefreshCw, BarChart3, Award, Zap, ChevronRight,
  X, LayoutGrid, List, Search, MapPin, Briefcase, GraduationCap, DollarSign, Users,
  Bookmark, BookmarkCheck, MessageCircle, Heart, RotateCcw, SlidersHorizontal, Clock,
  TrendingUp, Star, CheckCircle2,
} from 'lucide-react';
import { getRecommendations, sendConnectionRequest, saveToShortlist, removeFromShortlist, recordMatchFeedback, getShortlistIds, type SearchHit } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { MatchCard } from '@/components/common/MatchCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { ProfileCardSkeleton } from '@/components/discover/ProfileCard';
import { cn } from '@/lib/utils';
import type { ProfileCardData } from '@/components/discover/ProfileCard';

const ConnectionRequestDialog = dynamic(() => import('@/components/common/ConnectionRequest').then((m) => ({ default: m.ConnectionRequestDialog })), { ssr: false });
const MatchCompatibilityChart = dynamic(
  () => import('@/components/charts/MatchCompatibilityChart').then((m) => ({ default: m.MatchCompatibilityChart })),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-lg" /> }
);

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

        <MatchCompatibilityChart dims={dims} />

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
type RoleFilter = 'all' | 'founder' | 'mentor' | 'investor' | 'org';
type SortKey = 'score' | 'name' | 'recent';
type AvailFilter = 'full_time' | 'part_time' | 'advisory' | 'contract';
type ViewMode = 'grid2' | 'grid3' | 'list';

const TIER_COLORS = {
  excellent: '#4ADE80',
  strong:    '#22D3EE',
  good:      '#FB923C',
  potential: '#F87171',
};

const TIER_CLASSES: Record<string, string> = {
  excellent: 'bg-green-500/10 text-green-600 border-green-500/20',
  strong:    'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  good:      'bg-amber-500/10 text-amber-600 border-amber-500/20',
  potential: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function getTier(score: number): keyof typeof TIER_COLORS {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'strong';
  if (score >= 45) return 'good';
  return 'potential';
}

function roleMatchesFilter(role: string, filter: RoleFilter): boolean {
  if (filter === 'all') return true;
  const r = role.toLowerCase();
  if (filter === 'founder') return r.includes('founder') || r === 'technical_talent' || r === 'operator';
  if (filter === 'mentor') return r === 'mentor' || r === 'advisor' || r === 'coach';
  if (filter === 'investor') return r.includes('investor') || r === 'vc_analyst' || r === 'vc_scout' || r === 'angel_investor';
  if (filter === 'org') return r.includes('org') || r.includes('admin') || r === 'community_manager';
  return true;
}

/* ── List-view row component ─────────────────────────────────────────────── */
function MatchListRow({
  hit,
  matchReasons,
  isSaved,
  onConnect,
  onMessage,
  onPass,
  onSave,
  onBreakdown,
}: {
  hit: SearchHit;
  matchReasons: MatchReason[];
  isSaved: boolean;
  onConnect: () => void;
  onMessage: () => void;
  onPass: () => void;
  onSave: () => void;
  onBreakdown: () => void;
}) {
  const score = hit.matchScore ?? 50;
  const tier = getTier(score);
  const color = TIER_COLORS[tier];
  const initials = hit.displayName.slice(0, 2).toUpperCase();

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Score ring + avatar */}
          <div className="relative shrink-0">
            <svg width={52} height={52} viewBox="0 0 52 52" className="absolute inset-0">
              <circle cx={26} cy={26} r={23} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
              <circle cx={26} cy={26} r={23} fill="none" stroke={color} strokeWidth={3}
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 23} ${2 * Math.PI * 23}`}
                strokeDashoffset={2 * Math.PI * 23 * 0.25}
                strokeLinecap="round" />
            </svg>
            <Link href={`/profiles/${hit.userId}`}>
              <Avatar className="h-12 w-12 border-2 border-background m-0.5 rounded-lg">
                <AvatarImage src={hit.avatarUrl ?? undefined} />
                <AvatarFallback className="text-sm font-semibold rounded-lg">{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/profiles/${hit.userId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {hit.displayName}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className={cn('text-[10px] h-5', TIER_CLASSES[tier])}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} · {score}%
                  </Badge>
                  {hit.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{hit.location}
                    </span>
                  )}
                </div>
                {hit.headline && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{hit.headline}</p>}
              </div>
              {/* Score text */}
              <div className="text-right shrink-0">
                <p className="text-lg font-black tabular-nums leading-none" style={{ color }}>{score}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">match</p>
              </div>
            </div>

            {/* Skills + reasons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(hit.skillNames ?? []).slice(0, 5).map(s => (
                <span key={s} className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {s}
                </span>
              ))}
              {(hit.skillNames ?? []).length > 5 && (
                <span className="text-xs text-muted-foreground self-center">+{(hit.skillNames ?? []).length - 5}</span>
              )}
            </div>

            {/* Match reasons inline */}
            {matchReasons.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matchReasons.slice(0, 3).map((r, i) => (
                  <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Zap className="h-2.5 w-2.5 shrink-0" style={{ color }} />
                    {r.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={onPass}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              title="Pass">
              <X className="h-3.5 w-3.5" />
            </button>
            <button onClick={onSave}
              className={cn('h-8 w-8 flex items-center justify-center rounded-full transition-colors', isSaved ? 'text-amber-400' : 'border border-border/60 text-muted-foreground hover:text-amber-400')}
              title={isSaved ? 'Saved' : 'Save to shortlist'}>
              {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onBreakdown}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1.5 rounded-md hover:bg-secondary/60">
              <BarChart3 className="h-3.5 w-3.5" /> Breakdown
            </button>
            <Button size="sm" variant="outline" onClick={onMessage} className="h-8 gap-1.5 text-xs px-3">
              <MessageCircle className="h-3.5 w-3.5" /> Message
            </Button>
            <Button size="sm" onClick={onConnect} className="h-8 gap-1.5 text-xs px-3">
              <Heart className="h-3.5 w-3.5" /> Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  /* ── UI state ── */
  const [connectionTarget, setConnectionTarget] = useState<ProfileCardData | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [viewMode, setViewMode] = useState<ViewMode>('grid2');
  const [nameSearch, setNameSearch] = useState('');
  const [breakdownTarget, setBreakdownTarget] = useState<SearchHit | null>(null);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [lastPassed, setLastPassed] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [availFilter, setAvailFilter] = useState<Set<AvailFilter>>(new Set());

  const hasToken = useIsAuthenticated();

  const { data: shortlistIdsData } = useQuery({
    queryKey: ['shortlist', 'ids'],
    queryFn: getShortlistIds,
    staleTime: 5 * 60_000,
    enabled: hasToken,
  });

  useEffect(() => {
    if (shortlistIdsData?.ids) {
      setSavedIds(new Set(shortlistIdsData.ids));
    }
  }, [shortlistIdsData]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendations', 'matches', { limit: 50 }],
    queryFn: () => getRecommendations({ limit: 50 }),
    staleTime: 3 * 60_000,
    enabled: hasToken,
  });

  const suggestions: SearchHit[] = data?.suggestions ?? [];
  const visible = useMemo(() => suggestions.filter(s => !passedIds.has(s.id)), [suggestions, passedIds]);

  const counts = useMemo(() => ({
    all:       visible.length,
    excellent: visible.filter(s => (s.matchScore ?? 0) >= 80).length,
    strong:    visible.filter(s => { const sc = s.matchScore ?? 0; return sc >= 65 && sc < 80; }).length,
    good:      visible.filter(s => { const sc = s.matchScore ?? 0; return sc >= 45 && sc < 65; }).length,
    potential: visible.filter(s => (s.matchScore ?? 0) < 45).length,
  }), [visible]);

  const avgScore = useMemo(() => {
    if (!visible.length) return 0;
    return Math.round(visible.reduce((sum, s) => sum + (s.matchScore ?? 0), 0) / visible.length);
  }, [visible]);

  const topScore = useMemo(() =>
    visible.reduce((max, s) => Math.max(max, s.matchScore ?? 0), 0), [visible]);

  const filtered = useMemo(() => {
    let list = [...visible];
    if (activeFilter !== 'all') {
      list = list.filter(s => getTier(s.matchScore ?? 0) === activeFilter);
    }
    if (roleFilter !== 'all') {
      list = list.filter(s => roleMatchesFilter(s.role, roleFilter));
    }
    if (nameSearch.trim()) {
      const q = nameSearch.toLowerCase();
      list = list.filter(s =>
        s.displayName.toLowerCase().includes(q) ||
        (s.headline ?? '').toLowerCase().includes(q) ||
        (s.skillNames ?? []).some(sk => sk.toLowerCase().includes(q))
      );
    }
    if (locationFilter.trim()) {
      const loc = locationFilter.toLowerCase();
      list = list.filter(s => (s.location ?? '').toLowerCase().includes(loc));
    }
    if (availFilter.size > 0) {
      list = list.filter(s => {
        const av = (s.availability ?? '').toLowerCase();
        return [...availFilter].some(f => av.includes(f.replace('_', ' ').replace('_', '-')));
      });
    }
    if (sortBy === 'score') list.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    else if (sortBy === 'name') list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    // 'recent': preserve original API order — no-op
    return list;
  }, [visible, activeFilter, roleFilter, nameSearch, sortBy, locationFilter, availFilter]);

  const handleConnect = useCallback((profile: ProfileCardData) => {
    setConnectionTarget(profile);
    setShowConnectionDialog(true);
  }, []);

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

  const handleMessage = useCallback((profile: ProfileCardData) => {
    router.push(`/messages?to=${profile.userId}`);
  }, [router]);

  const handlePass = useCallback((id: string, name: string, userId: string) => {
    setPassedIds(prev => new Set(prev).add(id));
    setLastPassed(id);
    void recordMatchFeedback({ targetUserId: userId, feedback: 'declined' }).catch(() => {});
    success('Passed', `${name} removed · Undo?`);
  }, [success]);

  const handleUndoPass = useCallback(() => {
    if (!lastPassed) return;
    setPassedIds(prev => { const next = new Set(prev); next.delete(lastPassed); return next; });
    setLastPassed(null);
  }, [lastPassed]);

  const handleSave = useCallback((userId: string, name: string) => {
    setSavedIds(prev => {
      const isSaved = prev.has(userId);
      const next = new Set(prev);
      if (isSaved) {
        next.delete(userId);
        void removeFromShortlist(userId).catch(() =>
          setSavedIds(p => { const r = new Set(p); r.add(userId); return r; })
        );
      } else {
        next.add(userId);
        success('Saved to shortlist', `${name} added to your saved profiles`);
        void saveToShortlist(userId).catch(() =>
          setSavedIds(p => { const r = new Set(p); r.delete(userId); return r; })
        );
      }
      return next;
    });
  }, [success]);

  const TIER_TABS: { key: FilterKey; label: string; color?: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'excellent', label: 'Excellent',  color: TIER_COLORS.excellent },
    { key: 'strong',    label: 'Strong',     color: TIER_COLORS.strong },
    { key: 'good',      label: 'Good',       color: TIER_COLORS.good },
    { key: 'potential', label: 'Potential',  color: TIER_COLORS.potential },
  ];

  const ROLE_TABS: { key: RoleFilter; label: string; icon: typeof Users }[] = [
    { key: 'all',      label: 'All roles',  icon: Users },
    { key: 'founder',  label: 'Founders',   icon: Briefcase },
    { key: 'mentor',   label: 'Mentors',    icon: GraduationCap },
    { key: 'investor', label: 'Investors',  icon: DollarSign },
    { key: 'org',      label: 'Orgs',       icon: Users },
  ];

  const AVAIL_OPTIONS: { key: AvailFilter; label: string }[] = [
    { key: 'full_time', label: 'Full-time' },
    { key: 'part_time', label: 'Part-time' },
    { key: 'advisory',  label: 'Advisory' },
    { key: 'contract',  label: 'Contract' },
  ];

  const hasActiveFilters = activeFilter !== 'all' || roleFilter !== 'all' || nameSearch || locationFilter || availFilter.size > 0;

  return (
    <AppShell
      title="Matches"
      description="AI-ranked co-founder and team matches based on your profile compatibility"
      actions={
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
      }
    >
      <div className="space-y-5 pb-10">

        {/* ── Not authenticated ── */}
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

        {/* ── Error state ── */}
        {hasToken && isError && (
          <Card className="shadow-sm border-border/50">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">Failed to load matches.</p>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {/* ── Stats bar ── */}
        {hasToken && !isLoading && visible.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Matches',   value: counts.all,     color: 'text-foreground',     bg: 'bg-muted/40',        icon: Users },
              { label: 'Excellent ≥80%',  value: counts.excellent, color: 'text-green-600',   bg: 'bg-green-500/10',    icon: Star },
              { label: 'Avg Score',       value: `${avgScore}%`, color: 'text-cyan-600',       bg: 'bg-cyan-500/10',     icon: TrendingUp },
              { label: 'Top Score',       value: `${topScore}%`, color: 'text-violet-600',     bg: 'bg-violet-500/10',   icon: Award },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <Card key={label} className="shadow-sm border-border/50">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg)}>
                    <Icon className={cn('h-4 w-4', color)} />
                  </div>
                  <div>
                    <p className={cn('text-xl font-black tabular-nums leading-none', color)}>{value}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {hasToken && isLoading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ProfileCardSkeleton key={i} variant="featured" />
            ))}
          </div>
        )}

        {/* ── Insights banner (excellent matches) ── */}
        {hasToken && !isLoading && counts.excellent > 0 && (
          <div className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/5 via-card to-transparent p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2 shrink-0">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  🎯 {counts.excellent} Excellent Match{counts.excellent !== 1 ? 'es' : ''} Ready to Connect
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Top score: {topScore}% · These profiles are highly compatible with yours — reach out now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastPassed && (
                <Button size="sm" variant="ghost" onClick={handleUndoPass} className="gap-1.5 text-xs h-8 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Undo
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setActiveFilter('excellent')} className="gap-1.5 h-8 text-xs">
                View <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Filter + View toolbar ── */}
        {hasToken && !isLoading && visible.length > 0 && (
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-3 space-y-3">
              {/* Row 1: Tier tabs + view mode + sort */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Tier filter tabs */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {TIER_TABS.map(tab => {
                    const isActive = activeFilter === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                          isActive ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}>
                        {tab.color && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />}
                        {tab.label}
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                          {counts[tab.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right controls: search, sort, view */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShowSearch(s => !s)}
                    className={cn('h-8 w-8 flex items-center justify-center rounded-lg transition-colors',
                      showSearch ? 'bg-primary text-primary-foreground' : 'border border-border/60 text-muted-foreground hover:bg-secondary')}>
                    <Search className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5">
                    {([
                      { mode: 'grid2' as ViewMode, icon: LayoutGrid, title: '2-column grid', small: false },
                      { mode: 'grid3' as ViewMode, icon: LayoutGrid, title: '3-column grid', small: true },
                      { mode: 'list'  as ViewMode, icon: List,       title: 'List view',     small: false },
                    ]).map(({ mode, icon: Icon, title, small }) => (
                      <button key={mode} onClick={() => setViewMode(mode)} title={title}
                        className={cn('h-7 px-2 flex items-center justify-center rounded-md transition-all',
                          viewMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                        <Icon className={cn('h-3.5 w-3.5', small && 'scale-90')} />
                        {mode === 'grid3' && <span className="text-[9px] ml-0.5 font-bold">3</span>}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAdvancedFilters(s => !s)}
                    className={cn('flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-colors border',
                      showAdvancedFilters || locationFilter || availFilter.size > 0
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground')}
                    title="More filters">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {(locationFilter || availFilter.size > 0) && (
                      <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1 text-[10px] font-bold">
                        {(locationFilter ? 1 : 0) + availFilter.size}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 border border-border/60 rounded-lg px-2.5 py-1.5">
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                      className="bg-transparent text-xs text-muted-foreground border-none outline-none cursor-pointer hover:text-foreground transition-colors">
                      <option value="score">Best Match</option>
                      <option value="name">Name A–Z</option>
                      <option value="recent">Newest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Role filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {ROLE_TABS.map(({ key, label, icon: Icon }) => {
                  const isActive = roleFilter === key;
                  return (
                    <button key={key} onClick={() => setRoleFilter(key)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all whitespace-nowrap',
                        isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}>
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                })}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setActiveFilter('all'); setRoleFilter('all'); setNameSearch(''); setShowSearch(false);
                      setLocationFilter(''); setAvailFilter(new Set());
                    }}
                    className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>

              {/* Row 3: Search input (conditional) */}
              {showSearch && (
                <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={nameSearch}
                    onChange={e => setNameSearch(e.target.value)}
                    placeholder="Search by name, headline, or skill..."
                    className="pl-9 h-9 text-sm"
                    autoFocus
                  />
                  {nameSearch && (
                    <button onClick={() => setNameSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Advanced filter panel */}
              {showAdvancedFilters && (
                <div className="rounded-lg border border-border/40 bg-secondary/20 p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={locationFilter}
                          onChange={e => setLocationFilter(e.target.value)}
                          placeholder="City or country..."
                          className="w-full h-8 rounded-lg border border-border/60 bg-background pl-8 pr-3 text-xs outline-none focus:border-primary/60 transition-colors"
                        />
                        {locationFilter && (
                          <button onClick={() => setLocationFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Availability</label>
                      <div className="flex flex-wrap gap-1.5">
                        {AVAIL_OPTIONS.map(({ key, label }) => {
                          const isOn = availFilter.has(key);
                          return (
                            <button key={key} onClick={() => setAvailFilter(prev => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key); else next.add(key);
                              return next;
                            })}
                            className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                              isOn ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40')}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active filter summary */}
              {hasActiveFilters && (
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> match{filtered.length !== 1 ? 'es' : ''}
                  {activeFilter !== 'all' && ` · ${activeFilter}`}
                  {roleFilter !== 'all' && ` · ${ROLE_TABS.find(r => r.key === roleFilter)?.label}`}
                  {nameSearch && ` · "${nameSearch}"`}
                  {locationFilter && ` · ${locationFilter}`}
                  {availFilter.size > 0 && ` · ${[...availFilter].join(', ')}`}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Empty states ── */}
        {hasToken && !isLoading && visible.length === 0 && (
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

        {hasToken && !isLoading && filtered.length === 0 && visible.length > 0 && (
          <Card className="shadow-sm border-border/50">
            <CardContent className="py-12 text-center">
              <SlidersHorizontal className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-foreground mb-1">No matches for these filters</p>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting the tier or role filter</p>
              <Button variant="outline" size="sm" onClick={() => { setActiveFilter('all'); setRoleFilter('all'); setNameSearch(''); }}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Matches grid / list ── */}
        {hasToken && !isLoading && filtered.length > 0 && viewMode !== 'list' && (
          <div className={cn(
            'grid gap-5',
            viewMode === 'grid3' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2',
          )}>
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
                  isBookmarked={savedIds.has(hit.userId)}
                  onLike={() => handleConnect(profile)}
                  onPass={() => handlePass(hit.id, hit.displayName, hit.userId)}
                  onMessage={() => handleMessage(profile)}
                  onBookmark={() => handleSave(hit.userId, hit.displayName)}
                  onBreakdown={() => setBreakdownTarget(hit)}
                />
              );
            })}
          </div>
        )}

        {hasToken && !isLoading && filtered.length > 0 && viewMode === 'list' && (
          <div className="space-y-3">
            {filtered.map((hit) => {
              const profile = hitToProfile(hit);
              const score = hit.matchScore ?? 50;
              const matchReasons: MatchReason[] = hit.matchReasons?.length
                ? hit.matchReasons.map((text) => ({ type: 'skills' as const, text, score: 0 }))
                : buildMatchReasonsFromScore(score);
              return (
                <MatchListRow
                  key={hit.id}
                  hit={hit}
                  matchReasons={matchReasons}
                  isSaved={savedIds.has(hit.userId)}
                  onConnect={() => handleConnect(profile)}
                  onMessage={() => handleMessage(profile)}
                  onPass={() => handlePass(hit.id, hit.displayName, hit.userId)}
                  onSave={() => handleSave(hit.userId, hit.displayName)}
                  onBreakdown={() => setBreakdownTarget(hit)}
                />
              );
            })}
          </div>
        )}

        {/* ── Results footer ── */}
        {hasToken && !isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
            <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} shown · {passedIds.size > 0 && `${passedIds.size} passed`}</span>
            <div className="flex items-center gap-3">
              {lastPassed && (
                <button onClick={handleUndoPass} className="flex items-center gap-1 text-primary hover:underline">
                  <RotateCcw className="h-3 w-3" /> Undo last pass
                </button>
              )}
              <Link href="/discover" className="flex items-center gap-1 hover:text-foreground transition-colors">
                Explore more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
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
