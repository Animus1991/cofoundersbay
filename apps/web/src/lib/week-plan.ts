/**
 * «Ετοίμασε την εβδομάδα μου» (docs §107.7-3, §110.5, §111).
 *
 * One answer for the coming seven days:
 * - what falls due: milestones, overdue ones too;
 * - the events on the calendar;
 * - what waits on the reader: notifications and connection requests.
 *
 * The answer comes with one card of up to four actions. Each is a capability
 * that already exists, runs only when confirmed, and can be taken back:
 * - mark read what needs nothing (`triage_notifications`);
 * - start a milestone that falls due and has not been started
 *   (`update_milestone_status` → in progress).
 *
 * Every figure is one the reader can open and check; nothing is proposed that
 * the reads did not find.
 */
import {
  listConnectionRequests,
  listEvents,
  listMilestones,
  listNotifications,
  type EventItem,
  type Milestone,
} from '@/lib/api';
import { fold } from '@/lib/composer-menu';
import { triageSplit, triageTarget } from '@/lib/notification-chat';
import type { CopilotAction } from '@/lib/copilot-types';

const WEEK_PHRASES = [
  'prepare my week', 'plan my week', 'set up my week', 'get my week ready', 'organise my week', 'organize my week',
  'ετοιμασε την εβδομαδα', 'προετοιμασε την εβδομαδα', 'οργανωσε την εβδομαδα', 'σχεδιασε την εβδομαδα',
];

