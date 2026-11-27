import type { DealStatus, InvestorDeal, InvestorDealEvent, PipelineStage } from '@/lib/api';
import { DemoRefusal } from './demo-refusal';

/**
 * The investor's board in the showcase, in one place (docs §167).
 *
 * The watchlist, the pipeline, the portfolio and the analytics read these
 * rows through different filters, and the preview serves them for every
 * /api/investor route the board uses. The pages show the same rows as their
 * sample when a real account's board is empty with demo data on: each page
 * used to carry its own (NeuralFlow AI, PayStream, DataVault in dollars and
 * San Francisco) beside a preview board of Harbor, Meltemi and Thalia in
 * euros, so one reader met two worlds a click apart.
 *
 * What the visitor does holds for the tab, with the API's rules: watching a
 * startup adds it at Discovered, a move writes a "Moved to …" event, reaching
 * Invested stamps the date once, a note is an event. Before, every write
 * answered as if it had worked and changed nothing, so a deal moved on the
 * board stayed where it was. Dates are on the showcase's seed day (4 Sept
 * 2026); the preview moves them to the reader's week.
 */

const STORAGE_KEY = 'cfb:demo-investor-board:v1';

export const DEMO_PIPELINE_STAGES: readonly PipelineStage[] = [
  'discovered', 'reviewing', 'meeting', 'due_diligence', 'negotiating', 'invested', 'passed',
];

type Seed = Omit<InvestorDeal, 'website' | 'logoUrl' | 'currency' | 'status'> & { status?: DealStatus };

const deal = (row: Seed): InvestorDeal => ({ website: null, logoUrl: null, currency: 'EUR', status: 'active', ...row });

/*
 * Harbor, Orion Grid and Aegis Health graduated from the Spring 2026 cohort
 * (org-world); Meltemi, Kolo Labs and Thalia are in the Autumn one.
 */
