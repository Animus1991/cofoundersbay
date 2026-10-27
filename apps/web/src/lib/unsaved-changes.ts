/**
 * Work typed into a form and not yet saved.
 *
 * Nothing in the app noticed it: a click on any link, a keyboard shortcut,
 * the assistant opening a page or a reload threw away a half-written profile,
 * need card or event without a word. The industry's answer has three parts,
 * and this module is the part that is not React:
 *
 * - a registry of forms holding unsaved work (`holdUnsaved`), so anything
 *   about to leave the page can ask first (`confirmLeave`);
 * - one asker, installed by `UnsavedChangesGuard`, that puts the question to
 *   the reader in the app's own dialog (a browser `confirm` before it mounts);
 * - a draft of each form in sessionStorage, per account and per tab, so work
 *   the browser would not let us stop for (Back, a closed tab restored, a
 *   crash) is offered back when the form opens again.
 *
 * The draft stays in this tab and is written only while the form differs
 * from what was saved; saving clears it.
 */

export type Pair = { en: string; el: string };

type Hold = { id: number; label: Pair | null };

const holds = new Map<number, Hold>();
let nextId = 1;
let bypassUntil = 0;

/** Marks one form as holding unsaved work; the returned function lets go. */
export function holdUnsaved(label: Pair | null = null): () => void {
  const id = nextId++;
  holds.set(id, { id, label });
  return () => {
    holds.delete(id);
  };
}

/** Whether any form on the page holds unsaved work. */
export function hasUnsavedChanges(): boolean {
  return holds.size > 0 && Date.now() >= bypassUntil;
}

/** What the forms holding unsaved work are called, for the question. */
export function unsavedLabels(): Pair[] {
  return [...holds.values()].map((h) => h.label).filter((l): l is Pair => l !== null);
}

/**
 * The reader chose to leave: the next navigation goes through without asking
 * again, while the page it leaves unmounts.
 */
export function leaveWithoutSaving(windowMs = 4000): void {
  bypassUntil = Date.now() + windowMs;
}

/** Back to asking (a test, or a navigation that did not happen). */
export function resetLeaveBypass(): void {
  bypassUntil = 0;
}

type Asker = (href: string | null) => Promise<boolean>;
let asker: Asker | null = null;

/** Installed by `UnsavedChangesGuard`; one at a time. */
export function setLeaveAsker(next: Asker | null): void {
  asker = next;
}

export const LEAVE_COPY = {
  title: { en: 'Leave without saving?', el: 'Να φύγετε χωρίς αποθήκευση;' },
  body: {
    en: 'Your changes are not saved. If you come back in this tab, they will be offered as a draft.',
    el: 'Οι αλλαγές σας δεν έχουν αποθηκευτεί. Αν επιστρέψετε σε αυτή την καρτέλα, θα σας προταθούν ως πρόχειρο.',
  },
  stay: { en: 'Stay', el: 'Μείνετε εδώ' },
  leave: { en: 'Leave without saving', el: 'Φύγετε χωρίς αποθήκευση' },
} as const;

/**
 * Asks before anything leaves a page with unsaved work. Resolves true when
 * there is nothing to lose or the reader chose to leave; the caller then
 * navigates. Without the guard mounted, the browser's own confirm asks.
 */
export async function confirmLeave(href: string | null = null): Promise<boolean> {
  if (!hasUnsavedChanges()) return true;
  let ok: boolean;
  if (asker) {
    ok = await asker(href);
  } else {
    ok = typeof window !== 'undefined' && window.confirm(`${LEAVE_COPY.title.en}\n\n${LEAVE_COPY.body.en}`);
  }
  if (ok) leaveWithoutSaving();
  return ok;
}

/**
 * Whether a click on this link should be held for the question: a plain
 * left click on a same-origin link to another page, in this tab.
 */
export function isGuardedLinkClick(
  event: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>,
  anchor: { href: string; target?: string; hasDownload: boolean; optOut: boolean },
  here: { origin: string; pathname: string; search: string },
): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (anchor.hasDownload || anchor.optOut) return null;
  if (anchor.target && anchor.target !== '_self') return null;
  let url: URL;
  try {
    url = new URL(anchor.href, `${here.origin}${here.pathname}${here.search}`);
  } catch {
    return null;
  }
  // Another site: the browser's own before-unload question covers it.
  if (url.origin !== here.origin) return null;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  // The same page (a #section): nothing is lost.
  if (url.pathname === here.pathname && url.search === here.search) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

// ── Drafts ────────────────────────────────────────────────────────────────

const PREFIX = 'cfb:unsaved:';
/** A draft older than this was abandoned; opening the form starts clean. */
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60_000;

function accountKey(): string {
  try {
    const raw = window.localStorage.getItem('user');
    const id = raw ? (JSON.parse(raw) as { id?: unknown }).id : null;
    return typeof id === 'string' && id ? id : 'anon';
  } catch {
    return 'anon';
  }
}

function draftKey(formId: string): string {
  return `${PREFIX}${accountKey()}:${formId}`;
}

export type StoredDraft<T> = { value: T; at: number };

export function readDraft<T>(formId: string, now = Date.now()): StoredDraft<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey(formId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft<T>>;
    if (typeof parsed.at !== 'number' || !('value' in parsed)) return null;
    if (now - parsed.at > DRAFT_MAX_AGE_MS) {
      window.sessionStorage.removeItem(draftKey(formId));
      return null;
    }
    return { value: parsed.value as T, at: parsed.at };
  } catch {
    return null;
  }
}

export function writeDraft<T>(formId: string, value: T, now = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(draftKey(formId), JSON.stringify({ value, at: now }));
  } catch {
    // Storage full or blocked: the before-leave question still protects the work.
  }
}

export function clearDraft(formId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(draftKey(formId));
  } catch {
    // ignore
  }
}

/**
 * The same value for the same fields, whatever order the object was built
 * in, so a form is not "changed" because a key moved.
 */
export function sameValue(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}
