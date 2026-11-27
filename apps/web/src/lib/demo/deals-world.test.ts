import { beforeEach, describe, expect, it } from 'vitest';
import { resolvePreviewApi } from '@/lib/preview-api';
import type { InvestorDeal } from '@/lib/api';
import { DEMO_DEALS, DEMO_SCOUTED, resetDemoInvestorBoard } from './deals-world';
import { ORG_FOUNDERS } from './org-world';

type Page = { deals: InvestorDeal[]; total: number };

const api = (path: string, method = 'GET', body?: unknown) =>
  resolvePreviewApi(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const board = () => (api('/api/investor/deals?limit=100') as Page).deals;
const refusal = (run: () => unknown) => {
  try {
    run();
  } catch (err) {
    return err as { status?: number };
  }
  return null;
};

/**
 * The showcase's board keeps what the visitor does (docs §167). Every write
 * used to answer as if it had worked and change nothing: a deal moved on the
 * board stayed in its column, and a startup watched from Scouting never
 * reached the watchlist.
 */
describe('demo investor board', () => {
  beforeEach(() => resetDemoInvestorBoard());

  it('puts a watched startup on the watchlist, once', () => {
    const { deal } = api('/api/investor/deals', 'POST', { name: 'Ledgerly', industry: 'FinTech', askAmountCents: 120_000_000 }) as { deal: InvestorDeal };
    expect(deal.pipelineStage).toBe('discovered');
    expect(deal.recentEvents[0]?.title).toBe('Added to the board');

    const watched = (api('/api/investor/deals?pipelineStage=discovered') as Page).deals.map((d) => d.name);
    expect(watched).toContain('Ledgerly');
    expect(refusal(() => api('/api/investor/deals', 'POST', { name: 'ledgerly' }))?.status).toBe(409);
  });

  it('moves a deal, writes the move, and stamps the investment date once', () => {
    api('/api/investor/deals/deal-thalia', 'PATCH', { pipelineStage: 'invested' });
    const invested = board().find((d) => d.id === 'deal-thalia')!;
    expect(invested.pipelineStage).toBe('invested');
    expect(invested.recentEvents[0]).toMatchObject({ type: 'stage_change', title: 'Moved to invested', fromStage: 'reviewing', toStage: 'invested' });
    const stamped = invested.investedAt;
    expect(stamped).toBeTruthy();

    api('/api/investor/deals/deal-thalia', 'PATCH', { pipelineStage: 'negotiating' });
    api('/api/investor/deals/deal-thalia', 'PATCH', { pipelineStage: 'invested' });
    expect(board().find((d) => d.id === 'deal-thalia')?.investedAt).toBe(stamped);
    expect((api('/api/investor/summary') as { stageCounts: Record<string, number> }).stageCounts.invested).toBe(3);
  });

  it('keeps notes and removals', () => {
    api('/api/investor/deals/deal-kolo/events', 'POST', { type: 'note', title: 'Call booked' });
    expect((api('/api/investor/deals/deal-kolo') as { deal: InvestorDeal }).deal.recentEvents[0]?.title).toBe('Call booked');

    api('/api/investor/deals/deal-kolo', 'DELETE');
    expect(board().some((d) => d.id === 'deal-kolo')).toBe(false);
    expect(refusal(() => api('/api/investor/deals/deal-kolo', 'PATCH', { starred: true }))?.status).toBe(404);
  });

  it('scouts startups the showcase knows, in euros, that are not on the board yet', () => {
    const onBoard = new Set(DEMO_DEALS.map((d) => d.name));
    const founded = new Set(Object.values(ORG_FOUNDERS).map((f) => f.startup));
    for (const startup of DEMO_SCOUTED) {
      expect(onBoard.has(startup.name), startup.name).toBe(false);
      expect(founded.has(startup.name), startup.name).toBe(true);
      expect(startup.raisingCents).toBeGreaterThan(0);
    }
  });
});
