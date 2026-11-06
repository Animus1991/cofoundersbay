import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getFundraising } from '@/lib/fundraising-api';
import FundraisingPage from './page';

vi.mock('@/lib/fundraising-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fundraising-api')>();
  return { ...actual, getFundraising: vi.fn() };
});
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/contexts/DemoDataContext', () => ({ useDemoData: () => ({ showDemoData: false }) }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask: vi.fn() }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/fundraising',
}));

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><FundraisingPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
afterEach(() => { cleanup(); clients.splice(0).forEach((c) => c.clear()); });

// docs §112: a failed read showed "No active round yet" and an empty pipeline,
// so a founder with a full round read that it had gone.
describe('/fundraising when the round cannot be read', () => {
  it('says so, offers no empty round, and tries again', async () => {
    vi.mocked(getFundraising).mockRejectedValueOnce(new Error('Unable to reach the API server.'));
    mount();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/could not be read just now/);
    expect(screen.queryByText('No active round yet')).toBeNull();
    expect(screen.queryByText('Unable to reach the API server.')).toBeNull();
    vi.mocked(getFundraising).mockResolvedValueOnce({ round: null, leads: [], documents: [] } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByText('No active round yet');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
