/**
 * Theme-aware semantic status colors.
 *
 * Use these instead of hardcoded Tailwind palette classes (e.g. text-emerald-600)
 * so status hues stay consistent while foreground/background contrast adapts across
 * light, dark, alliance, cofounder, and system themes.
 *
 * CSS variables are defined in globals.css; Tailwind tokens in tailwind.config.ts.
 */

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';

export type StatusChipClasses = {
  bg: string;
  text: string;
  border: string;
  /** bg + text + border — for badges, chips, icon wraps */
  chip: string;
  /** text only — for icons, stat numbers, inline emphasis */
  icon: string;
};

/** Canonical class sets per semantic tone — safe for Tailwind JIT (no dynamic strings). */
export const STATUS: Record<StatusTone, StatusChipClasses> = {
  success: {
    bg: 'bg-status-success-bg',
    text: 'text-status-success',
    border: 'border-status-success-border',
    chip: 'bg-status-success-bg text-status-success border-status-success-border/40',
    icon: 'text-status-success',
  },
  warning: {
    bg: 'bg-status-warning-bg',
    text: 'text-status-warning',
    border: 'border-status-warning-border',
    chip: 'bg-status-warning-bg text-status-warning border-status-warning-border/40',
    icon: 'text-status-warning',
  },
  danger: {
    bg: 'bg-status-danger-bg',
    text: 'text-status-danger',
    border: 'border-status-danger-border',
    chip: 'bg-status-danger-bg text-status-danger border-status-danger-border/40',
    icon: 'text-status-danger',
  },
  info: {
    bg: 'bg-status-info-bg',
    text: 'text-status-info',
    border: 'border-status-info-border',
    chip: 'bg-status-info-bg text-status-info border-status-info-border/40',
    icon: 'text-status-info',
  },
  accent: {
    bg: 'bg-status-accent-bg',
    text: 'text-status-accent',
    border: 'border-status-accent-border',
    chip: 'bg-status-accent-bg text-status-accent border-status-accent-border/40',
    icon: 'text-status-accent',
  },
  neutral: {
    bg: 'bg-status-neutral-bg',
    text: 'text-status-neutral',
    border: 'border-status-neutral-border',
    chip: 'bg-status-neutral-bg text-status-neutral border-status-neutral-border/40',
    icon: 'text-status-neutral',
  },
};

/** Trend / delta indicators (up = success, down = danger). */
export const TREND = {
  up: STATUS.success.icon,
  down: STATUS.danger.icon,
  flat: 'text-muted-foreground',
} as const;

/** 0–10 score text class (≥8 success, ≥6 warning, else danger). */
export function scoreTenPointClass(score: number): string {
  if (score >= 8) return STATUS.success.text;
  if (score >= 6) return STATUS.warning.text;
  return STATUS.danger.text;
}

/** Map common entity/category labels to a semantic tone (groups, org lists, etc.). */
export const CATEGORY_TONE: Record<string, StatusTone> = {
  industry: 'info',
  stage: 'warning',
  role: 'accent',
  learning: 'success',
  tech: 'info',
  marketing: 'accent',
  design: 'accent',
  finance: 'warning',
  product: 'info',
  operations: 'neutral',
  legal: 'neutral',
};

export function categoryChip(category: string): StatusChipClasses {
  const tone = CATEGORY_TONE[category.toLowerCase()] ?? 'info';
  return STATUS[tone];
}
