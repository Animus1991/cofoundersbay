export type RoundStatus = 'planning' | 'active' | 'closing' | 'closed';
export type InvestorStatus = 'prospect' | 'contacted' | 'meeting' | 'dd' | 'committed' | 'passed';
export type DocStatus = 'draft' | 'ready' | 'shared';

export type FundRound = {
  id: string;
  name: string;
  type: string;
  currency: string;
  target: number;
  raised: number;
  status: RoundStatus;
  closingDate?: string;
  valuation?: number;
  leadInvestor?: string;
};

export type InvestorLead = {
  id: string;
  name: string;
  firm?: string;
  type: string;
  stage: string;
  checkSize: string;
  status: InvestorStatus;
  lastContact?: string;
  notes?: string;
  notesEl?: string;
  isVerified: boolean;
};

export type DataRoomDoc = {
  id: string;
  name: string;
  nameEl?: string;
  category: string;
  status: DocStatus;
  isRequired: boolean;
  lastUpdated?: string;
};

const STORAGE_KEY = 'cfb:demo-fundraising';

/** Seed round — dashboard widget and /fundraising must read the same numbers. */
export const FUNDRAISING_SEED_ROUND: FundRound = {
  id: 'r1',
  name: 'Seed Round',
  type: 'SAFE',
  currency: '$',
  target: 750_000,
  raised: 375_000,
  status: 'active',
  closingDate: '2026-10-15T17:00:00.000Z',
  valuation: 3_000_000,
  leadInvestor: 'Athens Tech Angels',
};

export const FUNDRAISING_SEED_LEADS: InvestorLead[] = [
  { id: 'l1', name: 'Sarah Chen', firm: 'Chen Ventures', type: 'Angel', stage: 'Pre-Seed / Seed', checkSize: '$25K–$150K', status: 'meeting', lastContact: '2026-09-04T12:00:00.000Z', isVerified: true, notes: 'Interested in AI angle. Follow up after demo.', notesEl: 'Ενδιαφέρεται για τη γωνία AI. Επικοινωνία μετά την επίδειξη.' },
  { id: 'l2', name: 'Michael Torres', firm: 'Horizon Capital', type: 'VC', stage: 'Seed / A', checkSize: '$500K–$3M', status: 'contacted', lastContact: '2026-08-30T12:00:00.000Z', isVerified: true, notes: 'Warm intro via Nikos. Waiting for deck review.', notesEl: 'Θερμή γνωριμία μέσω Νίκου. Περιμένει ανασκόπηση του deck.' },
  { id: 'l3', name: 'Athens Tech Angels', firm: 'Syndicate', type: 'Syndicate', stage: 'Pre-Seed / Seed', checkSize: '€50K–€200K', status: 'committed', lastContact: '2026-09-03T12:00:00.000Z', isVerified: true, notes: 'Lead investor — committed $200K of the $375K raised.', notesEl: 'Κύριος επενδυτής — δεσμεύτηκε $200K από τα $375K που έχουν συγκεντρωθεί.' },
  { id: 'l4', name: 'Emma Williams', firm: undefined, type: 'Angel', stage: 'Pre-Seed / Seed', checkSize: '$10K–$75K', status: 'prospect', lastContact: undefined, isVerified: true, notes: undefined },
  { id: 'l5', name: 'Sequoia Scout', firm: 'Sequoia Capital', type: 'Scout', stage: 'Pre-Seed', checkSize: '$100K–$500K', status: 'dd', lastContact: '2026-09-01T12:00:00.000Z', isVerified: true, notes: 'Requested financials and cap table.', notesEl: 'Ζήτησε οικονομικά στοιχεία και πίνακα κεφαλαίου.' },
  { id: 'l6', name: 'Klaus Weber', firm: 'Weber Family Office', type: 'Family Office', stage: 'Seed / A', checkSize: '$1M–$5M', status: 'passed', lastContact: '2026-08-23T12:00:00.000Z', isVerified: false, notes: 'Too early for their ticket size.', notesEl: 'Πολύ νωρίς για το μέγεθος επιταγής τους.' },
];

