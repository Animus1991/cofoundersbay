import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';
import type { JobPostingView } from '@/lib/api';
import JobsPage from './page';

/**
 * The catalogue anatomy on /jobs (docs §134): one verb on the card — asking
 * the poster, or the assistant's draft when there is no poster — and every
 * other thing the card used to do lives in its menu.
 */

const { askSpy } = vi.hoisted(() => ({ askSpy: vi.fn() }));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, listJobs: vi.fn(), createJobPosting: vi.fn() };
});
vi.mock('@/lib/saved-items-api', () => ({
  listSavedItems: vi.fn(async () => []),
  saveItem: vi.fn(),
  unsaveItem: vi.fn(),
}));
vi.mock('@/hooks/useStoredUser', () => ({ useStoredUser: () => ({ id: 'viewer-9', displayName: 'Viewer' }) }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask: askSpy, hrefFor: () => '/ai' }) }));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/jobs',
  useSearchParams: () => new URLSearchParams(''),
}));

const { listJobs } = await import('@/lib/api');

const job: JobPostingView = {
  id: 'j-1',
  title: 'Growth lead',
  role: 'Growth',
  location: 'Athens',
  logoUrl: null,
  isRemote: false,
  type: 'full-time',
  creator: { id: 'u-2', displayName: 'Nina Pap', avatarUrl: null },
};

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <JobsPage />
      </ToastProvider>
    </QueryClientProvider>,
  );

async function openMenu(named: RegExp) {
  const trigger = screen.getByRole('button', { name: named });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return screen.findByRole('menu');
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
  cleanup();
  askSpy.mockReset();
});

describe('/jobs card action set', () => {
  it('with a poster: Ask about the role is the one verb; the poster and the draft are in the menu', async () => {
    vi.mocked(listJobs).mockResolvedValue({ jobs: [job] });
    mount();
    const link = await screen.findByRole('link', { name: /Ask about the role/ });
    expect(link.getAttribute('href')).toContain('/messages?to=u-2');
    // Saving stays a mark beside it; no second verb button on the card.
    expect(screen.queryByRole('button', { name: /Draft application|View poster/ })).toBeNull();
    const menu = await openMenu(/More actions/);
    expect(within(menu).getByRole('menuitem', { name: /View poster/ }).getAttribute('href')).toBe('/profiles/u-2');
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Draft application/ }));
    expect(askSpy).toHaveBeenCalled();
  });

  it('without a poster: the draft becomes the button and the menu keeps nothing else', async () => {
    vi.mocked(listJobs).mockResolvedValue({ jobs: [{ ...job, creator: { id: undefined, displayName: 'Nina Pap', avatarUrl: null } }] });
    mount();
    const draft = await screen.findByRole('button', { name: /Draft application/ });
    expect(screen.queryByRole('link', { name: /Ask about the role/ })).toBeNull();
    fireEvent.click(draft);
    await waitFor(() => expect(askSpy).toHaveBeenCalled());
  });
});
