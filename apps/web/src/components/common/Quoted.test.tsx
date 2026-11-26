import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
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

  /*
   * Notes, endorsements, insights and reasons were printed between “ and ”
   * typed into the markup, around Greek text for a Greek reader (§162, §163).
   * Inside a sentence written per language, each language's string carries
   * its own marks; anything else goes through <Quoted>.
   */
  it('leaves no value in hard-coded English quotation marks', () => {
    const SRC = join(__dirname, '..', '..');
    const ENGLISH_ONLY = new Set(['components/common/Quoted.tsx']);
    const files = (dir: string, out: string[] = []): string[] => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) files(path, out);
        else if (name.endsWith('.tsx') && !name.includes('.test.')) out.push(path);
      }
      return out;
    };
    const offenders = files(SRC)
      .map((file) => relative(SRC, file).replace(/\\/g, '/'))
      .filter((rel) => !ENGLISH_ONLY.has(rel))
      .filter((rel) => /(?:“|&ldquo;)\{[^{}]+\}(?:”|&rdquo;)/.test(readFileSync(join(SRC, rel), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
