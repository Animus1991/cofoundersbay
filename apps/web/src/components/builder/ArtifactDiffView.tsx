'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Minus, Edit3, CheckCircle2, MoveRight,
  GitBranch, Layers, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  richTextDiff,
  structuredDiff,
  canvasDiff,
  detectDiffKind,
  type DiffStatus,
  type RichTextDiffResult,
  type StructuredDiffResult,
  type CanvasDiffResult,
  type StructuredFieldDiff,
} from '@/lib/diff-engine';

// ── Shared helpers ─────────────────────────────────────────────────────────────

function statusIcon(status: DiffStatus) {
  switch (status) {
    case 'added':   return <Plus className="h-3 w-3 text-green-600" />;
    case 'removed': return <Minus className="h-3 w-3 text-red-500" />;
    case 'changed': return <Edit3 className="h-3 w-3 text-yellow-600" />;
    default:        return <CheckCircle2 className="h-3 w-3 text-muted-foreground/40" />;
  }
}

function statusLineClass(status: DiffStatus) {
  switch (status) {
    case 'added':   return 'bg-green-50 border-l-2 border-green-400 dark:bg-green-950/20';
    case 'removed': return 'bg-red-50 border-l-2 border-red-400 dark:bg-red-950/20 line-through opacity-70';
    case 'changed': return 'bg-yellow-50 border-l-2 border-yellow-400 dark:bg-yellow-950/20';
    default:        return '';
  }
}

function DiffBadge({ status, count }: { status: DiffStatus; count: number }) {
  if (count === 0) return null;
  const cls: Record<DiffStatus, string> = {
    added:     'bg-green-100 text-green-700 border-green-200',
    removed:   'bg-red-100 text-red-700 border-red-200',
    changed:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    unchanged: 'bg-muted text-muted-foreground',
  };
  const labels: Record<DiffStatus, string> = {
    added: `+${count} added`,
    removed: `-${count} removed`,
    changed: `~${count} changed`,
    unchanged: `${count} unchanged`,
  };
  return (
    <Badge variant="outline" className={cn('text-xs', cls[status])}>
      {labels[status]}
    </Badge>
  );
}

// ── Rich Text Diff View ────────────────────────────────────────────────────────

