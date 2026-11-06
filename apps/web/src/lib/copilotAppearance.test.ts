import { afterEach, describe, expect, it } from 'vitest';
import { planCopilotTools } from './copilot-planner';
import { executeAction, undoAction } from './action-registry';
import { runCopilotTurn } from './copilot-engine';

const tools = (message: string) => planCopilotTools(message).map((t) => t.name);
const args = (message: string, tool: string) => planCopilotTools(message).find((t) => t.name === tool)?.args;

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-theme');
});

describe('the look and the language, from the chat', () => {
  it('reads a theme only from a sentence about the theme', () => {
    expect(args('Βάλε σκοτεινό θέμα', 'set_theme')).toEqual({ theme: 'dark' });
    expect(args('Switch to the lilac theme', 'set_theme')).toEqual({ theme: 'lilac' });
    expect(tools('It is dark outside')).not.toContain('set_theme');
  });

  it('reads a language only when asked to change it', () => {
    expect(args('Άλλαξε τη γλώσσα σε αγγλικά', 'set_language')).toEqual({ language: 'en' });
    expect(args('Change the language to Greek', 'set_language')).toEqual({ language: 'el' });
    expect(tools('Do you speak Greek?')).not.toContain('set_language');
  });

  it('changes the theme and takes it back', async () => {
    window.localStorage.setItem('theme', 'light');
    const done = await executeAction('set_theme', { theme: 'dark' });
    expect(done).toMatchObject({ ok: true, undo: { from: 'light' } });
    expect(window.localStorage.getItem('theme')).toBe('dark');
    await undoAction('set_theme', { theme: 'dark' }, done.undo);
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('refuses what would change nothing, so the undo stays honest', async () => {
    window.localStorage.setItem('theme', 'dark');
    await expect(executeAction('set_theme', { theme: 'dark' })).resolves.toMatchObject({ ok: false });
    await expect(executeAction('set_theme', { theme: 'neon' })).resolves.toMatchObject({ ok: false });
  });

  it('changes the language and takes it back', async () => {
    window.localStorage.setItem('cfb_locale', 'el');
    const done = await executeAction('set_language', { language: 'en' });
    expect(window.localStorage.getItem('cfb_locale')).toBe('en');
    await undoAction('set_language', { language: 'en' }, done.undo);
    expect(window.localStorage.getItem('cfb_locale')).toBe('el');
  });
});

describe('the card the reader confirms', () => {
  // The planner alone is not enough: a tool with no arm in the engine produced
  // no card at all, and only a browser run showed it.
  it.each([
    ['Βάλε σκοτεινό θέμα', 'set_theme'],
    ['Άλλαξε τη γλώσσα σε αγγλικά', 'set_language'],
    ['Follow up with Nikos Andreou on 2026-11-20: send the deck', 'set_investor_followup'],
  ])('«%s» reaches a card', async (message, tool) => {
    const turn = await runCopilotTurn(message);
    expect(turn.actions.map((a) => a.tool)).toContain(tool);
  });
});

describe('a next step with an investor, from the chat', () => {
  it('reads who, when and what', () => {
    const planned = args('Follow up with Nikos Andreou on 2026-11-20: send the deck', 'set_investor_followup');
    expect(planned).toEqual({ investor: 'Nikos Andreou', date: '2026-11-20', step: 'send the deck' });
  });

  it('reads it in Greek, with a weekday', () => {
    const planned = args('Θύμισέ μου το follow-up με τον Νίκο την Παρασκευή', 'set_investor_followup') as { investor: string; date: string };
    expect(planned.investor).toBe('Νίκο');
    expect(new Date(planned.date).getUTCDay()).toBe(5);
  });

  it('waits for a person and a day before proposing anything', () => {
    expect(tools('What is a good follow-up?')).not.toContain('set_investor_followup');
    expect(tools('Follow up with Nikos')).not.toContain('set_investor_followup');
  });
});
