'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Award,
  MoreVertical,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OrgReadFailed } from '@/components/org/OrgReadFailed';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { listOrganizationPrograms, updateProgram, type ProgramItem } from '@/lib/api';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyOrgPrograms, namedChoice, namedFilters, namedQuery } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { qk } from '@/lib/query-keys';
import { rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import { useDemoData } from '@/contexts/DemoDataContext';
import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { bilingualInline, bilingualAria } from '@/lib/i18n/format';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { demoMark } from '@/lib/demo/photos';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { useHydrated } from '@/components/common/RelativeTime';
import { Skeleton } from '@/components/ui/skeleton';
import { ASK } from '@/lib/page-questions';

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

const STATUS_LABEL: Record<Program['status'], { en: string; el: string }> = {
  draft: { en: 'Draft', el: 'Πρόχειρο' },
  upcoming: { en: 'Upcoming', el: 'Προσεχές' },
  active: { en: 'Running', el: 'Σε εξέλιξη' },
  completed: { en: 'Completed', el: 'Ολοκληρώθηκε' },
  archived: { en: 'Archived', el: 'Αρχειοθετημένο' },
};

/** "7 Sep 2026": the API sends ISO timestamps, which the card printed as they came. */
const PROGRAM_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

function ProgramCard({ program, sample = false }: { program: Program; /** A sample programme has no page and nothing to archive (ids '1'…'4'). */ sample?: boolean }) {
  const fmtDate = useDateFormat();
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

  // The Programs card: the programme's rounded square, its name over its
  // kind, the state and the menu at the right; the sentence and the facts
  // start on the mark's edge.
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={bilingualAria(`More options for ${program.name}`, `Περισσότερες επιλογές: ${program.name}`)} variant="ghost" size="icon">
          <MoreVertical className="icon-sm" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* "View Details" went: the programme's name opens the same page
            (docs §96). Manage Participants opens the applications to this
            programme, not all of them. */}
        {sample ? (
          <>
            <UnavailableMenuItem en="Edit Program" el="Επεξεργασία προγράμματος" reasonEn="A sample programme has nothing to edit." reasonEl="Ένα δείγμα προγράμματος δεν επεξεργάζεται." />
            <UnavailableMenuItem en="Manage Participants" el="Διαχείριση συμμετεχόντων" reasonEn="A sample programme has no participants." reasonEl="Ένα δείγμα προγράμματος δεν έχει συμμετέχοντες." />
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/tenant/programs"><BilingualText en="Edit Program" el="Επεξεργασία προγράμματος" compact /></Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/org/applications?program=${program.id}`}><BilingualText en="Manage Participants" el="Διαχείριση συμμετεχόντων" compact /></Link>
            </DropdownMenuItem>
          </>
        )}
        {/*
          * "Duplicate" is gone rather than left inert: there is no
          * create-from-existing route, and a menu item that does nothing
          * is worse than one that is not offered. The page's own "New
          * program" button is the path that works.
          */}
        <DropdownMenuItem
          className="text-destructive-accessible"
          disabled={sample || archive.isPending || program.status === 'archived'}
          onClick={() => archive.mutate()}
        >
          {program.status === 'archived'
            ? <BilingualText en="Archived" el="Αρχειοθετημένο" compact />
            : <BilingualText en="Archive" el="Αρχειοθέτηση" compact />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <Card className="transition-all hover:border-primary/30">
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarImage src={demoMark(program.name, [program.type])} alt="" className="rounded-xl" />
              {/* Stands in for the programme's logo: an avatar, not decoration. */}
              <AvatarFallback data-keep-icon className="rounded-xl bg-primary/10 text-primary-accessible">
                <Award className="icon-md" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          )}
          title={sample ? program.name : (
            <Link href={`/programs/${program.id}`} className="transition-colors hover:text-primary-accessible">
              {program.name}
            </Link>
          )}
          subtitle={<StatusText value={program.type} />}
          asideStays
          aside={(
            <>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                <BilingualText en={STATUS_LABEL[program.status].en} el={STATUS_LABEL[program.status].el} compact />
              </Badge>
              {menu}
            </>
          )}
        />
        {program.description && (
          <p className="card-body line-clamp-2 text-muted-foreground first-letter:uppercase">{program.description}</p>
        )}
        <FactLine
          items={[
            program.startDate ? (
              <span key="dates" className="tabular-nums">
                {fmtDate(program.startDate, PROGRAM_DATE)} – {program.endDate ? fmtDate(program.endDate, PROGRAM_DATE) : <BilingualText en="Ongoing" el="Σε εξέλιξη" compact />}
              </span>
            ) : null,
            <BilingualText key="enrolled" en={`${program.enrolled}/${program.capacity} enrolled`} el={`${program.enrolled}/${program.capacity} εγγεγραμμένοι`} compact />,
          ]}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Shown to an organisation that has not created a program yet, with sample
 * data on. Ages, not dates (AGENTS): "AI Accelerator 2025" was "active" from
 * January to April 2025 whatever the day.
 */
