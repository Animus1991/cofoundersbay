'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { createRoomLink, listRoomLinks, revokeRoomLink, type RoomLink } from '@/lib/fundraising-api';
import { formatShortDate } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { qk } from '@/lib/query-keys';

const DAYS = [1, 7, 14, 30] as const;

/** Whether a link still opens. Ended and revoked read differently: one you did, one the date did. */
export function roomLinkState(link: Pick<RoomLink, 'expiresAt' | 'revokedAt'>, now = Date.now()): 'open' | 'ended' | 'revoked' {
  if (link.revokedAt) return 'revoked';
  return Date.parse(link.expiresAt) <= now ? 'ended' : 'open';
}

/**
 * For someone without an account: the files marked as shared, until the link
 * ends. The address is shown once, when it is made: only its hash is kept, so
 * neither the page nor anyone reading the database can show it again.
 */
export function RoomLinks({ sharedCount }: { sharedCount: number }) {
  const { primary } = useLanguagePreference();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [label, setLabel] = useState('');
  const [days, setDays] = useState<number>(7);
  const [made, setMade] = useState<string | null>(null);
  const key = qk('fundraising', 'links');
  const { data: links } = useQuery({ queryKey: key, queryFn: listRoomLinks, staleTime: 30_000, retry: 0 });

  const create = useMutation({
    mutationFn: () => createRoomLink({ label: label.trim() || null, days }),
    onSuccess: ({ token }) => {
      setMade(`${window.location.origin}/dd/${token}`);
      setLabel('');
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (err) => showError('Could not create the link', err instanceof Error ? err.message : undefined),
  });
  const revoke = useMutation({
    mutationFn: revokeRoomLink,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: key }); },
    onError: (err) => showError('Could not revoke the link', err instanceof Error ? err.message : undefined),
  });

  const copy = async () => {
    if (!made) return;
    await navigator.clipboard.writeText(made);
    success('Link copied');
  };

  return (
    <section className="space-y-3" data-room-links="">
      <h3 className="text-sm font-medium text-foreground"><BilingualText en="Link without an account" el="Σύνδεσμος χωρίς λογαριασμό" compact /></h3>
      <p className="text-xs text-muted-foreground">
        <BilingualText
          en="Whoever has the link sees the shared files until it ends. Optional: an investor with an account is better linked above."
          el="Όποιος έχει τον σύνδεσμο βλέπει τα κοινόχρηστα αρχεία ώσπου να λήξει. Προαιρετικό: έναν επενδυτή με λογαριασμό είναι καλύτερα να τον συνδέσετε παραπάνω."
          compact
          wrap
        />
      </p>

      {made ? (
        <div className="space-y-2 rounded-lg border border-status-warning-border bg-status-warning-bg p-3">
          <p className="text-xs text-foreground">
            <BilingualText en="Copy it now. It is shown only this once." el="Αντιγράψτε τον τώρα. Φαίνεται μόνο αυτή τη φορά." compact wrap />
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={made} aria-label="Data room link" onFocus={(event) => event.target.select()} />
            <Button type="button" size="sm" variant="outline" onClick={() => void copy()}><BilingualText en="Copy" el="Αντιγραφή" compact /></Button>
          </div>
        </div>
      ) : null}

      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
        onSubmit={(event) => { event.preventDefault(); create.mutate(); }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="room-link-label"><BilingualText en="Who is it for" el="Για ποιον είναι" compact /></Label>
          <Input id="room-link-label" value={label} maxLength={120} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room-link-days"><BilingualText en="Ends after" el="Λήγει σε" compact /></Label>
          <select
            id="room-link-days"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {DAYS.map((value) => (
              <option key={value} value={value}>{primary === 'el' ? `${value} ${value === 1 ? 'ημέρα' : 'ημέρες'}` : `${value} ${value === 1 ? 'day' : 'days'}`}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={create.isPending || sharedCount === 0}>
          <BilingualText en="Create link" el="Δημιουργία συνδέσμου" compact />
        </Button>
      </form>
      {sharedCount === 0 ? (
        <p className="text-xs text-muted-foreground"><BilingualText en="Share at least one file first." el="Μοιραστείτε πρώτα τουλάχιστον ένα αρχείο." compact wrap /></p>
      ) : null}

      {(links ?? []).length > 0 ? (
        <ul className="divide-y divide-border">
          {(links ?? []).map((link) => {
            const state = roomLinkState(link);
            const end = formatShortDate(link.expiresAt, primary === 'el' ? 'el' : 'en');
            return (
              <li key={link.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {link.label ?? <BilingualText en="Link" el="Σύνδεσμος" compact />}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {state === 'revoked'
                      ? <BilingualText en="Revoked" el="Ανακλήθηκε" compact />
                      : state === 'ended'
                        ? <BilingualText en={`Ended ${end}`} el={`Έληξε ${end}`} compact />
                        : <BilingualText en={`Ends ${end}`} el={`Λήγει ${end}`} compact />}
                    {' · '}
                    <BilingualText en={`${link.openCount} files opened`} el={`Ανοίγματα αρχείων: ${link.openCount}`} compact />
                  </span>
                </span>
                {state === 'open' ? (
                  <Button type="button" size="sm" variant="ghost" disabled={revoke.isPending} onClick={() => revoke.mutate(link.id)}>
                    <BilingualText en="Revoke" el="Ανάκληση" compact />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
