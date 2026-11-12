import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { TOUR_REPLAY_EVENT, registerTour, resetTourRegistry } from '@/lib/tour-replay';
import { PageContextualHelp } from './PageContextualHelp';

/**
 * The page help offers the tour again only on a page that has one (docs
 * §122): a button that reaches nothing is a dead control.
 */

vi.mock('@/hooks/usePageMeta', () => ({ usePageMeta: () => null }));

function renderHelp() {
  return render(
    <LanguagePreferenceProvider>
      <PageContextualHelp id="matches" title="Matches" titleEl="Αντιστοιχίσεις" defaultOpen>
        <p>How matching works.</p>
      </PageContextualHelp>
    </LanguagePreferenceProvider>,
  );
}

beforeEach(() => resetTourRegistry());
afterEach(cleanup);

describe('PageContextualHelp and the tour', () => {
  it('shows no replay button on a page without a tour', () => {
    renderHelp();
    expect(screen.getByText('How matching works.')).toBeTruthy();
    expect(screen.queryByTestId('help-replay-tour')).toBeNull();
  });

  it('offers the tour again while one is mounted, and asks for it on press', () => {
    const heard = vi.fn();
    window.addEventListener(TOUR_REPLAY_EVENT, heard);
    let forget = () => {};
    act(() => { forget = registerTour('matches'); });
    renderHelp();
    fireEvent.click(screen.getByTestId('help-replay-tour'));
    expect(heard).toHaveBeenCalledTimes(1);
    act(() => forget());
    expect(screen.queryByTestId('help-replay-tour')).toBeNull();
    window.removeEventListener(TOUR_REPLAY_EVENT, heard);
  });
});
