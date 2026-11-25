import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveNotices } from './LiveNotices';

/**
 * Investor follow-ups and milestones are a founder's (docs §154): the demo's
 * shared data showed a provider the founder's follow-up and overdue milestone
 * in Today and on Home.
 */
const role = { current: 'service_provider' as string };
vi.mock('@/contexts/RoleContext', () => ({ useRoleOptional: () => ({ primaryRole: role.current }) }));
vi.mock('@/lib/follow-ups', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/follow-ups')>()),
  useInvestorFollowUps: () => ({ due: [{ name: 'Irini Kosta', nameEl: 'Irini Kosta' }] }),
}));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  listMilestones: vi.fn(async () => ({ milestones: [{ id: 'm1', title: 'Trademark', status: 'todo', dueDate: '2020-01-01' }] })),
}));
vi.mock('@/lib/commitments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/commitments-api')>()),
  listCommitmentThreads: vi.fn(async () => []),
}));

function Probe() {
  const { notices } = useLiveNotices();
  return <p data-testid="keys">{notices.map((n) => n.key).join(',')}</p>;
}

const renderProbe = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Probe />
  </QueryClientProvider>,
);

afterEach(cleanup);

describe('what is due now, by role', () => {
  it('shows a founder the follow-up and the overdue milestone', async () => {
    role.current = 'existing_founder';
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('keys').textContent).toBe('follow-up,milestone'));
  });

  it('shows a provider, mentor or investor neither', async () => {
    for (const r of ['service_provider', 'mentor', 'angel_investor']) {
      role.current = r;
      renderProbe();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(screen.getByTestId('keys').textContent).toBe('');
      cleanup();
    }
  });
});
