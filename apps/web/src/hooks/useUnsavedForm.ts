'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearDraft, holdUnsaved, readDraft, sameValue, writeDraft, type Pair, type StoredDraft } from '@/lib/unsaved-changes';

export type UnsavedForm<T> = {
  /** The form differs from what was saved (or, for a new one, from empty). */
  dirty: boolean;
  /** A draft from an earlier visit in this tab, not yet restored or discarded. */
  offer: StoredDraft<T> | null;
  /** Puts the offered draft back into the form. */
  restore: () => void;
  /** Throws the offered draft away. */
  discard: () => void;
  /**
   * The form was saved: what it holds (or `saved`) becomes the saved state,
   * the draft is cleared and leaving no longer asks. Call it before a
   * navigation that follows the save.
   */
  markSaved: (saved?: T) => void;
};

/**
 * One form's unsaved work, guarded.
 *
 * `value` is the form's fields as one object (build it the same way every
 * render); `restore` puts such an object back. While `value` differs from
 * the saved state the page asks before it is left (`UnsavedChangesGuard`, the
 * browser's before-unload question) and keeps a draft in this tab under `id`;
 * when the form opens again that draft is offered back. `ready` is when the
 * saved state is known: at once for a new form, after the read for an edit.
 * An `id` of null keeps the question but no draft.
 */
export function useUnsavedForm<T>({
  id,
  ready,
  value,
  restore,
  label = null,
  forceDirty = false,
}: {
  id: string | null;
  ready: boolean;
  value: T;
  restore: (draft: T) => void;
  label?: Pair | null;
  /**
   * Unsaved whatever the comparison says: fields the assistant filled in
   * (`useFormDraft`) on a form whose saved state already includes them,
   * because they arrived in the same commit as the form's own prefill.
   */
  forceDirty?: boolean;
}): UnsavedForm<T> {
  const [baseline, setBaseline] = useState<{ value: T } | null>(null);
  const [offer, setOffer] = useState<StoredDraft<T> | null>(null);
  // Refs as well as state: the effects below run in one commit, and the
  // draft must not be cleared by the effect that runs before the offer
  // state has applied.
  const offerRef = useRef<StoredDraft<T> | null>(null);
  const checkedRef = useRef(false);
  const releaseRef = useRef<(() => void) | null>(null);

  // The saved state: the fields as they are when the form is ready. A draft
  // the assistant applies after that (useFormDraft) is unsaved work, as it
  // should be.
  useEffect(() => {
    if (ready && baseline === null) setBaseline({ value });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the value at the moment the form is ready
  }, [ready, baseline]);

  // A draft from an earlier visit, offered once the form is ready.
  useEffect(() => {
    if (!ready || !id || checkedRef.current) return;
    checkedRef.current = true;
    const stored = readDraft<T>(id);
    if (stored && !sameValue(stored.value, value)) {
      offerRef.current = stored;
      setOffer(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, against the form as it opened
  }, [ready, id]);

  const dirty = ready && baseline !== null && (forceDirty || !sameValue(value, baseline.value));

  // Ask before leaving while there is unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const release = holdUnsaved(label);
    releaseRef.current = release;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers read returnValue; the text itself is the browser's.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      release();
      if (releaseRef.current === release) releaseRef.current = null;
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty, label]);

  // Keep the draft while the form differs from the saved state. An offered
  // draft is kept as it is until the reader restores or discards it.
  useEffect(() => {
    if (!id || !ready || !checkedRef.current || offerRef.current) return;
    if (!dirty) {
      clearDraft(id);
      return;
    }
    const timer = window.setTimeout(() => writeDraft(id, value), 300);
    return () => window.clearTimeout(timer);
  }, [id, ready, dirty, value]);

  const restoreDraft = useCallback(() => {
    const stored = offerRef.current;
    offerRef.current = null;
    setOffer(null);
    if (stored) restore(stored.value);
  }, [restore]);

  const discard = useCallback(() => {
    offerRef.current = null;
    setOffer(null);
    if (id) clearDraft(id);
  }, [id]);

  const markSaved = useCallback((saved?: T) => {
    releaseRef.current?.();
    releaseRef.current = null;
    offerRef.current = null;
    setOffer(null);
    if (id) clearDraft(id);
    setBaseline({ value: saved === undefined ? value : saved });
  }, [id, value]);

  return { dirty, offer, restore: restoreDraft, discard, markSaved };
}
