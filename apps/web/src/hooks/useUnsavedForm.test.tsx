import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useUnsavedForm } from './useUnsavedForm';
import { hasUnsavedChanges, readDraft, writeDraft } from '@/lib/unsaved-changes';

type Fields = { title: string; notes: string };
const EMPTY: Fields = { title: '', notes: '' };

function useForm(initial: Fields = EMPTY, ready = true, id: string | null = 'milestone') {
  const [value, setValue] = useState<Fields>(initial);
  const guard = useUnsavedForm({ id, ready, value, restore: setValue });
  return { value, setValue, guard };
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
});

afterEach(() => {
  // Unmount every form, or a dirty one from an earlier test keeps asking.
  cleanup();
  vi.useRealTimers();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe('a form with unsaved work', () => {
  it('is clean as it opens, dirty once changed, clean again once changed back', () => {
    const { result } = renderHook(() => useForm());
    expect(result.current.guard.dirty).toBe(false);
    act(() => result.current.setValue({ title: 'Ship v2', notes: '' }));
    expect(result.current.guard.dirty).toBe(true);
    expect(hasUnsavedChanges()).toBe(true);
    act(() => result.current.setValue(EMPTY));
    expect(result.current.guard.dirty).toBe(false);
    expect(hasUnsavedChanges()).toBe(false);
  });

  it('keeps a draft in the tab while dirty and clears it on save', () => {
    const { result } = renderHook(() => useForm());
    act(() => result.current.setValue({ title: 'Ship v2', notes: 'by Friday' }));
    act(() => vi.advanceTimersByTime(400));
    expect(readDraft<Fields>('milestone')?.value).toEqual({ title: 'Ship v2', notes: 'by Friday' });
    act(() => result.current.guard.markSaved());
    expect(result.current.guard.dirty).toBe(false);
    expect(hasUnsavedChanges()).toBe(false);
    expect(readDraft('milestone')).toBeNull();
  });

  it('offers a draft from an earlier visit, and restores it only when asked', () => {
    writeDraft<Fields>('milestone', { title: 'Half written', notes: '' });
    const { result } = renderHook(() => useForm());
    expect(result.current.guard.offer?.value.title).toBe('Half written');
    expect(result.current.value.title).toBe('');
    // The offered draft is not overwritten while it waits.
    act(() => vi.advanceTimersByTime(400));
    expect(readDraft<Fields>('milestone')?.value.title).toBe('Half written');
    act(() => result.current.guard.restore());
    expect(result.current.value.title).toBe('Half written');
    expect(result.current.guard.offer).toBeNull();
    expect(result.current.guard.dirty).toBe(true);
  });

  it('throws an offered draft away when discarded', () => {
    writeDraft<Fields>('milestone', { title: 'Half written', notes: '' });
    const { result } = renderHook(() => useForm());
    act(() => result.current.guard.discard());
    expect(result.current.guard.offer).toBeNull();
    expect(readDraft('milestone')).toBeNull();
    expect(result.current.value.title).toBe('');
  });

  it('compares an edit form with what was read, once it is ready', () => {
    const saved = { title: 'Launch', notes: 'saved' };
    const { result, rerender } = renderHook(({ ready }) => useForm(ready ? saved : EMPTY, ready), { initialProps: { ready: false } });
    expect(result.current.guard.dirty).toBe(false);
    rerender({ ready: true });
    // useState keeps the first value: set what was read, as an edit form does.
    act(() => result.current.setValue(saved));
    expect(result.current.guard.dirty).toBe(true);
  });

  it('asks before the page unloads only while dirty', () => {
    const { result } = renderHook(() => useForm());
    const before = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(before);
    expect(before.defaultPrevented).toBe(false);
    act(() => result.current.setValue({ title: 'x', notes: '' }));
    const during = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(during);
    expect(during.defaultPrevented).toBe(true);
  });
});
