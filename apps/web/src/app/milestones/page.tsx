'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, CheckCircle2, Clock,
  Edit2, Trash2,
  RefreshCw, MoreVertical,
  Search, LayoutGrid, LayoutList, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import { BilingualText } from '@/components/common/BilingualText';
import { useConfirm, deleteConfirmCopy } from '@/components/ui/confirm-dialog';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { bilingualAria, formatShortDate } from '@/lib/i18n/format';
import {
  milestoneEn,
  milestoneEl,
  useMilestonePrimaryText,
  MILESTONE_CATEGORY_KEYS,
  MILESTONE_STATUS_ONE_KEYS,
} from '@/lib/i18n/strings-milestones';
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
import { qk } from '@/lib/query-keys';

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<MilestoneStatus, { statusKey: 'status_todo' | 'status_in_progress' | 'status_blocked' | 'status_completed' | 'status_cancelled'; glyph: CfbGlyphName; tone: StatusTone }> = {
  todo:        { statusKey: 'status_todo',        glyph: 'flag',     tone: 'neutral' },
  in_progress: { statusKey: 'status_in_progress', glyph: 'calendar', tone: 'info' },
  blocked:     { statusKey: 'status_blocked',     glyph: 'shield',   tone: 'warning' },
  completed:   { statusKey: 'status_completed',   glyph: 'award',    tone: 'success' },
  cancelled:   { statusKey: 'status_cancelled',   glyph: 'more',     tone: 'neutral' },
};

const PRIORITY_CONFIG: Record<MilestonePriority, { priKey: 'pri_low' | 'pri_medium' | 'pri_high'; tone: StatusTone }> = {
  low:    { priKey: 'pri_low',    tone: 'neutral' },
  medium: { priKey: 'pri_medium', tone: 'warning' },
  high:   { priKey: 'pri_high',   tone: 'danger' },
};

const PRIORITY_DOT: Record<StatusTone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
  accent: 'bg-status-accent',
  neutral: 'bg-muted-foreground',
};

const CATEGORY_ORDER = ['all', 'product', 'fundraising', 'hiring', 'partnerships', 'growth', 'other'] as const;

/**
 * Greek for the twelve preview milestones (`PREVIEW_MILESTONES` in
 * `lib/preview-api.ts`). Real milestones are user data and render as typed;
 * the demo ones were the only English block left on a Greek-primary page.
 * Keyed by the exact English title, same pattern as the Builder preview hints.
 */
const PREVIEW_MILESTONE_EL: Record<string, { title: string; description?: string }> = {
  'Launch beta to first 20 users': { title: 'Κυκλοφορία beta στους πρώτους 20 χρήστες', description: 'Πρόσκληση από τη λίστα αναμονής, μέτρηση ένταξης, συλλογή ποιοτικών σχολίων.' },
  'Hire first engineer': { title: 'Πρόσληψη πρώτου μηχανικού', description: 'Φύλλο αξιολόγησης, τρεις φιναλίστ, πρόταση σε αναμονή.' },
  'File trademark': { title: 'Κατοχύρωση εμπορικού σήματος' },
  'Close seed round': { title: 'Κλείσιμο γύρου seed', description: 'Ελήφθη φύλλο όρων, ενημερωμένο data room, 8 ραντεβού κλεισμένα.' },
  'Ship onboarding checklist': { title: 'Παράδοση λίστας ένταξης', description: 'Ο ιδρυτής ολοκληρώνει τη ρύθμιση χωρίς κλήση.' },
  'Sign university MoU': { title: 'Υπογραφή μνημονίου με πανεπιστήμιο', description: 'Πιλοτικός κύκλος 12 ομάδων.' },
  'Publish landing page': { title: 'Δημοσίευση σελίδας προορισμού' },
  'First mentor office hours': { title: 'Πρώτες ώρες γραφείου με μέντορα' },
  'BMC v1 in Builder': { title: 'Καμβάς μοντέλου v1 στον Builder' },
  'Pitch deck outline': { title: 'Δομή pitch deck' },
  'Readiness score above 40': { title: 'Βαθμός ετοιμότητας πάνω από 40' },
  'Intro call with first accelerator': { title: 'Γνωριμία με τον πρώτο επιταχυντή' },
};

