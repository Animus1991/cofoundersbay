import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  // A value that is not a date ("Never", or a sample row's "2 hours ago")
  // used to come out as "NaNy ago". Show what was given instead.
  if (Number.isNaN(date.getTime())) return typeof dateStr === 'string' && dateStr.trim() ? dateStr : '—';
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Greek counterpart of `formatRelativeTime`, same thresholds. `RelativeTime`
 * switches to it when the reader's primary language is Greek; a timestamp is a
 * tight slot, so it shows one language rather than both.
 */
export function formatRelativeTimeEl(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(date.getTime())) return typeof dateStr === 'string' && dateStr.trim() ? dateStr : '—';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'μόλις τώρα';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `πριν ${minutes} λ.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `πριν ${hours} ώ.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `πριν ${days} ημ.`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `πριν ${weeks} εβδ.`;
  const months = Math.floor(days / 30);
  if (months < 12) return `πριν ${months} μήν.`;
  return `πριν ${Math.floor(months / 12)} έτ.`;
}

/**
 * Reads a message off a caught value. `catch` binds `unknown`, and the app's
 * API errors are plain Errors or `{ message }` objects; this keeps call sites
 * from reaching for `any`.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** HTTP status carried by API errors thrown from lib/api. */
export function errorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

/** True for the DOMException thrown when a fetch/stream is aborted. */
export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: unknown }).name === 'AbortError')
  );
}

/**
 * Two letters for an avatar: first and last word, titles skipped.
 *
 * Twenty call sites built initials with `name.split(' ').map(n => n[0])`,
 * which gave "DSK" for "Dr. Sarah Kim" - three letters in a 32px circle,
 * drawn over the avatar beside it.
 */
const NAME_TITLES = new Set(['dr', 'mr', 'mrs', 'ms', 'mx', 'prof', 'sir']);
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((w) => w && !NAME_TITLES.has(w.replace(/\.$/, '').toLowerCase()));
  if (!words.length) return '?';
  const first = words[0][0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/**
 * A company stage as people write it: "Pre-seed", "Seed", "Series A".
 *
 * The API stores stages as identifiers (`pre_seed`, `series_a`), and the
 * investor pages printed them as stored, so one deal read "pre_seed" on the
 * pipeline beside a sample row reading "Pre-seed". Already-written labels
 * pass through unchanged; an empty stage stays empty for the caller's dash.
 */
export function companyStageLabel(stage: string | null | undefined): string {
  const words = (stage ?? '').trim().split(/[_\s-]+/).filter(Boolean);
  if (!words.length) return '';
  if (words[0].toLowerCase() === 'mvp') return 'MVP';
  if (words[0].toLowerCase() === 'pre' && words.length > 1) {
    return `Pre-${words.slice(1).join(' ').toLowerCase()}`;
  }
  if (words[0].toLowerCase() === 'series' && words.length > 1) {
    return `Series ${words.slice(1).join(' ').toUpperCase()}`;
  }
  const text = words.join(' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
