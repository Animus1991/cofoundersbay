'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, MessageCircle, UserPlus } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CardMoreMenu, type CardMoreItem } from '@/components/common/CardMoreMenu';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { roleTone } from '@/lib/role-tone';
import { cn, initialsOf } from '@/lib/utils';
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

  const actionOf = (person: SearchHit, state: string, name: string) => (
    state === 'received' ? (
      <Button size="sm" className="w-full" onClick={() => void accept(person.userId)} aria-label={bilingualAria(`Accept ${name}'s request`, `Αποδοχή αιτήματος: ${name}`)}>
        <BilingualText en="Accept" el="Αποδοχή" compact />
      </Button>
    ) : state === 'sent' ? (
      <Button size="sm" variant="ghost" className="w-full" disabled>
        <BilingualText en="Request sent" el="Το αίτημα στάλθηκε" compact />
      </Button>
    ) : state === 'connected' ? (
      <Button size="sm" className="w-full" asChild>
        <Link href={`/messages?to=${encodeURIComponent(person.userId)}`}>
          <BilingualText en="Message" el="Μήνυμα" compact />
        </Link>
      </Button>
    ) : (
      <Button
        size="sm"
        className="w-full gap-1.5"
        disabled={connect.isPending}
        onClick={() => connect.mutate(person.userId)}
        aria-label={bilingualAria(`Connect with ${name}`, `Σύνδεση με ${name}`)}
      >
        <UserPlus className="icon-sm" aria-hidden="true" />
        <BilingualText en="Connect" el="Σύνδεση" compact />
      </Button>
    )
  );

  const moreOf = (person: SearchHit, state: string): CardMoreItem[] => [
    ...(state === 'connected' ? [{ key: 'message', en: 'Message', el: 'Μήνυμα', icon: MessageCircle, href: `/messages?to=${encodeURIComponent(person.userId)}` } as CardMoreItem] : []),
    { key: 'profile', en: 'Full profile', el: 'Πλήρες προφίλ', icon: ArrowRight, href: `/profiles/${person.userId}` },
  ];

  // A rail of portrait tiles on the accent wash (docs §131.2): the face
  // leads, the name and role sit under it, one reason, one verb.
  return (
    <div className="-mx-1 snap-x snap-mandatory overflow-x-auto px-1 pb-1 [scrollbar-gutter:stable]" data-home-people="" aria-label="People who fit">
      <div className="flex w-max min-w-full gap-3 rounded-2xl bg-status-accent-bg/50 p-3">
        {people.map((person) => {
          const reason = explainMatch(person, viewer, { nowMs: Date.now() })[0] ?? null;
          const state = stateOf(person.userId);
          const name = person.displayName ?? '';
          return (
            <Card key={person.userId} className="flex w-[200px] shrink-0 snap-start flex-col overflow-hidden">
              <CardContent className="flex flex-1 flex-col gap-2 p-3">
                <Link href={`/profiles/${person.userId}`} tabIndex={-1} aria-hidden="true" className="block self-center rounded-full">
                  <Avatar className="h-[4.5rem] w-[4.5rem] border border-border">
                    <AvatarImage src={person.avatarUrl || undefined} alt="" />
                    <AvatarFallback className={cn('text-sm font-semibold', roleTone(person.role))}>{initialsOf(name)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 space-y-1 text-center">
                  <p className="truncate">
                    <PersonHovercard userId={person.userId}>
                      <Link href={`/profiles/${person.userId}`} className="person-name transition-colors hover:text-primary-accessible">{name}</Link>
                    </PersonHovercard>
                  </p>
                  {person.role ? <RoleBadge role={person.role} size="sm" /> : null}
                  {person.headline ? <p className="truncate text-xs text-muted-foreground">{person.headline}</p> : null}
                  {reason ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      <BilingualText en={reason.en} el={reason.el} compact wrap />
                    </p>
                  ) : null}
                </div>
                <div className="mt-auto flex items-center gap-1">
                  <div className="min-w-0 flex-1 [&_button]:whitespace-nowrap">{actionOf(person, state, name)}</div>
                  <CardMoreMenu name={name} items={moreOf(person, state)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
