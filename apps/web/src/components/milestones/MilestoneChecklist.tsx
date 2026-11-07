'use client';

import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { MILESTONE_STEP_LIMITS, type MilestoneStep } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

/**
 * What finishing a milestone takes, in steps. Once there are steps they move
 * the progress bar, so the figure on the card is a fact rather than a guess.
 * Closed by default: a card with no open steps reads as it did.
 */
export function MilestoneChecklist({ steps, onChange }: { steps: MilestoneStep[]; onChange: (next: MilestoneStep[]) => void }) {
  const say = useBilingualString();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const done = steps.filter((step) => step.done).length;
  const full = steps.length >= MILESTONE_STEP_LIMITS.steps;

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed || full) return;
    onChange([...steps, { id: `step-${Date.now().toString(36)}-${steps.length}`, text: trimmed, done: false }]);
    setText('');
  };

  return (
    <div data-milestone-checklist="">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight data-keep-icon className={cn('icon-xs transition-transform', open && 'rotate-90')} aria-hidden="true" />
        {steps.length > 0
          ? <BilingualText en={`Steps ${done} of ${steps.length}`} el={`Βήματα ${done} από ${steps.length}`} compact />
          : <BilingualText en="Add steps" el="Προσθήκη βημάτων" compact />}
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          {steps.length > 0 ? (
            <ul className="space-y-1">
              {steps.map((step) => (
                <li key={step.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`step-${step.id}`}
                    className="mt-0.5"
                    checked={step.done}
                    onCheckedChange={(checked) => onChange(steps.map((item) => (item.id === step.id ? { ...item, done: checked === true } : item)))}
                  />
                  <label htmlFor={`step-${step.id}`} className={cn('min-w-0 flex-1 text-sm', step.done ? 'text-muted-foreground' : 'text-foreground')}>
                    {step.text}
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange(steps.filter((item) => item.id !== step.id))}
                    aria-label={bilingualAria(`Remove step: ${step.text}`, `Αφαίρεση βήματος: ${step.text}`)}
                    className="shrink-0 rounded text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="icon-xs" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => { event.preventDefault(); add(); }}
          >
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={MILESTONE_STEP_LIMITS.text}
              disabled={full}
              placeholder={say('One step', 'Ένα βήμα')}
              aria-label={bilingualAria('New step', 'Νέο βήμα')}
            />
            <Button type="submit" size="sm" variant="outline" disabled={full || !text.trim()}>
              <BilingualText en="Add" el="Προσθήκη" compact />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
