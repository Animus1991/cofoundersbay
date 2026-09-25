'use client';

import { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Star,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import {
  getMyPrograms,
  getProgramParticipants,
  updateProgramParticipant,
  type ProgramParticipantItem,
} from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyOrgApplications } from '@/components/common/EmptyStates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

/**
 * An application is a program participant whose status says so.
 *
 * `/api/programs/:id/participants` and its PATCH sibling have existed all
 * along. The endpoint also returned a bare array while the client declared
 * `{ participants }`, so even a page that had called it would have read
 * undefined — fixed on the API side in the same change as this.
 *
 * `applied` and `accepted` are the schema's words; the page's vocabulary is
 * wider than the schema's, so `under_review` and `shortlisted` have no
 * counterpart yet and nothing is mapped onto them.
 */
const PARTICIPANT_TO_APPLICATION: Record<string, Application['status']> = {
  applied: 'pending',
  accepted: 'accepted',
  active: 'accepted',
  completed: 'accepted',
  rejected: 'rejected',
  dropped: 'rejected',
};

function toApplication(
  row: ProgramParticipantItem,
  programTitle: string,
  programId: string,
): Application & { programId: string } {
  return {
    id: row.id,
    programId,
    startupName: row.user.profile?.displayName ?? 'Unnamed applicant',
    founderName: row.user.profile?.displayName ?? '\u2014',
    founderAvatar: row.user.profile?.avatarUrl ?? undefined,
    program: programTitle,
    industry: row.user.profile?.headline ?? '\u2014',
    stage: row.role ?? '\u2014',
    submittedAt: row.appliedAt,
    status: PARTICIPANT_TO_APPLICATION[row.status] ?? 'pending',
    score: row.score ?? undefined,
  };
}

type Application = {
  id: string;
  startupName: string;
  logoUrl?: string;
  founderName: string;
  founderAvatar?: string;
  program: string;
  industry: string;
  stage: string;
  submittedAt: string;
  status: 'pending' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
  score?: number;
  reviewedBy?: string;
};

type ApplicationStatus = Application['status'];

const APPLICATION_STATUS: Record<ApplicationStatus, { tone: StatusTone; icon: React.ElementType }> = {
  pending: { tone: 'neutral', icon: Clock },
  under_review: { tone: 'warning', icon: Eye },
  shortlisted: { tone: 'info', icon: Star },
  accepted: { tone: 'success', icon: CheckCircle2 },
  rejected: { tone: 'danger', icon: XCircle },
};

type DecideFn = (application: Application, status: 'accepted' | 'rejected') => void;

