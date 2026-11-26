import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listIntros, type Intro } from '@/lib/intros-api';
import { currentPageLists, resetPageControlsForTests, resetPageListsForTests } from '@/lib/page-controls';
import IntrosPage from './page';

vi.mock('@/lib/intros-api', () => ({
  listIntros: vi.fn(), acceptIntro: vi.fn(), declineIntro: vi.fn(), forwardIntro: vi.fn(), notNowIntro: vi.fn(), withdrawIntro: vi.fn(),
}));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/components/ui/confirm-dialog', () => ({ useConfirm: () => vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/intros',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/common/PersonHovercard', () => ({ PersonHovercard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
// Greek, the language the wording rules are about.
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en, el }: { en: string; el?: string }) => <>{el ?? en}</> }));

const person = (id: string, displayName: string, headline: string | null = null) => ({ id, displayName, headline, avatarUrl: null });
const toForward: Intro = {
  id: 'i1', role: 'intermediary', status: 'pending',
  requester: person('dimitris', 'Dimitris Kostas', 'Ιδρυτής στην Orion Grid'), intermediary: person('me', 'Alex Demo'), target: person('sarah', 'Dr. Sarah Kim'),
  card: { id: 'card1', title: 'Επενδυτής-άγγελος με εμπειρία σε δίκτυα' },
  note: 'Η Orion Grid αντλεί το pre-seed της.', forwardNote: null,
  toRequester: ['connection'], toTarget: ['mentor'], threadId: null, createdAt: '2026-11-25T10:00:00Z', decidedAt: null,
};

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><IntrosPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listIntros).mockResolvedValue({ sent: [], toForward: [toForward], received: [] });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  resetPageControlsForTests();
  resetPageListsForTests();
});

describe('an introduction card (§162)', () => {
  it('says who it waits on in a few words, and names people rather than gendering them', async () => {
    mount();
    const card = (await screen.findByText('Ιδρυτής στην Orion Grid')).closest('[id^="intro-"]') as HTMLElement;
    expect(within(card).getByText('Σας περιμένει')).toBeTruthy();
    expect(within(card).getByText('Πώς συνδέονται: σύνδεση με Dimitris Kostas, καθοδήγηση με Dr. Sarah Kim.')).toBeTruthy();
    expect(card.textContent).not.toMatch(/τον ιδρυτή|τον ενδιάμεσο/);
  });

  it('gives the assistant Greek rows with the state as the last part', async () => {
    mount();
    await screen.findByText('Ιδρυτής στην Orion Grid');
    const list = currentPageLists().find((l) => l.id === 'intros_to_forward');
    expect(list?.rowsEl?.[0]).toBe('Dimitris Kostas → Alex Demo → Dr. Sarah Kim · Επενδυτής-άγγελος με εμπειρία σε δίκτυα · Σας περιμένει');
    expect(list?.rows[0]).toMatch(/ · Waiting on you$/);
  });
});
