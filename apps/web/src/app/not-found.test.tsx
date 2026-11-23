import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import NotFound from './not-found';

afterEach(cleanup);

describe('the 404 page', () => {
  it('offers Home as the primary and Discover as the quiet secondary', () => {
    render(<NotFound />);
    const home = screen.getByRole('link', { name: /Back to home|Στην αρχική/ });
    expect(home.getAttribute('href')).toBe('/');
    const discover = screen.getByRole('link', { name: /Discover people|Εξερεύνηση ανθρώπων/ });
    expect(discover.getAttribute('href')).toBe('/discover');
  });

  it('suggests the page a near miss was aiming at', async () => {
    window.history.pushState({}, '', '/matchess');
    render(<NotFound />);
    const link = await screen.findByRole('link', { name: /Matches|Αντιστοιχίσεις/ });
    expect(link.getAttribute('href')).toBe('/matches');
    window.history.pushState({}, '', '/');
  });
});
