'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag, Plus, CheckCircle2, Clock, AlertTriangle, XCircle,
  ChevronDown, Filter, Calendar, BarChart3, Edit2, Trash2,
  Target, TrendingUp, Users, RefreshCw, MoreVertical,
  Search, LayoutGrid, LayoutList, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession';
import {
  listMilestones,
  getMilestoneSummary,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  type Milestone,
  type MilestoneStatus,
  type MilestonePriority,
} from '@/lib/api';
import { MilestoneFormModal } from './MilestoneFormModal';

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: React.ElementType; tone: StatusTone }> = {
  todo:        { label: 'To Do',      icon: Flag,          tone: 'neutral' },
  in_progress: { label: 'In Progress', icon: Clock,         tone: 'info' },
  blocked:     { label: 'Blocked',    icon: AlertTriangle, tone: 'warning' },
  completed:   { label: 'Completed',  icon: CheckCircle2,  tone: 'success' },
  cancelled:   { label: 'Cancelled',  icon: XCircle,       tone: 'neutral' },
};

const PRIORITY_CONFIG: Record<MilestonePriority, { label: string; tone: StatusTone }> = {
  low:    { label: 'Low',    tone: 'neutral' },
  medium: { label: 'Medium', tone: 'warning' },
  high:   { label: 'High',   tone: 'danger' },
};

