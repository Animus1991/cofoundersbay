import { afterEach, describe, expect, it, vi } from 'vitest';
import { findSlideIndex, pitchDeckEditor, registerPitchDeckEditor, type PitchDeckEditor } from './pitch-deck-bridge';
import { planCopilotTools } from './copilot-planner';
import { executeAction, undoAction } from './action-registry';

const slides = [
  { names: ['Cover', 'Εξώφυλλο', 'cover'] },
  { names: ['Problem', 'Πρόβλημα', 'problem'] },
  { names: ['Market size', 'Μέγεθος αγοράς', 'market'] },
];

describe('which slide a person means', () => {
  it('takes a number, counted from one', () => {
    expect(findSlideIndex('2', slides)).toBe(1);
    expect(findSlideIndex('9', slides)).toBe(-1);
  });

  it('takes a title in either language, with or without accents', () => {
    expect(findSlideIndex('Πρόβλημα', slides)).toBe(1);
    expect(findSlideIndex('το προβλημα', slides)).toBe(1);
    expect(findSlideIndex('the problem', slides)).toBe(1);
  });

  it('takes part of a title, and nothing when nothing fits', () => {
    expect(findSlideIndex('αγοράς', slides)).toBe(2);
    expect(findSlideIndex('team', slides)).toBe(-1);
  });
});

describe('rewriting a slide from the chat', () => {
  const args = (message: string) => planCopilotTools(message).find((tool) => tool.name === 'set_pitch_slide')?.args;

  it('reads the slide and the text, in Greek and in English', () => {
    expect(args('Άλλαξε τη διαφάνεια Πρόβλημα σε: Οι ιδρυτές χάνουν εβδομάδες')).toEqual({ slide: 'Πρόβλημα', content: 'Οι ιδρυτές χάνουν εβδομάδες' });
    expect(args('Rewrite slide 2 to: Founders lose weeks')).toEqual({ slide: '2', content: 'Founders lose weeks' });
  });

  it('stays out of a question about slides', () => {
    expect(args('Which slide is weakest?')).toBeUndefined();
    expect(args('Τι λείπει από τη διαφάνεια Πρόβλημα;')).toBeUndefined();
  });
});

describe('the capability', () => {
  afterEach(() => {
    const clear = registerPitchDeckEditor({ setSlide: async () => null, restoreSlide: async () => false });
    clear();
  });

  it('says so when no deck is open, instead of reporting a change', async () => {
    expect(pitchDeckEditor()).toBeNull();
    const result = await executeAction('set_pitch_slide', { slide: '2', content: 'New text' });
    expect(result.ok).toBe(false);
  });

  it('writes through the open deck and keeps the earlier text for Undo', async () => {
    const editor: PitchDeckEditor = {
      setSlide: vi.fn(async () => ({ id: 's2', before: 'Old text' })),
      restoreSlide: vi.fn(async () => true),
    };
    const clear = registerPitchDeckEditor(editor);
    const result = await executeAction('set_pitch_slide', { slide: '2', content: 'New text' });
    expect(editor.setSlide).toHaveBeenCalledWith('2', 'New text');
    expect(result).toEqual({ ok: true, undo: { id: 's2', before: 'Old text' } });
    const undone = await undoAction('set_pitch_slide', {}, { id: 's2', before: 'Old text' });
    expect(editor.restoreSlide).toHaveBeenCalledWith('s2', 'Old text');
    expect(undone.ok).toBe(true);
    clear();
  });

  it('names a slide it cannot find', async () => {
    const clear = registerPitchDeckEditor({ setSlide: async () => null, restoreSlide: async () => false });
    const result = await executeAction('set_pitch_slide', { slide: 'team', content: 'New text' });
    expect(result.ok).toBe(false);
    clear();
  });
});
