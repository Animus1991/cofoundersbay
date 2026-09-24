'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CopilotCitation } from '@/lib/copilot-types';

export function CitationChip({ citation }: { citation: CopilotCitation }) {
  const className = cn(
    'inline-flex items-center rounded-full border-0 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700',
    'dark:bg-violet-950/40 dark:text-violet-300',
  );

  if (citation.href) {
    return (
      <Link href={citation.href} className={cn(className, 'hover:bg-violet-100 dark:hover:bg-violet-900/50')}>
        {citation.label}
      </Link>
    );
  }

  return <span className={className}>{citation.label}</span>;
}
