import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SearchHit } from '@/lib/api';
import { ToastProvider } from '@/components/ui/toast';
import type { MatchConnection } from '@/components/common/MatchCard';
import { FounderPhoneHome } from './FounderPhoneHome';

vi.mock('@/lib/api', () => ({
  listEvents: vi.fn(async () => ({ events: [] })),
  listResearchBoards: vi.fn(async () => ({ boards: [] })),
  sendConnectionRequest: vi.fn(async () => ({})),
}));
vi.mock('@/lib/preview-demo', () => ({ isPreviewDemo: () => false }));

const elena = {
  userId: 'user-elena',
  displayName: 'Elena Papadopoulos',
  headline: 'Founder & CEO at Harbor',
  matchScore: 92,
} as unknown as SearchHit;

function renderHome(state: MatchConnection, onAccept = vi.fn(), excellent = 3) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <FounderPhoneHome
          showResume={false}
          matches={[elena]}
          matchCount={4}
          excellentMatches={excellent}
          connectionOf={() => state}
          onAccept={onAccept}
          activity={[]}
          milestone={null}
          demoEvents={[]}
          showDemoEvents={false}
        />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return onAccept;
}

afterEach(cleanup);

// docs §70: the first match's one action follows where the connection stands,
// as on /matches. It offered Connect to someone whose request was waiting.
describe('FounderPhoneHome, the first match', () => {
  it('offers Accept when their request waits', () => {
    const onAccept = renderHome('received');
    const accept = screen.getByRole('button', { name: /Accept Elena Papadopoulos/ });
    fireEvent.click(accept);
    expect(onAccept).toHaveBeenCalledWith('user-elena', 'Elena Papadopoulos');
    expect(screen.queryByRole('button', { name: /^Connect/ })).toBeNull();
  });

  it('offers Message once connected', () => {
    renderHome('connected');
    expect(screen.getByRole('link', { name: /^Message/ }).getAttribute('href')).toBe('/messages?to=user-elena');
  });

  it('says a sent request rather than offering it again', () => {
    renderHome('sent');
    const sent = screen.getByRole('button', { name: /Request sent/ }) as HTMLButtonElement;
    expect(sent.disabled).toBe(true);
  });

  it('leaves out an excellent count of zero', () => {
    renderHome('none', vi.fn(), 0);
    expect(screen.getByText('4 suggestions')).toBeTruthy();
    expect(screen.queryByText(/excellent/)).toBeNull();
  });

  it('carries the matches figure and the way to the list', () => {
    renderHome('none');
    expect(screen.getByText(/4 suggestions · 3 excellent \(80%\+\)/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /View all/ }).getAttribute('href')).toBe('/matches');
    expect(screen.getByRole('button', { name: /^Connect/ })).toBeTruthy();
  });
});
