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

function JobCard({ job }: { job: JobPostingView }) {
  return (
    <Card className="card-interactive hover-lift group">
      <CardContent className="flex items-start gap-4 p-5">
        {/* Company avatar */}
        <Avatar className="h-11 w-11 shrink-0 rounded-xl ring-2 ring-border/60">
          <AvatarImage src={job.creator.avatarUrl ?? undefined} />
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
            {job.creator.displayName[0]?.toUpperCase() ?? 'J'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground">{job.creator.displayName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.role && (
                <Badge variant="secondary" className="text-xs">
                  {job.role}
                </Badge>
              )}
              {job.isRemote && (
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-500 bg-green-500/10">
                  <Wifi className="mr-1 h-3 w-3" />
                  Remote
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
            {!job.location && !job.isRemote && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Location not specified
              </span>
            )}
          </div>
        </div>

        <Link href={job.href ?? `/jobs`} className="shrink-0">
          <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Button>
        </Link>
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
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
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
  const [showPostForm, setShowPostForm] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => listJobs({ limit: 50 }),
    staleTime: 60_000,
    retry: 1,
  });

  const jobs = data?.jobs ?? [];
  const filtered = search.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.role?.toLowerCase().includes(search.toLowerCase()) ||
          j.creator.displayName.toLowerCase().includes(search.toLowerCase()) ||
          j.location?.toLowerCase().includes(search.toLowerCase()),
      )
    : jobs;

  const remoteJobs = filtered.filter((j) => j.isRemote);
  const onsiteJobs = filtered.filter((j) => !j.isRemote);

  return (
    <>
    {showPostForm && (
      <PostJobForm
        onClose={() => setShowPostForm(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
      />
    )}
    <AppShell
      title="Jobs"
      description="Opportunities from startups in the CoFounderBay ecosystem"
      actions={
        <Button className="gap-2" onClick={() => setShowPostForm(true)}>
          <Plus className="h-4 w-4" />
          Post a job
        </Button>
      }
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search jobs, roles, companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isError ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
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
                <Plus className="h-4 w-4" />
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
          {/* Stats bar */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{filtered.length}</strong> openings
            </span>
            {remoteJobs.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-green-500" />
                <strong className="text-foreground">{remoteJobs.length}</strong> remote
              </span>
            )}
            {onsiteJobs.length > 0 && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <strong className="text-foreground">{onsiteJobs.length}</strong> on-site
              </span>
            )}
          </div>

          {/* Remote jobs first */}
          {remoteJobs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Remote opportunities
              </h2>
              {remoteJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </section>
          )}

          {onsiteJobs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                On-site / hybrid
              </h2>
              {onsiteJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </section>
          )}
        </div>
      )}
    </AppShell>
    </>
  );
}
