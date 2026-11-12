import { afterEach, describe, expect, it, vi } from 'vitest';
import { wantsPageTour } from './copilot-planner';
import { runCopilotTurn } from './copilot-engine';
import { executeCopilotAction } from './copilot-engine';
import { TOUR_REPLAY_EVENT, registerTour, resetTourRegistry } from './tour-replay';
import type { CopilotAction } from './copilot-types';

/**
 * "Show me around this page" plays the page's tour (docs §122). The page
 * context lists the tours mounted on the page; the assistant proposes one
 * only where one exists, in the reader's language, and the executor refuses
 * a tour the page does not mount rather than dispatching into nothing.
 */

afterEach(() => resetTourRegistry());

describe('wantsPageTour', () => {
  it('hears the tour asked for, in either language', () => {
    for (const ask of [
      'show me around this page',
      'Walk me through this',
      'show the tour',
      'can I see the tour again?',
      'tour',
      'replay the page tour',
      'Ξενάγησέ με σε αυτή τη σελίδα',
      'δείξε μου τη σελίδα',
      'θέλω περιήγηση',
    ]) expect(wantsPageTour(ask), ask).toBe(true);
  });

  it('leaves other tours and ordinary questions alone', () => {
    for (const ask of [
      'who is on the investor tour next month?',
      'what is due this week?',
      'open the filters',
      'δείξε μου τα φίλτρα',
      'book a tour of the office',
    ]) expect(wantsPageTour(ask), ask).toBe(false);
  });
});

describe('proposing the tour', () => {
  const context = { route: '/matches', locale: 'en', tours: ['matches'] };

  it('offers the page’s tour, pending until confirmed', async () => {
    const turn = await runCopilotTurn('show me around this page', context, { tools: [] });
    const card = turn.actions.find((a) => a.tool === 'show_page_tour');
    expect(card?.payload).toEqual({ tour: 'matches' });
    expect(card?.status).toBe('pending');
    expect(card?.title).toBe('Show the page tour');
    expect(card?.confirmLabel).toBe('Show');
  });

  it('speaks Greek to a Greek reader', async () => {
    const turn = await runCopilotTurn('ξενάγησέ με', { ...context, locale: 'el' }, { tools: [] });
    const card = turn.actions.find((a) => a.tool === 'show_page_tour');
    expect(card?.title).toBe('Εμφάνιση της ξενάγησης σελίδας');
    expect(card?.confirmLabel).toBe('Εμφάνιση');
    expect(turn.message).toContain('βήμα-βήμα');
  });

  it('names the tour when asked what the page is, and offers nothing on a page without one', async () => {
    const about = await runCopilotTurn('what am I looking at?', context, { tools: [] });
    expect(about.message).toContain('short tour');
    expect(about.actions.find((a) => a.tool === 'show_page_tour')).toBeUndefined();

    const bare = await runCopilotTurn('show me around this page', { route: '/matches', locale: 'en' }, { tools: [] });
    expect(bare.actions.find((a) => a.tool === 'show_page_tour')).toBeUndefined();
  });
});

describe('executing the tour', () => {
  const card: CopilotAction = {
    id: 'tour-1',
    tool: 'show_page_tour',
    title: 'Show the page tour',
    description: '',
    confirmLabel: 'Show',
    payload: { tour: 'matches' },
    status: 'pending',
  };

  it('asks the mounted tour to play', async () => {
    const heard = vi.fn();
    window.addEventListener(TOUR_REPLAY_EVENT, heard);
    const forget = registerTour('matches');
    try {
      const result = await executeCopilotAction(card);
      expect(result.ok).toBe(true);
      expect(heard).toHaveBeenCalledTimes(1);
      expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ tourId: 'matches' });
    } finally {
      forget();
      window.removeEventListener(TOUR_REPLAY_EVENT, heard);
    }
  });

  it('refuses a tour the page does not mount, and dispatches nothing', async () => {
    const heard = vi.fn();
    window.addEventListener(TOUR_REPLAY_EVENT, heard);
    try {
      const result = await executeCopilotAction(card);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('no tour');
      expect(heard).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(TOUR_REPLAY_EVENT, heard);
    }
  });
});
