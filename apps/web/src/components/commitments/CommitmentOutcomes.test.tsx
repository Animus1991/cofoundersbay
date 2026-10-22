import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommitmentOutcomes } from './CommitmentOutcomes';
import { listCommitmentCards } from '@/lib/commitments-api';

vi.mock('@/lib/commitments-api', () => ({
  listCommitmentCards: vi.fn(async () => []),
  listCommitmentThreads: vi.fn(async () => []),
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(cleanup);

describe('CommitmentOutcomes', () => {
  it('leads the founder with no cards to write the first one', async () => {
    renderWithQuery(<CommitmentOutcomes />);
    await screen.findByText(/No need cards yet/);
    const link = screen.getByRole('link', { name: /Write your first card/ });
    expect(link.getAttribute('href')).toBe('/commitments/new');
  });

  // docs §70: a failed read is not "no cards".
  it('does not invite a first card when the cards could not be read', async () => {
    vi.mocked(listCommitmentCards).mockRejectedValueOnce(new Error('API down'));
    renderWithQuery(<CommitmentOutcomes />);
    await screen.findByText(/could not be read/);
    expect(screen.queryByRole('link', { name: /Write your first card/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Open Commitments/ }).getAttribute('href')).toBe('/commitments');
  });
});
