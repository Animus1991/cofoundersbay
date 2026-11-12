'use client';

import { Loader2 } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { phaseLabel, phasePercent, type AssistantPhase } from '@/lib/assistant-progress';

/**
 * The wait for an answer, named stage by stage (docs §122).
 *
 * One line says what is happening now - reading the question, reading your
 * milestones (2/3), writing the answer - and a thin bar says how far along
 * the turn is. The stages are the turn's own: the engine reports each read
 * before it runs, so the line never names a step that did not happen. With no
 * phase yet (the demo, or a turn that answers whole) it says the first stage.
 */
export function AssistantWorking({ phase }: { phase: AssistantPhase | null }) {
  const current: AssistantPhase = phase ?? { kind: 'planning' };
  const label = phaseLabel(current);
  const percent = phasePercent(current);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={bilingualAria(label.en, label.el)}
      aria-label={bilingualAria('The assistant is working', 'Ο βοηθός εργάζεται')}
      className="space-y-1.5"
      data-assistant-phase={current.kind}
    >
      <div className="type-ui flex items-center gap-2 text-muted-foreground" aria-live="polite">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <BilingualText en={label.en} el={label.el} compact />
      </div>
      <div className="h-1 w-full max-w-[14rem] overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
