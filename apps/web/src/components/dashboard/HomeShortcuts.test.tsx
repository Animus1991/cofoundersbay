import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HOME_ASK } from '@/lib/home-ask';
import { HomeShortcuts } from './HomeShortcuts';

const { runSpy } = vi.hoisted(() => ({ runSpy: vi.fn() }));
// The hook, not the hero: the rail rows run exactly what the chips ran.
vi.mock('@/components/dashboard/HomeAskHero', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/dashboard/HomeAskHero')>()),
  useHomeAskRun: () => runSpy,
}));
// "Your pages" is covered by YourPages.test; these tests are the action rows.
vi.mock('@/components/dashboard/YourPages', () => ({ YourPagesRow: () => <nav data-your-pages="" /> }));

afterEach(() => {
  cleanup();
  runSpy.mockReset();
});

describe('HomeShortcuts, the home chips as rail rows (docs §125)', () => {
  it('lists every action the role had under its question box', () => {
    render(<HomeShortcuts role="investor" pages={false} />);
    const box = screen.getByTestId('home-shortcuts');
    expect(box.querySelectorAll('a, button').length).toBe(HOME_ASK.investor.actions.length);
    for (const action of HOME_ASK.investor.actions) {
      expect(screen.getByText(action.en)).toBeTruthy();
    }
  });

  it('an action with an href is a link to it', () => {
    render(<HomeShortcuts role="incubator" pages={false} />);
    const link = screen.getByRole('link', { name: /Applications to decide/ });
    expect(link.getAttribute('href')).toBe('/org/applications');
    fireEvent.click(link);
    expect(runSpy).not.toHaveBeenCalled();
  });

  it('an action with a prompt is a button that runs it', () => {
    render(<HomeShortcuts role="incubator" pages={false} />);
    const button = screen.getByRole('button', { name: /How the cohort is doing/ });
    fireEvent.click(button);
    expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'cohort' }));
  });

  it('renders YourPagesRow unless the rail carries it as its own section', () => {
    const { container: without } = render(<HomeShortcuts role="mentor" pages={false} />);
    expect(without.querySelector('[data-your-pages]')).toBeNull();
    cleanup();
    const { container: withPages } = render(<HomeShortcuts role="mentor" />);
    expect(withPages.querySelector('[data-your-pages]')).toBeTruthy();
  });
});
