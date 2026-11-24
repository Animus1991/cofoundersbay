import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusText, statusTone } from './StatusText';

afterEach(cleanup);

// B1.3: the shared status renderer is a tinted pill with a 6px dot and the
// same word — one mark for every place a state used to be a coloured word.
describe('StatusText pill', () => {
  it('renders the same word inside a tinted pill with a dot', () => {
    const { container } = render(<StatusText value="in_progress" />);
    const pill = container.querySelector('[data-status-pill]') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.textContent).toContain('In progress');
    expect(pill.className).toContain('rounded-full');
    expect(pill.className).toContain('bg-status-warning-bg');
    const dot = pill.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.className).toContain('h-1.5');
    expect(dot.className).toContain('rounded-full');
  });

  it('maps common states to their tone', () => {
    expect(statusTone('completed')).toBe('success');
    expect(statusTone('pending')).toBe('warning');
    expect(statusTone('rejected')).toBe('danger');
    expect(statusTone('open')).toBe('info');
    // A word that is not a state — a role, a category — stays quiet.
    expect(statusTone('member')).toBe('neutral');
  });

  it('honours a caller tone override', () => {
    const { container } = render(<StatusText value="open" tone="success" />);
    expect(container.querySelector('[data-status-pill="success"]')).not.toBeNull();
  });
});
