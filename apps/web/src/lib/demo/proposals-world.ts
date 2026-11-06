import type { OpportunityProposalItem } from '@/lib/api';
import { DemoRefusal } from './demo-refusal';

/**
 * Proposals the visitor sends in the demo, with the API's rules: one per
 * listing unless withdrawn, and a real description. Nobody in the demo answers
 * them, so they stay pending. Incoming proposals are the page's two samples.
 */

const STORAGE_KEY = 'cfb:demo-proposals:v1';

let memory: OpportunityProposalItem[] | null = null;

function read(): OpportunityProposalItem[] {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    memory = Array.isArray(parsed) ? (parsed as OpportunityProposalItem[]) : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(next: OpportunityProposalItem[]) {
  memory = next;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the list holds for this page view only.
  }
}

export function resetDemoProposals() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

export function previewProposalsApi(
  pathname: string,
  method: string,
  body: Record<string, unknown>,
  nowIso: string,
  listingTitle: (id: string) => string | null,
  me: { id: string; displayName: string | null },
): unknown {
  if (pathname === '/api/opportunities/proposals/incoming' && method === 'GET') return { proposals: [] };
  if (pathname === '/api/opportunities/proposals/sent' && method === 'GET') return { proposals: read() };

  const sendMatch = /^\/api\/opportunities\/([^/]+)\/proposals$/.exec(pathname);
  if (sendMatch && method === 'POST') {
    const title = listingTitle(sendMatch[1]);
    if (!title) throw new DemoRefusal(404, 'Opportunity not found');
    const scope = text(body.scope);
    if (!scope || scope.length < 10) throw new DemoRefusal(400, 'Say what you would do in a sentence or two', { reason: 'scope' });
    const items = read();
    const earlier = items.find((p) => p.opportunityId === sendMatch[1]);
    if (earlier && earlier.status !== 'withdrawn') throw new DemoRefusal(409, 'You have already sent a proposal for this listing');
    const proposal: OpportunityProposalItem = {
      id: `proposal-${Date.parse(nowIso).toString(36)}-${items.length}`,
      opportunityId: sendMatch[1],
      opportunityTitle: title,
      from: { id: me.id, displayName: me.displayName, avatarUrl: null, headline: null, role: 'founder' },
      scope,
      timeframe: text(body.timeframe),
      compensation: text(body.compensation),
      status: 'pending',
      respondedAt: null,
      createdAt: nowIso,
    };
    write([proposal, ...items.filter((p) => p.opportunityId !== sendMatch[1])]);
    return { proposal };
  }

  const answerMatch = /^\/api\/opportunities\/proposals\/([^/]+)$/.exec(pathname);
  if (answerMatch && method === 'PATCH') {
    const items = read();
    const proposal = items.find((p) => p.id === answerMatch[1]);
    if (!proposal) throw new DemoRefusal(404, 'Proposal not found');
    if (body.status !== 'withdrawn') throw new DemoRefusal(403, 'You cannot make this change');
    if (proposal.status !== 'pending') throw new DemoRefusal(409, 'This proposal has already been answered');
    const changed = { ...proposal, status: 'withdrawn' as const, respondedAt: nowIso };
    write(items.map((p) => (p.id === proposal.id ? changed : p)));
    return { proposal: changed };
  }
  return undefined;
}
