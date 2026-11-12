import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { AssistantWorking } from './AssistantWorking';

/** The wait names its stage and measures it (docs §122). */
describe('AssistantWorking', () => {
  afterEach(cleanup);

  it('starts on the first stage before the engine has said anything', () => {
    render(<LanguagePreferenceProvider><AssistantWorking phase={null} /></LanguagePreferenceProvider>);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('15');
    expect(bar.getAttribute('data-assistant-phase')).toBe('planning');
    expect(screen.getByText('Reading your question')).toBeTruthy();
    expect(bar.getAttribute('aria-valuetext')).toContain('Ανάγνωση της ερώτησής σας');
  });

  it('names the read in both languages with its place in the turn', () => {
    render(
      <LanguagePreferenceProvider>
        <AssistantWorking phase={{ kind: 'reading', tool: 'get_milestones', index: 2, total: 3 }} />
      </LanguagePreferenceProvider>,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('55');
    expect(bar.getAttribute('aria-valuetext')).toContain('Reading your milestones (2/3)');
    expect(bar.getAttribute('aria-valuetext')).toContain('Ανάγνωση των ορόσημών σου (2/3)');
    expect(screen.getByText('Reading your milestones (2/3)')).toBeTruthy();
  });

  it('says it is writing once the reads are done', () => {
    render(<LanguagePreferenceProvider><AssistantWorking phase={{ kind: 'writing' }} /></LanguagePreferenceProvider>);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('80');
    expect(screen.getByText('Writing the answer')).toBeTruthy();
  });
});
