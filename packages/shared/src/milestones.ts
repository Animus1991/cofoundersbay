/** One step of a milestone's checklist. The id keeps a tick on the right step when the list changes. */
export type MilestoneStep = { id: string; text: string; done: boolean };

export const MILESTONE_STEP_LIMITS = { steps: 30, text: 200 } as const;

/** The share of the steps that are done, the number the progress bar shows. */
export function stepsProgress(steps: readonly MilestoneStep[]): number {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
}

/**
 * Steps as they are stored, or null when the value is not a list of them.
 * Text is trimmed; a blank step or one past the limits is refused rather than
 * cut short, so what was sent is what is kept.
 */
export function readMilestoneSteps(raw: unknown): MilestoneStep[] | null {
  if (!Array.isArray(raw) || raw.length > MILESTONE_STEP_LIMITS.steps) return null;
  const steps: MilestoneStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const { id, text, done } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !id || typeof text !== 'string' || typeof done !== 'boolean') return null;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MILESTONE_STEP_LIMITS.text) return null;
    steps.push({ id, text: trimmed, done });
  }
  return new Set(steps.map((step) => step.id)).size === steps.length ? steps : null;
}
