'use client';

import { StatusText } from '@/components/common/StatusText';
import { useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { RelativeTime, useHydrated } from '@/components/common/RelativeTime';
import { formatRelativeTime, initialsOf } from '@/lib/utils';
import { listServiceInquiries, updateServiceInquiry, type ServiceInquiryItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WithDisabledReason } from '@/components/common/UnavailableButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { qk } from '@/lib/query-keys';
import { CANCELLED, choiceControl, ROW_GONE, rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { useDemoData } from '@/contexts/DemoDataContext';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualInline } from '@/lib/i18n/format';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { Counter } from '@/components/ui/counter';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { bilingualAria } from '@/lib/i18n/format';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { FailedLine } from '@/components/dashboard/SectionCard';
import { ASK } from '@/lib/page-questions';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { calendarDaysUntil } from '@/lib/calendar-days';
import { Label } from '@/components/ui/label';

/**
 * A project is an inquiry that was accepted — the same row /provider/inquiries
 * lists before the provider agrees to the work, which is why the two screens
 * cannot disagree about a piece of work.
 *
 * `progress` (0-100) and `dueDate` (a day) are fields the provider sets on
 * agreed work (docs §97). Until one is set the card draws no bar and no date
 * rather than "0%" or a dash; a completed project is at 100%.
 */
function toProject(row: ServiceInquiryItem): Project {
  return {
    id: row.id,
    clientName: row.client?.displayName ?? '\u2014',
    clientId: row.client?.id,
    clientAvatar: row.client?.avatarUrl ?? undefined,
    service: row.offer?.title ?? '\u2014',
    status: row.status === 'completed' ? 'completed' : 'active',
    // -1 is "not tracked": no bar rather than "0%".
    progress: row.progress ?? (row.status === 'completed' ? 100 : -1),
    startDate: row.createdAt,
    dueDate: row.dueDate ?? '',
    lastUpdate: row.resolvedAt ?? row.createdAt,
    amount:
      row.agreedPrice != null
        ? new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: row.currency,
            maximumFractionDigits: 0,
          }).format(row.agreedPrice)
        : '\u2014',
  };
}

type Project = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientCompany?: string;
  service: string;
  status: 'active' | 'completed' | 'on_hold';
  /** 0-100, or -1 when not tracked. */
  progress: number;
  startDate: string;
  /** `YYYY-MM-DD`, or '' when no date was agreed. */
  dueDate: string;
  lastUpdate: string;
  amount: string;
  /** The client's user id on live rows. */
  clientId?: string;
};

type ProjectActions = {
  onView: (p: Project) => void;
  /** Absent on sample rows. */
  onComplete?: (p: Project) => void;
  /** Opens the progress form; absent on sample rows. */
  onUpdateProgress?: (p: Project) => void;
};

/** "Due 5 Nov", "Due tomorrow", "Overdue by 3 days" - calendar days where the reader is. */
function DueFact({ project }: { project: Project }) {
  const fmtDate = useDateFormat();
  const hydrated = useHydrated();
  if (!project.dueDate) return null;
  const date = fmtDate(`${project.dueDate}T12:00:00`, { day: 'numeric', month: 'short' });
  const days = hydrated ? calendarDaysUntil(project.dueDate) : null;
  if (project.status !== 'completed' && days != null && days < 0) {
    return (
      <span className="font-medium text-status-warning">
        <BilingualText en={`Overdue: due ${date}`} el={`Εκπρόθεσμο: προθεσμία ${date}`} compact />
      </span>
    );
  }
  if (project.status !== 'completed' && days === 0) return <BilingualText en="Due today" el="Προθεσμία σήμερα" compact />;
  return <BilingualText en={`Due ${date}`} el={`Προθεσμία ${date}`} compact />;
}

