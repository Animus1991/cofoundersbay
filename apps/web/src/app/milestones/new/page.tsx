'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { createMilestone, type MilestoneStatus, type MilestonePriority } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, CfbGlyphWell } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { bilingualAria } from '@/lib/i18n/format';
import {
  milestoneEn,
  milestoneEl,
  useMilestonePrimaryText,
  MILESTONE_CATEGORY_KEYS,
  MILESTONE_PRIORITY_KEYS,
} from '@/lib/i18n/strings-milestones';

const CATEGORIES = ['product', 'fundraising', 'hiring', 'partnerships', 'growth', 'other'] as const;
const PRIORITIES: { value: MilestonePriority; color: string }[] = [
  { value: 'low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', color: 'bg-status-warning-bg text-status-warning ' },
  { value: 'high', color: 'bg-status-danger-bg text-status-danger ' },
];

export default function NewMilestonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const t = useMilestonePrimaryText();
  const { open: openAskAi } = usePopupChat();

  const collaboratorId = searchParams?.get('with') ?? searchParams?.get('collaborator') ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MilestonePriority>('medium');
  const [category, setCategory] = useState('product');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createMilestone({
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'todo' as MilestoneStatus,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        collaboratorId: collaboratorId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      success(t(milestoneEn('created'), milestoneEl('created')), t(milestoneEn('created_hint'), milestoneEl('created_hint')));
      router.push('/milestones');
    },
    onError: (err) => {
      showError(t(milestoneEn('fail_create'), milestoneEl('fail_create')), err instanceof Error ? err.message : t(milestoneEn('try_again'), milestoneEl('try_again')));
    },
  });

  const canSubmit = title.trim().length > 0 && !mutation.isPending;

  return (
    <AppShell
      showHelp
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => openAskAi()}>
            <CfbGlyph name="spark" className="icon-sm" />
            <BilingualText en={milestoneEn('ask_ai')} el={milestoneEl('ask_ai')} compact />
          </Button>
          <Link href="/milestones">
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl" aria-label={bilingualAria(milestoneEn('back'), milestoneEl('back'))}>
              <ArrowLeft className="icon-sm" />
              <BilingualText en={milestoneEn('back')} el={milestoneEl('back')} compact />
            </Button>
          </Link>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-sm text-muted-foreground">
          <BilingualText en={milestoneEn('page_new_lead')} el={milestoneEl('page_new_lead')} />
        </p>
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CfbGlyphWell name="flag" size="md" />
              <div>
                <CardTitle>
                  <BilingualText en={milestoneEn('create_title')} el={milestoneEl('create_title')} />
                </CardTitle>
                <CardDescription>
                  {collaboratorId
                    ? <BilingualText en={milestoneEn('create_shared')} el={milestoneEl('create_shared')} />
                    : <BilingualText en={milestoneEn('create_solo')} el={milestoneEl('create_solo')} />}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) mutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="title">
                  <BilingualText en={milestoneEn('field_title')} el={milestoneEl('field_title')} compact /> <span className="text-destructive-accessible">*</span>
                </Label>
                <Input
                  id="title"
                  className="rounded-xl"
                  placeholder={t(milestoneEn('title_ph'), milestoneEl('title_ph'))}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  maxLength={140}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">
                  <BilingualText en={milestoneEn('field_desc')} el={milestoneEl('field_desc')} compact />
                </Label>
                <Textarea
                  id="description"
                  className="rounded-xl"
                  placeholder={t(milestoneEn('desc_ph'), milestoneEl('desc_ph'))}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label><BilingualText en={milestoneEn('field_category')} el={milestoneEl('field_category')} compact /></Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                          category === c
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                        )}
                      >
                        <BilingualText en={milestoneEn(MILESTONE_CATEGORY_KEYS[c])} el={milestoneEl(MILESTONE_CATEGORY_KEYS[c])} compact />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label><BilingualText en={milestoneEn('field_priority')} el={milestoneEl('field_priority')} compact /></Label>
                  <div className="flex gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          'flex-1 rounded-xl border px-2 py-1.5 text-xs font-medium transition-all',
                          priority === p.value
                            ? `${p.color} border-transparent ring-2 ring-primary/30`
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        <BilingualText en={milestoneEn(MILESTONE_PRIORITY_KEYS[p.value])} el={milestoneEl(MILESTONE_PRIORITY_KEYS[p.value])} compact />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">
                  <BilingualText en={milestoneEn('due_optional')} el={milestoneEl('due_optional')} compact />
                </Label>
                <Input
                  id="dueDate"
                  className="rounded-xl"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">
                  <BilingualText en={milestoneEn('field_notes')} el={milestoneEl('field_notes')} compact />
                </Label>
                <Textarea
                  id="notes"
                  className="rounded-xl"
                  placeholder={t(milestoneEn('notes_ph'), milestoneEl('notes_ph'))}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={1000}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-2">
                <Link href="/milestones">
                  <Button type="button" variant="ghost" className="rounded-xl">
                    <BilingualText en={milestoneEn('cancel')} el={milestoneEl('cancel')} compact />
                  </Button>
                </Link>
                <Button type="submit" className="rounded-xl" disabled={!canSubmit}>
                  {mutation.isPending
                    ? <BilingualText en={milestoneEn('creating')} el={milestoneEl('creating')} compact />
                    : <BilingualText en={milestoneEn('create')} el={milestoneEl('create')} compact />}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
