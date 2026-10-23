'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MoreVertical,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OrgReadFailed } from '@/components/org/OrgReadFailed';
import { useQuery } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { getOrgCohorts, getOrgMembers, type OrgMember } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { EmptyOrgStartups, namedChoice, namedFilters, namedQuery } from '@/components/common/EmptyStates';
import { CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { cn, initialsOf } from '@/lib/utils';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { qk } from '@/lib/query-keys';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';
import { useDemoData } from '@/contexts/DemoDataContext';
import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { Skeleton } from '@/components/ui/skeleton';
import { ASK } from '@/lib/page-questions';

/**
 * The page's own row from the organisation's member list.
 *
 * There is no startup entity in the schema: an accelerator's cohort is made of
 * people, and `/api/org/:slug/members` is the list of them with the cohort
 * each belongs to. Four fields on the card have no source and admit it rather
 * than being filled — progress, team size, founding date and readiness are all
 * facts about a company the platform does not model yet.
 */
/** "Founder at Meltemi" names the startup; the member row carries no other field for it. */
function startupOf(headline: string | null | undefined): string | null {
  const match = headline?.match(/\bat\s+(.+)$/i);
  return match ? match[1] : null;
}

function toStartup(member: OrgMember, graduatedCohorts: ReadonlySet<string>): Startup {
  return {
    id: member.id,
    name: startupOf(member.headline) ?? member.displayName,
    logoUrl: member.avatarUrl ?? undefined,
    // The founder, and where they are: what the row actually knows.
    industry: member.displayName,
    stage: member.location ?? '\u2014',
    program: member.cohortName || '\u2014',
    cohort: member.cohortName || '\u2014',
    progress: null,
    teamSize: null,
    foundedAt: member.joinedAt,
    status: graduatedCohorts.has(member.cohortName) ? 'graduated' : 'active',
    readinessScore: null,
  };
}

type Startup = {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  stage: string;
  program: string;
  cohort: string;
  /** Null where the platform has no figure for a company (see toStartup). */
  progress: number | null;
  teamSize: number | null;
  foundedAt: string;
  status: 'active' | 'graduated' | 'paused' | 'dropped';
  readinessScore: number | null;
};

const STARTUP_STATUS_TONE: Record<Startup['status'], StatusTone> = {
  active: 'success',
  graduated: 'info',
  paused: 'warning',
  dropped: 'danger',
};

function StartupCard({ startup, sample = false }: { startup: Startup; /** A sample startup has no founder profile or thread (ids '1'…'4'). */ sample?: boolean }) {
  const statusColors = STATUS[STARTUP_STATUS_TONE[startup.status]];

  // The Programs card: the startup's rounded square, its name over sector
  // and stage, the state and the menu at the right; the facts and the
  // progress start on the mark's edge.
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={bilingualAria(`Open actions for ${startup.name}`, `Ενέργειες: ${startup.name}`)}>
          <MoreVertical className="icon-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* "View Details" went: the startup's name opens the same founder
            profile (docs §96). "Open Workspace" opened /builder, which is
            the reader's own workspace, never this startup's. */}
        <UnavailableMenuItem
          en="Open Workspace"
          el="Άνοιγμα χώρου εργασίας"
          reasonEn="A startup's workspace belongs to its team; there is no organiser view of it yet."
          reasonEl="Ο χώρος εργασίας μιας startup ανήκει στην ομάδα της· δεν υπάρχει ακόμη προβολή του για τον οργανισμό."
        />
        {/* A cohort "startup" is its member (id = user id, see
            toStartup), so details are their profile and a message
            opens a thread with them. Both links pointed at
            /org/startups/:id, which never existed. */}
        <UnavailableMenuItem
          en="Assign Mentor"
          el="Ανάθεση μέντορα"
          reasonEn="Mentor assignments are not stored yet."
          reasonEl="Οι αναθέσεις μεντόρων δεν αποθηκεύονται ακόμη."
        />
        {sample ? (
          <UnavailableMenuItem en="Send Message" el="Αποστολή μηνύματος" reasonEn="A sample founder cannot receive messages." reasonEl="Ένα δείγμα ιδρυτή δεν λαμβάνει μηνύματα." />
        ) : (
          <DropdownMenuItem asChild>
            <Link href={`/messages?to=${startup.id}`}><BilingualText en="Send Message" el="Αποστολή μηνύματος" compact /></Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <Card className="transition-all hover:border-primary/30">
      <CardContent className="space-y-3">
        <CardHead
          // The mark and the name were two links to one profile; the name is
          // the one (docs §96).
          mark={(
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarImage src={startup.logoUrl} alt="" />
              <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary-accessible">
                {initialsOf(startup.name)}
              </AvatarFallback>
            </Avatar>
          )}
          title={sample ? startup.name : (
            <Link href={`/profiles/${startup.id}`} className="transition-colors hover:text-primary-accessible">
              {startup.name}
            </Link>
          )}
          subtitle={(
            <FactLine
              className="text-sm"
              items={[
                startup.industry,
                startup.stage && startup.stage !== '\u2014' ? startup.stage : null,
              ]}
            />
          )}
          asideStays
          aside={(
            <>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                <StatusText value={startup.status} />
              </Badge>
              {menu}
            </>
          )}
        />

        <FactLine
          items={[
            startup.program !== '\u2014' ? startup.program : null,
            startup.teamSize != null ? (
              <BilingualText key="team" en={`${startup.teamSize} members`} el={`${startup.teamSize} μέλη`} compact />
            ) : null,
            startup.cohort !== startup.program && startup.cohort !== '\u2014' ? startup.cohort : null,
            startup.readinessScore != null ? (
              <BilingualText key="readiness" en={`Readiness ${startup.readinessScore}%`} el={`Ετοιμότητα ${startup.readinessScore}%`} compact />
            ) : null,
          ]}
        />

        {startup.progress != null && (
          <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground"><BilingualText en="Progress" el="Πρόοδος" compact /></span>
              <span className="font-medium tabular-nums">{startup.progress}%</span>
            </div>
            <Progress value={startup.progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Shown to an organisation whose cohorts are still empty. */
const SEED_STARTUPS: Startup[] = [
  {
    id: '1',
    name: 'NeuralFlow',
    industry: 'AI/ML',
    stage: 'Seed',
    program: 'AI Accelerator',
    cohort: 'Cohort 3',
    progress: 85,
    teamSize: 4,
    foundedAt: '2024',
    status: 'active',
    readinessScore: 78,
  },
  {
    id: '2',
    name: 'GreenGrid',
    industry: 'CleanTech',
    stage: 'Pre-seed',
    program: 'Climate Innovation',
    cohort: 'Cohort 2',
    progress: 72,
    teamSize: 3,
    foundedAt: '2024',
    status: 'active',
    readinessScore: 65,
  },
  {
    id: '3',
    name: 'PayFlow',
    industry: 'FinTech',
    stage: 'Seed',
    program: 'FinTech Bootcamp',
    cohort: 'Spring cohort',
    progress: 100,
    teamSize: 5,
    foundedAt: '2023',
    status: 'graduated',
    readinessScore: 92,
  },
  {
    id: '4',
    name: 'HealthSync',
    industry: 'HealthTech',
    stage: 'Idea',
    program: 'AI Accelerator',
    cohort: 'Cohort 3',
    progress: 45,
    teamSize: 2,
    foundedAt: '2024',
    status: 'active',
    readinessScore: 42,
  },
];

export default function OrgStartupsPage() {
  const sayOne = useBilingualString();
  // Illustrative rows are for the showcase; a real account with nothing
  // to list sees the page's empty state, not invented people and records.
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  /*
   * The organisation's cohort members. The seed below is what an
   * organisation with an empty cohort sees, so the screen still teaches its
   * shape rather than opening blank.
   */
  const { slug, isLoading: orgLoading, failed: orgFailed, refetch: refetchOrg, isFetching: orgFetching } = useCurrentOrg();
  const { data, isLoading, isError: mainError, refetch: refetchMain, isFetching: mainFetching } = useQuery({
    queryKey: qk('org', 'members', slug),
    queryFn: () => getOrgMembers(slug!, { limit: 100 }),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 0,
  });

  // A member of a cohort that has ended has graduated from it.
  const { data: cohortData } = useQuery({
    queryKey: qk('org', 'cohorts', slug),
    queryFn: () => getOrgCohorts(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 0,
  });
  const graduatedCohorts = useMemo(
    () => new Set<string>((cohortData?.cohorts ?? []).filter((c) => !c.isActive && c.endDate && Date.parse(c.endDate) < Date.now()).map((c) => c.name)),
    [cohortData],
  );
  // Cohort members include the cohort's mentors and investors (the API
  // returns every member with the user's role); a portfolio is its founders.
  const live = useMemo(
    () => (data?.members ?? []).filter((m) => m.role === 'founder').map((m) => toStartup(m, graduatedCohorts)),
    [data, graduatedCohorts],
  );
  const startups: Startup[] = live.length > 0 ? live : isLoading || !showDemoData ? [] : SEED_STARTUPS;
  const isSample = live.length === 0 && startups.length > 0;
  const reading = orgLoading || isLoading;


  const scored = startups.filter((s) => s.readinessScore != null);
  const filteredStartups = startups.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = program === 'all' || s.program === program;
    const matchesStatus = status === 'all' || s.status === status;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const programs = [...new Set(startups.map((s) => s.program))];

  const filtersActive = !!search || program !== 'all' || status !== 'all';
  const clearFilters = () => { setSearch(''); setProgram('all'); setStatus('all'); };

  usePageList([
    {
      id: 'startups',
      labelEn: 'Portfolio startups',
      labelEl: 'Startups οργανισμού',
      rows: isLoading ? undefined : filteredStartups.map((s) => `${s.name} · ${s.industry}, ${s.stage} · ${s.program} · ${s.status} · progress ${s.progress}%`),
      total: startups.length,
      sample: live.length === 0,
    },
  ]);
  usePageControls([
    choiceControl('program_filter', 'Program filter', 'Φίλτρο προγράμματος', [{ value: 'all', en: 'All programs', el: 'Όλα τα προγράμματα' }, ...programs.map((p) => ({ value: p, en: p, el: p }))], program, setProgram),
    choiceControl('status_filter', 'Status filter', 'Φίλτρο κατάστασης', [
      { value: 'all', en: 'All statuses', el: 'Όλες οι καταστάσεις' },
      { value: 'active', en: 'Active', el: 'Ενεργές' },
      { value: 'graduated', en: 'Graduated', el: 'Αποφοιτήσασες' },
      { value: 'paused', en: 'Paused', el: 'Σε παύση' },
      { value: 'dropped', en: 'Dropped', el: 'Αποχωρήσασες' },
    ], status, setStatus),
    { id: 'clear_filters', labelEn: 'Clear the startup filters', labelEl: 'Καθαρισμός φίλτρων startups', writes: false, unavailableEn: filtersActive ? undefined : 'No filter is set.', unavailableEl: filtersActive ? undefined : 'Δεν υπάρχει φίλτρο.', run: clearFilters },
  ]);

  // Unread, the page drew its tiles as 0 and its empty state, as if the
  // organisation had nothing in it (docs §96).
  if (orgFailed || (mainError && !data)) {
    return (
      <AppShell showHelp>
        <OrgReadFailed en={orgFailed ? undefined : 'Your startups could not be read just now.'} el={orgFailed ? undefined : 'Οι startups σας δεν διαβάστηκαν αυτή τη στιγμή.'} busy={orgFetching || mainFetching} onRetry={() => { refetchOrg(); void refetchMain(); }} />
      </AppShell>
    );
  }

  return (
    <AppShell showHelp
      title="Portfolio Startups"
      description="Startups currently in your programs and graduates. Track readiness, milestones, and program assignment."
      descriptionEl="Νεοφυείς που συμμετέχουν στα προγράμματά σας και απόφοιτοι. Παρακολουθήστε ετοιμότητα, ορόσημα και ανάθεση προγράμματος."
      actions={(
        <Button asChild>
          <Link href="/org/applications">
            <BilingualText en="Review Applications" el="Έλεγχος αιτήσεων" compact />
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">
        {isSample && (
          <SampleDataNotice
            surface="Portfolio Startups"
            detail="No founder is in your cohorts yet, so these are samples that show the layout; they open no profile."
            askAiPrompt={ASK.orgStartupsSample}
          />
        )}

        {/* Figures and filters show over startups that were read. "Avg.
            Readiness" shows once a startup carries a score: no member row
            does, so it read "—" for every live organisation (docs §96). */}
        {(startups.length > 0 || filtersActive) && (<>
        <div className={cn('grid grid-cols-2 gap-4', scored.length ? 'kpi-odd-span-md md:grid-cols-4' : 'md:grid-cols-3')}>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Total Startups" el="Σύνολο startups" compact /></p>
              <p className="page-stat text-xl font-bold">{startups.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Active" el="Ενεργά" compact /></p>
              <p className={cn('page-stat text-xl font-bold', STATUS.success.icon)}>
                {startups.filter((s) => s.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Graduated" el="Αποφοίτησαν" compact /></p>
              <p className={cn('page-stat text-xl font-bold', STATUS.info.icon)}>
                {startups.filter((s) => s.status === 'graduated').length}
              </p>
            </CardContent>
          </Card>
          {scored.length > 0 && (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground"><BilingualText en="Avg. Readiness" el="Μέση ετοιμότητα" compact /></p>
                <p className="page-stat text-xl font-bold">
                  {`${Math.round(scored.reduce((acc, s) => acc + (s.readinessScore ?? 0), 0) / scored.length)}%`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label={bilingualInline("Search startups", "Αναζήτηση startups")}
              placeholder={sayOne("Search startups…", "Αναζήτηση startups…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger aria-label={bilingualAria('Program', 'Πρόγραμμα')} className="w-full sm:w-[200px]">
              <SelectValue placeholder={sayOne("Program", "Πρόγραμμα")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><BilingualText en="All programs" el="Όλα τα προγράμματα" compact /></SelectItem>
              {programs.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label={bilingualAria('Status', 'Κατάσταση')} className="w-full sm:w-[150px]">
              <SelectValue placeholder={sayOne("Status", "Κατάσταση")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><BilingualText en="All statuses" el="Όλες οι καταστάσεις" compact /></SelectItem>
              <SelectItem value="active"><BilingualText en="Active" el="Ενεργά" compact /></SelectItem>
              <SelectItem value="graduated"><BilingualText en="Graduated" el="Αποφοίτησαν" compact /></SelectItem>
              <SelectItem value="paused"><BilingualText en="Paused" el="Σε παύση" compact /></SelectItem>
              <SelectItem value="dropped"><BilingualText en="Dropped" el="Αποχώρησαν" compact /></SelectItem>
            </SelectContent>
          </Select>
        </div>
        </>)}

        {/* Results. "10 startups" repeated the Total tile above it; the line
            speaks only when a filter narrows the list. */}
        <div className="space-y-3">
          {filtersActive && filteredStartups.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <BilingualText
                en={`${filteredStartups.length} of ${startups.length} startups`}
                el={`${filteredStartups.length} από ${startups.length} startups`}
                compact
              />
            </p>
          )}
          {reading && startups.length === 0 && [0, 1].map((i) => <Skeleton key={i} className="h-28" />)}
          {filteredStartups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} sample={isSample} />
          ))}
          {!reading && filteredStartups.length === 0 && (
            <EmptyOrgStartups
              filtersActive={filtersActive}
              onClearFilters={clearFilters}
              active={namedFilters(
                namedQuery(search),
                program !== 'all' ? { en: program, el: program } : null,
                namedChoice(status, 'all', {
                  active: { en: 'Active', el: 'Ενεργά' },
                  graduated: { en: 'Graduated', el: 'Αποφοίτησαν' },
                  paused: { en: 'Paused', el: 'Σε παύση' },
                  dropped: { en: 'Dropped', el: 'Αποχώρησαν' },
                }),
              )}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
