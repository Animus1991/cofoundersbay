import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PerkView } from '@cofounderbay/shared';
import { adminListPerks, listClaimedPerks, listPerks } from '@/lib/perks-api';
import { currentPageLists, resetPageControlsForTests, resetPageListsForTests } from '@/lib/page-controls';
import PerksPage from './page';

vi.mock('@/lib/perks-api', () => ({
  listPerks: vi.fn(), listClaimedPerks: vi.fn(), adminListPerks: vi.fn(), claimPerk: vi.fn(), setPerkActive: vi.fn(),
}));
vi.mock('@/hooks/useStoredUser', () => ({ useStoredUser: () => ({ id: 'u1', role: 'founder' }) }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/components/layout/PageRailContext', () => ({ usePageRail: () => ({ openRailSection: vi.fn() }) }));
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
// Greek, the reader these rows and lines are written for.
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en, el }: { en: string; el?: string }) => <>{el ?? en}</> }));

const DAY = 86_400_000;
function perk(over: Partial<PerkView>): PerkView {
  return {
    id: 'p1', partner: 'Openroster', logoUrl: null,
    title: 'Your first three job posts', titleEl: 'Οι τρεις πρώτες αγγελίες σας',
    summary: 'Post free.', summaryEl: null, value: '3 free job posts', valueEl: '3 αγγελίες δωρεάν',
    category: 'hiring', stages: [], howToRedeem: 'Use the code.', howToRedeemEl: null, terms: null, termsEl: null,
    expiresAt: null, active: true, claimCount: 6, claimed: false, claimedAt: null, code: null, redeemUrl: null,
    ...over,
  };
}

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><PerksPage /></QueryClientProvider>);
}
const cardOf = async (partner: string) => (await screen.findByText(partner)).closest('[id^="perk-"]') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listClaimedPerks).mockResolvedValue([]);
  vi.mocked(adminListPerks).mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  resetPageControlsForTests();
  resetPageListsForTests();
});

describe('perk cards and rows (§162)', () => {
  it('says when an offer ends on a line of its own, whole', async () => {
    vi.mocked(listPerks).mockResolvedValue([perk({ expiresAt: new Date(Date.now() + 9 * DAY).toISOString() })]);
    mount();
    const card = await cardOf('Openroster');
    const ends = await within(card).findByText(/^Λήγει σε \d+ ημέρες$/);
    // A line under the value, not a pill squeezed into the head's right column.
    expect(ends.closest('p')?.previousElementSibling?.textContent).toBe('3 αγγελίες δωρεάν');
  });

  it('says "claimed" once: the foot, with when, and no pill beside the title', async () => {
    vi.mocked(listPerks).mockResolvedValue([perk({ partner: 'Pinwheel Studio', claimed: true, claimedAt: new Date(Date.now() - 6 * DAY).toISOString(), redeemUrl: 'https://example.com' })]);
    mount();
    const card = await cardOf('Pinwheel Studio');
    expect(within(card).getAllByText(/Διεκδικήθηκε/)).toHaveLength(1);
  });

  it('gives the assistant Greek rows with the state as the last part', async () => {
    vi.mocked(listPerks).mockResolvedValue([
      perk({ claimed: true, claimedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 9 * DAY).toISOString() }),
    ]);
    mount();
    await cardOf('Openroster');
    const list = currentPageLists().find((l) => l.id === 'perks_offers');
    expect(list?.rowsEl?.[0]).toMatch(/^Openroster: Οι τρεις πρώτες αγγελίες σας · 3 αγγελίες δωρεάν · .* · διεκδικήθηκε, λήγει σε \d+ ημέρες$/);
    expect(list?.rows[0]).toMatch(/ · claimed, ends in \d+ days$/);
  });
});
