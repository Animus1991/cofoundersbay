import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { getPublicRoom } from '@/lib/fundraising-api';
import PublicRoomPage from './page';

vi.mock('next/navigation', () => ({ useParams: () => ({ token: 'tok' }) }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('@/components/brand/Logo', () => ({ Logo: () => <span /> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/layout/AppShell', () => ({ MainLandmark: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/lib/i18n/LanguagePreferenceContext', () => ({ useLanguagePreference: () => ({ primary: 'en' }) }));
vi.mock('@/lib/fundraising-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/fundraising-api')>()),
  getPublicRoom: vi.fn(),
}));

afterEach(cleanup);

const mount = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><PublicRoomPage /></QueryClientProvider>,
);

describe('a data room link, opened without an account', () => {
  it('lists the files with a way to download each', async () => {
    vi.mocked(getPublicRoom).mockResolvedValue({
      roundName: 'Seed', founderName: 'Alex', expiresAt: '2099-01-01T00:00:00Z',
      documents: [{ id: 'd1', name: 'Deck', category: 'pitch', fileName: 'deck.pdf', fileSizeBytes: 10 }],
    });
    mount();
    expect(await screen.findByText('Deck')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Seed' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download' }).getAttribute('href')).toContain('/api/public/data-room/tok/documents/d1/file');
  });

  it('says it does not open when the server says no, and gives nothing away', async () => {
    vi.mocked(getPublicRoom).mockRejectedValue(new ApiError(404, 'Link not found'));
    mount();
    expect(await screen.findByText('This link does not open')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('does not call a live link dead when the server is down', async () => {
    vi.mocked(getPublicRoom).mockRejectedValue(new Error('Unable to reach the API server.'));
    mount();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryByText('This link does not open')).toBeNull();
  });
});
