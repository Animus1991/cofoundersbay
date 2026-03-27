'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Handshake,
  FileText,
  MapPin,
  Users,
  Plus,
  Search,
  ArrowRight,
  Coins,
  Building2,
  Check,
  X,
  Loader2,
  Bookmark,
  Clock,
  Rocket,
  TrendingUp,
  Globe,
  AlertCircle,
} from 'lucide-react';
import {
  listJobs, createJobPosting, type JobPostingView,
  listOpportunities, type OpportunityItem, type OpportunityType,
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type OppType = 'cofounder' | 'job' | 'freelance';
// Map OpportunityType → OppType for display
const OPP_TYPE_MAP: Record<OpportunityType, OppType> = {
  job: 'job',
  cofounder: 'cofounder',
  investment: 'freelance',
  partnership: 'cofounder',
  mentorship: 'cofounder',
  other: 'freelance',
};

interface Proposal {
  id: string;
  fromName: string;
  fromInitials: string;
  fromRole: string;
  scope: string;
  timeframe: string;
  compensation: string;
  status: 'pending' | 'accepted' | 'declined';
  date: string;
}



const DEMO_PROPOSALS: Proposal[] = [
  {
    id: 'p1',
    fromName: 'Alex Chen',
    fromInitials: 'AC',
    fromRole: 'Founder',
    scope: 'Co-develop an AI validation tool. You handle product & UX, I handle engineering.',
    timeframe: '6 months',
    compensation: '50/50 equity split',
    status: 'pending',
    date: '1d ago',
  },
  {
    id: 'p2',
    fromName: 'Maria Santos',
    fromInitials: 'MS',
    fromRole: 'Angel Investor',
    scope: '€50k angel investment in exchange for advisory role and board observer seat.',
    timeframe: 'Ongoing',
    compensation: '5% equity',
    status: 'pending',
    date: '3d ago',
  },
];

// ── Config maps ───────────────────────────────────────────────────────────────


// ── Sub-components ─────────────────────────────────────────────────────────────

const OPP_TYPE_DISPLAY: Record<OpportunityType, { label: string; className: string; icon: typeof Briefcase }> = {
  cofounder: { label: 'Co-founder', className: 'bg-indigo-500/20 text-indigo-700 border-indigo-500/20 dark:text-indigo-400', icon: Handshake },
  job: { label: 'Job', className: 'bg-primary/20 text-primary border-primary/20', icon: Building2 },
  investment: { label: 'Investment', className: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: Coins },
  partnership: { label: 'Partnership', className: 'bg-purple-500/20 text-purple-700 border-purple-500/20 dark:text-purple-400', icon: Users },
  mentorship: { label: 'Mentorship', className: 'bg-amber-500/20 text-amber-700 border-amber-500/20 dark:text-amber-400', icon: Rocket },
  other: { label: 'Other', className: 'bg-muted text-muted-foreground border-border/40', icon: FileText },
};

function OpportunityCard({ opportunity }: { opportunity: OpportunityItem }) {
  const { success } = useToast();
  const cfg = OPP_TYPE_DISPLAY[opportunity.type] ?? OPP_TYPE_DISPLAY.other;
  const initials = (opportunity.company ?? opportunity.title).slice(0, 2).toUpperCase();
  const postedAgo = new Date(opportunity.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const deadline = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl ring-2 ring-border/60">
              <AvatarFallback className="rounded-xl bg-primary/20 text-primary font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">{opportunity.title}</h3>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {opportunity.company && (
                  <span className="text-sm text-muted-foreground">{opportunity.company}</span>
                )}
                <Badge variant="outline" className={cn('text-[10px] px-1.5', cfg.className)}>
                  <cfg.icon className="mr-1 h-3 w-3" />
                  {cfg.label}
                </Badge>
                {opportunity.isRemote && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Remote</Badge>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {postedAgo}
          </span>
        </div>

        {opportunity.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{opportunity.description}</p>
        )}

        {opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {opportunity.tags.map((tag: string) => (
              <span key={tag} className="rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {opportunity.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {opportunity.location}
            </span>
          )}
          {deadline && opportunity.deadline && (
            <span className={cn(
              'flex items-center gap-1',
              (() => {
                const daysLeft = Math.ceil((new Date(opportunity.deadline as string).getTime() - Date.now()) / 86400000);
                return daysLeft <= 3 ? 'text-red-500 font-medium' : 'text-amber-600 dark:text-amber-400';
              })()
            )}>
              <AlertCircle className="h-3 w-3" />
              {(() => {
                const daysLeft = Math.ceil((new Date(opportunity.deadline as string).getTime() - Date.now()) / 86400000);
                return daysLeft <= 0 ? 'Expired' : daysLeft <= 3 ? `${daysLeft}d left!` : `Deadline: ${deadline}`;
              })()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {opportunity.createdBy.displayName}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          {opportunity.url ? (
            <Button size="sm" className="gap-1.5 text-xs" asChild>
              <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
                Apply Now <ArrowRight className="h-3 w-3" />
              </a>
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5 text-xs">
              Apply Now <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => success('Saved', `${opportunity.title} saved to bookmarks.`)}
          >
            <Bookmark className="h-3 w-3" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function JobCard({ job }: { job: JobPostingView }) {
  const { success } = useToast();
  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl ring-2 ring-border/60">
              <AvatarFallback className="rounded-xl bg-primary/20 text-primary font-bold text-sm">
                {job.creator.displayName[0]?.toUpperCase() ?? 'J'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">{job.title}</h3>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{job.creator.displayName}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 bg-primary/20 text-primary border-primary/20">
                  <Building2 className="mr-1 h-3 w-3" />
                  Job
                </Badge>
                {job.isRemote && (
                  <Badge variant="secondary" className="text-[10px]">Remote</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.role && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {job.role}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="gap-1.5 text-xs">
            Apply Now
            <ArrowRight className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => success('Saved', `${job.title} saved to bookmarks.`)}
          >
            <Bookmark className="h-3 w-3" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalCard({
  proposal,
  onAccept,
  onDecline,
}: {
  proposal: Proposal;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const isPending = proposal.status === 'pending';
  const PROPOSAL_STATUS: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
    accepted: { label: 'Accepted', className: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    declined: { label: 'Declined', className: 'bg-destructive/20 text-red-700 dark:text-destructive' },
  };
  const statusCfg = PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.pending;

  return (
    <Card className={cn('transition-all', !isPending && 'opacity-70')}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {proposal.fromInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{proposal.fromName}</p>
              <p className="text-xs text-muted-foreground">{proposal.fromRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-xs', statusCfg.className)}>
              {statusCfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{proposal.date}</span>
          </div>
        </div>

        <div className="rounded-xl bg-secondary/40 p-4 space-y-2">
          <p className="text-sm text-foreground leading-relaxed">{proposal.scope}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {proposal.timeframe}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {proposal.compensation}
            </span>
          </div>
        </div>

        {isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onAccept(proposal.id)}
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onDecline(proposal.id)}
            >
              <X className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PostOpportunityForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { success, error: showError } = useToast();
  const [form, setForm] = useState({
    title: '',
    role: '',
    location: '',
    isRemote: false,
    type: 'cofounder' as OpportunityType,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createJobPosting({
        title: form.title.trim(),
        role: form.role.trim() || undefined,
        location: form.location.trim() || undefined,
        isRemote: form.isRemote,
      }),
    onSuccess: () => {
      success('Posted!', 'Your opportunity is now live.');
      onCreated();
      onClose();
    },
    onError: (err) =>
      showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post an opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(OPP_TYPE_DISPLAY) as [OpportunityType, typeof OPP_TYPE_DISPLAY['job']][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('type', key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.type === key
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >
                  <cfg.icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="e.g. CTO Co-founder, Growth Lead"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role / function</label>
            <Input
              placeholder="e.g. Engineering, Marketing"
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
              disabled={form.isRemote}
              maxLength={120}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => set('isRemote', e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Remote
          </label>
        <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              className="gap-2"
              onClick={() => mutation.mutate()}
              disabled={!form.title.trim() || mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Post
            </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'listings' | 'jobs' | 'applications' | 'proposals'>('listings');
  const [search, setSearch] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [oppTypeFilter, setOppTypeFilter] = useState<OpportunityType | 'all'>('all');
  const [proposals, setProposals] = useState<Proposal[]>(DEMO_PROPOSALS);
  const [showPostForm, setShowPostForm] = useState(false);

  const { data: opportunitiesData, isLoading: oppLoading, isError: oppError, refetch: refetchOpp } = useQuery({
    queryKey: ['opportunities', { search, type: oppTypeFilter, isRemote: remoteOnly || undefined }],
    queryFn: () => listOpportunities({
      search: search.trim() || undefined,
      type: oppTypeFilter !== 'all' ? oppTypeFilter : undefined,
      isRemote: remoteOnly || undefined,
      limit: 50,
    }),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: jobsData, isLoading: jobsLoading, isError: jobsError, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs', { limit: 50 }],
    queryFn: () => listJobs({ limit: 50 }),
    staleTime: 60_000,
    retry: 1,
  });

  const opportunities = opportunitiesData?.opportunities ?? [];
  const pendingProposals = proposals.filter((p) => p.status === 'pending').length;

  const handleAcceptProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'accepted' as const } : p)),
    );
    success('Proposal accepted!', 'You can now message them to coordinate next steps.');
  };

  const handleDeclineProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'declined' as const } : p)),
    );
  };

  const tabs = [
    { key: 'listings' as const, label: 'Co-founder & Freelance', icon: Handshake },
    { key: 'jobs' as const, label: 'Jobs', icon: Briefcase },
    { key: 'applications' as const, label: 'My Applications', icon: FileText },
    { key: 'proposals' as const, label: 'Proposals', icon: Check, badge: pendingProposals },
  ];

  return (
    <>
      {showPostForm && (
        <PostOpportunityForm
          onClose={() => setShowPostForm(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
        />
      )}
      <AppShell
        title="Opportunities"
        description="Co-founder listings, jobs, freelance contracts, and collaboration proposals"
        actions={
          <Button className="gap-2" onClick={() => setShowPostForm(true)}>
            <Plus className="h-4 w-4" />
            Post opportunity
          </Button>
        }
      >
        <div className="space-y-5 pb-10">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Listings', value: opportunities.length || '50+', icon: Briefcase, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Remote Roles', value: opportunities.filter((o) => o.isRemote).length || '20+', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Co-founder', value: opportunities.filter((o) => o.type === 'cofounder').length || '15+', icon: Handshake, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Proposals', value: pendingProposals, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((s) => {
            const SIcon = s.icon;
            return (
              <Card key={s.label} className="shadow-sm border-border/50">
                <CardContent className="flex items-center gap-2.5 p-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                    <SIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-secondary/50 p-1 mb-6 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap',
                activeTab === key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            {/* Search + filter */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles, skills, companies…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {(['all', 'cofounder', 'job', 'investment', 'partnership', 'mentorship'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOppTypeFilter(t)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      oppTypeFilter === t
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
                <button
                  onClick={() => setRemoteOnly((v) => !v)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    remoteOnly
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >
                  Remote only
                </button>
              </div>
            </div>

            {oppError ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Failed to load opportunities.</p>
                <Button variant="secondary" size="sm" onClick={() => refetchOpp()}>Try again</Button>
              </CardContent></Card>
            ) : oppLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="flex gap-4 p-5">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </CardContent></Card>
              ))
            ) : opportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Handshake className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No opportunities found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters, or post the first opportunity.</p>
                <Button className="mt-4 gap-2" onClick={() => setShowPostForm(true)}>
                  <Plus className="h-4 w-4" />
                  Post opportunity
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">{opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'}</p>
                {opportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {jobsError ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Failed to load jobs.</p>
                <Button variant="secondary" size="sm" onClick={() => refetchJobs()}>Try again</Button>
              </CardContent></Card>
            ) : jobsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="flex gap-4 p-5">
                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : !jobsData?.jobs?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Briefcase className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No jobs posted yet</p>
                <p className="text-sm mt-1">Be the first to post a role in the community.</p>
                <Button className="mt-4 gap-2" onClick={() => setShowPostForm(true)}>
                  <Plus className="h-4 w-4" />
                  Post a job
                </Button>
              </div>
            ) : (
              (jobsData.jobs as JobPostingView[])
                .filter(
                  (j) =>
                    !search.trim() ||
                    j.title.toLowerCase().includes(search.toLowerCase()) ||
                    j.creator.displayName.toLowerCase().includes(search.toLowerCase()),
                )
                .map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        )}

        {/* Applications tab */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">Applications tracked here</p>
              <p className="text-sm mt-1">When you apply to listings or program applications, they appear here.</p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('listings')}>Browse Opportunities</Button>
                <Button size="sm" onClick={() => setActiveTab('jobs')}>Browse Jobs</Button>
              </div>
            </div>
          </div>
        )}

        {/* Proposals tab */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No proposals yet</p>
                <p className="text-sm mt-1">Collaboration proposals from other members will appear here.</p>
              </div>
            ) : (
              proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onAccept={handleAcceptProposal}
                  onDecline={handleDeclineProposal}
                />
              ))
            )}
          </div>
        )}
        </div>
      </AppShell>
    </>
  );
}
