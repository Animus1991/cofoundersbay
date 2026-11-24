import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EventCard, type EventData } from './EventCard';

afterEach(cleanup);

const event: EventData = {
  id: 'ev1',
  title: 'Demo Day',
  description: 'Pitches.',
  type: 'in-person',
  startDate: new Date(2026, 9, 21, 18, 30),
  endDate: new Date(2026, 9, 21, 20, 30),
  location: 'Athens',
  hostName: 'Maria Papadopoulou',
  hostRole: 'organiser',
  attendeesCount: 12,
};

describe('EventCard default variant', () => {
  it('carries the full date as screen-reader text on the cover badge', () => {
    const { container } = render(<EventCard event={event} />);
    const badge = container.querySelector('[data-card-mark]');
    expect(badge).not.toBeNull();
    const sr = badge?.querySelector('.sr-only');
    expect(sr?.textContent ?? '').toContain('2026');
    expect(sr?.textContent ?? '').toContain('21');
    // The visual square stays: day number and month are aria-hidden.
    expect(badge?.querySelector('[aria-hidden="true"]')?.textContent).toContain('21');
    // No aria-label on the generic wrapper (docs §130.3 review).
    expect(badge?.getAttribute('aria-label')).toBeNull();
  });

  it('names the attendee count for a screen reader, not a bare number', () => {
    const { container } = render(<EventCard event={event} />);
    const labels = [...container.querySelectorAll('.sr-only')].map((el) => el.textContent ?? '');
    expect(labels.some((t) => /12 (attending|συμμετέχουν)/.test(t))).toBe(true);
  });
});
