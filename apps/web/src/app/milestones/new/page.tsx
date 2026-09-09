'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Target } from 'lucide-react';
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

const CATEGORIES = [
  { value: 'product', label: 'Product' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'growth', label: 'Growth' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: MilestonePriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
];

export default function NewMilestonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

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
      success('Milestone created', 'Your milestone has been added to your tracker.');
      router.push('/milestones');
    },
    onError: (err) => {
      showError('Failed to create milestone', err instanceof Error ? err.message : 'Please try again');
    },
  });

  const canSubmit = title.trim().length > 0 && !mutation.isPending;

  return (
    <AppShell
      title="New Milestone"
      description="Set a goal and track your progress"
      actions={
        <Link href="/milestones">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back to milestones
          </Button>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Target className="icon-md text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Create Milestone</CardTitle>
                <CardDescription>
                  {collaboratorId
                    ? 'Define a shared goal with your collaborator'
                    : 'Define a goal and start tracking your progress'}
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
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">
                  Milestone title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Launch MVP, Close seed round, Hire CTO…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  maxLength={140}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does achieving this milestone look like?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Category + Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                          category === c.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/50',
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <div className="flex gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium border transition-all',
                          priority === p.value
                            ? `${p.color} border-transparent ring-2 ring-primary/30`
                            : 'bg-background border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date (optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional context, blockers, or resources…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={1000}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
                <Link href="/milestones">
                  <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                <Button type="submit" disabled={!canSubmit}>
                  {mutation.isPending ? 'Creating…' : 'Create milestone'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
