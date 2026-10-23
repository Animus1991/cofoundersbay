'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Info,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/hooks/useSession';
import { getMeProfile, getMyMentorListing, listMentorAvailability, replaceMentorAvailability, saveMyMentorListing } from '@/lib/api';
import { FailedLine } from '@/components/dashboard/SectionCard';
import { qk, queryKeys } from '@/lib/query-keys';
import { rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { BilingualText } from '@/components/common/BilingualText';
import { CardHead } from '@/components/common/CardAnatomy';
import { bilingualAria } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { durationEl } from '@/lib/i18n/units';

const DAYS = [
  { key: 0, label: 'Sunday',    short: 'Sun' },
  { key: 1, label: 'Monday',    short: 'Mon' },
  { key: 2, label: 'Tuesday',   short: 'Tue' },
  { key: 3, label: 'Wednesday', short: 'Wed' },
  { key: 4, label: 'Thursday',  short: 'Thu' },
  { key: 5, label: 'Friday',    short: 'Fri' },
  { key: 6, label: 'Saturday',  short: 'Sat' },
];

const DAY_EL: Record<number, string> = {
  0: 'Κυριακή', 1: 'Δευτέρα', 2: 'Τρίτη', 3: 'Τετάρτη', 4: 'Πέμπτη', 5: 'Παρασκευή', 6: 'Σάββατο',
};

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${h12}:${m} ${ampm}` };
});

const TIMEZONES = [
  'UTC', 'Europe/Athens', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney',
];

const DURATIONS = [
  { value: 15, label: '15 min', labelEl: '15 λεπτά' },
  { value: 30, label: '30 min', labelEl: '30 λεπτά' },
  { value: 45, label: '45 min', labelEl: '45 λεπτά' },
  { value: 60, label: '1 hour', labelEl: '1 ώρα' },
  { value: 90, label: '1.5 hours', labelEl: '1,5 ώρα' },
  { value: 120, label: '2 hours', labelEl: '2 ώρες' },
];

interface TimeSlot {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

const defaultSlots: TimeSlot[] = [
  { id: '1', weekday: 1, startTime: '09:00', endTime: '12:00' },
  { id: '2', weekday: 2, startTime: '14:00', endTime: '17:00' },
  { id: '3', weekday: 4, startTime: '10:00', endTime: '13:00' },
];

export default function MentorAvailabilityPage() {
  const { hasSession, mounted } = useSession();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [slots, setSlotsState] = useState<TimeSlot[]>(defaultSlots);
  // Greek reads the 24-hour clock (10:00, 13:30), not AM/PM.
  const { primary } = useLanguagePreference();
  const timeLabel = (t: { value: string; label: string }) => (primary === 'el' ? t.value : t.label);
  const [timezone, setTimezoneState] = useState('Europe/Athens');
  // Edits since the hours were last read or saved.
  const [dirty, setDirty] = useState(false);
  const setSlots = (next: TimeSlot[] | ((prev: TimeSlot[]) => TimeSlot[])) => { setSlotsState(next); setDirty(true); };
  const setTimezone = (tz: string) => { setTimezoneState(tz); setDirty(true); };
  const [sessionDuration, setSessionDurationState] = useState(30);
  const setSessionDuration = (n: number) => { setSessionDurationState(n); setDirty(true); };
  const [bufferTime, setBufferTime] = useState(15);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeHours, setNoticeHours] = useState(24);

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  /*
   * The weekly hours are stored: `PUT /mentor/availability` replaces them and
   * GET reads them back. Save used to wait 800ms and announce "Availability
   * saved" without calling either, so nothing a mentor set here ever reached
   * a mentee. The three slots below are a starting point shown only while
   * nothing is stored, and the page says they are not saved yet.
   */
  const { data: stored, isLoading: storedLoading, isError: storedError, isFetching: storedFetching, refetch: refetchStored } = useQuery({
    queryKey: qk('mentors', 'availability', 'mine'),
    queryFn: () => listMentorAvailability(),
    enabled: hasSession && mounted,
    retry: 0,
  });
  /*
   * With the saved hours unread, the page showed the three starting slots as
   * the week and offered Save, which would have replaced the stored week with
   * them. Unread, it says so and saving waits (docs §94).
   */
  const storedFailed = storedError && !stored;

  /*
   * "Accepting Requests" was kept on this page only. It is the listing's own
   * switch (the one on the mentor profile), so it reads and writes there.
   * The session length is the listing's too.
   */
  const listing = useQuery({
    queryKey: qk('mentors', 'listing', 'me'),
    queryFn: getMyMentorListing,
    enabled: hasSession && mounted,
    retry: 0,
  });
  const isAccepting = listing.data ? listing.data.isAcceptingRequests !== false : true;
  useEffect(() => {
    const d = listing.data?.sessionDuration;
    if (typeof d === 'number' && DURATIONS.some((x) => x.value === d)) setSessionDurationState(d);
  }, [listing.data?.sessionDuration]);
  const acceptMutation = useMutation({
    mutationFn: (on: boolean) => saveMyMentorListing({ isAcceptingRequests: on }),
    onSuccess: (row) => {
      queryClient.setQueryData(qk('mentors', 'listing', 'me'), row);
      void queryClient.invalidateQueries({ queryKey: qk('mentors') });
      success(row.isAcceptingRequests === false ? 'Requests paused' : 'Accepting requests');
    },
    onError: (e) => showError('Could not change the listing', e instanceof Error ? e.message : undefined),
  });
  const storedSlots = stored?.slots ?? null;
  useEffect(() => {
    if (!storedSlots || dirty) return;
    if (storedSlots.length > 0) {
      setSlotsState(storedSlots.map((sl) => ({ id: sl.id, weekday: sl.weekday, startTime: sl.startTime, endTime: sl.endTime })));
      const tz = storedSlots.find((sl) => sl.timezone)?.timezone;
      if (tz) setTimezoneState(tz);
    }
    // Only when a new read arrives; local edits win until they are saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedSlots]);
  const unsaved = dirty || (storedSlots !== null && storedSlots.length === 0 && slots.length > 0);

  function addSlot(weekday: number) {
    const newSlot: TimeSlot = {
      id: `${Date.now()}`,
      weekday,
      startTime: '09:00',
      endTime: '10:00',
    };
    setSlots(prev => [...prev, newSlot]);
  }

  function removeSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  function updateSlot(id: string, field: 'startTime' | 'endTime', value: string) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  async function handleSave(): Promise<PageControlRunResult> {
    if (storedFailed) return { error: 'Your saved hours have not been read, so saving would replace them.' };
    setIsSaving(true);
    try {
      const res = await replaceMentorAvailability(
        slots.map((sl) => ({ weekday: sl.weekday, startTime: sl.startTime, endTime: sl.endTime, timezone })),
      );
      queryClient.setQueryData(qk('mentors', 'availability', 'mine'), res);
      // The default length lives on the listing; it was set here and never kept.
      if (listing.data?.sessionDuration !== sessionDuration && !listing.isError) {
        const row = await saveMyMentorListing({ sessionDuration });
        queryClient.setQueryData(qk('mentors', 'listing', 'me'), row);
      }
      setDirty(false);
      success('Availability saved', 'Your schedule has been updated.');
    } catch (e) {
      showError('Could not save your availability', e instanceof Error ? e.message : undefined);
      return { error: e instanceof Error && e.message ? e.message : 'Your hours were not saved.' };
    } finally {
      setIsSaving(false);
    }
  }

  // The schedule, offered to the assistant: save, clear a day, remove a slot,
  // change the time zone. Saving replaces the stored week; the page keeps the
  // previous week only until the next read, so none of these names an undo.
  const dayName = (d: number) => DAYS.find((x) => x.key === d)?.label ?? String(d);
  usePageControls([
    {
      id: 'save_availability',
      labelEn: 'Save my weekly hours',
      labelEl: 'Αποθήκευση εβδομαδιαίων ωρών',
      writes: true,
      unavailableEn: !hasSession ? 'Sign in first.' : storedFailed ? 'Your saved hours have not been read yet.' : undefined,
      unavailableEl: !hasSession ? 'Συνδεθείτε πρώτα.' : storedFailed ? 'Οι αποθηκευμένες ώρες σας δεν έχουν διαβαστεί ακόμη.' : undefined,
      run: handleSave,
    },
    {
      id: 'remove_slot',
      labelEn: 'Remove a time slot (before saving)',
      labelEl: 'Αφαίρεση χρονοθυρίδας (πριν την αποθήκευση)',
      writes: false,
      options: rowOptions(slots, (sl) => sl.id, (sl) => `${dayName(sl.weekday)} ${sl.startTime}-${sl.endTime}`),
      unavailableEn: slots.length === 0 ? 'No slots are set.' : undefined,
      unavailableEl: slots.length === 0 ? 'Δεν υπάρχουν χρονοθυρίδες.' : undefined,
      run: (value) => { if (value) removeSlot(value); },
    },
    {
      id: 'add_slot',
      labelEn: 'Add a 9-10am slot on a day (before saving)',
      labelEl: 'Προσθήκη χρονοθυρίδας 9-10 π.μ. σε μια ημέρα (πριν την αποθήκευση)',
      writes: false,
      options: DAYS.map((d) => ({ value: String(d.key), labelEn: d.label, labelEl: DAY_EL[d.key] })),
      run: (value) => { if (value != null) addSlot(Number(value)); },
    },
    {
      id: 'time_zone',
      labelEn: 'Time zone of the hours',
      labelEl: 'Ζώνη ώρας των ωρών',
      writes: false,
      options: TIMEZONES.map((tz) => ({ value: tz, labelEn: tz, labelEl: tz })),
      current: timezone,
      run: (value) => { if (value) setTimezone(value); },
    },
  ]);
  usePageList([
    {
      id: 'availability_slots',
      labelEn: unsaved ? 'Weekly hours (not saved yet)' : 'Weekly hours',
      labelEl: unsaved ? 'Εβδομαδιαίες ώρες (δεν έχουν αποθηκευτεί)' : 'Εβδομαδιαίες ώρες',
      rows: storedLoading || storedFailed ? undefined : [...slots].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)).map((sl) => `${dayName(sl.weekday)} ${sl.startTime}-${sl.endTime} (${timezone})`),
      total: slots.length,
      sample: false,
    },
  ]);

  const weeklyHours = slots.reduce((acc, slot) => {
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return acc + Math.max(0, duration);
  }, 0) / 60;

  if (!mounted) {
    return (
      <AppShell showHelp>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHelp
      actions={
        <>
          <Button onClick={() => void handleSave()} disabled={isSaving || storedFailed || storedLoading}>
            {isSaving ? <RefreshCw className="mr-2 icon-sm animate-spin" aria-hidden="true" /> : <Save className="mr-2 icon-sm" aria-hidden="true" />}
            <BilingualText en="Save Changes" el="Αποθήκευση" compact />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {storedFailed ? (
          <Card>
            <CardContent className="pt-6">
              <FailedLine
                en="Your saved hours could not be read just now. Saving waits until they are, so it cannot replace them."
                el="Οι αποθηκευμένες ώρες σας δεν διαβάστηκαν αυτή τη στιγμή. Η αποθήκευση περιμένει, ώστε να μην τις αντικαταστήσει."
                busy={storedFetching}
                onRetry={() => void refetchStored()}
              />
            </CardContent>
          </Card>
        ) : null}
        {unsaved && !storedLoading && !storedFailed && (
          <p role="status" className="rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-2.5 text-sm">
            <BilingualText
              en={storedSlots && storedSlots.length === 0 && !dirty
                ? 'Nothing is saved yet - these hours are a starting point. Save to make them bookable.'
                : 'You have changes that are not saved yet.'}
              el={storedSlots && storedSlots.length === 0 && !dirty
                ? 'Δεν έχει αποθηκευτεί τίποτα ακόμη - αυτές οι ώρες είναι μια αφετηρία. Αποθηκεύστε για να γίνουν διαθέσιμες για κρατήσεις.'
                : 'Έχετε αλλαγές που δεν έχουν αποθηκευτεί.'}
              wrap
            />
          </p>
        )}
        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium"><BilingualText en="Accepting Requests" el="Δέχεται αιτήματα" compact /></span>
                <Switch
                  checked={isAccepting}
                  disabled={listing.isLoading || listing.isError || acceptMutation.isPending}
                  onCheckedChange={(on) => acceptMutation.mutate(on)}
                  aria-label="Accepting Requests. Δέχεται αιτήματα"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {listing.isError ? (
                  <BilingualText en="Your listing could not be read just now, so this cannot change." el="Η καταχώρισή σας δεν διαβάστηκε αυτή τη στιγμή, οπότε αυτό δεν αλλάζει." compact wrap />
                ) : (
                  <BilingualText
                    en="Saved with your mentor listing: founders can send you requests while it is on."
                    el="Αποθηκεύεται στην καταχώρισή σας ως μέντορας: οι ιδρυτές σας στέλνουν αιτήματα όσο είναι ενεργό."
                    compact
                    wrap
                  />
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="icon-sm text-muted-foreground" />
                <span className="text-sm font-medium"><BilingualText en="Weekly Hours" el="Εβδομαδιαίες ώρες" compact /></span>
              </div>
              {/* The starting slots' 9.0h stood here while the saved week
                  was unread. */}
              {storedFailed ? (
                <p className="page-stat text-xl font-bold">{'\u2014'}</p>
              ) : (
                <>
                  <p className="page-stat text-xl font-bold"><BilingualText en={`${weeklyHours.toFixed(1)}h`} el={durationEl(`${weeklyHours.toFixed(1)}h`)} compact /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en={`across ${slots.length} time blocks`} el={`σε ${slots.length} χρονοθυρίδες`} compact /></p>
                </>
              )}
            </CardContent>
          </Card>
          {/* The zone is shown and changed in one place: this card (it once had
              a second card under the tabs holding the same value's select). */}
          <Card>
            <CardContent className="space-y-2">
              <Label htmlFor="mentor-timezone" className="text-sm font-medium"><BilingualText en="Timezone" el="Ζώνη ώρας" compact /></Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="mentor-timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground"><BilingualText en="All times shown in local time" el="Όλες οι ώρες σε τοπική ώρα" compact /></p>
            </CardContent>
          </Card>
        </div>

        {storedFailed ? null : (
        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule"><BilingualText en="Weekly Schedule" el="Εβδομαδιαίο πρόγραμμα" compact /></TabsTrigger>
            <TabsTrigger value="preferences"><BilingualText en="Session Preferences" el="Προτιμήσεις συνεδριών" compact /></TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-3">
              {DAYS.map(day => {
                const daySlots = slots.filter(s => s.weekday === day.key);
                return (
                  <Card key={day.key}>
                    <CardContent className="space-y-3">
                      {/* A day is a card head with its count under it and Add
                          at the right; the slots start on the day's edge. */}
                      <CardHead
                        title={<BilingualText en={day.label} el={DAY_EL[day.key]} compact />}
                        meta={daySlots.length > 0 ? (
                          <BilingualText
                            en={`${daySlots.length} slot${daySlots.length > 1 ? 's' : ''}`}
                            el={`${daySlots.length} ${daySlots.length > 1 ? 'χρονοθυρίδες' : 'χρονοθυρίδα'}`}
                            compact
                          />
                        ) : (
                          <BilingualText en="Unavailable" el="Μη διαθέσιμο" compact />
                        )}
                        asideStays
                        aside={(
                          <Button size="sm" variant="ghost" onClick={() => addSlot(day.key)}>
                            <Plus className="icon-sm mr-1" aria-hidden="true" /> <BilingualText en="Add" el="Προσθήκη" compact />
                          </Button>
                        )}
                      />
                      {daySlots.length > 0 && (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <Select value={slot.startTime} onValueChange={v => updateSlot(slot.id, 'startTime', v)}>
                                <SelectTrigger aria-label={bilingualAria(`${day.label} start time`, `${DAY_EL[day.key]}: ώρα έναρξης`)} className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIMES.map(t => (
                                    <SelectItem key={t.value} value={t.value} className="text-xs">{timeLabel(t)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-muted-foreground text-xs"><BilingualText en="to" el="έως" compact /></span>
                              <Select value={slot.endTime} onValueChange={v => updateSlot(slot.id, 'endTime', v)}>
                                <SelectTrigger aria-label={bilingualAria(`${day.label} end time`, `${DAY_EL[day.key]}: ώρα λήξης`)} className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIMES.map(t => (
                                    <SelectItem key={t.value} value={t.value} className="text-xs">{timeLabel(t)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button aria-label={bilingualAria(`Delete ${day.label} ${slot.startTime}–${slot.endTime}`, `Διαγραφή: ${DAY_EL[day.key]} ${slot.startTime}–${slot.endTime}`)}
                                variant="ghost"
                                className="h-8 w-8 gap-1.5 text-muted-foreground hover:text-destructive-accessible sm:w-auto sm:px-3"
                                onClick={() => removeSlot(slot.id)}
                              >
                                <Trash2 className="icon-sm" />
                                <span className="hidden sm:inline"><BilingualText en="Delete" el="Διαγραφή" compact /></span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle><BilingualText en="Session Settings" el="Ρυθμίσεις συνεδριών" compact /></CardTitle>
                <CardDescription>
                  <BilingualText
                    en="Save keeps the weekly hours, the time zone and the default length; buffer and notice are not stored yet."
                    el="Η αποθήκευση κρατά τις εβδομαδιαίες ώρες, τη ζώνη ώρας και την προεπιλεγμένη διάρκεια· διάλειμμα και προειδοποίηση δεν αποθηκεύονται ακόμη."
                    compact
                    wrap
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionDuration"><BilingualText en="Default Session Duration" el="Προεπιλεγμένη διάρκεια συνεδρίας" compact /></Label>
                    <Select value={String(sessionDuration)} onValueChange={v => setSessionDuration(Number(v))}>
                      <SelectTrigger id="sessionDuration" aria-label={bilingualAria('Default Session Duration', 'Προεπιλεγμένη διάρκεια συνεδρίας')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map(d => (
                          <SelectItem key={d.value} value={String(d.value)}><BilingualText en={d.label} el={d.labelEl} compact /></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground"><BilingualText en="Default length for new bookings" el="Προεπιλεγμένη διάρκεια νέων κρατήσεων" compact /></p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bufferTime"><BilingualText en="Buffer Between Sessions" el="Διάλειμμα μεταξύ συνεδριών" compact /></Label>
                    <Select value={String(bufferTime)} onValueChange={v => setBufferTime(Number(v))}>
                      <SelectTrigger id="bufferTime" aria-label={bilingualAria('Buffer Between Sessions', 'Διάλειμμα μεταξύ συνεδριών')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 5, 10, 15, 30, 60].map(m => (
                          <SelectItem key={m} value={String(m)}>{m === 0 ? <BilingualText en="No buffer" el="Χωρίς διάλειμμα" compact /> : <BilingualText en={`${m} min`} el={`${m} λεπτά`} compact />}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground"><BilingualText en="Gap between consecutive bookings" el="Κενό μεταξύ διαδοχικών κρατήσεων" compact /></p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="noticeHours"><BilingualText en="Minimum Notice Period" el="Ελάχιστη προειδοποίηση" compact /></Label>
                    <Select value={String(noticeHours)} onValueChange={v => setNoticeHours(Number(v))}>
                      <SelectTrigger id="noticeHours" aria-label={bilingualAria('Minimum Notice Period', 'Ελάχιστη προειδοποίηση')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                          <SelectItem key={h} value={String(h)}>{h < 24 ? <BilingualText en={`${h}h`} el={`${h} ώρ.`} compact /> : <BilingualText en={`${h / 24}d`} el={`${h / 24} ημ.`} compact />}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground"><BilingualText en="Advance booking notice required" el="Απαιτούμενη προειδοποίηση για κράτηση" compact /></p>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div className="flex items-start gap-3 p-3 rounded-lg bg-status-info-bg border border-status-info-border">
                  <Info className="icon-sm text-status-info mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {/* Nothing on the booking side reads these hours yet, so
                        this no longer promises mentees see them. */}
                    <BilingualText
                      en="Saved hours are stored with your mentor account. Bookings mentees make appear in your upcoming sessions."
                      el="Οι αποθηκευμένες ώρες κρατιούνται στον λογαριασμό μέντορά σας. Οι κρατήσεις των καθοδηγούμενων εμφανίζονται στις προσεχείς συνεδρίες σας."
                      wrap
                    />
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </AppShell>
  );
}
