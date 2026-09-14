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
  TrendingUp, Star, CheckCircle2, CheckSquare,
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
import { SkillChip } from '@/components/common/SkillChip';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { ProfileCardSkeleton } from '@/components/discover/ProfileCard';
import { BilingualText } from '@/components/common/BilingualText';
import { matchesEn, matchesEl } from '@/lib/i18n/strings-matches';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
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
      <DialogContent className="max-h-[min(90dvh,calc(100svh-2rem))] max-w-md overflow-y-auto max-md:top-[max(0.5rem,env(safe-area-inset-top))] max-md:translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="icon-md text-primary-accessible" />
            <BilingualText en={`${matchesEn('compatibility_with')} ${hit.displayName}`} el={`${matchesEl('compatibility_with')} ${hit.displayName}`} />
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 rounded-xl bg-primary/8 p-4">
          <div className="text-center">
            <p className="text-4xl font-extrabold tabular-nums text-primary-accessible">{score}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <BilingualText en={matchesEn('overall_match')} el={matchesEl('overall_match')} />
            </p>
          </div>
        </div>

        <MatchCompatibilityChart dims={dims} />

        {reasons.length > 0 && (
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <BilingualText en={matchesEn('why_you_match')} el={matchesEl('why_you_match')} />
            </p>
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Zap className="icon-sm text-primary-accessible mt-0.5 flex-shrink-0" />
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

type MatchTier = 'excellent' | 'strong' | 'good' | 'potential';

const MATCH_TIER_TONE: Record<MatchTier, StatusTone> = {
  excellent: 'success',
  strong: 'info',
  good: 'warning',
  potential: 'danger',
};

const TIER_STROKE: Record<MatchTier, string> = {
  excellent: 'hsl(var(--status-success-fg))',
  strong: 'hsl(var(--status-info-fg))',
  good: 'hsl(var(--status-warning-fg))',
  potential: 'hsl(var(--status-danger-fg))',
};

const TIER_DOT: Record<MatchTier, string> = {
  excellent: 'bg-status-success',
  strong: 'bg-status-info',
  good: 'bg-status-warning',
  potential: 'bg-status-danger',
};

function tierStyle(tier: MatchTier) {
  return STATUS[MATCH_TIER_TONE[tier]];
}

function getTier(score: number): MatchTier {
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
  const colors = tierStyle(tier);
  const stroke = TIER_STROKE[tier];
  const initials = hit.displayName.slice(0, 2).toUpperCase();

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Score ring + avatar */}
          <div className="relative shrink-0">
            <svg width={52} height={52} viewBox="0 0 52 52" className="absolute inset-0">
              <circle cx={26} cy={26} r={23} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
              <circle cx={26} cy={26} r={23} fill="none" stroke={stroke} strokeWidth={3}
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 23} ${2 * Math.PI * 23}`}
                strokeDashoffset={2 * Math.PI * 23 * 0.25}
                strokeLinecap="round" />
            </svg>
            <Link href={`/profiles/${hit.userId}`}>
              <Avatar className="h-10 w-10 border-2 border-background m-0.5 rounded-lg">
                <AvatarImage src={hit.avatarUrl ?? undefined} />
                <AvatarFallback className="text-sm font-semibold rounded-lg">{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/profiles/${hit.userId}`} className="inline-flex tap-target-y items-center font-semibold text-foreground transition-colors hover:text-primary-accessible">
                  {hit.displayName}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className={cn('text-2xs h-5 border', colors.chip)}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} · {score}%
                  </Badge>
                  {hit.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="icon-sm" />{hit.location}
                    </span>
                  )}
                </div>
                {hit.headline && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{hit.headline}</p>}
              </div>
              {/* Score text */}
              <div className="text-right shrink-0">
                <p className={cn('text-lg font-black tabular-nums leading-none', colors.icon)}>{score}%</p>
                <p className="text-2xs text-muted-foreground mt-0.5">match</p>
              </div>
            </div>

            {/* Skills + reasons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(hit.skillNames ?? []).slice(0, 5).map(s => (
                <span key={s} className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-2xs text-muted-foreground">
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
                  <span key={i} className="flex items-center gap-1 text-2xs text-muted-foreground">
                    <Zap className={cn('h-2.5 w-2.5 shrink-0', colors.icon)} />
                    {r.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1.5">
            <button onClick={onPass}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive-accessible"
              title="Pass" aria-label="Pass">
              <X className="icon-sm" />
            </button>
            <button onClick={onSave}
              className={cn('flex h-10 w-10 items-center justify-center rounded-full transition-colors', isSaved ? STATUS.warning.icon : 'border border-border/60 text-muted-foreground hover:text-status-warning')}
              title={isSaved ? 'Saved' : 'Save to shortlist'}>
              {isSaved ? <BookmarkCheck className="icon-sm" /> : <Bookmark className="icon-sm" />}
            </button>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <button onClick={onBreakdown}
              className="flex min-h-10 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-primary-accessible">
              <BarChart3 className="icon-sm" /> Breakdown
            </button>
            <Button size="sm" variant="outline" onClick={onMessage} className="h-10 gap-1.5 px-3 text-xs">
              <MessageCircle className="icon-sm" /> Message
            </Button>
            <Button size="sm" onClick={onConnect} className="h-10 gap-1.5 px-3 text-xs">
              <Heart className="icon-sm" /> Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Match Preview Panel ─────────────────────────────────────────────────── */
function MatchPreviewPanel({
  hit, matchReasons, savedIds, onClose, onConnect, onMessage, onSave, onPass, onBreakdown,
}: {
  hit: SearchHit;
  matchReasons: MatchReason[];
  savedIds: Set<string>;
  onClose: () => void;
  onConnect: () => void;
  onMessage: () => void;
  onSave: () => void;
  onPass: () => void;
  onBreakdown: () => void;
}) {
  const score = hit.matchScore ?? 50;
  const tier = getTier(score);
  const colors = tierStyle(tier);
  const isSaved = savedIds.has(hit.userId);

  return (
    <>
      {/* Backdrop (mobile) */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />

      {/* Slide panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[360px] overflow-y-auto border-l border-border/60 bg-card shadow-2xl animate-in slide-in-from-right duration-200 max-md:max-w-none">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/95 backdrop-blur-sm">
          <p className="text-sm font-semibold">Profile Preview</p>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground" aria-label="Close preview">
            <X className="icon-sm" />
          </button>
        </div>

        <div className="space-y-4 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center pt-1">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-border/60">
              <AvatarImage src={hit.avatarUrl ?? undefined} />
              <AvatarFallback className="rounded-2xl text-base font-bold bg-muted">
                {hit.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-3 text-lg font-bold text-foreground">{hit.displayName}</h3>
            <RoleBadge role={hit.role} size="sm" showIcon className="mt-1" />
            {hit.headline && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{hit.headline}</p>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-3 rounded-xl bg-secondary/30 p-3">
            <div className="text-center">
              <p className={cn('text-2xl font-extrabold tabular-nums', colors.icon)}>{score}%</p>
              <p className={cn('text-2xs font-bold tracking-wider uppercase mt-0.5', colors.icon)}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {hit.location && (
              <span className="flex items-center gap-1 rounded-full bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="icon-sm" /> {hit.location}
              </span>
            )}
            {hit.availability && (
              <span className="flex items-center gap-1 rounded-full bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                <Clock className="icon-sm" /> {hit.availability}
              </span>
            )}
          </div>

          {/* Skills */}
          {(hit.skillNames ?? []).length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(hit.skillNames ?? []).map(s => <SkillChip key={s} label={s} size="sm" />)}
              </div>
            </div>
          )}

          {/* Match reasons */}
          {matchReasons.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why you match</p>
              <div className="space-y-1.5">
                {matchReasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs bg-muted/60">
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', TIER_DOT[tier])} />
                    <span className="text-foreground">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex gap-2">
              <Button className="flex-1 gap-1.5" size="sm" onClick={onConnect}>
                <UserPlus className="icon-sm" /> Connect
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={onMessage}>
                <MessageCircle className="icon-sm" /> Message
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onSave}>
                {isSaved ? <BookmarkCheck className={cn('icon-sm', STATUS.warning.icon)} /> : <Bookmark className="icon-sm" />}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 hover:text-destructive-accessible" onClick={onPass}>
                <X className="icon-sm" /> Pass
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" onClick={onBreakdown}>
              <BarChart3 className="icon-sm" /> View breakdown
            </Button>
            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" asChild>
              <Link href={`/profiles/${hit.userId}`}>
                <ArrowRight className="icon-sm" /> Full profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
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
  const [previewTarget, setPreviewTarget] = useState<SearchHit | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const TIER_TABS: { key: FilterKey; labelEn: string; labelEl: string; tier?: MatchTier }[] = [
    { key: 'all',       labelEn: matchesEn('tier_all'),       labelEl: matchesEl('tier_all') },
    { key: 'excellent', labelEn: matchesEn('tier_excellent'), labelEl: matchesEl('tier_excellent'), tier: 'excellent' },
    { key: 'strong',    labelEn: matchesEn('tier_strong'),    labelEl: matchesEl('tier_strong'),    tier: 'strong' },
    { key: 'good',      labelEn: matchesEn('tier_good'),      labelEl: matchesEl('tier_good'),      tier: 'good' },
    { key: 'potential', labelEn: matchesEn('tier_potential'), labelEl: matchesEl('tier_potential'), tier: 'potential' },
  ];

  const ROLE_TABS: { key: RoleFilter; labelEn: string; labelEl: string; icon: typeof Users }[] = [
    { key: 'all',      labelEn: matchesEn('all_roles'),  labelEl: matchesEl('all_roles'),  icon: Users },
    { key: 'founder',  labelEn: matchesEn('founders'),   labelEl: matchesEl('founders'),   icon: Briefcase },
    { key: 'mentor',   labelEn: matchesEn('mentors'),    labelEl: matchesEl('mentors'),    icon: GraduationCap },
    { key: 'investor', labelEn: matchesEn('investors'),  labelEl: matchesEl('investors'),  icon: DollarSign },
    { key: 'org',      labelEn: matchesEn('orgs'),       labelEl: matchesEl('orgs'),       icon: Users },
  ];

  const AVAIL_OPTIONS: { key: AvailFilter; labelEn: string; labelEl: string }[] = [
    { key: 'full_time', labelEn: matchesEn('full_time'), labelEl: matchesEl('full_time') },
    { key: 'part_time', labelEn: matchesEn('part_time'), labelEl: matchesEl('part_time') },
    { key: 'advisory',  labelEn: matchesEn('advisory'),  labelEl: matchesEl('advisory') },
    { key: 'contract',  labelEn: matchesEn('contract'),  labelEl: matchesEl('contract') },
  ];

  const hasActiveFilters = activeFilter !== 'all' || roleFilter !== 'all' || nameSearch || locationFilter || availFilter.size > 0;

  const askAi = hasToken && visible.length > 0
    ? `Matches: ${counts.all} total, ${counts.excellent} excellent (≥80%), average ${avgScore}%, top ${topScore}%. ${filtered.length !== counts.all ? `${filtered.length} showing with current filters. ` : ''}Recommend who I should connect with first and draft a short intro.`
    : 'I am on Matches. Explain how compatibility scoring works and what to complete on my profile so I get better cofounder suggestions.';

  return (
    <AppShell
      title={matchesEn('page_title')}
      description={matchesEn('page_description')}
      showHelp
      askAi={askAi}
      contentClassName="overflow-x-clip"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="min-h-10 gap-1.5" onClick={() => void refetch()}>
            <RefreshCw className="icon-sm" />
            <BilingualText en={matchesEn('refresh')} el={matchesEl('refresh')} compact />
          </Button>
          <Button variant="outline" size="sm" className="min-h-10 gap-2" asChild>
            <Link href="/discover">
              <BilingualText en={matchesEn('explore')} el={matchesEl('explore')} compact />
              <ArrowRight className="icon-sm" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="min-w-0 space-y-4 overflow-x-clip pb-10">

        {/* ── Not authenticated ── */}
        {!hasToken && (
          <EmptyState
            title={<BilingualText en={matchesEn('sign_in_to_see')} el={matchesEl('sign_in_to_see')} />}
            description={<BilingualText en={matchesEn('sign_in_desc')} el={matchesEl('sign_in_desc')} />}
            illustration="connection"
            askAiPrompt="I am not signed in. Explain how matching works on CoFounderBay and what I should complete after login."
            action={
              <Button className="gap-2" asChild>
                <Link href="/login">
                  <UserPlus className="icon-sm" />
                  <BilingualText en={matchesEn('sign_in')} el={matchesEl('sign_in')} />
                </Link>
              </Button>
            }
          />
        )}

        {/* ── Error state ── */}
        {hasToken && isError && (
          <Card className="shadow-sm border-border/50">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                <BilingualText en={matchesEn('failed_to_load')} el={matchesEl('failed_to_load')} />
              </p>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                <BilingualText en={matchesEn('retry')} el={matchesEl('retry')} />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Loading skeletons ── */}
        {hasToken && isLoading && (
          <div className="flex gap-4 items-start">
            <div className="hidden md:block w-[220px] shrink-0 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
            <div className="flex-1 min-w-0 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <ProfileCardSkeleton key={i} variant="featured" />)}
            </div>
          </div>
        )}

        {/* ── Stats bar ── */}
        {hasToken && !isLoading && visible.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { labelEn: matchesEn('total_matches'), labelEl: matchesEl('total_matches'), value: counts.all, tone: 'neutral' as const, icon: Users },
              { labelEn: matchesEn('excellent_80'), labelEl: matchesEl('excellent_80'), value: counts.excellent, tone: 'success' as const, icon: Star },
              { labelEn: matchesEn('avg_score'), labelEl: matchesEl('avg_score'), value: `${avgScore}%`, tone: 'info' as const, icon: TrendingUp },
              { labelEn: matchesEn('top_score'), labelEl: matchesEl('top_score'), value: `${topScore}%`, tone: 'accent' as const, icon: Award },
            ].map(({ labelEn, labelEl, value, tone, icon: Icon }) => {
              const statColors = tone === 'neutral'
                ? { bg: 'bg-muted/40', icon: 'text-foreground' }
                : { bg: STATUS[tone].bg, icon: STATUS[tone].icon };
              return (
              <Card key={labelEn} className="min-w-0 shadow-sm border-border/50">
                <CardContent className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3.5">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9', statColors.bg)}>
                    <Icon className={cn('icon-sm', statColors.icon)} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-lg font-black tabular-nums leading-none sm:text-xl', statColors.icon)}>{value}</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                      <BilingualText en={labelEn} el={labelEl} compact />
                    </p>
                  </div>
                </CardContent>
              </Card>
            );})}
          </div>
        )}

        {/* ── Insights banner (excellent matches) ── */}
        {hasToken && !isLoading && counts.excellent > 0 && (
          <div className={cn('flex flex-col gap-3 rounded-xl border bg-gradient-to-r from-status-success-bg/50 via-card to-transparent p-4 animate-in fade-in slide-in-from-top-1 duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4', STATUS.success.border)}>
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <div className={cn('shrink-0 rounded-lg p-2', STATUS.success.bg)}>
                <Award className={cn('icon-md', STATUS.success.icon)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {counts.excellent} Excellent Match{counts.excellent !== 1 ? 'es' : ''} Ready to Connect
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Top score: {topScore}% · These profiles are highly compatible — reach out now
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              {lastPassed && (
                <Button size="sm" variant="ghost" onClick={handleUndoPass} className="gap-1.5 text-xs h-8 text-muted-foreground">
                  <RotateCcw className="icon-sm" /> Undo
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setActiveFilter('excellent')} className="gap-1.5 h-8 text-xs">
                View <ChevronRight className="icon-sm" />
              </Button>
            </div>
          </div>
        )}

        {/* ── No data at all ── */}
        {hasToken && !isLoading && visible.length === 0 && (
          <EmptyState
            title={<BilingualText en={matchesEn('no_matches_yet')} el={matchesEl('no_matches_yet')} />}
            description={<BilingualText en={matchesEn('no_matches_desc')} el={matchesEl('no_matches_desc')} />}
            illustration="rocket"
            askAiPrompt="I have no matches yet. Tell me which profile fields to complete so I get better cofounder suggestions."
            action={
              <Button className="gap-2" asChild>
                <Link href="/profile/edit">
                  <BilingualText en={matchesEn('complete_profile')} el={matchesEl('complete_profile')} />
                  <ArrowRight className="icon-sm" />
                </Link>
              </Button>
            }
          />
        )}

        {/* ── Two-column: filter sidebar + results ── */}
        {hasToken && !isLoading && visible.length > 0 && (
          <div className="flex gap-4 items-start">

            {/* ── Sticky filter sidebar (desktop md+) ── */}
            <aside className="hidden md:flex flex-col w-[220px] shrink-0 sticky top-[calc(3.5rem+1.25rem)] space-y-2.5 max-h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pb-4">

              {/* Tier filter */}
              <Card className="shadow-sm border-border/50">
                <CardContent className="p-3 space-y-0.5">
                  <p className="px-1 pb-1.5 text-2xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
                    <BilingualText en={matchesEn('match_tier')} el={matchesEl('match_tier')} compact wrap />
                  </p>
                  {TIER_TABS.map(tab => {
                    const isActive = activeFilter === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                        className={cn(
                          'flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}>
                        <span className="flex items-center gap-1.5">
                          {tab.tier && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', TIER_DOT[tab.tier])} />}
                          <BilingualText
                            en={tab.labelEn}
                            el={tab.labelEl}
                            compact
                            secondaryClassName={isActive ? 'text-primary-foreground' : undefined}
                          />
                        </span>
                        <span className={cn('rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
                          isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                          {counts[tab.key]}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Role filter */}
              <Card className="shadow-sm border-border/50">
                <CardContent className="p-3 space-y-0.5">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1.5">
                    <BilingualText en={matchesEn('role')} el={matchesEl('role')} compact />
                  </p>
                  {ROLE_TABS.map(({ key, labelEn, labelEl, icon: Icon }) => {
                    const isActive = roleFilter === key;
                    return (
                      <button key={key} onClick={() => setRoleFilter(key)}
                        className={cn(
                          'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isActive ? 'bg-primary/10 text-primary-accessible border border-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}>
                        <Icon className="icon-sm shrink-0" />
                        <BilingualText en={labelEn} el={labelEl} compact />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="shadow-sm border-border/50">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                    <BilingualText en={matchesEn('location')} el={matchesEl('location')} compact />
                  </p>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground pointer-events-none" />
                    <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
                      placeholder="City or country..."
                      className="w-full h-8 rounded-lg border border-border/60 bg-background pl-7 pr-7 text-xs outline-none focus:border-primary/60 transition-colors" />
                    {locationFilter && (
                      <button onClick={() => setLocationFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="icon-sm" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card className="shadow-sm border-border/50">
                <CardContent className="p-3 space-y-0.5">
                  <p className="px-1 pb-1.5 text-2xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
                    <BilingualText en={matchesEn('availability')} el={matchesEl('availability')} compact wrap />
                  </p>
                  {AVAIL_OPTIONS.map(({ key, labelEn, labelEl }) => {
                    const isOn = availFilter.has(key);
                    return (
                      <button key={key} onClick={() => setAvailFilter(prev => {
                        const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next;
                      })}
                        className={cn('flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium leading-snug transition-all',
                          isOn ? 'bg-primary/10 text-primary-accessible' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                        <span className={cn('mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          isOn ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>
                          {isOn && <span className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
                        </span>
                        <BilingualText en={labelEn} el={labelEl} compact wrap />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Sort */}
              <Card className="shadow-sm border-border/50">
                <CardContent className="p-3 space-y-0.5">
                  <p className="px-1 pb-1.5 text-2xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
                    <BilingualText en={matchesEn('sort_by')} el={matchesEl('sort_by')} compact wrap />
                  </p>
                  {([
                    { key: 'score'  as SortKey, labelEn: matchesEn('sort_best_match'), labelEl: matchesEl('sort_best_match'), icon: Zap },
                    { key: 'name'   as SortKey, labelEn: matchesEn('sort_name_az'),    labelEl: matchesEl('sort_name_az'),    icon: ArrowUpDown },
                    { key: 'recent' as SortKey, labelEn: matchesEn('sort_newest'),     labelEl: matchesEl('sort_newest'),     icon: Clock },
                  ]).map(({ key, labelEn, labelEl, icon: Icon }) => (
                    <button key={key} onClick={() => setSortBy(key)}
                      className={cn('flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium leading-snug transition-all',
                        sortBy === key ? 'bg-primary/10 text-primary-accessible border border-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                      <Icon className="mt-0.5 icon-sm shrink-0" />
                      <BilingualText en={labelEn} el={labelEl} compact wrap />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Clear all */}
              {hasActiveFilters && (
                <button
                  onClick={() => { setActiveFilter('all'); setRoleFilter('all'); setNameSearch(''); setLocationFilter(''); setAvailFilter(new Set()); }}
                  className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg text-xs text-muted-foreground border border-border/60 hover:bg-secondary hover:text-foreground transition-colors">
                  <X className="icon-sm" /> <BilingualText en={matchesEn('clear_all_filters')} el={matchesEl('clear_all_filters')} compact />
                </button>
              )}
            </aside>

            {/* ── Results column ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Mobile: scrollable tier chips + filters toggle */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide md:hidden -mx-1 px-1 pb-0.5">
                <button onClick={() => setShowAdvancedFilters(s => !s)}
                  className={cn('flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all',
                    showAdvancedFilters || hasActiveFilters ? 'border-primary bg-primary/10 text-primary-accessible' : 'border-border/60 text-muted-foreground')}>
                  <SlidersHorizontal className="icon-sm" /> Filters
                  {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
                {TIER_TABS.filter(t => t.key !== 'all').map(tab => {
                  const isActive = activeFilter === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setActiveFilter(isActive ? 'all' : tab.key)}
                      className={cn('flex min-h-10 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all',
                        isActive ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-muted-foreground')}>
                      {tab.tier && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', TIER_DOT[tab.tier])} />}
                      <BilingualText en={tab.labelEn} el={tab.labelEl} compact />
                    </button>
                  );
                })}
              </div>

              {/* Mobile: expanded filter panel */}
              {showAdvancedFilters && (
                <div className="md:hidden rounded-xl border border-border/40 bg-secondary/20 p-3 space-y-3 animate-in fade-in duration-150">
                  <div className="grid gap-3 grid-cols-2">
                    <div>
                      <label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                        <BilingualText en={matchesEn('tier')} el={matchesEl('tier')} compact />
                      </label>
                      <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as FilterKey)}
                        className="h-10 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none">
                        {TIER_TABS.map(({ key, labelEn }) => <option key={key} value={key}>{labelEn}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                        <BilingualText en={matchesEn('role')} el={matchesEl('role')} compact />
                      </label>
                      <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleFilter)}
                        className="h-10 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none">
                        {ROLE_TABS.map(({ key, labelEn }) => <option key={key} value={key}>{labelEn}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Location</label>
                      <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
                        placeholder="City or country..." className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-xs outline-none" />
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={() => { setActiveFilter('all'); setRoleFilter('all'); setLocationFilter(''); setAvailFilter(new Set()); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Clear all
                    </button>
                  )}
                </div>
              )}

              {/* Results toolbar */}
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-xs text-muted-foreground">
                  {filtered.length > 0 && (
                    <span>
                      <span className="font-semibold text-foreground">{filtered.length}</span> match{filtered.length !== 1 ? 'es' : ''}
                      {passedIds.size > 0 && <span className="text-muted-foreground/60"> · {passedIds.size} passed</span>}
                    </span>
                  )}
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}
                    className={cn('flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                      selectMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground')}
                    title="Select mode">
                    <CheckSquare className="icon-sm" />
                    <span className="hidden sm:inline">Select</span>
                    {selectedIds.size > 0 && <span className="rounded-full bg-primary-foreground/20 px-1 text-2xs font-bold">{selectedIds.size}</span>}
                  </button>

                  <button onClick={() => setShowSearch(s => !s)}
                    className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      showSearch ? 'bg-primary text-primary-foreground' : 'border border-border/60 text-muted-foreground hover:bg-secondary')}
                    aria-label="Search matches">
                    <Search className="icon-sm" />
                  </button>

                  <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
                    {([
                      { mode: 'grid2' as ViewMode, icon: LayoutGrid, title: '2-col', small: false, mobile: true },
                      { mode: 'grid3' as ViewMode, icon: LayoutGrid, title: '3-col', small: true, mobile: false },
                      { mode: 'list'  as ViewMode, icon: List,       title: 'List',  small: false, mobile: true },
                    ] as { mode: ViewMode; icon: typeof LayoutGrid; title: string; small: boolean; mobile: boolean }[]).map(({ mode, icon: Icon, title, small, mobile }) => (
                      <button key={mode} onClick={() => setViewMode(mode)} title={title}
                        className={cn('h-9 items-center justify-center rounded-md px-2 transition-all',
                          mobile ? 'flex' : 'hidden sm:flex',
                          viewMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                        <Icon className={cn('icon-sm', small && 'scale-90')} />
                        {mode === 'grid3' && <span className="ml-0.5 text-2xs font-bold">3</span>}
                      </button>
                    ))}
                  </div>

                  {lastPassed && (
                    <Button size="sm" variant="ghost" onClick={handleUndoPass} className="gap-1.5 text-xs h-8 text-muted-foreground px-2 sm:px-3">
                      <RotateCcw className="icon-sm" />
                      <span className="hidden sm:inline">Undo</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Search input (conditional) */}
              {showSearch && (
                <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                  <Input value={nameSearch} onChange={e => setNameSearch(e.target.value)}
                    placeholder="Search by name, headline, or skill..." className="min-h-10 pl-9 text-sm" autoFocus />
                  {nameSearch && (
                    <button onClick={() => setNameSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Active filter summary */}
              {hasActiveFilters && filtered.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {visible.length} matches
                  {nameSearch && ` · "${nameSearch}"`}
                </p>
              )}

              {/* No results for filters */}
              {filtered.length === 0 && (
                <Card className="shadow-sm border-border/50">
                  <CardContent className="py-12 text-center">
                    <SlidersHorizontal className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground mb-1">No matches for these filters</p>
                    <p className="text-sm text-muted-foreground mb-4">Try adjusting your tier, role, or location filter</p>
                    <Button variant="outline" size="sm" onClick={() => { setActiveFilter('all'); setRoleFilter('all'); setNameSearch(''); setLocationFilter(''); setAvailFilter(new Set()); }}>
                      Clear all filters
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Matches grid */}
              {filtered.length > 0 && viewMode !== 'list' && (
                <div className={cn('grid gap-4',
                  viewMode === 'grid3' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
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
                        onClick={!selectMode ? () => setPreviewTarget(hit) : undefined}
                        isSelected={selectMode ? selectedIds.has(hit.id) : undefined}
                        onSelect={selectMode ? () => setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(hit.id)) next.delete(hit.id); else next.add(hit.id);
                          return next;
                        }) : undefined}
                      />
                    );
                  })}
                </div>
              )}

              {/* Matches list */}
              {filtered.length > 0 && viewMode === 'list' && (
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

              {/* Results footer */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} shown{passedIds.size > 0 ? ` · ${passedIds.size} passed` : ''}</span>
                  <Link href="/discover" className="flex tap-target-y items-center gap-1 transition-colors hover:text-foreground">
                    Explore more <ArrowRight className="icon-sm" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick-preview slide panel (b3) ── */}
      {previewTarget && (() => {
        const score = previewTarget.matchScore ?? 50;
        const previewReasons: MatchReason[] = previewTarget.matchReasons?.length
          ? previewTarget.matchReasons.map((text) => ({ type: 'skills' as const, text, score: 0 }))
          : buildMatchReasonsFromScore(score);
        const previewProfile = hitToProfile(previewTarget);
        return (
          <MatchPreviewPanel
            hit={previewTarget}
            matchReasons={previewReasons}
            savedIds={savedIds}
            onClose={() => setPreviewTarget(null)}
            onConnect={() => { handleConnect(previewProfile); setPreviewTarget(null); }}
            onMessage={() => { handleMessage(previewProfile); setPreviewTarget(null); }}
            onSave={() => handleSave(previewTarget.userId, previewTarget.displayName)}
            onPass={() => { handlePass(previewTarget.id, previewTarget.displayName, previewTarget.userId); setPreviewTarget(null); }}
            onBreakdown={() => { setBreakdownTarget(previewTarget); setPreviewTarget(null); }}
          />
        );
      })()}

      {/* ── Bulk action bar (b4) ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-2xl animate-in slide-in-from-bottom duration-200 lg:bottom-6">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-border/60" />
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
            onClick={() => {
              const ids = [...selectedIds].slice(0, 4).join(',');
              router.push(`/compare?ids=${ids}`);
            }}>
            <BarChart3 className="icon-sm" /> Compare
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs hover:text-destructive-accessible"
            onClick={() => {
              filtered.forEach(h => {
                if (selectedIds.has(h.id)) handlePass(h.id, h.displayName, h.userId);
              });
              setSelectedIds(new Set());
              setSelectMode(false);
            }}>
            <X className="icon-sm" /> Pass All
          </Button>
          <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1">
            <X className="icon-sm" />
          </button>
        </div>
      )}

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
