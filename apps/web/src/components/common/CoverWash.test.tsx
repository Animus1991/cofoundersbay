import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CoverWash } from './CoverWash';

/**
 * The tinted wash behind a catalogue card that has no picture (docs §134):
 * one family colour per tone — never a gradient — with the entity glyph.
 */
afterEach(cleanup);

describe('CoverWash', () => {
  it('tints each semantic family with its own wash', () => {
    const expected: Record<string, string> = {
      success: 'bg-status-success-bg',
      warning: 'bg-status-warning-bg',
      danger: 'bg-status-danger-bg',
      info: 'bg-status-info-bg',
      accent: 'bg-status-accent-bg',
      neutral: 'bg-status-neutral-bg',
    };
    for (const [tone, cls] of Object.entries(expected)) {
      const { container, unmount } = render(<CoverWash tone={tone as never} />);
      expect(container.firstElementChild?.className).toContain(cls);
      unmount();
    }
  });

  it('tints the primary wash for families outside the semantic tones (jobs)', () => {
    const { container } = render(<CoverWash tone="primary" />);
    expect(container.firstElementChild?.className).toContain('bg-primary/10');
  });

  it('lets a caller replace the glyph with a logo or a face', () => {
    const { container } = render(
      <CoverWash tone="primary" glyph="briefcase">
        <span data-logo="">ACME</span>
      </CoverWash>,
    );
    expect(container.querySelector('[data-logo]')?.textContent).toBe('ACME');
    expect(container.querySelector('svg')).toBeNull();
  });
});
