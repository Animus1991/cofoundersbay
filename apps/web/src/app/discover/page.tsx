'use client';

import { StatusText } from '@/components/common/StatusText';

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
  Bookmark,
  Search,
  X as XIcon,
} from 'lucide-react';
import {
  searchProfiles, getRecommendations, getDashboardStats, sendConnectionRequest, saveToShortlist, createSavedSearch, type SearchHit
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailOptions, RailStats } from '@/components/layout/RailParts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { SearchFilters, type SearchFiltersValues } from '@/components/discover/SearchFilters';
import { ProfileCard, ProfileCardSkeleton, type ProfileCardData } from '@/components/discover/ProfileCard';
import { useToast } from '@/components/ui/toast';
import { BilingualText } from '@/components/common/BilingualText';
import { discoverEn, discoverEl } from '@/lib/i18n/strings-discover';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { queryKeys, qk } from '@/lib/query-keys';
import { choiceControl, rowOptions, usePageControls, usePageList, ROW_GONE, type PageControlRunResult } from '@/lib/page-controls';

const MatchCard = dynamic(() => import('@/components/common/MatchCard').then((m) => ({ default: m.MatchCard })), { ssr: false });
const ConnectionRequestDialog = dynamic(() => import('@/components/common/ConnectionRequest').then((m) => ({ default: m.ConnectionRequestDialog })), { ssr: false });

type ViewMode = 'grid' | 'list' | 'match';
type RoleFilter = 'all' | 'founder' | 'cofounder' | 'mentor' | 'investor' | 'service_provider';

const ROLE_FILTERS: { value: RoleFilter; labelEn: string; labelEl: string; icon: React.ElementType }[] = [
  { value: 'all',              labelEn: discoverEn('all'),              labelEl: discoverEl('all'),              icon: Users         },
  { value: 'founder',         labelEn: discoverEn('founders'),         labelEl: discoverEl('founders'),         icon: Rocket        },
  { value: 'cofounder',       labelEn: discoverEn('cofounders'),       labelEl: discoverEl('cofounders'),       icon: Users         },
  { value: 'mentor',          labelEn: discoverEn('mentors'),          labelEl: discoverEl('mentors'),          icon: GraduationCap },
  { value: 'investor',        labelEn: discoverEn('investors'),        labelEl: discoverEl('investors'),        icon: DollarSign    },
  { value: 'service_provider',labelEn: discoverEn('service_providers'),labelEl: discoverEl('service_providers'),icon: Briefcase     },
];

/*
 * The four figures here were constants in the source: "1,200+", "180+",
 * "450+", "25+". They are counted by the platform now — founders and mentors
 * by role, matches as accepted connections, communities as groups — and a
 * header that cannot reach the count shows a dash rather than a round number
 * that was never true.
 */
const PLATFORM_STAT_SLOTS = [
  { key: 'founders' as const,         labelEn: discoverEn('active_founders'),    labelEl: discoverEl('active_founders'),    icon: Rocket        },
  { key: 'mentors' as const,          labelEn: discoverEn('expert_mentors'),     labelEl: discoverEl('expert_mentors'),     icon: GraduationCap },
  { key: 'successfulMatches' as const,labelEn: discoverEn('successful_matches'), labelEl: discoverEl('successful_matches'), icon: Star          },
  { key: 'communities' as const,      labelEn: discoverEn('communities'),        labelEl: discoverEl('communities'),        icon: Users         },
];

type MatchReasonType = 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values';
type MatchReason = { type: MatchReasonType; text: string; score: number };

