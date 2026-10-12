/**
 * Who viewed the demo founder's profile, with the API's rules
 * (`apps/api/src/profile-viewers`, `packages/shared/src/profile-viewers`).
 *
 * The viewers are the demo world's own people in the roles it gives them.
 * Elena and Dr. Sarah Kim show their names when they view; Marcus, Nikos,
 * Thanos, Ioanna and three founders from the programme do not. Alex starts
 * with the setting off, so the card shows counts only until Settings turns it
 * on - the reciprocity the rule describes. Views carry ages, not dates.
 */

import { readViewSource, summariseViewers, type ViewerPerson } from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';

const ME = 'preview-demo-user';
const STORAGE_KEY = 'cfb:demo-profile-viewers:v1';
const DAY = 86_400_000;

const PEOPLE: ViewerPerson[] = [
  { id: 'user-elena', displayName: 'Elena Papadopoulos', headline: 'Founder & CEO at Harbor', avatarUrl: null, role: 'founder', shareName: true },
  { id: 'user-sarah', displayName: 'Dr. Sarah Kim', headline: 'Startup mentor · Former product lead · 3x founder', avatarUrl: null, role: 'mentor', shareName: true },
  { id: 'user-marcus', displayName: 'Marcus Chen', headline: 'Technical cofounder · Full-stack', avatarUrl: null, role: 'cofounder', shareName: false },
  { id: 'user-nikos', displayName: 'Nikos Andreou', headline: 'Angel investor · Seed', avatarUrl: null, role: 'investor', shareName: false },
  { id: 'user-thanos', displayName: 'Thanos Rigas', headline: 'Energy markets advisor', avatarUrl: null, role: 'mentor', shareName: false },
  { id: 'user-ioanna', displayName: 'Ioanna Pappa', headline: 'Community and events at Aegean Venture Lab', avatarUrl: null, role: 'mentor', shareName: false },
  { id: 'user-sofia', displayName: 'Sofia', headline: null, avatarUrl: null, role: 'founder', shareName: false },
  { id: 'user-yannis', displayName: 'Yannis', headline: null, avatarUrl: null, role: 'founder', shareName: false },
  { id: 'user-maria', displayName: 'Maria', headline: null, avatarUrl: null, role: 'founder', shareName: false },
];

/** [viewer (null: signed out), days ago] */
const VIEWS: Array<[string | null, number]> = [
  ['user-elena', 1], ['user-elena', 9], ['user-sarah', 3], ['user-marcus', 2], ['user-nikos', 4], ['user-nikos', 30],
  ['user-thanos', 12], ['user-ioanna', 20], ['user-sofia', 6], ['user-yannis', 15], ['user-maria', 40],
  [null, 1], [null, 2], [null, 5], [null, 11], [null, 60],
];

type State = { shareName: boolean };
let memory: State | null = null;

function load(): State {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? (JSON.parse(raw) as State) : { shareName: false };
  } catch {
    memory = { shareName: false };
  }
  return memory;
}

function persist() {
  try {
    if (memory && typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked: the demo keeps working for this page view.
  }
}

export function resetDemoProfileViewers() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Answers `/api/profile-viewers…` for the demo, or `undefined` for any other path. */
export function previewProfileViewersApi(pathname: string, method: string, body: Record<string, unknown>, now: number): unknown {
  if (!pathname.startsWith('/api/profile-viewers/')) return undefined;
  const state = load();
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api','profile-viewers', ...]
  if (parts.length === 3 && parts[2] === 'me' && method === 'GET') {
    return summariseViewers(
      VIEWS.map(([viewerId, days]) => ({ viewerId, viewedAt: new Date(now - days * DAY) })),
      new Map(PEOPLE.map((p) => [p.id, p])),
      { readerSharesName: state.shareName, now, readerId: ME },
    );
  }
  if (parts.length === 3 && parts[2] === 'settings') {
    if (method === 'GET') return { shareName: state.shareName };
    if (method === 'PUT') {
      if (typeof body.shareName !== 'boolean') throw new DemoRefusal(400, 'shareName must be true or false');
      state.shareName = body.shareName;
      persist();
      return { shareName: state.shareName };
    }
  }
  // A view of someone else's profile: the demo counts nothing, but answers as the API does.
  if (parts.length === 4 && parts[3] === 'view' && method === 'POST') {
    readViewSource(body.source);
    return { recorded: parts[2] !== ME };
  }
  return undefined;
}
