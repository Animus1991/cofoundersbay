'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { ASSISTANT_FEEDBACK_COPY, ASSISTANT_FEEDBACK_REASONS, type AssistantFeedbackReason } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { useToast } from '@/components/ui/toast';
import { clearAnswerFeedback, setAnswerFeedback } from '@/lib/api';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

type Vote = { helpful: boolean; reason?: AssistantFeedbackReason };

const STORE = 'cfb:answer-votes';
/** Enough for any open conversation; the verdicts themselves live on the server. */
const REMEMBERED = 200;

function readVotes(): Record<string, Vote> {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORE) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Vote>) : {};
  } catch {
    return {};
  }
}

function remember(answerId: string, vote: Vote | null) {
  try {
    const { [answerId]: _replaced, ...others } = readVotes();
    const next = vote ? { ...others, [answerId]: vote } : others;
    const kept = Object.entries(next).slice(-REMEMBERED);
    window.localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Storage blocked: the verdict is on the server, the thumb forgets it on reload.
  }
}

const THUMB = 'tap-target inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground';

/**
 * 👍 / 👎 under an answer (docs §54.7 #5, §111), beside Copy.
 *
 * The verdict is the member's last word on this answer: the other thumb
 * changes it and the same thumb takes it back. A 👎 offers the reasons from
 * the fixed list; choosing one is optional. Only the verdict, the reason and
 * which assistant answered leave the browser, and the transparency report
 * counts them. The thumbs show the verdict at once and go back if the save
 * fails, so what is on screen is what the server holds.
 */
export function AnswerFeedback({ answerId, source }: { answerId: string; source: string }) {
  const [vote, setVote] = useState<Vote | null>(() => readVotes()[answerId] ?? null);
  const { error: showError } = useToast();

  const save = async (next: Vote | null) => {
    const previous = vote;
    setVote(next);
    remember(answerId, next);
    try {
      if (next) await setAnswerFeedback(answerId, { ...next, source });
      else await clearAnswerFeedback(answerId);
    } catch (err) {
      setVote(previous);
      remember(answerId, previous);
      showError('Could not save your rating', err instanceof Error ? err.message : undefined);
    }
  };

  const helpfulLabel = bilingualAria('Helpful answer', 'Χρήσιμη απάντηση');
  const unhelpfulLabel = bilingualAria('Not a helpful answer', 'Όχι χρήσιμη απάντηση');

  return (
    <>
      <button
        type="button"
        aria-pressed={vote?.helpful === true}
        onClick={() => void save(vote?.helpful === true ? null : { helpful: true })}
        className={cn(THUMB, vote?.helpful === true ? 'bg-muted text-foreground' : 'text-muted-foreground')}
        title={helpfulLabel}
        aria-label={helpfulLabel}
      >
        <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-pressed={vote?.helpful === false}
        onClick={() => void save(vote?.helpful === false ? null : { helpful: false })}
        className={cn(THUMB, vote?.helpful === false ? 'bg-muted text-foreground' : 'text-muted-foreground')}
        title={unhelpfulLabel}
        aria-label={unhelpfulLabel}
      >
        <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {vote?.helpful === false ? (
        <div role="group" aria-label={bilingualAria('What was wrong?', 'Τι δεν πήγε καλά;')} className="flex basis-full flex-wrap items-center gap-1.5 pt-1">
          <span className="type-caption text-muted-foreground"><BilingualText en="What was wrong?" el="Τι δεν πήγε καλά;" compact /></span>
          {ASSISTANT_FEEDBACK_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              aria-pressed={vote.reason === reason}
              onClick={() => void save({ helpful: false, ...(vote.reason === reason ? {} : { reason }) })}
              className={cn(
                'tap-target-y rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-muted',
                vote.reason === reason ? 'bg-muted text-foreground' : 'text-muted-foreground',
              )}
            >
              <BilingualText en={ASSISTANT_FEEDBACK_COPY.reasons[reason].en} el={ASSISTANT_FEEDBACK_COPY.reasons[reason].el} compact />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
