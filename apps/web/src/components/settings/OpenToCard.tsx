'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Compass } from 'lucide-react';
import {
  OPEN_TO_COPY,
  OPEN_TO_DAYS,
  OPEN_TO_KINDS,
  OPEN_TO_NOTE_MAX,
  OPEN_TO_VISIBILITIES,
  OPEN_TO_VISIBILITY_COPY,
  type OpenToKind,
  type OpenToVisibility,
} from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { commitmentRefusal } from '@/lib/commitments-api';
import { clearOpenTo, getMyOpenTo, setOpenTo } from '@/lib/open-to-api';
import { qk } from '@/lib/query-keys';

/**
 * "Open to" on one's own profile (docs §99; it was in Settings): what this person would take on, and who may see it.
 *
 * The default is matching-only, so saving changes ranking and nothing anyone
 * can see. The signal lasts 90 days; saving again renews it.
 */
export function OpenToCard() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const mine = useQuery({ queryKey: qk('open-to', 'me'), queryFn: getMyOpenTo });
  const [kinds, setKinds] = useState<OpenToKind[]>([]);
  const [visibility, setVisibility] = useState<OpenToVisibility>('nobody');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<{ en: string; el: string } | null>(null);
  const signal = mine.data?.signal ?? null;

  useEffect(() => {
    if (!signal) return;
    setKinds(signal.kinds);
    setVisibility(signal.visibility);
    setNote(signal.note ?? '');
  }, [signal]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: qk('open-to') });
  const save = useMutation({
    mutationFn: () => setOpenTo({ kinds, visibility, note }),
    onSuccess: () => {
      setProblem(null);
      void refresh();
      success('Open to saved');
    },
    onError: (err) => {
      const r = commitmentRefusal(err);
      setProblem({ en: r.en, el: r.el });
    },
  });
  const clear = useMutation({
    mutationFn: clearOpenTo,
    onSuccess: () => {
      setKinds([]);
      setNote('');
      setVisibility('nobody');
      void refresh();
    },
    onError: () => showError('Could not remove it'),
  });

  const settled = mine.isFetched && !mine.isLoading;
  const toggle = (k: OpenToKind) => {
    if (!settled) return;
    setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };
  const lapsed = signal && !mine.data?.active;

  return (
    <Card id="open-to" className="scroll-mt-16">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="icon-md text-primary-accessible" aria-hidden="true" />
          <BilingualText en="Open to" el="Ανοιχτός/ή σε" compact />
        </CardTitle>
        <CardDescription>
          <BilingualText
            en={`What you would take on. It helps the right people find you; who sees it is your choice. It lasts ${OPEN_TO_DAYS} days unless you renew it.`}
            el={`Τι θα αναλαμβάνατε. Βοηθά να σας βρουν οι κατάλληλοι· ποιος το βλέπει το επιλέγετε εσείς. Ισχύει ${OPEN_TO_DAYS} ημέρες, εκτός αν το ανανεώσετε.`}
            wrap
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {mine.isError && !mine.data ? (
          // An empty form here would save over a signal that was simply not
          // read; a failed read is said as one (docs §89).
          <div className="space-y-2">
            <p role="alert" className="text-sm text-muted-foreground">
              <BilingualText en="What you are open to could not be read just now." el="Το σε τι είστε ανοιχτός/ή δεν διαβάστηκε αυτή τη στιγμή." wrap />
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void mine.refetch()} disabled={mine.isFetching}>
              <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
            </Button>
          </div>
        ) : (
        <>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground"><BilingualText en="I am open to" el="Είμαι ανοιχτός/ή σε" compact /></legend>
          <div className="flex flex-wrap gap-2">
            {OPEN_TO_KINDS.map((k) => (
              <Button key={k} type="button" size="sm" variant={kinds.includes(k) ? 'secondary' : 'outline'} aria-pressed={kinds.includes(k)} onClick={() => toggle(k)}>
                <BilingualText en={OPEN_TO_COPY[k].en} el={OPEN_TO_COPY[k].el} compact />
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground"><BilingualText en="Who sees it" el="Ποιος το βλέπει" compact /></legend>
          {/* One choice per row: the card is half the page on a desktop, and
              three columns by the window's width squeezed the titles until
              "Μόνο για τις αντιστοιχίσεις" ran over its neighbour. */}
          <div className="grid grid-cols-1 gap-2">
            {OPEN_TO_VISIBILITIES.map((v) => (
              <label key={v} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary/40">
                <input type="radio" name="open-to-visibility" className="mt-1" checked={visibility === v} onChange={() => setVisibility(v)} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground"><BilingualText en={OPEN_TO_VISIBILITY_COPY[v].en} el={OPEN_TO_VISIBILITY_COPY[v].el} wrap /></span>
                  <span className="block text-xs text-muted-foreground"><BilingualText en={OPEN_TO_VISIBILITY_COPY[v].hintEn} el={OPEN_TO_VISIBILITY_COPY[v].hintEl} wrap /></span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="open-to-note"><BilingualText en="A short note (optional)" el="Σύντομη σημείωση (προαιρετικά)" compact /></Label>
          <Input id="open-to-note" maxLength={OPEN_TO_NOTE_MAX} placeholder="Fintech, Athens or remote" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {signal ? (
          <p className="text-xs text-muted-foreground">
            {lapsed ? (
              <BilingualText en="Your signal lapsed; it no longer affects matching. Save to renew it." el="Το σήμα σας έληξε· δεν επηρεάζει πια τις αντιστοιχίσεις. Αποθηκεύστε για ανανέωση." wrap />
            ) : (
              <BilingualText en={`Active until ${new Date(signal.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Saving renews it.`} el={`Ενεργό ως ${new Date(signal.expiresAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })}. Η αποθήκευση το ανανεώνει.`} wrap />
            )}
          </p>
        ) : null}

        {problem ? (
          <p role="alert" className="text-sm text-destructive-accessible"><BilingualText en={problem.en} el={problem.el} wrap /></p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!settled || !kinds.length || save.isPending} onClick={() => save.mutate()}>
            <BilingualText en={signal ? 'Save and renew' : 'Save'} el={signal ? 'Αποθήκευση και ανανέωση' : 'Αποθήκευση'} compact />
          </Button>
          {signal ? (
            <Button type="button" variant="ghost" disabled={clear.isPending} onClick={() => clear.mutate()}>
              <BilingualText en="Turn off" el="Απενεργοποίηση" compact />
            </Button>
          ) : null}
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
