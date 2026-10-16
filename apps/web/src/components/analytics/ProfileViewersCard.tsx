'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PRIVATE_GROUP_MIN } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { RelativeTime } from '@/components/common/RelativeTime';
import { StatusText, statusEl } from '@/components/common/StatusText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { bilingualAria } from '@/lib/i18n/format';
import { usePageList } from '@/lib/page-controls';
import { getProfileViewers } from '@/lib/profile-viewers-api';
import { qk } from '@/lib/query-keys';
import { initialsOf } from '@/lib/utils';
import { PersonHovercard } from '@/components/common/PersonHovercard';

/**
 * Who viewed the reader's profile in the last 90 days. Names appear only for
 * viewers who show their name when they view, and only while the reader does
 * the same; everyone else is a count, grouped by role only where a role holds
 * at least three of them. The switch lives in Settings, not here: a value is
 * changed in one place.
 */
export function ProfileViewersCard() {
  const viewers = useQuery({ queryKey: qk('profile-viewers', 'me'), queryFn: getProfileViewers, staleTime: 60_000 });
  const v = viewers.data;

  usePageList([
    {
      id: 'profile_viewers',
      labelEn: 'Who viewed your profile',
      labelEl: 'Ποιοι είδαν το προφίλ σας',
      rows: v
        ? [
            ...v.named.map((n) => `${n.displayName}${n.headline ? ` (${n.headline})` : ''}: ${n.views} ${n.views === 1 ? 'view' : 'views'}, last ${n.lastViewedAt.slice(0, 10)}`),
            `${v.privateCount} members viewed privately${v.privateByRole.length ? ` (${v.privateByRole.map((g) => `${g.count} ${g.role}`).join(', ')})` : ''}`,
            `${v.signedOutViews} views from people not signed in`,
            v.readerSharesName ? 'You show your name when you view.' : 'You view privately, so you see counts only.',
          ]
        : undefined,
    },
  ]);

  return (
    <Card id="profile-viewers" className="min-w-0 scroll-mt-20">
      <CardHeader>
        <CardTitle className="page-section">
          <BilingualText en="Who viewed your profile" el="Ποιοι είδαν το προφίλ σας" compact />
        </CardTitle>
        <CardDescription>
          <BilingualText
            en={`The last ${v?.windowDays ?? 90} days. Names only for people who show theirs, and only while you show yours.`}
            el={`Οι τελευταίες ${v?.windowDays ?? 90} ημέρες. Ονόματα μόνο για όσους δείχνουν το δικό τους, και μόνο όσο δείχνετε το δικό σας.`}
            wrap
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewers.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : viewers.isError || !v ? (
          <p className="text-sm text-muted-foreground">
            <BilingualText en="Profile views could not be loaded." el="Οι προβολές του προφίλ δεν φορτώθηκαν." wrap />
          </p>
        ) : v.totalViews === 0 ? (
          <p className="text-sm text-muted-foreground">
            <BilingualText en="Nobody has opened your profile in this period yet." el="Κανείς δεν έχει ανοίξει ακόμη το προφίλ σας σε αυτό το διάστημα." wrap />
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { key: 'views', en: 'Views', el: 'Προβολές', value: v.totalViews },
                { key: 'members', en: 'Members', el: 'Μέλη', value: v.members },
                { key: 'out', en: 'Signed out', el: 'Χωρίς σύνδεση', value: v.signedOutViews },
              ].map((s) => (
                <div key={s.key} className="min-w-0">
                  <dt className="text-xs text-muted-foreground"><BilingualText en={s.en} el={s.el} compact /></dt>
                  <dd className="text-xl font-bold tabular-nums text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
            {v.named.length ? (
              <ul className="card-rows">
                {v.named.map((n) => (
                  <li key={n.id} className="flex items-center gap-3 py-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={n.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary-accessible">{initialsOf(n.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <PersonHovercard userId={n.id}><Link href={`/profiles/${encodeURIComponent(n.id)}`}
                        className="text-sm font-medium text-foreground hover:text-primary-accessible"
                        aria-label={bilingualAria(`Open ${n.displayName}'s profile`, `Άνοιγμα προφίλ: ${n.displayName}`)}
                      >{n.displayName}</Link></PersonHovercard>
                      <p className="truncate text-xs text-muted-foreground">{n.headline ?? <StatusText value={n.role} />}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      <RelativeTime date={n.lastViewedAt} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {v.privateCount ? (
              <p className="text-sm text-muted-foreground">
                <BilingualText
                  en={`${v.privateCount} ${v.privateCount === 1 ? 'member' : 'members'} viewed without showing their name${v.privateByRole.length ? `, among them ${v.privateByRole.map((g) => `${g.count} ${g.role}s`).join(' and ')}` : ''}.`}
                  el={`${v.privateCount} ${v.privateCount === 1 ? 'μέλος είδε' : 'μέλη είδαν'} χωρίς να δείξουν το όνομά τους${v.privateByRole.length ? `, ανάμεσά τους ${v.privateByRole.map((g) => `${g.count} με ρόλο «${statusEl(g.role) ?? g.role}»`).join(' και ')}` : ''}.`}
                  wrap
                />{' '}
                <BilingualText
                  en={`A role is named only when at least ${PRIVATE_GROUP_MIN} people share it.`}
                  el={`Ένας ρόλος αναφέρεται μόνο όταν τον έχουν τουλάχιστον ${PRIVATE_GROUP_MIN} άτομα.`}
                  wrap
                />
              </p>
            ) : null}
          </>
        )}
        {v && !v.readerSharesName ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="min-w-0 text-sm text-muted-foreground">
              <BilingualText
                en="You view profiles privately, so you see counts, not names. Showing your name is reciprocal."
                el="Βλέπετε τα προφίλ ιδιωτικά, οπότε βλέπετε πλήθη και όχι ονόματα. Η εμφάνιση του ονόματος είναι αμοιβαία."
                wrap
              />
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/settings#profile-views"><BilingualText en="Change in Settings" el="Αλλαγή στις Ρυθμίσεις" compact /></Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