export const DEMO_DEALS: InvestorDeal[] = [
  deal({
    id: 'deal-harbor', name: 'Harbor', tagline: 'The operating system for early-stage founders.',
    industry: 'SaaS', location: 'Athens, Greece',
    companyStage: 'seed', teamSize: 4, pipelineStage: 'negotiating', starred: true, alertsEnabled: true,
    notes: 'Term sheet out. Waiting on the traction slide.', tags: ['saas', 'b2b'],
    askAmountCents: 75_000_000, investedCents: null, currentValueCents: null, investedAt: null,
    lastActivityAt: '2026-09-03T14:00:00.000Z', createdAt: '2026-05-02T09:00:00.000Z',
    founder: { id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: null, headline: 'Founder & CEO at Harbor' },
    recentEvents: [
      { id: 'ev-h1', type: 'stage_change', title: 'Moved to negotiating', body: null, createdAt: '2026-09-03T14:00:00.000Z' },
      { id: 'ev-h2', type: 'deck', title: 'Sent an updated deck', body: null, createdAt: '2026-08-27T10:00:00.000Z' },
    ],
  }),
  deal({
    id: 'deal-meltemi', name: 'Meltemi', tagline: 'Vertical SaaS for logistics operators.',
    industry: 'Logistics', location: 'Thessaloniki, Greece',
    companyStage: 'pre_seed', teamSize: 2, pipelineStage: 'due_diligence', starred: true, alertsEnabled: true,
    notes: 'Design partner signed. No engineer yet.', tags: ['logistics', 'saas'],
    askAmountCents: 25_000_000, investedCents: null, currentValueCents: null, investedAt: null,
    lastActivityAt: '2026-09-01T09:00:00.000Z', createdAt: '2026-06-14T09:00:00.000Z',
    founder: { id: 'user-sofia', displayName: 'Sofia Alexiou', avatarUrl: null, headline: 'Founder at Meltemi' },
    recentEvents: [
      { id: 'ev-m1', type: 'milestone', title: 'First paying design partner', body: null, createdAt: '2026-09-01T09:00:00.000Z' },
    ],
  }),
  deal({
    id: 'deal-aegis', name: 'Aegis Health', tagline: 'Triage support for community clinics.',
    industry: 'HealthTech', location: 'Patras, Greece',
    companyStage: 'seed', teamSize: 6, pipelineStage: 'invested', starred: false, alertsEnabled: true,
    notes: null, tags: ['health', 'ai'],
    askAmountCents: 60_000_000, investedCents: 10_000_000, currentValueCents: 14_500_000, investedAt: '2026-02-11T09:00:00.000Z',
    lastActivityAt: '2026-08-20T09:00:00.000Z', createdAt: '2025-11-03T09:00:00.000Z',
    founder: { id: 'user-christina', displayName: 'Christina Mavrou', avatarUrl: null, headline: 'Founder at Aegis Health' },
    recentEvents: [
      { id: 'ev-a1', type: 'update', title: 'Q2 update: 3 clinics live', body: null, createdAt: '2026-08-20T09:00:00.000Z' },
    ],
  }),
  deal({
    id: 'deal-orion', name: 'Orion Grid', tagline: 'Demand response for small utilities.',
    industry: 'CleanTech', location: 'Remote',
    companyStage: 'series_a', teamSize: 14, pipelineStage: 'invested', starred: true, alertsEnabled: false,
    notes: null, tags: ['energy'],
    askAmountCents: null, investedCents: 25_000_000, currentValueCents: 41_000_000, investedAt: '2025-09-30T09:00:00.000Z',
    lastActivityAt: '2026-07-18T09:00:00.000Z', createdAt: '2025-04-08T09:00:00.000Z',
    founder: { id: 'user-dimitris', displayName: 'Dimitris Kostas', avatarUrl: null, headline: 'Founder at Orion Grid' },
    recentEvents: [
      { id: 'ev-o1', type: 'fundraise', title: 'Closed a Series A extension', body: null, createdAt: '2026-07-18T09:00:00.000Z' },
    ],
  }),
  deal({
    id: 'deal-kolo', name: 'Kolo Labs', tagline: 'Developer tooling for embedded teams.',
    industry: 'DevTools', location: 'Remote',
    companyStage: 'pre_seed', teamSize: 3, pipelineStage: 'discovered', starred: false, alertsEnabled: true,
    notes: 'Saw the demo day pitch. Worth a first call.', tags: ['devtools'],
    askAmountCents: 20_000_000, investedCents: null, currentValueCents: null, investedAt: null,
    lastActivityAt: '2026-09-04T07:00:00.000Z', createdAt: '2026-09-02T09:00:00.000Z',
    founder: { id: 'user-yannis', displayName: 'Yannis Petrou', avatarUrl: null, headline: 'Founder at Kolo Labs' },
    recentEvents: [
      { id: 'ev-k1', type: 'update', title: 'Added to the board', body: null, createdAt: '2026-09-02T09:00:00.000Z' },
    ],
  }),
  deal({
    id: 'deal-thalia', name: 'Thalia', tagline: 'Booking and payments for independent studios.',
    industry: 'FinTech', location: 'Athens, Greece',
    companyStage: 'seed', teamSize: 5, pipelineStage: 'reviewing', starred: false, alertsEnabled: true,
    notes: null, tags: ['fintech', 'smb'],
    askAmountCents: 45_000_000, investedCents: null, currentValueCents: null, investedAt: null,
    lastActivityAt: '2026-08-29T09:00:00.000Z', createdAt: '2026-07-21T09:00:00.000Z',
    founder: { id: 'user-maria', displayName: 'Maria Georgiou', avatarUrl: null, headline: 'Founder at Thalia' },
    recentEvents: [
      { id: 'ev-t1', type: 'team', title: 'Hired a second engineer', body: null, createdAt: '2026-08-29T09:00:00.000Z' },
    ],
  }),
  deal({
    id: 'deal-vela', name: 'Vela', tagline: 'Marketplace for refurbished lab equipment.',
    industry: 'Marketplace', location: 'Heraklion, Greece',
    companyStage: 'pre_seed', teamSize: 2, pipelineStage: 'passed', starred: false, alertsEnabled: false,
    notes: 'Passed — market too thin for the model as pitched.', tags: ['marketplace'],
    askAmountCents: 15_000_000, investedCents: null, currentValueCents: null, investedAt: null,
    lastActivityAt: '2026-06-12T09:00:00.000Z', createdAt: '2026-04-30T09:00:00.000Z',
    founder: null,
    recentEvents: [
      { id: 'ev-v1', type: 'stage_change', title: 'Moved to passed', body: null, createdAt: '2026-06-12T09:00:00.000Z' },
    ],
  }),
];

