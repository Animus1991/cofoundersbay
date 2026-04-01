'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  History, Camera, Clock, Layers, ChevronRight, GitBranch,
  Loader2, RefreshCw, Eye, RotateCcw, CheckCircle2, Zap,
  Plus, Archive, Trash2, GitCommit, ArrowRight, AlertTriangle,
  Minus, Edit2, Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  listCanvasVersions,
  getCanvasVersion,
  createCanvasVersion,
  restoreCanvasVersion,
  listCanvasBranches,
  createCanvasBranch,
  archiveCanvasBranch,
  deleteCanvasBranch,
  restoreBoardSnapshot,
  type CanvasVersion,
  type CanvasBranch,
  type CanvasDiff,
} from '@/lib/api';
import { apiRequest } from '@/lib/api';

// ── Legacy snapshot types (backward compat) ───────────────────────────────────

interface BoardSnapshot {
  id: string;
  boardId: string;
  label: string | null;
  triggerType: string;
  nodeCount: number;
  createdAt: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string } | null;
}

interface BoardSnapshotFull extends BoardSnapshot {
  nodeData: unknown[];
  connectors: unknown[];
  canvasState: unknown;
}

async function listSnapshots(boardId: string): Promise<BoardSnapshot[]> {
  const result = await apiRequest<{ snapshots: BoardSnapshot[] }>(
    `/api/research/boards/${boardId}/snapshots`,
  );
  return result.snapshots;
}

async function createSnapshot(boardId: string, label?: string): Promise<BoardSnapshot> {
  const result = await apiRequest<{ snapshot: BoardSnapshot }>(
    `/api/research/boards/${boardId}/snapshots`,
    { method: 'POST', body: JSON.stringify({ label, triggerType: 'manual' }) },
  );
  return result.snapshot;
}

async function getSnapshot(boardId: string, snapshotId: string): Promise<BoardSnapshotFull> {
  const result = await apiRequest<{ snapshot: BoardSnapshotFull }>(
    `/api/research/boards/${boardId}/snapshots/${snapshotId}`,
  );
  return result.snapshot;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function triggerMeta(type: string) {
  switch (type) {
    case 'checkpoint':    return { label: 'Checkpoint', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' };
    case 'autosave':      return { label: 'Autosave',   icon: Zap,          color: 'text-blue-500 bg-blue-50 border-blue-200' };
    case 'restore':       return { label: 'Restore',    icon: RotateCcw,    color: 'text-orange-600 bg-orange-50 border-orange-200' };
    case 'branch_create': return { label: 'Fork',       icon: GitBranch,    color: 'text-violet-600 bg-violet-50 border-violet-200' };
    case 'post_merge':    return { label: 'Merge',      icon: GitBranch,    color: 'text-teal-600 bg-teal-50 border-teal-200' };
    case 'pre_merge':     return { label: 'Pre-merge',  icon: GitBranch,    color: 'text-amber-600 bg-amber-50 border-amber-200' };
    default:              return { label: 'Manual',     icon: Camera,       color: 'text-purple-600 bg-purple-50 border-purple-200' };
  }
}

function branchStatusColor(status: string) {
  switch (status) {
    case 'active':   return 'bg-emerald-500/15 text-emerald-700 border-emerald-200';
    case 'merged':   return 'bg-violet-500/15 text-violet-700 border-violet-200';
    case 'archived': return 'bg-muted text-muted-foreground border-border';
    default:         return 'bg-muted text-muted-foreground border-border';
  }
}

// ── Diff Chip ─────────────────────────────────────────────────────────────────

function DiffChips({ diff }: { diff: CanvasDiff }) {
  if (diff.isEmpty) return <span className="text-xs text-muted-foreground">No changes</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {diff.added.length > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Plus className="h-2.5 w-2.5" />{diff.added.length}
        </span>
      )}
      {diff.removed.length > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
          <Minus className="h-2.5 w-2.5" />{diff.removed.length}
        </span>
      )}
      {diff.modified.length > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Edit2 className="h-2.5 w-2.5" />{diff.modified.length}
        </span>
      )}
      {diff.moved.length > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Move className="h-2.5 w-2.5" />{diff.moved.length}
        </span>
      )}
    </div>
  );
}

