'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import type { AskPrompt } from '@/lib/page-questions';
import { BilingualText } from '@/components/common/BilingualText';
import { EmptyIllustration, type IllustrationType } from '@/components/common/EmptyIllustration';

/** The disc's tint by the illustration the caller names (B1.4). */
const DISC_TONE: Record<NonNullable<EmptyStateProps['illustration']>, string> = {
  search: 'bg-status-info-bg',
  connection: 'bg-status-accent-bg',
  message: 'bg-status-accent-bg',
  rocket: 'bg-status-success-bg',
  profile: 'bg-status-info-bg',
  calendar: 'bg-status-warning-bg',
  default: 'bg-status-accent-bg',
};

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Decorative mark beside the sentence; `null` keeps the state text-only. */
  illustration?: IllustrationType | null;
  size?: 'sm' | 'md' | 'lg';
  /** Secondary Ask AI action — never replaces the primary `action`. A pair from `lib/page-questions`. */
  askAiPrompt?: AskPrompt;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  illustration = 'default',
  size = 'md',
  askAiPrompt,
}: EmptyStateProps) {
  const { ask, hrefFor, inPlace } = useAskAssistant();
  const sizeClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card/80 text-center',
        sizeClasses[size],
        className,
      )}
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* data-keep-icon: the Cursor rule hides a lone cfb-glyph in
            #main-content; this mark is the state's sentence made visible.
            B1.4: the illustration sits on a tinted disc, then the title,
            then the one call to action. */}
        {illustration && (
          <div
            data-keep-icon=""
            className={cn(
              // 96px, from 160: the disc was the largest thing in the empty
              // state, above the sentence and the one action that are its
              // point (docs §156).
              'flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-muted-foreground',
              DISC_TONE[illustration],
            )}
          >
            <div className="h-16 w-16">
              <EmptyIllustration type={illustration} />
            </div>
          </div>
        )}
        <div className="min-w-0 max-w-prose space-y-2">
          <p className="break-words text-base font-semibold leading-snug">{title}</p>
          {/* card-body: a step under the title on a phone too, where text-sm
              (14.91) sat 0.07px under the title's 14.98. */}
          {description && <p className="card-body break-words text-muted-foreground">{description}</p>}
        </div>
        {(action || askAiPrompt) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2" data-actions="">
            {action}
            {askAiPrompt && (inPlace ? (
              <Button variant="outline" size="sm" onClick={() => ask(askAiPrompt)}>
                <BilingualText en="Ask AI" el="Ρωτήστε το AI" compact />
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={hrefFor(askAiPrompt)}>
                  <BilingualText en="Ask AI" el="Ρωτήστε το AI" compact />
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
