'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark, BookmarkX, MapPin, Briefcase, Trash2,
  MessageCircle, ExternalLink, RefreshCw, Edit2, Check, X,
  User, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  listShortlist,
  removeFromShortlist,
  updateShortlistNote,
  type ShortlistItem,
} from '@/lib/api';

function ShortlistCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

function NoteEditor({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: string;
  onSave: (note: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="mt-2 space-y-2">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a private note about this person…"
        rows={2}
        maxLength={300}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onSave(value)} disabled={isSaving}>
          <Check className="h-3 w-3" /> {isSaving ? 'Saving…' : 'Save note'}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

function ShortlistCard({
  item,
  onRemove,
  onUpdateNote,
}: {
  item: ShortlistItem;
  onRemove: (userId: string) => void;
  onUpdateNote: (userId: string, note: string) => Promise<void>;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const profile = item.profile;

  async function handleSaveNote(note: string) {
    setSavingNote(true);
    try {
      await onUpdateNote(item.userId, note);
      setEditingNote(false);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-4 transition-all hover:shadow-sm hover:border-border">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/profiles/${item.userId}`} className="shrink-0">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName ?? ''}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-border/50 transition-all hover:ring-primary/40"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-2 ring-border/50">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/profiles/${item.userId}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {profile?.displayName ?? 'Unknown'}
              </Link>
              {profile?.headline && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{profile.headline}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {profile?.role && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span className="capitalize">{profile.role.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title="Edit note"
                onClick={() => setEditingNote((v) => !v)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <Link
                href={`/messages?user=${item.userId}`}
                title="Send message"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/profiles/${item.userId}`}
                title="View profile"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <button
                title="Remove from shortlist"
                onClick={() => onRemove(item.userId)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.skills.slice(0, 5).map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="h-5 rounded-full px-2 text-[10px] font-normal"
                >
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {/* Note */}
          {!editingNote && item.note && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Note</span>
              <p className="text-xs text-foreground/80 flex-1">{item.note}</p>
            </div>
          )}

          {editingNote && (
            <NoteEditor
              initial={item.note ?? ''}
              onSave={handleSaveNote}
              onCancel={() => setEditingNote(false)}
              isSaving={savingNote}
            />
          )}

          {/* Saved date */}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Saved {new Date(item.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ShortlistPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shortlist'],
    queryFn: () => listShortlist({ limit: 100 }),
    staleTime: 30_000,
  });

  const items = data?.items ?? [];

  const removeMut = useMutation({
    mutationFn: removeFromShortlist,
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ['shortlist'] });
      qc.setQueryData(['shortlist'], (old: typeof data) => ({
        ...old,
        items: (old?.items ?? []).filter((i) => i.userId !== userId),
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['shortlist'] }),
  });

  const handleUpdateNote = useCallback(
    async (userId: string, note: string) => {
      await updateShortlistNote(userId, note);
      qc.setQueryData(['shortlist'], (old: typeof data) => ({
        ...old,
        items: (old?.items ?? []).map((i) =>
          i.userId === userId ? { ...i, note } : i,
        ),
      }));
    },
    [qc],
  );

  const handleRemove = useCallback(
    (userId: string) => removeMut.mutate(userId),
    [removeMut],
  );

  return (
    <AppShell
      title="Shortlist"
      description="Profiles you've saved to revisit, compare, or reach out to"
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {isLoading ? '…' : `${items.length} saved profile${items.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Content */}
        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Failed to load shortlist.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <ShortlistCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BookmarkX className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">No saved profiles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Save profiles from your matches or search results to revisit them here.
              </p>
            </div>
            <Link href="/matches">
              <Button size="sm" variant="outline" className="gap-1.5">
                Browse matches
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ShortlistCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onUpdateNote={handleUpdateNote}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
