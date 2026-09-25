'use client';

import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  Layers,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { STATUS, categoryChip } from '@/lib/semantic-colors';
import { ListEmptyState, NoFilterResults } from '@/components/common/EmptyStates';
import {
  listGroups,
  getMyGroups,
  joinGroup,
  leaveGroup,
  type GroupView,
} from '@/lib/api';
import { CreateGroupModal } from './components/CreateGroupModal';
import { qk } from '@/lib/query-keys';

const CATEGORIES = ['All', 'Founders', 'Tech', 'Marketing', 'Design', 'Finance', 'Product', 'Operations', 'Legal'];

const TYPE_FILTERS = [
  { value: 'all',      label: 'All',      icon: Layers },
  { value: 'industry', label: 'Industry', icon: Rocket },
  { value: 'stage',    label: 'Stage',    icon: TrendingUp },
  { value: 'role',     label: 'Role',     icon: Users },
  { value: 'learning', label: 'Learning', icon: BookOpen },
];

const COVER_TONES = [
  'bg-primary/12',
  'bg-status-success-bg',
  'bg-status-warning-bg',
  'bg-status-info-bg',
  'bg-status-accent-bg',
  'bg-status-neutral-bg',
];

function GroupCard({
  group,
  onToggle,
  loading,
  index = 0,
}: {
  group: GroupView;
  onToggle: (id: string, isMember: boolean) => void;
  loading: boolean;
  index?: number;
}) {
  const router = useRouter();
  const coverTone = COVER_TONES[index % COVER_TONES.length];
  const groupType = (group.category?.toLowerCase() ?? 'industry') as string;
  const typeColor = categoryChip(groupType);
  return (
    <Card
      className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30 cursor-pointer overflow-hidden"
      onClick={() => router.push(`/groups/${group.id}`)}
    >
      {/* Cover Image */}
      {group.coverImageUrl ? (
        <div
          className="h-28 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${group.coverImageUrl})` }}
        >
          <div className="absolute top-2 left-2">
            <span className={cn('rounded-full px-2 py-0.5 text-2xs font-semibold capitalize', typeColor.chip)}>
              {groupType}
            </span>
          </div>
          {group.privacy === 'private' && (
            <div className="absolute top-2 right-2">
              <Globe className="icon-sm text-white/80" />
            </div>
          )}
        </div>
      ) : (
        <div className={cn('h-28 w-full rounded-t-xl relative', coverTone)}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-10 w-10 text-foreground/15" />
          </div>
          <div className="absolute top-2 left-2">
            <span className={cn('rounded-full px-2 py-0.5 text-2xs font-semibold capitalize', typeColor.chip)}>
              {groupType}
            </span>
          </div>
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-accessible">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt={group.name} className="h-11 w-11 rounded-lg object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={44} height={44} />
              ) : (
                <Users className="icon-md" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-display text-sm font-semibold text-foreground truncate">{group.name}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {group.category && (
                  <Badge variant="secondary" className="text-2xs">{group.category}</Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {group.privacy === 'public' ? <Globe className="icon-sm" /> : <Lock className="icon-sm" />}
                  <span className="capitalize">{group.privacy}</span>
                </div>
              </div>
            </div>
          </div>
          {group.isMember && <CheckCircle2 className={cn('icon-sm shrink-0 mt-0.5', STATUS.success.icon)} />}
        </div>

        {group.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{group.description}</p>
        )}

        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-secondary/60 px-2 py-0.5 text-2xs text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="flex items-center justify-between pt-2 border-t border-border/40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="icon-sm" />
              {group.memberCount.toLocaleString('en-GB')}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="icon-sm" />
              {group.postCount.toLocaleString('en-GB')}
            </span>
          </div>
          <Button
            variant={group.isMember ? 'outline' : 'default'}
            size="sm"
            className="gap-1 text-xs h-7 px-3"
            disabled={loading}
            onClick={() => onToggle(group.id, group.isMember)}
          >
            {loading ? (
              <Loader2 className="icon-sm animate-spin" />
            ) : group.isMember ? (
              <><LogOut className="icon-sm" /> Leave</>
            ) : (
              <><UserPlus className="icon-sm" /> Join</>
            )}
          </Button>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((g, i) => (
        <GroupCard key={g.id} group={g} onToggle={onToggle} loading={loadingId === g.id} index={offset + i} />
      ))}
    </div>
  );
}

