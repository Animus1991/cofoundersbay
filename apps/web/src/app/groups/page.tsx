'use client';

import { choiceControl, rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
  X,
  CalendarDays,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailOptions, RailStats } from '@/components/layout/RailParts';
import { usePageRail } from '@/components/layout/PageRailContext';
import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn, errorMessage } from '@/lib/utils';
import { bilingualInline } from '@/lib/i18n/format';
import { STATUS } from '@/lib/semantic-colors';
import { ListEmptyState } from '@/components/common/EmptyStates';
import {
  listGroups,
  getMyGroups,
  joinGroup,
  leaveGroup,
  type GroupView,
} from '@/lib/api';
import { CreateGroupModal } from './components/CreateGroupModal';
import { qk } from '@/lib/query-keys';

import { pressableProps } from '@/lib/pressable';
import { FactLine } from '@/components/common/FactLine';
import { CardHead, CardFoot } from '@/components/common/CardAnatomy';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { useCoverFailed } from '@/hooks/useCoverFailed';
const CATEGORIES = ['All', 'Founders', 'Tech', 'Marketing', 'Design', 'Finance', 'Product', 'Operations', 'Legal'];

/**
 * A community's category in Greek. Categories are stored in English (and the
 * filter's values stay English); "Technology", "Local" and "Sales" used to
 * show untranslated on Greek cards.
 */
const CATEGORY_EL: Record<string, string> = {
  all: 'Όλες οι κατηγορίες',
  founders: 'Ιδρυτές',
  tech: 'Τεχνολογία',
  technology: 'Τεχνολογία',
  marketing: 'Μάρκετινγκ',
  design: 'Σχεδιασμός',
  finance: 'Οικονομικά',
  product: 'Προϊόν',
  operations: 'Λειτουργίες',
  legal: 'Νομικά',
  local: 'Τοπική',
  industry: 'Κλάδος',
  fundraising: 'Χρηματοδότηση',
  community: 'Κοινότητα',
  sales: 'Πωλήσεις',
  stage: 'Στάδιο',
  role: 'Ρόλος',
  learning: 'Μάθηση',
};

/** "local" → { en: 'Local', el: 'Τοπική' }; an unknown category stays as written. */
function categoryLabel(category: string): { en: string; el: string } {
  const en = category ? category[0].toUpperCase() + category.slice(1) : category;
  return { en, el: CATEGORY_EL[category.toLowerCase()] ?? en };
}

const TYPE_FILTERS = [
  { value: 'all',      label: 'All',      icon: Layers },
  { value: 'industry', label: 'Industry', icon: Rocket },
  { value: 'stage',    label: 'Stage',    icon: TrendingUp },
  { value: 'role',     label: 'Role',     icon: Users },
  { value: 'learning', label: 'Learning', icon: BookOpen },
];