const PRIORITY_DOT: Record<StatusTone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
  accent: 'bg-status-accent',
  neutral: 'bg-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
  product: 'Product', fundraising: 'Fundraising', hiring: 'Hiring',
  partnerships: 'Partnerships', growth: 'Growth', other: 'Other',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isDueSoon(iso: string | null): boolean {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isOverdue(iso: string | null, status: MilestoneStatus): boolean {
  if (!iso || status === 'completed' || status === 'cancelled') return false;
  return new Date(iso).getTime() < Date.now();
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function MilestoneSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-64" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-3 w-8" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ── Milestone card ────────────────────────────────────────────────────────────
function MilestoneCard({
  item,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  item: Milestone;
  onEdit: (m: Milestone) => void;
  onStatusChange: (id: string, status: MilestoneStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_CONFIG[item.status];
  const statusColors = STATUS[status.tone];
  const priority = PRIORITY_CONFIG[item.priority];
  const StatusIcon = status.icon;
  const overdue = isOverdue(item.dueDate, item.status);
  const dueSoon = isDueSoon(item.dueDate);

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card transition-all hover:shadow-sm',
        item.status === 'completed' ? cn('border', STATUS.success.border, 'opacity-75 hover:opacity-100') : 'border-border/60',
        overdue && cn('border', STATUS.danger.border),
      )}
    >
      {/* Priority stripe */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full',
          item.priority === 'high' ? PRIORITY_DOT.danger : item.priority === 'medium' ? PRIORITY_DOT.warning : PRIORITY_DOT.neutral,
        )}
      />

      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', statusColors.bg)}>
            <StatusIcon className={cn('h-4 w-4', statusColors.icon)} />
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  'text-sm font-medium leading-snug',
                  item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground',
                )}
              >
                {item.title}
              </h3>
              {/* Actions */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-border/60 bg-popover shadow-lg">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => { setMenuOpen(false); onEdit(item); }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                      </button>
                      {item.status !== 'completed' && (
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => { setMenuOpen(false); onStatusChange(item.id, 'completed'); }}
                        >
                          <CheckCircle2 className={cn('h-3.5 w-3.5', STATUS.success.icon)} /> Mark complete
                        </button>
                      )}
                      {item.status === 'completed' && (
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => { setMenuOpen(false); onStatusChange(item.id, 'in_progress'); }}
                        >
                          <Clock className={cn('h-3.5 w-3.5', STATUS.info.icon)} /> Reopen
                        </button>
                      )}
                      <div className="my-1 border-t border-border/40" />
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive-accessible hover:bg-destructive/10"
                        onClick={() => { setMenuOpen(false); onDelete(item.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {item.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            )}

            {/* Progress bar */}
            {item.status !== 'cancelled' && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      item.status === 'completed' ? 'bg-status-success' : 'bg-primary',
                    )}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="min-w-[2.5rem] text-right text-2xs tabular-nums text-muted-foreground">
                  {item.progress}%
                </span>
              </div>
            )}

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('h-5 gap-1 rounded-full px-2 text-2xs font-medium border', statusColors.chip)}
              >
                {status.label}
              </Badge>

              <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[priority.tone])} />
                {priority.label}
              </div>

              {item.category && (
                <span className="rounded-full border border-border/50 px-2 py-0.5 text-2xs text-muted-foreground">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
              )}

              {item.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-2xs',
                    overdue ? cn('font-medium', STATUS.danger.icon) : dueSoon ? cn('font-medium', STATUS.warning.icon) : 'text-muted-foreground',
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {overdue ? 'Overdue · ' : dueSoon ? 'Due soon · ' : ''}{formatDate(item.dueDate)}
                </div>
              )}

              {item.collaborator && (
                <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {item.collaborator.displayName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────
function SummaryBar({ summary }: { summary: { counts: Record<string, number>; total: number; overdue: number; dueSoon: number; completionRate: number } | undefined }) {
  if (!summary) return null;
  const stats = [
    { label: 'Total', value: summary.total, icon: Target, tone: 'neutral' as const },
    { label: 'In Progress', value: summary.counts.in_progress ?? 0, icon: Clock, tone: 'info' as const },
    { label: 'Completed', value: summary.counts.completed ?? 0, icon: CheckCircle2, tone: 'success' as const },
    { label: 'Overdue', value: summary.overdue, icon: AlertTriangle, tone: 'danger' as const },
    { label: 'Completion rate', value: `${summary.completionRate}%`, icon: TrendingUp, tone: 'accent' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((s) => {
        const colors = s.tone === 'neutral' ? { icon: 'text-foreground', text: 'text-foreground' } : STATUS[s.tone];
        return (
        <div key={s.label} className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-center">
          <s.icon className={cn('mx-auto mb-1 h-4 w-4', colors.icon)} />
          <p className={cn('text-xl font-semibold tabular-nums', colors.icon)}>{s.value}</p>
          <p className="text-2xs text-muted-foreground">{s.label}</p>
        </div>
      );})}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MilestonesPage() {
  const qc = useQueryClient();
  const { primary } = useLanguagePreference();
  const { isAuthenticated, isChecking } = useAuthenticatedSession();
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MilestonePriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editTarget, setEditTarget] = useState<Milestone | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const queryKey = ['milestones', statusFilter, priorityFilter];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      listMilestones({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        limit: 100,
      }),
    staleTime: 30_000,
    enabled: isAuthenticated && !isChecking,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['milestones', 'summary'],
    queryFn: getMilestoneSummary,
    staleTime: 60_000,
    enabled: isAuthenticated && !isChecking,
  });

  const allMilestones = data?.milestones ?? [];
  const milestones = allMilestones.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const createMut = useMutation({
    mutationFn: createMilestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] });
      setCreateOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMilestone>[1] }) =>
      updateMilestone(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] });
      setEditTarget(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteMilestone,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      qc.setQueryData(queryKey, (old: typeof data) => ({
        ...old,
        milestones: (old?.milestones ?? []).filter((m) => m.id !== id),
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });

  const handleStatusChange = useCallback(
    (id: string, status: MilestoneStatus) => updateMut.mutate({ id, data: { status } }),
    [updateMut],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Delete this milestone? This cannot be undone.')) {
        deleteMut.mutate(id);
      }
    },
    [deleteMut],
  );

  const statusCounts = (summaryData as any)?.counts ?? {};
  const statusTabs: Array<{ value: MilestoneStatus | 'all'; labelEn: string; labelEl: string; count?: number }> = [
    { value: 'all', labelEn: 'All', labelEl: 'Όλα', count: summaryData?.total },
    { value: 'todo', labelEn: 'To Do', labelEl: 'Προς εκτέλεση', count: statusCounts.todo },
    { value: 'in_progress', labelEn: 'In Progress', labelEl: 'Σε εξέλιξη', count: statusCounts.in_progress },
    { value: 'blocked', labelEn: 'Blocked', labelEl: 'Αποκλεισμένα', count: statusCounts.blocked },
    { value: 'completed', labelEn: 'Completed', labelEl: 'Ολοκληρωμένα', count: statusCounts.completed },
  ];

  return (
    <AppShell
      title="Milestones"
      description="Atomic goals with owners and due dates. Completed milestones feed your readiness score."
      showHelp
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> <BilingualText en="New milestone" el="Νέο ορόσημο" compact />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary strip */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <SummaryBar summary={summaryData} />
        )}

        {/* Search + Category filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'product', 'fundraising', 'hiring', 'partnerships', 'growth', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                  categoryFilter === cat
                    ? 'border-primary/40 bg-primary/10 text-primary-accessible'
                    : 'border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground',
                )}
              >
                {cat === 'all' ? <BilingualText en="All" el="Όλα" compact /> : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filters + view */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'border-primary/40 bg-primary/10 text-primary-accessible'
                    : 'border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground',
                )}
              >
                <BilingualText en={tab.labelEn} el={tab.labelEl} compact />
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-2xs',
                    statusFilter === tab.value ? 'bg-primary/20 text-primary-accessible' : 'bg-muted text-muted-foreground',
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Priority + View + Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/30 px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
              >
                {[
                  { value: 'all', en: 'All priorities', el: 'Όλες οι προτεραιότητες' },
                  { value: 'high', en: 'High', el: 'Υψηλή' },
                  { value: 'medium', en: 'Medium', el: 'Μεσαία' },
                  { value: 'low', en: 'Low', el: 'Χαμηλή' },
                ].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {primary === 'el' ? opt.el : opt.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center rounded-lg border border-border/50 bg-secondary/30 p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn('rounded p-1.5 transition-colors', viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              ><LayoutList className="h-3.5 w-3.5" /></button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('rounded p-1.5 transition-colors', viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              ><LayoutGrid className="h-3.5 w-3.5" /></button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* List */}
        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground"><BilingualText en="Failed to load milestones." el="Αποτυχία φόρτωσης ορόσημων." /></p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}><BilingualText en="Retry" el="Επανάληψη" compact /></Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <MilestoneSkeleton key={i} />)}
          </div>
        ) : milestones.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-7 w-7 text-primary-accessible" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {statusFilter !== 'all'
                  ? `No ${STATUS_CONFIG[statusFilter as MilestoneStatus]?.label?.toLowerCase()} milestones`
                  : 'No milestones yet'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter !== 'all'
                  ? 'Try adjusting your filters or add a new milestone.'
                  : 'Start tracking your startup goals, launch targets, and collaboration checkpoints.'}
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> <BilingualText en="Add your first milestone" el="Προσθέστε το πρώτο σας ορόσημο" compact />
            </Button>
          </div>
        ) : (
          <div className={cn(viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3')}>
            {milestones.map((m) => (
              <MilestoneCard
                key={m.id}
                item={m}
                onEdit={setEditTarget}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {createOpen && (
        <MilestoneFormModal
          open
          onClose={() => setCreateOpen(false)}
          onSubmit={(data) => createMut.mutate(data as any)}
          isSubmitting={createMut.isPending}
          error={createMut.error?.message}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <MilestoneFormModal
          open
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(data) => updateMut.mutate({ id: editTarget.id, data: data as any })}
          isSubmitting={updateMut.isPending}
          error={updateMut.error?.message}
        />
      )}
    </AppShell>
  );
}
