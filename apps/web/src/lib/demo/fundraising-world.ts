import type { ApiDocument, ApiLead, ApiRound, FundraisingState, LinkedAccount, SharedRoom } from '@/lib/fundraising-api';
import { DemoRefusal } from './demo-refusal';

/**
 * `/api/fundraising` in the preview demo, with the samples hidden.
 *
 * With samples on the page shows Harbor's round (`fundraising-demo`). With
 * them off the visitor sees what a new member sees, and what they enter here
 * follows the API's rules for the tab: raised is what the committed investors
 * add up to, the first contact opens a plain round, and each write answers
 * with the whole state. No file is kept, so a demo document has none to open.
 */

const STORAGE_KEY = 'cfb:demo-own-fundraising:v1';

type World = { round: Omit<ApiRound, 'raisedAmount' | 'investors'> | null; leads: ApiLead[]; documents: ApiDocument[] };

/** Investors a demo lead can be linked to: the people the demo's directory already shows. */
const DEMO_MEMBERS: Array<LinkedAccount & { isInvestor: boolean }> = [
  { id: 'demo-nikos', displayName: 'Nikos Andreou', avatarUrl: null, headline: 'Angel investor', isInvestor: true },
  { id: 'demo-maria', displayName: 'Maria Lazarou', avatarUrl: null, headline: 'Partner at Aegean Ventures', isInvestor: true },
  { id: 'demo-sarah', displayName: 'Dr. Sarah Kim', avatarUrl: null, headline: 'Startup mentor', isInvestor: false },
];

/** A room someone opened to the visitor, so the investor's side of the data room has something to show. */
const SAMPLE_ROOM: SharedRoom = {
  roundId: 'demo-shared-round',
  roundName: 'Harbor seed',
  roundType: 'seed',
  owner: { id: 'demo-elena', displayName: 'Elena Papadopoulos', avatarUrl: null, headline: 'Founder & CEO at Harbor' },
  documents: [
    { id: 'demo-shared-deck', name: 'Investor deck', category: 'pitch', fileName: 'harbor-deck.pdf', fileMimeType: 'application/pdf', fileSizeBytes: 2_400_000, updatedAt: '2026-10-28T09:00:00.000Z' },
    { id: 'demo-shared-model', name: 'Financial model', category: 'financials', fileName: 'harbor-model.xlsx', fileMimeType: 'application/vnd.ms-excel', fileSizeBytes: 640_000, updatedAt: '2026-10-21T09:00:00.000Z' },
  ],
};

const empty = (): World => ({ round: null, leads: [], documents: [] });
let memory: World | null = null;

function read(): World {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? (JSON.parse(raw) as World) : empty();
  } catch {
    memory = empty();
  }
  return memory;
}

function write(next: World) {
  memory = next;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: what the visitor entered holds for this page view only.
  }
}

export function resetDemoOwnFundraising() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function state(world: World): FundraisingState {
  if (!world.round) return { round: null, leads: [], documents: [] };
  const committed = world.leads.filter((l) => l.status === 'committed');
  return {
    round: { ...world.round, raisedAmount: committed.reduce((sum, l) => sum + (l.committedAmount ?? 0), 0), investors: committed.length },
    leads: world.leads,
    documents: world.documents,
  };
}

const newId = (prefix: string, nowIso: string) => `${prefix}-${Date.parse(nowIso).toString(36)}-${read().leads.length + read().documents.length}`;

function plainRound(nowIso: string): NonNullable<World['round']> {
  return { id: newId('round', nowIso), name: 'My round', roundType: 'seed', status: 'planning', currency: 'EUR', targetAmount: null, preMoneyValuation: null, leadInvestorName: null, closingDate: null, description: null };
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new DemoRefusal(400, `${field} is required`, { reason: field });
  return value.trim();
}

const orNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const amount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

