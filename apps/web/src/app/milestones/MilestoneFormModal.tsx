'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { commonEn, commonEl } from '@/lib/i18n/strings-common';
import { usePopupChat } from '@/contexts/PopupChatContext';
import {
  milestoneEn,
  milestoneEl,
  useMilestonePrimaryText,
  MILESTONE_CATEGORY_KEYS,
  MILESTONE_STATUS_KEYS,
  MILESTONE_PRIORITY_KEYS,
} from '@/lib/i18n/strings-milestones';
import type { Milestone, MilestoneStatus, MilestonePriority } from '@/lib/api';

const CATEGORIES = ['product', 'fundraising', 'hiring', 'partnerships', 'growth', 'other'] as const;
const STATUSES: MilestoneStatus[] = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'];
const PRIORITIES: { value: MilestonePriority; color: string }[] = [
  { value: 'low', color: 'text-muted-foreground' },
  { value: 'medium', color: 'text-status-warning' },
  { value: 'high', color: 'text-status-danger' },
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
  const t = useMilestonePrimaryText();
  const { open: openAskAi } = usePopupChat();
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
            <CfbGlyph name="flag" className="icon-sm text-primary-accessible" />
            <h2 className="text-sm font-semibold text-foreground">
              <BilingualText
                en={isEdit ? milestoneEn('modal_edit') : milestoneEn('modal_new')}
                el={isEdit ? milestoneEl('modal_edit') : milestoneEl('modal_new')}
              />
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openAskAi()}
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium text-primary-accessible transition-colors hover:bg-primary/10"
            >
              <CfbGlyph name="spark" className="icon-sm" />
              <BilingualText en={milestoneEn('ask_ai')} el={milestoneEl('ask_ai')} compact />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={bilingualAria(commonEn('close'), commonEl('close'))}
            >
              <X className="icon-sm" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-accessible">
              <AlertTriangle className="mt-0.5 icon-sm shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <BilingualText en={milestoneEn('field_title')} el={milestoneEl('field_title')} compact /> <span className="text-destructive-accessible">*</span>
            </label>
            <Input
              className="rounded-xl"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={t(milestoneEn('title_ph'), milestoneEl('title_ph'))}
              required
              autoFocus
              maxLength={140}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <BilingualText en={milestoneEn('field_desc')} el={milestoneEl('field_desc')} compact />
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t(milestoneEn('desc_ph'), milestoneEl('desc_ph'))}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BilingualText en={milestoneEn('field_status')} el={milestoneEl('field_status')} compact />
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as MilestoneStatus)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(milestoneEn(MILESTONE_STATUS_KEYS[s]), milestoneEl(MILESTONE_STATUS_KEYS[s]))}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BilingualText en={milestoneEn('field_priority')} el={milestoneEl('field_priority')} compact />
              </label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as MilestonePriority)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{t(milestoneEn(MILESTONE_PRIORITY_KEYS[p.value]), milestoneEl(MILESTONE_PRIORITY_KEYS[p.value]))}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BilingualText en={milestoneEn('field_category')} el={milestoneEl('field_category')} compact />
              </label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">{t(milestoneEn('cat_none'), milestoneEl('cat_none'))}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(milestoneEn(MILESTONE_CATEGORY_KEYS[c]), milestoneEl(MILESTONE_CATEGORY_KEYS[c]))}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CfbGlyph name="calendar" className="icon-sm" />
                <BilingualText en={milestoneEn('field_due')} el={milestoneEl('field_due')} compact />
              </label>
              <Input
                className="rounded-xl"
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BilingualText en={milestoneEn('field_progress')} el={milestoneEl('field_progress')} compact />
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
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CfbGlyph name="people" className="icon-sm" />
              <BilingualText en={milestoneEn('field_collab')} el={milestoneEl('field_collab')} compact />
            </label>
            <Input
              className="rounded-xl"
              value={form.collaboratorId}
              onChange={(e) => set('collaboratorId', e.target.value)}
              placeholder={t(milestoneEn('collab_ph'), milestoneEl('collab_ph'))}
            />
            <p className="text-2xs text-muted-foreground">
              <BilingualText en={milestoneEn('collab_hint')} el={milestoneEl('collab_hint')} />
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CfbGlyph name="book" className="icon-sm" />
              <BilingualText en={milestoneEn('field_notes')} el={milestoneEl('field_notes')} compact />
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t(milestoneEn('notes_ph'), milestoneEl('notes_ph'))}
              rows={2}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={onClose}>
              <BilingualText en={milestoneEn('cancel')} el={milestoneEl('cancel')} compact />
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !form.title.trim()}
              className="min-w-[100px] rounded-xl"
            >
              {isSubmitting
                ? <BilingualText en={milestoneEn('saving')} el={milestoneEl('saving')} compact />
                : isEdit
                  ? <BilingualText en={milestoneEn('save_changes')} el={milestoneEl('save_changes')} compact />
                  : <BilingualText en={milestoneEn('create')} el={milestoneEl('create')} compact />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