function RichTextDiffView({ diff }: { diff: RichTextDiffResult }) {
  const { blocks, summary } = diff;
  // Only show lines that changed or are adjacent to changes (±2 context lines)
  const relevantIndices = new Set<number>();
  blocks.forEach((b, i) => {
    if (b.status !== 'unchanged') {
      for (let d = -2; d <= 2; d++) {
        if (i + d >= 0 && i + d < blocks.length) relevantIndices.add(i + d);
      }
    }
  });

  const visible = blocks.filter((_, i) => relevantIndices.has(i));

  if (summary.totalChanges === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        No differences found — content is identical.
      </div>
    );
  }

  return (
    <div className="font-mono text-xs space-y-0.5">
      {blocks.map((block, i) => {
        if (!relevantIndices.has(i)) {
          // Show ellipsis separator between gaps
          const prevVisible = i > 0 && relevantIndices.has(i - 1);
          const nextVisible = i < blocks.length - 1 && relevantIndices.has(i + 1);
          if (!prevVisible && !nextVisible) return null;
          if (prevVisible && !nextVisible) {
            return <div key={i} className="px-3 py-0.5 text-muted-foreground/50 select-none">…</div>;
          }
          return null;
        }

        return (
          <div key={i} className={cn('px-3 py-0.5 rounded-sm', statusLineClass(block.status))}>
            {block.status === 'changed' ? (
              <div className="space-y-0.5">
                <div className="line-through opacity-70 text-red-700 dark:text-red-400">{block.before}</div>
                <div className="text-green-700 dark:text-green-400">{block.after}</div>
              </div>
            ) : (
              <span>{block.before}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Structured Diff Field Row ──────────────────────────────────────────────────

function StructuredFieldRow({ field }: { field: StructuredFieldDiff }) {
  if (field.status === 'unchanged') return null;

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'string') return val.slice(0, 200);
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    return JSON.stringify(val).slice(0, 200);
  };

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-md text-sm',
        field.status === 'added'   && 'bg-green-50 dark:bg-green-950/20',
        field.status === 'removed' && 'bg-red-50 dark:bg-red-950/20',
        field.status === 'changed' && 'bg-yellow-50 dark:bg-yellow-950/20',
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {statusIcon(field.status)}
        <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
          {field.label}
        </span>
        {field.numericDelta !== undefined && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              field.numericDelta > 0 ? 'text-green-600' : 'text-red-600',
            )}
          >
            {field.numericDelta > 0 ? '+' : ''}{field.numericDelta}%
          </Badge>
        )}
      </div>

      {field.status === 'added' && (
        <div className="text-green-700 dark:text-green-400">{renderValue(field.after)}</div>
      )}
      {field.status === 'removed' && (
        <div className="text-red-600 dark:text-red-400 line-through">{renderValue(field.before)}</div>
      )}
      {field.status === 'changed' && (
        <div className="flex items-start gap-2">
          <div className="flex-1 text-red-600 dark:text-red-400 line-through opacity-80">
            {renderValue(field.before)}
          </div>
          <MoveRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 text-green-700 dark:text-green-400">
            {renderValue(field.after)}
          </div>
        </div>
      )}

      {/* Sub-diffs */}
      {field.subDiffs && field.subDiffs.length > 0 && (
        <div className="mt-2 ml-4 space-y-1 border-l-2 border-border/40 pl-2">
          {field.subDiffs.map(sub => (
            <StructuredFieldRow key={sub.field} field={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Structured Diff View ───────────────────────────────────────────────────────

function StructuredDiffView({ diff }: { diff: StructuredDiffResult }) {
  const { fields, summary } = diff;
  const changedFields = fields.filter(f => f.status !== 'unchanged');

  if (summary.totalChanges === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        No field differences found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {changedFields.map(field => (
        <StructuredFieldRow key={field.field} field={field} />
      ))}
    </div>
  );
}

// ── Canvas Diff View ───────────────────────────────────────────────────────────

function CanvasDiffView({ diff }: { diff: CanvasDiffResult }) {
  const { nodes, connectorsAdded, connectorsRemoved, summary } = diff;
  const changedNodes = nodes.filter(n => n.status !== 'unchanged');

  if (summary.totalChanges === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        Canvas is identical — no node or connector changes.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(connectorsAdded > 0 || connectorsRemoved > 0) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-xs text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5" />
          Connectors: {connectorsAdded > 0 && <span className="text-green-600">+{connectorsAdded}</span>}
          {connectorsAdded > 0 && connectorsRemoved > 0 && ' / '}
          {connectorsRemoved > 0 && <span className="text-red-500">-{connectorsRemoved}</span>}
        </div>
      )}
      {changedNodes.map(node => (
        <div
          key={node.nodeId}
          className={cn(
            'px-3 py-2 rounded-md border text-sm',
            node.status === 'added'   && 'bg-green-50 border-green-200 dark:bg-green-950/20',
            node.status === 'removed' && 'bg-red-50 border-red-200 dark:bg-red-950/20',
            node.status === 'changed' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {statusIcon(node.status)}
            <span className="font-medium">{node.nodeTitle}</span>
            <Badge variant="secondary" className="text-xs capitalize">{node.nodeType}</Badge>
          </div>

          {node.status === 'added' && (
            <p className="text-xs text-green-700">New node added to canvas</p>
          )}
          {node.status === 'removed' && (
            <p className="text-xs text-red-600">Node removed from canvas</p>
          )}
          {node.status === 'changed' && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {node.movedBy && (
                <p>Moved: Δx={node.movedBy.dx.toFixed(0)} Δy={node.movedBy.dy.toFixed(0)}</p>
              )}
              {node.changedFields && node.changedFields.length > 0 && (
                <p>Changed: {node.changedFields.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main ArtifactDiffView ──────────────────────────────────────────────────────

interface ArtifactDiffViewProps {
  before: unknown;
  after: unknown;
  kind?: 'rich-text' | 'structured' | 'canvas' | 'auto';
  fieldLabels?: Record<string, string>;
  title?: string;
  className?: string;
}

export function ArtifactDiffView({
  before,
  after,
  kind = 'auto',
  fieldLabels,
  title,
  className,
}: ArtifactDiffViewProps) {
  const detectedKind = kind === 'auto' ? detectDiffKind(after ?? before) : kind;

  const result = useMemo(() => {
    switch (detectedKind) {
      case 'rich-text':
        return { kind: 'rich-text' as const, diff: richTextDiff(before as string, after as string) };
      case 'canvas':
        return { kind: 'canvas' as const, diff: canvasDiff(before as any, after as any) };
      default:
        return {
          kind: 'structured' as const,
          diff: structuredDiff(
            before as Record<string, unknown>,
            after as Record<string, unknown>,
            fieldLabels,
          ),
        };
    }
  }, [before, after, detectedKind, fieldLabels]);

  const summary = result.diff.summary;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {detectedKind === 'rich-text' && <FileText className="h-4 w-4 text-muted-foreground" />}
          {detectedKind === 'structured' && <Layers className="h-4 w-4 text-muted-foreground" />}
          {detectedKind === 'canvas' && <GitBranch className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{title ?? 'Changes'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DiffBadge status="added" count={summary.added} />
          <DiffBadge status="removed" count={summary.removed} />
          <DiffBadge status="changed" count={summary.changed} />
        </div>
      </div>

      {/* Diff content */}
      <div className="max-h-[500px] overflow-y-auto">
        <div className="pr-4">
          {result.kind === 'rich-text' && (
            <RichTextDiffView diff={result.diff as RichTextDiffResult} />
          )}
          {result.kind === 'structured' && (
            <StructuredDiffView diff={result.diff as StructuredDiffResult} />
          )}
          {result.kind === 'canvas' && (
            <CanvasDiffView diff={result.diff as CanvasDiffResult} />
          )}
        </div>
      </div>
    </div>
  );
}
