'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Sparkles,
  TrendingUp,
  Target,
  RefreshCw,
  UserPlus,
  Star,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Briefcase,
  GraduationCap,
  DollarSign,
  ChevronDown,
  EyeOff,
  Clock,
  Search,
  ShieldCheck,
  BookmarkPlus,
  Filter,
  X,
  Info,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  getRecommendations,
  getWeeklyDigest,
  sendConnectionRequest,
  recordMatchFeedback,
  recordBehavioralSignal,
  getMatchingStats,
  type SearchHit,
  type MatchSuggestion,
  type MatchFeedbackType,
  type MatchExplanationItem,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const ROLE_ICON: Record<string, typeof Users> = {
  founder: Briefcase,
  mentor: GraduationCap,
  investor: DollarSign,
  org: Users,
};

const ROLE_COLOR: Record<string, string> = {
  founder: 'bg-blue-50 text-blue-700 border-blue-200',
  mentor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  investor: 'bg-amber-50 text-amber-700 border-amber-200',
  org: 'bg-purple-50 text-purple-700 border-purple-200',
};

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : 'bg-muted-foreground';
  return (
    <div className={cn('flex items-center gap-1 text-white text-xs font-semibold px-2 py-0.5 rounded-full', color)}>
      <Star className="h-3 w-3 fill-current" />
      {score}%
    </div>
  );
}

