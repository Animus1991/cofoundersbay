'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid,
  List,
  Sparkles,
  TrendingUp,
  Users,
  ArrowRight,
  Rocket,
  GraduationCap,
  DollarSign,
  Briefcase,
  Star,
  BadgeCheck,
  Filter,
  X as XIcon,
} from 'lucide-react';
import {
  searchProfiles, getRecommendations, sendConnectionRequest, type SearchHit
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { SearchFilters, type SearchFiltersValues } from '@/components/discover/SearchFilters';
import { ProfileCard, ProfileCardSkeleton, type ProfileCardData } from '@/components/discover/ProfileCard';
import { useToast } from '@/components/ui/toast';
import { BilingualText } from '@/components/common/BilingualText';
import { discoverEn, discoverEl } from '@/lib/i18n/strings-discover';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

const MatchCard = dynamic(() => import('@/components/common/MatchCard').then((m) => ({ default: m.MatchCard })), { ssr: false });
const ConnectionRequestDialog = dynamic(() => import('@/components/common/ConnectionRequest').then((m) => ({ default: m.ConnectionRequestDialog })), { ssr: false });

type ViewMode = 'grid' | 'list' | 'match';
type RoleFilter = 'all' | 'founder' | 'cofounder' | 'mentor' | 'investor' | 'service_provider';

const ROLE_FILTER_TONE: Record<RoleFilter, StatusTone | null> = {
  all: null,
  founder: 'accent',
  cofounder: 'info',
  mentor: 'success',
  investor: 'warning',
  service_provider: 'accent',
};

const ROLE_FILTERS: { value: RoleFilter; labelEn: string; labelEl: string; icon: React.ElementType }[] = [
  { value: 'all',              labelEn: discoverEn('all'),              labelEl: discoverEl('all'),              icon: Users         },
  { value: 'founder',         labelEn: discoverEn('founders'),         labelEl: discoverEl('founders'),         icon: Rocket        },
  { value: 'cofounder',       labelEn: discoverEn('cofounders'),       labelEl: discoverEl('cofounders'),       icon: Users         },
  { value: 'mentor',          labelEn: discoverEn('mentors'),          labelEl: discoverEl('mentors'),          icon: GraduationCap },
  { value: 'investor',        labelEn: discoverEn('investors'),        labelEl: discoverEl('investors'),        icon: DollarSign    },
  { value: 'service_provider',labelEn: discoverEn('service_providers'),labelEl: discoverEl('service_providers'),icon: Briefcase     },
];

const PLATFORM_STATS = [
  { labelEn: discoverEn('active_founders'),    labelEl: discoverEl('active_founders'),    value: '1,200+', icon: Rocket      },
  { labelEn: discoverEn('expert_mentors'),     labelEl: discoverEl('expert_mentors'),     value: '180+',   icon: GraduationCap },
  { labelEn: discoverEn('successful_matches'), labelEl: discoverEl('successful_matches'), value: '450+',   icon: Star        },
  { labelEn: discoverEn('communities'),        labelEl: discoverEl('communities'),        value: '25+',    icon: Users       },
];

type MatchReasonType = 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values';
type MatchReason = { type: MatchReasonType; text: string; score: number };

/** Derive human-readable match reasons from the API score (0-100). */
function buildMatchReasons(score: number): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (score >= 30) reasons.push({ type: 'skills', text: 'Complementary role & skills', score: 30 });
  if (score >= 45) reasons.push({ type: 'stage', text: 'Matching startup stage', score: Math.min(20, score - 30) });
  if (score >= 65) reasons.push({ type: 'industry', text: 'Similar industry focus', score: 15 });
  if (score >= 80) reasons.push({ type: 'location', text: 'Same location', score: 10 });
  if (reasons.length === 0) reasons.push({ type: 'skills', text: 'Potential match', score: score });
  return reasons;
}

const defaultFilters: SearchFiltersValues = {
  q: '',
  role: [],
  skills: [],
  industries: [],
  stage: [],
  location: '',
  remote: null,
  availability: [],
  fundingStage: [],
  languages: [],
  sortBy: 'relevance',
};

