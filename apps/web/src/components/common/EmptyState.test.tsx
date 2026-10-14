import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

afterEach(cleanup);

describe('calm, actionable empty states', () => {
  it('states the next step on the left, without a decorative drawing', () => {
    const action = vi.fn();
    const { container } = render(<EmptyState illustration="search" title="No results / Δεν υπάρχουν αποτελέσματα" description="Change the filters to broaden your search." action={<button onClick={action}>Reset filters</button>} />);
    expect(screen.getByText('No results / Δεν υπάρχουν αποτελέσματα')).toBeTruthy();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.firstElementChild?.className).toContain('text-left');
    expect(container.innerHTML).not.toMatch(/animate-(float|pulse|spin|bounce)/);
    expect(screen.getByText('Change the filters to broaden your search.').className).toContain('max-w-prose');
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(action).toHaveBeenCalledOnce();
  });

  it('keeps all sizes, custom styling, and optional content', () => {
    const { container } = render(<EmptyState title="Ready" size="sm" className="custom-empty" />);
    expect(container.firstElementChild?.className).toContain('custom-empty');
    expect(container.firstElementChild?.className).toContain('p-4');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
