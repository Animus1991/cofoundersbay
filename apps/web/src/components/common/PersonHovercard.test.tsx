import { afterEach, describe, expect, it, vi } from 'vitest';
import Link from 'next/link';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersonHovercard } from './PersonHovercard';

const getPublicProfile = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getPublicProfile: (...args: unknown[]) => getPublicProfile(...args),
}));

afterEach(() => {
  cleanup();
  getPublicProfile.mockReset();
});

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PersonHovercard userId="user-marcus"><Link href="/profiles/user-marcus">Marcus Chen</Link></PersonHovercard>
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
});
