'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Calendar,
  Award,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Rocket,
  Target,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { getOrgCohorts, type CohortItem } from '@/lib/api';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { EmptyOrgCohorts } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { qk } from '@/lib/query-keys';
import { useDemoData } from '@/contexts/DemoDataContext';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualInline } from '@/lib/i18n/format';
import { StatusText } from '@/components/common/StatusText';

/**
 * The page's own row from the API row.
 *
 * `/api/org/:slug/cohorts` has existed all along; this page never called it.
 * Three fields the card shows have no source yet and say so rather than being
 * filled with a plausible number: progress, average readiness and mentor
 * coverage are all facts about the startups in a cohort, and the cohort
 * endpoint returns membership counts, not their state.
 */
/** "7 Sept 2026": the card printed the raw ISO timestamps. */
function shortDay(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function toPageCohort(item: CohortItem): Cohort {
  const now = Date.now();
  const start = item.startDate ? new Date(item.startDate).getTime() : null;
  const end = item.endDate ? new Date(item.endDate).getTime() : null;
  return {
    id: item.id,
    name: item.name,
    program: item.description ?? '\u2014',
    // A cohort that has not started is recruiting whatever its flag says: the
    // spring bootcamp, inactive until January, read as "completed".
    status: start != null && start > now ? 'recruiting' : !item.isActive || (end != null && end < now) ? 'completed' : 'active',
    startups: item._count?.members ?? 0,
    mentors: null,
    startDate: shortDay(item.startDate),
    endDate: shortDay(item.endDate),
    // Elapsed share of the cohort's own window — a fact its dates support.
    progress:
      start != null && end != null && end > start
        ? Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)))
        : 0,
  };
}

type Cohort = {
  id: string;
  name: string;
  program: string;
  status: 'recruiting' | 'active' | 'completed';
  startups: number;
  /** Null for a live cohort: the endpoint counts members, not their roles. */
  mentors: number | null;
  startDate: string;
  endDate: string;
  progress: number;
  avgReadiness?: number;
  mentorCoverage?: number; // % of startups with assigned mentor
};

const COHORT_STATUS_TONE: Record<Cohort['status'], StatusTone> = {
  recruiting: 'info',
  active: 'success',
  completed: 'neutral',
};