function ApplicationCard({
  onReview,
  application,
  onDecide,
}: {
  application: Application;
  /** Absent for the illustrative rows, which have nothing to write to. */
  onDecide?: DecideFn;
  /** Opens the review dialog; the row title and the menu item both use it. */
  onReview: (application: Application) => void;
}) {
  const config = APPLICATION_STATUS[application.status];
  const statusColors = STATUS[config.tone];
  const StatusIcon = config.icon;
  const initials = application.startupName?.[0]?.toUpperCase() ?? '?';

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="icon-md rounded-lg">
            <AvatarImage src={application.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                {/* Linked to /org/applications/:id, a route that never existed. */}
                <button
                  type="button"
                  onClick={() => onReview(application)}
                  className="text-left font-medium hover:text-primary-accessible transition-colors"
                >
                  {application.startupName}
                </button>
                <p className="text-sm text-muted-foreground">
                  by {application.founderName} · {application.industry}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs flex items-center gap-1 border', statusColors.chip)}>
                  <StatusIcon className="icon-sm" />
                  {application.status.replace('_', ' ')}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" variant="ghost" size="icon">
                      <MoreVertical className="icon-sm" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onReview(application)}>Review Application</DropdownMenuItem>
                    {/*
                      * "Mark as Shortlisted" and "Schedule Interview" are gone
                      * rather than left inert: the participant status enum has
                      * no shortlisted state and there is no interview to
                      * schedule against. Accept and Reject write the two
                      * statuses that do exist.
                      */}
                    <DropdownMenuItem
                      className={STATUS.success.text}
                      disabled={!onDecide || application.status === 'accepted'}
                      onClick={() => onDecide?.(application, 'accepted')}
                    >
                      Accept
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive-accessible"
                      disabled={!onDecide || application.status === 'rejected'}
                      onClick={() => onDecide?.(application, 'rejected')}
                    >
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
              <span>{application.program}</span>
              <span>{application.stage}</span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {application.submittedAt}
              </span>
              {application.score !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className={cn('icon-sm', STATUS.warning.icon)} />
                  Score: {application.score}/100
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown to an organisation with no applications yet. */
const SEED_APPLICATIONS: Application[] = [
  {
    id: '1',
    startupName: 'DataVault',
    founderName: 'Alex Johnson',
    program: 'AI Accelerator 2025',
    industry: 'Enterprise SaaS',
    stage: 'Pre-seed',
    submittedAt: 'Mar 18, 2025',
    status: 'pending',
  },
  {
    id: '2',
    startupName: 'EcoTrack',
    founderName: 'Maria Garcia',
    program: 'Climate Innovation',
    industry: 'CleanTech',
    stage: 'Seed',
    submittedAt: 'Mar 17, 2025',
    status: 'under_review',
    score: 78,
  },
  {
    id: '3',
    startupName: 'HealthPulse',
    founderName: 'James Chen',
    program: 'AI Accelerator 2025',
    industry: 'HealthTech',
    stage: 'Pre-seed',
    submittedAt: 'Mar 15, 2025',
    status: 'shortlisted',
    score: 85,
  },
  {
    id: '4',
    startupName: 'PayStream',
    founderName: 'Sarah Williams',
    program: 'FinTech Bootcamp',
    industry: 'FinTech',
    stage: 'Seed',
    submittedAt: 'Mar 10, 2025',
    status: 'accepted',
    score: 92,
  },
  {
    id: '5',
    startupName: 'QuickShip',
    founderName: 'Tom Brown',
    program: 'AI Accelerator 2025',
    industry: 'Logistics',
    stage: 'Idea',
    submittedAt: 'Mar 8, 2025',
    status: 'rejected',
    score: 45,
  },
];

export default function OrgApplicationsPage() {
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Mock data
  /*
   * Applications are participants at `applied`, across the organisation's
   * programs. One request per program because the endpoint is scoped to a
   * program — `useQueries` keeps them parallel and independently cached.
   * The illustrative rows below are what an organisation with no
   * applications sees; they carry no decision handler, because there is
   * nothing behind them to write to.
   */
  const { slug } = useCurrentOrg();
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: programsData } = useQuery({
    queryKey: ['programs', 'mine'],
    queryFn: getMyPrograms,
    staleTime: 60_000,
    retry: 0,
  });
  const programs = useMemo(() => programsData?.programs ?? [], [programsData]);

  const participantQueries = useQueries({
    queries: programs.map((program) => ({
      queryKey: ['org', 'participants', program.id],
      queryFn: () => getProgramParticipants(program.id),
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const live = useMemo(
    () =>
      participantQueries.flatMap((query, index) => {
        const program = programs[index];
        if (!program) return [];
        return (query.data?.participants ?? []).map((row) =>
          toApplication(row, program.title, program.id),
        );
      }),
    [participantQueries, programs],
  );

  const decide = useMutation({
    mutationFn: ({
      programId,
      participantId,
      status,
    }: {
      programId: string;
      participantId: string;
      status: 'accepted' | 'rejected';
    }) => updateProgramParticipant(programId, participantId, { status }),
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({ queryKey: ['org', 'participants', variables.programId] });
      success(variables.status === 'accepted' ? 'Application accepted' : 'Application rejected');
    },
    onError: (err) =>
      showError('Could not record the decision', err instanceof Error ? err.message : undefined),
  });

  const [reviewing, setReviewing] = useState<Application | null>(null);

  const onDecide: DecideFn = (application, status) => {
    const programId = (application as Application & { programId?: string }).programId;
    if (!programId) return;
    decide.mutate({ programId, participantId: application.id, status });
  };

  const isLive = live.length > 0;
  const applications: Application[] = isLive ? live : SEED_APPLICATIONS;
  void slug;


  const filteredApplications = applications.filter((a) => {
    const matchesSearch =
      !search ||
      a.startupName.toLowerCase().includes(search.toLowerCase()) ||
      a.founderName.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = program === 'all' || a.program === program;
    const matchesTab = activeTab === 'all' || a.status === activeTab;
    return matchesSearch && matchesProgram && matchesTab;
  });

  /** Program names present in the rows on screen, for the filter. */
  const programNames = [...new Set(applications.map((a) => a.program))];

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const filtersActive = !!search || program !== 'all' || activeTab !== 'all';
  const clearFilters = () => { setSearch(''); setProgram('all'); setActiveTab('all'); };

  return (
    <AppShell
      title="Applications"
      description="Review and score startup applications across all your open programs."
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{statusCounts.all}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className={cn('text-xl font-bold', STATUS.neutral.icon)}>{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className={cn('text-xl font-bold', STATUS.warning.icon)}>{statusCounts.under_review}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Shortlisted</p>
              <p className={cn('text-xl font-bold', STATUS.info.icon)}>{statusCounts.shortlisted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className={cn('text-xl font-bold', STATUS.success.icon)}>{statusCounts.accepted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="under_review">In Review ({statusCounts.under_review})</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlisted ({statusCounts.shortlisted})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger aria-label="Program" className="w-full sm:w-[200px]">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programNames.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onDecide={isLive ? onDecide : undefined}
              onReview={setReviewing}
            />
          ))}
          {filteredApplications.length === 0 && (
            <EmptyOrgApplications filtersActive={filtersActive} onClearFilters={clearFilters} />
          )}
        </div>
      </div>
      <Dialog open={reviewing !== null} onOpenChange={(o) => { if (!o) setReviewing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reviewing?.startupName}</DialogTitle>
            <DialogDescription>
              {reviewing ? `by ${reviewing.founderName} · ${reviewing.program}` : ''}
            </DialogDescription>
          </DialogHeader>
          {reviewing && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{reviewing.status.replace('_', ' ')}</dd>
              <dt className="text-muted-foreground">Industry</dt>
              <dd>{reviewing.industry || '\u2014'}</dd>
              <dt className="text-muted-foreground">Stage</dt>
              <dd>{reviewing.stage || '\u2014'}</dd>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{reviewing.submittedAt}</dd>
              {reviewing.score != null && (
                <>
                  <dt className="text-muted-foreground">Score</dt>
                  <dd>{reviewing.score}</dd>
                </>
              )}
            </dl>
          )}
          <DialogFooter className="gap-2">
            {reviewing && isLive ? (
              <>
                <Button
                  variant="outline"
                  disabled={reviewing.status === 'rejected'}
                  onClick={() => { onDecide(reviewing, 'rejected'); setReviewing(null); }}
                >
                  Reject
                </Button>
                <Button
                  disabled={reviewing.status === 'accepted'}
                  onClick={() => { onDecide(reviewing, 'accepted'); setReviewing(null); }}
                >
                  Accept
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sample application - decisions write only to live applications.</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
