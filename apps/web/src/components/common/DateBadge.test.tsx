import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DateBadge } from './DateBadge';

/**
 * The corner date mark on the catalogue cards (docs §134): a sighted reader
 * gets day + short month; a screen reader gets the full date in words.
 */
afterEach(cleanup);

describe('DateBadge', () => {
  it('carries the full date in an sr-only line next to the day/month mark', () => {
    const { container } = render(<DateBadge date="2026-06-15T10:00:00Z" />);
    const hidden = container.querySelector('.sr-only');
    expect(hidden).not.toBeNull();
    // en-GB default locale: "Monday 15 June 2026" — the day, the year and a
    // month name, none of them numbers the sighted mark already shows alone.
    expect(hidden?.textContent).toContain('15');
    expect(hidden?.textContent).toContain('2026');
    expect(hidden?.textContent).toMatch(/June|Ιουνίου/);
  });

  it('keeps the day and short month on the visible square, aria-hidden', () => {
    const { container } = render(<DateBadge date="2026-06-15T10:00:00Z" />);
    const square = container.querySelector('[data-card-mark] > div');
    expect(square?.textContent).toContain('15');
    for (const span of square?.querySelectorAll('span') ?? []) {
      expect(span.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
