'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/common/I18nProvider';
import { bilingualAria } from '@/lib/i18n/format';
import { BilingualText } from '@/components/common/BilingualText';

type SampleDataNoticeProps = {
  surface: string;
  detail: string;
  askAiPrompt: string;
  className?: string;
};

/** Compact honesty pill. Expands to the full note; Ask AI stays a text link. */
export function SampleDataNotice({ surface, detail, askAiPrompt, className }: SampleDataNoticeProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const title = t('{surface} is showing sample items', { surface: t(surface) });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={bilingualAria(title, title)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
          className,
        )}
      >
        <Info className="icon-sm" aria-hidden="true" />
        <BilingualText en="Sample data" el="Δείγμα δεδομένων" compact />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <Info className="mt-0.5 icon-sm shrink-0 text-primary-accessible" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t(detail)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/ai?q=${encodeURIComponent(askAiPrompt)}`}
          className="text-xs font-medium text-primary-accessible hover:underline"
        >
          <BilingualText en="Ask AI" el="Ρώτα το AI" compact />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={bilingualAria('Dismiss sample-data notice', 'Απόρριψη ειδοποίησης δείγματος')}
          className="rounded-xl p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="icon-sm" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
