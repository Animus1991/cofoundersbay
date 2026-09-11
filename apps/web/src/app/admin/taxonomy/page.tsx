'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tags,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Folder,
  Hash,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  adminListSkills,
  adminCreateSkill,
  adminUpdateSkill,
  adminDeleteSkill,
  type AdminSkillItem,
} from '@/lib/api';

const SKILL_CATEGORIES = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Finance', 'Operations', 'Legal', 'Product', 'Data', 'Other'];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function SkillRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0">
      <div className="w-6" />
      <Skeleton className="icon-sm rounded" />
      <Skeleton className="h-4 flex-1 max-w-[160px]" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-10 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

function SkillRow({
  skill,
  onEdit,
  onDelete,
}: {
  skill: AdminSkillItem;
  onEdit: (skill: AdminSkillItem) => void;
  onDelete: (skill: AdminSkillItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors border-b last:border-b-0">
      <div className="w-6" />
      <Hash className="icon-sm text-muted-foreground shrink-0" aria-hidden="true" />
      <span className="flex-1 font-medium truncate">{skill.name}</span>
      <span className="text-sm text-muted-foreground hidden sm:block">{skill.slug}</span>
      {skill.category && (
        <Badge variant="outline" className="text-xs hidden md:flex">{skill.category}</Badge>
      )}
      <Badge variant="secondary" className="text-xs">{skill.count}</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="icon-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(skill)}>
            <Edit className="mr-2 icon-sm" aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive-emphasis" onClick={() => onDelete(skill)}>
            <Trash2 className="mr-2 icon-sm" aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SkillDialog({
  open,
  skill,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  skill: AdminSkillItem | null;
  onClose: () => void;
  onSave: (data: { name: string; slug: string; category: string }) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(skill?.name ?? '');
  const [slug, setSlug] = useState(skill?.slug ?? '');
  const [category, setCategory] = useState(skill?.category ?? '');
  const [autoSlug, setAutoSlug] = useState(!skill);

  // Reset when dialog opens
  useState(() => {
    setName(skill?.name ?? '');
    setSlug(skill?.slug ?? '');
    setCategory(skill?.category ?? '');
    setAutoSlug(!skill);
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug) setSlug(slugify(val));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{skill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Machine Learning" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
              placeholder="e.g. machine-learning"
            />
            <p className="text-xs text-muted-foreground mt-1">URL-friendly identifier, must be unique</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            onClick={() => onSave({ name: name.trim(), slug: slug.trim(), category })}
            disabled={isSaving || !name.trim() || !slug.trim()}
          >
            {isSaving && <Loader2 className="mr-2 icon-sm animate-spin" aria-hidden="true" />}
            {skill ? 'Save Changes' : 'Add Skill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTaxonomyPage() {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editTarget, setEditTarget] = useState<AdminSkillItem | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSkillItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-skills', search, categoryFilter],
    queryFn: () => adminListSkills({ q: search || undefined, category: categoryFilter || undefined, limit: 200 }),
    staleTime: 30_000,
  });

  const skills = data?.items ?? [];
  const total = data?.total ?? 0;

  const categories = Array.from(new Set(skills.map((s) => s.category).filter(Boolean))) as string[];

  const groupedByCategory = SKILL_CATEGORIES.reduce<Record<string, AdminSkillItem[]>>((acc, cat) => {
    const items = skills.filter((s) => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = skills.filter((s) => !s.category);

  const createMutation = useMutation({
    mutationFn: adminCreateSkill,
    onSuccess: () => {
      success('Skill created');
      qc.invalidateQueries({ queryKey: ['admin-skills'] });
      setEditTarget(null);
    },
    onError: (e: Error) => showError('Failed to create skill', e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof adminUpdateSkill>[1] }) =>
      adminUpdateSkill(id, body),
    onSuccess: () => {
      success('Skill updated');
      qc.invalidateQueries({ queryKey: ['admin-skills'] });
      setEditTarget(null);
    },
    onError: (e: Error) => showError('Failed to update skill', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteSkill,
    onSuccess: () => {
      success('Skill deleted');
      qc.invalidateQueries({ queryKey: ['admin-skills'] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => showError('Failed to delete skill', e.message),
  });

  const handleSave = (formData: { name: string; slug: string; category: string }) => {
    if (editTarget === 'new') {
      createMutation.mutate(formData);
    } else if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: formData });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight">Taxonomy Management</h1>
            <p className="text-muted-foreground">Manage skills, categories, and classification systems</p>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Refresh" variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="icon-sm" aria-hidden="true" />
            </Button>
            <Button onClick={() => setEditTarget('new')}>
              <Plus className="mr-2 icon-sm" aria-hidden="true" />
              Add Skill
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Skills</p>
              {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-xl font-bold">{total}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Categories</p>
              {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : <p className="text-xl font-bold">{categories.length}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Technical Skills</p>
              {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : (
                <p className="text-xl font-bold">{skills.filter((s) => s.category === 'Technical').length}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Business Skills</p>
              {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : (
                <p className="text-xl font-bold">{skills.filter((s) => s.category === 'Business').length}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skills Management */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Folder className="icon-md text-primary-emphasis" aria-hidden="true" />
                <CardTitle className="text-lg">Skills</CardTitle>
                {!isLoading && <Badge variant="secondary">{total}</Badge>}
              </div>
              <Button size="sm" onClick={() => setEditTarget('new')}>
                <Plus className="mr-2 icon-sm" aria-hidden="true" />
                Add Skill
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Skills and expertise tags used across profiles</p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="px-4 pb-3 flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="icon-sm text-muted-foreground" aria-hidden="true" />
                  </button>
                )}
              </div>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All categories</option>
                {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="border-t">
              {isError && (
                <div className="flex items-center gap-2 p-6 text-destructive-emphasis justify-center">
                  <AlertCircle className="icon-md" aria-hidden="true" />
                  <span className="text-sm">Failed to load skills.</span>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                </div>
              )}

              {isLoading && (
                <div className="max-h-[480px] overflow-y-auto">
                  {Array.from({ length: 8 }).map((_, i) => <SkillRowSkeleton key={i} />)}
                </div>
              )}

              {!isLoading && !isError && (
                <div className="max-h-[480px] overflow-y-auto">
                  {skills.length === 0 && (
                    <div className="py-12 text-center">
                      <Tags className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-muted-foreground text-sm">
                        {search || categoryFilter ? 'No skills match your filter' : 'No skills yet — add your first skill'}
                      </p>
                    </div>
                  )}
                  {/* Grouped by category */}
                  {!categoryFilter && !search && Object.entries(groupedByCategory).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="px-4 py-1.5 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {cat} ({items.length})
                      </div>
                      {items.map((skill) => (
                        <SkillRow key={skill.id} skill={skill} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                      ))}
                    </div>
                  ))}
                  {/* Filtered flat list */}
                  {(categoryFilter || search) && skills.map((skill) => (
                    <SkillRow key={skill.id} skill={skill} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                  ))}
                  {/* Uncategorized */}
                  {!categoryFilter && !search && uncategorized.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Uncategorized ({uncategorized.length})
                      </div>
                      {uncategorized.map((skill) => (
                        <SkillRow key={skill.id} skill={skill} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <SkillDialog
        open={editTarget !== null}
        skill={editTarget === 'new' ? null : editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will remove it from all profiles.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 icon-sm animate-spin" aria-hidden="true" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
