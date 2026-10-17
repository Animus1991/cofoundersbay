import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { DemoSessionBanner } from './OfflineIndicator';

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
});
