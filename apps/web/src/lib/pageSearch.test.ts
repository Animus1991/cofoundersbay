import { describe, expect, it } from 'vitest';
import { foldText, searchPages } from './page-search';

const paths = (q: string, role = 'founder') => searchPages(q, role).map((h) => h.path);

describe('command palette page search', () => {
  it('finds a page by the word people use, in English or Greek, accents or not', () => {
    expect(paths('cofounder')[0]).toBe('/matches');
    expect(paths('συνιδρυτή')).toContain('/matches');
    expect(paths('συνιδρυτη')).toContain('/matches');
    expect(paths('discount')).toContain('/perks');
    expect(paths('εκπτώσεις')).toContain('/perks');
    expect(paths('how you work')).toContain('/settings');
  });

  it('matches every word typed, and finds pages by their own title', () => {
    expect(paths('pitch deck')).toContain('/builder/pitch-deck');
    expect(paths('zzzz')).toEqual([]);
    expect(paths('')).toEqual([]);
  });

  it('shows only the pages meant for the reader\'s role, never sign-in pages', () => {
    expect(paths('moderation')).not.toContain('/admin/moderation');
    expect(searchPages('moderation', 'admin').length).toBeGreaterThan(0);
    expect(paths('sign in')).not.toContain('/login');
    expect(paths('investor pipeline', 'founder').some((p) => p.startsWith('/investor/'))).toBe(false);
  });

  it('folds accents and final sigma', () => {
    expect(foldText('Συνιδρυτής')).toBe('συνιδρυτησ');
  });
});
