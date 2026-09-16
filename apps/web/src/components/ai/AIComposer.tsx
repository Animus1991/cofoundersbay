'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { cn } from '@/lib/utils';

/**
 * Inline Ask AI field. Submits to `/ai?q=` so the assistant page and the
 * chat bubble stay the real surfaces — this is an entry, not a replacement.
 */
export function AIComposer({
  prompt,
  className,
}: {
  prompt: string;
  className?: string;
}) {
  const router = useRouter();
  const sayOne = useBilingualString();
  const [value, setValue] = useState('');

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const q = value.trim() || prompt;
    router.push(`/ai?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex min-w-0 w-full items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2 py-1 sm:max-w-[16.5rem]',
        className,
      )}
    >
      <CfbGlyph name="spark" className="icon-sm shrink-0 text-primary-accessible" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={sayOne('Ask AI…', 'Ρωτήστε το AI…')}
        aria-label={bilingualAria('Ask AI', 'Ρωτήστε το AI')}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary-accessible hover:bg-primary/10"
      >
        {sayOne('Ask', 'Ρώτα')}
      </button>
    </form>
  );
}
