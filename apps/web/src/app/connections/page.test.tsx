import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listConnectionRequests, type ConnectionRequestItem } from '@/lib/api';
import { currentPageControls, resetPageControlsForTests, resetPageListsForTests } from '@/lib/page-controls';
import ConnectionsPage from './page';

vi.mock('@/lib/api', () => ({ listConnectionRequests: vi.fn(), respondToConnectionRequest: vi.fn(), getOrCreateDirectConversation: vi.fn() }));
vi.mock('@/hooks/useStoredUser', () => ({ useStoredUser: () => ({ id: 'me', role: 'founder' }) }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/connections',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/network/PeopleYouMayKnow', () => ({ PeopleYouMayKnow: () => null }));
vi.mock('@/components/ai/AIInsightButton', () => ({ AIInsightButton: () => null }));
vi.mock('@/components/common/PersonHovercard', () => ({ PersonHovercard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
// The page loads its next-steps strip with next/dynamic; here it loads the real one.
vi.mock('next/dynamic', async () => {
  const React = await import('react');
  return {
    default: (loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) => {
      const Lazy = React.lazy(loader);
      return (props: Record<string, unknown>) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props));
    },
  };
});
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en, el }: { en: string; el?: string }) => <>{el ?? en}</> }));

const person = (id: string, displayName: string, role: string, headline: string) => ({ id, displayName, avatarUrl: null, role, headline });
const ME = person('me', 'Alex Demo', 'founder', 'Founder');
const rows: Record<'received' | 'sent' | 'accepted', ConnectionRequestItem[]> = {
  received: [{
    id: 'c1', requesterId: 'elena', receiverId: 'me', status: 'pending', message: 'Θα ήθελα να γνωριστούμε.',
    createdAt: '2026-11-20T10:00:00Z', updatedAt: '2026-11-20T10:00:00Z',
    requester: person('elena', 'Elena Papadopoulos', 'founder', 'Ιδρύτρια και CEO στο Harbor'), receiver: ME,
  }],
  sent: [{
    id: 'c2', requesterId: 'me', receiverId: 'nikos', status: 'pending', message: 'Θα είχατε 15 λεπτά;',
    createdAt: '2026-11-20T10:00:00Z', updatedAt: '2026-11-20T10:00:00Z',
    requester: ME, receiver: person('nikos', 'Nikos Andreou', 'investor', 'Επενδυτής-άγγελος · Seed'),
  }],
  accepted: [{
    id: 'c3', requesterId: 'sarah', receiverId: 'me', status: 'accepted', message: null,
    createdAt: '2026-11-10T10:00:00Z', updatedAt: '2026-11-12T10:00:00Z',
    requester: person('sarah', 'Dr. Sarah Kim', 'mentor', 'Μέντορας startups'), receiver: ME,
  }],
};

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><ConnectionsPage /></QueryClientProvider>);
}
const openTab = (name: RegExp) => fireEvent.mouseDown(screen.getByRole('tab', { name }), { button: 0 });
const cardOf = async (name: string) => (await screen.findByText(name)).closest('[data-surface="card"], .card-interactive') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listConnectionRequests).mockImplementation(async ({ type } = {}) => ({ connections: rows[(type ?? 'received') as keyof typeof rows] }) as Awaited<ReturnType<typeof listConnectionRequests>>);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  resetPageControlsForTests();
  resetPageListsForTests();
});

describe('connections, said once (§162)', () => {
  it('shows a request without "Connection request" on it: the tab already says so', async () => {
    mount();
    const card = await cardOf('Elena Papadopoulos');
    expect(within(card).queryByText('Αίτημα σύνδεσης')).toBeNull();
    expect(within(card).getByText('Αποδοχή')).toBeTruthy();
  });

  it('says since when a sent request waits, instead of "Pending" on every card', async () => {
    mount();
    await screen.findByText('Elena Papadopoulos');
    openTab(/Απεσταλμένα/);
    const card = await cardOf('Nikos Andreou');
    // The actions render twice by design: at the right from sm up, under the
    // note on a phone (one is display:none at each width).
    expect(within(card).getAllByText(/^Σε αναμονή από /).length).toBeGreaterThan(0);
    expect(within(card).queryByText('Εκκρεμεί')).toBeNull();
  });

  it('offers Message once on a connection, with the next steps inside the same card', async () => {
    mount();
    await screen.findByText('Elena Papadopoulos');
    openTab(/Συνδεδεμένα/);
    const card = await cardOf('Dr. Sarah Kim');
    const steps = (await within(card).findByText('Επόμενο βήμα:')).parentElement as HTMLElement;
    // The next steps are the card's foot, not a second card around it, and
    // they leave Message to the card's own button.
    expect(card.contains(steps)).toBe(true);
    expect(within(steps).queryByText('Μήνυμα')).toBeNull();
    expect(within(card).getAllByText('Μήνυμα').length).toBeGreaterThan(0);
  });

  it('names the tabs to the assistant as the tabs read', async () => {
    mount();
    await screen.findByText('Elena Papadopoulos');
    const tab = currentPageControls().find((c) => c.id === 'tab');
    expect(tab?.options?.map((o) => o.labelEl)).toEqual(['Αιτήματα', 'Απεσταλμένα', 'Συνδεδεμένα']);
  });
});
