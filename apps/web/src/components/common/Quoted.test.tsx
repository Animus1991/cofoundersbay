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
   * A value in English quotation marks belongs to an English-only sentence,
   * listed here; anything else goes through <Quoted>.
   */
  it('leaves no value in hard-coded English quotation marks', () => {
    const SRC = join(__dirname, '..', '..');
    const ENGLISH_ONLY = new Set([
      'components/common/Quoted.tsx',
      // Untranslated panels, next in line for Greek (docs §163.3).
      'components/builder/BranchPanel.tsx',
      'components/builder/ReviewPanel.tsx',
      'components/research/CanvasVersionPanel.tsx',
    ]);
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
