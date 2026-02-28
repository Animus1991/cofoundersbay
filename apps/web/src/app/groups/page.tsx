'use client';

import { useState, useCallback, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Search, Users, Plus, TrendingUp, Lock, Globe, CheckCircle2,
  UserPlus, MessageCircle, LogOut, Loader2, RefreshCw, Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  listGroups,
  getMyGroups,
  joinGroup,
  leaveGroup,
  type GroupView,
} from '@/lib/api';
import { CreateGroupModal } from './components/CreateGroupModal';

const CATEGORIES = ['All', 'Founders', 'Tech', 'Marketing', 'Design', 'Finance', 'Product', 'Operations', 'Legal'];

function GroupCard({
  group,
  onToggle,
  loading,
}: {
  group: GroupView;
  onToggle: (id: string, isMember: boolean) => void;
  loading: boolean;
}) {
  const router = useRouter();
  return (
    <Card
      className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30 cursor-pointer"
      onClick={() => router.push(`/groups/${group.id}`)}
    >
      {group.coverImageUrl && (
        <div
          className="h-24 w-full rounded-t-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${group.coverImageUrl})` }}
        />
      )}
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt={group.name} className="h-11 w-11 rounded-xl object-cover" />
              ) : (
                <Users className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-display text-sm font-semibold text-foreground truncate">{group.name}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {group.category && (
                  <Badge variant="secondary" className="text-[10px]">{group.category}</Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {group.privacy === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span className="capitalize">{group.privacy}</span>
                </div>
              </div>
            </div>
          </div>
          {group.isMember && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
        </div>

        {group.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{group.description}</p>
        )}

        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] text-secondary-foreground">
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
              <Users className="h-3.5 w-3.5" />
              {group.memberCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {group.postCount.toLocaleString()}
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
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : group.isMember ? (
              <><LogOut className="h-3 w-3" /> Leave</>
            ) : (
              <><UserPlus className="h-3 w-3" /> Join</>
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
}: {
  groups: GroupView[];
  onToggle: (id: string, isMember: boolean) => void;
  loadingId: string | null;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <GroupCard key={g.id} group={g} onToggle={onToggle} loading={loadingId === g.id} />
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

  const discoverQuery = useQuery({
    queryKey: ['groups', 'discover', selectedCategory, searchQuery, sort],
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
    queryKey: ['groups', 'my'],
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
        queryClient.invalidateQueries({ queryKey: ['groups'] });
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

  const displayGroups = activeTab === 'my-groups' ? myGroups : discoverGroups;
  const topGroups = displayGroups.slice(0, 4);
  const restGroups = displayGroups.slice(4);

  return (
    <AppShell
      title="Groups"
      description="Join communities, share knowledge, and connect with like-minded founders"
      actions={
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      }
    >
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            setActiveTab('my-groups');
          }}
        />
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-groups">
              My Groups
              {myGroups.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
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
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )}
                >
                  {s === 'trending' ? <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{s}</span> : s}
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search groups by name, topic, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'rounded-full border px-3.5 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                      selectedCategory === cat
                        ? 'border-primary bg-primary/15 text-primary'
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
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
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
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Featured top row */}
          {!discoverQuery.isLoading && topGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeTab === 'my-groups' ? 'Your Communities' : sort === 'trending' ? 'Trending Now' : 'Top Groups'}
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {topGroups.map((g) => (
                  <GroupCard key={g.id} group={g} onToggle={handleToggle} loading={loadingId === g.id} />
                ))}
              </div>
            </div>
          )}

          {/* Rest of groups */}
          {!discoverQuery.isLoading && restGroups.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'my-groups' ? 'More Groups' : 'All Groups'}
              </h2>
              <GroupsGrid groups={restGroups} onToggle={handleToggle} loadingId={loadingId} />
            </div>
          )}

          {/* Empty State */}
          {!discoverQuery.isLoading && !myGroupsQuery.isLoading && displayGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 mb-4 text-muted-foreground/20" />
              <p className="font-medium text-foreground">
                {activeTab === 'my-groups' ? "You haven't joined any groups yet" : 'No groups found'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {activeTab === 'my-groups'
                  ? 'Browse the Discover tab to find communities that match your interests'
                  : 'Try a different search or category, or create your own group'}
              </p>
              {activeTab === 'my-groups' && (
                <Button className="mt-4 gap-2" onClick={() => setActiveTab('discover')}>
                  <Search className="h-4 w-4" />
                  Browse Groups
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