// ── Diff Detail Dialog ────────────────────────────────────────────────────────

function DiffDetailDialog({
  open, onClose, diff, labelA, labelB,
}: {
  open: boolean;
  onClose: () => void;
  diff: CanvasDiff;
  labelA: string;
  labelB: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <GitCommit className="h-4 w-4 text-primary" />
            Diff: {labelA} → {labelB}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Changes between two canvas versions
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-3 text-sm">
          {diff.isEmpty && (
            <p className="text-center text-muted-foreground py-4 text-sm">No differences found.</p>
          )}

          {diff.added.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                <Plus className="h-3 w-3" /> Added ({diff.added.length})
              </p>
              {diff.added.map((n) => (
                <div key={n.id} className="flex items-center gap-2 p-1.5 rounded bg-emerald-50 border border-emerald-100">
                  <Badge variant="secondary" className="text-[10px] capitalize">{n.type}</Badge>
                  <span className="text-xs truncate">{n.title ?? '(untitled)'}</span>
                </div>
              ))}
            </div>
          )}

          {diff.removed.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1">
                <Minus className="h-3 w-3" /> Removed ({diff.removed.length})
              </p>
              {diff.removed.map((n) => (
                <div key={n.id} className="flex items-center gap-2 p-1.5 rounded bg-red-50 border border-red-100">
                  <Badge variant="secondary" className="text-[10px] capitalize">{n.type}</Badge>
                  <span className="text-xs truncate line-through text-muted-foreground">{n.title ?? '(untitled)'}</span>
                </div>
              ))}
            </div>
          )}

          {diff.modified.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                <Edit2 className="h-3 w-3" /> Modified ({diff.modified.length})
              </p>
              {diff.modified.map((n) => (
                <div key={n.id} className="p-1.5 rounded bg-amber-50 border border-amber-100 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize">{n.type}</Badge>
                    <span className="text-xs font-medium truncate">{n.title ?? '(untitled)'}</span>
                  </div>
                  {n.changes.map((c, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground pl-2">
                      <span className="font-medium capitalize">{c.field}:</span>{' '}
                      <span className="line-through">{String(c.before ?? '–').slice(0, 30)}</span>
                      {' → '}
                      <span>{String(c.after ?? '–').slice(0, 30)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {diff.moved.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                <Move className="h-3 w-3" /> Moved ({diff.moved.length})
              </p>
              {diff.moved.map((n) => (
                <div key={n.id} className="p-1.5 rounded bg-blue-50 border border-blue-100">
                  <span className="text-xs truncate">{n.title ?? '(untitled)'}</span>
                  <div className="text-[10px] text-muted-foreground">
                    ({Math.round(n.before.posX)}, {Math.round(n.before.posY)}) → ({Math.round(n.after.posX)}, {Math.round(n.after.posY)})
                  </div>
                </div>
              ))}
            </div>
          )}

          {(diff.edgeDiff.added.length > 0 || diff.edgeDiff.removed.length > 0) && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                <ArrowRight className="h-3 w-3" /> Edges
              </p>
              {diff.edgeDiff.added.map((e) => (
                <div key={e.id} className="text-[10px] p-1.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">
                  + edge {e.fromNodeId.slice(0, 6)}→{e.toNodeId.slice(0, 6)}
                </div>
              ))}
              {diff.edgeDiff.removed.map((e) => (
                <div key={e.id} className="text-[10px] p-1.5 rounded bg-red-50 border border-red-100 text-red-700">
                  − edge {e.fromNodeId.slice(0, 6)}→{e.toNodeId.slice(0, 6)}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Restore Confirm Dialog ────────────────────────────────────────────────────

function RestoreConfirmDialog({
  open, onClose, onConfirm, label, isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Restore canvas?
          </DialogTitle>
          <DialogDescription className="text-sm">
            This will replace your current canvas with &ldquo;{label}&rdquo;.
            Your current state will be auto-saved as a checkpoint first.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
            Restore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Snapshots Tab ─────────────────────────────────────────────────────────────

function SnapshotsTab({ boardId }: { boardId: string }) {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BoardSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [previewData, setPreviewData] = useState<BoardSnapshotFull | null>(null);
  const [previewDiff, setPreviewDiff] = useState<CanvasDiff | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['snapshots', boardId],
    queryFn: () => listSnapshots(boardId),
    refetchInterval: 60_000,
  });

  const snapshots: BoardSnapshot[] = data ?? [];

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createSnapshot(boardId, snapshotLabel.trim() || undefined);
      success('Snapshot saved');
      setSnapshotLabel('');
      queryClient.invalidateQueries({ queryKey: ['snapshots', boardId] });
    } catch {
      toastError('Failed to save snapshot');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await restoreBoardSnapshot(boardId, restoreTarget.id);
      success('Canvas restored to snapshot');
      queryClient.invalidateQueries({ queryKey: ['snapshots', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setRestoreTarget(null);
    } catch {
      toastError('Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handlePreview = async (snap: BoardSnapshot) => {
    const full = await getSnapshot(boardId, snap.id);
    setPreviewData(full);
    setPreviewId(snap.id);
  };

  const grouped: Record<string, BoardSnapshot[]> = {};
  for (const snap of snapshots) {
    const dateKey = new Date(snap.createdAt).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(snap);
  }

  return (
    <div className="space-y-3 flex flex-col h-full">
      {/* Save */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border/60 space-y-2">
        <Label className="text-xs font-medium">Save current state</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Label (optional)…"
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="text-sm h-8"
          />
          <Button size="sm" className="h-8 shrink-0" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Captures all nodes and connectors.</p>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} />Refresh
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No snapshots yet</p>
            <p className="text-xs mt-1">Save your first snapshot to track history.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, snaps]) => (
            <div key={date} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">{date}</p>
              {snaps.map((snap) => {
                const meta = triggerMeta(snap.triggerType);
                const Icon = meta.icon;
                return (
                  <div key={snap.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors">
                    <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 border', meta.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{snap.label ?? 'Snapshot'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{snap.nodeCount} node{snap.nodeCount !== 1 ? 's' : ''}</span>
                        {snap.createdBy && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <div className="flex items-center gap-1">
                              <Avatar className="h-3.5 w-3.5">
                                <AvatarImage src={snap.createdBy.avatarUrl} />
                                <AvatarFallback className="text-[8px]">{snap.createdBy.displayName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{snap.createdBy.displayName}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" title="Preview" onClick={() => handlePreview(snap)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100 text-amber-600 hover:text-amber-700" title="Restore" onClick={() => setRestoreTarget(snap)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Preview modal */}
      {previewId && previewData && (
        <Dialog open={!!previewId} onOpenChange={() => { setPreviewId(null); setPreviewData(null); setPreviewDiff(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-primary" />
                {snapshots.find((s) => s.id === previewId)?.label ?? 'Snapshot'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />{previewData.nodeCount} nodes</span>
                {Array.isArray(previewData.connectors) && (
                  <span className="flex items-center gap-1.5"><ChevronRight className="h-3.5 w-3.5" />{(previewData.connectors as unknown[]).length} connectors</span>
                )}
              </div>
              {Array.isArray(previewData.nodeData) && previewData.nodeData.length > 0 && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nodes</p>
                  {(previewData.nodeData as Array<{ title?: string; type?: string }>).slice(0, 20).map((node, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className="text-xs capitalize">{node.type ?? 'node'}</Badge>
                      <span className="text-muted-foreground truncate">{node.title ?? '(untitled)'}</span>
                    </div>
                  ))}
                  {previewData.nodeData.length > 20 && <p className="text-xs text-muted-foreground">+{previewData.nodeData.length - 20} more…</p>}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPreviewId(null); setPreviewData(null); }}>Close</Button>
              <Button variant="default" size="sm" onClick={() => { setRestoreTarget(snapshots.find((s) => s.id === previewId) ?? null); setPreviewId(null); setPreviewData(null); }}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore this
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <RestoreConfirmDialog
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        label={restoreTarget?.label ?? 'Snapshot'}
        isPending={restoring}
      />
    </div>
  );
}

// ── Versions Tab ──────────────────────────────────────────────────────────────

function VersionsTab({ boardId }: { boardId: string }) {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [diffVersion, setDiffVersion] = useState<CanvasVersion | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<CanvasVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['canvas-versions', boardId],
    queryFn: () => listCanvasVersions(boardId),
    refetchInterval: 90_000,
  });

  const versions: CanvasVersion[] = data ?? [];

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createCanvasVersion(boardId, { label: label.trim() || undefined, triggerType: 'manual' });
      success('Version committed');
      setLabel('');
      queryClient.invalidateQueries({ queryKey: ['canvas-versions', boardId] });
    } catch {
      toastError('Failed to commit version');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await restoreCanvasVersion(boardId, restoreTarget.id);
      success('Canvas restored to this version');
      queryClient.invalidateQueries({ queryKey: ['canvas-versions', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setRestoreTarget(null);
    } catch {
      toastError('Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-3 flex flex-col h-full">
      {/* Commit */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border/60 space-y-2">
        <Label className="text-xs font-medium">Commit current state</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Commit message (optional)…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="text-sm h-8"
          />
          <Button size="sm" className="h-8 shrink-0" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCommit className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Records a diff-tracked version with change summary.</p>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} />Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitCommit className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No versions yet</p>
            <p className="text-xs mt-1">Commit your first version to track diffs.</p>
          </div>
        ) : versions.map((v) => {
          const meta = triggerMeta(v.triggerType);
          const Icon = meta.icon;
          return (
            <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors">
              <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 border', meta.color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{v.label ?? 'Version'}</p>
                  {v.branchName && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                      <GitBranch className="h-2.5 w-2.5 mr-0.5" />{v.branchName}
                    </Badge>
                  )}
                </div>
                {v.changeSummary && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{v.changeSummary}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{timeAgo(v.createdAt)}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{v.nodeCount} nodes</span>
                  {v.createdBy && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{v.createdBy.displayName}</span>
                    </>
                  )}
                </div>
                {v.diffData && !v.diffData.isEmpty && <DiffChips diff={v.diffData} />}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {v.diffData && !v.diffData.isEmpty && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" title="View diff" onClick={() => setDiffVersion(v)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100 text-amber-600 hover:text-amber-700" title="Restore" onClick={() => setRestoreTarget(v)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {diffVersion?.diffData && (
        <DiffDetailDialog
          open={!!diffVersion}
          onClose={() => setDiffVersion(null)}
          diff={diffVersion.diffData}
          labelA={diffVersion.parentVersionId ? 'Previous' : 'Empty'}
          labelB={diffVersion.label ?? 'This version'}
        />
      )}

      <RestoreConfirmDialog
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        label={restoreTarget?.label ?? 'Version'}
        isPending={restoring}
      />
    </div>
  );
}

// ── Branches Tab ──────────────────────────────────────────────────────────────

function BranchesTab({ boardId }: { boardId: string }) {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['canvas-branches', boardId],
    queryFn: () => listCanvasBranches(boardId),
    refetchInterval: 60_000,
  });

  const branches: CanvasBranch[] = data ?? [];

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createCanvasBranch(boardId, { name: name.trim(), description: desc.trim() || undefined });
      success(`Branch "${name.trim()}" created`);
      setName(''); setDesc(''); setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['canvas-branches', boardId] });
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const archiveMutation = useMutation({
    mutationFn: ({ branchId }: { branchId: string }) => archiveCanvasBranch(boardId, branchId),
    onSuccess: () => {
      success('Branch archived');
      queryClient.invalidateQueries({ queryKey: ['canvas-branches', boardId] });
    },
    onError: () => toastError('Failed to archive branch'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ branchId }: { branchId: string }) => deleteCanvasBranch(boardId, branchId),
    onSuccess: () => {
      success('Branch deleted');
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['canvas-branches', boardId] });
    },
    onError: () => toastError('Failed to delete branch'),
  });

  return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Manage isolated canvas branches</p>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-3 w-3" />New
        </Button>
      </div>

      {showCreate && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border/60 space-y-2">
          <Label className="text-xs font-medium">New branch</Label>
          <Input
            placeholder="branch-name (lowercase, hyphens)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm h-8"
          />
          <Input
            placeholder="Description (optional)…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="text-sm h-8"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowCreate(false); setName(''); setDesc(''); }}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <GitBranch className="h-3 w-3 mr-1" />}
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} />Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No branches yet</p>
            <p className="text-xs mt-1">Create a branch to experiment safely.</p>
          </div>
        ) : branches.map((b) => (
          <div key={b.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors">
            <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 border bg-violet-50 border-violet-200 text-violet-600">
              <GitBranch className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{b.name}</p>
                {b.isDefault && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">default</Badge>}
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', branchStatusColor(b.status))}>
                  {b.status}
                </Badge>
              </div>
              {b.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.description}</p>}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{timeAgo(b.updatedAt)}</span>
                {b.nodeCount != null && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{b.nodeCount} nodes</span>
                  </>
                )}
              </div>
            </div>
            {!b.isDefault && (
              <div className="flex items-center gap-1 shrink-0">
                {b.status === 'active' && (
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                    title="Archive"
                    disabled={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate({ branchId: b.id })}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 opacity-60 hover:opacity-100 text-destructive hover:text-destructive"
                  title="Delete"
                  onClick={() => setDeletingId(b.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" />Delete branch?
            </DialogTitle>
            <DialogDescription className="text-sm">
              All versions on this branch will be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button
              variant="destructive" size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate({ branchId: deletingId })}
            >
              {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

interface CanvasVersionPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  boardTitle?: string;
}

export function CanvasVersionPanel({ open, onClose, boardId, boardTitle }: CanvasVersionPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Canvas History
          </SheetTitle>
          <SheetDescription className="text-xs">
            Snapshots, versions, and branches for &ldquo;{boardTitle ?? 'this board'}&rdquo;
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="snapshots" className="flex flex-col flex-1 overflow-hidden px-4 pt-3">
          <TabsList className="grid grid-cols-3 h-8 mb-3 shrink-0">
            <TabsTrigger value="snapshots" className="text-xs flex items-center gap-1">
              <Camera className="h-3 w-3" />Snapshots
            </TabsTrigger>
            <TabsTrigger value="versions" className="text-xs flex items-center gap-1">
              <GitCommit className="h-3 w-3" />Versions
            </TabsTrigger>
            <TabsTrigger value="branches" className="text-xs flex items-center gap-1">
              <GitBranch className="h-3 w-3" />Branches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshots" className="flex-1 overflow-y-auto mt-0 pb-4">
            {open && <SnapshotsTab boardId={boardId} />}
          </TabsContent>

          <TabsContent value="versions" className="flex-1 overflow-y-auto mt-0 pb-4">
            {open && <VersionsTab boardId={boardId} />}
          </TabsContent>

          <TabsContent value="branches" className="flex-1 overflow-y-auto mt-0 pb-4">
            {open && <BranchesTab boardId={boardId} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
