'use client';

import Link from 'next/link';
import { Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SampleDataNoticeProps = {
  surface: string;
  detail: string;
  askAiPrompt: string;
  className?: string;
};

/** Honest banner for screens that still render sample items instead of a live SoT. */
export function SampleDataNotice({ surface, detail, askAiPrompt, className }: SampleDataNoticeProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Info className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{surface} is showing sample items</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
        <Link href={`/ai?q=${encodeURIComponent(askAiPrompt)}`}>
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          Ask AI
        </Link>
      </Button>
    </div>
  );
}
