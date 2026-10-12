/**
 * Partner perks in the preview demo, with the API's rules
 * (`apps/api/src/perks`, `packages/shared/src/perks`): only open perks are
 * listed, a code shows only after the claim, claiming twice keeps one claim,
 * a switched-off perk keeps its claims. The partners are invented - the demo
 * never names a real company - and their links use the reserved `.example`
 * domain. Claims live in sessionStorage; ends carry ages, not dates.
 */

import {
  isCardStage,
  isPerkCategory,
  perkForReader,
  perkIsOpen,
  rankPerksForStage,
  readPerkInput,
  type PerkCategory,
  type PerkStage,
  type PerkView,
} from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';

const STORAGE_KEY = 'cfb:demo-perks:v1';
const DAY = 86_400_000;

type Seed = Omit<PerkView, 'claimed' | 'claimedAt' | 'expiresAt' | 'claimCount' | 'active'> & {
  /** Days until the offer ends, from now; null for no end. */
  endsInDays: number | null;
  /** Other members' claims, so the count is not the reader's alone. */
  others: number;
};

const SEEDS: Seed[] = [
  {
    id: 'perk-skyloft',
    partner: 'Skyloft Cloud',
    title: 'Hosting credits for your first year',
    titleEl: 'Πιστώσεις φιλοξενίας για τον πρώτο χρόνο',
    summary: 'Servers, databases and storage for a product still finding its first users.',
    summaryEl: 'Διακομιστές, βάσεις δεδομένων και αποθήκευση για ένα προϊόν που ψάχνει ακόμη τους πρώτους χρήστες του.',
    value: '$5,000 in credits for 12 months',
    valueEl: '5.000 $ σε πιστώσεις για 12 μήνες',
    category: 'cloud',
    stages: ['idea', 'validating', 'building'],
    howToRedeem: 'Create a Skyloft account, open Billing → Promotions and enter the code.',
    howToRedeemEl: 'Δημιουργήστε λογαριασμό Skyloft, ανοίξτε Χρεώσεις → Προσφορές και εισαγάγετε τον κωδικό.',
    terms: 'New Skyloft accounts only. Credits expire 12 months after activation.',
    termsEl: 'Μόνο για νέους λογαριασμούς Skyloft. Οι πιστώσεις λήγουν 12 μήνες μετά την ενεργοποίηση.',
    code: 'SKYLOFT-CFB-5K',
    redeemUrl: 'https://skyloft.example/startups',
    endsInDays: null,
    others: 41,
  },
  {
    id: 'perk-quillmere',
    partner: 'Quillmere AI',
    title: 'Model credits for prototypes',
    titleEl: 'Πιστώσεις μοντέλων για πρωτότυπα',
    summary: 'Language-model API credits to build and test an assistant feature before you charge for it.',
    summaryEl: 'Πιστώσεις API γλωσσικών μοντέλων για να φτιάξετε και να δοκιμάσετε μια λειτουργία βοηθού πριν τη χρεώσετε.',
    value: '$2,500 in API credits',
    valueEl: '2.500 $ σε πιστώσεις API',
    category: 'ai',
    stages: [],
    howToRedeem: 'Apply on the partner page with the code; credits arrive within two working days.',
    howToRedeemEl: 'Κάντε αίτηση στη σελίδα του συνεργάτη με τον κωδικό· οι πιστώσεις έρχονται σε δύο εργάσιμες.',
    terms: 'One grant per company.',
    termsEl: 'Μία παροχή ανά εταιρεία.',
    code: 'QUILL-FOUNDERS-25',
    redeemUrl: 'https://quillmere.example/founders',
    endsInDays: 24,
    others: 63,
  },
  {
    id: 'perk-tallyhaven',
    partner: 'Tallyhaven',
    title: 'Bookkeeping, six months free',
    titleEl: 'Λογιστική τήρηση, έξι μήνες δωρεάν',
    summary: 'Monthly books, VAT reminders and a clean ledger for your first raise.',
    summaryEl: 'Μηνιαία βιβλία, υπενθυμίσεις ΦΠΑ και καθαρό καθολικό για την πρώτη σας χρηματοδότηση.',
    value: '6 months free, then 20% off',
    valueEl: '6 μήνες δωρεάν, μετά 20% έκπτωση',
    category: 'finance',
    stages: ['building', 'launched'],
    howToRedeem: 'Book an onboarding call from the partner page and mention the code.',
    howToRedeemEl: 'Κλείστε κλήση ένταξης από τη σελίδα του συνεργάτη και αναφέρετε τον κωδικό.',
    terms: null,
    termsEl: null,
    code: 'TALLY-CFB-6',
    redeemUrl: 'https://tallyhaven.example/cfb',
    endsInDays: null,
    others: 17,
  },
  {
    id: 'perk-brightharbor',
    partner: 'Brightharbor Legal',
    title: 'Incorporation and a founders’ agreement review',
    titleEl: 'Σύσταση εταιρείας και έλεγχος συμφωνίας ιδρυτών',
    summary: 'A fixed-fee company setup and a lawyer’s read of your founders’ agreement before you sign it.',
    summaryEl: 'Σύσταση εταιρείας με σταθερή αμοιβή και ανάγνωση της συμφωνίας ιδρυτών από δικηγόρο πριν την υπογράψετε.',
    value: '30% off the fixed fee',
    valueEl: '30% έκπτωση στη σταθερή αμοιβή',
    category: 'legal',
    stages: ['idea', 'validating'],
    howToRedeem: 'Send the code with your request through the partner page.',
    howToRedeemEl: 'Στείλτε τον κωδικό με το αίτημά σας από τη σελίδα του συνεργάτη.',
    terms: 'Fees vary by country; the discount applies to the published fee.',
    termsEl: 'Οι αμοιβές διαφέρουν ανά χώρα· η έκπτωση ισχύει στη δημοσιευμένη αμοιβή.',
    code: 'HARBOR-30',
    redeemUrl: 'https://brightharbor.example/founders',
    endsInDays: null,
    others: 12,
  },
  {
    id: 'perk-kestrelpost',
    partner: 'Kestrelpost',
    title: 'Email campaigns at half price',
    titleEl: 'Καμπάνιες email στη μισή τιμή',
    summary: 'Newsletters and onboarding emails for a product with its first paying customers.',
    summaryEl: 'Ενημερωτικά δελτία και email ένταξης για ένα προϊόν με τους πρώτους πελάτες που πληρώνουν.',
    value: '50% off for 12 months',
    valueEl: '50% έκπτωση για 12 μήνες',
    category: 'marketing',
    stages: ['launched', 'scaling'],
    howToRedeem: 'Enter the code when you choose a paid plan.',
    howToRedeemEl: 'Εισαγάγετε τον κωδικό όταν επιλέξετε πληρωμένο πρόγραμμα.',
    terms: null,
    termsEl: null,
    code: 'KESTREL-HALF',
    redeemUrl: 'https://kestrelpost.example/startup',
    endsInDays: null,
    others: 9,
  },
  {
    id: 'perk-pinwheel',
    partner: 'Pinwheel Studio',
    title: 'Design workspace for the whole team',
    titleEl: 'Χώρος σχεδιασμού για όλη την ομάδα',
    summary: 'Wireframes, prototypes and a shared component library.',
    summaryEl: 'Wireframes, πρωτότυπα και κοινή βιβλιοθήκη components.',
    value: 'Team plan free for a year',
    valueEl: 'Ομαδικό πρόγραμμα δωρεάν για έναν χρόνο',
    category: 'design',
    stages: [],
    howToRedeem: 'Open the partner link while signed in to Pinwheel; the plan switches on.',
    howToRedeemEl: 'Ανοίξτε τον σύνδεσμο του συνεργάτη ενώ είστε συνδεδεμένοι στο Pinwheel· το πρόγραμμα ενεργοποιείται.',
    terms: 'Up to 8 editors.',
    termsEl: 'Έως 8 συντάκτες.',
    code: null,
    redeemUrl: 'https://pinwheel.example/cfb-team',
    endsInDays: null,
    others: 28,
  },
  {
    id: 'perk-openroster',
    partner: 'Openroster',
    title: 'Your first three job posts',
    titleEl: 'Οι τρεις πρώτες αγγελίες σας',
    summary: 'Post roles for your first hires and screen applicants in one place.',
    summaryEl: 'Δημοσιεύστε θέσεις για τις πρώτες σας προσλήψεις και αξιολογήστε υποψηφίους σε ένα σημείο.',
    value: '3 job posts free',
    valueEl: '3 αγγελίες δωρεάν',
    category: 'hiring',
    stages: ['building', 'launched', 'scaling'],
    howToRedeem: 'Enter the code at checkout for each post.',
    howToRedeemEl: 'Εισαγάγετε τον κωδικό στο ταμείο για κάθε αγγελία.',
    terms: null,
    termsEl: null,
    code: 'ROSTER-3FREE',
    redeemUrl: 'https://openroster.example/post',
    endsInDays: 9,
    others: 6,
  },
  {
    id: 'perk-trackwise',
    partner: 'Trackwise Boards',
    title: 'Project boards, 90% off',
    titleEl: 'Πίνακες έργων, 90% έκπτωση',
    summary: 'Roadmaps, sprints and a backlog the whole team can see.',
    summaryEl: 'Οδικοί χάρτες, sprints και backlog ορατό σε όλη την ομάδα.',
    value: '90% off the first year',
    valueEl: '90% έκπτωση τον πρώτο χρόνο',
    category: 'software',
    stages: [],
    howToRedeem: 'Apply the code on the upgrade page.',
    howToRedeemEl: 'Εφαρμόστε τον κωδικό στη σελίδα αναβάθμισης.',
    terms: null,
    termsEl: null,
    code: 'TRACK-90-CFB',
    redeemUrl: 'https://trackwise.example/upgrade',
    endsInDays: null,
    others: 22,
  },
];

