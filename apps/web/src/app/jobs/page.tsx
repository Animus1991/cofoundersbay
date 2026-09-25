'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  MapPin,
  Wifi,
  Building2,
  Search,
  Plus,
  ExternalLink,
  Loader2,
  AlertCircle,
  Star,
  Filter,
  Code2,
  Megaphone,
  Palette,
  Scale,
  BarChart3,
  Users,
  Sparkles,
  Zap,
} from 'lucide-react';
import { listJobs, createJobPosting, type JobPostingView } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { jobsEn, jobsEl } from '@/lib/i18n/strings-jobs';
import { bilingualInline } from '@/lib/i18n/format';
import { qk } from '@/lib/query-keys';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';

const ROLE_FILTERS = [
  { value: 'all',         labelKey: 'role_all' as const,         icon: Briefcase },
  { value: 'engineering', labelKey: 'role_engineering' as const, icon: Code2     },
  { value: 'marketing',   labelKey: 'role_marketing' as const,   icon: Megaphone },
  { value: 'design',      labelKey: 'role_design' as const,      icon: Palette   },
  { value: 'legal',       labelKey: 'role_legal' as const,       icon: Scale     },
  { value: 'analytics',   labelKey: 'role_analytics' as const,   icon: BarChart3 },
  { value: 'operations',  labelKey: 'role_operations' as const,  icon: Users     },
] as const;
type RoleFilter = typeof ROLE_FILTERS[number]['value'];

const EMPLOYMENT_TYPES = [
  { value: 'all',       labelKey: 'emp_all' as const },
  { value: 'full-time', labelKey: 'emp_full_time' as const },
  { value: 'part-time', labelKey: 'emp_part_time' as const },
  { value: 'contract',  labelKey: 'emp_contract' as const },
  { value: 'cofounder', labelKey: 'emp_cofounder' as const },
  { value: 'advisor',   labelKey: 'emp_advisor' as const },
] as const;

