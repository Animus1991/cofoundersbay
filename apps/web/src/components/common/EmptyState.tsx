'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import type { AskPrompt } from '@/lib/page-questions';
import { BilingualText } from '@/components/common/BilingualText';

type IllustrationType = 'search' | 'connection' | 'message' | 'rocket' | 'profile' | 'calendar' | 'default';

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  illustration?: IllustrationType;
  size?: 'sm' | 'md' | 'lg';
  /** Secondary Ask AI action — never replaces the primary `action`. A pair from `lib/page-questions`. */
  askAiPrompt?: AskPrompt;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  size = 'md',
  askAiPrompt,
}: EmptyStateProps) {
  const { ask, hrefFor, inPlace } = useAskAssistant();
  const sizeClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card/80 text-left',
        sizeClasses[size],
        className,
      )}
    >
      <div className="relative space-y-4">
        <div className="space-y-2">
          <p className="max-w-prose break-words text-base font-semibold leading-snug">{title}</p>
          {/* card-body: a step under the title on a phone too, where text-sm
              (14.91) sat 0.07px under the title's 14.98. */}
          {description && <p className="card-body max-w-prose break-words text-muted-foreground">{description}</p>}
        </div>
        {(action || askAiPrompt) && (
          <div className="flex flex-wrap items-center justify-start gap-2 pt-2" data-actions="">
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
