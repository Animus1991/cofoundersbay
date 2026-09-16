'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Users,
  Video,
  MapPin,
  Plus,
  Filter,
  LayoutGrid,
  List,
  CalendarDays,
  Sparkles,
  MessageCircle,
  Target,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { bilingualAria } from '@/lib/i18n/format';

// ── Types ────────────────────────────────────────────────────────────────────

type EventType = 'milestone' | 'session' | 'event' | 'deadline' | 'meeting';

interface CalendarEvent {
  id: string;
  title: string;
  titleEl?: string;
  type: EventType;
  date: string; // ISO date
  time?: string;
  endTime?: string;
  description?: string;
  location?: string;
  locationEl?: string;
  participants?: string[];
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  href?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EventType, { labelEn: string; labelEl: string; color: string; icon: React.ElementType; bg: string }> = {
  milestone:  { labelEn: 'Milestone', labelEl: 'Ορόσημο', color: 'text-status-warning',   icon: Flag,           bg: 'bg-status-warning-bg border-status-warning-border' },
  session:    { labelEn: 'Session',   labelEl: 'Συνεδρία', color: 'text-status-info',    icon: Video,          bg: 'bg-status-info-bg border-status-info-border' },
  event:      { labelEn: 'Event',     labelEl: 'Εκδήλωση', color: 'text-status-accent',  icon: CalendarDays,   bg: 'bg-status-accent-bg border-status-accent-border' },
  deadline:   { labelEn: 'Deadline',  labelEl: 'Προθεσμία', color: 'text-status-danger',     icon: Clock,          bg: 'bg-status-danger-bg border-status-danger-border' },
  meeting:    { labelEn: 'Meeting',   labelEl: 'Συνάντηση', color: 'text-status-success', icon: Users,          bg: 'bg-status-success-bg border-status-success-border' },
};

const DAYS = [
  { en: 'Sun', el: 'Κυ' },
  { en: 'Mon', el: 'Δε' },
  { en: 'Tue', el: 'Τρ' },
  { en: 'Wed', el: 'Τε' },
  { en: 'Thu', el: 'Πε' },
  { en: 'Fri', el: 'Πα' },
  { en: 'Sat', el: 'Σα' },
];
const MONTHS = [
  { en: 'January', el: 'Ιανουάριος' },
  { en: 'February', el: 'Φεβρουάριος' },
  { en: 'March', el: 'Μάρτιος' },
  { en: 'April', el: 'Απρίλιος' },
  { en: 'May', el: 'Μάιος' },
  { en: 'June', el: 'Ιούνιος' },
  { en: 'July', el: 'Ιούλιος' },
  { en: 'August', el: 'Αύγουστος' },
  { en: 'September', el: 'Σεπτέμβριος' },
  { en: 'October', el: 'Οκτώβριος' },
  { en: 'November', el: 'Νοέμβριος' },
  { en: 'December', el: 'Δεκέμβριος' },
];

// ── Demo Data ────────────────────────────────────────────────────────────────

// UTC throughout, like every other date the product renders.
//
// `new Date(y, m, day, hour, min)` builds the instant in the *runtime's* zone,
// so the demo events themselves came out different on the server (UTC) than in
// the browser: at UTC+14 this produced a timestamp 14 hours earlier, which lands
// on a different calendar day, and at the extremes `now.getMonth()` was a
// different month entirely. The grid, the events and the "today" highlight all
// disagreed, and React could not hydrate the page.
const now = new Date();
const y = now.getUTCFullYear();
const m = now.getUTCMonth();

function d(day: number, hour = 10, min = 0) {
  return new Date(Date.UTC(y, m, day, hour, min)).toISOString();
}

const DEMO_EVENTS: CalendarEvent[] = [
  { id: '1',  title: 'MVP Sprint Review',           titleEl: 'Ανασκόπηση sprint MVP',           type: 'milestone', date: d(2),  priority: 'high',   status: 'in_progress', href: '/milestones' },
  { id: '2',  title: 'Mentor Session — Sarah Lee',  titleEl: 'Συνεδρία μέντορα — Sarah Lee',    type: 'session',   date: d(4, 14), time: '14:00', endTime: '15:00', participants: ['Sarah Lee'], href: '/mentor/sessions' },
  { id: '3',  title: 'Pitch Deck Deadline',          titleEl: 'Προθεσμία pitch deck',             type: 'deadline',  date: d(7),  priority: 'high',   href: '/builder/pitch-deck' },
  { id: '4',  title: 'Startup Meetup Athens',        titleEl: 'Meetup νεοφυών Αθήνα',             type: 'event',     date: d(9, 18), time: '18:00', endTime: '21:00', location: 'Impact Hub Athens', locationEl: 'Impact Hub Αθήνα', href: '/events' },
  { id: '5',  title: 'Team Standup',                 titleEl: 'Standup ομάδας',                   type: 'meeting',   date: d(10, 9, 30), time: '09:30', endTime: '10:00', participants: ['Alex', 'Maria', 'Nikos'] },
  { id: '6',  title: 'Seed Round Application',       titleEl: 'Αίτηση Seed round',                type: 'deadline',  date: d(12), priority: 'high',   href: '/fundraising' },
  { id: '7',  title: 'Co-founder Interview',         titleEl: 'Συνέντευξη συνιδρυτή',             type: 'meeting',   date: d(14, 11), time: '11:00', endTime: '11:45', participants: ['Dimitris K.'] },
  { id: '8',  title: 'Accelerator Demo Day',         titleEl: 'Demo Day επιταχυντή',              type: 'event',     date: d(18, 16), time: '16:00', endTime: '20:00', location: 'Online (Zoom)', locationEl: 'Διαδικτυακά (Zoom)', href: '/events' },
  { id: '9',  title: 'Market Analysis Due',          titleEl: 'Λήξη ανάλυσης αγοράς',             type: 'milestone', date: d(20), priority: 'medium', status: 'pending', href: '/milestones' },
  { id: '10', title: 'Advisor Call — Dr. Papadakis', titleEl: 'Κλήση συμβούλου — Δρ. Παπαδάκης', type: 'session',   date: d(22, 15), time: '15:00', endTime: '15:30', participants: ['Dr. Papadakis'] },
  { id: '11', title: 'Grant Submission Deadline',    titleEl: 'Προθεσμία υποβολής grant',         type: 'deadline',  date: d(25), priority: 'high',   href: '/fundraising' },
  { id: '12', title: 'User Testing Round 2',         titleEl: 'Δοκιμές χρηστών γύρος 2',          type: 'milestone', date: d(27), priority: 'medium', status: 'pending' },
  { id: '13', title: 'Community AMA',                titleEl: 'AMA κοινότητας',                   type: 'event',     date: d(28, 19), time: '19:00', endTime: '20:00', location: 'Discord', href: '/events' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

const MONTH_SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  el: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'],
} as const;

/** Controlled "22 Σεπ" — locale short-month on Windows el-GR overflowed a
 *  56px column and the day digit clipped into what read as "?? Σεπ". */
function formatUpcomingDate(iso: string, lang: 'en' | 'el'): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return `${dt.getUTCDate()} ${MONTH_SHORT[lang][dt.getUTCMonth()]}`;
}

// ── Components ───────────────────────────────────────────────────────────────

function EventChip({ event }: { event: CalendarEvent }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;
  const Wrapper = event.href ? Link : 'div';
  const wrapperProps = event.href ? { href: event.href } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-3 transition-all hover:shadow-sm',
        cfg.bg,
      )}
    >
      <div className={cn('mt-0.5 rounded-md p-1.5', cfg.bg)}>
        <Icon className={cn('icon-sm', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium">
            <BilingualText en={event.title} el={event.titleEl} compact />
          </span>
          {event.priority === 'high' && (
            <Badge variant="destructive" size="sm" className="px-1">
              <BilingualText en="High" el="Υψηλή" compact secondaryClassName="hidden" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {event.time && (
            <span className="flex items-center gap-0.5"><Clock className="icon-sm" aria-hidden="true" />{event.time}{event.endTime ? ` – ${event.endTime}` : ''}</span>
          )}
          {event.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="icon-sm" />
              <BilingualText en={event.location} el={event.locationEl} compact />
            </span>
          )}
          {event.participants && event.participants.length > 0 && (
            <span className="flex items-center gap-0.5"><Users className="icon-sm" aria-hidden="true" />{event.participants.join(', ')}</span>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="h-4 shrink-0 text-2xs">
        <BilingualText en={cfg.labelEn} el={cfg.labelEl} compact secondaryClassName="hidden" />
      </Badge>
    </Wrapper>
  );
}

function MiniCalendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  events,
}: {
  year: number;
  month: number;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  events: CalendarEvent[];
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const eventDates = useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => {
      const ed = new Date(e.date);
      if (ed.getUTCFullYear() === year && ed.getUTCMonth() === month) set.add(ed.getUTCDate());
    });
    return set;
  }, [events, year, month]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d) => (
          <div key={d.en} className="py-1 text-center text-xs font-medium text-muted-foreground">
            <BilingualText en={d.en} el={d.el} compact secondaryClassName="hidden" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          // Date.UTC, to match isSameDay below. The local constructor put this
          // cell on the previous calendar day at UTC+14, so `isToday` and
          // `isSelected` — and therefore the cell's className — differed between
          // the server and the browser.
          const date = new Date(Date.UTC(year, month, day));
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasEvents = eventDates.has(day);
          return (
            <button
              key={day}
              onClick={() => onSelectDate(date)}
              className={cn(
                'relative h-8 w-full rounded-md text-xs transition-all hover:bg-secondary',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                isToday && !isSelected && 'border border-primary/50 font-bold',
              )}
            >
              {day}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { primary } = useLanguagePreference();
  const [currentMonth, setCurrentMonth] = useState(now.getUTCMonth());
  const [currentYear, setCurrentYear] = useState(now.getUTCFullYear());
  const [selectedDate, setSelectedDate] = useState(now);
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const filteredEvents = useMemo(() => {
    let evts = DEMO_EVENTS;
    if (typeFilter !== 'all') evts = evts.filter((e) => e.type === typeFilter);
    return evts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [typeFilter]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => isSameDay(new Date(e.date), selectedDate));
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const n = new Date();
    const todayStart = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
    return filteredEvents.filter((e) => new Date(e.date) >= todayStart).slice(0, 8);
  }, [filteredEvents]);

  // Stats
  const thisMonthEvents = filteredEvents.filter((e) => {
    const ed = new Date(e.date);
    return ed.getUTCFullYear() === currentYear && ed.getUTCMonth() === currentMonth;
  });
  const deadlineCount = thisMonthEvents.filter((e) => e.type === 'deadline').length;
  const sessionCount = thisMonthEvents.filter((e) => e.type === 'session').length;
  const milestoneCount = thisMonthEvents.filter((e) => e.type === 'milestone').length;

  return (
    <AppShell
      showHelp
      askAi="The calendar still shows sample items. What live surfaces should I use for sessions, events, and milestones, and what should I do next?"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setView('calendar')} aria-label={bilingualAria('Calendar view', 'Προβολή ημερολογίου')}>
              <LayoutGrid className="icon-sm" />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setView('list')} aria-label={bilingualAria('List view', 'Προβολή λίστας')}>
              <List className="icon-sm" />
            </Button>
          </div>
          {/* /events/create has existed all along. */}
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/events/create"><Plus className="icon-sm" /> <BilingualText en="Add Event" el="Προσθήκη εκδήλωσης" compact /></Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <SampleDataNotice
          surface="Calendar"
          detail="Live sessions, events, and milestone due dates are not merged into one API yet. These items are samples so you can learn the layout. Ask the assistant to open Events or Milestones instead."
          askAiPrompt="The calendar still shows sample items. What live surfaces should I use for sessions, events, and milestones, and what should I do next?"
        />

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { labelEn: 'This Month', labelEl: 'Αυτόν τον μήνα', value: thisMonthEvents.length, icon: CalendarIcon, color: 'text-primary-accessible' },
            { labelEn: 'Deadlines', labelEl: 'Προθεσμίες', value: deadlineCount, icon: Clock, color: 'text-status-danger' },
            { labelEn: 'Sessions', labelEl: 'Συνεδρίες', value: sessionCount, icon: Video, color: 'text-status-info' },
            { labelEn: 'Milestones', labelEl: 'Ορόσημα', value: milestoneCount, icon: Flag, color: 'text-status-warning' },
          ].map(({ labelEn, labelEl, value, icon: Icon, color }) => (
            <Card key={labelEn}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('icon-sm', color)} /></div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground"><BilingualText en={labelEn} el={labelEl} compact /></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={typeFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setTypeFilter('all')}><BilingualText en="All" el="Όλα" compact /></Button>
          {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([key, cfg]) => (
            <Button key={key} variant={typeFilter === key ? 'default' : 'outline'} size="sm" className="gap-1" onClick={() => setTypeFilter(key)}>
              <cfg.icon className="icon-sm" /> <BilingualText en={cfg.labelEn} el={cfg.labelEl} compact secondaryFrom="lg" />
            </Button>
          ))}
        </div>

        {view === 'calendar' ? (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Left: Mini calendar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={prevMonth} aria-label={bilingualAria('Previous month', 'Προηγούμενος μήνας')}><ChevronLeft className="icon-sm" /></Button>
                    <span className="text-sm font-semibold">
                      <BilingualText en={MONTHS[currentMonth].en} el={MONTHS[currentMonth].el} compact secondaryClassName="hidden" />{' '}
                      {currentYear}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} aria-label={bilingualAria('Next month', 'Επόμενος μήνας')}><ChevronRight className="icon-sm" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <MiniCalendar
                    year={currentYear}
                    month={currentMonth}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    events={filteredEvents}
                  />
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-2"><BilingualText en="Event Types" el="Τύποι εκδηλώσεων" compact /></p>
                  {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <cfg.icon className={cn('icon-sm', cfg.color)} />
                      <span className="text-muted-foreground">
                        <BilingualText en={cfg.labelEn} el={cfg.labelEl} compact />
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: Selected day events + upcoming */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="icon-sm text-primary-accessible" />
                    <BilingualText
                      en={selectedDate.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      el={selectedDate.toLocaleDateString('el-GR', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      wrap
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDayEvents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayEvents.map((e) => <EventChip key={e.id} event={e} />)}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground"><BilingualText en="No events on this day" el="Καμία εκδήλωση αυτή την ημέρα" /></p>
                      <Button asChild variant="outline" size="sm" className="mt-3 gap-1">
                        <Link href="/events/create"><Plus className="icon-sm" /> <BilingualText en="Schedule something" el="Προγραμματισμός" compact /></Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="icon-sm text-primary-accessible" /> <BilingualText en="Upcoming" el="Επερχόμενες" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingEvents.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 text-sm">
                        <span className="w-[4.5rem] shrink-0 tabular-nums text-xs text-muted-foreground">
                          {formatUpcomingDate(e.date, primary)}
                        </span>
                        <div className={cn('h-2 w-2 rounded-full shrink-0', TYPE_CONFIG[e.type].color.replace('text-', 'bg-'))} />
                        <span className="min-w-0 flex-1 truncate">
                          <BilingualText en={e.title} el={e.titleEl} compact />
                        </span>
                        <Badge variant="secondary" className="h-4 shrink-0 text-2xs">
                          <BilingualText en={TYPE_CONFIG[e.type].labelEn} el={TYPE_CONFIG[e.type].labelEl} compact secondaryClassName="hidden" />
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((e) => <EventChip key={e.id} event={e} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground"><BilingualText en="No events match your filters" el="Καμία εκδήλωση δεν ταιριάζει με τα φίλτρα" /></p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
