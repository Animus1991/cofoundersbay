'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePopupChatOptional } from '@/contexts/PopupChatContext';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import type { AskPrompt } from '@/lib/page-questions';
import { confirmLeave, hasUnsavedChanges } from '@/lib/unsaved-changes';

/** The router, or null where none is mounted (a card rendered on its own, in a test or a preview). */
function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

/**
 * Asks the assistant from anywhere on a page, in the reader's language.
 *
 * Eight places asked it their own way (the header's field, empty states,
 * "Sample data" notes, the founder home's cards, readiness, Builder, the
 * programmes card, the AI insight chips): each read the popup, fell back to
 * `/ai?q=`, and sent the English sentence it held - and the insight chips
 * always left the page for /ai, dropping the context the assistant reads.
 * They ask through this now, so a pair from `lib/page-questions` goes out in
 * the reader's language, and the in-page assistant - which keeps the page's
 * context - is used whenever it exists.
 */
export function useAskAssistant() {
  const popup = usePopupChatOptional();
  const router = useSafeRouter();
  const pathname = usePathname();
  const sayOne = useBilingualString();

  const textOf = useCallback(
    (prompt: AskPrompt) => (typeof prompt === 'string' ? prompt : sayOne(prompt.en, prompt.el)),
    [sayOne],
  );
  const hrefFor = useCallback((prompt?: AskPrompt) => (prompt ? `/ai?q=${encodeURIComponent(textOf(prompt))}` : '/ai'), [textOf]);
  // On /ai itself the page is the assistant: the question goes to it.
  const inPlace = Boolean(popup) && !pathname?.startsWith('/ai');
  const ask = useCallback(
    (prompt: AskPrompt) => {
      const text = textOf(prompt);
      const href = `/ai?q=${encodeURIComponent(text)}`;
      if (popup && !pathname?.startsWith('/ai')) popup.ask(text);
      // Opening /ai leaves the page: a form with unsaved work asks first (docs §105).
      else if (router && !hasUnsavedChanges()) router.push(href);
      else if (router) void confirmLeave(href).then((ok) => { if (ok) router.push(href); });
      else if (typeof window !== 'undefined') window.location.href = href;
    },
    [popup, pathname, router, textOf],
  );

  return { ask, textOf, hrefFor, inPlace };
}
