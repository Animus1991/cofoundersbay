import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAnalyticsOverview, type AnalyticsOverview } from '@/lib/api';
import AnalyticsPage from './page';

vi.mock('@/lib/api', () => ({ getAnalyticsOverview: vi.fn() }));
vi.mock('@/lib/preview-demo', () => ({ isPreviewDemo: () => false }));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('next/dynamic', () => ({ default: () => () => <div /> }));

const overview: AnalyticsOverview = {
  metrics: { profileViews: 0, profileViewsChange: 0, newConnections: 0, newConnectionsChange: 0, messagesSent: 0, messagesSentChange: 0, engagementRate: null, engagementRateChange: null, searchAppearances: null, searchAppearancesChange: null, activityScore: null, activityScoreChange: null },
  profileViews: [], engagement: { connections: 0, messages: 0, likes: null, comments: null, shares: null }, topContent: null,
  weeklySummary: { mostActiveDay: null, peakHour: null, avgResponseTime: null, totalInteractions: null },
};
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><AnalyticsPage /></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAnalyticsOverview).mockResolvedValue(overview); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

describe('analytics clarity and controls', () => {
  it('preserves measured zeros while explaining unavailable values without invented sparklines', async () => {
    const { container } = mount();
    await screen.findByText(/Recorded account activity/);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/null%|undefined|NaN/);
    expect(container.querySelector('polyline')).toBeNull();
    expect(container.querySelector('.hover-lift')).toBeNull();
  });

  it('announces the selected period and preserves filter and refresh requests', async () => {
    mount();
    await screen.findByText(/Recorded account activity/);
    expect(screen.getByRole('button', { name: '7 days' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '30 days' }));
    await waitFor(() => expect(getAnalyticsOverview).toHaveBeenCalledWith('30d', 5));
    expect(screen.getByRole('button', { name: '30 days' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect((screen.getByRole('button', { name: 'Refresh' }) as HTMLButtonElement).disabled).toBe(false));
    const count = vi.mocked(getAnalyticsOverview).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(getAnalyticsOverview).toHaveBeenCalledTimes(count + 1));
  });
});
