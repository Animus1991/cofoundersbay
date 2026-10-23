'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { COMPAT_COPY, COMPAT_QUESTIONS } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { getMyCompatibility, saveMyCompatibility } from '@/lib/api';
import { usePageControls } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';

/** The option value a page control uses for "not answered". */
const CLEAR = 'clear';

/**
 * The compatibility questions in Settings (`#how-you-work`).
 *
 * Each answer saves when it is pressed, and pressing it again clears it, so
 * there is no form to lose. The assistant sets the same answers through one
 * page control per question, with the previous answer as its undo.
 */
export function CompatibilityCard() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const mine = useQuery({ queryKey: qk('compatibility', 'me'), queryFn: getMyCompatibility, retry: 1 });
  const answers = mine.data?.answers ?? {};
  const [saved, setSaved] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => saveMyCompatibility({ [id]: value }),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(qk('compatibility', 'me'), data);
      // A comparison on an open match page reads these answers too.
      void queryClient.invalidateQueries({ queryKey: qk('compatibility') });
      void queryClient.invalidateQueries({ queryKey: qk('matching') });
      setSaved(id);
    },
    onError: (err) => showError('Could not save the answer', err instanceof Error ? err.message : undefined),
  });

  usePageControls(
    COMPAT_QUESTIONS.map((q) => ({
      id: `compat_${q.id}`,
      labelEn: q.question.en,
      labelEl: q.question.el,
      writes: true,
      options: [
        ...q.options.map((o) => ({ value: o.value, labelEn: o.label.en, labelEl: o.label.el })),
        { value: CLEAR, labelEn: 'Not answered', labelEl: 'Χωρίς απάντηση' },
      ],
      current: answers[q.id] || CLEAR,
      unavailableEn: mine.data ? undefined : 'Your answers have not loaded.',
      unavailableEl: mine.data ? undefined : 'Οι απαντήσεις σας δεν φορτώθηκαν.',
      run: async (v?: string) => {
        await save.mutateAsync({ id: q.id, value: !v || v === CLEAR ? '' : v });
      },
      // Setting the answer it had restores exactly what the command changed.
      undo: () => ({ control: `compat_${q.id}`, value: answers[q.id] || CLEAR }),
    })),
  );

  const answered = mine.data?.answered ?? 0;
  const total = mine.data?.total ?? COMPAT_QUESTIONS.length;

  return (
    <Card id="how-you-work" className="scroll-mt-16">
      <CardHeader>
        <CardTitle>
          <BilingualText en={COMPAT_COPY.title.en} el={COMPAT_COPY.title.el} compact />
        </CardTitle>
        <CardDescription>
          <BilingualText en={COMPAT_COPY.intro.en} el={COMPAT_COPY.intro.el} wrap />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {mine.isError && !mine.data ? (
          // "0 of 10 answered" over answers that were not read (docs §89).
          <div className="space-y-2">
            <p role="alert" className="text-sm text-muted-foreground">
              <BilingualText en="Your answers could not be read just now." el="Οι απαντήσεις σας δεν διαβάστηκαν αυτή τη στιγμή." wrap />
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void mine.refetch()} disabled={mine.isFetching}>
              <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
            </Button>
          </div>
        ) : (
        <>
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          <BilingualText
            en={`${answered} of ${total} answered${saved ? '. Saved.' : '. Each answer saves when you press it; press it again to clear it.'}`}
            el={`${answered} από ${total} απαντημένες${saved ? '. Αποθηκεύτηκε.' : '. Κάθε απάντηση αποθηκεύεται όταν την πατάτε· πατήστε ξανά για να τη σβήσετε.'}`}
            wrap
          />
        </p>
        {/* Two columns from `lg`. The card spans the page now; ten questions one
            under another would leave the right half of every row blank. */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-2">
          {COMPAT_QUESTIONS.map((q) => (
            <fieldset key={q.id} className="min-w-0 space-y-2">
              <legend className="text-sm font-medium text-foreground">
                <BilingualText en={q.question.en} el={q.question.el} wrap />
              </legend>
              <p className="text-xs text-muted-foreground">
                <BilingualText en={q.why.en} el={q.why.el} wrap />
              </p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const on = answers[q.id] === o.value;
                  return (
                    <Button
                      key={o.value}
                      type="button"
                      size="sm"
                      variant={on ? 'secondary' : 'outline'}
                      aria-pressed={on}
                      disabled={!mine.data || save.isPending}
                      onClick={() => save.mutate({ id: q.id, value: on ? '' : o.value })}
                    >
                      <BilingualText en={o.label.en} el={o.label.el} compact />
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