/**
 * The startups Scouting shows: founders the showcase already knows (the
 * accelerator's cohorts and applicants in org-world) who are not on the
 * board. Readiness and match are the sample's own; the page says so.
 */
export type DemoScoutedStartup = {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  stage: string;
  location: string;
  teamSize: number;
  readinessScore: number;
  matchScore: number;
  tags: string[];
  /** The round they are raising, in euro cents. */
  raisingCents: number;
  businessModel: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace';
  isHot: boolean;
  isFeatured: boolean;
  /** Monthly recurring revenue in euro cents; null before revenue. */
  mrrCents: number | null;
};

export const DEMO_SCOUTED: DemoScoutedStartup[] = [
  { id: 'scout-ledgerly', name: 'Ledgerly', tagline: 'Carbon accounting inside the books of small businesses.', industry: 'FinTech', stage: 'Pre-seed', location: 'Athens, Greece', teamSize: 3, readinessScore: 81, matchScore: 90, tags: ['Climate', 'SMEs'], raisingCents: 120_000_000, businessModel: 'B2B', isHot: true, isFeatured: true, mrrCents: 900_000 },
  { id: 'scout-anemos', name: 'Anemos Storage', tagline: 'Battery storage for island microgrids.', industry: 'CleanTech', stage: 'Pre-seed', location: 'Heraklion, Greece', teamSize: 3, readinessScore: 74, matchScore: 84, tags: ['Energy', 'Batteries'], raisingCents: 80_000_000, businessModel: 'B2B', isHot: false, isFeatured: true, mrrCents: null },
  { id: 'scout-agora', name: 'Agora B2B', tagline: 'A wholesale marketplace between local producers and restaurants.', industry: 'Marketplace', stage: 'Pre-seed', location: 'Athens, Greece', teamSize: 2, readinessScore: 68, matchScore: 76, tags: ['Food', 'Wholesale'], raisingCents: 50_000_000, businessModel: 'Marketplace', isHot: true, isFeatured: false, mrrCents: 400_000 },
  { id: 'scout-fleetwise', name: 'Fleetwise', tagline: 'Maintenance planning for delivery fleets.', industry: 'Mobility', stage: 'Pre-seed', location: 'Patras, Greece', teamSize: 3, readinessScore: 66, matchScore: 79, tags: ['Fleets', 'Analytics'], raisingCents: 40_000_000, businessModel: 'B2B', isHot: false, isFeatured: false, mrrCents: 300_000 },
  { id: 'scout-portside', name: 'Portside', tagline: 'Berth booking for small commercial ports.', industry: 'Logistics', stage: 'Pre-seed', location: 'Limassol, Cyprus', teamSize: 2, readinessScore: 61, matchScore: 74, tags: ['Ports', 'SaaS'], raisingCents: 35_000_000, businessModel: 'B2B', isHot: true, isFeatured: false, mrrCents: null },
  { id: 'scout-kyma', name: 'Kyma Energy', tagline: 'Wave-energy buoys for island ports.', industry: 'CleanTech', stage: 'Pre-seed', location: 'Patras, Greece', teamSize: 4, readinessScore: 63, matchScore: 72, tags: ['Energy', 'Ports'], raisingCents: 60_000_000, businessModel: 'B2B', isHot: false, isFeatured: false, mrrCents: null },
  { id: 'scout-taverna', name: 'Taverna OS', tagline: 'Orders and stock for family restaurants.', industry: 'Hospitality software', stage: 'Pre-seed', location: 'Thessaloniki, Greece', teamSize: 2, readinessScore: 58, matchScore: 70, tags: ['Restaurants', 'SaaS'], raisingCents: 30_000_000, businessModel: 'B2B', isHot: false, isFeatured: false, mrrCents: null },
  { id: 'scout-petra', name: 'Petra Health', tagline: 'Symptom check-ins for patients waiting to see a specialist.', industry: 'HealthTech', stage: 'Idea', location: 'Athens, Greece', teamSize: 2, readinessScore: 42, matchScore: 63, tags: ['Health', 'Patients'], raisingCents: 15_000_000, businessModel: 'B2C', isHot: false, isFeatured: false, mrrCents: null },
];