function formatMilestoneDate(iso: string | null, lang: 'en' | 'el'): string {
  if (!iso) return '—';
  return formatShortDate(iso, lang) || '—';
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
  const { primary } = useLanguagePreference();
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_CONFIG[item.status];
  const statusColors = STATUS[status.tone];
  const priority = PRIORITY_CONFIG[item.priority];
  const overdue = isOverdue(item.dueDate, item.status);
  const dueSoon = isDueSoon(item.dueDate);
  const catKey = item.category ? MILESTONE_CATEGORY_KEYS[item.category] : null;
  const previewEl = PREVIEW_MILESTONE_EL[item.title];

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card transition-all hover:shadow-sm',
        // No opacity fade on a completed row. Fading the container fades its text
        // with it: muted text measured 4.35:1 at 0.75 on the card and 4.38:1 at
        // 0.80 on this row's own success tint -- both under AA, and the exact
        // value needed depends on whichever surface the row happens to sit on.
        // Completion is already carried by the success border and the struck-out
        // title, so the row recedes without taking its own legibility with it.
        item.status === 'completed' ? cn('border', STATUS.success.border) : 'border-border/60',
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
          <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', statusColors.bg)}>
            <CfbGlyph name={status.glyph} className={cn('icon-sm', statusColors.icon)} />
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
                {previewEl ? <BilingualText en={item.title} el={previewEl.title} wrap /> : item.title}
              </h3>
              {/* Actions */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-xl p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-within:opacity-100"
                  aria-label={bilingualAria(milestoneEn('more'), milestoneEl('more'))}
                >
                  <MoreVertical className="icon-sm" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-lg">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => { setMenuOpen(false); onEdit(item); }}
                      >
                        <Edit2 className="icon-sm text-muted-foreground" />
                        <BilingualText en={milestoneEn('edit')} el={milestoneEl('edit')} compact />
                      </button>
                      {item.status !== 'completed' && (
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => { setMenuOpen(false); onStatusChange(item.id, 'completed'); }}
                        >
                          <CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} />
                          <BilingualText en={milestoneEn('mark_complete')} el={milestoneEl('mark_complete')} compact />
                        </button>
                      )}
                      {item.status === 'completed' && (
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => { setMenuOpen(false); onStatusChange(item.id, 'in_progress'); }}
                        >
                          <Clock className={cn('icon-sm', STATUS.info.icon)} />
                          <BilingualText en={milestoneEn('reopen')} el={milestoneEl('reopen')} compact />
                        </button>
                      )}
                      <div className="my-1 border-t border-border/40" />
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive-accessible hover:bg-destructive/10"
                        onClick={() => { setMenuOpen(false); onDelete(item.id); }}
                      >
                        <Trash2 className="icon-sm" />
                        <BilingualText en={milestoneEn('delete')} el={milestoneEl('delete')} compact />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {item.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {previewEl?.description
                  ? <BilingualText en={item.description} el={previewEl.description} wrap />
                  : item.description}
              </p>
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
                {/* Singular: this chip describes one milestone, not the set. */}
                <BilingualText
                  en={milestoneEn(MILESTONE_STATUS_ONE_KEYS[item.status] ?? status.statusKey)}
                  el={milestoneEl(MILESTONE_STATUS_ONE_KEYS[item.status] ?? status.statusKey)}
                  compact
                />
              </Badge>

              <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[priority.tone])} />
                <BilingualText en={milestoneEn(priority.priKey)} el={milestoneEl(priority.priKey)} compact />
              </div>

              {item.category && (
                <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-2xs text-muted-foreground">
                  {catKey
                    ? <BilingualText en={milestoneEn(catKey)} el={milestoneEl(catKey)} compact />
                    : item.category}
                </span>
              )}

              {item.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-2xs',
                    overdue ? cn('font-medium', STATUS.danger.icon) : dueSoon ? cn('font-medium', STATUS.warning.icon) : 'text-muted-foreground',
                  )}
                >
                  <CfbGlyph name="calendar" className="icon-sm" />
                  {overdue ? <><BilingualText en={milestoneEn('overdue')} el={milestoneEl('overdue')} compact /> · </> : dueSoon ? <><BilingualText en={milestoneEn('due_soon')} el={milestoneEl('due_soon')} compact /> · </> : ''}
                  {formatMilestoneDate(item.dueDate, primary)}
                </div>
              )}

              {item.collaborator && (
                <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                  <CfbGlyph name="people" className="icon-sm" />
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
function SummaryBar({ summary }: { summary: { counts?: Record<string, number>; total?: number; overdue?: number; dueSoon?: number; completionRate?: number } | undefined }) {
  const counts = summary?.counts;
  if (!summary || !counts || typeof counts !== 'object') return null;
  const stats: { labelKey: 'stat_total' | 'stat_in_progress' | 'stat_completed' | 'stat_overdue' | 'stat_rate'; value: string | number; glyph: CfbGlyphName; tone: StatusTone | 'neutral' }[] = [
    { labelKey: 'stat_total', value: summary.total ?? 0, glyph: 'flag', tone: 'neutral' },
    { labelKey: 'stat_in_progress', value: counts.in_progress ?? 0, glyph: 'calendar', tone: 'info' },
    { labelKey: 'stat_completed', value: counts.completed ?? 0, glyph: 'award', tone: 'success' },
    { labelKey: 'stat_overdue', value: summary.overdue ?? 0, glyph: 'target', tone: 'danger' },
    { labelKey: 'stat_rate', value: `${summary.completionRate ?? 0}%`, glyph: 'chart', tone: 'accent' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((s) => {
        const colors = s.tone === 'neutral' ? { icon: 'text-foreground' } : STATUS[s.tone];
        return (
        <div key={s.labelKey} className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-center">
          <span className={cn('mx-auto mb-1 inline-flex', colors.icon)}>
            <CfbGlyph name={s.glyph} className="icon-sm" />
          </span>
          <p className={cn('text-xl font-semibold tabular-nums', colors.icon)}>{s.value}</p>
          <p className="text-2xs leading-snug text-muted-foreground">
            <BilingualText en={milestoneEn(s.labelKey)} el={milestoneEl(s.labelKey)} compact wrap />
          </p>
        </div>
      );})}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MilestonesPage() {
  const qc = useQueryClient();
  const { primary } = useLanguagePreference();
  const t = useMilestonePrimaryText();
  const { open: openAskAi } = usePopupChat();
  const { isAuthenticated, isChecking } = useAuthenticatedSession();
  const confirm = useConfirm();
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MilestonePriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editTarget, setEditTarget] = useState<Milestone | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryKey = qk('milestones', statusFilter, priorityFilter);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      listMilestones({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        limit: 100,
      }),
    staleTime: 30_000,
    enabled: mounted && isAuthenticated && !isChecking,
  });

  const { data: summaryData } = useQuery({
    queryKey: qk('milestones', 'summary'),
    queryFn: getMilestoneSummary,
    staleTime: 60_000,
    enabled: mounted && isAuthenticated && !isChecking,
  });

  const waiting = !mounted || isLoading;

  const allMilestones = data?.milestones ?? [];
  const milestones = allMilestones.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const createMut = useMutation({
    mutationFn: createMilestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk('milestones') });
      setCreateOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMilestone>[1] }) =>
      updateMilestone(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk('milestones') });
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
    onSettled: () => qc.invalidateQueries({ queryKey: qk('milestones') }),
  });

  const handleStatusChange = useCallback(
    (id: string, status: MilestoneStatus) => updateMut.mutate({ id, data: { status } }),
    [updateMut],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (await confirm(deleteConfirmCopy({ en: 'milestone', el: 'ορόσημου' }))) {
        deleteMut.mutate(id);
      }
    },
    [deleteMut, confirm],
  );

  const statusCounts = (summaryData as { counts?: Record<string, number> } | undefined)?.counts ?? {};
  const statusTabs: Array<{ value: MilestoneStatus | 'all'; labelKey: 'all' | 'status_todo' | 'status_in_progress' | 'status_blocked' | 'status_completed'; count?: number }> = [
    { value: 'all', labelKey: 'all', count: summaryData?.total },
    { value: 'todo', labelKey: 'status_todo', count: statusCounts.todo },
    { value: 'in_progress', labelKey: 'status_in_progress', count: statusCounts.in_progress },
    { value: 'blocked', labelKey: 'status_blocked', count: statusCounts.blocked },
    { value: 'completed', labelKey: 'status_completed', count: statusCounts.completed },
  ];

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim().length > 0;
  const trackerHasItems = (summaryData?.total ?? 0) > 0 || allMilestones.length > 0;
  const showFilteredEmpty = milestones.length === 0 && (hasActiveFilters || trackerHasItems);

  /*
   * What counts the list and what narrows it.
   *
   * The milestones are the page, and so are the status tabs: those are how
   * you slice the list, not decoration around it. Five tiles counting the
   * same list, a search box with a category filter, and a priority select
   * that shared a row with the tabs and made it wrap - those are not.
   */
  // Offered to the assistant: status, priority, category and layout, through
  // the same setters as the tabs, the rail's select and chips, and the view
  // switch. Creating one is `create_milestone`, a capability of its own.
  usePageControls([
    choiceControl('status_filter', 'Milestone status filter', 'Φίλτρο κατάστασης ορόσημου', statusTabs.map((t) => ({ value: t.value, en: milestoneEn(t.labelKey), el: milestoneEl(t.labelKey) })), statusFilter, (v) => setStatusFilter(v as typeof statusFilter)),
    choiceControl('priority_filter', 'Priority filter', 'Φίλτρο προτεραιότητας', ([['all', 'pri_all'], ['high', 'pri_high'], ['medium', 'pri_medium'], ['low', 'pri_low']] as const).map(([value, key]) => ({ value, en: milestoneEn(key), el: milestoneEl(key) })), priorityFilter, (v) => setPriorityFilter(v as typeof priorityFilter)),
    choiceControl('category_filter', 'Category filter', 'Φίλτρο κατηγορίας', CATEGORY_ORDER.map((cat) => ({ value: cat, en: cat === 'all' ? milestoneEn('all') : milestoneEn(MILESTONE_CATEGORY_KEYS[cat]), el: cat === 'all' ? milestoneEl('all') : milestoneEl(MILESTONE_CATEGORY_KEYS[cat]) })), categoryFilter, setCategoryFilter),
    choiceControl('view', 'Milestone layout', 'Διάταξη ορόσημων', [
      { value: 'list', en: 'List', el: 'Λίστα' },
      { value: 'grid', en: 'Grid', el: 'Πλέγμα' },
    ], viewMode, (v) => setViewMode(v as 'list' | 'grid')),
    // The row menu's own actions over the rows on screen: set a status
    // (the same update the status menu makes), edit, and delete - which
    // still asks first.
    ...(['todo', 'in_progress', 'blocked', 'completed'] as const).map((status) => {
      const key = STATUS_CONFIG[status].statusKey;
      return {
        id: `mark_${status}`,
        labelEn: `Mark milestone ${milestoneEn(key)}`,
        labelEl: `Σήμανση ορόσημου ως ${milestoneEl(key)}`,
        writes: true,
        options: rowOptions(milestones.filter((m) => m.status !== status), (m) => m.id, (m) => m.title),
        // Between to do, in progress and blocked the update writes `status`
        // alone, so the previous one restores it. Completing also sets
        // progress to 100 and stamps completedAt (milestones.service), which
        // going back does not undo - so no opposite into or out of completed.
        undo: (v?: string) => {
          const prior = milestones.find((m) => m.id === v)?.status;
          return prior && prior !== 'completed' && status !== 'completed' && prior !== status && ['todo', 'in_progress', 'blocked'].includes(prior)
            ? { control: `mark_${prior}`, value: v }
            : undefined;
        },
        run: (v?: string) => { if (v) handleStatusChange(v, status); },
      };
    }),
    {
      id: 'edit_milestone',
      labelEn: 'Edit milestone',
      labelEl: 'Επεξεργασία ορόσημου',
      writes: false,
      options: rowOptions(milestones, (m) => m.id, (m) => m.title),
      run: (v) => { const m = milestones.find((row) => row.id === v); if (m) setEditTarget(m); },
    },
    {
      id: 'delete_milestone',
      labelEn: 'Delete milestone',
      labelEl: 'Διαγραφή ορόσημου',
      writes: true,
      options: rowOptions(milestones, (m) => m.id, (m) => m.title),
      run: (v) => { if (v) void handleDelete(v); },
    },
  ]);
  usePageList([
    {
      id: 'milestones',
      labelEn: 'Milestones',
      labelEl: 'Ορόσημα',
      rows: waiting ? undefined : milestones.map((m) => `${m.title} · ${milestoneEn(STATUS_CONFIG[m.status]?.statusKey ?? 'status_todo')} · ${m.priority} priority${m.dueDate ? ` · due ${m.dueDate.slice(0, 10)}` : ''} · ${m.progress}%`),
      total: summaryData?.total,
    },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'chart',
      labelEn: 'Summary',
      labelEl: 'Σύνοψη',
      content: (
        <div className="space-y-3">
          {/* Summary strip */}
          {waiting ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <SummaryBar summary={summaryData} />
          )}
        </div>
      ),
    },
    {
      id: 'filters',
      glyph: 'target',
      labelEn: 'Narrow the list',
      labelEl: 'Περιορισμός λίστας',
      // Search, category and priority each narrow what is on screen; the
      // reader has to be able to see that without opening the rail.
      badge:
        (searchQuery.trim() ? 1 : 0) +
          (categoryFilter !== 'all' ? 1 : 0) +
          (priorityFilter !== 'all' ? 1 : 0) || null,
      content: (
        <div className="space-y-4">
          {/* Search + Category filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="icon-sm absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(milestoneEn('search_ph'), milestoneEl('search_ph'))}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-xl pl-8 text-sm"
                aria-label={bilingualAria(milestoneEn('search_ph'), milestoneEl('search_ph'))}
              />
              {searchQuery && (
                <button aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="icon-sm" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                    categoryFilter === cat
                      ? 'border-primary/40 bg-primary/10 text-primary-accessible'
                      : 'border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {cat === 'all'
                    ? <BilingualText en={milestoneEn('all')} el={milestoneEl('all')} compact />
                    : <BilingualText en={milestoneEn(MILESTONE_CATEGORY_KEYS[cat])} el={milestoneEl(MILESTONE_CATEGORY_KEYS[cat])} compact />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-border/50 bg-secondary/30 px-3 py-1.5">
              {/* The glyph is the only thing next to this control, and a glyph
                  is not a label: axe reported `select-name (critical)` and a
                  screen reader announced a combo box with no subject. */}
              <CfbGlyph name="sliders" className="icon-sm text-muted-foreground" aria-hidden="true" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                aria-label={primary === 'el' ? 'Φίλτρο προτεραιότητας' : 'Filter by priority'}
                className="tap-target-y cursor-pointer bg-transparent text-xs text-foreground outline-none"
              >
                {[
                  { value: 'all' as const, key: 'pri_all' as const },
                  { value: 'high' as const, key: 'pri_high' as const },
                  { value: 'medium' as const, key: 'pri_medium' as const },
                  { value: 'low' as const, key: 'pri_low' as const },
                ].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {primary === 'el' ? milestoneEl(opt.key) : milestoneEn(opt.key)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-secondary/30 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn('rounded-xl p-1.5 transition-colors', viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                aria-label={bilingualAria(milestoneEn('view_list'), milestoneEl('view_list'))}
              ><LayoutList className="icon-sm" /></button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn('rounded-xl p-1.5 transition-colors', viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                aria-label={bilingualAria(milestoneEn('view_grid'), milestoneEl('view_grid'))}
              ><LayoutGrid className="icon-sm" /></button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => refetch()} aria-label={bilingualAria(milestoneEn('refresh'), milestoneEl('refresh'))}>
              <RefreshCw className={cn('icon-sm', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      ),
    },
  ];
  return (
    <AppShell
      rail={rail}
      showHelp
      askAi="Help me pick the next milestone from Builder, the pitch deck, and what is already overdue."
      actions={
        <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="icon-sm" /> <BilingualText en={milestoneEn('new_milestone')} el={milestoneEl('new_milestone')} compact />
        </Button>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => openAskAi()}
          className="flex w-full items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        >
          <CfbGlyph name="spark" className="icon-sm shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">
              <BilingualText en={milestoneEn('ask_ai_plan')} el={milestoneEl('ask_ai_plan')} stacked />
            </span>
            <span className="block text-2xs text-muted-foreground">
              <BilingualText en={milestoneEn('ask_ai_hint')} el={milestoneEl('ask_ai_hint')} />
            </span>
          </span>
        </button>



        {/* Status tabs. The priority select and the view toggle shared this
            row and made it wrap; they are in the rail now. */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'border-primary/40 bg-primary/10 text-primary-accessible'
                    : 'border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground',
                )}
              >
                <BilingualText en={milestoneEn(tab.labelKey)} el={milestoneEl(tab.labelKey)} compact />
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
        </div>

        {/* List */}
        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card py-16 text-center">
            <CfbGlyph name="target" className="icon-lg text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground"><BilingualText en={milestoneEn('load_fail')} el={milestoneEl('load_fail')} /></p>
            <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => refetch()}>
              <BilingualText en={milestoneEn('retry')} el={milestoneEl('retry')} compact />
            </Button>
          </div>
        ) : waiting ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <MilestoneSkeleton key={i} />)}
          </div>
        ) : milestones.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
            <CfbGlyph name="flag" className="icon-lg text-muted-foreground/50" />
            <div>
              <p className="font-medium text-foreground">
                {showFilteredEmpty
                  ? <BilingualText en={milestoneEn('empty_filter_title')} el={milestoneEl('empty_filter_title')} />
                  : <BilingualText en={milestoneEn('empty_title')} el={milestoneEl('empty_title')} />}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {showFilteredEmpty
                  ? <BilingualText en={milestoneEn('empty_filter_hint')} el={milestoneEl('empty_filter_hint')} />
                  : <BilingualText en={milestoneEn('empty_hint')} el={milestoneEl('empty_hint')} />}
              </p>
            </div>
            {showFilteredEmpty ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
              >
                <BilingualText en={milestoneEn('clear_filters')} el={milestoneEl('clear_filters')} compact />
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setCreateOpen(true)}>
                <Plus className="icon-sm" /> <BilingualText en={milestoneEn('empty_cta')} el={milestoneEl('empty_cta')} compact />
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'space-y-3')}>
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
