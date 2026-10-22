import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAnalyticsOverview, getAnalyticsAchievements, type AnalyticsOverview } from '@/lib/api';
import AnalyticsPage from './page';

vi.mock('@/lib/api', () => ({ getAnalyticsOverview: vi.fn(), getAnalyticsAchievements: vi.fn() }));
vi.mock('@/lib/preview-demo', () => ({ isPreviewDemo: () => false }));
// The page's period and refresh live in its rail now; the stand-in renders the
// rail's sections as the open panel would, so the same controls are tested
// where the reader finds them.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children, rail }: { children: React.ReactNode; rail?: { id: string; labelEn: string; content: React.ReactNode }[] }) => (
    <main>
      {children}
      {rail?.map((section) => <section key={section.id} aria-label={section.labelEn}>{section.content}</section>)}
    </main>
  ),
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('@/contexts/PopupChatContext', () => ({
  usePopupChat: () => ({
    open: vi.fn(), close: vi.fn(), toggle: vi.fn(),
    isOpen: false, isMinimized: false, initialUserId: null,
    minimize: vi.fn(), restore: vi.fn(),
  }),
}));
vi.mock('next/dynamic', () => ({ default: () => () => <div /> }));
vi.mock('@/hooks/useGamification', () => ({
  useMyBadges: () => ({ data: [], isLoading: false }),
}));

/**
 * A stand-in address bar. The window is readable from the URL so that a link,
 * a bookmark or the assistant can set it, and these two states are what the
 * page actually reads and writes.
 */
const url = { search: '', replaced: [] as string[] };
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(url.search),
  useRouter: () => ({
    replace: (href: string) => {
      url.replaced.push(href);
      url.search = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
    },
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

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
beforeEach(() => { vi.clearAllMocks(); url.search = ''; url.replaced = []; vi.mocked(getAnalyticsOverview).mockResolvedValue(overview); vi.mocked(getAnalyticsAchievements).mockResolvedValue([]); });
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
    // Highlights used to restate every tile delta before the numbers; sparks
    // used to be invented for metrics with no series. Both said "This window".
    expect(screen.queryByText('This window')).toBeNull();
    expect(screen.getByText(/Connection requests are not counted yet/)).toBeTruthy();
    expect(screen.getByText('Network Velocity')).toBeTruthy();
  });

  it('keeps the six overview tiles the same shape when views have a series', async () => {
    vi.mocked(getAnalyticsOverview).mockResolvedValue({
      ...overview,
      metrics: { ...overview.metrics, profileViews: 248, profileViewsChange: 12 },
      profileViews: [
        { date: '2026-10-01', views: 10, uniqueVisitors: 4 },
        { date: '2026-10-02', views: 20, uniqueVisitors: 8 },
      ],
    });
    const { container } = mount();
    await screen.findAllByText('248');
    // The series belongs on the Growth chart, not inside one tile. A line on
    // Profile Views alone made the top row taller than the row under it.
    expect(container.querySelector('polyline')).toBeNull();
    expect(screen.queryByText('This window')).toBeNull();
    expect(screen.getAllByText('Profile Views').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity Score').length).toBeGreaterThan(0);
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

  it('puts the chosen window in the address, and drops the parameter for the default', async () => {
    mount();
    await screen.findByText(/Recorded account activity/);

    fireEvent.click(screen.getByRole('button', { name: '90 days' }));
    await waitFor(() => expect(url.replaced).toContain('/analytics?period=90d'));

    // Back to the window the page opens on: the address returns to the bare
    // route rather than spelling out the default.
    fireEvent.click(screen.getByRole('button', { name: '7 days' }));
    await waitFor(() => expect(url.replaced).toContain('/analytics'));
  });

  it('opens on the window named in the address', async () => {
    url.search = 'period=30d';
    mount();
    await screen.findByText(/Recorded account activity/);

    await waitFor(() => expect(getAnalyticsOverview).toHaveBeenCalledWith('30d', 5));
    expect(screen.getByRole('button', { name: '30 days' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '7 days' }).getAttribute('aria-pressed')).toBe('false');
  });

  // docs §79: a tile's change carried no sign once its arrow was hidden, the
  // "down" callout said "Open Discover" and opened the side panel, and a
  // failed read said "Failed to load".
  it('signs each change, says against what, and opens the page of what fell', async () => {
    vi.mocked(getAnalyticsOverview).mockResolvedValue({
      ...overview,
      metrics: { ...overview.metrics, profileViews: 248, profileViewsChange: 12, messagesSent: 63, messagesSentChange: -8 },
    });
    mount();
    await screen.findAllByText('248');
    expect(screen.getAllByText('+12%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('−8%').length).toBeGreaterThan(0);
    expect(screen.getByText(/^Changes compare with the previous 7 days\. Recorded account activity/)).toBeTruthy();
    expect(screen.getByText('Messages Sent −8%')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open messages' }).getAttribute('href')).toBe('/messages');
    expect(screen.queryByRole('button', { name: 'Open Discover' })).toBeNull();
    expect(screen.getAllByRole('link', { name: /248/ })[0].getAttribute('title')).toMatch(/Open profile/);
  });

  it('says a failed read was not read, with Try again', async () => {
    vi.mocked(getAnalyticsOverview).mockRejectedValue(new Error('offline'));
    mount();
    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(alert.textContent).toBe('Your analytics could not be read just now.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('ignores a window it does not recognise instead of asking the API for it', async () => {
    url.search = 'period=all-time';
    mount();
    await screen.findByText(/Recorded account activity/);

    expect(screen.getByRole('button', { name: '7 days' }).getAttribute('aria-pressed')).toBe('true');
    expect(getAnalyticsOverview).not.toHaveBeenCalledWith('all-time', 5);
  });
});