// Dimension score bar for explanation
function ExplanationBar({ items, maxItems = 3 }: { items: MatchExplanationItem[]; maxItems?: number }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 mb-3 space-y-1.5">
      {items.slice(0, maxItems).map((item) => (
        <div key={item.dimension} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                item.score >= 0.8 ? 'bg-emerald-500' : item.score >= 0.6 ? 'bg-blue-500' : 'bg-amber-400'
              )}
              style={{ width: `${Math.round(item.score * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium w-8 text-right">{Math.round(item.score * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// Full match score breakdown modal
function BreakdownModal({
  open, onClose, displayName, score, explanation, reasons,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  score: number;
  explanation: MatchExplanationItem[];
  reasons: string[];
}) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-blue-600' : 'text-amber-600';
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Match Score Breakdown
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Overall Match Score</span>
            <span className={cn('text-3xl font-bold', color)}>{score}%</span>
          </div>
          {explanation.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Score by Dimension</p>
              <ExplanationBar items={explanation} maxItems={explanation.length} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Dimension breakdown not available for this match.</p>
          )}
          {reasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why We Matched You</p>
              <div className="flex flex-wrap gap-1.5">
                {reasons.map((r, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{r}</span>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Scores are based on skills, industry, goals, experience, and availability alignment with <strong>{displayName}</strong>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Rich feedback dropdown
const FEEDBACK_OPTIONS: { label: string; value: MatchFeedbackType; icon: any; color?: string }[] = [
  { label: 'Great match!', value: 'accepted', icon: ThumbsUp, color: 'text-emerald-600' },
  { label: 'Not relevant', value: 'not_relevant', icon: EyeOff },
  { label: 'Not now', value: 'not_now', icon: Clock },
  { label: 'Better fit wanted', value: 'better_fit_wanted', icon: Search },
  { label: 'Decline', value: 'declined', icon: ThumbsDown, color: 'text-red-500' },
];

function FeedbackMenu({ onFeedback }: { onFeedback: (fb: MatchFeedbackType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground"
        onClick={() => setOpen(p => !p)}
        title="Feedback"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-8 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {FEEDBACK_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors',
                  opt.color ?? 'text-foreground'
                )}
                onClick={() => { onFeedback(opt.value); setOpen(false); }}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecommendationCard({ hit, onConnect, onFeedback, onSave }: {
  hit: (SearchHit & { matchScore?: number; matchReasons?: string[] }) | MatchSuggestion;
  onConnect: (userId: string) => void;
  onFeedback: (userId: string, fb: MatchFeedbackType) => void;
  onSave?: (userId: string) => void;
}) {
  // Support both old SearchHit shape and new MatchSuggestion shape
  const userId = (hit as any).userId;
  const displayName = (hit as any).profile?.displayName ?? (hit as any).displayName ?? 'Unknown';
  const headline = (hit as any).profile?.headline ?? (hit as any).headline ?? null;
  const avatarUrl = (hit as any).profile?.avatarUrl ?? (hit as any).avatarUrl ?? null;
  const location = (hit as any).profile?.location ?? (hit as any).location ?? null;
  const role = (hit as any).role ?? null;
  const skills = (hit as any).profile?.skills ?? (hit as any).skills ?? [];
  const score = (hit as any).score ?? (hit as any).matchScore ?? 0;
  const confidence = (hit as any).confidence ?? null;
  const reasons: string[] = (hit as any).reasons ?? (hit as any).matchReasons ?? [];
  const explanation: MatchExplanationItem[] = (hit as any).explanation ?? [];

  const RoleIcon = ROLE_ICON[role ?? 'founder'] ?? Users;
  const [showExplanation, setShowExplanation] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  return (
    <>
    <BreakdownModal
      open={breakdownOpen}
      onClose={() => setBreakdownOpen(false)}
      displayName={displayName}
      score={score}
      explanation={explanation}
      reasons={reasons}
    />
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Link href={`/profiles/${userId}`} onClick={() => recordBehavioralSignal({ signalType: 'profile_view', targetId: userId, targetType: 'user' })}>
            <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border group-hover:ring-primary/20 transition-all">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                {displayName?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <Link href={`/profiles/${userId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {displayName}
                </Link>
                {headline && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{headline}</p>
                )}
                {location && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {score > 0 && <MatchScoreBadge score={score} />}
                {confidence !== null && (
                  <span title={`Confidence: ${confidence}%`} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" />
                    {confidence}%
                  </span>
                )}
                {role && (
                  <Badge variant="outline" className={cn('text-xs capitalize hidden sm:flex', ROLE_COLOR[role ?? 'founder'])}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Reason chips */}
            {reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                {reasons.slice(0, 3).map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {r}
                  </Badge>
                ))}
                <button
                  onClick={() => setShowExplanation(p => !p)}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline flex items-center gap-0.5"
                >
                  <Info className="h-3 w-3" />
                  {showExplanation ? 'Hide' : 'Why this match?'}
                </button>
              </div>
            )}

            {/* Explanation bars */}
            {showExplanation && <ExplanationBar items={explanation} />}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(skills as any[]).slice(0, 4).map((s: any, i: number) => (
                  <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                    {s.skill?.name ?? s}
                  </span>
                ))}
                {skills.length > 4 && (
                  <span className="text-xs text-muted-foreground px-1">+{skills.length - 4}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => onConnect(userId)}>
                <UserPlus className="h-3.5 w-3.5" />
                Connect
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setBreakdownOpen(true)}>
                <TrendingUp className="h-3.5 w-3.5" />
                Score Breakdown
              </Button>
              <div className="ml-auto flex items-center gap-1">
                {onSave && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                    title="Save match"
                    onClick={() => onSave(userId)}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                  title="Good match"
                  onClick={() => onFeedback(userId, 'accepted')}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <FeedbackMenu onFeedback={(fb) => onFeedback(userId, fb)} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

function Skeleton3() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'founders' | 'mentors' | 'investors' | 'saved'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const role = (activeTab === 'all' || activeTab === 'saved') ? undefined : activeTab.replace(/s$/, '');

  const { data: recsData, isLoading: recsLoading, isError: recsError, refetch: refetchRecs } = useQuery({
    queryKey: ['recommendations', role, refreshKey],
    queryFn: () => getRecommendations({ role, limit: 20 }),
    staleTime: 5 * 60_000,
  });

  const { data: digestData, isLoading: digestLoading } = useQuery({
    queryKey: ['weekly-digest'],
    queryFn: getWeeklyDigest,
    staleTime: 10 * 60_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['matching-stats'],
    queryFn: getMatchingStats,
    staleTime: 5 * 60_000,
  });

  const connectMutation = useMutation({
    mutationFn: (userId: string) => sendConnectionRequest({ receiverId: userId }),
    onSuccess: () => toastSuccess('Connection request sent!'),
    onError: () => toastError('Could not send request', 'Please try again'),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ userId, fb }: { userId: string; fb: MatchFeedbackType }) =>
      recordMatchFeedback({ targetUserId: userId, feedback: fb }),
    onSuccess: (_, { fb }) => {
      const msg = fb === 'accepted' ? 'Thanks! Improving your matches.' :
        fb === 'not_relevant' ? 'Got it — fewer like this.' :
        fb === 'not_now' ? 'Noted — we\'ll revisit later.' :
        fb === 'better_fit_wanted' ? 'Understood — refining suggestions.' :
        'Feedback recorded.';
      toastSuccess(msg);
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const allRecommendations = recsData?.suggestions ?? [];
  const recommendations = activeTab === 'saved'
    ? allRecommendations.filter((h) => savedIds.has((h as any).userId))
    : allRecommendations.filter((h) => ((h as any).score ?? (h as any).matchScore ?? 0) >= minScore);
  const weeklyRecs = digestData?.recommendations ?? [];
  const stats = digestData?.stats ?? statsData;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    queryClient.invalidateQueries({ queryKey: ['weekly-digest'] });
  };

  const handleSave = (userId: string) => {
    setSavedIds((prev) => { const s = new Set(prev); s.has(userId) ? s.delete(userId) : s.add(userId); return s; });
    toastSuccess(savedIds.has(userId) ? 'Removed from saved' : 'Saved to your list');
  };

  return (
    <AppShell
      title="Recommendations"
      description="AI-powered matches based on your profile, skills, and goals"
      actions={
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Stats header */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-1">
          {[
            { label: 'New Matches', value: recommendations.length, icon: Target },
            { label: 'This Week', value: weeklyRecs.length, icon: Sparkles },
            { label: 'Connections', value: stats?.totalConnections ?? 0, icon: Users },
            { label: 'Acceptance Rate', value: stats ? `${Math.round(stats.acceptanceRate)}%` : '—', icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly digest section */}
        {!digestLoading && weeklyRecs.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">This Week's Top Picks</h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {digestData?.generatedAt ? new Date(digestData.generatedAt).toLocaleDateString() : 'Today'}
                </Badge>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {weeklyRecs.slice(0, 5).map((m) => (
                  <Link key={m.userId} href={`/profiles/${m.userId}`} className="shrink-0">
                    <div className="flex flex-col items-center gap-1.5 w-16 text-center group">
                      <div className="relative">
                        <Avatar className="h-11 w-11 ring-2 ring-border group-hover:ring-primary transition-all">
                          <AvatarImage src={m.profile?.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {m.profile?.displayName?.[0] ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold px-1 rounded-full">
                          {m.score}%
                        </div>
                      </div>
                      <p className="text-xs truncate w-full text-muted-foreground group-hover:text-foreground">
                        {m.profile?.displayName?.split(' ')[0] ?? 'User'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score filter bar */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilter ? 'secondary' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFilter(p => !p)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {minScore > 0 && <span className="ml-1 text-xs text-primary font-semibold">≥{minScore}%</span>}
          </Button>
          {showFilter && (
            <div className="flex items-center gap-3 flex-1 bg-secondary/40 rounded-lg px-3 py-2">
              <span className="text-xs text-muted-foreground shrink-0">Min score:</span>
              <input
                type="range"
                min={0}
                max={90}
                step={10}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-xs font-semibold w-8 text-right">{minScore}%</span>
              {minScore > 0 && (
                <button onClick={() => setMinScore(0)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {recommendations.length} match{recommendations.length !== 1 ? 'es' : ''}
            {savedIds.size > 0 && ` · ${savedIds.size} saved`}
          </span>
        </div>

        {/* Tab list */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Target className="h-3.5 w-3.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="founders" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Founders
            </TabsTrigger>
            <TabsTrigger value="mentors" className="gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Mentors
            </TabsTrigger>
            <TabsTrigger value="investors" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Investors
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5">
              <BookmarkPlus className="h-3.5 w-3.5" />
              Saved
              {savedIds.size > 0 && (
                <span className="ml-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {savedIds.size}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {recsLoading ? (
              <Skeleton3 />
            ) : recsError ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Failed to load recommendations.</p>
                <Button variant="secondary" size="sm" onClick={() => void refetchRecs()}>Retry</Button>
              </CardContent></Card>
            ) : activeTab === 'saved' && savedIds.size === 0 ? (
              <Card><CardContent className="py-14 text-center">
                <BookmarkPlus className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold mb-1">No saved matches yet</h3>
                <p className="text-sm text-muted-foreground">Bookmark matches you want to revisit later.</p>
              </CardContent></Card>
            ) : recommendations.length > 0 ? (
              recommendations.map((hit) => (
                <RecommendationCard
                  key={(hit as any).userId}
                  hit={hit as any}
                  onConnect={(uid) => connectMutation.mutate(uid)}
                  onFeedback={(uid, fb) => feedbackMutation.mutate({ userId: uid, fb })}
                  onSave={handleSave}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-14 text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <h3 className="font-semibold mb-1">No recommendations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {minScore > 0 ? `No matches with score ≥${minScore}%. Try lowering the filter.` : 'Complete your profile to unlock personalized matches.'}
                  </p>
                  {minScore > 0 ? (
                    <Button size="sm" variant="outline" onClick={() => setMinScore(0)}>Clear Filter</Button>
                  ) : (
                    <Link href="/profile/edit"><Button size="sm">Complete Profile</Button></Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