const SEED_PROGRAM_ROWS: Array<Omit<Program, 'startDate' | 'endDate'> & { startInDays: number; endInDays: number }> = [
  { id: '1', name: 'AI Accelerator', type: 'Accelerator', status: 'active', startInDays: -40, endInDays: 44, capacity: 15, enrolled: 12, description: 'Intensive 12-week program for AI/ML startups' },
  { id: '2', name: 'FinTech Bootcamp', type: 'Bootcamp', status: 'draft', startInDays: 60, endInDays: 116, capacity: 20, enrolled: 0, description: '8-week fintech innovation program' },
  { id: '3', name: 'Climate Innovation', type: 'Incubator', status: 'active', startInDays: -120, endInDays: 245, capacity: 10, enrolled: 8, description: 'Year-long program for climate-focused startups' },
  { id: '4', name: "Last autumn's cohort", type: 'Accelerator', status: 'completed', startInDays: -400, endInDays: -310, capacity: 12, enrolled: 12 },
];

function seedPrograms(now: number): Program[] {
  const day = 86_400_000;
  return SEED_PROGRAM_ROWS.map(({ startInDays, endInDays, ...row }) => ({
    ...row,
    startDate: new Date(now + startInDays * day).toISOString(),
    endDate: new Date(now + endInDays * day).toISOString(),
  }));
}

export default function OrgProgramsPage() {
  const sayOne = useBilingualString();
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
  const { membership, isLoading: orgLoading, failed: orgFailed, refetch: refetchOrg, isFetching: orgFetching } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;
  const { data, isLoading, isError: mainError, refetch: refetchMain, isFetching: mainFetching } = useQuery({
    queryKey: qk('programs', 'organization', organizationId),
    queryFn: () => listOrganizationPrograms(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data ?? []).map(toPageProgram), [data]);
  const hydrated = useHydrated();
  const seeds = useMemo(() => (hydrated ? seedPrograms(Date.now()) : []), [hydrated]);
  const programs: Program[] = live.length > 0 ? live : isLoading || orgLoading || !showDemoData ? [] : seeds;
  const isSample = live.length === 0 && programs.length > 0;
  const reading = orgLoading || isLoading;


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
      rows: reading ? undefined : filteredPrograms.map((p) => `${p.name} · ${p.type} · ${p.status} · ${p.enrolled}/${p.capacity} enrolled`),
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
      run: async (v) => { if (v) await archiveProgram.mutateAsync(v); },
    },
  ]);

  // Unread, the page drew its tiles as 0 and its empty state, as if the
  // organisation had nothing in it (docs §96).
  if (orgFailed || (mainError && !data)) {
    return (
      <AppShell showHelp>
        <OrgReadFailed en={orgFailed ? undefined : 'Your programmes could not be read just now.'} el={orgFailed ? undefined : 'Τα προγράμματά σας δεν διαβάστηκαν αυτή τη στιγμή.'} busy={orgFetching || mainFetching} onRetry={() => { refetchOrg(); void refetchMain(); }} />
      </AppShell>
    );
  }

  return (
    <AppShell showHelp
      title="Programs"
      titleEl="Προγράμματα"
      description="Create, run, and review accelerator, bootcamp, and incubator programs."
      // The empty state carries its own "Create program" (docs §87, §96).
      actions={programs.length > 0 || reading ? (
        <Button asChild>
          <Link href="/tenant/programs">
            <Plus className="mr-2 icon-sm" aria-hidden="true" />
            <BilingualText en="New Program" el="Νέο πρόγραμμα" compact />
          </Link>
        </Button>
      ) : undefined}
    >
      <div className="space-y-6">
        {isSample && (
          <SampleDataNotice
            surface="Programs"
            detail="Your organisation has no programme yet, so these are samples that show the layout; they open nothing and cannot be archived."
            askAiPrompt={ASK.orgProgramsSample}
          />
        )}

        {/* Figures and search show over programmes that were read; with none
            they read 0 / 0 / 0 / 0 above the empty state. */}
        {(programs.length > 0 || filtersActive) && (<>
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Total Programs" el="Σύνολο προγραμμάτων" compact /></p>
              <p className="page-stat text-xl font-bold">{programs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Active" el="Ενεργά" compact /></p>
              <p className={cn('page-stat text-xl font-bold', STATUS.success.icon)}>
                {programs.filter((p) => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Total Enrolled" el="Σύνολο εγγεγραμμένων" compact /></p>
              <p className="page-stat text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.enrolled, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Completed" el="Ολοκληρωμένα" compact /></p>
              <p className={cn('page-stat text-xl font-bold', STATUS.info.icon)}>
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
              aria-label={bilingualInline("Search programs", "Αναζήτηση προγραμμάτων")}
              placeholder={sayOne("Search programs…", "Αναζήτηση προγραμμάτων…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        </>)}

        {/* Programs List */}
        <div className="space-y-3">
          {reading && programs.length === 0 && [0, 1].map((i) => <Skeleton key={i} className="h-28" />)}
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} sample={isSample} />
          ))}
          {!reading && filteredPrograms.length === 0 && (
            <EmptyOrgPrograms
              filtersActive={filtersActive}
              onClearFilters={clearFilters}
              active={namedFilters(namedQuery(search), namedChoice(statusFilter, 'all', {
                active: { en: 'Active', el: 'Ενεργά' },
                completed: { en: 'Completed', el: 'Ολοκληρωμένα' },
                draft: { en: 'Draft', el: 'Πρόχειρα' },
                archived: { en: 'Archived', el: 'Αρχειοθετημένα' },
              }))}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
