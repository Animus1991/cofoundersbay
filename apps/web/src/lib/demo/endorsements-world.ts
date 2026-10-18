import type { EndorsementBasis } from '@cofounderbay/shared';

/**
 * Endorsements in the preview demo: one set of facts, read by every surface.
 *
 * The /endorsements page drew six sample rows of its own, while the endpoints
 * every other reader calls had no demo handler and answered the generic
 * fallback. So the demo contradicted itself: /endorsements showed two waiting
 * for approval, the assistant answered "nothing is waiting" (it reads
 * `/endorsements/stats` and `/pending`), and the own profile counted none.
 * The rows now live here once. The page builds its sample rows from them and
 * the API handler below answers from them, with the real endpoints' rules
 * (`endorsements.service.ts`):
 *
 * - `/user/:id` lists approved, public endorsements, and a member's own
 *   waiting ones too only when they ask for `includeUnapproved` about
 *   themselves; nobody else ever sees an unapproved one.
 * - `/pending` is what waits for the member, `/given` is everything the member
 *   wrote (with who it was for), and `/stats` counts the same three groups.
 *
 * Reads only. Approving and declining stay "this screen only" on the page, as
 * its notice says: a sample is not a record, and the demo's writes answer the
 * shape the controllers return without keeping anything (preview-api.ts).
 *
 * Three more rows sit between the other demo people, so Elena's and Marcus's
 * own profiles show recommendations that add up to the skill counts their
 * skill panel already claims (skill-evidence-world.ts), not an empty list
 * beside "Product: 2 endorsements".
 */

/** The reader of the demo, as the rest of the preview names them. */
export const DEMO_MEMBER_ID = 'preview-demo-user';

const DAY = 86_400_000;

type Person = { id: string; displayName: string; headline: string | null };

const ALEX: Person = { id: DEMO_MEMBER_ID, displayName: 'Alex Demo', headline: null };
const ELENA: Person = { id: 'user-elena', displayName: 'Elena Papadopoulos', headline: 'Founder & CEO at Harbor' };
const MARCUS: Person = { id: 'user-marcus', displayName: 'Marcus Chen', headline: 'Technical cofounder · Full-stack' };
const SARAH: Person = { id: 'user-sarah', displayName: 'Dr. Sarah Kim', headline: 'Startup mentor' };
const NIKOS: Person = { id: 'user-nikos', displayName: 'Nikos Andreou', headline: 'Angel investor · Seed' };

export type DemoEndorsement = {
  id: string;
  from: Person;
  to: Person;
  skill: string | null;
  relationship: string | null;
  content: string;
  /** What the platform can see behind it; empty when it sees nothing. */
  basis: EndorsementBasis[];
  isApproved: boolean;
  /** How long ago it was written: an age, never a date, so a sample stays recent. */
  ageDays: number;
};