function CohortCard({ cohort }: { cohort: Cohort }) {
  const statusColors = STATUS[COHORT_STATUS_TONE[cohort.status]];
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{cohort.name}</span>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                <StatusText value={cohort.status} />
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{cohort.program}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="icon-sm" aria-hidden="true" />
                {cohort.mentors == null
                  ? <BilingualText en={`${cohort.startups} members`} el={`${cohort.startups} μέλη`} compact />
                  : <BilingualText en={`${cohort.startups} startups`} el={`${cohort.startups} νεοφυείς`} compact />}
              </span>
              {cohort.mentors != null && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="icon-sm" aria-hidden="true" />
                  <BilingualText en={`${cohort.mentors} mentors`} el={`${cohort.mentors} μέντορες`} compact />
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {cohort.startDate} - {cohort.endDate}
              </span>
            </div>
            {cohort.status !== 'recruiting' && (
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground"><BilingualText en="Program Progress" el="Πρόοδος προγράμματος" compact /></span>
                    <span className="font-medium">{cohort.progress}%</span>
                  </div>
                  <Progress value={cohort.progress} className="h-1.5" />
                </div>
                {cohort.avgReadiness != null && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground"><BilingualText en="Avg Readiness" el="Μέση ετοιμότητα" compact /></span>
                      <span className="font-medium">{cohort.avgReadiness}%</span>
                    </div>
                    <Progress value={cohort.avgReadiness} className="h-1.5" />
                  </div>
                )}
                <div className="flex items-center gap-3 text-2xs">
                  {cohort.mentorCoverage != null && (
                    <span className={cn('flex items-center gap-1', cohort.mentorCoverage >= 80 ? STATUS.success.icon : STATUS.warning.icon)}>
                      <CheckCircle2 className="icon-sm" /> {cohort.mentorCoverage}% mentor coverage
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon">
                <MoreVertical className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/org/cohorts/${cohort.id}`}>
                  <Eye className="mr-2 icon-sm" aria-hidden="true" />
                  <BilingualText en="View Details" el="Λεπτομέρειες" compact />
                </Link>
              </DropdownMenuItem>
              {/* Neither had a handler. Cohort writes exist only on the
                  platform-admin routes (PATCH/DELETE /admin/cohorts/:id), so
                  an organisation cannot make them from here yet. */}
              <UnavailableMenuItem
                icon={<Edit className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />}
                en="Edit Cohort"
                el="Επεξεργασία κοόρτης"
                reasonEn="Cohorts are edited by platform administrators for now."
                reasonEl="Οι κοόρτες επεξεργάζονται προς το παρόν από διαχειριστές πλατφόρμας."
              />
              <UnavailableMenuItem
                className="text-destructive-accessible"
                icon={<Trash2 className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />}
                en="Archive"
                el="Αρχειοθέτηση"
                reasonEn="Cohorts are archived by platform administrators for now."
                reasonEl="Οι κοόρτες αρχειοθετούνται προς το παρόν από διαχειριστές πλατφόρμας."
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown to an organisation that has not created a cohort yet. */
const SEED_COHORTS: Cohort[] = [
  { id: '1', name: 'Cohort 2025-A', program: 'Spring Accelerator 2025', status: 'active', startups: 12, mentors: 8, startDate: 'Jan 2025', endDate: 'Apr 2025', progress: 65, avgReadiness: 72, mentorCoverage: 92 },
  { id: '2', name: 'AI Lab Cohort 1', program: 'AI Innovation Lab', status: 'active', startups: 8, mentors: 5, startDate: 'Feb 2025', endDate: 'Aug 2025', progress: 30, avgReadiness: 58, mentorCoverage: 75 },
  { id: '3', name: 'Bootcamp March', program: 'Pre-seed Bootcamp', status: 'active', startups: 8, mentors: 4, startDate: 'Mar 2025', endDate: 'Mar 2025', progress: 90, avgReadiness: 81, mentorCoverage: 100 },
  { id: '4', name: 'Cohort 2024-C', program: 'Fall Accelerator 2024', status: 'completed', startups: 10, mentors: 8, startDate: 'Sep 2024', endDate: 'Dec 2024', progress: 100, avgReadiness: 88, mentorCoverage: 100 },
  { id: '5', name: 'Summer 2025', program: 'Summer Accelerator 2025', status: 'recruiting', startups: 0, mentors: 0, startDate: 'Jun 2025', endDate: 'Sep 2025', progress: 0 },
];

export default function OrgCohortsPage() {
  // Illustrative rows are for the showcase; a real account with nothing
  // to list sees the page's empty state, not invented people and records.
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /*
   * The organisation's own cohorts. The seed below is what an organisation
   * with none yet sees, so the screen still teaches its shape instead of
   * opening empty — a real cohort always wins.
   */
  const { slug } = useCurrentOrg();
  const { data, isLoading } = useQuery({
    queryKey: qk('org', 'cohorts', slug),
    queryFn: () => getOrgCohorts(slug!, { limit: 50 }),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.cohorts ?? []).map(toPageCohort), [data]);
  const cohorts: Cohort[] = live.length > 0 ? live : isLoading || !showDemoData ? [] : SEED_COHORTS;


  // These were memoised with no dependencies, so they kept the counts of the
  // first render (the loading state) for as long as the page was open.
  const totalStartups = cohorts.reduce((s, c) => s + c.startups, 0);
  const totalMentors = cohorts.some((c) => c.mentors == null) ? null : cohorts.reduce((s, c) => s + (c.mentors ?? 0), 0);

  const filteredCohorts = cohorts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.program.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell
      title="Cohorts"
      description="Manage program cohorts and participants"
      descriptionEl="Διαχειριστείτε τις κοόρτες και τους συμμετέχοντες των προγραμμάτων"
      actions={
        // Had no handler; cohorts are created on the platform-admin route.
        <Button className="gap-1.5" disabled title="Cohorts are created by platform administrators for now">
          <Plus className="icon-sm" aria-hidden="true" /> <BilingualText en="Create Cohort" el="Νέα κοόρτη" compact />
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search cohorts. Αναζήτηση κοορτών"
              placeholder={bilingualInline('Search cohorts…', 'Αναζήτηση κοορτών…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Status. Κατάσταση" className="w-full sm:w-[150px]">
              <SelectValue placeholder={bilingualInline('Status', 'Κατάσταση')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><BilingualText en="All Status" el="Όλες οι καταστάσεις" compact /></SelectItem>
              <SelectItem value="recruiting"><BilingualText en="Recruiting" el="Δέχεται αιτήσεις" compact /></SelectItem>
              <SelectItem value="active"><BilingualText en="Active" el="Ενεργές" compact /></SelectItem>
              <SelectItem value="completed"><BilingualText en="Completed" el="Ολοκληρωμένες" compact /></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Cohorts', labelEl: 'Σύνολο κοορτών', value: cohorts.length, icon: Award, tone: 'accent' as const },
            { label: 'Active', labelEl: 'Ενεργές', value: cohorts.filter((c) => c.status === 'active').length, icon: TrendingUp, tone: 'success' as const },
            totalMentors == null
              ? { label: 'Cohort memberships', labelEl: 'Συμμετοχές σε κοόρτες', value: totalStartups, icon: Rocket, tone: 'info' as const }
              : { label: 'Total Startups', labelEl: 'Σύνολο νεοφυών', value: totalStartups, icon: Rocket, tone: 'info' as const },
            { label: 'Total Mentors', labelEl: 'Σύνολο μεντόρων', value: totalMentors ?? '\u2014', icon: GraduationCap, tone: 'accent' as const },
          ].map(({ label, labelEl, value, icon: Icon, tone }) => (
            <Card key={label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('icon-sm', STATUS[tone].icon)} /></div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-2xs text-muted-foreground"><BilingualText en={label} el={labelEl} compact wrap /></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cohorts List */}
        <div className="space-y-3">
          {filteredCohorts.map((cohort) => (
            <CohortCard key={cohort.id} cohort={cohort} />
          ))}
          {filteredCohorts.length === 0 && (
            <EmptyOrgCohorts
              filtersActive={!!search || statusFilter !== 'all'}
              onClearFilters={() => { setSearch(''); setStatusFilter('all'); }}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
