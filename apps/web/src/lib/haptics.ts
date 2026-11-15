/**
 * A short vibration where a touch deserves one: an assistant action landed,
 * was taken back, or failed.
 *
 * The prototype in `Animus1991/stoixos` ticks the phone when a target word is
 * heard (`triggerMobileHapticFeedback`); here the tick marks the moment the
 * reader's confirmation became a change they own. Only a coarse pointer (a
 * phone or tablet in the hand) is asked — a laptop with a vibration API would
 * buzz the desk — and nothing here is a prerequisite: a device that cannot
 * vibrate gets the same card and the same toast.
 */
export type HapticKind = 'done' | 'undone' | 'error';

export function hapticPattern(kind: HapticKind): number | number[] {
  switch (kind) {
    case 'done':
      return 12;
    case 'undone':
      return [10, 40, 10];
    case 'error':
      return [30, 50, 30];
  }
}

type VibratingNavigator = { vibrate?: (pattern: number | number[]) => boolean };
type MediaMatcher = (query: string) => { matches: boolean };

/** True when the device vibrated. False means unsupported, a fine pointer, or refused. */
export function haptic(
  kind: HapticKind,
  nav: VibratingNavigator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
  matchMedia: MediaMatcher | undefined = typeof window === 'undefined' ? undefined : window.matchMedia?.bind(window),
): boolean {
  try {
    if (!nav || typeof nav.vibrate !== 'function') return false;
    if (!matchMedia || !matchMedia('(pointer: coarse)').matches) return false;
    return Boolean(nav.vibrate(hapticPattern(kind)));
  } catch {
    return false;
  }
}