/*
 * `buildMatchReasons` used to turn one score into a list of specific claims:
 * 80 or above printed "Same location" whether or not the two people were in
 * the same place. The engine returns its own reasons; a card with none shows
 * none.
 */

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
  // Save-search dialog (opened from the filters bar, the assistant, or the
  // /saved-searches "New Search" link which lands here as ?saveSearch=true).
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchAlerts, setSaveSearchAlerts] = useState(true);
  const [saveSearchBusy, setSaveSearchBusy] = useState(false);
  const queryClient = useQueryClient();

  // Arriving links carry search state in the URL: /saved-searches "Run" sends
  // the stored query and filters, "New Search" sends saveSearch=true. Both
  // were dead before — apply them once, after mount, then drop the flag so a
  // refresh keeps the filters without reopening the dialog.
  const urlAppliedRef = useRef(false);
  useEffect(() => {
    if (urlAppliedRef.current) return;
    urlAppliedRef.current = true;
    const p = new URLSearchParams(window.location.search);
    const next: SearchFiltersValues = { ...defaultFilters };
    const q = p.get('q');
    if (q) next.q = q;
    const pick = (key: string) => p.get(key)?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    const roles = pick('roles'); if (roles.length) next.role = roles;
    const skills = pick('skills'); if (skills.length) next.skills = skills;
    const industries = pick('industries'); if (industries.length) next.industries = industries;
    const locations = pick('locations'); if (locations.length) next.location = locations[0];
    if (q || roles.length || skills.length || industries.length || locations.length) {
      setFilters(next);
      setActiveTab('search');
    }
    if (p.get('saveSearch') === 'true') {
      setSaveSearchName(q ?? '');
      setSaveSearchOpen(true);
      p.delete('saveSearch');
      const qs = p.toString();
      router.replace(qs ? `/discover?${qs}` : '/discover', { scroll: false });
    }
  }, [router]);

  const hasToken = useIsAuthenticated();
  const { data: recommendationsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: qk('recommendations', { limit: 8 }),
    queryFn: () => getRecommendations({ limit: 8 }),
    staleTime: 3 * 60_000,
    enabled: hasToken,
  });
  const suggestions: SearchHit[] = (recommendationsData?.suggestions ?? []) as SearchHit[];

  const { data: platformStats } = useQuery({
    queryKey: qk('dashboard', 'stats', 'discover-header'),
    queryFn: getDashboardStats,
    staleTime: 5 * 60_000,
    retry: 0,
  });
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
      // A 200 whose body is missing `hits` must not blank the page: every
      // read below goes through `hits.length`, so an undefined here throws
      // inside render and trips the route error boundary.
      setHits(Array.isArray(res?.hits) ? res.hits : []);
      setTotal(typeof res?.total === 'number' ? res.total : 0);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
    } catch (err) {
      showError('Could not send request', err instanceof Error ? err.message : 'Please try again');
    }
  };

  // Handle message
  const handleMessage = (profile: ProfileCardData) => {
    router.push(`/messages?to=${profile.userId}`);
  };

  // Handle bookmark
  const handleBookmark = async (profile: ProfileCardData): Promise<PageControlRunResult> => {
    try {
      await saveToShortlist(profile.userId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.shortlist });
      void queryClient.invalidateQueries({ queryKey: queryKeys.shortlistIds });
      success('Saved to shortlist', `${profile.displayName} is on your saved profiles`);
    } catch (err) {
      showError('Could not save', err instanceof Error ? err.message : 'Try again from the profile page');
      return { error: err instanceof Error && err.message ? err.message : 'The profile was not saved.' };
    }
  };

  const openSaveSearch = () => {
    setSaveSearchName((n) => n || filters.q.trim());
    setSaveSearchOpen(true);
  };

  const handleSaveSearch = async () => {
    const name = saveSearchName.trim();
    if (!name || saveSearchBusy) return;
    setSaveSearchBusy(true);
    try {
      await createSavedSearch({
        name,
        query: filters.q.trim(),
        filters: {
          roles: filters.role.length ? filters.role : undefined,
          skills: filters.skills.length ? filters.skills : undefined,
          industries: filters.industries.length ? filters.industries : undefined,
          locations: filters.location.trim() ? [filters.location.trim()] : undefined,
          stage: filters.stage.length ? filters.stage : undefined,
        },
        alertsEnabled: saveSearchAlerts,
        alertFrequency: 'daily',
      });
      void queryClient.invalidateQueries({ queryKey: qk('saved-searches') });
      success('Search saved', 'It will appear under Saved Searches and watch for new matches.');
      setSaveSearchOpen(false);
      setSaveSearchName('');
    } catch (err) {
      showError('Could not save', err instanceof Error && err.message ? err.message : 'Try again from Saved Searches');
    } finally {
      setSaveSearchBusy(false);
    }
  };

  // Apply role filter to hits
  const filteredHits = roleFilter === 'all' ? hits : hits.filter((h) =>
    h.role?.toLowerCase().includes(roleFilter.replace('_', ' ')) ||
    h.role?.toLowerCase() === roleFilter
  );

  const askAi = `Discover (${activeTab === 'suggestions' ? 'For You' : activeTab === 'matches' ? 'Top Matches' : 'Search'}): ${filteredHits.length} search results${roleFilter !== 'all' ? `, role filter ${roleFilter.replace('_', ' ')}` : ''}, ${suggestions.length} recommendations. Who should I shortlist or message next, and which filters would find a complementary technical cofounder?`;


  // Offered to the assistant: the tab, role, sort, layout and reset, and
  // each result's Connect (which opens the same request dialog), Message
  // and Save - over the people on the tab that is showing.
  const shown = activeTab === 'search' ? filteredHits : suggestions;
  const byName = (list: SearchHit[]) => rowOptions(list, (h) => h.id, (h) => h.displayName);
  const hitById = (id?: string) => shown.find((h) => h.id === id);
  usePageList([
    {
      id: 'people',
      labelEn: activeTab === 'search' ? 'Search results' : 'Suggested people',
      labelEl: activeTab === 'search' ? 'Αποτελέσματα αναζήτησης' : 'Προτεινόμενα άτομα',
      rows: (activeTab === 'search' ? loading : suggestionsLoading) ? undefined : shown.map((h) =>
        `${h.displayName}${h.role ? ` · ${h.role}` : ''}${h.headline ? ` · ${h.headline}` : ''}${h.location ? ` · ${h.location}` : ''}${h.matchScore != null ? ` · match ${h.matchScore}%` : ''}`,
      ),
      ...(activeTab === 'search' ? { total } : {}),
    },
  ]);
  usePageControls([
    choiceControl('discover_tab', 'Discover section', 'Ενότητα ανακάλυψης', [
      { value: 'search', en: 'Search', el: 'Αναζήτηση' },
      { value: 'suggestions', en: 'Suggestions', el: 'Προτάσεις' },
      { value: 'matches', en: 'Matches', el: 'Αντιστοιχίσεις' },
    ], activeTab, (v) => { setActiveTab(v as typeof activeTab); setRoleFilter('all'); }),
    choiceControl('role_filter', 'Role filter', 'Φίλτρο ρόλου', ROLE_FILTERS.map((r) => ({ value: r.value, en: r.labelEn, el: r.labelEl })), roleFilter, (v) => setRoleFilter(v as RoleFilter)),
    choiceControl('sort', 'Sort results', 'Ταξινόμηση αποτελεσμάτων', [
      { value: 'relevance', en: 'Most relevant', el: 'Πιο σχετικά' },
      { value: 'recent', en: 'Newest', el: 'Νεότερα' },
      { value: 'active', en: 'Recently active', el: 'Πρόσφατα ενεργά' },
    ], filters.sortBy, (v) => setFilters((f) => ({ ...f, sortBy: v as SearchFiltersValues['sortBy'] }))),
    choiceControl('view', 'Results layout', 'Διάταξη αποτελεσμάτων', [
      { value: 'grid', en: 'Grid', el: 'Πλέγμα' },
      { value: 'list', en: 'List', el: 'Λίστα' },
    ], viewMode, (v) => setViewMode(v as ViewMode)),
    { id: 'reset_filters', labelEn: 'Reset the search filters', labelEl: 'Επαναφορά φίλτρων αναζήτησης', writes: false, run: () => setFilters(defaultFilters) },
    { id: 'save_search', labelEn: 'Save the current search', labelEl: 'Αποθήκευση τρέχουσας αναζήτησης', writes: false, run: () => openSaveSearch() },
    { id: 'connect_with', labelEn: 'Open a connection request to', labelEl: 'Άνοιγμα αιτήματος σύνδεσης προς', writes: false, options: byName(shown), run: (v) => { const h = hitById(v); if (h) handleConnect(hitToProfile(h)); } },
    { id: 'message_person', labelEn: 'Message', labelEl: 'Μήνυμα σε', writes: false, options: byName(shown), run: (v) => { const h = hitById(v); if (h) handleMessage(hitToProfile(h)); } },
    { id: 'save_person', labelEn: 'Save to shortlist', labelEl: 'Αποθήκευση στη λίστα', writes: true, options: byName(shown), run: (v) => { const h = hitById(v); return h ? handleBookmark(hitToProfile(h)) : ROW_GONE; } },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'discover',
      labelEn: 'Platform',
      labelEl: 'Πλατφόρμα',
      content: (
        <RailStats
          items={PLATFORM_STAT_SLOTS.map((s) => {
            const count = platformStats?.[s.key];
            return {
              key: s.key,
              label: s.labelEn,
              labelEl: s.labelEl,
              value: count == null ? '—' : count.toLocaleString('en-GB'),
              icon: s.icon,
              tone: 'bg-primary/10 text-primary-accessible',
            };
          })}
        />
      ),
    },
    {
      id: 'filters',
      glyph: 'sliders',
      labelEn: 'Filters & view',
      labelEl: 'Φίλτρα & προβολή',
      badge: (roleFilter !== 'all' ? 1 : 0) + (viewMode !== 'grid' ? 1 : 0) || null,
      content: (
        <div className="space-y-4">
          <RailOptions
            title="Role"
            titleEl="Ρόλος"
            options={ROLE_FILTERS.map((r) => ({ value: r.value, en: r.labelEn, el: r.labelEl, icon: r.icon }))}
            value={roleFilter}
            onChange={setRoleFilter}
          />
          <RailOptions
            title="Layout"
            titleEl="Διάταξη"
            options={[
              { value: 'grid' as ViewMode, en: 'Grid', el: 'Πλέγμα', icon: LayoutGrid },
              { value: 'list' as ViewMode, en: 'List', el: 'Λίστα', icon: List },
            ]}
            value={viewMode === 'match' ? 'grid' : viewMode}
            onChange={setViewMode}
          />
          {roleFilter !== 'all' && (
            <RailAction icon={XIcon} en={discoverEn('clear')} el={discoverEl('clear')} onClick={() => setRoleFilter('all')} />
          )}
        </div>
      ),
    },
    {
      id: 'next',
      glyph: 'matches',
      labelEn: 'Where to go next',
      labelEl: 'Πού να πάτε μετά',
      content: (
        <div className="space-y-1">
          <RailAction icon={TrendingUp} en={discoverEn('view_matches')} el={discoverEl('view_matches')} onClick={() => router.push('/matches')} />
          <RailAction icon={Bookmark} en="Open shortlist" el="Άνοιγμα λίστας" onClick={() => router.push('/shortlist')} />
          <RailAction icon={Search} en={discoverEn('saved_searches_link')} el={discoverEl('saved_searches_link')} onClick={() => router.push('/saved-searches')} />
          <RailAction icon={Users} en="Open connections" el="Άνοιγμα συνδέσεων" onClick={() => router.push('/connections')} />
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title={discoverEn('page_title')}
      titleEl={discoverEl('page_title')}
      description={discoverEn('page_description')}
      descriptionEl={discoverEl('page_description')}
      showHelp
      askAi={askAi}
      contentClassName="overflow-x-clip"
      rail={rail}
    >
      <div className="min-w-0 space-y-6 overflow-x-clip pb-10">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setRoleFilter('all'); }}>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <TabsList className="h-auto min-h-10 w-full min-w-0 sm:w-auto">
              <TabsTrigger value="search" className="min-h-10 flex-1 gap-1.5 px-2.5 text-xs sm:flex-none sm:gap-2 sm:px-3 sm:text-sm">
                <Users className="icon-sm hidden sm:block" />
                <BilingualText en={discoverEn('search')} el={discoverEl('search')} compact />
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="min-h-10 flex-1 gap-1.5 px-2.5 text-xs sm:flex-none sm:gap-2 sm:px-3 sm:text-sm">
                <Sparkles className="icon-sm hidden sm:block" />
                <BilingualText en={discoverEn('for_you')} el={discoverEl('for_you')} compact />
              </TabsTrigger>
              <TabsTrigger value="matches" className="min-h-10 flex-1 gap-1.5 px-2.5 text-xs sm:flex-none sm:gap-2 sm:px-3 sm:text-sm">
                <TrendingUp className="icon-sm hidden sm:block" />
                <BilingualText en={discoverEn('top_matches')} el={discoverEl('top_matches')} compact />
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-8 mt-6">
          {/* Filters */}
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={runSearch}
            loading={loading}
            resultCount={total}
            onSaveSearch={openSaveSearch}
          />

          {/* Results */}
          {loading && (
            <div className={cn(
              'grid grid-cols-1 gap-4',
              viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {[...Array(6)].map((_, i) => (
                <ProfileCardSkeleton key={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
              ))}
            </div>
          )}

          {/* Featured strip when no query */}
          {!loading && !filters.q && hits.length > 0 && roleFilter === 'all' && (
            <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
              <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
                <BadgeCheck className="icon-sm shrink-0 text-primary-accessible" />
                <span className="text-sm font-semibold text-foreground">
                  <BilingualText en="Featured profiles" el="Προτεινόμενα προφίλ" compact />
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  <BilingualText en="Top matches for your profile" el="Κορυφαίες αντιστοιχίσεις για το προφίλ σας" compact />
                </span>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hide sm:flex-wrap">
                {hits.slice(0, 4).map((h) => (
                  <Link key={h.id} href={`/profiles/${h.userId}`}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/40 hover:bg-muted/40 transition-all">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-accessible">
                      {h.displayName?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      {/* 100px cut "Elena Papadopoulos" by a fifth. These
                          chips sit in a horizontal scroller, so a wider one
                          costs nothing but a little scroll. */}
                      {/* No cap and no ellipsis: these chips sit in a
                          horizontal scroller and are already `shrink-0`, so a
                          full name costs a little scroll and nothing else.
                          Capped at 100px, "Elena Papadopoulos" lost two
                          thirds of itself. */}
                      <p className="whitespace-nowrap text-xs font-medium text-foreground">{h.displayName}</p>
                      <p className="whitespace-nowrap text-xs text-muted-foreground"><StatusText value={h.role} /></p>
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
              askAiPrompt="Discover search returned nobody. Suggest filters and a prompt to find a technical cofounder."
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
                'grid grid-cols-1 gap-4',
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
          <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Sparkles className="icon-md shrink-0 text-primary-accessible" />
                Suggested for you
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your profile and preferences
              </p>
          </div>

          {!suggestionsLoaded && (
            <div className={cn(
              'grid grid-cols-1 gap-4',
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
              askAiPrompt="I have no Discover suggestions. What should I add to my profile so recommendations appear?"
              action={
                <Button className="gap-2" asChild>
                  <Link href="/profile/edit">
                    Complete profile
                    <ArrowRight className="icon-sm" />
                  </Link>
                </Button>
              }
            />
          )}

          {suggestionsLoaded && suggestions.length > 0 && (
            <AnimatedList
              animation="fade-in-up"
              staggerDelay={75}
              className={cn(
                'grid grid-cols-1 gap-6',
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
          <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <TrendingUp className="icon-md shrink-0 text-primary-accessible" />
                Your Top Matches
              </h2>
              <p className="text-sm text-muted-foreground">
                People with the highest compatibility
              </p>
          </div>

          {!suggestionsLoaded && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              askAiPrompt="Discover matches tab is empty. Help me find complementary people from the network."
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
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              {suggestions.slice(0, 6).map((hit) => {
                const profile = hitToProfile(hit);
                const score = hit.matchScore ?? 50;
                const matchReasons = (hit.matchReasons ?? [])
                  .map((text) => ({ type: 'skills' as MatchReasonType, text, score: 0 }));
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

      {/* Save search — keeps the current query and filters under a name so
          it can re-run from /saved-searches and raise alerts. */}
      <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><BilingualText en={discoverEn('save_search_title')} el={discoverEl('save_search_title')} compact /></DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <DialogDescription>
              <BilingualText en={discoverEn('save_search_desc')} el={discoverEl('save_search_desc')} />
            </DialogDescription>
            <div className="space-y-2">
              <Label htmlFor="save-search-name"><BilingualText en={discoverEn('save_name_label')} el={discoverEl('save_name_label')} compact /></Label>
              <Input
                id="save-search-name"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder={discoverEn('save_name_placeholder')}
                autoFocus
              />
            </div>
            <label htmlFor="save-search-alerts" className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
              <input
                id="save-search-alerts"
                type="checkbox"
                checked={saveSearchAlerts}
                onChange={(e) => setSaveSearchAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
              <BilingualText en={discoverEn('save_alerts')} el={discoverEl('save_alerts')} compact />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSearchOpen(false)}>
              <BilingualText en={discoverEn('save_cancel')} el={discoverEl('save_cancel')} compact />
            </Button>
            <Button onClick={() => void handleSaveSearch()} disabled={!saveSearchName.trim() || saveSearchBusy}>
              <BilingualText en={saveSearchBusy ? discoverEn('saving') : discoverEn('save_confirm')} el={saveSearchBusy ? discoverEl('saving') : discoverEl('save_confirm')} compact />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
    </AppShell>
  );
}