// ── The board as the visitor leaves it ──────────────────────────────────────

type Board = { deals: InvestorDeal[]; seq: number };

let memory: Board | null = null;

const fresh = (): Board => ({ deals: structuredClone(DEMO_DEALS), seq: 1 });

function board(): Board {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as Board) : null;
    memory = parsed && Array.isArray(parsed.deals) ? parsed : fresh();
  } catch {
    memory = fresh();
  }
  return memory;
}

function save() {
  try {
    if (typeof window !== 'undefined' && memory) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked: the board holds for this page view only.
  }
}

/** Back to the seeded board (tests, and a visitor starting over). */
export function resetDemoInvestorBoard() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
}

function event(state: Board, nowIso: string, row: Omit<InvestorDealEvent, 'id' | 'createdAt'>): InvestorDealEvent {
  state.seq += 1;
  return { id: `ev-demo-${state.seq}`, createdAt: nowIso, ...row };
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const cents = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : null);

function summary(deals: InvestorDeal[]) {
  const invested = deals.filter((d) => d.pipelineStage === 'invested');
  const deployedCents = invested.reduce((sum, d) => sum + (d.investedCents ?? 0), 0);
  const currentValueCents = invested.reduce((sum, d) => sum + (d.currentValueCents ?? d.investedCents ?? 0), 0);
  return {
    stageCounts: Object.fromEntries(DEMO_PIPELINE_STAGES.map((stage) => [stage, deals.filter((d) => d.pipelineStage === stage).length])),
    totalDeals: deals.length,
    investments: invested.length,
    deployedCents,
    currentValueCents,
    returnPct: deployedCents > 0 ? Math.round(((currentValueCents - deployedCents) / deployedCents) * 100) : null,
  };
}

/**
 * The /api/investor routes the board uses, in the API's shapes and with its
 * refusals. Anything else under /api/investor falls through (undefined).
 */
