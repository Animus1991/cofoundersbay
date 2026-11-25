import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listEvents, type EventItem } from '@/lib/api';
import EventsPage from './page';

vi.mock('@/lib/api', () => ({ listEvents: vi.fn(), rsvpEvent: vi.fn() }));
// The rail's sections render as the open panel would, so the When filter is
// found where the reader finds it.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children, rail }: { children: React.ReactNode; rail?: { id: string; labelEn: string; content: React.ReactNode }[] }) => (
    <main>
      {children}
      {rail?.map((section) => <section key={section.id} aria-label={section.labelEn}>{section.content}</section>)}
    </main>
  ),
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('@/hooks/useIsAuthenticated', () => ({ useIsAuthenticated: () => true }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/events',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@/components/events/EventCard', () => ({
  EventCard: ({ event }: { event: { title: string } }) => <article data-event>{event.title}</article>,
  EventCardSkeleton: () => <div />,
}));

/**
 * Plain words on /events (docs §142): Enter reads the format, the kind and
 * when out of the field, the list narrows to them, a strip says what was
 * read, and one button puts the words back as typed.
 */
// Wednesday 25 November 2026, 10:00.
const NOW = new Date(2026, 10, 25, 10, 0);
const at = (day: number, hour = 18) => new Date(2026, 10, day, hour).toISOString();
const event = (id: string, title: string, eventType: EventItem['eventType'], mode: EventItem['mode'], startAt: string): EventItem => ({
  id, title, description: '', eventType, mode, startAt, endAt: startAt, timezone: null, location: null, isOnline: mode === 'online',
  meetingUrl: null, capacity: null, coverImageUrl: null, attendeesCount: 0,
  host: { id: 'h', displayName: 'Host', avatarUrl: null, role: 'founder' }, viewerRsvp: null,
});
const ALL = [
  event('e1', 'Pricing clinic', 'workshop', 'online', at(26)),
  event('e2', 'Hands-on design sprint', 'workshop', 'in-person', at(27)),
  event('e3', 'Founders coffee', 'meetup', 'online', at(27)),
  event('e4', 'Growth lab', 'workshop', 'online', at(32)),
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.mocked(listEvents).mockImplementation(async (params) => ({
    events: ALL.filter((e) => !params?.mode || e.mode === params.mode).filter((e) => !params?.q || e.title.toLowerCase().includes(params.q.toLowerCase())),
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><EventsPage /></QueryClientProvider>);
}
// The grid shows the first event twice (the featured card and its row), so titles are counted once.
const titles = () => [...new Set(screen.queryAllByText(/./, { selector: '[data-event]' }).map((n) => n.textContent))];

describe('events in plain words', () => {
  it('reads format, kind and when on Enter, narrows the list and can put the words back', async () => {
    mount();
    await waitFor(() => expect(titles()).toHaveLength(4));
    const field = screen.getByTestId('events-search') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'online workshops this week' } });
    fireEvent.submit(field.closest('form')!);

    const strip = await screen.findByTestId('events-read-as');
    expect(within(strip).getByText('Online')).toBeTruthy();
    expect(within(strip).getByText('Workshops')).toBeTruthy();
    expect(within(strip).getByText('This week')).toBeTruthy();
    expect(field.value).toBe('');
    await waitFor(() => expect(titles()).toEqual(['Pricing clinic']));
    expect(vi.mocked(listEvents)).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'online' }));

    // A second sentence replaces what the first one read: the kind goes.
    fireEvent.change(field, { target: { value: 'online next week' } });
    fireEvent.submit(field.closest('form')!);
    await waitFor(() => expect(titles()).toEqual(['Growth lab']));
    const second = screen.getByTestId('events-read-as');
    expect(within(second).queryByText('Workshops')).toBeNull();

    fireEvent.click(within(second).getByRole('button', { name: 'Search the words as typed' }));
    expect(field.value).toBe('online next week');
    expect(screen.queryByTestId('events-read-as')).toBeNull();
  });

  it('offers the same window in the Filters panel', async () => {
    mount();
    await waitFor(() => expect(titles()).toHaveLength(4));
    const panel = screen.getByRole('region', { name: 'Filters' });
    fireEvent.click(within(panel).getByRole('button', { name: /Next week/ }));
    await waitFor(() => expect(titles()).toEqual(['Growth lab']));
  });

  it('leaves a plain title alone: Enter reads nothing and the search stays', async () => {
    mount();
    await waitFor(() => expect(titles()).toHaveLength(4));
    const field = screen.getByTestId('events-search') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'Pricing' } });
    fireEvent.submit(field.closest('form')!);
    expect(screen.queryByTestId('events-read-as')).toBeNull();
    expect(field.value).toBe('Pricing');
    await waitFor(() => expect(titles()).toEqual(['Pricing clinic']));
  });
});
