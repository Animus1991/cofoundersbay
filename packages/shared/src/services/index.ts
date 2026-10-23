/**
 * Provider projects: how far agreed work is, and when it is due.
 *
 * A project is a `ServiceInquiry` at `accepted` or `completed` (the provider
 * pages read it that way, and so does `listInquiries({ kind: 'projects' })`).
 * The row recorded what was agreed and when it was resolved, but not a
 * schedule, so every live project read "Progress 0%" and "Due: —" until §95
 * hid both. The owner chose real fields (docs §97): `progress` (0-100) and
 * `dueDate` (a calendar day), both set by the provider.
 *
 * One reader for the API and the demo world, so both refuse the same things
 * with the same words.
 */

/** The inquiry statuses that mean the work was agreed. */
export const PROJECT_INQUIRY_STATUSES = ['accepted', 'completed'] as const;

export interface ProjectDelivery {
  /** 0-100; null clears it ("not tracked"). */
  progress?: number | null;
  /** `YYYY-MM-DD`; null clears it. */
  dueDate?: string | null;
}

export type ProjectDeliveryResult =
  | { ok: true; value: ProjectDelivery }
  | { ok: false; field: 'progress' | 'dueDate'; reason: { en: string; el: string } };

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar day written as `YYYY-MM-DD` (rejects 2026-02-30). */
export function isCalendarDay(value: string): boolean {
  const m = DAY.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/**
 * Read `progress` and `dueDate` from an update.
 *
 * `status` is the inquiry's current status and `nextStatus` the one the same
 * update sets, if any: the fields are kept for agreed work only, and a
 * completed project is at 100%. Keys that are absent stay absent, so a
 * caller can tell "not sent" from "cleared".
 */
export function readProjectDelivery(
  body: Record<string, unknown>,
  status: string,
  nextStatus?: string,
): ProjectDeliveryResult {
  const value: ProjectDelivery = {};
  const after = nextStatus ?? status;
  const isProject = (PROJECT_INQUIRY_STATUSES as readonly string[]).includes(after);

  if ('progress' in body) {
    const p = body.progress;
    if (p === null) value.progress = null;
    else if (typeof p !== 'number' || !Number.isInteger(p) || p < 0 || p > 100) {
      return { ok: false, field: 'progress', reason: { en: 'Progress is a whole number from 0 to 100.', el: 'Η πρόοδος είναι ακέραιος από 0 έως 100.' } };
    } else value.progress = p;
  }
  if ('dueDate' in body) {
    const d = body.dueDate;
    if (d === null) value.dueDate = null;
    else if (typeof d !== 'string' || !isCalendarDay(d)) {
      return { ok: false, field: 'dueDate', reason: { en: 'The due date is a day, written YYYY-MM-DD.', el: 'Η προθεσμία είναι μια ημέρα, γραμμένη ΕΕΕΕ-ΜΜ-ΗΗ.' } };
    } else value.dueDate = d;
  }

  if (('progress' in value || 'dueDate' in value) && !isProject) {
    const field = 'progress' in value ? 'progress' : 'dueDate';
    return {
      ok: false,
      field,
      reason: {
        en: 'Progress and a due date are kept for agreed work; accept the inquiry first.',
        el: 'Πρόοδος και προθεσμία κρατούνται για συμφωνημένη δουλειά· αποδεχτείτε πρώτα το αίτημα.',
      },
    };
  }
  if (after === 'completed' && value.progress != null && value.progress !== 100) {
    return { ok: false, field: 'progress', reason: { en: 'A completed project is at 100%.', el: 'Ένα ολοκληρωμένο έργο είναι στο 100%.' } };
  }
  return { ok: true, value };
}

/** What completing a project writes besides its status. */
export const COMPLETED_PROJECT_PROGRESS = 100;
