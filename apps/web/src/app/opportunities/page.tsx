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
  Filter,
  ChevronDown,
  ArrowRight,
  Coins,
  Building2,
  Check,
  X,
  Loader2,
  Bookmark,
  Clock,
  Rocket,
} from 'lucide-react';
import { listJobs, createJobPosting, type JobPostingView } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type OppType = 'cofounder' | 'job' | 'freelance';

interface CofounderListing {
  id: string;
  title: string;
  orgName: string;
  orgInitials: string;
  type: OppType;
  description: string;
  skills: string[];
  location: string;
  compensation: string;
  stage: string;
  posted: string;
  applicants: number;
}

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

interface Application {
  id: string;
  opportunityTitle: string;
  orgName: string;
  orgInitials: string;
  type: OppType;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  appliedDate: string;
  message: string;
}

// ── Static demo data (co-founder / freelance listings) ──────────────────────

const DEMO_LISTINGS: CofounderListing[] = [
  {
    id: 'o1',
    title: 'CTO & Technical Co-founder',
    orgName: 'GreenTrack',
    orgInitials: 'GT',
    type: 'cofounder',
    description:
      'Looking for a technical co-founder to build our carbon tracking platform for SMBs. Must have experience with data pipelines and SaaS architecture.',
    skills: ['Python', 'React', 'AWS', 'Data Engineering'],
    location: 'Remote (EU timezone)',
    compensation: '25% equity + small salary after seed',
    stage: 'Pre-seed',
    posted: '2d ago',
    applicants: 8,
  },
  {
    id: 'o2',
    title: 'Growth Marketing Lead',
    orgName: 'FinLit AI',
    orgInitials: 'FL',
    type: 'job',
    description:
      "Join our Series A fintech startup to lead growth marketing. You'll own user acquisition, content strategy, and paid channels.",
    skills: ['Growth Hacking', 'SEO', 'Paid Ads', 'Analytics'],
    location: 'London, UK (Hybrid)',
    compensation: '£65–80k + 0.5% equity',
    stage: 'Series A',
    posted: '1d ago',
    applicants: 23,
  },
  {
    id: 'o3',
    title: 'Product Designer — Contract',
    orgName: 'Nomad Spaces',
    orgInitials: 'NS',
    type: 'freelance',
    description:
      '3-month contract to redesign our marketplace UX. Looking for someone with marketplace/platform design experience.',
    skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping'],
    location: 'Remote',
    compensation: '€80–100/hour',
    stage: 'MVP',
    posted: '5h ago',
    applicants: 5,
  },
  {
    id: 'o4',
    title: 'Full-stack Developer Co-founder',
    orgName: 'EduFlow',
    orgInitials: 'EF',
    type: 'cofounder',
    description:
      'EdTech startup seeking a full-stack developer to co-found. We have paying beta users and need to scale the platform.',
    skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'System Design'],
    location: 'Athens, Greece / Remote',
    compensation: '30% equity',
    stage: 'MVP with revenue',
    posted: '3d ago',
    applicants: 12,
  },
];

const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'a1',
    opportunityTitle: 'Frontend Lead — HealthSync',
    orgName: 'HealthSync',
    orgInitials: 'HS',
    type: 'job',
    status: 'reviewing',
    appliedDate: '3 days ago',
    message: 'I have 6 years of React experience and led frontend at two health-tech startups.',
  },
  {
    id: 'a2',
    opportunityTitle: 'Product Advisor — AgroTech',
    orgName: 'AgroTech',
    orgInitials: 'AT',
    type: 'cofounder',
    status: 'accepted',
    appliedDate: '1 week ago',
    message: 'Interested in offering advisory services based on my agri-tech background.',
  },
  {
    id: 'a3',
    opportunityTitle: 'Co-founder — AI Tutor',
    orgName: 'AI Tutor',
    orgInitials: 'AI',
    type: 'cofounder',
    status: 'pending',
    appliedDate: '1 day ago',
    message: 'Your vision for AI in education aligns with my 10-year experience in edtech.',
  },
];

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

