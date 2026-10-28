import { cn } from '@/lib/utils';

export type ProgressSegment = {
  key: string;
  value: number;
  /** done = finished, active = under way, late = past its date. The rest of the total is the track. */
  tone: 'done' | 'active' | 'late';
};

const TONE: Record<ProgressSegment['tone'], string> = {
  done: 'bg-status-success-mark',
  active: 'bg-primary',
  late: 'bg-status-danger-mark',
};

/**
 * Where a set of things stands, as one strip (docs §107): finished, under
 * way, late, and the rest still open as the track. Segments are separated
 * by the surface, 2px, never by an outline. Decorative to assistive tech:
 * whatever holds it says the counts in words ("5/12 · 7 open · 1 overdue").
 */
export function ProgressSegments({ segments, total, className }: { segments: readonly ProgressSegment[]; total: number; className?: string }) {
  if (total <= 0) return null;
  const shown = segments.filter((s) => s.value > 0);
  const used = shown.reduce((n, s) => n + s.value, 0);
  const rest = Math.max(0, total - used);
  return (
    <div aria-hidden="true" data-progress-segments="" className={cn('flex h-1 w-full gap-[2px] overflow-hidden', className)}>
      {shown.map((segment) => (
        <span key={segment.key} className={cn('h-full rounded-full', TONE[segment.tone])} style={{ flexGrow: segment.value, flexBasis: 0 }} />
      ))}
      {rest > 0 ? <span className="h-full rounded-full bg-muted" style={{ flexGrow: rest, flexBasis: 0 }} /> : null}
    </div>
  );
}
