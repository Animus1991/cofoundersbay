/**
 * Reading a listing draft (`draft_mentor_listing`, `draft_provider_listing`)
 * and a saved listing into the forms on /mentor/profile and /provider/profile.
 *
 * The forms offer fixed chips and fixed select steps. A draft arrives as
 * comma-separated words and plain numbers, so each word is matched to the
 * form's own option (case and spacing ignored, unknown words dropped rather
 * than invented) and each number snaps to the nearest step the select offers.
 */

const fold = (s: string) => s.toLowerCase().replace(/[\s_\-/]+/g, '');

/** The form's options named in `text` (comma or semicolon separated), in the form's order. */
export function pickOptions(text: string | undefined, options: readonly string[]): string[] {
  if (!text) return [];
  const wanted = new Set(text.split(/[,;]/).map((w) => fold(w.trim())).filter(Boolean));
  return options.filter((o) => wanted.has(fold(o)));
}

/** The step of a select closest to `value`; a tie goes to the smaller step. */
export function snapToStep(value: number, steps: readonly number[]): number | null {
  if (!Number.isFinite(value) || steps.length === 0) return null;
  let best = steps[0];
  for (const step of steps) if (Math.abs(step - value) < Math.abs(best - value)) best = step;
  return best;
}

/** A draft number or a saved one, read from text or a number. */
export function readNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const n = Number(value.replace(/[$,€\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** A draft boolean: true/false, or yes/no and their Greek. */
export function readFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (['true', 'yes', 'ναι'].includes(v)) return true;
  if (['false', 'no', 'όχι', 'οχι'].includes(v)) return false;
  return null;
}

/** Dollars typed in a form to the cents the API stores; empty or invalid is null. */
export function dollarsToCents(value: string): number | null {
  const n = readNumber(value);
  return n === null || n < 0 ? null : Math.round(n * 100);
}

/** Cents from the API to the dollars a form shows; null stays empty. */
export function centsToDollars(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value) / 100) : '';
}
