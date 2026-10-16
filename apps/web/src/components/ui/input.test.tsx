import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Input, marksSearchField } from './input';

afterEach(cleanup);

describe('search field focus', () => {
  it('marks a search bar and leaves other fields unmarked', () => {
    expect(marksSearchField('search', undefined, undefined)).toBe(true);
    expect(marksSearchField('text', 'Search programs', 'Αναζήτηση προγραμμάτων')).toBe(true);
    expect(marksSearchField('text', 'Αναζήτηση κοινοτήτων', undefined)).toBe(true);
    expect(marksSearchField('text', 'Email', 'you@example.com')).toBe(false);
    expect(marksSearchField('text', 'Research notes', undefined)).toBe(false);

    const { rerender, container } = render(<Input aria-label="Search the platform" placeholder="Search" />);
    expect(container.querySelector('input')?.hasAttribute('data-search-field')).toBe(true);
    rerender(<Input aria-label="Email" type="email" />);
    expect(container.querySelector('input')?.hasAttribute('data-search-field')).toBe(false);
  });
});