type Extra = { perk: PerkView; createdAt: number };
type State = { claims: Record<string, number>; off: string[]; extra: Extra[] };
let memory: State | null = null;

function initial(now: number): State {
  // The demo founder has already claimed the design workspace.
  return { claims: { 'perk-pinwheel': now - 6 * DAY }, off: [], extra: [] };
}

function load(now: number): State {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? (JSON.parse(raw) as State) : initial(now);
  } catch {
    memory = initial(now);
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

export function resetDemoPerks() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function all(state: State, now: number): Array<{ perk: PerkView; createdAt: number }> {
  const seeded = SEEDS.map((s, i) => {
    const { endsInDays, others, ...rest } = s;
    const claimedAt = state.claims[s.id];
    return {
      createdAt: now - (i + 1) * 3 * DAY,
      perk: {
        ...rest,
        expiresAt: endsInDays === null ? null : new Date(now + endsInDays * DAY).toISOString(),
        active: !state.off.includes(s.id),
        claimCount: others + (claimedAt ? 1 : 0),
        claimed: Boolean(claimedAt),
        claimedAt: claimedAt ? new Date(claimedAt).toISOString() : null,
      } satisfies PerkView,
    };
  });
  const extra = state.extra.map((e) => {
    const claimedAt = state.claims[e.perk.id];
    return {
      createdAt: e.createdAt,
      perk: {
        ...e.perk,
        active: !state.off.includes(e.perk.id),
        claimCount: claimedAt ? 1 : 0,
        claimed: Boolean(claimedAt),
        claimedAt: claimedAt ? new Date(claimedAt).toISOString() : null,
      },
    };
  });
  return [...extra, ...seeded].sort((a, b) => b.createdAt - a.createdAt);
}

/** Answers `/api/perks…` for the demo, or `undefined` for any other path. */
export function previewPerksApi(
  pathname: string,
  query: URLSearchParams,
  method: string,
  body: Record<string, unknown>,
  now: number,
): unknown {
  if (pathname !== '/api/perks' && !pathname.startsWith('/api/perks/')) return undefined;
  const state = load(now);
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api','perks', ...]
  const rows = all(state, now);

  if (parts.length === 2 && method === 'GET') {
    const category = query.get('category') ?? '';
    const stage = query.get('stage') ?? '';
    if (category && !isPerkCategory(category)) throw new DemoRefusal(400, 'Unknown category');
    const open = rows
      .map((r) => r.perk)
      .filter((p) => perkIsOpen(p, now) && (!category || p.category === (category as PerkCategory)))
      .map((p) => perkForReader(p, { claimed: p.claimed }));
    return { perks: rankPerksForStage(open, isCardStage(stage) ? (stage as PerkStage) : null) };
  }
  if (parts.length === 3 && parts[2] === 'claimed' && method === 'GET') {
    const mine = rows.map((r) => r.perk).filter((p) => p.claimed);
    mine.sort((a, b) => (b.claimedAt ?? '').localeCompare(a.claimedAt ?? ''));
    return { perks: mine.map((p) => perkForReader(p, { claimed: true })) };
  }
  if (parts.length === 4 && parts[3] === 'claim' && method === 'POST') {
    const row = rows.find((r) => r.perk.id === parts[2]);
    if (!row) throw new DemoRefusal(404, 'That perk does not exist', { messageEl: 'Αυτή η προσφορά δεν υπάρχει.' });
    if (row.perk.claimed) return { perk: perkForReader(row.perk, { claimed: true }) };
    if (!perkIsOpen(row.perk, now)) throw new DemoRefusal(409, 'This perk is no longer offered', { messageEl: 'Αυτή η προσφορά δεν προσφέρεται πια.' });
    state.claims[row.perk.id] = now;
    persist();
    const claimed = all(state, now).find((r) => r.perk.id === row.perk.id)!.perk;
    return { perk: perkForReader(claimed, { claimed: true }) };
  }
  if (parts.length === 4 && parts[2] === 'admin' && parts[3] === 'all' && method === 'GET') {
    return { perks: rows.map((r) => perkForReader(r.perk, { claimed: r.perk.claimed, admin: true })) };
  }
  if (parts.length === 3 && parts[2] === 'admin' && method === 'POST') {
    const input = readPerkInput(body);
    if (!input.ok) throw new DemoRefusal(400, input.error);
    const id = `perk-demo-${state.extra.length + 1}`;
    const perk: PerkView = { id, ...input.value, claimCount: 0, claimed: false, claimedAt: null };
    state.extra.push({ perk, createdAt: now });
    if (!input.value.active) state.off.push(id);
    persist();
    return { perk };
  }
  if (parts.length === 4 && parts[2] === 'admin' && method === 'PATCH') {
    const row = rows.find((r) => r.perk.id === parts[3]);
    if (!row) throw new DemoRefusal(404, 'That perk does not exist', { messageEl: 'Αυτή η προσφορά δεν υπάρχει.' });
    if (typeof body.active !== 'boolean') throw new DemoRefusal(400, 'The demo switches a perk on or off only');
    state.off = state.off.filter((id) => id !== row.perk.id);
    if (!body.active) state.off.push(row.perk.id);
    persist();
    return { perk: perkForReader({ ...row.perk, active: body.active }, { claimed: row.perk.claimed, admin: true }) };
  }
  return undefined;
}
