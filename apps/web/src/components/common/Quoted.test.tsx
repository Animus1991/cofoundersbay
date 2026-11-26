import { describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { Quoted } from './Quoted';

describe('Quoted (§162)', () => {
  it('puts a member’s words in the quotation marks of the reader’s language', async () => {
    const english = render(<p><Quoted>Hello</Quoted></p>);
    expect(english.container.textContent).toBe('“Hello”');
    english.unmount();

    localStorage.setItem('cfb_locale', 'el');
    const greek = render(<LanguagePreferenceProvider><p><Quoted>Γεια σας</Quoted></p></LanguagePreferenceProvider>);
    await waitFor(() => expect(greek.container.textContent).toBe('«Γεια σας»'));
  });
});
