/**
 * What the assistant is doing while an answer is on its way.
 *
 * A turn has up to four stages: the planner reads the question, the reads it
 * chose run one after another, the model writes, and a read the model asked
 * for on its own may run after that. Until docs §122 the whole wait was one
 * line, "Working across your graph…", and a six-second turn that read four
 * areas looked the same as one that had stalled. The prototype in
 * `Animus1991/stoixos` names each stage of its AI review with a percentage
 * (`AI_ANALYSIS_PROGRESS_STEPS`); here the stages come from the turn itself,
 * and the read's name from the shared declaration, so the line never claims a
 * step the engine did not run.
 *
 * Pure: `useAIChat` sets the phase, `AssistantWorking` renders it.
 */
import { getActionDeclaration } from '@cofounderbay/shared';
import type { BilingualPair } from '@/lib/i18n/types';

export type AssistantPhaseKind = 'planning' | 'reading' | 'writing' | 'reading_more';

export type AssistantPhase = {
  kind: AssistantPhaseKind;
  /** The capability being read, when the phase is a read. */
  tool?: string;
  /** This read's place among the reads of the turn, 1-based. */
  index?: number;
  total?: number;
};

/** A read the engine is about to run; the engine reports it, the hook shows it. */
export type AssistantReadEvent = { tool: string; index: number; total: number };

/**
 * The English labels are imperatives ("Read your milestones"); the line
 * shows what is happening now. Greek labels are nouns already ("Ανάγνωση των
 * ορόσημών σου") and read as a progress line verbatim.
 */
const EN_PROGRESSIVE: ReadonlyArray<readonly [string, string]> = [
  ['Read ', 'Reading '],
  ['Search ', 'Searching '],
  ['Get ', 'Getting '],
  ['Explain ', 'Explaining '],
  ['Find ', 'Finding '],
  ['Check ', 'Checking '],
];

const UNKNOWN_READ: BilingualPair = { en: 'Reading the platform', el: 'Ανάγνωση της πλατφόρμας' };

/** "Reading your milestones" / "Ανάγνωση των ορόσημών σου" for a declared read. */
export function readLabel(tool: string | undefined): BilingualPair {
  if (!tool) return UNKNOWN_READ;
  const declaration = getActionDeclaration(tool);
  if (!declaration) return UNKNOWN_READ;
  const { en, el } = declaration.label;
  const progressive = EN_PROGRESSIVE.find(([imperative]) => en.startsWith(imperative));
  return {
    en: progressive ? progressive[1] + en.slice(progressive[0].length) : `Reading: ${en}`,
    el,
  };
}

export function phaseLabel(phase: AssistantPhase): BilingualPair {
  switch (phase.kind) {
    case 'planning':
      return { en: 'Reading your question', el: 'Ανάγνωση της ερώτησής σας' };
    case 'writing':
      return { en: 'Writing the answer', el: 'Σύνταξη της απάντησης' };
    case 'reading':
    case 'reading_more': {
      const read = readLabel(phase.tool);
      const count = phase.total && phase.total > 1 && phase.index ? ` (${phase.index}/${phase.total})` : '';
      return { en: read.en + count, el: read.el + count };
    }
  }
}

/**
 * Where the turn is, 0–100, for the progress bar's `aria-valuenow`. The reads
 * share the middle band; a turn with no reads jumps from 15 to 80. Monotonic
 * within a turn: a later phase is never a smaller number.
 */
export function phasePercent(phase: AssistantPhase): number {
  switch (phase.kind) {
    case 'planning':
      return 15;
    case 'reading': {
      const total = Math.max(1, phase.total ?? 1);
      const index = Math.min(total, Math.max(1, phase.index ?? 1));
      return Math.round(15 + (60 * index) / total);
    }
    case 'writing':
      return 80;
    case 'reading_more':
      return 90;
  }
}
