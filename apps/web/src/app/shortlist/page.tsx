'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark, BookmarkX, MapPin, Briefcase, Trash2,
  MessageCircle, ExternalLink, RefreshCw, Edit2, Check, X,
  User, AlertTriangle, Search, SlidersHorizontal, Grid3X3,
  List, GitMerge, Star, Tag, Clock, TrendingUp, Filter,
  ChevronDown, CheckSquare, Square, ArrowUpDown, Sparkles,
  UserCheck, GraduationCap, DollarSign, Building2, Target,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  listShortlist,
  removeFromShortlist,
  updateShortlistNote,
  type ShortlistItem,
} from '@/lib/api';

type ViewMode = 'list' | 'grid';
type SortBy = 'saved_newest' | 'saved_oldest' | 'name_az' | 'match_score';
type RoleFilter = 'all' | 'founder' | 'mentor' | 'investor' | 'cofounder' | 'org';
type StatusLabel = 'hot' | 'follow_up' | 'contacted' | 'not_relevant' | null;

const ROLE_TABS: { value: RoleFilter; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Bookmark },
  { value: 'founder', label: 'Founders', icon: Target },
  { value: 'cofounder', label: 'Co-founders', icon: UserCheck },
  { value: 'mentor', label: 'Mentors', icon: GraduationCap },
  { value: 'investor', label: 'Investors', icon: DollarSign },
  { value: 'org', label: 'Orgs', icon: Building2 },
];

const STATUS_CONFIG: Record<NonNullable<StatusLabel>, { label: string; color: string }> = {
  hot:          { label: '🔥 Hot lead',    color: 'bg-status-danger-bg text-status-danger border-status-danger-border' },
  follow_up:    { label: '⏰ Follow up',   color: 'bg-status-warning-bg text-status-warning border-status-warning-border' },
  contacted:    { label: '✅ Contacted',   color: 'bg-status-success-bg text-status-success border-status-success-border' },
  not_relevant: { label: '⛔ Not relevant', color: 'bg-muted text-muted-foreground' },
};

