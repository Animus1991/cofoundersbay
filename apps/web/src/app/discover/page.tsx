'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import {
  searchProfiles, getRecommendations, sendConnectionRequest, type SearchHit
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { SearchFilters, type SearchFiltersValues } from '@/components/discover/SearchFilters';
import { ProfileCard, ProfileCardSkeleton, type ProfileCardData } from '@/components/discover/ProfileCard';
import { MatchCard } from '@/components/common/MatchCard';
import { ConnectionRequestDialog } from '@/components/common/ConnectionRequest';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'match';

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

  // Connection request dialog
  const [connectionTarget, setConnectionTarget] = useState<ProfileCardData | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const queryClient = useQueryClient();

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false;
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

  return (
    <AppShell
      title="Discover"
      description="Find founders, mentors, investors, and teams"
      actions={
        <Link href="/">
          <Button variant="secondary">Home</Button>
        </Link>
      }
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="search" className="gap-2">
              <Users className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Sparkles className="h-4 w-4" />
              For You
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Matches
            </TabsTrigger>
          </TabsList>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6 mt-6">
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

          {!loading && hits.length === 0 && (
            <EmptyState
              title="No profiles found"
              description="Try adjusting your filters or search for something different."
              illustration="search"
              action={
                <Button onClick={() => setFilters(defaultFilters)}>
                  Clear filters
                </Button>
              }
            />
          )}

          {!loading && hits.length > 0 && (
            <AnimatedList
              animation="fade-in-up"
              staggerDelay={50}
              className={cn(
                'grid gap-4',
                viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}
            >
              {hits.map((hit) => {
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
                <Sparkles className="h-5 w-5 text-primary" />
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
                    <ArrowRight className="h-4 w-4" />
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
                <TrendingUp className="h-5 w-5 text-primary" />
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
                const matchReasons = buildMatchReasons(score);
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
    </AppShell>
  );
}
