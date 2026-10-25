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

import { Textarea } from './textarea';
import { isAriaInvalid } from './input';

describe('aria-invalid interpretation', () => {
  it('treats false and "false" as valid, true and "true" as invalid', () => {
    expect(isAriaInvalid(false)).toBe(false);
    expect(isAriaInvalid('false')).toBe(false);
    expect(isAriaInvalid(undefined)).toBe(false);
    expect(isAriaInvalid(true)).toBe(true);
    expect(isAriaInvalid('true')).toBe(true);
    expect(isAriaInvalid('spelling')).toBe(true);
  });
  it('applies to Input and Textarea, with the invalid prop authoritative', () => {
    const { container } = render(
      <>
        <Input aria-label="a" aria-invalid="false" />
        <Textarea aria-label="b" aria-invalid="false" />
        <Input aria-label="c" aria-invalid="true" />
        <Textarea aria-label="d" aria-invalid />
        <Input aria-label="e" invalid aria-invalid="false" />
        <Textarea aria-label="f" invalid={false} aria-invalid="true" />
      </>,
    );
    const attr = (l: string) => container.querySelector(`[aria-label="${l}"]`)?.getAttribute('aria-invalid');
    expect(attr('a')).toBeNull();
    expect(attr('b')).toBeNull();
    expect(attr('c')).toBe('true');
    expect(attr('d')).toBe('true');
    expect(attr('e')).toBe('true');
    expect(attr('f')).toBeNull();
  });
});