export const FUNDRAISING_SEED_DOCS: DataRoomDoc[] = [
  { id: 'd1', name: 'Pitch Deck', nameEl: 'Pitch deck', category: 'Pitch', status: 'ready', isRequired: true, lastUpdated: '2026-09-03T12:00:00.000Z' },
  { id: 'd2', name: 'Executive Summary', nameEl: 'Εκτελεστική σύνοψη', category: 'Pitch', status: 'ready', isRequired: true, lastUpdated: '2026-08-30T12:00:00.000Z' },
  { id: 'd3', name: '3-Year Financial Model', nameEl: 'Οικονομικό μοντέλο 3 ετών', category: 'Financials', status: 'draft', isRequired: true, lastUpdated: '2026-09-01T12:00:00.000Z' },
  { id: 'd4', name: 'Cap Table', nameEl: 'Πίνακας κεφαλαίου', category: 'Legal', status: 'ready', isRequired: true, lastUpdated: '2026-08-23T12:00:00.000Z' },
  { id: 'd5', name: 'SAFE / Term Sheet Template', nameEl: 'Πρότυπο SAFE / φύλλου όρων', category: 'Legal', status: 'draft', isRequired: true, lastUpdated: undefined },
  { id: 'd6', name: 'Product Demo Video', nameEl: 'Βίντεο επίδειξης προϊόντος', category: 'Product', status: 'ready', isRequired: false, lastUpdated: '2026-09-05T12:00:00.000Z' },
  { id: 'd7', name: 'Market Research Report', nameEl: 'Έκθεση έρευνας αγοράς', category: 'Market', status: 'shared', isRequired: false, lastUpdated: '2026-08-23T12:00:00.000Z' },
  { id: 'd8', name: 'Team Bios & LinkedIn', nameEl: 'Βιογραφικά ομάδας και LinkedIn', category: 'Team', status: 'ready', isRequired: false, lastUpdated: '2026-08-16T12:00:00.000Z' },
  { id: 'd9', name: 'IP & Patents (if any)', nameEl: 'Πνευματική ιδιοκτησία και διπλώματα (αν υπάρχουν)', category: 'Legal', status: 'draft', isRequired: false, lastUpdated: undefined },
  { id: 'd10', name: 'Customer Contracts / LOIs', nameEl: 'Συμβάσεις πελατών / LOI', category: 'Traction', status: 'draft', isRequired: false, lastUpdated: undefined },
];

export const PIPELINE_STAGES: InvestorStatus[] = ['prospect', 'contacted', 'meeting', 'dd', 'committed', 'passed'];
export const DOC_CATEGORIES = ['All', 'Pitch', 'Financials', 'Legal', 'Product', 'Market', 'Team', 'Traction'] as const;
export const INVESTOR_TYPES = ['Angel', 'VC', 'Syndicate', 'Scout', 'Family Office'] as const;
export const ACTIVE_STATUSES: InvestorStatus[] = ['contacted', 'meeting', 'dd'];

export type FundraisingOverlay = {
  created: InvestorLead[];
  status: Record<string, InvestorStatus>;
};

function emptyOverlay(): FundraisingOverlay {
  return { created: [], status: {} };
}

export function readFundraisingOverlay(): FundraisingOverlay {
  if (typeof window === 'undefined') return emptyOverlay();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverlay();
    const parsed = JSON.parse(raw) as Partial<FundraisingOverlay>;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      status: parsed.status && typeof parsed.status === 'object' ? parsed.status : {},
    };
  } catch {
    return emptyOverlay();
  }
}

export function writeFundraisingOverlay(overlay: FundraisingOverlay) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
}

export function resolveFundraisingLeads(overlay: FundraisingOverlay = emptyOverlay()): InvestorLead[] {
  const fromSeed = FUNDRAISING_SEED_LEADS.map((l) => ({
    ...l,
    status: overlay.status[l.id] ?? l.status,
  }));
  const created = overlay.created.map((l) => ({
    ...l,
    status: overlay.status[l.id] ?? l.status,
  }));
  return [...created, ...fromSeed];
}

export function listFundraisingLeads(): InvestorLead[] {
  return resolveFundraisingLeads(readFundraisingOverlay());
}

export function fundraisingPipelineStats(leads: InvestorLead[]) {
  const committed = leads.filter((l) => l.status === 'committed').length;
  const active = leads.filter((l) => ACTIVE_STATUSES.includes(l.status)).length;
  return {
    total: leads.length,
    active,
    committed,
    conversion: leads.length ? Math.round((committed / leads.length) * 100) : 0,
  };
}

/** Round.investors is the committed count — never a hardcoded 4 that disagrees with the pipeline. */
export function fundraisingRoundView(leads: InvestorLead[] = FUNDRAISING_SEED_LEADS): FundRound & { investors: number } {
  const stats = fundraisingPipelineStats(leads);
  return { ...FUNDRAISING_SEED_ROUND, investors: stats.committed };
}

export function addFundraisingLead(input: Omit<InvestorLead, 'id' | 'isVerified'> & { isVerified?: boolean }): InvestorLead {
  const lead: InvestorLead = {
    ...input,
    id: `l-${Date.now()}`,
    isVerified: input.isVerified ?? false,
  };
  const overlay = readFundraisingOverlay();
  overlay.created = [lead, ...overlay.created];
  writeFundraisingOverlay(overlay);
  return lead;
}

export function moveFundraisingLead(id: string, status: InvestorStatus) {
  const overlay = readFundraisingOverlay();
  overlay.status[id] = status;
  writeFundraisingOverlay(overlay);
}

export function fmtMoney(n: number, currency = '$') {
  if (n >= 1_000_000) return `${currency}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(0)}K`;
  return `${currency}${n}`;
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