export default function DiscoverPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [filters, setFilters] = useState<SearchFiltersValues>(defaultFilters);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'matches'>('search');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // Connection request dialog
  const [connectionTarget, setConnectionTarget] = useState<ProfileCardData | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const queryClient = useQueryClient();

  const hasToken = useIsAuthenticated();
  const { data: recommendationsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['recommendations', { limit: 8 }],
    queryFn: () => getRecommendations({ limit: 8 }),
    staleTime: 3 * 60_000,
    enabled: hasToken,
  });
  const suggestions: SearchHit[] = (recommendationsData?.suggestions ?? []) as SearchHit[];
  const suggestionsLoaded = !suggestionsLoading;

  // Search function
  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchProfiles({
        q: filters.q.trim() || undefined,
        roles: filters.role.length > 0 ? filters.role : undefined,
        skills: filters.skills.length > 0 ? filters.skills : undefined,
        industries: filters.industries.length > 0 ? filters.industries : undefined,
        stage: filters.stage.length > 0 ? filters.stage : undefined,
        location: filters.location.trim() || undefined,
        languages: filters.languages.length > 0 ? filters.languages : undefined,
        commitment: filters.availability.length > 0 ? filters.availability : undefined,
        investmentStages: filters.fundingStage.length > 0 ? filters.fundingStage : undefined,
        sortBy: filters.sortBy,
        limit: 30,
      });
      setHits(res.hits);
      setTotal(res.total);
    } catch {
      setHits([]);
      setTotal(0);
      showError('Search failed', 'Please try again');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  // Debounced auto-search on filter changes when on search tab
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (activeTab !== 'search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = filters.q.length > 0 ? 500 : 150;
    debounceRef.current = setTimeout(() => { void runSearch(); }, delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  // Convert SearchHit to ProfileCardData
  const hitToProfile = (hit: SearchHit): ProfileCardData => ({
    id: hit.id,
    userId: hit.userId,
    displayName: hit.displayName,
    headline: hit.headline,
    bio: hit.bio,
    avatarUrl: hit.avatarUrl,
    role: hit.role,
    location: hit.location,
    skills: hit.skillNames || [],
    matchScore: hit.matchScore,
    lookingFor: hit.lookingFor,
    availability: hit.availability,
  });

  // Handle connect
  const handleConnect = (profile: ProfileCardData) => {
    setConnectionTarget(profile);
    setShowConnectionDialog(true);
  };

  // Handle send connection request
  const handleSendConnection = async (message: string) => {
    if (!connectionTarget) return;
    try {
      await sendConnectionRequest({ receiverId: connectionTarget.userId, message: message || undefined });
      success('Connection request sent!', `Your request to ${connectionTarget.displayName} has been sent.`);
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err) {
      showError('Could not send request', err instanceof Error ? err.message : 'Please try again');
    }
  };

  // Handle message
  const handleMessage = (profile: ProfileCardData) => {
    router.push(`/messages?to=${profile.userId}`);
  };

  // Handle bookmark
  const handleBookmark = (profile: ProfileCardData) => {
    success('Profile saved', `${profile.displayName} added to your bookmarks`);
  };

  // Apply role filter to hits
  const filteredHits = roleFilter === 'all' ? hits : hits.filter((h) =>
    h.role?.toLowerCase().includes(roleFilter.replace('_', ' ')) ||
    h.role?.toLowerCase() === roleFilter
  );

  return (
    <AppShell
      showHelp
      actions={
        <Link href="/matches">
          <Button variant="outline" size="sm" className="gap-2">
            <TrendingUp className="icon-sm" />
            <BilingualText en={discoverEn('view_matches')} el={discoverEl('view_matches')} />
          </Button>
        </Link>
      }
    >
      <div className="space-y-5 pb-10">

        {/* Platform stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLATFORM_STATS.map((s) => {
            const SIcon = s.icon;
            return (
              <Card key={s.labelEn} className="shadow-sm border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <SIcon className="icon-sm text-primary-accessible" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      <BilingualText en={s.labelEn} el={s.labelEl} compact />
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setRoleFilter('all'); }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="search" className="gap-2">
                <Users className="icon-sm" />
                <BilingualText en={discoverEn('search')} el={discoverEl('search')} compact />
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                <Sparkles className="icon-sm" />
                <BilingualText en={discoverEn('for_you')} el={discoverEl('for_you')} compact />
              </TabsTrigger>
              <TabsTrigger value="matches" className="gap-2">
                <TrendingUp className="icon-sm" />
                <BilingualText en={discoverEn('top_matches')} el={discoverEl('top_matches')} compact />
              </TabsTrigger>
            </TabsList>

          {/* View mode toggle */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1 shadow-sm">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="icon-sm" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="icon-sm" />
            </Button>
          </div>
        </div>

        {/* Role filter chips - shown for search & suggestions tabs */}
        {activeTab !== 'matches' && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Filter className="icon-sm text-muted-foreground shrink-0" />
            {ROLE_FILTERS.map((rf) => {
              const RIcon = rf.icon;
              const isActive = roleFilter === rf.value;
              const tone = ROLE_FILTER_TONE[rf.value];
              return (
                <button
                  key={rf.value}
                  onClick={() => setRoleFilter(rf.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <RIcon className={cn('icon-sm', isActive ? 'text-primary-foreground' : tone ? STATUS[tone].icon : 'text-foreground')} />
                  <BilingualText en={rf.labelEn} el={rf.labelEl} compact />
                </button>
              );
            })}
            {roleFilter !== 'all' && (
              <button
                onClick={() => setRoleFilter('all')}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <XIcon className="icon-sm" /> <BilingualText en={discoverEn('clear')} el={discoverEl('clear')} compact />
              </button>
            )}
          </div>
        )}

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-8 mt-6">
          {/* Filters */}
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={runSearch}
            loading={loading}
            resultCount={total}
          />

          {/* Results */}
          {loading && (
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {[...Array(6)].map((_, i) => (
                <ProfileCardSkeleton key={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
              ))}
            </div>
          )}

          {/* Featured strip when no query */}
          {!loading && !filters.q && hits.length > 0 && roleFilter === 'all' && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-status-accent-bg/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BadgeCheck className="icon-sm text-primary-accessible" />
                <span className="text-sm font-semibold text-foreground">Featured Profiles</span>
                <span className="text-xs text-muted-foreground">— Top matches based on your profile</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hits.slice(0, 4).map((h) => (
                  <Link key={h.id} href={`/profile/${h.userId}`}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 hover:border-primary/40 hover:bg-muted/40 transition-all">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-accessible">
                      {h.displayName?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate max-w-[100px]">{h.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]">{h.role}</p>
                    </div>
                    {h.matchScore !== undefined && (
                      <span className={cn(
                        'ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold',
                        h.matchScore >= 80 ? STATUS.success.chip : h.matchScore >= 60 ? STATUS.info.chip : STATUS.neutral.chip,
                      )}>{h.matchScore}%</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && filteredHits.length === 0 && hits.length > 0 && roleFilter !== 'all' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">No {roleFilter.replace('_', ' ')}s found. Try clearing the role filter.</p>
              <button onClick={() => setRoleFilter('all')} className="text-xs text-primary-accessible hover:underline">Show all roles</button>
            </div>
          )}

          {!loading && hits.length === 0 && (
            <EmptyState
              title="No profiles found"
              description="Try adjusting your filters or search for something different."
              illustration="search"
              className="py-12"
              action={
                <Button onClick={() => setFilters(defaultFilters)}>
                  Clear filters
                </Button>
              }
            />
          )}

          {!loading && filteredHits.length > 0 && (
            <AnimatedList
              animation="fade-in-up"
              staggerDelay={50}
              className={cn(
                'grid gap-4',
                viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}
            >
              {filteredHits.map((hit) => {
                const profile = hitToProfile(hit);
                return (
                  <ProfileCard
                    key={hit.id}
                    profile={profile}
                    variant={viewMode === 'list' ? 'compact' : 'default'}
                    onConnect={() => handleConnect(profile)}
                    onMessage={() => handleMessage(profile)}
                    onBookmark={() => handleBookmark(profile)}
                  />
                );
              })}
            </AnimatedList>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="icon-md text-primary-accessible" />
                Suggested for you
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your profile and preferences
              </p>
            </div>
          </div>

          {!suggestionsLoaded && (
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'
            )}>
              {[...Array(4)].map((_, i) => (
                <ProfileCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          )}

          {suggestionsLoaded && suggestions.length === 0 && (
            <EmptyState
              title="No suggestions yet"
              description="Complete your profile to get personalized recommendations."
              illustration="rocket"
              action={
                <Link href="/profile/edit">
                  <Button className="gap-2">
                    Complete profile
                    <ArrowRight className="icon-sm" />
                  </Button>
                </Link>
              }
            />
          )}

          {suggestionsLoaded && suggestions.length > 0 && (
            <AnimatedList
              animation="fade-in-up"
              staggerDelay={75}
              className={cn(
                'grid gap-6',
                viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'
              )}
            >
              {suggestions.map((hit) => {
                const profile = hitToProfile(hit);
                return (
                  <ProfileCard
                    key={hit.id}
                    profile={profile}
                    variant="featured"
                    onConnect={() => handleConnect(profile)}
                    onMessage={() => handleMessage(profile)}
                    onBookmark={() => handleBookmark(profile)}
                  />
                );
              })}
            </AnimatedList>
          )}
        </TabsContent>

        {/* Top Matches Tab */}
        <TabsContent value="matches" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="icon-md text-primary-accessible" />
                Your Top Matches
              </h2>
              <p className="text-sm text-muted-foreground">
                People with the highest compatibility
              </p>
            </div>
          </div>

          {!suggestionsLoaded && (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <ProfileCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          )}

          {suggestionsLoaded && suggestions.length === 0 && (
            <EmptyState
              title="No matches yet"
              description="Start by exploring profiles and indicating your interests."
              illustration="connection"
              action={
                <Button onClick={() => setActiveTab('search')}>
                  Explore profiles
                </Button>
              }
            />
          )}

          {suggestionsLoaded && suggestions.length > 0 && (
            <AnimatedList
              animation="scale-in"
              staggerDelay={100}
              className="grid gap-6 md:grid-cols-2"
            >
              {suggestions.slice(0, 6).map((hit) => {
                const profile = hitToProfile(hit);
                const score = hit.matchScore ?? 50;
                const matchReasons = hit.matchReasons?.length
                  ? hit.matchReasons.map((text) => ({ type: 'skills' as MatchReasonType, text, score: 0 }))
                  : buildMatchReasons(score);
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
                    skills={hit.skillNames || []}
                    compatibilityScore={score}
                    matchReasons={matchReasons}
                    onLike={() => success('Liked!', `You liked ${hit.displayName}`)}
                    onPass={() => {}}
                    onMessage={() => handleMessage(profile)}
                    onBookmark={() => handleBookmark(profile)}
                  />
                );
              })}
            </AnimatedList>
          )}
        </TabsContent>
      </Tabs>

      {/* Connection Request Dialog */}
      {connectionTarget && (
        <ConnectionRequestDialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
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
        </div>
    </AppShell>
  );
}