export const DEMO_ENDORSEMENTS: readonly DemoEndorsement[] = [
  // Written for the demo member.
  {
    id: 'sample-end-1', from: ELENA, to: ALEX, skill: 'Go-to-market', relationship: 'Peer founder', basis: [],
    content: 'Alex shared their outbound playbook with our team without being asked. Two of our first five customers came from it.',
    isApproved: false, ageDays: 1,
  },
  {
    id: 'sample-end-2', from: MARCUS, to: ALEX, skill: 'Customer discovery', relationship: 'Trial project', basis: [],
    content: 'We spent two weeks on a trial project. Alex ran twelve customer interviews in that time and came back with the one feature we should cut.',
    isApproved: false, ageDays: 3,
  },
  {
    id: 'sample-end-3', from: SARAH, to: ALEX, skill: 'Product strategy', relationship: 'Mentor', basis: ['mentoring'],
    content: 'Alex takes feedback on Monday and ships the change by Friday. Over six sessions the onboarding went from nine steps to three.',
    isApproved: true, ageDays: 12,
  },
  {
    id: 'sample-end-4', from: NIKOS, to: ALEX, skill: 'Fundraising', relationship: 'Investor', basis: [],
    content: 'A well-prepared founder: knows the numbers, answers the hard question first, and follows up when promised.',
    isApproved: true, ageDays: 30,
  },
  // Written by the demo member.
  {
    id: 'sample-end-5', from: ALEX, to: MARCUS, skill: 'Full-stack engineering', relationship: 'Trial project', basis: [],
    content: 'Marcus shipped a working prototype in nine days, with tests, and wrote down every shortcut he took.',
    isApproved: false, ageDays: 5,
  },
  {
    id: 'sample-end-6', from: ALEX, to: ELENA, skill: 'Product', relationship: 'Peer founder', basis: [],
    content: "Elena sees the product from the customer's chair. Her teardown of our onboarding was the most useful hour of the quarter.",
    isApproved: true, ageDays: 20,
  },
  // Between the other demo people.
  {
    id: 'sample-end-7', from: SARAH, to: ELENA, skill: 'Product', relationship: 'Mentor', basis: ['mentoring'],
    content: 'Elena brought a different version of the same question to each session and had tested my last answer before the next one. The clinic onboarding she shipped between them is the clearest evidence.',
    isApproved: true, ageDays: 45,
  },
  {
    id: 'sample-end-8', from: NIKOS, to: ELENA, skill: 'Fundraising', relationship: 'Investor', basis: [],
    content: 'Elena knows her numbers cold and says so when she does not know one. We did not invest, and she still sent a useful update a quarter later.',
    isApproved: true, ageDays: 60,
  },
  {
    id: 'sample-end-9', from: ELENA, to: MARCUS, skill: 'Full-stack engineering', relationship: 'Worked together', basis: [],
    content: 'Marcus rebuilt our booking flow in a week and left a README a new hire could follow on day one.',
    isApproved: true, ageDays: 35,
  },
];

const newestFirst = (a: DemoEndorsement, b: DemoEndorsement) => a.ageDays - b.ageDays;

const personOf = (p: Person) => ({ id: p.id, displayName: p.displayName, avatarUrl: null, headline: p.headline });

/** An endorsement as `EndorsementItem` carries it; `toUser` only on the giver's own list. */
function itemOf(e: DemoEndorsement, now: number, withRecipient: boolean) {
  return {
    id: e.id,
    fromUserId: e.from.id,
    fromUser: personOf(e.from),
    toUserId: e.to.id,
    ...(withRecipient ? { toUser: personOf(e.to) } : {}),
    skill: e.skill,
    content: e.content,
    relationship: e.relationship,
    isPublic: true,
    isApproved: e.isApproved,
    basis: [...e.basis],
    createdAt: new Date(now - e.ageDays * DAY).toISOString(),
  };
}

/**
 * Answers the four endorsement reads for the demo, or `undefined` for any
 * other path or method (writes are answered in preview-api.ts, unstored).
 */
export function previewEndorsementsApi(pathname: string, path: string, method: string, now: number): unknown {
  if (method !== 'GET' || !pathname.startsWith('/api/endorsements/')) return undefined;
  const parts = pathname.split('/').filter(Boolean).slice(2).map(decodeURIComponent);
  const received = DEMO_ENDORSEMENTS.filter((e) => e.to.id === DEMO_MEMBER_ID);
  const given = DEMO_ENDORSEMENTS.filter((e) => e.from.id === DEMO_MEMBER_ID);

  if (parts[0] === 'user' && parts[1] && parts.length === 2) {
    const subject = parts[1] === 'me' ? DEMO_MEMBER_ID : parts[1];
    // Only the person it was written for may see one that is still waiting.
    const includeUnapproved = new URLSearchParams(path.split('?')[1] ?? '').get('includeUnapproved') === 'true' && subject === DEMO_MEMBER_ID;
    const rows = DEMO_ENDORSEMENTS.filter((e) => e.to.id === subject && (includeUnapproved || e.isApproved)).sort(newestFirst);
    return { endorsements: rows.map((e) => itemOf(e, now, false)) };
  }
  if (parts[0] === 'pending' && parts.length === 1) {
    return { endorsements: received.filter((e) => !e.isApproved).sort(newestFirst).map((e) => itemOf(e, now, false)) };
  }
  if (parts[0] === 'given' && parts.length === 1) {
    return { endorsements: [...given].sort(newestFirst).map((e) => itemOf(e, now, true)) };
  }
  if (parts[0] === 'stats' && parts.length === 1) {
    return { stats: { total: received.filter((e) => e.isApproved).length, pending: received.filter((e) => !e.isApproved).length, given: given.length } };
  }
  return undefined;
}
