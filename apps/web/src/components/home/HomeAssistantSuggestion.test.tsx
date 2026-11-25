import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listEvents } from '@/lib/api';
import { SUGGESTION_STORAGE_KEY } from '@/lib/home-suggestion';
import { HomeAssistantSuggestion } from './HomeAssistantSuggestion';

const ask = vi.fn();
vi.mock('@/lib/api', () => ({ listEvents: vi.fn() }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask }) }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));

/**
 * The card around the choice (docs §142): the yes asks the assistant in
 * place, "Not now" puts the offer away for a week and shows the next one.
 */
beforeEach(() => {
  localStorage.clear();
  vi.mocked(listEvents).mockResolvedValue({ events: [] });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HomeAssistantSuggestion
        people={[{ userId: 'u9', displayName: 'Sofia Alexiou' }]}
        shownAbove={new Set()}
        connectionOf={() => 'none'}
      />
    </QueryClientProvider>,
  );
}

describe('HomeAssistantSuggestion', () => {
  it('asks the assistant on yes, and the offer does not come back', async () => {
    mount();
    expect(await screen.findByText(/Sofia Alexiou also fits/)).toBeTruthy();
    fireEvent.click(screen.getByTestId('home-suggestion-yes'));
    expect(ask).toHaveBeenCalledWith(expect.objectContaining({ en: expect.stringContaining('Sofia Alexiou') }));
    expect(JSON.parse(localStorage.getItem(SUGGESTION_STORAGE_KEY)!)).toHaveProperty('person:u9');
  });

  it('puts one away for a week on "Not now" and offers the next', async () => {
    mount();
    await screen.findByText(/Sofia Alexiou also fits/);
    fireEvent.click(screen.getByTestId('home-suggestion-later'));
    expect(await screen.findByText(/prepare your week/)).toBeTruthy();
    expect(ask).not.toHaveBeenCalled();
    cleanup();
    mount();
    expect(await screen.findByText(/prepare your week/)).toBeTruthy();
  });
});
