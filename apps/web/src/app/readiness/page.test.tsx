import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReadinessPage from './page';
import { assessReadiness, updateReadinessCriterion } from '@/lib/api';

vi.mock('@/lib/api', () => ({ assessReadiness: vi.fn(), updateReadinessCriterion: vi.fn() }));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children, actions }: any) => <main>{actions}{children}</main> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: any) => <span>{en}</span> }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock('@/contexts/PopupChatContext', () => ({
  usePopupChat: () => ({
    open: vi.fn(), close: vi.fn(), toggle: vi.fn(),
    isOpen: false, isMinimized: false, initialUserId: null,
    minimize: vi.fn(), restore: vi.fn(),
  }),
}));
vi.mock('next/dynamic', () => ({ default: () => () => <div data-testid="chart" /> }));

const workspaceId = 'workspace-live';
const assessment = {
  overallScore: 25, overallMax: 100, lastAssessedAt: '2026-05-01T10:00:00Z',
  acceleratorReadiness: 25, investorReadiness: 25,
  dimensions: [{
    id: 'score-team', workspaceId, dimension: 'team', score: 25, maxScore: 100,
    assessedAt: '2026-05-01T10:00:00Z', recommendations: ['Complete: Real criterion'],
    criteria: [{ id: 'real-1', name: 'Real criterion', completed: false, weight: 25 }],
  }],
};
const clients: QueryClient[] = [];

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><ReadinessPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.cookie = 'cfb_preview_demo=; Max-Age=0';
  document.cookie = 'cfb_session=; Max-Age=0';
  vi.mocked(assessReadiness).mockResolvedValue({ assessment });
  vi.mocked(updateReadinessCriterion).mockResolvedValue({} as any);
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('live readiness and explicit showcase isolation', () => {
  it('shows an actionable missing-workspace state without any fabricated criteria or request', async () => {
    mount();
    await screen.findByText('Create or select a workspace to assess readiness.');
    expect(screen.getByRole('link', { name: 'Open Startup Builder' }).getAttribute('href')).toBe('/builder');
    expect(screen.queryByText('Co-founder identified')).toBeNull();
    expect(assessReadiness).not.toHaveBeenCalled();
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
  });

  it('renders only returned canonical dimensions and never simulates live history', async () => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    mount();
    await screen.findByRole('button', { name: /Real criterion/ });
    expect(screen.queryByText('Target market defined')).toBeNull();
    expect(screen.queryByText('Co-founder identified')).toBeNull();
    expect(screen.getByText('Readiness history is not available yet.')).toBeTruthy();
    expect(screen.queryByText(/pts/)).toBeNull();
    fireEvent.mouseDown(screen.getByRole('tab', { name: /History/i }), { button: 0, ctrlKey: false });
    await screen.findByRole('tabpanel');
    expect(screen.queryByText('W1')).toBeNull();
  });

  it('shows a retryable API error instead of silently substituting sample criteria', async () => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    vi.mocked(assessReadiness).mockRejectedValueOnce(new Error('offline'));
    mount();
    await screen.findByRole('alert');
    expect(screen.queryByText('Co-founder identified')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByRole('button', { name: /Real criterion/ });
    expect(assessReadiness).toHaveBeenCalledTimes(2);
  });

  it.each([
    { overallScore: 25, dimensions: assessment.dimensions },
    { assessment: { ...assessment, dimensions: [] } },
    { assessment: { ...assessment, overallMax: 0 } },
  ])('rejects a missing or invalid canonical assessment instead of showing demo data', async (response) => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    vi.mocked(assessReadiness).mockResolvedValue(response as any);
    mount();
    await screen.findByRole('alert');
    expect(screen.queryByText('Co-founder identified')).toBeNull();
    expect(screen.queryByRole('button', { name: /Real criterion/ })).toBeNull();
  });

  it('refreshes stored scores after a real criterion update and on reassess', async () => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    mount();
    const criterion = await screen.findByRole('button', { name: /Real criterion/ });
    fireEvent.click(criterion);
    await waitFor(() => expect(updateReadinessCriterion).toHaveBeenCalledWith(workspaceId, {
      dimension: 'team', criterionId: 'real-1', completed: true,
    }));
    await waitFor(() => expect(assessReadiness).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: /Reassess/i }));
    await waitFor(() => expect(assessReadiness).toHaveBeenCalledTimes(3));
  });

  it('supports an explicit read-only demo showcase even with a saved live workspace', async () => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    localStorage.setItem('cfb_demo_data', '1');
    mount();
    const criterion = await screen.findByRole('button', { name: /Co-founder identified/ });
    expect((criterion as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(criterion);
    expect(screen.getByText('Demo showcase — simulated scores and history. Changes are disabled.')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Reassess/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(assessReadiness).not.toHaveBeenCalled();
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
  });

  it('lets a live account explicitly view sample readiness without a workspace mutation', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'View demo showcase' }));
    const criterion = await screen.findByRole('button', { name: /Co-founder identified/ });
    fireEvent.click(criterion);
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
    expect(assessReadiness).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'View live readiness' }));
    await screen.findByText('Create or select a workspace to assess readiness.');
  });
});