/** Whether the sentence asks for the week to be prepared (not just shown). */
export function wantsWeekPlan(message: string): boolean {
  const text = fold(message);
  return WEEK_PHRASES.some((phrase) => text.includes(fold(phrase)));
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIONS = 4;
const OPEN_STATUSES = new Set(['todo', 'in_progress', 'blocked']);

export type WeekFacts = {
  due: Milestone[];
  overdue: Milestone[];
  events: EventItem[];
  notifications: { clear: number; keep: number };
  requests: number;
};

/** The week's facts from the reads, with the window ending seven days from `nowMs`. */
export function weekFacts(
  input: { milestones: Milestone[]; events: EventItem[]; notifications: Array<{ type: string; readAt: string | null }>; requests: number },
  nowMs: number,
): WeekFacts {
  const end = nowMs + 7 * DAY_MS;
  const open = input.milestones.filter((m) => OPEN_STATUSES.has(m.status) && m.dueDate);
  const at = (iso: string) => new Date(iso).getTime();
  const split = triageSplit(input.notifications);
  return {
    due: open.filter((m) => at(m.dueDate!) >= nowMs && at(m.dueDate!) <= end).sort((a, b) => at(a.dueDate!) - at(b.dueDate!)),
    overdue: open.filter((m) => at(m.dueDate!) < nowMs).sort((a, b) => at(a.dueDate!) - at(b.dueDate!)),
    events: input.events.filter((e) => at(e.startAt) >= nowMs && at(e.startAt) <= end).sort((a, b) => at(a.startAt) - at(b.startAt)),
    notifications: { clear: split.clear.length, keep: split.keep.length },
    requests: input.requests,
  };
}

function day(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

/** The cards: triage first, then the not-started milestones that fall due soonest. */
export function weekActions(facts: WeekFacts, locale: string, newId: (prefix: string) => string): CopilotAction[] {
  const el = locale === 'el';
  const group = { id: 'week', title: el ? 'Η εβδομάδα σας: ενέργειες που μπορώ να κάνω' : 'Your week: what I can do now' };
  const actions: CopilotAction[] = [];
  if (facts.notifications.clear > 0) {
    actions.push({
      id: newId('week-triage'),
      tool: 'triage_notifications',
      title: `${el ? 'Διαλογή ειδοποιήσεων' : 'Triage notifications'}: ${triageTarget(facts.notifications, locale)}`,
      description: el
        ? 'Όσες δεν χρειάζονται τίποτα από εσάς σημειώνονται ως αναγνωσμένες· όσες σας περιμένουν μένουν. Αναιρείται.'
        : 'The ones that need nothing from you are marked read; the ones waiting on you stay. Can be undone.',
      confirmLabel: el ? 'Σήμανση ως αναγνωσμένων' : 'Mark them read',
      payload: {},
      status: 'pending',
      href: '/notifications',
      group,
    });
  }
  const toStart = [...facts.overdue, ...facts.due].filter((m) => m.status === 'todo');
  for (const milestone of toStart) {
    if (actions.length >= MAX_ACTIONS) break;
    const late = facts.overdue.includes(milestone);
    actions.push({
      id: newId('week-start'),
      tool: 'update_milestone_status',
      title: el
        ? `Έναρξη: «${milestone.title}» (${late ? 'εκπρόθεσμο από' : 'λήγει'} ${day(milestone.dueDate!, locale)})`
        : `Start “${milestone.title}” (${late ? 'overdue since' : 'due'} ${day(milestone.dueDate!, locale)})`,
      description: el
        ? 'Το ορόσημο περνά σε «Σε εξέλιξη». Αναιρείται: επιστρέφει στην κατάσταση που είχε.'
        : 'The milestone moves to "In progress". Can be undone: it goes back to the state it had.',
      confirmLabel: el ? 'Έναρξη' : 'Start it',
      payload: { milestoneId: milestone.id, title: milestone.title, status: 'in_progress' },
      status: 'pending',
      href: '/milestones',
      group,
    });
  }
  return actions;
}

/** The answer's words: the week in figures, with the names that make them checkable. */
export function weekSummary(facts: WeekFacts, locale: string, hasActions: boolean): string {
  const el = locale === 'el';
  const names = (list: Milestone[]) => list.slice(0, 3).map((m) => `${m.title} (${day(m.dueDate!, locale)})`).join(', ');
  const lines: string[] = [];
  if (facts.due.length) {
    lines.push(el
      ? `• ${facts.due.length === 1 ? 'Λήγει 1 ορόσημο' : `Λήγουν ${facts.due.length} ορόσημα`}: ${names(facts.due)}.`
      : `• ${facts.due.length} milestone${facts.due.length === 1 ? '' : 's'} due: ${names(facts.due)}.`);
  }
  if (facts.overdue.length) {
    lines.push(el
      ? `• ${facts.overdue.length === 1 ? '1 εκπρόθεσμο' : `${facts.overdue.length} εκπρόθεσμα`}: ${names(facts.overdue)}.`
      : `• ${facts.overdue.length} overdue: ${names(facts.overdue)}.`);
  }
  if (facts.events.length) {
    const first = facts.events.slice(0, 2).map((e) => `${e.title} (${day(e.startAt, locale)})`).join(', ');
    lines.push(el
      ? `• ${facts.events.length === 1 ? '1 εκδήλωση' : `${facts.events.length} εκδηλώσεις`}: ${first}.`
      : `• ${facts.events.length} event${facts.events.length === 1 ? '' : 's'}: ${first}.`);
  }
  const waiting = facts.notifications.keep + facts.requests;
  if (waiting) {
    lines.push(el
      ? `• Σας περιμένουν: ${facts.notifications.keep} ${facts.notifications.keep === 1 ? 'ειδοποίηση' : 'ειδοποιήσεις'} και ${facts.requests} ${facts.requests === 1 ? 'αίτημα σύνδεσης' : 'αιτήματα σύνδεσης'}.`
      : `• Waiting on you: ${facts.notifications.keep} notification${facts.notifications.keep === 1 ? '' : 's'} and ${facts.requests} connection request${facts.requests === 1 ? '' : 's'}.`);
  }
  if (!lines.length) {
    return el
      ? 'Η εβδομάδα σας είναι ήσυχη: τίποτα δεν λήγει τις επόμενες 7 ημέρες και τίποτα δεν σας περιμένει.'
      : 'Your week is quiet: nothing falls due in the next 7 days and nothing waits on you.';
  }
  const head = el ? '**Οι επόμενες 7 ημέρες**' : '**The next 7 days**';
  const tail = hasActions
    ? (el ? 'Από κάτω, όσα μπορώ να ετοιμάσω τώρα: το καθένα γίνεται μόνο αν το επιβεβαιώσετε, και αναιρείται.' : 'Below, what I can prepare now: each runs only if you confirm it, and can be undone.')
    : '';
  return [head, ...lines, tail].filter(Boolean).join('\n');
}

/** Reads the week and builds the answer; a read that fails leaves its part out. */
export async function planWeek(locale: string, newId: (prefix: string) => string, nowMs = Date.now()): Promise<{ message: string; actions: CopilotAction[] }> {
  const [milestones, events, notifications, requests] = await Promise.all([
    listMilestones({ limit: 100 }).then((r) => r?.milestones ?? []).catch(() => [] as Milestone[]),
    listEvents({ scope: 'mine', limit: 30 }).then((r) => r?.events ?? []).catch(() => [] as EventItem[]),
    listNotifications({ unread: true, limit: 100 }).then((r) => r?.notifications ?? []).catch(() => []),
    listConnectionRequests({ type: 'received', limit: 50 }).then((r) => r?.connections?.length ?? 0).catch(() => 0),
  ]);
  const facts = weekFacts({ milestones, events, notifications, requests }, nowMs);
  const actions = weekActions(facts, locale, newId);
  return { message: weekSummary(facts, locale, actions.length > 0), actions };
}
