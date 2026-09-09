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
  History, Camera, Clock, Layers, ChevronRight,
  Loader2, RefreshCw, Eye, Download, CheckCircle2, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { apiRequest } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BoardSnapshot {
  id: string;
  boardId: string;
  label: string | null;
  triggerType: string;
  nodeCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  } | null;
}

interface BoardSnapshotFull extends BoardSnapshot {
  nodeData: unknown[];
  connectors: unknown[];
  canvasState: unknown;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function listSnapshots(boardId: string): Promise<BoardSnapshot[]> {
  const result = await apiRequest<{ snapshots: BoardSnapshot[] }>(
    `/api/research/boards/${boardId}/snapshots`,
  );
  return result.snapshots;
}

async function createSnapshot(boardId: string, label?: string): Promise<BoardSnapshot> {
  const result = await apiRequest<{ snapshot: BoardSnapshot }>(
    `/api/research/boards/${boardId}/snapshots`,
    {
      method: 'POST',
      body: JSON.stringify({ label, triggerType: 'manual' }),
    },
  );
  return result.snapshot;
}

async function getSnapshot(boardId: string, snapshotId: string): Promise<BoardSnapshotFull> {
  const result = await apiRequest<{ snapshot: BoardSnapshotFull }>(
    `/api/research/boards/${boardId}/snapshots/${snapshotId}`,
  );
  return result.snapshot;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
    case 'checkpoint': return { label: 'Checkpoint', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' };
    case 'autosave':   return { label: 'Autosave',   icon: Zap,         color: 'text-blue-500 bg-blue-50 border-blue-200' };
    default:           return { label: 'Manual',     icon: Camera,      color: 'text-purple-600 bg-purple-50 border-purple-200' };
  }
}

// ── Snapshot Preview Dialog ────────────────────────────────────────────────────

interface SnapshotPreviewProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  snapshot: BoardSnapshot;
}

function SnapshotPreviewDialog({ open, onClose, boardId, snapshot }: SnapshotPreviewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['snapshot', boardId, snapshot.id],
    queryFn: () => getSnapshot(boardId, snapshot.id),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="icon-sm text-primary-emphasis" aria-hidden="true" />
            {snapshot.label ?? `Snapshot — ${new Date(snapshot.createdAt).toLocaleString()}`}
          </DialogTitle>
          <DialogDescription>
            {snapshot.nodeCount} nodes · saved {timeAgo(snapshot.createdAt)}
            {snapshot.createdBy && ` by ${snapshot.createdBy.displayName}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : data ? (
          <div className="py-2 space-y-3">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {data.nodeCount} nodes
              </span>
              {Array.isArray(data.connectors) && (
                <span className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  {(data.connectors as unknown[]).length} connectors
                </span>
              )}
            </div>

            {Array.isArray(data.nodeData) && data.nodeData.length > 0 && (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Nodes in this snapshot
                </p>
                {(data.nodeData as Array<{ title?: string; type?: string }>).slice(0, 20).map((node, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-xs capitalize">{node.type ?? 'node'}</Badge>
                    <span className="text-muted-foreground truncate">{node.title ?? '(untitled)'}</span>
                  </div>
                ))}
                {data.nodeData.length > 20 && (
                  <p className="text-xs text-muted-foreground">+{data.nodeData.length - 20} more…</p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">
              This is a read-only preview of the canvas state at snapshot time.
              To restore, re-create your canvas from the node data above.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main BoardHistoryDrawer ────────────────────────────────────────────────────

interface BoardHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  boardTitle?: string;
}

export function BoardHistoryDrawer({
  open,
  onClose,
  boardId,
  boardTitle,
}: BoardHistoryDrawerProps) {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [previewSnapshot, setPreviewSnapshot] = useState<BoardSnapshot | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['snapshots', boardId],
    queryFn: () => listSnapshots(boardId),
    enabled: open && !!boardId,
    refetchInterval: 60_000,
  });

  const snapshots: BoardSnapshot[] = data ?? [];

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      await createSnapshot(boardId, snapshotLabel.trim() || undefined);
      success('Snapshot saved');
      setSnapshotLabel('');
      queryClient.invalidateQueries({ queryKey: ['snapshots', boardId] });
    } catch {
      toastError('Failed to save snapshot');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  // Group snapshots by date
  const grouped: Record<string, BoardSnapshot[]> = {};
  for (const snap of snapshots) {
    const dateKey = new Date(snap.createdAt).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(snap);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="icon-sm text-primary-emphasis" aria-hidden="true" />
              Canvas History
            </SheetTitle>
            <SheetDescription>
              Snapshots of &ldquo;{boardTitle ?? 'this board'}&rdquo; at different points in time.
            </SheetDescription>
          </SheetHeader>

          {/* Create snapshot */}
          <div className="mt-4 space-y-2 p-3 bg-muted/50 rounded-lg border border-border/60">
            <Label className="text-xs font-medium">Save current state</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Label (optional)…"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSnapshot()}
                className="text-sm h-8"
              />
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={handleCreateSnapshot}
                disabled={creatingSnapshot}
              >
                {creatingSnapshot
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  : <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                }
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Captures all nodes and connectors at this moment.
            </p>
          </div>

          {/* Refresh */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
          </div>

          {/* Snapshot list */}
          <div className="flex-1 overflow-y-auto space-y-4 mt-2">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="icon-xl mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-sm">No snapshots yet</p>
                <p className="text-xs mt-1">Save your first snapshot to start tracking history.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, snaps]) => (
                <div key={date} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                    {date}
                  </p>
                  {snaps.map(snap => {
                    const meta = triggerMeta(snap.triggerType);
                    const Icon = meta.icon;
                    return (
                      <div
                        key={snap.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setPreviewSnapshot(snap)}
                      >
                        <div className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center shrink-0 border',
                          meta.color,
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {snap.label ?? `Snapshot`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {snap.nodeCount} node{snap.nodeCount !== 1 ? 's' : ''}
                            </span>
                            {snap.createdBy && (
                              <>
                                <span className="text-xs text-muted-foreground">·</span>
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-3.5 w-3.5">
                                    <AvatarImage src={snap.createdBy.avatarUrl} />
                                    <AvatarFallback className="text-2xs">
                                      {snap.createdBy.displayName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    {snap.createdBy.displayName}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0 opacity-60 hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setPreviewSnapshot(snap); }}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {previewSnapshot && (
        <SnapshotPreviewDialog
          open={!!previewSnapshot}
          onClose={() => setPreviewSnapshot(null)}
          boardId={boardId}
          snapshot={previewSnapshot}
        />
      )}
    </>
  );
}