export default function GroupsPage() {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    choiceControl('category', 'Community category', 'Κατηγορία κοινότητας', CATEGORIES.map((c) => ({ value: c, en: c === 'All' ? 'All categories' : c, el: c === 'All' ? 'Όλες οι κατηγορίες' : c })), selectedCategory, setSelectedCategory),
    choiceControl('sort', 'Sort communities', 'Ταξινόμηση κοινοτήτων', [
      { value: 'popular', en: 'Popular', el: 'Δημοφιλείς' },
      { value: 'recent', en: 'Recent', el: 'Πρόσφατες' },
      { value: 'trending', en: 'Trending', el: 'Ανερχόμενες' },
    ], sort, (v) => setSort(v as typeof sort)),
    choiceControl('type', 'Community type', 'Τύπος κοινότητας', TYPE_FILTERS.map((t) => ({ value: t.value, en: t.value === 'all' ? 'Any type' : t.label, el: t.value === 'all' ? 'Οποιοσδήποτε τύπος' : t.label })), typeFilter, setTypeFilter),
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
    async (groupId: string, isMember: boolean) => {
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
      } catch (e: any) {
        toastError('Error', e?.message ?? 'Something went wrong.');
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
  const topGroups = displayGroups.slice(0, 4);
  const restGroups = displayGroups.slice(4);

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
      labelEl: 'Συμμετοχή σε ομάδα',
      writes: true,
      options: rowOptions(displayGroups.filter((g) => !g.isMember), (g) => g.id, (g) => g.name),
      // joinGroup creates a `member` row and leaveGroup deletes it
      // (groups.service), so leaving takes a join back. The welcome the join
      // triggers has been sent either way.
      undo: (v) => ({ control: 'leave_group', value: v }),
      run: (v) => { if (v) void handleToggle(v, false); },
    },
    {
      id: 'leave_group',
      labelEn: 'Leave group',
      labelEl: 'Αποχώρηση από ομάδα',
      writes: true,
      options: rowOptions(displayGroups.filter((g) => g.isMember), (g) => g.id, (g) => g.name),
      // Rejoining comes back as `member`: exact for a member, not for an
      // admin or moderator, whose role would be lost - so only then.
      undo: (v) => (displayGroups.find((g) => g.id === v)?.memberRole === 'member' ? { control: 'join_group', value: v } : undefined),
      run: (v) => { if (v) void handleToggle(v, true); },
    },
  ]);

  return (
    <AppShell
      showHelp
      actions={
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="icon-sm" />
          <BilingualText en="Create Community" el="Δημιουργία κοινότητας" compact />
        </Button>
      }
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

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { labelEn: 'Total Communities', labelEl: 'Συνολικές κοινότητες', value: totalGroups, Icon: Users, tone: STATUS.accent },
          { labelEn: 'Joined', labelEl: 'Συμμετοχές', value: myGroupsCount, Icon: CheckCircle2, tone: STATUS.success },
          { labelEn: 'Active Now', labelEl: 'Ενεργές τώρα', value: discoverGroups.filter((g) => g.postCount > 0).length, Icon: Zap, tone: STATUS.warning },
        ].map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.labelEn} className="shadow-sm border-border/50">
              <CardContent className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.tone.bg, s.tone.icon)}>
                  <Icon className="icon-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground"><BilingualText en={s.labelEn} el={s.labelEl} compact wrap /></p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setTypeFilter('all'); }} className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="discover"><BilingualText en="Discover" el="Ανακάλυψη" compact /></TabsTrigger>
            <TabsTrigger value="my-groups">
              <BilingualText en="My Communities" el="Οι κοινότητές μου" compact />
              {myGroups.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-2xs text-primary-accessible">
                  {myGroups.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'discover' && (
            <div className="flex items-center gap-2">
              {(['popular', 'recent', 'trending'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    sort === s
                      ? 'bg-primary/15 text-primary-accessible'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )}
                >
                  {s === 'trending' ? <span className="flex items-center gap-1"><TrendingUp className="icon-sm" />{s}</span> : s}
                </button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value={activeTab} className="space-y-5 mt-0">
          {/* Search & Filters (discover only) */}
          {activeTab === 'discover' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search communities by name, topic, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Type filter tabs — Figma-inspired */}
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map((tf) => {
                  const TIcon = tf.icon;
                  const isActive = typeFilter === tf.value;
                  return (
                    <button
                      key={tf.value}
                      onClick={() => setTypeFilter(tf.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                      )}
                    >
                      <TIcon className="icon-sm" />
                      {tf.label}
                    </button>
                  );
                })}
              </div>
              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'rounded-full border px-3.5 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                      selectedCategory === cat
                        ? 'border-primary bg-primary/15 text-primary-accessible'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {(activeTab === 'discover' ? discoverQuery.isLoading : myGroupsQuery.isLoading) && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="icon-xl animate-spin text-primary/50" />
            </div>
          )}

          {/* Error */}
          {(activeTab === 'discover' ? discoverQuery.isError : myGroupsQuery.isError) && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <p className="text-sm text-muted-foreground">Failed to load groups</p>
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
                Retry
              </Button>
            </div>
          )}

          {/* Trending banner */}
          {activeTab === 'discover' && !discoverQuery.isLoading && trendingGroup && (
            <div className="flex items-center gap-3 rounded-xl border border-status-warning-border/30 bg-status-warning-bg px-4 py-3">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', STATUS.warning.bg)}>
                <Star className={cn('icon-sm', STATUS.warning.icon)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  Trending: <span className={STATUS.warning.text}>{trendingGroup.name}</span>
                </p>
                <p className="text-2xs text-muted-foreground truncate">{trendingGroup.memberCount} members · {trendingGroup.postCount} posts</p>
              </div>
              <button
                onClick={() => {/* navigate */}}
                className={cn('shrink-0 text-xs hover:underline flex items-center gap-1', STATUS.warning.text)}
              >
                View <ArrowRight className="icon-sm" />
              </button>
            </div>
          )}

          {/* Result count */}
          {!discoverQuery.isLoading && displayGroups.length > 0 && (
            <p className="text-xs text-muted-foreground px-0.5">{displayGroups.length} {activeTab === 'my-groups' ? 'joined' : 'found'}</p>
          )}

          {/* Featured top row */}
          {!discoverQuery.isLoading && topGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="icon-sm text-primary-accessible" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeTab === 'my-groups' ? 'Your Communities' : sort === 'trending' ? 'Trending Now' : 'Top Communities'}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {topGroups.map((g, i) => (
                  <GroupCard key={g.id} group={g} onToggle={handleToggle} loading={loadingId === g.id} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Rest of groups */}
          {!discoverQuery.isLoading && restGroups.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'my-groups' ? 'More Communities' : 'All Communities'}
              </h2>
              <GroupsGrid groups={restGroups} onToggle={handleToggle} loadingId={loadingId} offset={topGroups.length} />
            </div>
          )}

          {/* Empty State — filter-aware */}
          {!discoverQuery.isLoading && !myGroupsQuery.isLoading && displayGroups.length === 0 && (
            activeTab === 'my-groups' ? (
              <ListEmptyState
                icon={Users}
                tone="primary"
                title={<BilingualText en="You haven't joined any communities yet" el="Δεν έχετε ενταχθεί ακόμα σε κοινότητες" />}
                description={<BilingualText en="Browse the Discover tab to find industry, stage, and role-based communities that match your goals — then join to follow the conversation." el="Περιηγηθείτε στην καρτέλα Ανακάλυψη για κοινότητες ανά κλάδο, στάδιο και ρόλο — και ενταχθείτε για να παρακολουθείτε τη συζήτηση." />}
                action={(
                  <Button className="gap-2" onClick={() => setActiveTab('discover')}>
                    <Search className="icon-sm" />
                    <BilingualText en="Browse communities" el="Περιήγηση κοινοτήτων" compact />
                  </Button>
                )}
              />
            ) : discoverFiltersActive ? (
              <NoFilterResults
                entity="communities"
                onClear={clearDiscoverFilters}
                description="No communities match your search and filters. Clear them to see everything, or start the community you're looking for."
              />
            ) : (
              <ListEmptyState
                icon={Sparkles}
                tone="primary"
                title={<BilingualText en="No communities yet" el="Δεν υπάρχουν κοινότητες ακόμα" />}
                description={<BilingualText en="Be the first to start one. Bring founders, mentors, and operators together around a shared industry, stage, or goal." el="Γίνετε οι πρώτοι που δημιουργούν μία. Φέρτε ιδρυτές, μέντορες και operators κοντά γύρω από κοινό κλάδο, στάδιο ή στόχο." />}
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