export function previewFundraisingApi(
  pathname: string,
  method: string,
  body: Record<string, unknown>,
  upload: { name: string; size: number; type: string; category: string } | null,
  nowIso: string,
): unknown {
  if (pathname !== '/api/fundraising' && !pathname.startsWith('/api/fundraising/')) return undefined;
  const world = read();

  if (pathname === '/api/fundraising' && method === 'GET') return state(world);
  if (pathname === '/api/fundraising/shared' && method === 'GET') return { rooms: [SAMPLE_ROOM] };

  if (pathname === '/api/fundraising/investors/search' && method === 'GET') {
    const q = typeof body.q === 'string' ? body.q.trim().toLowerCase() : '';
    return { members: DEMO_MEMBERS.filter((m) => m.displayName.toLowerCase().includes(q)) };
  }

  if (pathname === '/api/fundraising/documents/sharing' && method === 'POST') {
    const ids = Array.isArray(body.documentIds) ? (body.documentIds as string[]) : [];
    if (ids.some((id) => !world.documents.some((d) => d.id === id))) throw new DemoRefusal(404, 'Document not found');
    const shared = body.shared === true;
    const next = {
      ...world,
      documents: world.documents.map((d) => (ids.includes(d.id) ? { ...d, sharedWithLeads: shared, status: shared ? ('shared' as const) : ('ready' as const), updatedAt: nowIso } : d)),
    };
    write(next);
    return state(next);
  }

  if (pathname === '/api/fundraising/rounds' && method === 'POST') {
    const next = { ...world, round: { ...plainRound(nowIso), ...roundFields(body), name: requireText(body.name, 'name') } };
    write(next);
    return state(next);
  }

  const roundMatch = /^\/api\/fundraising\/rounds\/([^/]+)$/.exec(pathname);
  if (roundMatch && method === 'PATCH') {
    if (world.round?.id !== roundMatch[1]) throw new DemoRefusal(404, 'Round not found');
    const next = { ...world, round: { ...world.round, ...roundFields(body) } };
    write(next);
    return state(next);
  }

  if (pathname === '/api/fundraising/leads' && method === 'POST') {
    const round = world.round ?? plainRound(nowIso);
    const status = (body.status as ApiLead['status']) ?? 'prospect';
    const lead: ApiLead = {
      id: newId('lead', nowIso),
      investorName: requireText(body.investorName, 'investorName'),
      investorFirm: orNull(body.investorFirm),
      investorType: orNull(body.investorType),
      stageFocus: orNull(body.stageFocus),
      checkSizeText: orNull(body.checkSizeText),
      status,
      committedAmount: amount(body.committedAmount),
      currency: round.currency,
      lastContactAt: status === 'prospect' ? null : nowIso,
      notes: orNull(body.notes),
      isVerifiedOnPlatform: false,
      linkedAccount: null,
    };
    const next = { ...world, round, leads: [lead, ...world.leads] };
    write(next);
    return state(next);
  }

  const leadMatch = /^\/api\/fundraising\/leads\/([^/]+)$/.exec(pathname);
  if (leadMatch && method === 'PATCH') {
    const lead = world.leads.find((l) => l.id === leadMatch[1]);
    if (!lead) throw new DemoRefusal(404, 'Investor not found');
    const moved = body.status !== undefined && body.status !== lead.status;
    const { platformUserId, ...fields } = body as Partial<ApiLead> & { platformUserId?: string | null };
    const account = platformUserId ? DEMO_MEMBERS.find((m) => m.id === platformUserId) : null;
    if (platformUserId && !account) throw new DemoRefusal(404, 'Member not found');
    const changed: ApiLead = {
      ...lead,
      ...fields,
      ...(moved && body.status !== 'prospect' ? { lastContactAt: nowIso } : {}),
      ...(platformUserId !== undefined ? { linkedAccount: account ?? null, isVerifiedOnPlatform: Boolean(account) } : {}),
    };
    const next = { ...world, leads: world.leads.map((l) => (l.id === lead.id ? changed : l)) };
    write(next);
    return state(next);
  }

  if (pathname === '/api/fundraising/documents' && method === 'POST') {
    if (!upload) throw new DemoRefusal(400, 'A non-empty file is required', { reason: 'file' });
    const round = world.round ?? plainRound(nowIso);
    const doc: ApiDocument = {
      id: newId('doc', nowIso),
      name: upload.name,
      category: upload.category || 'other',
      status: 'ready',
      isRequired: false,
      hasFile: false,
      fileName: upload.name,
      fileMimeType: upload.type || null,
      fileSizeBytes: upload.size,
      viewCount: 0,
      sharedWithLeads: false,
      openedBy: [],
      lastOpenedAt: null,
      updatedAt: nowIso,
    };
    const next = { ...world, round, documents: [doc, ...world.documents] };
    write(next);
    return state(next);
  }

  const docMatch = /^\/api\/fundraising\/documents\/([^/]+)$/.exec(pathname);
  if (docMatch && (method === 'PATCH' || method === 'DELETE')) {
    if (!world.documents.some((d) => d.id === docMatch[1])) throw new DemoRefusal(404, 'Document not found');
    const documents = method === 'DELETE'
      ? world.documents.filter((d) => d.id !== docMatch[1])
      : world.documents.map((d) => (d.id === docMatch[1] ? { ...d, ...(body as Partial<ApiDocument>), updatedAt: nowIso } : d));
    const next = { ...world, documents };
    write(next);
    return state(next);
  }

  return undefined;
}

function roundFields(body: Record<string, unknown>) {
  const fields: Partial<NonNullable<World['round']>> = {};
  if (typeof body.name === 'string' && body.name.trim()) fields.name = body.name.trim();
  if (typeof body.roundType === 'string') fields.roundType = body.roundType;
  if (typeof body.currency === 'string') fields.currency = body.currency.toUpperCase();
  if (typeof body.status === 'string') fields.status = body.status as ApiRound['status'];
  if ('targetAmount' in body) fields.targetAmount = amount(body.targetAmount);
  if ('closingDate' in body) fields.closingDate = orNull(body.closingDate);
  if ('leadInvestorName' in body) fields.leadInvestorName = orNull(body.leadInvestorName);
  return fields;
}