function ProjectCard({ project, onView, onComplete, onUpdateProgress }: { project: Project } & ProjectActions) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    active: { color: 'bg-status-success-bg text-status-success border-status-success-border', icon: Clock },
    completed: { color: 'bg-status-info-bg text-status-info border-status-info-border', icon: CheckCircle },
    on_hold: { color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: AlertCircle },
  };

  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  // The Connections card: the client's avatar and name with the state beside
  // it and the company under it, the menu at the right; the service, the
  // progress, the facts and the actions start on the avatar's edge.
  return (
    <Card className="transition-all hover:border-primary/20">
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.clientAvatar} alt="" />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary-accessible">{initialsOf(project.clientName)}</AvatarFallback>
            </Avatar>
          )}
          title={(
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="min-w-0 break-words">{project.clientName}</span>
              <Badge variant="outline" className={cn('text-xs', config.color)}>
                <StatusIcon className="mr-1 icon-sm" aria-hidden="true" />
                <StatusText value={project.status} />
              </Badge>
            </span>
          )}
          subtitle={project.clientCompany || undefined}
          asideStays
          aside={(
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={bilingualAria(`Open project actions for ${project.clientName}`, `Ενέργειες έργου: ${project.clientName}`)}>
                  <MoreVertical className="icon-sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* All four had no handler. A project is an accepted service
                    inquiry: it can be completed (status 'completed'), its
                    client messaged, and its progress and due date set - in
                    the card's foot, where they are seen (docs §95, §97). */}
                <DropdownMenuItem onSelect={() => onView(project)}><BilingualText en="View Details" el="Λεπτομέρειες" compact /></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />

        {project.service ? <p className="text-xs font-medium text-muted-foreground first-letter:uppercase">{project.service}</p> : null}

        {/* Drawn once a progress is set; never "0%" for "not tracked". */}
        {project.progress >= 0 ? (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground"><BilingualText en="Progress" el="Πρόοδος" compact /></span>
              <span className="font-medium tabular-nums">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" aria-label={bilingualAria(`Progress for ${project.clientName}: ${project.progress}%`, `Πρόοδος για ${project.clientName}: ${project.progress}%`)} />
          </div>
        ) : null}

        <FactLine
          items={[
            project.dueDate ? <DueFact key="due" project={project} /> : <span key="started"><BilingualText en="Started" el="Ξεκίνησε" compact /> <RelativeTime date={project.startDate} format={formatRelativeTime} /></span>,
            <span key="updated"><BilingualText en="Updated:" el="Ενημέρωση:" compact /> <RelativeTime date={project.lastUpdate} format={formatRelativeTime} /></span>,
            project.amount ? <span key="amount" className="font-medium tabular-nums text-foreground">{project.amount}</span> : null,
          ]}
        />

        <CardFoot>
          {/* Neither had a handler. */}
          {project.clientId ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/messages?to=${project.clientId}`}>
                <MessageSquare className="mr-1 icon-sm" aria-hidden="true" />
                <BilingualText en="Message" el="Μήνυμα" compact />
              </Link>
            </Button>
          ) : (
            <WithDisabledReason reasonEn="This client has no account to message" reasonEl="Ο πελάτης δεν έχει λογαριασμό για μήνυμα">
              <Button size="sm" variant="outline" disabled>
                <MessageSquare className="mr-1 icon-sm" aria-hidden="true" />
                <BilingualText en="Message" el="Μήνυμα" compact />
              </Button>
            </WithDisabledReason>
          )}
          {/* "Update" (disabled) was the menu's "Update Progress" again. The
              move that exists - completing the work - was in the menu only. */}
          {project.status !== 'completed' ? (
            onUpdateProgress ? (
              <Button size="sm" variant="outline" onClick={() => onUpdateProgress(project)} aria-label={bilingualAria(`Update progress for ${project.clientName}`, `Ενημέρωση προόδου για ${project.clientName}`)}>
                <BilingualText en="Update progress" el="Ενημέρωση προόδου" compact />
              </Button>
            ) : (
              <WithDisabledReason reasonEn="A sample project has nothing to update" reasonEl="Ένα δείγμα έργου δεν ενημερώνεται">
                <Button size="sm" variant="outline" disabled>
                  <BilingualText en="Update progress" el="Ενημέρωση προόδου" compact />
                </Button>
              </WithDisabledReason>
            )
          ) : null}
          {project.status !== 'completed' ? (
            <Button size="sm" variant="outline" disabled={!onComplete} onClick={() => onComplete?.(project)}>
              <BilingualText en="Mark complete" el="Σήμανση ως ολοκληρωμένο" compact />
            </Button>
          ) : null}
        </CardFoot>
      </CardContent>
    </Card>
  );
}

/**
 * Shown to a provider with no agreed work yet, with sample data on. Ages,
 * not dates (AGENTS): the rows were "active" with due dates in March.
 */
const SEED_PROJECT_ROWS: Array<Omit<Project, 'startDate' | 'dueDate' | 'lastUpdate'> & { startedDays: number; dueInDays: number; updatedDays: number }> = [
  { id: '1', clientName: 'TechStart Inc', clientCompany: 'TechStart Inc', service: 'Startup Legal Package', status: 'active', progress: 75, startedDays: -24, dueInDays: 9, updatedDays: -1, amount: '€2,500' },
  { id: '2', clientName: 'GreenTech Co', clientCompany: 'GreenTech Co', service: 'Financial Model Creation', status: 'active', progress: 40, startedDays: -19, dueInDays: 14, updatedDays: -2, amount: '€1,200' },
  { id: '3', clientName: 'DataFlow', clientCompany: 'DataFlow', service: 'Contract Review', status: 'on_hold', progress: 60, startedDays: -29, dueInDays: 20, updatedDays: -4, amount: '€450' },
  { id: '4', clientName: 'HealthPulse', clientCompany: 'HealthPulse', service: 'Startup Legal Package', status: 'completed', progress: 100, startedDays: -60, dueInDays: -40, updatedDays: -40, amount: '€2,500' },
  { id: '5', clientName: 'EduLearn', clientCompany: 'EduLearn', service: 'Financial Model Creation', status: 'completed', progress: 100, startedDays: -80, dueInDays: -65, updatedDays: -65, amount: '€1,200' },
];

function seedProjects(now: number): Project[] {
  const day = 86_400_000;
  return SEED_PROJECT_ROWS.map(({ startedDays, dueInDays, updatedDays, ...row }) => ({
    ...row,
    startDate: new Date(now + startedDays * day).toISOString(),
    dueDate: new Date(now + dueInDays * day).toISOString().slice(0, 10),
    lastUpdate: new Date(now + updatedDays * day).toISOString(),
  }));
}

export default function ProviderProjectsPage() {
  const sayOne = useBilingualString();
  // Illustrative rows are for the showcase; a real account with nothing
  // to list sees the page's empty state, not invented people and records.
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: qk('provider', 'projects'),
    queryFn: () => listServiceInquiries({ side: 'provider', kind: 'projects', limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.inquiries ?? []).map(toProject), [data]);
  const hydrated = useHydrated();
  const seeds = useMemo(() => (hydrated ? seedProjects(Date.now()) : []), [hydrated]);
  const projects: Project[] = live.length > 0 ? live : isLoading || !showDemoData ? [] : seeds;
  const isSample = live.length === 0 && projects.length > 0;
  const failed = isError && !data;
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const [viewing, setViewing] = useState<Project | null>(null);

  /*
   * The progress form (docs §97): a whole number 0-100 and a day, either of
   * which can be cleared. Nothing is written until Save; the server checks
   * the same rule (`readProjectDelivery`) and its refusal is shown as is.
   */
  const [editing, setEditing] = useState<Project | null>(null);
  const [draftProgress, setDraftProgress] = useState('');
  const [draftDue, setDraftDue] = useState('');
  const [saving, setSaving] = useState(false);
  const openProgress = (p: Project) => {
    setEditing(p);
    setDraftProgress(p.progress >= 0 ? String(p.progress) : '');
    setDraftDue(p.dueDate);
  };
  const progressValue = draftProgress.trim() === '' ? null : Number(draftProgress);
  const progressInvalid = progressValue != null && (!Number.isInteger(progressValue) || progressValue < 0 || progressValue > 100);
  const saveProgress = async (): Promise<PageControlRunResult> => {
    if (!editing || progressInvalid) return { error: 'Progress is a whole number from 0 to 100.' };
    setSaving(true);
    try {
      await updateServiceInquiry(editing.id, { progress: progressValue, dueDate: draftDue || null });
      success('Progress saved', editing.clientName);
      setEditing(null);
    } catch (e) {
      toastError('Could not save the progress', e instanceof Error ? e.message : undefined);
      return { error: e instanceof Error && e.message ? e.message : 'The progress was not saved.' };
    } finally {
      setSaving(false);
      void queryClient.invalidateQueries({ queryKey: qk('provider', 'projects') });
    }
  };
  const complete = async (p: Project): Promise<PageControlRunResult> => {
    const ok = await confirm({
      title: <BilingualText en={`Mark the project for ${p.clientName} complete?`} el={`Ολοκλήρωση του έργου για ${p.clientName};`} />,
      description: <BilingualText en="The client can then leave a review." el="Ο πελάτης μπορεί έπειτα να αφήσει αξιολόγηση." />,
      confirmLabel: <BilingualText en="Mark complete" el="Σήμανση ως ολοκληρωμένο" compact />,
    });
    if (!ok) return CANCELLED;
    try {
      await updateServiceInquiry(p.id, { status: 'completed' });
      success('Project completed', p.clientName);
    } catch (e) {
      toastError('Could not complete the project', e instanceof Error ? e.message : undefined);
      return { error: e instanceof Error && e.message ? e.message : 'The project is still open.' };
    } finally {
      void queryClient.invalidateQueries({ queryKey: qk('provider', 'projects') });
    }
  };


  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.service.toLowerCase().includes(search.toLowerCase());
    const matchesTab = p.status === activeTab || (activeTab === 'all');
    return matchesSearch && matchesTab;
  });

  const counts = {
    active: projects.filter((p) => p.status === 'active').length,
    on_hold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  // Offered to the assistant: the tab, View Details, and Mark Complete
  // (which still asks, and is refused on the sample projects).
  const byClient = (list: Project[]) => rowOptions(list, (p) => p.id, (p) => p.clientName);
  usePageList([
    {
      id: 'projects',
      labelEn: 'Client projects',
      labelEl: 'Έργα πελατών',
      rows: isLoading ? undefined : filteredProjects.map((p) => `${p.clientName}${p.clientCompany ? ` (${p.clientCompany})` : ''} · ${p.service} · ${p.status.replace('_', ' ')}${p.progress >= 0 ? ` · ${p.progress}%` : ''}${p.dueDate ? ` · due ${p.dueDate}` : ''} · ${p.amount}`),
      total: projects.length,
      sample: live.length === 0,
    },
  ]);
  usePageControls([
    choiceControl('project_tab', 'Project filter', 'Φίλτρο έργων', [
      { value: 'active', en: 'Active', el: 'Ενεργά' },
      { value: 'on_hold', en: 'On hold', el: 'Σε αναμονή' },
      { value: 'completed', en: 'Completed', el: 'Ολοκληρωμένα' },
    ], activeTab, setActiveTab),
    { id: 'view_project', labelEn: 'View project details', labelEl: 'Προβολή λεπτομερειών έργου', writes: false, options: byClient(filteredProjects), run: (v) => { const p = projects.find((x) => x.id === v); if (p) setViewing(p); } },
    // Opens the form; nothing is saved until its Save is pressed.
    {
      id: 'open_progress_form',
      labelEn: 'Open the progress form for a project',
      labelEl: 'Άνοιγμα της φόρμας προόδου ενός έργου',
      writes: false,
      options: byClient(filteredProjects.filter((p) => p.status !== 'completed')),
      unavailableEn: live.length > 0 ? undefined : 'These projects are samples; there is nothing behind them to update.',
      unavailableEl: live.length > 0 ? undefined : 'Τα έργα είναι δείγματα· δεν υπάρχει κάτι πίσω τους για ενημέρωση.',
      run: (v) => { const p = projects.find((x) => x.id === v); if (p) openProgress(p); },
    },
    {
      id: 'complete_project',
      labelEn: 'Mark project complete',
      labelEl: 'Ολοκλήρωση έργου',
      writes: true,
      options: byClient(filteredProjects.filter((p) => p.status !== 'completed')),
      unavailableEn: live.length > 0 ? undefined : 'These projects are samples; there is nothing behind them to complete.',
      unavailableEl: live.length > 0 ? undefined : 'Τα έργα είναι δείγματα· δεν υπάρχει κάτι πίσω τους για ολοκλήρωση.',
      run: (v) => { const p = projects.find((x) => x.id === v); return p ? complete(p) : ROW_GONE; },
    },
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        {isSample ? (
          <SampleDataNotice
            surface="Projects"
            detail="These projects are illustrative; an inquiry you accept becomes a project here."
            askAiPrompt={ASK.servicesEmpty}
          />
        ) : null}
        {failed ? (
          <Card>
            <CardContent className="pt-6">
              <FailedLine en="Your projects could not be read just now." el="Τα έργα σας δεν διαβάστηκαν αυτή τη στιγμή." busy={isFetching} onRetry={() => void refetch()} />
            </CardContent>
          </Card>
        ) : (
        <>
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            aria-label={bilingualInline("Search projects", "Αναζήτηση έργων")}
            placeholder={sayOne("Search projects…", "Αναζήτηση έργων…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              <BilingualText en="Active" el="Ενεργά" compact /> <Counter value={counts.active} />
            </TabsTrigger>
            {/* A live project is never on hold (no such state); the tab shows
                when something is. */}
            {counts.on_hold > 0 ? (
              <TabsTrigger value="on_hold">
                <BilingualText en="On Hold" el="Σε αναμονή" compact /> <Counter value={counts.on_hold} />
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="completed">
              <BilingualText en="Completed" el="Ολοκληρωμένα" compact /> <Counter value={counts.completed} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onView={setViewing} onComplete={live.length > 0 ? (pr) => void complete(pr) : undefined} onUpdateProgress={live.length > 0 ? openProgress : undefined} />
            ))}
            {filteredProjects.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  {projects.length === 0 ? (
                    <>
                      <h3 className="card-title text-foreground"><BilingualText en="No projects yet" el="Δεν υπάρχουν ακόμη έργα" compact /></h3>
                      <p className="text-sm text-muted-foreground mt-1"><BilingualText en="An inquiry you accept becomes a project here." el="Ένα αίτημα που αποδέχεστε γίνεται έργο εδώ." wrap /></p>
                      <Button size="sm" variant="outline" className="mt-4" asChild><Link href="/provider/inquiries"><BilingualText en="Your inquiries" el="Τα αιτήματά σας" compact /></Link></Button>
                    </>
                  ) : (
                    <>
                      <h3 className="card-title text-foreground"><BilingualText en="No projects found" el="Δεν βρέθηκαν έργα" compact /></h3>
                      <p className="text-sm text-muted-foreground mt-1"><BilingualText en="None in this tab matches the search." el="Κανένα σε αυτή την καρτέλα δεν ταιριάζει με την αναζήτηση." wrap /></p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
      <Dialog open={viewing !== null} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.service}</DialogTitle>
            <DialogDescription>{viewing?.clientName}{viewing?.clientCompany ? ` · ${viewing.clientCompany}` : ''}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground"><BilingualText en="Status" el="Κατάσταση" compact /></dt>
              <dd><StatusText value={viewing.status} /></dd>
              <dt className="text-muted-foreground"><BilingualText en="Agreed price" el="Συμφωνημένη τιμή" compact /></dt>
              <dd>{viewing.amount || '\u2014'}</dd>
              <dt className="text-muted-foreground"><BilingualText en="Progress" el="Πρόοδος" compact /></dt>
              <dd>{viewing.progress >= 0 ? `${viewing.progress}%` : <BilingualText en="Not tracked" el="Δεν καταγράφεται" compact />}</dd>
              <dt className="text-muted-foreground"><BilingualText en="Due" el="Προθεσμία" compact /></dt>
              <dd>{viewing.dueDate ? <DueFact project={viewing} /> : <BilingualText en="No date set" el="Χωρίς ημερομηνία" compact />}</dd>
              <dt className="text-muted-foreground"><BilingualText en="Started" el="Έναρξη" compact /></dt>
              <dd><RelativeTime date={viewing.startDate} format={formatRelativeTime} /></dd>
              <dt className="text-muted-foreground"><BilingualText en="Last update" el="Τελευταία ενημέρωση" compact /></dt>
              <dd><RelativeTime date={viewing.lastUpdate} format={formatRelativeTime} /></dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o && !saving) setEditing(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle><BilingualText en="Update progress" el="Ενημέρωση προόδου" compact /></DialogTitle>
            <DialogDescription>{editing ? `${editing.clientName} · ${editing.service}` : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-progress"><BilingualText en="Progress (%)" el="Πρόοδος (%)" compact /></Label>
              <Input
                id="project-progress"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={5}
                value={draftProgress}
                onChange={(e) => setDraftProgress(e.target.value)}
                placeholder={sayOne('Not tracked', 'Δεν καταγράφεται')}
                aria-invalid={progressInvalid || undefined}
                aria-describedby="project-progress-help"
              />
              <p id="project-progress-help" className={cn('text-xs', progressInvalid ? 'text-destructive-accessible' : 'text-muted-foreground')}>
                <BilingualText
                  en={progressInvalid ? 'A whole number from 0 to 100.' : 'A whole number from 0 to 100; leave it empty for "not tracked".'}
                  el={progressInvalid ? 'Ακέραιος από 0 έως 100.' : 'Ακέραιος από 0 έως 100· αφήστε το κενό για «δεν καταγράφεται».'}
                  wrap
                />
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-due"><BilingualText en="Due date" el="Προθεσμία" compact /></Label>
              <Input id="project-due" type="date" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>
              <BilingualText en="Cancel" el="Ακύρωση" compact />
            </Button>
            <Button disabled={saving || progressInvalid} onClick={() => void saveProgress()}>
              {saving ? <BilingualText en="Saving…" el="Αποθήκευση…" compact /> : <BilingualText en="Save" el="Αποθήκευση" compact />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
