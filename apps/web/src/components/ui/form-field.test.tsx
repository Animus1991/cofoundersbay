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
    expect(screen.getByRole('alert').textContent).toContain('Enter a valid email');
    expect(screen.getByRole('alert').querySelector('.sr-only')?.textContent).toContain('Error:');
    expect(screen.queryByText('We never share this')).toBeNull();
  });

  it('keeps an existing control description alongside a hint or validation error', () => {
    const { rerender } = render(
      <FormField htmlFor="name" label="Name" hint="Visible to collaborators">
        <input aria-describedby="privacy-note" />
      </FormField>,
    );
    expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe('privacy-note name-hint');
    rerender(
      <FormField htmlFor="name" label="Name" hint="Visible to collaborators" error="Enter a name">
        <input aria-describedby="privacy-note" />
      </FormField>,
    );
    expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe('privacy-note name-error');
  });
});

import { render as renderClarity, screen as clarityScreen } from '@testing-library/react';
import { it as clarityIt, expect as clarityExpect } from 'vitest';
import { FormField as ClarityField } from './form-field';
import { Textarea as ClarityTextarea } from './textarea';

clarityIt('keeps error text announced and fields distinguishable when invalid', () => {
  renderClarity(
    <ClarityField label="Title" htmlFor="t" error="Add a title">
      <ClarityTextarea />
    </ClarityField>,
  );
  const field = clarityScreen.getByRole('textbox');
  clarityExpect(field.getAttribute('aria-invalid')).toBe('true');
  clarityExpect(field.className).toContain('border-destructive');
  clarityExpect(field.className).not.toContain('placeholder:text-muted-foreground/70');
  clarityExpect(clarityScreen.getByRole('alert').textContent).toContain('Add a title');
});
