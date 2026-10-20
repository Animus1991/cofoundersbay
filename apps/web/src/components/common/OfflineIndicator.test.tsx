import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { DemoExitInTopBar, DemoSessionBanner } from './OfflineIndicator';

afterEach(() => {
  cleanup();
  document.cookie = 'cfb_preview_demo=; Max-Age=0; path=/';
});

describe('demo exit notice', () => {
  it('does not nest a paragraph inside the screen-reader notice', async () => {
    document.cookie = 'cfb_preview_demo=1; path=/';
    const { container } = render(<DemoSessionBanner />);
    const notice = await waitFor(() => {
      const node = container.querySelector('.sr-only');
      expect(node).toBeTruthy();
      return node!;
    });
    expect(notice.tagName).toBe('DIV');
    expect(notice.querySelector('p')).toBeTruthy();
    expect(notice.querySelector('p p')).toBeNull();
  });

  it('puts Exit in the phone top bar, and the floating copy stands aside there', async () => {
    document.cookie = 'cfb_preview_demo=1; path=/';
    const { container } = render(<><DemoExitInTopBar /><DemoSessionBanner /></>);
    const links = await waitFor(() => {
      const found = container.querySelectorAll('a[href="/register"]');
      expect(found.length).toBe(2);
      return found;
    });
    // The top-bar copy carries the marker the floating copy's rule looks for.
    expect(links[0].hasAttribute('data-topbar-exit')).toBe(true);
    expect(links[1].hasAttribute('data-topbar-exit')).toBe(false);
    expect(links[1].className).toContain('max-sm:[body:has([data-topbar-exit])_&]:hidden');
  });

  it('shows no Exit outside the demo', () => {
    const { container } = render(<DemoExitInTopBar />);
    expect(container.querySelector('a[href="/register"]')).toBeNull();
  });
});
