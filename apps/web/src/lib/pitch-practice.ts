/**
 * CoFoundersLab's live pitch practice, on the event form we already have.
 * The API's event types have no pitch-practice value, so the session is stored
 * as a workshop (the closest kind) and the form says so before anyone publishes.
 */
export const PITCH_PRACTICE_KIND = 'pitch-practice';

export function isPitchPractice(kind: string | null | undefined): boolean {
  return kind === PITCH_PRACTICE_KIND;
}