function ShortlistCardSkeleton({ grid }: { grid?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-4 space-y-3', grid && 'flex flex-col')}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

function NoteEditor({
  initial, onSave, onCancel, isSaving,
}: { initial: string; onSave: (note: string) => void; onCancel: () => void; isSaving?: boolean }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="mt-2 space-y-2">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a private note about this person…"
        rows={2}
        maxLength={500}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onSave(value)} disabled={isSaving}>
          <Check className="icon-sm" /> {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          <X className="icon-sm mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

function ShortlistCard({
  item, onRemove, onUpdateNote, isSelected, onToggleSelect, compareMode,
}: {
  item: ShortlistItem;
  onRemove: (userId: string) => void;
  onUpdateNote: (userId: string, note: string) => Promise<void>;
  isSelected: boolean;
  onToggleSelect: (userId: string) => void;
  compareMode: boolean;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [statusLabel, setStatusLabel] = useState<StatusLabel>(null);
  const profile = item.profile;

  async function handleSaveNote(note: string) {
    setSavingNote(true);
    try { await onUpdateNote(item.userId, note); setEditingNote(false); }
    finally { setSavingNote(false); }
  }

  const matchScore = Math.floor(60 + Math.random() * 35); // Demo: replace with real score

  return (
    <div className={cn(
      'group rounded-xl border bg-card p-4 transition-all hover:shadow-sm',
      isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-border/60 hover:border-border',
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox (compare mode) */}
        {compareMode && (
          <button onClick={() => onToggleSelect(item.userId)} className="mt-1 shrink-0">
            {isSelected
              ? <CheckSquare className="icon-sm text-primary-accessible" />
              : <Square className="icon-sm text-muted-foreground" />}
          </button>
        )}

        {/* Avatar */}
        <Link href={`/profiles/${item.userId}`} className="shrink-0">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName ?? ''} className="h-10 w-10 rounded-full object-cover ring-2 ring-border/50 hover:ring-primary/40 transition-all" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted ring-2 ring-border/50">
              <User className="icon-md text-muted-foreground" />
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profiles/${item.userId}`} className="text-sm font-semibold text-foreground hover:text-primary-accessible transition-colors">
                  {profile?.displayName ?? 'Unknown'}
                </Link>
                {/* Match score badge */}
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-semibold border',
                  matchScore >= 85 ? 'bg-status-success-bg text-status-success border-status-success-border'
                    : matchScore >= 70 ? 'bg-status-info-bg text-status-info border-status-info-border'
                    : 'bg-muted text-muted-foreground border-border',
                )}>
                  <Sparkles className="h-2.5 w-2.5" />
                  {matchScore}% match
                </span>
                {statusLabel && (
                  <span className={cn('rounded-full border px-2 py-0.5 text-2xs font-medium', STATUS_CONFIG[statusLabel].color)}>
                    {STATUS_CONFIG[statusLabel].label}
                  </span>
                )}
              </div>
              {profile?.headline && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{profile.headline}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {profile?.role && (
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                    <Briefcase className="icon-sm" />
                    <span className="capitalize">{profile.role.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                    <MapPin className="icon-sm" />
                    {profile.location}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingNote((v) => !v)} title="Edit note" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Edit2 className="icon-sm" />
              </button>
              <Link href={`/messages?to=${item.userId}`} title="Message" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <MessageCircle className="icon-sm" />
              </Link>
              <Link href={`/profiles/${item.userId}`} title="View profile" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <ExternalLink className="icon-sm" />
              </Link>
              <button onClick={() => onRemove(item.userId)} title="Remove" className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-accessible transition-colors">
                <Trash2 className="icon-sm" />
              </button>
            </div>
          </div>

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.skills.slice(0, 5).map((s) => (
                <Badge key={s} variant="secondary" className="h-5 rounded-full px-2 text-2xs font-normal">{s}</Badge>
              ))}
              {profile.skills.length > 5 && (
                <Badge variant="outline" className="h-5 rounded-full px-2 text-2xs">+{profile.skills.length - 5}</Badge>
              )}
            </div>
          )}

          {/* Status label picker */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs text-muted-foreground font-medium">Label:</span>
            {(Object.entries(STATUS_CONFIG) as [NonNullable<StatusLabel>, typeof STATUS_CONFIG[NonNullable<StatusLabel>]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setStatusLabel(statusLabel === key ? null : key)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-2xs transition-all',
                  statusLabel === key ? cfg.color : 'border-border/60 text-muted-foreground hover:border-border',
                )}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Note */}
          {!editingNote && item.note && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
              <Tag className="mt-0.5 icon-sm shrink-0 text-muted-foreground" />
              <p className="text-xs text-foreground/80 flex-1">{item.note}</p>
            </div>
          )}
          {editingNote && (
            <NoteEditor initial={item.note ?? ''} onSave={handleSaveNote} onCancel={() => setEditingNote(false)} isSaving={savingNote} />
          )}

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xs text-muted-foreground flex items-center gap-1">
              <Clock className="icon-sm" />
              Saved {new Date(item.savedAt).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-2xs px-2 text-muted-foreground hover:text-foreground" asChild>
                <Link href={`/matches/compare?ids=${item.userId}`}>
                  <GitMerge className="icon-sm" /> Compare
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortlistPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('saved_newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shortlist'],
    queryFn: () => listShortlist({ limit: 100 }),
    staleTime: 30_000,
  });

  const rawItems = data?.items ?? [];

  const filtered = useMemo(() => {
    let items = [...rawItems];
    if (roleFilter !== 'all') {
      items = items.filter((i) => {
        const r = i.profile?.role ?? '';
        if (roleFilter === 'founder') return r.includes('founder') || r === 'existing_founder' || r === 'aspiring_founder';
        if (roleFilter === 'cofounder') return r.includes('cofounder') || r === 'technical_talent';
        if (roleFilter === 'mentor') return r === 'mentor' || r === 'advisor' || r === 'coach';
        if (roleFilter === 'investor') return r.includes('investor') || r === 'angel_investor' || r === 'vc_analyst' || r === 'vc_scout';
        if (roleFilter === 'org') return r.includes('admin') || r.includes('org');
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        (i.profile?.displayName ?? '').toLowerCase().includes(q) ||
        (i.profile?.headline ?? '').toLowerCase().includes(q) ||
        (i.profile?.location ?? '').toLowerCase().includes(q) ||
        (i.profile?.skills ?? []).some((s) => s.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'name_az') items.sort((a, b) => (a.profile?.displayName ?? '').localeCompare(b.profile?.displayName ?? ''));
    else if (sortBy === 'saved_oldest') items.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
    else items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return items;
  }, [rawItems, roleFilter, searchQuery, sortBy]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rawItems.length };
    rawItems.forEach((i) => {
      const r = i.profile?.role ?? 'unknown';
      if (r.includes('founder')) counts.founder = (counts.founder ?? 0) + 1;
      if (r.includes('cofounder') || r === 'technical_talent') counts.cofounder = (counts.cofounder ?? 0) + 1;
      if (r === 'mentor' || r === 'advisor' || r === 'coach') counts.mentor = (counts.mentor ?? 0) + 1;
      if (r.includes('investor') || r === 'vc_scout' || r === 'vc_analyst') counts.investor = (counts.investor ?? 0) + 1;
      if (r.includes('admin')) counts.org = (counts.org ?? 0) + 1;
    });
    return counts;
  }, [rawItems]);

  const removeMut = useMutation({
    mutationFn: removeFromShortlist,
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ['shortlist'] });
      qc.setQueryData(['shortlist'], (old: typeof data) => ({
        ...old, items: (old?.items ?? []).filter((i) => i.userId !== userId),
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['shortlist'] }),
  });

  const handleUpdateNote = useCallback(async (userId: string, note: string) => {
    await updateShortlistNote(userId, note);
    qc.setQueryData(['shortlist'], (old: typeof data) => ({
      ...old, items: (old?.items ?? []).map((i) => i.userId === userId ? { ...i, note } : i),
    }));
  }, [qc]);

  const handleRemove = useCallback((userId: string) => removeMut.mutate(userId), [removeMut]);

  const toggleSelect = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else if (next.size < 3) next.add(userId);
      return next;
    });
  }, []);

  return (
    <AppShell title="Saved Profiles" description="Profiles you've bookmarked to revisit, compare, and reach out to">
      <div className="space-y-5 pb-10">

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total saved', value: rawItems.length, icon: Bookmark, color: 'text-primary-accessible', bg: 'bg-primary/10' },
            { label: 'With notes', value: rawItems.filter((i) => i.note).length, icon: Tag, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
            { label: 'Avg match score', value: rawItems.length ? '74%' : '—', icon: Sparkles, color: 'text-status-success', bg: 'bg-status-success-bg' },
            { label: 'Roles covered', value: new Set(rawItems.map((i) => i.profile?.role)).size, icon: TrendingUp, color: 'text-status-info', bg: 'bg-status-info-bg' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm border-border/50">
              <CardContent className="flex items-center gap-3 p-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg, color)}>
                  <Icon className="icon-sm" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-none">{value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="space-y-3">
          {/* Search + sort + view */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
              <Input
                placeholder="Search saved profiles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="h-9 w-44 text-sm">
                <ArrowUpDown className="mr-1.5 icon-sm text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saved_newest">Newest first</SelectItem>
                <SelectItem value="saved_oldest">Oldest first</SelectItem>
                <SelectItem value="name_az">Name A–Z</SelectItem>
                <SelectItem value="match_score">Best match</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-border/60 p-0.5">
              <button onClick={() => setViewMode('list')} className={cn('rounded-md p-1.5 transition-colors', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <List className="icon-sm" />
              </button>
              <button onClick={() => setViewMode('grid')} className={cn('rounded-md p-1.5 transition-colors', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <Grid3X3 className="icon-sm" />
              </button>
            </div>
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => { setCompareMode((v) => !v); setSelectedIds(new Set()); }}
            >
              <GitMerge className="icon-sm" />
              {compareMode ? 'Cancel compare' : 'Compare'}
            </Button>
          </div>

          {/* Role tabs */}
          <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
              {ROLE_TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="h-8 gap-1.5 rounded-lg border border-border/60 bg-card px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary">
                  <Icon className="icon-sm" />
                  {label}
                  {roleCounts[value] !== undefined && (
                    <span className="ml-0.5 rounded-full bg-current/10 px-1.5 py-0.5 text-2xs font-semibold">
                      {roleCounts[value]}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Compare action bar */}
        {compareMode && selectedIds.size >= 2 && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {selectedIds.size} profiles selected (max 3)
            </p>
            <Button size="sm" className="gap-1.5" asChild>
              <Link href={`/matches/compare?ids=${Array.from(selectedIds).join(',')}`}>
                <GitMerge className="icon-sm" /> Compare now
              </Link>
            </Button>
          </div>
        )}

        {/* Content */}
        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card py-16 text-center">
            <AlertTriangle className="icon-xl text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Failed to load shortlist.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : isLoading ? (
          <div className={cn('gap-3', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2' : 'space-y-3')}>
            {Array.from({ length: 4 }).map((_, i) => <ShortlistCardSkeleton key={i} grid={viewMode === 'grid'} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BookmarkX className="h-7 w-7 text-primary-accessible" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {rawItems.length === 0 ? 'No saved profiles yet' : 'No profiles match your filters'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {rawItems.length === 0
                  ? 'Save profiles from Matches or Members to revisit them here.'
                  : 'Try adjusting your filters or search query.'}
              </p>
            </div>
            {rawItems.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" className="gap-1.5" asChild>
                  <Link href="/matches">Browse matches</Link>
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <Link href={`/ai?q=${encodeURIComponent('I have no saved profiles. Who from my matches should I shortlist first?')}`}>
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    Ask AI
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {rawItems.length} profiles
            </p>
            <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3')}>
              {filtered.map((item) => (
                <ShortlistCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  onUpdateNote={handleUpdateNote}
                  isSelected={selectedIds.has(item.userId)}
                  onToggleSelect={toggleSelect}
                  compareMode={compareMode}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
