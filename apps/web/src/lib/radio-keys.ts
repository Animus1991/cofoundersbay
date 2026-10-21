import type { KeyboardEvent } from 'react';

const NEXT = ['ArrowRight', 'ArrowDown'];
const PREVIOUS = ['ArrowLeft', 'ArrowUp'];

/**
 * Arrow keys for a radio group built from buttons (`role="radiogroup"` around
 * `role="radio"`), as the WAI-ARIA radio pattern asks: the arrows move to the
 * next or previous option (wrapping), Home and End to the first and last.
 *
 * Eight groups were built this way and answered only to Tab and Space, so a
 * keyboard reader stepped through every option to leave one. With `select`
 * (the default) the option reached is also chosen, as a native radio is; a
 * group whose choice is sent to the server at once (an RSVP, who may write to
 * you) passes `select: false`, so moving through it sends nothing and Space
 * or Enter chooses.
 */
export function onRadioGroupKeyDown(event: KeyboardEvent<HTMLElement>, { select = true }: { select?: boolean } = {}): void {
  const forward = NEXT.includes(event.key);
  const back = PREVIOUS.includes(event.key);
  if (!forward && !back && event.key !== 'Home' && event.key !== 'End') return;
  const radios = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')).filter(
    (el) => !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true',
  );
  if (!radios.length) return;
  const current = radios.indexOf(document.activeElement as HTMLElement);
  const last = radios.length - 1;
  const next =
    event.key === 'Home' ? 0
      : event.key === 'End' ? last
        : forward ? (current < 0 ? 0 : current === last ? 0 : current + 1)
          : current <= 0 ? last : current - 1;
  event.preventDefault();
  radios[next].focus();
  if (select && radios[next].getAttribute('aria-checked') !== 'true') radios[next].click();
}

/**
 * One tab stop for the group: the chosen option, or the first when none is
 * chosen. The arrows reach the others.
 */
export function radioTabIndex(checked: boolean, index: number, anyChecked: boolean): 0 | -1 {
  return checked || (!anyChecked && index === 0) ? 0 : -1;
}