function GroupCard({
  group,
  onToggle,
  loading,
}: {
  group: GroupView;
  onToggle: (id: string, isMember: boolean) => void;
  loading: boolean;
  /** Its place in the list (it picked a tint for the empty cover band). */
  index?: number;
}) {
  const router = useRouter();
  const cover = useCoverFailed(group.coverImageUrl);
  const groupType = (group.category?.toLowerCase() ?? 'industry') as string;
  return (
    <Card
      className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30 cursor-pointer overflow-hidden"
      onClick={() => router.push(`/groups/${group.id}`)}
      {...pressableProps({ role: 'link', label: group.name })}
    >
      {/* The cover, when there is one that loads (an <img>, so a blocked
          photo leaves no band: `useCoverFailed`, as on event cards). The
          category chip on it, and on a tinted band when there was none,
          repeated the category the line under the name gives, and a globe
          marked a private group (docs §88). */}
      {group.coverImageUrl && !cover.failed ? (
        <img ref={cover.ref} onError={cover.onError} src={group.coverImageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" className="h-28 w-full object-cover" />
      ) : null}
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            // The community's mark stands in for its logo: content, so the
            // decorative-icon rule must not take it (an empty mark column
            // pushed the title 12px off the body's edge).
            <div data-card-mark="" data-keep-icon className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt={group.name} className="h-10 w-10 object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={40} height={40} />
              ) : (
                <Users className="icon-md" aria-hidden="true" />
              )}
            </div>
          )}
          title={group.name}
          subtitle={(
            <FactLine
              className="text-sm"
              items={[
                group.category ? <BilingualText key="category" en={categoryLabel(group.category).en} el={categoryLabel(group.category).el} compact /> : null,
                group.privacy === 'public'
                  ? <BilingualText key="privacy" en="Public" el="Δημόσια" compact />
                  : <BilingualText key="privacy" en="Private" el="Ιδιωτική" compact />,
              ]}
            />
          )}
          asideStays
          aside={group.isMember ? <CheckCircle2 className={cn('icon-sm shrink-0', STATUS.success.icon)} aria-label={bilingualInline('You are a member', 'Είστε μέλος')} /> : undefined}
        />

        {group.description && (
          <p className="card-body line-clamp-2 text-muted-foreground">{group.description}</p>
        )}

        {/* A tag that is the category already reads in the line under the
            name ("Fundraising · Private", then "Fundraising · Legal"). */}
        <FactLine items={(group.tags ?? []).filter((t) => t.toLowerCase() !== groupType).slice(0, 4)} />

        {/* The foot keeps its clicks to itself: the card opens the group. */}
        <div onClick={(e) => e.stopPropagation()}>
          <CardFoot
            meta={(
              <FactLine
                items={[
                  <BilingualText key="members" en={`${(group.memberCount ?? 0).toLocaleString('en-GB')} members`} el={`${(group.memberCount ?? 0).toLocaleString('el-GR')} μέλη`} compact />,
                  <BilingualText key="posts" en={`${(group.postCount ?? 0).toLocaleString('en-GB')} posts`} el={`${(group.postCount ?? 0).toLocaleString('el-GR')} αναρτήσεις`} compact />,
                ]}
              />
            )}
          >
            <Button
              variant={group.isMember ? 'outline' : 'default'}
              size="sm"
              className="gap-1"
              disabled={loading}
              onClick={() => onToggle(group.id, group.isMember)}
            >
              {loading ? (
                <Loader2 className="icon-sm animate-spin" />
              ) : group.isMember ? (
                <><LogOut className="icon-sm" aria-hidden="true" /> <BilingualText en="Leave" el="Αποχώρηση" compact /></>
              ) : (
                <><UserPlus className="icon-sm" aria-hidden="true" /> <BilingualText en="Join" el="Συμμετοχή" compact /></>
              )}
            </Button>
          </CardFoot>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupsGrid({
  groups,
  onToggle,
  loadingId,
  offset = 0,
}: {
  groups: GroupView[];
  onToggle: (id: string, isMember: boolean) => void;
  loadingId: string | null;
  offset?: number;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((g, i) => (
        <GroupCard key={g.id} group={g} onToggle={onToggle} loading={loadingId === g.id} index={offset + i} />
      ))}
    </div>
  );
}

