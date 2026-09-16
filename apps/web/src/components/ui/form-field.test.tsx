import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FormField } from './form-field';

afterEach(cleanup);

describe('FormField self-explanation', () => {
  it('wires label, hint, and invalid state onto the control without dropping the field', () => {
    render(
      <FormField htmlFor="startup-name" label="Startup name" hint="Shown on your public profile" required>
        <input />
      </FormField>,
    );
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('id')).toBe('startup-name');
    expect(input.getAttribute('aria-describedby')).toBe('startup-name-hint');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(screen.getByText('Shown on your public profile')).toBeTruthy();
  });

  it('replaces the hint with an alert when the field is invalid', () => {
    render(
      <FormField htmlFor="email" label="Email" hint="We never share this" error="Enter a valid email">
        <input />
      </FormField>,
    );
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
    expect(screen.getByRole('alert').textContent).toBe('Enter a valid email');
    expect(screen.queryByText('We never share this')).toBeNull();
  });
});
