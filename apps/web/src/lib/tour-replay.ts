/**
 * A tour that was dismissed can be asked for again (docs §122).
 *
 * `resetTour` had existed since the tours did, and nothing called it: once a
 * reader pressed "Got it", or "Skip" by mistake, the only way back was the
 * browser's storage panel. The prototype in `Animus1991/stoixos` reopens its
 * welcome guide from the address bar (`?guide=1`); here a page's tour plays
 * again from `?tour=1` (or `?tour=<id>`), and from a button in the page help,
 * which only appears while a tour is mounted on the page.
 *
 * The registry is a module-level set read through `useSyncExternalStore`, so
 * the help button and the tour never need a shared ancestor: `AppShell` mounts
 * the help, the page mounts the tour.
 */
import { useSyncExternalStore } from 'react';

export const TOUR_REPLAY_EVENT = 'cfb:tour:replay';

/** `?tour=1` plays whatever tour the page has; `?tour=<id>` plays that one. */
export function wantsTourFromUrl(search: string, tourId: string): boolean {
  const value = new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get('tour');
  return value === '1' || value === tourId;
}

const mounted = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: readonly string[] = [];

function emit() {
  snapshot = [...mounted];
  for (const listener of listeners) listener();
}

/** Called by a mounted tour; the returned function forgets it again. */
export function registerTour(tourId: string): () => void {
  mounted.add(tourId);
  emit();
  return () => {
    mounted.delete(tourId);
    emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: readonly string[] = [];

/** The same list outside React, for the assistant's executor. */
export function mountedTours(): readonly string[] {
  return snapshot;
}

/** The ids of the tours mounted on the current page; empty on the server. */
export function useMountedTours(): readonly string[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}

/** Ask the mounted tour (or the named one) to play from its first step. */
export function replayTour(tourId?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOUR_REPLAY_EVENT, { detail: { tourId } }));
}

/** For tests: forget every mounted tour. */
export function resetTourRegistry(): void {
  mounted.clear();
  emit();
}
