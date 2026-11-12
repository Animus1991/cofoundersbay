import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirstRunTour, type TourStep } from './FirstRunTour';

/**
 * The tour's dots are a way to a step, not only a count (docs §122): a reader
 * who skipped ahead can come back to the one they want without pressing Back
 * three times. Completion is still remembered per user once the last step is
 * acknowledged.
 */

vi.mock('@/hooks/useAuthenticatedSession', () => ({
  useAuthenticatedSession: () => ({ isAuthenticated: true, isChecking: false, user: { id: 'u-1' } }),
}));
vi.mock('@/lib/analytics', () => ({ analytics: { track: vi.fn().mockResolvedValue(undefined) } }));

const STEPS: TourStep[] = [
  { target: 'one', titleEn: 'First', titleEl: 'Πρώτο', bodyEn: 'Body one', bodyEl: 'Σώμα ένα' },
  { target: 'two', titleEn: 'Second', titleEl: 'Δεύτερο', bodyEn: 'Body two', bodyEl: 'Σώμα δύο' },
  { target: 'three', titleEn: 'Third', titleEl: 'Τρίτο', bodyEn: 'Body three', bodyEl: 'Σώμα τρία' },
];

beforeEach(() => {
  window.localStorage.clear();
  // jsdom has no layout: the spotlight scrolls its target into view.
  Element.prototype.scrollIntoView = vi.fn();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderTour() {
  render(
    <div>
      <div data-tour="one">A</div>
      <div data-tour="two">B</div>
      <div data-tour="three">C</div>
      <FirstRunTour tourId="t" steps={STEPS} />
    </div>,
  );
  act(() => { vi.runAllTimers(); });
}

describe('FirstRunTour dots', () => {
  it('jump to the chosen step and mark the current one', () => {
    renderTour();
    const dialog = screen.getByTestId('first-run-tour-step');
    expect(dialog.textContent).toContain('First');
    const third = screen.getByTestId('first-run-tour-dot-3');
    expect(third.getAttribute('aria-label')).toContain('Step 3 of 3');
    fireEvent.click(third);
    expect(screen.getByTestId('first-run-tour-step').textContent).toContain('Third');
    expect(screen.getByTestId('first-run-tour-dot-3').getAttribute('aria-current')).toBe('step');
    expect(screen.getByTestId('first-run-tour-dot-1').getAttribute('aria-current')).toBeNull();
    fireEvent.click(screen.getByTestId('first-run-tour-dot-2'));
    expect(screen.getByTestId('first-run-tour-step').textContent).toContain('Second');
  });

  it('remember completion only when the last step is acknowledged', () => {
    renderTour();
    fireEvent.click(screen.getByTestId('first-run-tour-dot-3'));
    expect(window.localStorage.getItem('cfb.tour.t.u-1')).toBeNull();
    fireEvent.click(screen.getByTestId('first-run-tour-next'));
    expect(window.localStorage.getItem('cfb.tour.t.u-1')).toBe('done');
    expect(screen.queryByTestId('first-run-tour-step')).toBeNull();
  });
});

describe('a tour asked for again (docs §122)', () => {
  it('plays from the address bar even when it was seen', () => {
    window.localStorage.setItem('cfb.tour.t.u-1', 'done');
    window.history.replaceState({}, '', '/?tour=1');
    try {
      renderTour();
      expect(screen.getByTestId('first-run-tour-step').textContent).toContain('First');
    } finally {
      window.history.replaceState({}, '', '/');
    }
  });

  it('plays from the help button, and only the tour that was asked for', async () => {
    window.localStorage.setItem('cfb.tour.t.u-1', 'done');
    const { replayTour } = await import('@/lib/tour-replay');
    renderTour();
    expect(screen.queryByTestId('first-run-tour-step')).toBeNull();
    act(() => { replayTour('another'); });
    expect(screen.queryByTestId('first-run-tour-step')).toBeNull();
    act(() => { replayTour(); });
    expect(screen.getByTestId('first-run-tour-step').textContent).toContain('First');
  });

  it('stays off when it was seen and nobody asked', () => {
    window.localStorage.setItem('cfb.tour.t.u-1', 'done');
    renderTour();
    expect(screen.queryByTestId('first-run-tour-step')).toBeNull();
  });
});
