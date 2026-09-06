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
  X,
  Loader2,
  AlertCircle,
  Star,
  DollarSign,
  Clock,
  Filter,
  TrendingUp,
  Code2,
  Megaphone,
  Palette,
  Scale,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  BadgeCheck,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const ROLE_FILTERS = [
  { value: 'all',         label: 'All',          icon: Briefcase },
  { value: 'engineering', label: 'Engineering',   icon: Code2     },
  { value: 'marketing',   label: 'Marketing',    icon: Megaphone },
  { value: 'design',      label: 'Design',       icon: Palette   },
  { value: 'legal',       label: 'Legal',        icon: Scale     },
  { value: 'analytics',   label: 'Analytics',    icon: BarChart3 },
  { value: 'operations',  label: 'Operations',   icon: Users     },
] as const;
type RoleFilter = typeof ROLE_FILTERS[number]['value'];

const EMPLOYMENT_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Co-founder', 'Advisor'] as const;

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
                {job.isRemote && (
                  <Badge variant="outline" className="text-xs border-status-success-border text-status-success bg-status-success-bg">
                    <Wifi className="mr-1 icon-sm" />Remote
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="icon-sm" />{job.location}</span>
              )}
              {!job.location && !job.isRemote && (
                <span className="flex items-center gap-1"><Building2 className="icon-sm" />Location not specified</span>
              )}
              <span className="flex items-center gap-1"><Clock className="icon-sm" />Full-time</span>
              <span className="flex items-center gap-1 text-status-success">
                <DollarSign className="icon-sm" />Equity available
              </span>
            </div>
          </div>

          <Link href={job.href ?? `/jobs`} className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity h-8">
              <ExternalLink className="icon-sm" />View
            </Button>
          </Link>
        </div>

        {/* Skills footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {['React', 'TypeScript', 'Node.js'].slice(0, 3).map((skill) => (
              <span key={skill} className="rounded-md bg-muted px-2 py-0.5 text-2xs text-muted-foreground">{skill}</span>
            ))}
          </div>
          <span className="text-2xs text-muted-foreground">Posted today</span>
        </div>
      </CardContent>
    </Card>
  );
}

function JobSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
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
      success('Job posted!', 'Your opportunity is now live.');
      onCreated();
      onClose();
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post a job</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Job title *</label>
            <Input
              placeholder="e.g. Full-Stack Engineer (equity)"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role / function</label>
            <Input
              placeholder="e.g. Engineering, Marketing, Design"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Location</label>
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
            Remote position
          </label>
        <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              className="gap-2"
              onClick={() => mutation.mutate()}
              disabled={!form.title.trim() || mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="icon-sm animate-spin" /> : <Briefcase className="icon-sm" />}
              Post job
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
  const [employmentType, setEmploymentType] = useState<string>('All');
  const [showPostForm, setShowPostForm] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['jobs'],
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
    return matchSearch && matchRole;
  });

  const remoteJobs = filtered.filter((j) => j.isRemote);
  const onsiteJobs = filtered.filter((j) => !j.isRemote);
  const featuredJobs = filtered.slice(0, 3);

  return (
    <>
    {showPostForm && (
      <PostJobForm
        onClose={() => setShowPostForm(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
      />
    )}
    <AppShell
      title="Jobs & Roles"
      description="Equity & early-stage opportunities from startups in the CoFounderBay ecosystem"
      actions={
        <Button className="gap-2" onClick={() => setShowPostForm(true)}>
          <Plus className="icon-sm" />
          Post a Role
        </Button>
      }
    >
      <div className="space-y-5 pb-10">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Roles', value: jobs.length || '25+', icon: Briefcase, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
          { label: 'Remote-First', value: remoteJobs.length || '12+', icon: Wifi, color: 'text-status-success', bg: 'bg-status-success-bg' },
          { label: 'Startups Hiring', value: new Set(jobs.map((j) => j.creator.displayName)).size || '8+', icon: Zap, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
        ].map((s) => {
          const SIcon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm border-border/50">
              <CardContent className="flex items-center gap-3 p-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                  <SIcon className="icon-sm" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{s.label}</p>
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
            placeholder="Search jobs, roles, companies…"
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
                <RIcon className="icon-sm" />{rf.label}
              </button>
            );
          })}
        </div>
        {/* Employment type tabs */}
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setEmploymentType(t)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                employmentType === t
                  ? 'border-primary bg-primary/15 text-primary-accessible'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >{t}</button>
          ))}
        </div>
      </div>

      {isError ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="icon-xl text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Failed to load jobs. Please check your connection.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
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
          title={search ? 'No jobs match your search' : 'No jobs posted yet'}
          description={
            search
              ? 'Try a different keyword or clear the search.'
              : 'Be the first to post an opportunity for the community.'
          }
          action={
            !search ? (
              <Button className="gap-2" onClick={() => {}}>
                <Plus className="icon-sm" />
                Post a job
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setSearch('')}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            {filtered.length} role{filtered.length !== 1 ? 's' : ''} found
            {remoteJobs.length > 0 && ` · ${remoteJobs.length} remote`}
          </p>

          {/* Featured strip */}
          {!search && roleFilter === 'all' && featuredJobs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="icon-sm text-primary-accessible" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Featured Roles</h2>
              </div>
              {featuredJobs.map((job) => <JobCard key={job.id} job={job} featured />)}
            </section>
          )}

          {/* Remote jobs */}
          {remoteJobs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wifi className="icon-sm text-status-success" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Remote Opportunities</h2>
              </div>
              {remoteJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </section>
          )}

          {onsiteJobs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="icon-sm text-status-info" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">On-site / Hybrid</h2>
              </div>
              {onsiteJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </section>
          )}
        </div>
      )}
      </div>
    </AppShell>
    </>
  );
}
