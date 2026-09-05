'use client';

import { useState, useEffect } from 'react';
import { X, Flag, Calendar, Users, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Milestone, MilestoneStatus, MilestonePriority } from '@/lib/api';

const CATEGORIES = [
  { value: 'product', label: 'Product' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'growth', label: 'Growth' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: MilestoneStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES: { value: MilestonePriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'high', label: 'High', color: 'text-red-500' },
];

interface FormData {
  title: string;
  description: string;
  status: MilestoneStatus;
  priority: MilestonePriority;
  category: string;
  dueDate: string;
  progress: number;
  notes: string;
  collaboratorId: string;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return iso.slice(0, 10);
  } catch {
    return '';
  }
}

type SubmitPayload = Partial<Omit<FormData, 'dueDate'>> & { dueDate?: string | null };

export function MilestoneFormModal({
  open,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  initial?: Milestone | null;
  onClose: () => void;
  onSubmit: (data: SubmitPayload) => void;
  isSubmitting?: boolean;
  error?: string;
}) {
  const isEdit = !!initial;

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: '',
    dueDate: '',
    progress: 0,
    notes: '',
    collaboratorId: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? '',
        status: initial.status,
        priority: initial.priority,
        category: initial.category ?? '',
        dueDate: toDateInputValue(initial.dueDate),
        progress: initial.progress,
        notes: initial.notes ?? '',
        collaboratorId: initial.collaboratorId ?? '',
      });
    } else {
      setForm({
        title: '', description: '', status: 'todo', priority: 'medium',
        category: '', dueDate: '', progress: 0, notes: '', collaboratorId: '',
      });
    }
  }, [initial, open]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: SubmitPayload = {
      title: form.title.trim(),
      status: form.status,
      priority: form.priority,
      progress: form.progress,
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.category) payload.category = form.category;
    if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString();
    else if (isEdit) payload.dueDate = null;
    if (form.notes.trim()) payload.notes = form.notes.trim();
    if (form.collaboratorId.trim()) payload.collaboratorId = form.collaboratorId.trim();
    onSubmit(payload);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary-accessible" />
            <h2 className="text-sm font-semibold text-foreground">
              {isEdit ? 'Edit milestone' : 'New milestone'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-accessible">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title <span className="text-destructive-accessible">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Launch MVP to beta users"
              required
              autoFocus
              maxLength={140}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What does this milestone represent?"
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as MilestoneStatus)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as MilestonePriority)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">None</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Calendar className="h-3 w-3" /> Due date
              </label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Progress
              </label>
              <span className="text-xs font-semibold tabular-nums text-foreground">{form.progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(e) => set('progress', Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${form.progress}%` }}
              />
            </div>
          </div>

          {/* Collaborator */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Users className="h-3 w-3" /> Collaborator user ID
            </label>
            <Input
              value={form.collaboratorId}
              onChange={(e) => set('collaboratorId', e.target.value)}
              placeholder="Optional — paste a co-founder's user ID"
            />
            <p className="text-[11px] text-muted-foreground">
              Both of you will be able to view and update this milestone.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <FileText className="h-3 w-3" /> Private notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Add context, blockers, or next actions…"
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !form.title.trim()}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create milestone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
