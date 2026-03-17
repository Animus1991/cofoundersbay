'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Sparkles,
  TrendingUp,
  Target,
  RefreshCw,
  UserPlus,
  MessageCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Briefcase,
  GraduationCap,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import {
  getRecommendations,
  getWeeklyDigest,
  sendConnectionRequest,
  submitMatchFeedback,
  getMatchingStats,
  type SearchHit,
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

function RecommendationCard({ hit, onConnect, onFeedback }: {
  hit: SearchHit & { matchScore?: number; matchReasons?: string[] };
  onConnect: (userId: string) => void;
  onFeedback: (userId: string, fb: 'positive' | 'negative') => void;
}) {
  const RoleIcon = ROLE_ICON[hit.role ?? 'founder'] ?? Users;
  const score = hit.matchScore ?? hit.matchingScore ?? 0;
  const reasons: string[] = hit.matchReasons ?? [];

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Link href={`/profiles/${hit.userId}`}>
            <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border group-hover:ring-primary/20 transition-all">
              <AvatarImage src={hit.avatarUrl ?? undefined} />
              <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                {hit.displayName?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <Link href={`/profiles/${hit.userId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {hit.displayName}
                </Link>
                {hit.headline && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{hit.headline}</p>
                )}
                {hit.location && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {hit.location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {score > 0 && <MatchScoreBadge score={score} />}
                <Badge variant="outline" className={cn('text-xs capitalize hidden sm:flex', ROLE_COLOR[hit.role ?? 'founder'])}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {hit.role}
                </Badge>
              </div>
            </div>

            {reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                {reasons.slice(0, 3).map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {r}
                  </Badge>
                ))}
              </div>
            )}

            {hit.skills && hit.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {hit.skills.slice(0, 4).map((s, i) => (
                  <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                    {s}
                  </span>
                ))}
                {hit.skills.length > 4 && (
                  <span className="text-xs text-muted-foreground px-1">+{hit.skills.length - 4}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => onConnect(hit.userId)}>
                <UserPlus className="h-3.5 w-3.5" />
                Connect
              </Button>
              <Link href={`/messages?userId=${hit.userId}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </Button>
              </Link>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                  title="Good match"
                  onClick={() => onFeedback(hit.userId, 'positive')}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                  title="Not a match"
                  onClick={() => onFeedback(hit.userId, 'negative')}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
  const [activeTab, setActiveTab] = useState<'all' | 'founders' | 'mentors' | 'investors'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const role = activeTab === 'all' ? undefined : activeTab.replace(/s$/, '');

  const { data: recsData, isLoading: recsLoading } = useQuery({
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
    mutationFn: (userId: string) => sendConnectionRequest(userId, ''),
    onSuccess: () => toast({ title: 'Connection request sent!' }),
    onError: () => toast({ title: 'Could not send request', variant: 'destructive' }),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ userId, fb }: { userId: string; fb: 'positive' | 'negative' }) =>
      submitMatchFeedback(userId, fb),
    onSuccess: (_, { fb }) => {
      toast({ title: fb === 'positive' ? 'Thanks for the feedback!' : 'Got it, we will improve your matches' });
    },
  });

  const recommendations = recsData?.suggestions ?? [];
  const weeklyRecs = digestData?.recommendations ?? [];
  const stats = digestData?.stats ?? statsData;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    queryClient.invalidateQueries({ queryKey: ['weekly-digest'] });
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {recsLoading ? (
              <Skeleton3 />
            ) : recommendations.length > 0 ? (
              recommendations.map((hit) => (
                <RecommendationCard
                  key={hit.userId}
                  hit={hit}
                  onConnect={(uid) => connectMutation.mutate(uid)}
                  onFeedback={(uid, fb) => feedbackMutation.mutate({ userId: uid, fb })}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-14 text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <h3 className="font-semibold mb-1">No recommendations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete your profile to unlock personalized matches
                  </p>
                  <Link href="/profile/edit">
                    <Button size="sm">Complete Profile</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
