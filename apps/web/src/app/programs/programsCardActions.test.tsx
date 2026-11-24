import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';
import type { ProgramItem } from '@/lib/api';
import ProgramsPage from './page';

/**
 * The catalogue anatomy on /programs (docs §134): Apply where the programme
 * is open, View details where it is not — and the other way in sits on the
 * card's menu so the card never loses a way it had.
 */

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    listPrograms: vi.fn(),
    getMyPrograms: vi.fn(async () => ({ programs: [] })),
    applyToProgram: vi.fn(),
  };
});
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask: vi.fn(), hrefFor: () => '/ai' }) }));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/programs',
  useSearchParams: () => new URLSearchParams(''),
}));

const { listPrograms } = await import('@/lib/api');

const program: ProgramItem = {
  id: 'p-1',
  slug: 'spring-cohort',
  title: 'Spring Cohort',
  description: 'A six-week accelerator.',
  programType: 'accelerator',
  status: 'upcoming',
  startDate: '2099-03-01',
  endDate: null,
  applicationDeadline: '2099-01-15',
  capacity: 20,
  isRemote: true,
  location: null,
  industries: ['Fintech'],
  benefits: [],
  requirements: null,
  curriculum: null,
  settings: null,
  applicationCount: 5,
  participantCount: 3,
  coverImageUrl: null,
  organization: { id: 'o-1', name: 'Harbor', slug: 'harbor', logoUrl: null, organizationType: 'incubator' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <ProgramsPage />
      </ToastProvider>
    </QueryClientProvider>,
  );

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
});

describe('/programs card action set', () => {
  it('open programme: Apply Now is the one verb; View details stays in the menu', async () => {
    vi.mocked(listPrograms).mockResolvedValue({ programs: [program], total: 1 });
    mount();
    const apply = await screen.findByRole('button', { name: /Apply Now/ });
    const trigger = screen.getByRole('button', { name: /More actions/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /View details/ }).getAttribute('href')).toBe('/programs/p-1');
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(apply);
    // The same apply dialog the button always opened.
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('closed programme: View details is the button; nothing was lost from the card', async () => {
    vi.mocked(listPrograms).mockResolvedValue({ programs: [{ ...program, status: 'completed', applicationDeadline: '2020-01-01' }], total: 1 });
    mount();
    const details = await screen.findByRole('link', { name: /View details/ });
    expect(details.getAttribute('href')).toBe('/programs/p-1');
    expect(screen.queryByRole('button', { name: /Apply Now/ })).toBeNull();
    expect(screen.getByText('Not taking applications')).toBeTruthy();
  });
});
