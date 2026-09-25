'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Calendar,
  Users,
  ChevronRight,
  MoreVertical,
  Settings,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { listOrganizationPrograms, updateProgram, type ProgramItem } from '@/lib/api';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyOrgPrograms } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { qk } from '@/lib/query-keys';
import { rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import { useDemoData } from '@/contexts/DemoDataContext';

/**
 * The page's own row from the API row.
 *
 * `/api/programs` and its controller have existed all along — the page simply
 * never called them, so it showed a fixed array while real programs sat in the
 * database. Enrolment is `participantCount`, which the API already counts.
 */
function toPageProgram(item: ProgramItem): Program {
  return {
    id: item.id,
    name: item.title,
    type: item.programType,
    status: (['draft', 'upcoming', 'active', 'completed', 'archived'] as const).includes(
      item.status as Program['status'],
    )
      ? (item.status as Program['status'])
      : 'draft',
    startDate: item.startDate ?? undefined,
    endDate: item.endDate ?? undefined,
    capacity: item.capacity ?? 0,
    enrolled: item.participantCount,
    description: item.description ?? undefined,
  };
}

type Program = {
  id: string;
  name: string;
  type: string;
  // The schema's five (ProgramStatus). "upcoming" was missing, so a program
  // taking applications for next season was shown as a draft.
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  capacity: number;
  enrolled: number;
  description?: string;
};

const ORG_PROGRAM_STATUS_TONE: Record<Program['status'], StatusTone> = {
  draft: 'neutral',
  upcoming: 'info',
  active: 'success',
  completed: 'neutral',
  archived: 'warning',
};

const STATUS_LABEL: Record<Program['status'], string> = {
  draft: 'Draft',
  upcoming: 'Upcoming',
  active: 'Running',
  completed: 'Completed',
  archived: 'Archived',
};

/** "7 Sep 2026": the API sends ISO timestamps, which the card printed as they came. */
function programDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProgramCard({ program }: { program: Program }) {
  /*
   * "Archive" was a menu item with no handler. It writes the status the API
   * already accepts, and the list refreshes from the server rather than from
   * a local guess about what happened.
   */
  const qc = useQueryClient();
  const { success, error: showError } = useToast();
  const archive = useMutation({
    mutationFn: () => updateProgram(program.id, { status: 'archived' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk('programs') });
      success('Program archived');
    },
    onError: (err) =>
      showError('Could not archive the program', err instanceof Error ? err.message : undefined),
  });

  const statusColors = STATUS[ORG_PROGRAM_STATUS_TONE[program.status]];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/programs/${program.id}`} className="font-semibold hover:text-primary-accessible transition-colors">
                {program.name}
              </Link>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                {STATUS_LABEL[program.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{program.type}</p>
            {program.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{program.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              {program.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="icon-sm" aria-hidden="true" />
                  {programDate(program.startDate)} – {program.endDate ? programDate(program.endDate) : 'Ongoing'}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="icon-sm" aria-hidden="true" />
                {program.enrolled}/{program.capacity} enrolled
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon">
                <MoreVertical className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/programs/${program.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/tenant/programs">Edit Program</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/org/applications">Manage Participants</Link>
              </DropdownMenuItem>
              {/*
                * "Duplicate" is gone rather than left inert: there is no
                * create-from-existing route, and a menu item that does nothing
                * is worse than one that is not offered. The page's own "New
                * program" button is the path that works.
                */}
              <DropdownMenuItem
                className="text-destructive-accessible"
                disabled={archive.isPending || program.status === 'archived'}
                onClick={() => archive.mutate()}
              >
                {program.status === 'archived' ? 'Archived' : 'Archive'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown to an organisation that has not created a program yet. */
const SEED_PROGRAMS: Program[] = [
  {
    id: '1',
    name: 'AI Accelerator 2025',
    type: 'Accelerator',
    status: 'active',
    startDate: 'Jan 2025',
    endDate: 'Apr 2025',
    capacity: 15,
    enrolled: 12,
    description: 'Intensive 12-week program for AI/ML startups',
  },
  {
    id: '2',
    name: 'FinTech Bootcamp',
    type: 'Bootcamp',
    status: 'draft',
    startDate: 'Apr 2025',
    endDate: 'Jun 2025',
    capacity: 20,
    enrolled: 0,
    description: '8-week fintech innovation program',
  },
  {
    id: '3',
    name: 'Climate Innovation',
    type: 'Incubator',
    status: 'active',
    startDate: 'Jan 2025',
    endDate: 'Dec 2025',
    capacity: 10,
    enrolled: 8,
    description: 'Year-long program for climate-focused startups',
  },
  {
    id: '4',
    name: 'Fall 2024 Cohort',
    type: 'Accelerator',
    status: 'completed',
    startDate: 'Sep 2024',
    endDate: 'Dec 2024',
    capacity: 12,
    enrolled: 12,
  },
];

export default function OrgProgramsPage() {
  // Illustrative rows are for the showcase; a real account with nothing
  // to list sees the page's empty state, not invented people and records.
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /*
   * `/api/programs` and its controller existed all along; the page never
   * called them. It reads the organisation's own programs now. The fixed
   * array below is kept as what an organisation with none yet sees, so the
   * screen still teaches its shape rather than opening empty.
   */
  const { membership } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;
  const { data, isLoading } = useQuery({
    queryKey: qk('programs', 'organization', organizationId),
    queryFn: () => listOrganizationPrograms(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data ?? []).map(toPageProgram), [data]);
  const programs: Program[] = live.length > 0 ? live : isLoading || !showDemoData ? [] : SEED_PROGRAMS;


  const filteredPrograms = programs.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filtersActive = !!search || statusFilter !== 'all';
  const clearFilters = () => { setSearch(''); setStatusFilter('all'); };

  // Offered to the assistant: clearing the search and each card's Archive -
  // the same endpoint the card's menu calls, refused on the sample
  // programmes, which have nothing behind them.
  const qc = useQueryClient();
  const { success, error: showError } = useToast();
  const archiveProgram = useMutation({
    mutationFn: (id: string) => updateProgram(id, { status: 'archived' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk('programs') });
      success('Program archived');
    },
    onError: (err) => showError('Could not archive the program', err instanceof Error ? err.message : undefined),
  });
  usePageList([
    {
      id: 'programs',
      labelEn: 'Programs',
      labelEl: 'Προγράμματα',
      rows: isLoading ? undefined : filteredPrograms.map((p) => `${p.name} · ${p.type} · ${p.status} · ${p.enrolled}/${p.capacity} enrolled`),
      total: programs.length,
      sample: live.length === 0,
    },
  ]);
  usePageControls([
    { id: 'clear_filters', labelEn: 'Clear the program search', labelEl: 'Καθαρισμός αναζήτησης προγραμμάτων', writes: false, unavailableEn: filtersActive ? undefined : 'No search is set.', unavailableEl: filtersActive ? undefined : 'Δεν υπάρχει αναζήτηση.', run: clearFilters },
    {
      id: 'archive_program',
      labelEn: 'Archive program',
      labelEl: 'Αρχειοθέτηση προγράμματος',
      writes: true,
      options: rowOptions(filteredPrograms.filter((p) => p.status !== 'archived'), (p) => p.id, (p) => p.name),
      unavailableEn: live.length > 0 ? undefined : 'These programs are samples; there is nothing behind them to archive.',
      unavailableEl: live.length > 0 ? undefined : 'Τα προγράμματα είναι δείγματα· δεν υπάρχει κάτι πίσω τους για αρχειοθέτηση.',
      run: (v) => { if (v) archiveProgram.mutate(v); },
    },
  ]);

  return (
    <AppShell
      title="Programs"
      description="Create, run, and review accelerator, bootcamp, and incubator programs."
      actions={(
        <Button asChild>
          <Link href="/tenant/programs">
            <Plus className="mr-2 icon-sm" />
            New Program
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Programs</p>
              <p className="text-xl font-bold">{programs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className={cn('text-xl font-bold', STATUS.success.icon)}>
                {programs.filter((p) => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
              <p className="text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.enrolled, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className={cn('text-xl font-bold', STATUS.info.icon)}>
                {programs.filter((p) => p.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-3">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
          {filteredPrograms.length === 0 && (
            <EmptyOrgPrograms filtersActive={filtersActive} onClearFilters={clearFilters} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
