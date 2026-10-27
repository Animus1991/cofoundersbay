import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearDraft,
  confirmLeave,
  DRAFT_MAX_AGE_MS,
  hasUnsavedChanges,
  holdUnsaved,
  isGuardedLinkClick,
  readDraft,
  resetLeaveBypass,
  sameValue,
  setLeaveAsker,
  writeDraft,
} from './unsaved-changes';

const HERE = { origin: 'https://app.example', pathname: '/profile/edit', search: '' };
const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
const link = (href: string, extra: Partial<{ target: string; hasDownload: boolean; optOut: boolean }> = {}) => ({
  href,
  target: '',
  hasDownload: false,
  optOut: false,
  ...extra,
});

afterEach(() => {
  setLeaveAsker(null);
  resetLeaveBypass();
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('unsaved work and leaving', () => {
  it('holds while a form has unsaved work, and lets go', () => {
    expect(hasUnsavedChanges()).toBe(false);
    const release = holdUnsaved({ en: 'Profile', el: 'Προφίλ' });
    expect(hasUnsavedChanges()).toBe(true);
    release();
    expect(hasUnsavedChanges()).toBe(false);
  });

  it('asks only when there is something to lose, and remembers the answer for the navigation', async () => {
    const asker = vi.fn().mockResolvedValue(false);
    setLeaveAsker(asker);
    expect(await confirmLeave('/matches')).toBe(true);
    expect(asker).not.toHaveBeenCalled();

    const release = holdUnsaved();
    expect(await confirmLeave('/matches')).toBe(false);
    expect(asker).toHaveBeenCalledWith('/matches');
    expect(hasUnsavedChanges()).toBe(true);

    asker.mockResolvedValue(true);
    expect(await confirmLeave('/matches')).toBe(true);
    // Leaving was chosen: the page about to unmount is not asked about again.
    expect(hasUnsavedChanges()).toBe(false);
    release();
  });

  it('falls back to the browser confirm when no guard is mounted', async () => {
    const release = holdUnsaved();
    const native = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(await confirmLeave()).toBe(false);
    expect(native).toHaveBeenCalledOnce();
    release();
  });

  it('holds only a plain click on a link to another page of the app, in this tab', () => {
    expect(isGuardedLinkClick(click, link('/matches'), HERE)).toBe('/matches');
    expect(isGuardedLinkClick(click, link('https://app.example/events?tab=mine#top'), HERE)).toBe('/events?tab=mine#top');
    // The same page, a #section: nothing is lost.
    expect(isGuardedLinkClick(click, link('#links'), HERE)).toBeNull();
    // Another site: the browser's own question covers it.
    expect(isGuardedLinkClick(click, link('https://linkedin.com/in/x'), HERE)).toBeNull();
    expect(isGuardedLinkClick(click, link('mailto:a@b.c'), HERE)).toBeNull();
    // A new tab, a download, a modified click, an opted-out link.
    expect(isGuardedLinkClick(click, link('/matches', { target: '_blank' }), HERE)).toBeNull();
    expect(isGuardedLinkClick(click, link('/file.pdf', { hasDownload: true }), HERE)).toBeNull();
    expect(isGuardedLinkClick({ ...click, metaKey: true }, link('/matches'), HERE)).toBeNull();
    expect(isGuardedLinkClick({ ...click, button: 1 }, link('/matches'), HERE)).toBeNull();
    expect(isGuardedLinkClick(click, link('/matches', { optOut: true }), HERE)).toBeNull();
    expect(isGuardedLinkClick({ ...click, defaultPrevented: true }, link('/matches'), HERE)).toBeNull();
  });
});

describe('drafts in this tab', () => {
  beforeEach(() => {
    window.localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
  });

  it('keeps a draft per account, and forgets an old one', () => {
    const now = Date.parse('2026-10-27T10:00:00Z');
    writeDraft('profile', { bio: 'hello' }, now);
    expect(readDraft('profile', now + 1000)).toEqual({ value: { bio: 'hello' }, at: now });
    // Another account in the same tab does not see it.
    window.localStorage.setItem('user', JSON.stringify({ id: 'u2' }));
    expect(readDraft('profile', now + 1000)).toBeNull();
    window.localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
    expect(readDraft('profile', now + DRAFT_MAX_AGE_MS + 1)).toBeNull();
    expect(readDraft('profile', now)).toBeNull();
  });

  it('clears on save', () => {
    writeDraft('event', { title: 'Demo day' });
    clearDraft('event');
    expect(readDraft('event')).toBeNull();
  });

  it('compares fields, not the order they were written in', () => {
    expect(sameValue({ a: 1, b: ['x'] }, { b: ['x'], a: 1 })).toBe(true);
    expect(sameValue({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(sameValue({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameValue({ list: ['a', 'b'] }, { list: ['b', 'a'] })).toBe(false);
  });
});
