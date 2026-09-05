'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Award,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Building2,
  Rocket,
  GraduationCap,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Globe,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Zap,
  Star,
  Filter,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import {
  listPrograms,
  getMyPrograms,
  applyToProgram,
  type ProgramItem,
} from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
const PROGRAM_STATUS_TONE: Record<string, StatusTone> = {
  open: 'success',
  upcoming: 'info',
  active: 'warning',
  closed: 'neutral',
  draft: 'neutral',
};

function deadlineUrgencyClass(days: number): string {
  if (days <= 3) return cn('font-medium', STATUS.danger.icon);
  if (days <= 7) return cn('font-medium', STATUS.warning.icon);
  return 'text-muted-foreground';
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  accelerator: Rocket,
  incubator:   Building2,
  bootcamp:    GraduationCap,
  competition: Award,
  cohort:      Users,
};

function typeLabel(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({
  program,
  open,
  onClose,
  onApply,
  isApplying,
}: {
  program: ProgramItem | null;
  open: boolean;
  onClose: () => void;
  onApply: (note: string) => void;
  isApplying: boolean;
}) {
  const [note, setNote] = useState('');
  if (!program) return null;
  const TypeIcon = TYPE_ICONS[program.programType] ?? Award;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-primary-accessible" />
            Apply to {program.title}
          </DialogTitle>
          <DialogDescription>
            Submit your application to {program.organization?.name}. Include a brief note about why you are a great fit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-secondary/40 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program type</span>
              <span className="font-medium capitalize">{program.programType}</span>
            </div>
            {program.applicationDeadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application deadline</span>
                <span className="font-medium">{formatDate(program.applicationDeadline)}</span>
              </div>
            )}
            {program.capacity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{program.participantCount}/{program.capacity} spots taken</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Why are you a good fit? <span className="text-muted-foreground">(optional)</span></label>
            <Textarea
              placeholder="Describe your startup, stage, and why this program is the right fit..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApplying}>Cancel</Button>
          <Button onClick={() => onApply(note)} disabled={isApplying}>
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Program Card ──────────────────────────────────────────────────────────────
function ProgramCard({
  program,
  isEnrolled,
  onApply,
}: {
  program: ProgramItem;
  isEnrolled: boolean;
  onApply: (p: ProgramItem) => void;
}) {
  const TypeIcon = TYPE_ICONS[program.programType] ?? Award;
  const deadline = daysUntil(program.applicationDeadline);
  const spotsLeft = program.capacity ? program.capacity - program.participantCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <Card className={cn('transition-all hover:shadow-md hover:border-primary/30 group', isEnrolled && 'border-primary/40 bg-primary/2')}>
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="h-11 w-11 rounded-xl flex-shrink-0 border border-border/60">
            <AvatarImage src={program.organization?.logoUrl ?? undefined} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible">
              <TypeIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{program.title}</h3>
                  {isEnrolled && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary-accessible border-primary/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" />Applied
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{program.organization?.name}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge variant="outline" className={cn('text-xs capitalize border', STATUS[PROGRAM_STATUS_TONE[program.status] ?? 'neutral'].chip)}>
                  {program.status === 'open' ? 'Open' : typeLabel(program.status)}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                  {typeLabel(program.programType)}
                </Badge>
              </div>
            </div>

            {program.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{program.description}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
              {program.applicationDeadline && program.status === 'open' && deadline !== null && (
                <span className={cn('flex items-center gap-1', deadline !== null && deadline <= 7 && deadlineUrgencyClass(deadline))}>
                  <Clock className="h-3.5 w-3.5" />
                  {deadline > 0 ? `${deadline}d to apply` : 'Deadline today'}
                </span>
              )}
              {program.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Starts {formatDate(program.startDate)}
                </span>
              )}
              <span className="flex items-center gap-1">
                {program.isRemote ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                {program.isRemote ? 'Remote' : (program.location ?? 'On-site')}
              </span>
              {spotsLeft !== null && (
                <span className={cn(
                  'flex items-center gap-1',
                  isFull ? cn('font-medium', STATUS.danger.icon) : spotsLeft <= 3 ? cn('font-medium', STATUS.warning.icon) : 'text-muted-foreground',
                )}>
                  <Users className="h-3.5 w-3.5" />
                  {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                </span>
              )}
            </div>

            {program.industries?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {program.industries.slice(0, 5).map((ind) => (
                  <span key={ind} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{ind}</span>
                ))}
              </div>
            )}

            {(program.benefits as string[] | undefined)?.length ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {(program.benefits as string[]).slice(0, 3).map((b, i) => (
                  <span key={i} className={cn('text-xs flex items-center gap-1', STATUS.success.text)}>
                    <Star className="h-3 w-3" />{b}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2 mt-4">
              {program.status === 'open' && !isEnrolled && !isFull && (
                <Button size="sm" onClick={(e) => { e.preventDefault(); onApply(program); }}>
                  <Zap className="h-3.5 w-3.5 mr-1.5" />Apply Now
                </Button>
              )}
              {isEnrolled && (
                <Button size="sm" variant="outline" className="text-primary-accessible border-primary/40">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Applied
                </Button>
              )}
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/programs/${program.id}`}>
                  View Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramSkeleton() {
  return (
    <Card><CardContent className="p-5">
      <div className="flex gap-4">
        <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </CardContent></Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProgramsPage() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [programType, setProgramType] = useState('all');
  const [status, setStatus] = useState('all');
  const [applyTarget, setApplyTarget] = useState<ProgramItem | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['programs', programType, status],
    queryFn: () => listPrograms({
      programType: programType !== 'all' ? programType : undefined,
      status: status !== 'all' ? status : undefined,
      limit: 50,
    }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: myData } = useQuery({
    queryKey: ['programs', 'my'],
    queryFn: getMyPrograms,
    staleTime: 2 * 60 * 1000,
  });

  const enrolledIds = useMemo(
    () => new Set((myData?.programs ?? []).map((p) => p.id)),
    [myData],
  );

  const applyMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      applyToProgram(id, note ? { coverNote: note } : undefined),
    onSuccess: () => {
      success('Application submitted!');
      setApplyTarget(null);
      qc.invalidateQueries({ queryKey: ['programs', 'my'] });
    },
    onError: () => toastError('Failed to submit application'),
  });

  const allPrograms = data?.programs ?? [];
  const filtered = useMemo(() => {
    if (!search) return allPrograms;
    const q = search.toLowerCase();
    return allPrograms.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.organization?.name.toLowerCase().includes(q) ||
        p.industries.some((i) => i.toLowerCase().includes(q)),
    );
  }, [allPrograms, search]);

  const openPrograms  = filtered.filter((p) => p.status === 'open');
  const myPrograms    = (myData?.programs ?? []);
  const hasFilters    = programType !== 'all' || status !== 'all' || !!search;

  const featuredPrograms = openPrograms.filter((p) => {
    const d = daysUntil(p.applicationDeadline);
    return d !== null && d >= 0 && d <= 14; // closing within 14 days = "featured/urgent"
  });

  return (
    <AppShell
      title="Programs"
      description="Accelerators, incubators, bootcamps, and competitions to grow your startup"
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Stats row */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Programs', value: data?.total ?? 0, icon: Award, tone: 'accent' as const },
              { label: 'Open Applications', value: openPrograms.length, icon: Zap, tone: 'success' as const },
              { label: 'Applied To', value: myPrograms.length, icon: CheckCircle2, tone: 'info' as const },
              { label: 'Remote Options', value: filtered.filter((p) => p.isRemote).length, icon: Globe, tone: 'accent' as const },
            ].map(({ label, value, icon: Icon, tone }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-secondary">
                    <Icon className={cn('h-4 w-4', STATUS[tone].icon)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs, organizations, industries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={programType} onValueChange={setProgramType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Program Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="accelerator">Accelerator</SelectItem>
              <SelectItem value="incubator">Incubator</SelectItem>
              <SelectItem value="bootcamp">Bootcamp</SelectItem>
              <SelectItem value="competition">Competition</SelectItem>
              <SelectItem value="cohort">Cohort</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open Now</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" size="icon" onClick={() => { setSearch(''); setProgramType('all'); setStatus('all'); }} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Featured programs quick-chips */}
        {featuredPrograms.length > 0 && !hasFilters && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary-accessible" />Featured &amp; Closing Soon
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredPrograms.slice(0, 4).map((p) => {
                const d = daysUntil(p.applicationDeadline);
                return (
                  <div key={p.id} className="shrink-0 rounded-xl border border-border/60 bg-card p-3 w-56 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setApplyTarget(p)}>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.organization?.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      {d !== null && d >= 0 ? (
                        <span className={cn('text-[10px] font-medium', d <= 3 ? cn(STATUS.danger.icon) : cn(STATUS.warning.icon))}>
                          {d === 0 ? 'Today!' : `${d}d left`}
                        </span>
                      ) : <span />}
                      <Badge variant="outline" className={cn('text-[9px] px-1.5 capitalize border', STATUS[PROGRAM_STATUS_TONE[p.status] ?? 'neutral'].chip)}>{p.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs: All / Open / My Applications */}
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Programs {filtered.length > 0 && `(${filtered.length})`}</TabsTrigger>
              <TabsTrigger value="open">Open {openPrograms.length > 0 && `(${openPrograms.length})`}</TabsTrigger>
              <TabsTrigger value="mine">My Applications {myPrograms.length > 0 && `(${myPrograms.length})`}</TabsTrigger>
            </TabsList>
          </div>

          {/* All Programs */}
          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <ProgramSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="font-medium text-lg">No programs found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
                  {hasFilters && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(''); setProgramType('all'); setStatus('all'); }}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{filtered.length} program{filtered.length !== 1 ? 's' : ''} found</p>
                {filtered.map((p) => (
                  <ProgramCard key={p.id} program={p} isEnrolled={enrolledIds.has(p.id)} onApply={setApplyTarget} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Open Programs */}
          <TabsContent value="open" className="mt-4">
            {openPrograms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No open programs right now</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back soon — new programs open regularly</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {openPrograms.map((p) => (
                  <ProgramCard key={p.id} program={p} isEnrolled={enrolledIds.has(p.id)} onApply={setApplyTarget} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Applications */}
          <TabsContent value="mine" className="mt-4">
            {myPrograms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookmarkCheck className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No applications yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Apply to open programs above to track them here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myPrograms.map((p) => (
                  <ProgramCard key={p.id} program={p} isEnrolled={true} onApply={setApplyTarget} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ApplyModal
        program={applyTarget}
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        onApply={(note) => applyTarget && applyMutation.mutate({ id: applyTarget.id, note })}
        isApplying={applyMutation.isPending}
      />
    </AppShell>
  );
}

