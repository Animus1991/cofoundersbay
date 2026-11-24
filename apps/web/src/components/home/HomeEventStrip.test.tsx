import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeEventStrip } from './HomeEventStrip';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import type { EventItem } from '@/lib/api';

const state = vi.hoisted(() => ({ events: undefined as { events: EventItem[] } | undefined, loading: false }));

vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: state.events, isLoading: state.loading }) }));
vi.mock('next/link', () => ({
  default: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a {...props} href={href} />,
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));

const event = (id: string): EventItem => ({
  id,
  title: `Demo day ${id}`,
  description: '',
  eventType: 'demo_day',
  mode: 'in-person',
  startAt: '2030-06-01T18:00:00.000Z',
  endAt: '2030-06-01T20:00:00.000Z',
  timezone: null,
  location: 'Athens',
  isOnline: false,
  meetingUrl: null,
  capacity: null,
  coverImageUrl: null,
  attendeesCount: 0,
  host: { id: 'u1', displayName: 'Host', avatarUrl: null, role: 'organizer' },
  viewerRsvp: null,
});

function Strip() {
  return <LanguagePreferenceProvider><HomeEventStrip /></LanguagePreferenceProvider>;
}

beforeEach(() => {
  state.events = undefined;
  state.loading = false;
});
afterEach(cleanup);

describe('HomeEventStrip (docs §131.2)', () => {
  it('renders nothing while loading or when no events are on', () => {
    state.loading = true;
    const { container, rerender } = render(<Strip />);
    expect(container.firstChild).toBeNull();
    state.loading = false;
    state.events = { events: [] };
    rerender(<Strip />);
    expect(container.firstChild).toBeNull();
  });

  it('links each cover to its event and offers all of them', () => {
    state.events = { events: [event('ev-1'), event('ev-2')] };
    render(<Strip />);
    const links = screen.getAllByRole('link');
    expect(links.some((a) => a.getAttribute('href') === '/events/ev-1')).toBe(true);
    expect(links.some((a) => a.getAttribute('href') === '/events/ev-2')).toBe(true);
    expect(links.some((a) => a.getAttribute('href') === '/events')).toBe(true);
  });

  it('keeps the covers a fixed size in a snap-scrolling rail (docs §133.3)', () => {
    state.events = { events: [event('ev-1')] };
    const { container } = render(<Strip />);
    const rail = container.querySelector('[data-home-events]')!;
    expect(rail.className).toContain('overflow-x-auto');
    expect(rail.className).toContain('snap-x');
    expect(rail.getAttribute('aria-label')).toBe('Events for you');
    const card = screen.getByRole('link', { name: /Demo day ev-1/ });
    expect(card.className).toContain('w-40');
    expect(card.className).toContain('shrink-0');
    expect(card.querySelector('p')!.className).toContain('line-clamp-2');
  });
});
