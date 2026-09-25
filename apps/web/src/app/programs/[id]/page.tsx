'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Calendar, CheckCircle2, Clock, Globe, Loader2, MapPin, Users, Zap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { acceptsApplications, applyToProgram, getMyPrograms, getProgram } from '@/lib/api';
import { programsEl, programsEn } from '@/lib/i18n/strings-programs';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { qk } from '@/lib/query-keys';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * One programme.
 *
 * The public programmes list linked every card's "View Details" to
 * /programs/:id, which did not exist. GET /programs/:id did, and so did the
 * apply route the list's modal uses, so this page reads the programme and
 * lets a founder apply from it, with the same optional note.
 */
export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [note, setNote] = useState('');
  const { primary } = useLanguagePreference();
  const placeholder = primary === 'el' ? programsEl('fit_placeholder') : programsEn('fit_placeholder');

  const { data, isLoading, isError } = useQuery({
    queryKey: qk('programs', 'detail', id),
    queryFn: () => getProgram(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 0,
  });
  const { data: mine } = useQuery({
    queryKey: qk('programs', 'mine'),
    queryFn: getMyPrograms,
    staleTime: 60_000,
    retry: 0,
  });
  const program = data?.program ?? null;
  const enrolled = Boolean(program && (mine?.programs ?? []).some((p) => p.id === program.id));

  const apply = useMutation({
    mutationFn: () => applyToProgram(id, note.trim() ? { coverNote: note.trim() } : undefined),
    onSuccess: () => {
      success(programsEn('applied'), program?.title);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: qk('programs') });
    },
    onError: (e) => showError('Could not apply', e instanceof Error ? e.message : 'Sign in and try again.'),
  });

  if (isLoading) {
    return (
      <AppShell title="Program" titleEl="Πρόγραμμα">
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !program) {
    return (
      <AppShell title="Program not found" titleEl="Το πρόγραμμα δεν βρέθηκε">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              <BilingualText
                en="This programme does not exist or is no longer public."
                el="Το πρόγραμμα δεν υπάρχει ή δεν είναι πλέον δημόσιο."
                compact
                wrap
              />
            </p>
            <Button variant="outline" className="mt-4 gap-2" asChild>
              <Link href="/programs">
                <ArrowLeft className="icon-sm" aria-hidden="true" />
                <BilingualText en="All programs" el="Όλα τα προγράμματα" compact />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const deadlinePassed = program.applicationDeadline ? new Date(program.applicationDeadline).getTime() < Date.now() : false;
  const full = program.capacity != null && program.participantCount >= program.capacity;
  // The API takes applications while a program is upcoming or running and
  // before its deadline (program.service `apply`); "active only" closed
  // every upcoming program, which is when most applications arrive.
  const closed = !acceptsApplications(program) || full;

  return (
    <AppShell
      title={program.title}
      description={program.organization?.name}
      askAi={`Is the programme "${program.title}" a good fit for my startup?`}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="grid grid-cols-1 gap-3 p-5 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Building2 className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                {program.organization?.slug ? (
                  <Link href={`/org/${program.organization.slug}`} className="hover:text-primary-accessible">
                    {program.organization.name}
                  </Link>
                ) : (
                  program.organization?.name ?? '—'
                )}
              </p>
              <p className="flex items-center gap-2 capitalize">
                <Badge variant="secondary">{program.programType.replaceAll('_', ' ')}</Badge>
                <Badge variant="outline">{program.status}</Badge>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                {formatDate(program.startDate)} – {formatDate(program.endDate)}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                <BilingualText en={programsEn('application_deadline')} el={programsEl('application_deadline')} compact />:{' '}
                {formatDate(program.applicationDeadline)}
              </p>
              <p className="flex items-center gap-2">
                {program.isRemote ? (
                  <Globe className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <MapPin className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                {program.isRemote ? 'Remote' : program.location ?? '—'}
              </p>
              <p className="flex items-center gap-2">
                <Users className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                {program.participantCount}
                {program.capacity != null && (
                  <>
                    /{program.capacity} <BilingualText en={programsEn('spots_taken')} el={programsEl('spots_taken')} compact />
                  </>
                )}
              </p>
            </CardContent>
          </Card>
          {program.description && (
            <Card>
              <CardContent className="p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed">{program.description}</p>
              </CardContent>
            </Card>
          )}
          {(program.industries?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {program.industries.map((i) => (
                <Badge key={i} variant="secondary">{i}</Badge>
              ))}
            </div>
          )}
          {(program.benefits?.length ?? 0) > 0 && (
            <Card>
              <CardContent className="p-5">
                <ul className="space-y-1.5 text-sm">
                  {program.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 icon-sm shrink-0 text-status-success" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-semibold">
                <BilingualText en={`${programsEn('apply_to')} ${program.title}`} el={`${programsEl('apply_to')} ${program.title}`} compact wrap />
              </p>
              {enrolled ? (
                <Badge className="gap-1.5" variant="secondary">
                  <CheckCircle2 className="icon-sm" aria-hidden="true" />
                  <BilingualText en={programsEn('applied')} el={programsEl('applied')} compact />
                </Badge>
              ) : closed ? (
                <p className="text-sm text-muted-foreground">
                  <BilingualText
                    en={full ? 'The programme is full.' : deadlinePassed ? 'Applications have closed.' : 'This programme is not taking applications.'}
                    el={full ? 'Το πρόγραμμα είναι πλήρες.' : deadlinePassed ? 'Οι αιτήσεις έκλεισαν.' : 'Το πρόγραμμα δεν δέχεται αιτήσεις.'}
                    compact
                    wrap
                  />
                </p>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e) => { e.preventDefault(); apply.mutate(); }}
                >
                  <label htmlFor="program-fit" className="text-sm font-medium">
                    <BilingualText en={programsEn('fit_label')} el={programsEl('fit_label')} compact />{' '}
                    <span className="text-muted-foreground"><BilingualText en={programsEn('optional')} el={programsEl('optional')} compact /></span>
                  </label>
                  <Textarea id="program-fit" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} className="resize-none" />
                  <Button type="submit" className="w-full gap-2" disabled={apply.isPending}>
                    {apply.isPending ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Zap className="icon-sm" aria-hidden="true" />}
                    <BilingualText en={programsEn('submit_application')} el={programsEl('submit_application')} compact />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