export function previewInvestorApi(pathname: string, query: URLSearchParams, method: string, body: Record<string, unknown>, nowIso: string): unknown {
  if (!pathname.startsWith('/api/investor/')) return undefined;
  const state = board();

  if (pathname === '/api/investor/summary' && method === 'GET') return summary(state.deals);

  if (pathname === '/api/investor/activity' && method === 'GET') {
    const limit = Number(query.get('limit') ?? 20);
    const activity = state.deals
      .flatMap((d) => d.recentEvents.map((e) => ({ id: e.id, dealId: d.id, dealName: d.name, logoUrl: d.logoUrl, type: e.type, title: e.title, body: e.body, createdAt: e.createdAt })))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    return { activity };
  }

  if (pathname === '/api/investor/deals') {
    if (method === 'GET') {
      const stage = query.get('pipelineStage');
      const starred = query.get('starred');
      const status = query.get('status');
      const search = query.get('search')?.toLowerCase() ?? '';
      const limit = Number(query.get('limit') ?? 50);
      const offset = Number(query.get('offset') ?? 0);
      const matched = state.deals
        .filter((d) => !stage || d.pipelineStage === stage)
        .filter((d) => starred == null || d.starred === (starred === 'true'))
        .filter((d) => !status || d.status === status)
        .filter((d) => !search || `${d.name} ${d.tagline ?? ''} ${d.industry ?? ''}`.toLowerCase().includes(search))
        .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
      const deals = matched.slice(offset, offset + limit);
      // Copies: the caller's cache must not change under it when the board does.
      return { deals: structuredClone(deals), total: matched.length, hasMore: offset + deals.length < matched.length };
    }
    if (method === 'POST') {
      const name = text(body.name);
      if (!name) throw new DemoRefusal(400, 'A startup name is required', { messageEl: 'Χρειάζεται το όνομα της startup.' });
      if (state.deals.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
        throw new DemoRefusal(409, 'That startup is already on your board', { messageEl: 'Η startup είναι ήδη στον πίνακά σας.' });
      }
      const stage = text(body.pipelineStage) || 'discovered';
      if (!DEMO_PIPELINE_STAGES.includes(stage as PipelineStage)) throw new DemoRefusal(400, 'Unknown pipeline stage', { messageEl: 'Άγνωστο στάδιο.' });
      state.seq += 1;
      const created = deal({
        id: `deal-demo-${state.seq}`,
        name,
        tagline: text(body.tagline) || null,
        industry: text(body.industry) || null,
        location: text(body.location) || null,
        companyStage: text(body.companyStage) || null,
        teamSize: typeof body.teamSize === 'number' ? body.teamSize : null,
        pipelineStage: stage as PipelineStage,
        starred: false,
        alertsEnabled: true,
        notes: text(body.notes) || null,
        tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : [],
        askAmountCents: cents(body.askAmountCents),
        investedCents: null,
        currentValueCents: null,
        investedAt: null,
        lastActivityAt: nowIso,
        createdAt: nowIso,
        founder: null,
        recentEvents: [],
      });
      created.recentEvents = [event(state, nowIso, { type: 'update', title: 'Added to the board', body: null })];
      state.deals.push(created);
      save();
      return { deal: structuredClone(created) };
    }
    return undefined;
  }

  const [, , section, id, sub] = pathname.split('/').filter(Boolean);
  if (section !== 'deals' || !id) return undefined;
  const current = state.deals.find((d) => d.id === id);

  if (sub === 'events') {
    if (method !== 'POST') return undefined;
    if (!current) throw new DemoRefusal(404, 'Deal not found', { messageEl: 'Η συμφωνία δεν βρέθηκε.' });
    const title = text(body.title);
    if (!title) throw new DemoRefusal(400, 'A title is required', { messageEl: 'Χρειάζεται τίτλος.' });
    const added = event(state, nowIso, { type: text(body.type) || 'note', title, body: text(body.body) || null });
    current.recentEvents = [added, ...current.recentEvents];
    current.lastActivityAt = nowIso;
    save();
    return { event: structuredClone(added) };
  }
  if (sub) return undefined;

  if (method === 'GET') return { deal: current ? structuredClone(current) : null };
  if (!current) throw new DemoRefusal(404, 'Deal not found', { messageEl: 'Η συμφωνία δεν βρέθηκε.' });

  if (method === 'DELETE') {
    state.deals = state.deals.filter((d) => d.id !== id);
    save();
    return { ok: true, dealId: id };
  }
  if (method !== 'PATCH') return undefined;

  const stage = body.pipelineStage;
  if (stage !== undefined && !DEMO_PIPELINE_STAGES.includes(stage as PipelineStage)) {
    throw new DemoRefusal(400, 'Unknown pipeline stage', { messageEl: 'Άγνωστο στάδιο.' });
  }
  const from = current.pipelineStage;
  if (typeof body.starred === 'boolean') current.starred = body.starred;
  if (typeof body.alertsEnabled === 'boolean') current.alertsEnabled = body.alertsEnabled;
  if (typeof body.notes === 'string') current.notes = body.notes.trim() || null;
  if (Array.isArray(body.tags)) current.tags = body.tags.filter((t): t is string => typeof t === 'string');
  if ('askAmountCents' in body) current.askAmountCents = cents(body.askAmountCents);
  if ('investedCents' in body) current.investedCents = cents(body.investedCents);
  if ('currentValueCents' in body) current.currentValueCents = cents(body.currentValueCents);
  if ('teamSize' in body) current.teamSize = typeof body.teamSize === 'number' ? body.teamSize : null;
  if (body.status === 'active' || body.status === 'exited' || body.status === 'written_off') current.status = body.status;
  current.lastActivityAt = nowIso;
  if (typeof stage === 'string' && stage !== from) {
    current.pipelineStage = stage as PipelineStage;
    // Stamped once, as the API does: moving back and forth keeps the date the money went in.
    if (stage === 'invested' && !current.investedAt) current.investedAt = nowIso;
    current.recentEvents = [
      event(state, nowIso, { type: 'stage_change', title: `Moved to ${stage.replace(/_/g, ' ')}`, body: null, fromStage: from, toStage: stage }),
      ...current.recentEvents,
    ];
  }
  save();
  return { deal: structuredClone(current) };
}