const TYPE_CONFIG: Record<OppType, { label: string; className: string; icon: typeof Briefcase }> = {
  cofounder: { label: 'Co-founder', className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20', icon: Handshake },
  job: { label: 'Job', className: 'bg-primary/20 text-primary border-primary/20', icon: Building2 },
  freelance: { label: 'Freelance', className: 'bg-orange-500/20 text-orange-400 border-orange-500/20', icon: FileText },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  accepted: { label: 'Accepted', className: 'bg-emerald-500/20 text-emerald-400' },
  declined: { label: 'Declined', className: 'bg-destructive/20 text-destructive' },
  reviewing: { label: 'Under Review', className: 'bg-amber-500/20 text-amber-400' },
  rejected: { label: 'Rejected', className: 'bg-destructive/20 text-destructive' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: CofounderListing }) {
  const config = TYPE_CONFIG[listing.type];
  const { success } = useToast();

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl ring-2 ring-border/60">
              <AvatarFallback className="rounded-xl bg-primary/20 text-primary font-bold text-sm">
                {listing.orgInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                {listing.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{listing.orgName}</span>
                <Badge variant="outline" className={cn('text-[10px] px-1.5', config.className)}>
                  <config.icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{listing.stage}</Badge>
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {listing.posted}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {listing.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] text-secondary-foreground"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.location}
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {listing.compensation}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {listing.applicants} applicants
          </span>
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
            onClick={() => success('Saved', `${listing.title} saved to bookmarks.`)}
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
  const statusCfg = STATUS_CONFIG[proposal.status];

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
    type: 'cofounder' as OppType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Post an opportunity</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(TYPE_CONFIG) as [OppType, typeof TYPE_CONFIG['job']][]).map(([key, cfg]) => (
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
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => mutation.mutate()}
              disabled={!form.title.trim() || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Post
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ApplicationCard({ application }: { application: Application }) {
  const config = TYPE_CONFIG[application.type];
  const statusCfg = STATUS_CONFIG[application.status];
  return (
    <Card className={cn('transition-all', application.status === 'rejected' && 'opacity-60')}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-xs font-bold">
                {application.orgInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{application.opportunityTitle}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{application.orgName}</span>
                <Badge variant="outline" className={cn('text-[10px] px-1.5', config.className)}>
                  <config.icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="secondary" className={cn('text-xs', statusCfg.className)}>
              {statusCfg.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{application.appliedDate}</span>
          </div>
        </div>
        <div className="rounded-lg bg-secondary/40 px-3 py-2.5">
          <p className="text-xs text-foreground/80 leading-relaxed italic">&ldquo;{application.message}&rdquo;</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'listings' | 'jobs' | 'applications' | 'proposals'>('listings');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OppType | 'all'>('all');
  const [proposals, setProposals] = useState<Proposal[]>(DEMO_PROPOSALS);
  const [showPostForm, setShowPostForm] = useState(false);

  const { data: jobsData, isLoading: jobsLoading, isError: jobsError, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs', { limit: 50 }],
    queryFn: () => import('@/lib/api').then((m) => m.listJobs({ limit: 50 })),
    staleTime: 60_000,
    retry: 1,
  });

  const filteredListings = DEMO_LISTINGS.filter((o) => {
    const matchSearch =
      !search.trim() ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.orgName.toLowerCase().includes(search.toLowerCase()) ||
      o.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === 'all' || o.type === typeFilter;
    return matchSearch && matchType;
  });

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
              <div className="flex gap-2 flex-wrap">
                {(['all', 'cofounder', 'job', 'freelance'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      typeFilter === t
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {t === 'all' ? 'All types' : TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Handshake className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No opportunities found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
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
            {DEMO_APPLICATIONS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No applications yet</p>
                <p className="text-sm mt-1">Apply to listings and jobs to track them here.</p>
              </div>
            ) : (
              DEMO_APPLICATIONS.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))
            )}
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
      </AppShell>
    </>
  );
}
