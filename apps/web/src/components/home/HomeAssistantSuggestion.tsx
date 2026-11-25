'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { listEvents } from '@/lib/api';
import { homeSuggestions, readSnoozed, SNOOZE_MS, SUGGESTION_STORAGE_KEY, type SuggestionPerson } from '@/lib/home-suggestion';
import { bilingualAria } from '@/lib/i18n/format';
import { usePageControls, usePageList } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';

/**
 * The assistant offers one thing before it is asked (docs §142, after Parea's
 * proactive cards): one sentence, a yes that asks the assistant in place, and
 * "Not now", which puts it away for a week and shows the next. The choice is
 * lib/home-suggestion's; this is only the card.
 */
export function HomeAssistantSuggestion({ people, shownAbove, connectionOf, className }: {
  people: readonly SuggestionPerson[];
  shownAbove: ReadonlySet<string>;
  connectionOf: (userId: string) => 'none' | 'sent' | 'received' | 'connected';
  /** On the section itself: an empty wrapper would still take a gap. */
  className?: string;
}) {
  const { ask } = useAskAssistant();
  // The strip's own read, under its key: one request for both.
  const { data } = useQuery({
    queryKey: qk('events', 'home-strip'),
    queryFn: () => listEvents({ scope: 'upcoming', limit: 6 }),
    staleTime: 60_000,
    retry: 0,
  });
  const [now] = useState(() => new Date());
  // Read after mount: storage is the browser's, and the first paint matches the server's.
  const [snoozed, setSnoozed] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem(SUGGESTION_STORAGE_KEY); } catch { /* private mode */ }
    setSnoozed(readSnoozed(raw, Date.now()));
  }, []);

  const suggestion = useMemo(() => {
    if (!snoozed) return null;
    return homeSuggestions({ events: data?.events ?? [], people, shownAbove, connectionOf, now }).find((s) => !snoozed[s.id]) ?? null;
  }, [snoozed, data, people, shownAbove, connectionOf, now]);

  const putAway = (id: string) => {
    const next = { ...(snoozed ?? {}), [id]: Date.now() + SNOOZE_MS };
    setSnoozed(next);
    try { localStorage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  // The assistant knows what it offered here, and can answer it or put it away.
  usePageList(suggestion ? [{
    id: 'assistant_suggestion',
    labelEn: 'The assistant suggests',
    labelEl: 'Ο βοηθός προτείνει',
    rows: [suggestion.en],
    rowsEl: [suggestion.el],
  }] : []);
  usePageControls(suggestion ? [{
    id: 'dismiss_suggestion',
    labelEn: 'Not now: put the suggestion away for a week',
    labelEl: 'Όχι τώρα: η πρόταση φεύγει για μια εβδομάδα',
    writes: false,
    run: () => putAway(suggestion.id),
  }] : []);

  if (!suggestion) return null;
  return (
    <section aria-labelledby="home-suggestion" data-home-suggestion={suggestion.id} className={className}>
      <Card className="border-primary-muted bg-primary-subtle">
        <CardContent className="space-y-3">
          <p id="home-suggestion" className="flex items-center gap-2 text-sm font-medium text-primary-accessible">
            <span data-keep-icon="" className="inline-flex" aria-hidden="true"><CfbGlyph name="spark" className="icon-sm" /></span>
            <BilingualText en="The assistant suggests" el="Ο βοηθός προτείνει" compact />
          </p>
          <p className="card-body text-foreground">
            <BilingualText en={suggestion.en} el={suggestion.el} wrap />
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                putAway(suggestion.id);
                ask(suggestion.prompt);
              }}
              data-testid="home-suggestion-yes"
            >
              <BilingualText en={suggestion.yes.en} el={suggestion.yes.el} compact />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => putAway(suggestion.id)}
              aria-label={bilingualAria(`Not now: ${suggestion.en}`, `Όχι τώρα: ${suggestion.el}`)}
              data-testid="home-suggestion-later"
            >
              <BilingualText en="Not now" el="Όχι τώρα" compact />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
