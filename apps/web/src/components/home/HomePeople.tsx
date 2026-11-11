'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { PersonCard } from '@/components/common/PersonCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useConnectionActions } from '@/hooks/useConnectionWith';
import { sendConnectionRequest, type SearchHit } from '@/lib/api';
import { bilingualAria } from '@/lib/i18n/format';
import { explainMatch, type ViewerFacts } from '@/lib/match-explain';
import { usePageList } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';

/**
 * People worth meeting, a few at a time (docs §116): the face, what they do,
 * the one reason they are here, and the next step with them. Everything the
 * full list can do stays on /matches. One to a row (docs §118), the action at
 * the right of the head, or under the text on a phone.
 */
export function HomePeople({ matches, viewer, myId, limit = 3 }: {
  matches: SearchHit[];
  viewer: ViewerFacts | null;
  myId: string | null | undefined;
  limit?: number;
}) {
  const { connectionOf, accept } = useConnectionActions(Boolean(myId), myId);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [sentTo, setSentTo] = useState<ReadonlySet<string>>(() => new Set());

  const connect = useMutation({
    mutationFn: (receiverId: string) => sendConnectionRequest({ receiverId }),
    onSuccess: (_result, receiverId) => {
      setSentTo((before) => new Set(before).add(receiverId));
      success('Connection request sent successfully');
      void queryClient.invalidateQueries({ queryKey: qk('connections') });
    },
    onError: () => showError('Could not send request'),
  });

  const people = matches.filter((person) => person?.userId).slice(0, limit);
  const stateOf = (userId: string) => (sentTo.has(userId) ? 'sent' : connectionOf(userId));

  // The first page's people, as the cards say them, with where the
  // connection stands. Connecting and accepting stay the assistant's own
  // actions (send_connection with its Undo, respond_connection): a page
  // command for the same write put two cards under one request.
  const STATE_WORDS = {
    none: { en: 'not connected', el: 'χωρίς σύνδεση' },
    sent: { en: 'request sent', el: 'το αίτημα στάλθηκε' },
    received: { en: 'sent you a request', el: 'σας έστειλε αίτημα' },
    connected: { en: 'connected', el: 'σε σύνδεση' },
  } as const;
  const rowOf = (person: SearchHit, lang: 'en' | 'el') => {
    const reason = explainMatch(person, viewer, { nowMs: Date.now() })[0];
    return [person.displayName ?? '', person.headline, reason?.[lang], STATE_WORDS[stateOf(person.userId)]?.[lang]].filter(Boolean).join(' · ');
  };
  usePageList([
    {
      id: 'people_who_fit',
      labelEn: 'People who fit',
      labelEl: 'Άνθρωποι που ταιριάζουν',
      rows: people.map((person) => rowOf(person, 'en')),
      rowsEl: people.map((person) => rowOf(person, 'el')),
      total: matches.length,
    },
  ]);

  return (
    <div className="space-y-4" data-home-people="">
      {people.map((person) => {
        const reason = explainMatch(person, viewer, { nowMs: Date.now() })[0] ?? null;
        const state = stateOf(person.userId);
        const name = person.displayName ?? '';
        return (
          <PersonCard
            key={person.userId}
            userId={person.userId}
            name={name}
            avatarUrl={person.avatarUrl}
            role={person.role}
            headline={person.headline}
            photo="xl"
            meta={reason ? <span className="line-clamp-2"><BilingualText en={reason.en} el={reason.el} compact wrap /></span> : undefined}
            aside={state === 'received' ? (
              <Button size="sm" onClick={() => void accept(person.userId)} aria-label={bilingualAria(`Accept ${name}'s request`, `Αποδοχή αιτήματος: ${name}`)}>
                <BilingualText en="Accept" el="Αποδοχή" compact />
              </Button>
            ) : state === 'sent' ? (
              <Button size="sm" variant="ghost" disabled>
                <BilingualText en="Request sent" el="Το αίτημα στάλθηκε" compact />
              </Button>
            ) : state === 'connected' ? (
              <Button size="sm" asChild>
                <Link href={`/messages?to=${encodeURIComponent(person.userId)}`}>
                  <BilingualText en="Message" el="Μήνυμα" compact />
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={connect.isPending}
                onClick={() => connect.mutate(person.userId)}
                aria-label={bilingualAria(`Connect with ${name}`, `Σύνδεση με ${name}`)}
              >
                <UserPlus className="icon-sm" aria-hidden="true" />
                <BilingualText en="Connect" el="Σύνδεση" compact />
              </Button>
            )}
          />
        );
      })}
    </div>
  );
}
