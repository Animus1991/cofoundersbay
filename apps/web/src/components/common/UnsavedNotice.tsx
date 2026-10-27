'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { formatLocalTime } from '@/lib/i18n/format';
import type { StoredDraft } from '@/lib/unsaved-changes';

/**
 * A draft of this form from an earlier visit in this tab, offered back.
 * Nothing changes until the reader chooses: the saved version may have moved
 * on since, so the draft is never applied on its own.
 */
export function DraftOffer<T>({
  offer,
  onRestore,
  onDiscard,
}: {
  offer: StoredDraft<T> | null;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  if (!offer) return null;
  const sameDay = new Date(offer.at).toDateString() === new Date().toDateString();
  const when = {
    en: sameDay ? `at ${formatLocalTime(offer.at, 'en')}` : 'on an earlier day',
    el: sameDay ? `στις ${formatLocalTime(offer.at, 'el')}` : 'σε προηγούμενη μέρα',
  };
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-primary-muted bg-primary-subtle px-4 py-3 text-sm"
    >
      <RotateCcw className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-snug">
        <BilingualText
          en={`You left this form ${when.en} with changes that were not saved.`}
          el={`Αφήσατε αυτή τη φόρμα ${when.el} με αλλαγές που δεν αποθηκεύτηκαν.`}
          wrap
        />
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
          <BilingualText en="Discard" el="Απόρριψη" compact />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onRestore}>
          <BilingualText en="Restore my changes" el="Επαναφορά των αλλαγών" compact />
        </Button>
      </div>
    </div>
  );
}

/**
 * Said beside the form's save button while there is something to save, so
 * the question before leaving never comes as a surprise.
 */
export function UnsavedMark({ dirty, className }: { dirty: boolean; className?: string }) {
  return (
    <span role="status" aria-live="polite" className={className}>
      {dirty ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning-mark" aria-hidden="true" />
          <BilingualText en="Unsaved changes" el="Μη αποθηκευμένες αλλαγές" compact />
        </span>
      ) : null}
    </span>
  );
}
