'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listPrograms, deleteProgram, type ProgramItem } from '@/lib/api';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import {
  Award,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Users,
  Calendar,
  Building2,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

type Program = {
  /** Set on live rows; the owning organisation's own programs page. */
  orgSlug?: string;
  description?: string;
  id: string;
  name: string;
  organization: string;
  type: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startups: number;
  mentors: number;
  startDate: string;
  endDate: string;
  progress: number;
};

const PROGRAM_STATUS_TONE: Record<Program['status'], StatusTone> = {
  draft: 'neutral',
  active: 'success',
  completed: 'info',
  archived: 'warning',
};

/** Month and year, in the page's existing "Jan 2025" style. */
function monthYear(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Share of the programme's calendar that has elapsed, for the progress bar. */
function elapsed(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!(b > a)) return 0;
  return Math.round(Math.min(1, Math.max(0, (Date.now() - a) / (b - a))) * 100);
}

function toProgram(p: ProgramItem): Program {
  const known: Program['status'][] = ['draft', 'active', 'completed', 'archived'];
  return {
    id: p.id,
    name: p.title,
    organization: p.organization?.name ?? '\u2014',
    orgSlug: p.organization?.slug,
    description: p.description ?? undefined,
    type: p.programType,
    status: known.includes(p.status as Program['status']) ? (p.status as Program['status']) : 'draft',
    startups: p.participantCount ?? 0,
    mentors: 0,
    startDate: monthYear(p.startDate),
    endDate: monthYear(p.endDate),
    progress: elapsed(p.startDate, p.endDate),
  };
}

function ProgramCard({
  program,
  onView,
  onArchive,
}: {
  program: Program;
  onView: (p: Program) => void;
  onArchive: (p: Program) => void;
}) {
  const statusColors = STATUS[PROGRAM_STATUS_TONE[program.status]];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{program.name}</span>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                {program.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="icon-sm" aria-hidden="true" />
              {program.organization}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{program.type}</Badge>
              <span className="flex items-center gap-1">
                <Users className="icon-sm" aria-hidden="true" />
                {program.startups} startups
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {program.startDate} - {program.endDate}
              </span>
            </div>
            {program.status === 'active' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-2" />
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* The three items here had no handler. */}
              <DropdownMenuItem onSelect={() => onView(program)}>
                <Eye className="mr-2 icon-sm" aria-hidden="true" />
                View Details
              </DropdownMenuItem>
              {program.orgSlug ? (
                <DropdownMenuItem asChild>
                  <Link href={`/org/${program.orgSlug}/admin`}>
                    <Edit className="mr-2 icon-sm" aria-hidden="true" />
                    Edit in {program.organization}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <UnavailableMenuItem
                  icon={<Edit className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />}
                  en="Edit Program"
                  el="Επεξεργασία προγράμματος"
                  reasonEn="A sample row - live programs are edited by their organisation."
                  reasonEl="Δείγμα - τα πραγματικά προγράμματα τα επεξεργάζεται ο οργανισμός τους."
                />
              )}
              {program.status !== 'archived' && (
                <DropdownMenuItem className="text-destructive-accessible" onSelect={() => onArchive(program)}>
                  <Trash2 className="mr-2 icon-sm" aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminProgramsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const [viewing, setViewing] = useState<Program | null>(null);

  // Programs are public reads; the list was a fixed array dated 2025 while
  // GET /programs served every organisation's programmes.
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'programs'],
    queryFn: () => listPrograms({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });
  const live = useMemo(() => (Array.isArray(data?.programs) ? data.programs : []).map(toProgram), [data]);
  const showingSample = !isLoading && live.length === 0;

  const archive = async (p: Program) => {
    if (!p.orgSlug) {
      toastError('Nothing to archive', 'This is a sample row until the programs API returns programmes.');
      return;
    }
    const ok = await confirm({
      title: `Archive ${p.name}?`,
      description: 'The programme stops taking applications and leaves active lists. Archived programmes stay readable.',
      confirmLabel: 'Archive',
    });
    if (!ok) return;
    try {
      await deleteProgram(p.id);
      success('Programme archived', p.name);
    } catch (err) {
      // The service allows this only to members of the owning organisation
      // (ProgramService.delete -> checkMemberAccess), so say which rule it was.
      toastError(
        'Could not archive the programme',
        err instanceof Error && /403|forbidden|member/i.test(err.message)
          ? `Only members of ${p.organization} can archive it.`
          : err instanceof Error ? err.message : undefined,
      );
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] });
    }
  };

  const sample: Program[] = [
    { id: '1', name: 'Spring Accelerator 2025', organization: 'TechHub', type: 'Accelerator', status: 'active', startups: 12, mentors: 8, startDate: 'Jan 2025', endDate: 'Apr 2025', progress: 65 },
    { id: '2', name: 'AI Innovation Lab', organization: 'AI Ventures', type: 'Innovation Lab', status: 'active', startups: 8, mentors: 5, startDate: 'Feb 2025', endDate: 'Aug 2025', progress: 30 },
    { id: '3', name: 'Pre-seed Bootcamp', organization: 'StartupU', type: 'Bootcamp', status: 'active', startups: 8, mentors: 4, startDate: 'Mar 2025', endDate: 'Mar 2025', progress: 90 },
    { id: '4', name: 'Fall Accelerator 2024', organization: 'TechHub', type: 'Accelerator', status: 'completed', startups: 10, mentors: 8, startDate: 'Sep 2024', endDate: 'Dec 2024', progress: 100 },
    { id: '5', name: 'FinTech Incubator', organization: 'FinLab', type: 'Incubator', status: 'active', startups: 6, mentors: 4, startDate: 'Jan 2025', endDate: 'Jul 2025', progress: 45 },
  ];
  const programs: Program[] = live.length > 0 ? live : isLoading ? [] : sample;

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.organization.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {showingSample && (
          <SampleDataNotice
            surface="Programs"
            detail="The programs API returned no programmes, so these rows show the layout. Live programmes appear here as organisations create them."
            askAiPrompt="Why does the admin programs page show sample programmes?"
          />
        )}
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Status" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Programs</p>
              <p className="text-xl font-bold">{programs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className={cn('text-xl font-bold', STATUS.success.text)}>
                {programs.filter((p) => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Startups</p>
              <p className="text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.startups, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Organizations</p>
              <p className="text-xl font-bold">
                {new Set(programs.map((p) => p.organization)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Programs List */}
        <div className="space-y-3">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} onView={setViewing} onArchive={archive} />
          ))}
          {filteredPrograms.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="font-medium">No programs found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={viewing !== null} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>{viewing?.organization} · {viewing?.type}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{viewing.status}</dd>
              <dt className="text-muted-foreground">Dates</dt>
              <dd>{viewing.startDate} – {viewing.endDate}</dd>
              <dt className="text-muted-foreground">Startups</dt>
              <dd>{viewing.startups}</dd>
              <dt className="text-muted-foreground">Calendar elapsed</dt>
              <dd>{viewing.progress}%</dd>
              {viewing.description && (
                <>
                  <dt className="col-span-2 text-muted-foreground">Description</dt>
                  <dd className="col-span-2 whitespace-pre-line">{viewing.description}</dd>
                </>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