export default function GroupsPage() {
  const sayOne = useBilingualString();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { openRailSection } = usePageRail();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // /groups?create=1 opens the form: "Create community" on Manage
  // communities lands here (docs §88). Read after mount, like ?section=.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('create') !== '1') return;
    setShowCreateModal(true);
    url.searchParams.delete('create');
    window.history.replaceState(window.history.state, '', url);
  }, []);
  const [sort, setSort] = useState<'popular' | 'recent' | 'trending'>('popular');
  const [typeFilter, setTypeFilter] = useState('all');
  // Offered to the assistant: tab, category, sort and type, and the create
  // form, through the same setters. Joining and leaving are offered below,
  // once the rows are known.
  usePageControls([
    choiceControl('tab', 'Communities tab', 'Καρτέλα κοινοτήτων', [
      { value: 'discover', en: 'Discover', el: 'Ανακάλυψη' },
      { value: 'my-groups', en: 'My communities', el: 'Οι κοινότητές μου' },
    ], activeTab, (v) => setActiveTab(v as typeof activeTab)),
    choiceControl('category', 'Community category', 'Κατηγορία κοινότητας', CATEGORIES.map((c) => ({ value: c, en: c === 'All' ? 'All categories' : c, el: categoryLabel(c).el })), selectedCategory, setSelectedCategory),
    choiceControl('sort', 'Sort communities', 'Ταξινόμηση κοινοτήτων', [
      { value: 'popular', en: 'Popular', el: 'Δημοφιλείς' },
      { value: 'recent', en: 'Recent', el: 'Πρόσφατες' },
      { value: 'trending', en: 'Trending', el: 'Ανερχόμενες' },
    ], sort, (v) => setSort(v as typeof sort)),
    choiceControl('type', 'Community type', 'Τύπος κοινότητας', TYPE_FILTERS.map((t) => ({ value: t.value, en: t.value === 'all' ? 'Any type' : t.label, el: t.value === 'all' ? 'Οποιοσδήποτε τύπος' : categoryLabel(t.value).el })), typeFilter, setTypeFilter),
    { id: 'create', labelEn: 'Open the create community form', labelEl: 'Άνοιγμα φόρμας νέας κοινότητας', writes: false, run: () => setShowCreateModal(true) },
  ]);

  const discoverQuery = useQuery({
    queryKey: qk('groups', 'discover', selectedCategory, searchQuery, sort),
    queryFn: () =>
      listGroups({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        sort,
        limit: 30,
      }),
    staleTime: 60_000,
  });

  const myGroupsQuery = useQuery({
    queryKey: qk('groups', 'my'),
    queryFn: getMyGroups,
    staleTime: 30_000,
    enabled: activeTab === 'my-groups',
  });

  const handleToggle = useCallback(
    async (groupId: string, isMember: boolean): Promise<PageControlRunResult> => {
      setLoadingId(groupId);
      try {
        if (isMember) {
          await leaveGroup(groupId);
          success('Left group', 'You have left the group.');
        } else {
          await joinGroup(groupId);
          success('Joined group', 'Welcome to the community!');
        }
        queryClient.invalidateQueries({ queryKey: qk('groups') });
      } catch (e) {
        toastError(isMember ? 'Could not leave the group' : 'Could not join the group', errorMessage(e, 'Something went wrong.'));
        return { error: errorMessage(e, isMember ? 'You are still a member.' : 'You did not join.') };
      } finally {
        setLoadingId(null);
      }
    },
    [queryClient, success, toastError],
  );

  const discoverGroups = discoverQuery.data?.groups ?? [];
  const myGroups = (myGroupsQuery.data?.groups ?? []) as GroupView[];

  const filteredDiscover = typeFilter === 'all' ? discoverGroups : discoverGroups.filter((g) =>
    g.category?.toLowerCase() === typeFilter
  );

  const displayGroups = activeTab === 'my-groups' ? myGroups : filteredDiscover;
  // Discover leads with its top four; your own communities are one grid
  // (they were "Your communities" and then "More communities", which read as
  // other people's).
  const topGroups = activeTab === 'my-groups' ? [] : displayGroups.slice(0, 4);
  const restGroups = activeTab === 'my-groups' ? displayGroups : displayGroups.slice(4);

  const totalGroups = discoverGroups.length;
  // The my-groups read only runs on its tab, so on Discover this counted an
  // empty list and said "Joined 0" beside cards marked joined. Until that read
  // has run, the discover rows carry the same fact.
  const myGroupsCount = myGroupsQuery.data
    ? myGroups.length
    : discoverGroups.filter((g) => g.isMember).length;
  const trendingGroup = discoverGroups.find((g) => g.postCount > 0) ?? discoverGroups[0];

  const discoverFiltersActive =
    searchQuery.trim() !== '' || selectedCategory !== 'All' || typeFilter !== 'all';
  const clearDiscoverFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setTypeFilter('all');
  }, []);

  // What the tab shows, and the card's Join / Leave as commands - the same
  // handler the card button calls.
  const listLoading = activeTab === 'my-groups' ? myGroupsQuery.isLoading : discoverQuery.isLoading;
  const listFailed = activeTab === 'my-groups' ? myGroupsQuery.isError : discoverQuery.isError;
  // The empty Discover list offers its own "Create community"; the header's
  // would be a second filled button doing the same.
  const discoverEmpty = activeTab === 'discover' && !listLoading && !listFailed && displayGroups.length === 0 && !discoverFiltersActive;
  usePageList([
    {
      id: 'groups',
      labelEn: activeTab === 'my-groups' ? 'My groups' : 'Groups',
      labelEl: activeTab === 'my-groups' ? 'Οι ομάδες μου' : 'Ομάδες',
      rows: listLoading ? undefined : displayGroups.map((g) =>
        `${g.name}${g.category ? ` · ${g.category}` : ''} · ${g.privacy} · ${g.memberCount} members, ${g.postCount} posts${g.isMember ? ' · joined' : ''}`,
      ),
    },
  ]);
  usePageControls([
    {
      id: 'join_group',
      labelEn: 'Join group',
      labelEl: 'Συμμετοχή σε κοινότητα',
      writes: true,
      options: rowOptions(displayGroups.filter((g) => !g.isMember), (g) => g.id, (g) => g.name),
      // joinGroup creates a `member` row and leaveGroup deletes it
      // (groups.service), so leaving takes a join back. The welcome the join
      // triggers has been sent either way.
      undo: (v) => ({ control: 'leave_group', value: v }),
      run: (v) => (v ? handleToggle(v, false) : undefined),
    },
    {
      id: 'leave_group',
      labelEn: 'Leave group',
      labelEl: 'Αποχώρηση από κοινότητα',
      writes: true,
      options: rowOptions(displayGroups.filter((g) => g.isMember), (g) => g.id, (g) => g.name),
      // Rejoining comes back as `member`: exact for a member, not for an
      // admin or moderator, whose role would be lost - so only then.
      undo: (v) => (displayGroups.find((g) => g.id === v)?.memberRole === 'member' ? { control: 'join_group', value: v } : undefined),
      run: (v) => (v ? handleToggle(v, true) : undefined),
    },
  ]);

  /*
   * The column is the tabs, the search and the communities. Above them sat a
   * stat strip, a sort row, a type row, a category row and an amber trending
   * banner - five tiers before the first card - and the banner's "View" did
   * nothing. They are rail sections now; the banner's group is a real link.
   */
  const activeFilters = (typeFilter !== 'all' ? 1 : 0) + (selectedCategory !== 'All' ? 1 : 0);
  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'community',
      labelEn: 'Communities at a glance',
      labelEl: 'Κοινότητες με μια ματιά',
      content: (
        <RailStats
          items={[
            { key: 'total', label: 'Total communities', labelEl: 'Συνολικές κοινότητες', value: totalGroups, icon: Users, tone: 'bg-status-accent-bg text-status-accent' },
            { key: 'joined', label: 'Joined', labelEl: 'Συμμετοχές', value: myGroupsCount, icon: CheckCircle2, tone: 'bg-status-success-bg text-status-success' },
            { key: 'active', label: 'Active now', labelEl: 'Ενεργές τώρα', value: discoverGroups.filter((g) => g.postCount > 0).length, icon: Zap, tone: 'bg-status-warning-bg text-status-warning' },
          ]}
        />
      ),
    },
    {
      id: 'filters',
      glyph: 'sliders',
      labelEn: 'Sort and filter',
      labelEl: 'Ταξινόμηση και φίλτρα',
      badge: activeFilters || null,
      content:
        activeTab === 'discover' ? (
          <div className="space-y-4">
            <RailOptions
              title="Sort by"
              titleEl="Ταξινόμηση"
              options={[
                { value: 'popular' as const, en: 'Popular', el: 'Δημοφιλείς' },
                { value: 'recent' as const, en: 'Recent', el: 'Πρόσφατες' },
                { value: 'trending' as const, en: 'Trending', el: 'Ανερχόμενες', icon: TrendingUp },
              ]}
              value={sort}
              onChange={setSort}
            />
            <RailOptions
              title="Type"
              titleEl="Τύπος"
              options={TYPE_FILTERS.map((tf) => ({ value: tf.value, en: tf.value === 'all' ? 'Any type' : tf.label, el: tf.value === 'all' ? 'Οποιοσδήποτε τύπος' : categoryLabel(tf.value).el, icon: tf.icon }))}
              value={typeFilter}
              onChange={setTypeFilter}
            />
            <RailOptions
              title="Category"
              titleEl="Κατηγορία"
              options={CATEGORIES.map((c) => ({ value: c, en: c === 'All' ? 'All categories' : c, el: categoryLabel(c).el }))}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
            {activeFilters > 0 && (
              <RailAction icon={X} en="Clear filters" el="Καθαρισμός φίλτρων" onClick={() => { setTypeFilter('all'); setSelectedCategory('All'); }} />
            )}
          </div>
        ) : (
          <div className="space-y-2 px-2.5 text-sm text-muted-foreground">
            <p><BilingualText en="Sorting and filters apply to Discover." el="Η ταξινόμηση και τα φίλτρα ισχύουν στην Ανακάλυψη." wrap /></p>
            <RailAction icon={Search} en="Open Discover" el="Άνοιγμα Ανακάλυψης" onClick={() => setActiveTab('discover')} />
          </div>
        ),
    },
    {
      id: 'trending',
      glyph: 'spark',
      labelEn: 'Trending now',
      labelEl: 'Τάσεις τώρα',
      content: trendingGroup ? (
        <Link
          href={`/groups/${trendingGroup.id}`}
          className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-ring"
        >
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', STATUS.warning.bg)} aria-hidden="true">
            <Star className={cn('icon-sm', STATUS.warning.icon)} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{trendingGroup.name}</span>
            <span className="block text-xs text-muted-foreground">
              <BilingualText
                en={`${trendingGroup.memberCount.toLocaleString('en-GB')} members · ${trendingGroup.postCount.toLocaleString('en-GB')} posts`}
                el={`${trendingGroup.memberCount.toLocaleString('el-GR')} μέλη · ${trendingGroup.postCount.toLocaleString('el-GR')} αναρτήσεις`}
                compact
                wrap
              />
            </span>
          </span>
          <ArrowRight className="icon-sm shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
        </Link>
      ) : (
        <p className="px-2.5 text-sm text-muted-foreground"><BilingualText en="Nothing is trending yet." el="Τίποτα δεν είναι σε τάση ακόμα." wrap /></p>
      ),
    },
    {
      id: 'related',
      glyph: 'flag',
      labelEn: 'Linked pages',
      labelEl: 'Συνδεδεμένες σελίδες',
      content: (
        <div className="space-y-1">
          <RailAction icon={CalendarDays} en="Open events" el="Άνοιγμα εκδηλώσεων" onClick={() => router.push('/events')} />
          <RailAction icon={Users} en="Open members" el="Άνοιγμα μελών" onClick={() => router.push('/members')} />
          <RailAction icon={Layers} en="Open feed" el="Άνοιγμα ροής" onClick={() => router.push('/feed')} />
        </div>
      ),
    },
  ];

  return (
    <AppShell
      showHelp
      rail={rail}
      actions={discoverEmpty ? undefined : (
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="icon-sm" />
          <BilingualText en="Create Community" el="Δημιουργία κοινότητας" compact />
        </Button>
      )}
    >
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: qk('groups') });
            setActiveTab('my-groups');
          }}
        />
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setTypeFilter('all'); }} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="discover"><BilingualText en="Discover" el="Ανακάλυψη" compact /></TabsTrigger>
            <TabsTrigger value="my-groups">
              <BilingualText en="My Communities" el="Οι κοινότητές μου" compact />
              {/* The same count as the rail's "Joined": it read nothing until
                  the tab had been opened once. */}
              {myGroupsCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-2xs text-primary-accessible">
                  {myGroupsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

        </div>

        <TabsContent value={activeTab} className="space-y-6 mt-0">
          {/* Search & Filters (discover only) */}
          {activeTab === 'discover' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder={sayOne('Search communities by name, topic or tag…', 'Αναζήτηση κοινοτήτων με όνομα, θέμα ή ετικέτα…')}
                  aria-label={bilingualInline('Search communities', 'Αναζήτηση κοινοτήτων')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Loading */}
          {listLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="icon-xl animate-spin text-primary/50" />
            </div>
          )}

          {/* Error — and only the error: "No communities yet" used to follow
              it, with its own Create button (docs §88). */}
          {listFailed && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <p role="alert" className="text-sm text-muted-foreground">
                {activeTab === 'discover'
                  ? <BilingualText en="Communities could not be read just now." el="Οι κοινότητες δεν διαβάστηκαν αυτή τη στιγμή." wrap />
                  : <BilingualText en="Your communities could not be read just now." el="Οι κοινότητές σας δεν διαβάστηκαν αυτή τη στιγμή." wrap />}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  activeTab === 'discover'
                    ? discoverQuery.refetch()
                    : myGroupsQuery.refetch()
                }
              >
                <RefreshCw className="icon-sm" />
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </Button>
            </div>
          )}

          {/* Result count */}
          {!listLoading && displayGroups.length > 0 && (
            <p className="text-xs text-muted-foreground px-0.5">
              {activeTab === 'my-groups'
                ? <BilingualText en={`${displayGroups.length} joined`} el={`${displayGroups.length} με συμμετοχή`} compact />
                : <BilingualText en={`${displayGroups.length} found`} el={`${displayGroups.length} βρέθηκαν`} compact />}
            </p>
          )}

          {/* Featured top row */}
          {!listLoading && topGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="icon-sm text-muted-foreground" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {sort === 'trending'
                    ? <BilingualText en="Trending now" el="Σε άνοδο τώρα" compact />
                    : <BilingualText en="Top communities" el="Κορυφαίες κοινότητες" compact />}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {topGroups.map((g, i) => (
                  <GroupCard key={g.id} group={g} onToggle={handleToggle} loading={loadingId === g.id} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Rest of groups. "All communities" headed the ones after the top
              four, not all of them. */}
          {!listLoading && restGroups.length > 0 && (
            <div className="space-y-3">
              {topGroups.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <BilingualText en="More communities" el="Περισσότερες κοινότητες" compact />
                </h2>
              )}
              <GroupsGrid groups={restGroups} onToggle={handleToggle} loadingId={loadingId} offset={topGroups.length} />
            </div>
          )}

          {/* Empty State — filter-aware */}
          {!listLoading && !listFailed && displayGroups.length === 0 && (
            activeTab === 'my-groups' ? (
              <ListEmptyState
                icon={Users}
                tone="primary"
                title={<BilingualText en="You haven't joined any communities yet" el="Δεν έχετε ενταχθεί ακόμα σε κοινότητες" />}
                description={<BilingualText en="Join one from Discover; its posts and events then show here." el="Μπείτε σε μία από την Ανακάλυψη· οι αναρτήσεις και οι εκδηλώσεις της εμφανίζονται μετά εδώ." />}
                action={(
                  // Secondary: "Create Community" in the header is the page's one filled button.
                  <Button variant="secondary" className="gap-2" onClick={() => setActiveTab('discover')}>
                    <Search className="icon-sm" />
                    <BilingualText en="Browse communities" el="Περιήγηση κοινοτήτων" compact />
                  </Button>
                )}
              />
            ) : discoverFiltersActive ? (
              // "Show all" resets the search as well as the rail's filters, so
              // it is its own action rather than a copy of the rail's Clear.
              <ListEmptyState
                icon={Search}
                title={<BilingualText en="No communities match" el="Καμία κοινότητα δεν ταιριάζει" />}
                description={<BilingualText en="Nothing matched the search or the filters." el="Τίποτα δεν ταίριαξε με την αναζήτηση ή τα φίλτρα." />}
                action={(
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" size="sm" className="gap-1.5" onClick={clearDiscoverFilters}>
                      <X className="icon-sm" />
                      <BilingualText en="Show all communities" el="Εμφάνιση όλων των κοινοτήτων" compact />
                    </Button>
                    {(typeFilter !== 'all' || selectedCategory !== 'All') && (
                      <Button variant="ghost" size="sm" onClick={() => openRailSection('filters')}>
                        <BilingualText en="Show filters" el="Εμφάνιση φίλτρων" compact />
                      </Button>
                    )}
                  </div>
                )}
                size="compact"
              />
            ) : (
              <ListEmptyState
                icon={Sparkles}
                tone="primary"
                title={<BilingualText en="No communities yet" el="Δεν υπάρχουν κοινότητες ακόμα" />}
                description={<BilingualText en="Start one around a topic, a stage or a city; members post and meet there." el="Ξεκινήστε μία γύρω από ένα θέμα, ένα στάδιο ή μια πόλη· τα μέλη δημοσιεύουν και συναντιούνται εκεί." />}
                action={(
                  <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
                    <Plus className="icon-sm" />
                    <BilingualText en="Create community" el="Δημιουργία κοινότητας" compact />
                  </Button>
                )}
              />
            )
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