function JobCard({ job, featured = false }: { job: JobPostingView; featured?: boolean }) {
  return (
    <Card className={cn(
      'card-interactive hover-lift group transition-all duration-200',
      featured && 'border-primary/30 bg-gradient-to-br from-primary/[0.03] to-violet-500/[0.02]'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Company avatar */}
          <Avatar className="h-11 w-11 shrink-0 rounded-xl ring-2 ring-border/60">
            <AvatarImage src={job.creator?.avatarUrl ?? undefined} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible font-bold text-sm">
              {job.creator.displayName[0]?.toUpperCase() ?? 'J'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-foreground group-hover:text-primary-accessible transition-colors">
                    {job.title}
                  </h3>
                  {featured && <Star className="icon-sm text-status-warning fill-status-warning" />}
                </div>
                <p className="text-sm text-muted-foreground">{job.creator.displayName}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.role && (
                  <Badge variant="secondary" className="text-xs">{job.role}</Badge>
                )}
                {job.type && (
                  <Badge variant="outline" className="text-xs">{job.type}</Badge>
                )}
                {job.isRemote && (
                  <Badge variant="outline" className="text-xs border-status-success-border text-status-success bg-status-success-bg">
                    <Wifi className="mr-1 icon-sm" />
                    <BilingualText en={jobsEn('remote')} el={jobsEl('remote')} compact />
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="icon-sm" />{job.location}</span>
              )}
              {!job.location && !job.isRemote && (
                <span className="flex items-center gap-1">
                  <Building2 className="icon-sm" />
                  <BilingualText en={jobsEn('location_unknown')} el={jobsEl('location_unknown')} compact />
                </span>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" className="gap-1 shrink-0" asChild>
            <Link href={job.href ?? `/jobs`}>
              <ExternalLink className="icon-sm" />
              <BilingualText en={jobsEn('view')} el={jobsEl('view')} compact />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function JobSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function PostJobForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { success, error: showError } = useToast();
  const [form, setForm] = useState({ title: '', role: '', location: '', isRemote: false });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      createJobPosting({
        title: form.title.trim(),
        role: form.role.trim() || undefined,
        location: form.location.trim() || undefined,
        isRemote: form.isRemote,
      }),
    onSuccess: () => {
      success(jobsEn('posted'), jobsEn('posted_body'));
      onCreated();
      onClose();
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <BilingualText en={jobsEn('dialog_title')} el={jobsEl('dialog_title')} compact />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              <BilingualText en={jobsEn('field_title')} el={jobsEl('field_title')} compact /> *
            </label>
            <Input
              placeholder="e.g. Full-Stack Engineer (equity)"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              <BilingualText en={jobsEn('field_role')} el={jobsEl('field_role')} compact />
            </label>
            <Input
              placeholder="e.g. Engineering, Marketing, Design"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              <BilingualText en={jobsEn('field_location')} el={jobsEl('field_location')} compact />
            </label>
            <Input
              placeholder="e.g. Athens, GR"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              maxLength={120}
              disabled={form.isRemote}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => set('isRemote', e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <BilingualText en={jobsEn('field_remote')} el={jobsEl('field_remote')} compact />
          </label>
        <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              <BilingualText en={jobsEn('cancel')} el={jobsEl('cancel')} compact />
            </Button>
            <Button
              className="gap-2"
              onClick={() => mutation.mutate()}
              disabled={!form.title.trim() || mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="icon-sm animate-spin" /> : <Briefcase className="icon-sm" />}
              <BilingualText en={jobsEn('submit')} el={jobsEl('submit')} compact />
            </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [employmentType, setEmploymentType] = useState<(typeof EMPLOYMENT_TYPES)[number]['value']>('all');
  const [showPostForm, setShowPostForm] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk('jobs'),
    queryFn: () => listJobs({ limit: 50 }),
    staleTime: 60_000,
    retry: 1,
  });

  const jobs = data?.jobs ?? [];

  const filtered = jobs.filter((j) => {
    const matchSearch = !search.trim() ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.role?.toLowerCase().includes(search.toLowerCase()) ||
      j.creator.displayName.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || j.role?.toLowerCase().includes(roleFilter);
    const typeSlug = (j.type ?? '').toLowerCase().replace(/\s+/g, '-');
    const roleSlug = (j.role ?? '').toLowerCase();
    const matchEmp =
      employmentType === 'all' ||
      typeSlug === employmentType ||
      (employmentType === 'cofounder' && (roleSlug.includes('co-founder') || roleSlug.includes('cofounder') || typeSlug.includes('cofounder')));
    return matchSearch && matchRole && matchEmp;
  });

  // The featured strip shows the postings flagged as featured, or the three
  // newest when none are, and the sections below it do not repeat them - the
  // same three cards used to appear twice, once as featured and again under
  // Remote or On-site.
  const showFeatured = !search && roleFilter === 'all';
  const flagged = filtered.filter((j) => j.isFeatured);
  const featuredJobs = showFeatured ? (flagged.length ? flagged : filtered).slice(0, 3) : [];
  const featuredIds = new Set(featuredJobs.map((j) => j.id));
  const remoteJobs = filtered.filter((j) => j.isRemote);
  const onsiteJobs = filtered.filter((j) => !j.isRemote);
  const remoteRest = remoteJobs.filter((j) => !featuredIds.has(j.id));
  const onsiteRest = onsiteJobs.filter((j) => !featuredIds.has(j.id));

  // Offered to the assistant: the role and type chips, the search reset and
  // the Post form, through the same setters; the postings go out as a list.
  usePageList([
    {
      id: 'jobs',
      labelEn: 'Job postings',
      labelEl: 'Αγγελίες',
      rows: isLoading ? undefined : filtered.map((j) =>
        `${j.title}${j.role ? ` · ${j.role}` : ''} · ${j.creator.displayName} · ${j.isRemote ? 'remote' : (j.location ?? 'on-site')}${j.type ? ` · ${j.type}` : ''}`,
      ),
      total: jobs.length,
    },
  ]);
  usePageControls([
    choiceControl('role_filter', 'Role filter', 'Φίλτρο ρόλου', ROLE_FILTERS.map((r) => ({ value: r.value, en: jobsEn(r.labelKey), el: jobsEl(r.labelKey) })), roleFilter, (v) => setRoleFilter(v as RoleFilter)),
    choiceControl('employment_type', 'Employment type', 'Τύπος απασχόλησης', EMPLOYMENT_TYPES.map((t) => ({ value: t.value, en: jobsEn(t.labelKey), el: jobsEl(t.labelKey) })), employmentType, (v) => setEmploymentType(v as typeof employmentType)),
    {
      id: 'clear_search',
      labelEn: 'Clear the job search',
      labelEl: 'Καθαρισμός αναζήτησης αγγελιών',
      writes: false,
      unavailableEn: search ? undefined : 'No search is set.',
      unavailableEl: search ? undefined : 'Δεν υπάρχει αναζήτηση.',
      run: () => setSearch(''),
    },
    { id: 'post_job', labelEn: 'Open the post a job form', labelEl: 'Άνοιγμα φόρμας νέας αγγελίας', writes: false, run: () => setShowPostForm(true) },
  ]);

  return (
    <>
    {showPostForm && (
      <PostJobForm
        onClose={() => setShowPostForm(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: qk('jobs') })}
      />
    )}
    <AppShell
      showHelp
      actions={
        <Button className="gap-2" onClick={() => setShowPostForm(true)}>
          <Plus className="icon-sm" />
          <BilingualText en={jobsEn('post')} el={jobsEl('post')} compact />
        </Button>
      }
    >
      <div className="space-y-5 pb-10">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { labelEn: jobsEn('stat_open'), labelEl: jobsEl('stat_open'), value: jobs.length || '—', icon: Briefcase, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
          { labelEn: jobsEn('stat_remote'), labelEl: jobsEl('stat_remote'), value: remoteJobs.length || '—', icon: Wifi, color: 'text-status-success', bg: 'bg-status-success-bg' },
          { labelEn: jobsEn('stat_hiring'), labelEl: jobsEl('stat_hiring'), value: new Set(jobs.map((j) => j.creator.displayName)).size || '—', icon: Zap, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
        ].map((s) => {
          const SIcon = s.icon;
          return (
            <Card key={s.labelEn} className="shadow-sm border-border/50">
              <CardContent className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                  <SIcon className="icon-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">
                    <BilingualText en={s.labelEn} el={s.labelEl} compact />
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={bilingualInline(jobsEn('search'), jobsEl('search'))}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* Role filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="icon-sm text-muted-foreground shrink-0" />
          {ROLE_FILTERS.map((rf) => {
            const RIcon = rf.icon;
            const isActive = roleFilter === rf.value;
            return (
              <button
                key={rf.value}
                onClick={() => setRoleFilter(rf.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                <RIcon className="icon-sm" />
                <BilingualText en={jobsEn(rf.labelKey)} el={jobsEl(rf.labelKey)} compact />
              </button>
            );
          })}
        </div>
        {/* Employment type tabs */}
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setEmploymentType(t.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                employmentType === t.value
                  ? 'border-primary bg-primary/15 text-primary-accessible'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              <BilingualText en={jobsEn(t.labelKey)} el={jobsEl(t.labelKey)} compact />
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="icon-xl text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <BilingualText en={jobsEn('load_failed')} el={jobsEl('load_failed')} compact />
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <BilingualText en={jobsEn('try_again')} el={jobsEl('try_again')} compact />
          </Button>
        </CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          illustration="rocket"
          title={<BilingualText en={jobsEn(search ? 'empty_search' : 'empty')} el={jobsEl(search ? 'empty_search' : 'empty')} />}
          description={<BilingualText en={jobsEn(search ? 'empty_search_hint' : 'empty_hint')} el={jobsEl(search ? 'empty_search_hint' : 'empty_hint')} />}
          askAiPrompt={
            search
              ? `No jobs matched "${search}". Suggest better keywords or people I should reach instead of a job post.`
              : 'Help me write a cofounder or early-hire job post based on my profile gaps.'
          }
          action={
            !search ? (
              <Button className="gap-2" onClick={() => setShowPostForm(true)}>
                <Plus className="icon-sm" />
                <BilingualText en={jobsEn('post_job')} el={jobsEl('post_job')} compact />
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setSearch('')}>
                <BilingualText en={jobsEn('clear_search')} el={jobsEl('clear_search')} compact />
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            <BilingualText
              en={`${filtered.length === 1 ? jobsEn('found_one') : jobsEn('found_many').replace('{n}', String(filtered.length))}${remoteJobs.length > 0 ? ` · ${jobsEn('remote_suffix').replace('{n}', String(remoteJobs.length))}` : ''}`}
              el={`${filtered.length === 1 ? jobsEl('found_one') : jobsEl('found_many').replace('{n}', String(filtered.length))}${remoteJobs.length > 0 ? ` · ${jobsEl('remote_suffix').replace('{n}', String(remoteJobs.length))}` : ''}`}
              compact
            />
          </p>

          {/* Featured strip */}
          {featuredJobs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="icon-sm text-primary-accessible" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <BilingualText en={jobsEn('featured')} el={jobsEl('featured')} compact />
                </h2>
              </div>
              {featuredJobs.map((job) => <JobCard key={job.id} job={job} featured />)}
            </section>
          )}

          {/* Remote jobs */}
          {remoteRest.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wifi className="icon-sm text-status-success" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <BilingualText en={jobsEn('remote_section')} el={jobsEl('remote_section')} compact />
                </h2>
              </div>
              {remoteRest.map((job) => <JobCard key={job.id} job={job} />)}
            </section>
          )}

          {onsiteRest.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="icon-sm text-status-info" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <BilingualText en={jobsEn('onsite_section')} el={jobsEl('onsite_section')} compact />
                </h2>
              </div>
              {onsiteRest.map((job) => <JobCard key={job.id} job={job} />)}
            </section>
          )}
        </div>
      )}
      </div>
    </AppShell>
    </>
  );
}
