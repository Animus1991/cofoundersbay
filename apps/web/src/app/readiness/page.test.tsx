import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReadinessPage from './page';
import { assessReadiness, updateReadinessCriterion } from '@/lib/api';
import { writeReadinessOverlay } from '@/lib/readiness-demo';
import type { ReactNode } from 'react';
import type { PageRailSection } from '@/components/layout/PageRail';

vi.mock('@/lib/api', () => ({ assessReadiness: vi.fn(), updateReadinessCriterion: vi.fn() }));
// The score history and the audience readouts live in the page's rail now;
// the stand-in renders the rail's sections as the open panel would.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children, actions, rail }: { children: ReactNode; actions?: ReactNode; rail?: PageRailSection[] }) => (
    <main>
      {actions}
      {children}
      {rail?.map((section) => <section key={section.id} aria-label={section.labelEn}>{section.content}</section>)}
    </main>
  ),
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock('@/contexts/PopupChatContext', () => ({
  usePopupChat: () => ({
    open: vi.fn(), close: vi.fn(), toggle: vi.fn(),
    isOpen: false, isMinimized: false, initialUserId: null,
    minimize: vi.fn(), restore: vi.fn(),
  }),
  usePopupChatOptional: () => null,
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
  sessionStorage.clear();
  document.cookie = 'cfb_preview_demo=; Max-Age=0';
  document.cookie = 'cfb_session=; Max-Age=0';
  vi.mocked(assessReadiness).mockResolvedValue({ assessment });
  vi.mocked(updateReadinessCriterion).mockResolvedValue({} as Awaited<ReturnType<typeof updateReadinessCriterion>>);
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('live readiness and explicit showcase isolation', () => {
  it('shows an actionable missing-workspace state without any fabricated criteria or request', async () => {
    mount();
    await screen.findByText('Readiness is scored for one startup workspace, and none is open yet. Create yours or choose it in the Startup Builder.');
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
    // History is no longer a tab on this page: it is the rail's "Score history"
    // section, and the column keeps a control that opens it. In live mode that
    // section states the gap rather than drawing a trend, which is the thing
    // this test is actually for - the chart and the weekly points exist only
    // for the demo showcase.
    expect(screen.getByRole('button', { name: /Score history/ })).toBeTruthy();
    const history = screen.getByRole('region', { name: 'Score history' });
    expect(history.textContent).toContain('Historical assessments are not available.');
    expect(screen.queryByText(/\+\d+\s*pts/)).toBeNull();
    expect(screen.queryByText('W1')).toBeNull();
  });

  it('shows a retryable API error instead of silently substituting sample criteria', async () => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    vi.mocked(assessReadiness).mockRejectedValueOnce(new Error('offline'));
    mount();
    await screen.findByRole('alert');
    expect(screen.queryByText('Co-founder identified')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('could not be read just now');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('button', { name: /Real criterion/ });
    expect(assessReadiness).toHaveBeenCalledTimes(2);
  });

  it.each([
    { overallScore: 25, dimensions: assessment.dimensions },
    { assessment: { ...assessment, dimensions: [] } },
    { assessment: { ...assessment, overallMax: 0 } },
  ])('rejects a missing or invalid canonical assessment instead of showing demo data', async (response) => {
    localStorage.setItem('cfb_default_workspace', workspaceId);
    vi.mocked(assessReadiness).mockResolvedValue(response as Awaited<ReturnType<typeof assessReadiness>>);
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

  it('lets the showcase be ticked while keeping it entirely off the live workspace', async () => {
    // The showcase used to be a screenshot: every criterion disabled, under a
    // banner that said so. It is writable now — its scores were always derived
    // from these flags — but the guarantee that matters is unchanged and is
    // what the rest of this case asserts: a saved live workspace is never
    // read, never written, and never replaced by sample scores.
    localStorage.setItem('cfb_default_workspace', workspaceId);
    localStorage.setItem('cfb_demo_data', '1');
    mount();

    const criterion = await screen.findByRole('button', { name: /Co-founder identified/ });
    expect((criterion as HTMLButtonElement).disabled).toBe(false);

    // Team ships three of five met; clearing one is visible in the count.
    expect(screen.getAllByText('3/5').length).toBeGreaterThan(0);
    fireEvent.click(criterion);
    await waitFor(() => expect(screen.getAllByText('2/5').length).toBeGreaterThan(0));

    expect((screen.getByRole('button', { name: /Reassess/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(assessReadiness).not.toHaveBeenCalled();
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
  });

  it('reflects a demo criterion changed by the assistant without a reload', async () => {
    localStorage.setItem('cfb_demo_data', '1');
    mount();
    await screen.findByRole('button', { name: /Co-founder identified/ });
    expect(screen.getAllByText('3/5').length).toBeGreaterThan(0);

    writeReadinessOverlay({ 'team/t1': false });
    window.dispatchEvent(new CustomEvent('cfb:readiness-updated'));

    await waitFor(() => expect(screen.getAllByText('2/5').length).toBeGreaterThan(0));
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
  });

  it('recalculates the showcase score from the criteria and forgets it on reset', async () => {
    localStorage.setItem('cfb_demo_data', '1');
    mount();

    // Market ships two of five met, with the third criterion unmet and visible
    // without expanding the card.
    expect(screen.getAllByText('2/5').length).toBeGreaterThan(0);
    fireEvent.click(await screen.findByRole('button', { name: /Competitive analysis completed/ }));

    // Nothing is stored anywhere but the session, so the way back is offered
    // as soon as there is something to go back from.
    const reset = await screen.findByRole('button', { name: 'Reset the demo' });
    await waitFor(() => expect(screen.getAllByText('3/5').length).toBeGreaterThan(1));

    fireEvent.click(reset);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reset the demo' })).toBeNull());
    expect(screen.getAllByText('2/5').length).toBeGreaterThan(0);
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
  });

  // docs §79: the criteria are switches whose state mark was hidden as
  // decoration; "+2 show more", three uncaptioned dimension names and a greyed
  // Reassess each left a reader guessing.
  it('says what each readiness control is and does', async () => {
    localStorage.setItem('cfb_demo_data', '1');
    mount();
    const met = await screen.findByRole('button', { name: /Co-founder identified/ });
    expect(met.closest('[data-keep-icon]')).toBe(met);
    expect(screen.getByText(/The % beside it is its share/)).toBeTruthy();
    const more = screen.getAllByRole('button', { name: 'Show 2 more criteria' })[0];
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Dimensions under 60%')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Ask AI: Team readiness/ })).toBeTruthy();
    expect(screen.getByText('In the side panel:')).toBeTruthy();
    const reassess = screen.getByRole('button', { name: /Reassess/i });
    expect(reassess.getAttribute('title')).toMatch(/The demo recalculates as you tick/);
    // Described by the banner already on screen, not by a second printed line.
    expect(document.getElementById(reassess.getAttribute('aria-describedby') ?? '')?.textContent).toMatch(/Demo showcase/);
  });

  it('lets a live account explicitly view sample readiness without a workspace mutation', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'View demo showcase' }));
    const criterion = await screen.findByRole('button', { name: /Co-founder identified/ });
    fireEvent.click(criterion);
    expect(updateReadinessCriterion).not.toHaveBeenCalled();
    expect(assessReadiness).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'View live readiness' }));
    await screen.findByText('Readiness is scored for one startup workspace, and none is open yet. Create yours or choose it in the Startup Builder.');
  });
});
