import { afterEach, describe, expect, it, vi } from 'vitest';
import Link from 'next/link';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersonHovercard } from './PersonHovercard';
import { ToastProvider } from '@/components/ui/toast';

const getPublicProfile = vi.fn();
const getConnectionStatus = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getPublicProfile: (...args: unknown[]) => getPublicProfile(...args),
  getConnectionStatus: (...args: unknown[]) => getConnectionStatus(...args),
}));
const storedUser = vi.hoisted(() => ({ current: null as { id: string } | null }));
vi.mock('@/hooks/useStoredUser', () => ({ useStoredUser: () => storedUser.current }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  getPublicProfile.mockReset();
  getConnectionStatus.mockReset();
  storedUser.current = null;
});

const MARCUS = {
  userId: 'user-marcus', displayName: 'Marcus Chen', headline: 'Technical cofounder · Full-stack', role: 'founder',
  location: 'Berlin, Germany', avatarUrl: null, skills: [], createdAt: '2025-03-02T00:00:00Z',
};

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <PersonHovercard userId="user-marcus"><Link href="/profiles/user-marcus">Marcus Chen</Link></PersonHovercard>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('PersonHovercard', () => {
  it('reads nobody until it opens', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'Marcus Chen' })).toBeTruthy();
    expect(getPublicProfile).not.toHaveBeenCalled();
  });

  it('shows who the person is on keyboard focus, read once from the profile', async () => {
    getPublicProfile.mockResolvedValue({
      userId: 'user-marcus', displayName: 'Marcus Chen', headline: 'Technical cofounder · Full-stack', role: 'founder',
      location: 'Berlin, Germany', avatarUrl: null, skills: [{ skillId: '1', skillName: 'TypeScript', level: null }], createdAt: '2025-03-02T00:00:00Z',
    });
    renderCard();
    await act(async () => { fireEvent.focus(screen.getByRole('link', { name: 'Marcus Chen' })); });
    await waitFor(() => expect(screen.getAllByText(/Technical cofounder/).length).toBeGreaterThan(0));
    expect(getPublicProfile).toHaveBeenCalledWith('user-marcus');
    expect(screen.getAllByText(/Berlin, Germany/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TypeScript/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Member since March 2025/).length).toBeGreaterThan(0);
  });

  it('says when they joined with the Greek month in the accusative', async () => {
    localStorage.setItem('cfb:language-display', 'bilingual');
    getPublicProfile.mockResolvedValue({ userId: 'u', displayName: 'Μαρία', headline: null, role: 'founder', location: null, avatarUrl: null, skills: [], createdAt: '2026-02-10T00:00:00Z' });
    renderCard();
    await act(async () => { fireEvent.focus(screen.getByRole('link', { name: 'Marcus Chen' })); });
    await waitFor(() => expect(screen.getAllByText(/τον Φεβρουάριο του 2026/).length).toBeGreaterThan(0));
    localStorage.clear();
  });

  it('offers Message and Connect to someone else, after reading where the connection stands (docs §111)', async () => {
    storedUser.current = { id: 'me' };
    getPublicProfile.mockResolvedValue(MARCUS);
    getConnectionStatus.mockResolvedValue({ status: null, connectionId: null, direction: null });
    renderCard();
    await act(async () => { fireEvent.focus(screen.getByRole('link', { name: 'Marcus Chen' })); });
    await waitFor(() => expect(screen.getByRole('button', { name: /Message Marcus Chen/ })).toBeTruthy());
    expect(screen.getByRole('button', { name: /Connect with Marcus Chen/ })).toBeTruthy();
    expect(getConnectionStatus).toHaveBeenCalledWith('user-marcus');
  });

  it('says "Connected" instead of offering Connect again', async () => {
    storedUser.current = { id: 'me' };
    getPublicProfile.mockResolvedValue(MARCUS);
    getConnectionStatus.mockResolvedValue({ status: 'accepted', connectionId: 'c1', direction: 'sent' });
    renderCard();
    await act(async () => { fireEvent.focus(screen.getByRole('link', { name: 'Marcus Chen' })); });
    await waitFor(() => expect(screen.getAllByText(/Connected/).length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: /Connect with/ })).toBeNull();
  });

  it("offers no actions on one's own card, nor to a visitor", async () => {
    storedUser.current = { id: 'user-marcus' };
    getPublicProfile.mockResolvedValue(MARCUS);
    const { unmount } = renderCard();
    await act(async () => { fireEvent.focus(screen.getByRole('link', { name: 'Marcus Chen' })); });
    await waitFor(() => expect(screen.getAllByText(/Technical cofounder/).length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: /Message/ })).toBeNull();
    expect(getConnectionStatus).not.toHaveBeenCalled();
    unmount();
    storedUser.current = null;
    renderCard();
    await act(async () => { fireEvent.focus(screen.getByRole('link', { name: 'Marcus Chen' })); });
    await waitFor(() => expect(screen.getAllByText(/Technical cofounder/).length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: /Message/ })).toBeNull();
  });
});
