/**
 * The assistant's one suggestion on /home (docs §142).
 *
 * Parea's plan put "proactive assistant cards in the Home feed, one at a
 * time, with Dismiss" first among its AI steps: the assistant offers before
 * it is asked, without noise. Here it offers one thing at a time, chosen from
 * what the page has already read, and only something the page does not
 * already say:
 *
 * 1. an event the reader is going to within the week: who to meet there;
 * 2. a person who fits beyond the three on the page and has no link with the
 *    reader yet: a first message, drafted;
 * 3. otherwise the week: «Ετοίμασε την εβδομάδα μου», the existing week plan
 *    (lib/week-plan) with its card of actions.
 *
 * "Not now" puts one away for a week; the next one takes its place.
 */
import type { AskText } from '@/lib/page-questions';

export type HomeSuggestionId = `event:${string}` | `person:${string}` | 'week';

export interface HomeSuggestion {
  id: HomeSuggestionId;
  /** One sentence, the offer itself. */
  en: string;
  el: string;
  /** The yes: what is asked of the assistant. */
  yes: { en: string; el: string };
  prompt: AskText;
}

export interface SuggestionPerson {
  userId: string;
  displayName: string;
}

export interface SuggestionEvent {
  id: string;
  title: string;
  startAt: string;
  viewerRsvp: 'going' | 'interested' | 'not_going' | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const SNOOZE_MS = 7 * DAY_MS;
export const SUGGESTION_STORAGE_KEY = 'cfb:home-suggestion-snoozed';

/** "today", "tomorrow", "in 3 days", in both languages. */
function inDays(startAt: string, now: Date): { en: string; el: string } {
  const start = new Date(startAt);
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(start) - midnight(now)) / DAY_MS);
  if (days <= 0) return { en: 'today', el: 'σήμερα' };
  if (days === 1) return { en: 'tomorrow', el: 'αύριο' };
  return { en: `in ${days} days`, el: `σε ${days} μέρες` };
}

export function homeSuggestions({ events, people, shownAbove, connectionOf, now }: {
  events: readonly SuggestionEvent[];
  people: readonly SuggestionPerson[];
  /** The people the page already shows: they are not offered again. */
  shownAbove: ReadonlySet<string>;
  connectionOf: (userId: string) => 'none' | 'sent' | 'received' | 'connected';
  now: Date;
}): HomeSuggestion[] {
  const out: HomeSuggestion[] = [];

  const going = events
    .filter((e) => (e.viewerRsvp === 'going' || e.viewerRsvp === 'interested') && new Date(e.startAt).getTime() >= now.getTime() && new Date(e.startAt).getTime() - now.getTime() <= SNOOZE_MS)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  if (going) {
    const when = inDays(going.startAt, now);
    out.push({
      id: `event:${going.id}`,
      en: `“${going.title}” is ${when.en}. Shall I tell you who to meet there?`,
      el: `Η εκδήλωση «${going.title}» είναι ${when.el}. Να σας πω ποιους να συναντήσετε εκεί;`,
      yes: { en: 'Tell me', el: 'Πείτε μου' },
      prompt: {
        en: `I am going to “${going.title}” ${when.en}. Who there fits what I am looking for, and what should I say to each of them?`,
        el: `Πηγαίνω στην εκδήλωση «${going.title}» ${when.el}. Ποιοι εκεί ταιριάζουν με ό,τι ψάχνω, και τι να πω στον καθένα;`,
      },
    });
  }

  const next = people.find((p) => p.userId && !shownAbove.has(p.userId) && connectionOf(p.userId) === 'none');
  if (next) {
    out.push({
      id: `person:${next.userId}`,
      en: `${next.displayName} also fits what you are looking for. Shall I draft a first message?`,
      // Neutral Greek: the name after the colon, no article to guess.
      el: `Ταιριάζει επίσης με ό,τι ψάχνετε: ${next.displayName}. Να ετοιμάσω ένα πρώτο μήνυμα;`,
      yes: { en: 'Draft it', el: 'Ετοιμάστε το' },
      prompt: {
        en: `Draft a short first message to ${next.displayName}: why we fit, and one question to start with.`,
        el: `Γράψε ένα σύντομο πρώτο μήνυμα προς ${next.displayName}: γιατί ταιριάζουμε, και μία ερώτηση για αρχή.`,
      },
    });
  }

  out.push({
    id: 'week',
    en: 'Shall I prepare your week? What falls due, your events and what waits, with one card of actions.',
    el: 'Να ετοιμάσω την εβδομάδα σας; Προθεσμίες, εκδηλώσεις και ό,τι σας περιμένει, με μία κάρτα ενεργειών.',
    yes: { en: 'Prepare it', el: 'Ετοιμάστε την' },
    prompt: { en: 'Prepare my week', el: 'Ετοίμασε την εβδομάδα μου' },
  });
  return out;
}

/** Snoozed suggestions, by id, until a time; past ones are dropped. */
export function readSnoozed(raw: string | null, now: number): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, until]) => typeof until === 'number' && until > now)) as Record<string, number>;
  } catch {
    return {};
  }
}
