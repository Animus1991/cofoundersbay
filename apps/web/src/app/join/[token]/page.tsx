'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Logo } from '@/components/brand/Logo';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MainLandmark } from '@/components/layout/AppShell';
import { TOP_BANNER_STACK } from '@/components/layout/useTopBannerHeight';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useToast } from '@/components/ui/toast';
import { acceptOrganizationInvitation, declineOrganizationInvitation, getOrganizationInvitation } from '@/lib/api';
import { isNotFound } from '@/lib/read-status';
import { qk } from '@/lib/query-keys';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { initialsOf } from '@/lib/utils';

/**
 * An invitation into an organisation (docs §100), opened from its email or
 * notification. It reads without an account - the person may not have one
 * - and shows only the organisation, the role, who invited and the address
 * masked. Answering needs an account with the invited address; a visitor is
 * offered sign-in or registration, which come back here.
 */
export default function JoinOrganisationPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? '');
  const router = useRouter();
  const qc = useQueryClient();
  const fmtDate = useDateFormat();
  const { success, error: showError } = useToast();
  const member = Boolean(useStoredUser()?.id);
  const [answering, setAnswering] = useState<'accept' | 'decline' | null>(null);
  const [refusal, setRefusal] = useState<{ en: string; el: string } | null>(null);
  const [declined, setDeclined] = useState(false);

  const query = useQuery({
    queryKey: qk('org', 'invitation', token),
    queryFn: () => getOrganizationInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
  const invite = query.data?.invitation;
  const notFound = query.isError && isNotFound(query.error);
  const failed = query.isError && !notFound;
  const here = `/join/${encodeURIComponent(token)}`;

  const answer = async (kind: 'accept' | 'decline') => {
    setAnswering(kind);
    setRefusal(null);
    try {
      if (kind === 'accept') {
        const out = await acceptOrganizationInvitation(token);
        success('You joined the organisation', out.organization?.name ?? invite?.organization.name);
        void qc.invalidateQueries({ queryKey: qk('org') });
        router.push(out.organization?.slug ? `/org/${out.organization.slug}` : '/dashboard');
      } else {
        await declineOrganizationInvitation(token);
        setDeclined(true);
      }
    } catch (err) {
      const e = err as { message?: string; details?: { messageEl?: string } };
      const en = e?.message || 'The answer was not recorded.';
      setRefusal({ en, el: e?.details?.messageEl ?? en });
      if (kind === 'accept') showError('Could not accept the invitation', en);
    } finally {
      setAnswering(null);
      void query.refetch();
    }
  };

  const orgLogo = invite?.organization?.logoUrl || undefined;
  const until = invite ? fmtDate(invite.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const role = invite?.roleLabel ?? (invite ? { en: invite.role, el: invite.role } : null);

  return (
    // Its own page, outside the app frame, like the other links people open
    // without an account; it holds the height of a banner above its header.
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_BANNER_STACK }}>
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="CoFounderBay">
          <Logo size="sm" />
        </Link>
      </header>
      <MainLandmark className="mx-auto w-full max-w-xl space-y-6 px-4 pb-16">
        {query.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : !invite ? (
          <Card>
            <CardContent className="space-y-3">
              <h1 className="text-lg font-semibold text-foreground"><BilingualText en="Invitation" el="Πρόσκληση" compact /></h1>
              {failed ? (
                <>
                  <p role="alert" className="text-sm text-muted-foreground">
                    <BilingualText en="The invitation could not be read just now. The link may still be fine." el="Η πρόσκληση δεν διαβάστηκε αυτή τη στιγμή. Ο σύνδεσμος μπορεί να είναι εντάξει." wrap />
                  </p>
                  <Button size="sm" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
                    <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <BilingualText en="This invitation link is not valid. It may have been sent again, which replaces the old link; ask whoever invited you for a new one." el="Αυτός ο σύνδεσμος πρόσκλησης δεν ισχύει. Ίσως στάλθηκε ξανά, οπότε ο παλιός σύνδεσμος αντικαταστάθηκε· ζητήστε νέο από όποιον σας προσκάλεσε." wrap />
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  {orgLogo ? <AvatarImage src={orgLogo} alt="" className="rounded-xl" /> : null}
                  <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary-accessible">{initialsOf(invite.organization.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-foreground">
                    <BilingualText en={`Join ${invite.organization.name}`} el={`Συμμετοχή στο ${invite.organization.name}`} wrap />
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    <BilingualText
                      en={`${invite.invitedByName ?? 'Someone'} invited you as ${role?.en.toLowerCase()}.`}
                      el={`${invite.invitedByName ?? 'Κάποιος'} σας προσκάλεσε ως ${role?.el.toLowerCase()}.`}
                      wrap
                    />
                  </p>
                </div>
              </div>
              {invite.message ? (
                <blockquote className="border-l-2 border-border pl-3 text-sm text-foreground first-letter:uppercase">{invite.message}</blockquote>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {/* The date only while it can still be answered: "good until"
                    a day already past reads as a mistake. */}
                {invite.status === 'pending' && !declined ? (
                  <BilingualText
                    en={`Sent to ${invite.emailMasked} · good until ${until}`}
                    el={`Στάλθηκε στο ${invite.emailMasked} · ισχύει έως ${until}`}
                    wrap
                  />
                ) : (
                  <BilingualText en={`Sent to ${invite.emailMasked}`} el={`Στάλθηκε στο ${invite.emailMasked}`} wrap />
                )}
              </p>

              {declined ? (
                <p role="status" className="text-sm text-foreground"><BilingualText en="You declined the invitation." el="Απορρίψατε την πρόσκληση." wrap /></p>
              ) : invite.status !== 'pending' ? (
                <p role="status" className="text-sm text-muted-foreground">
                  {invite.status === 'accepted' ? <BilingualText en="This invitation was accepted." el="Η πρόσκληση έγινε αποδεκτή." wrap />
                    : invite.status === 'expired' ? <BilingualText en="This invitation has expired; ask for a new one." el="Η πρόσκληση έληξε· ζητήστε νέα." wrap />
                      : invite.status === 'declined' ? <BilingualText en="This invitation was declined." el="Η πρόσκληση απορρίφθηκε." wrap />
                        : <BilingualText en="This invitation was cancelled." el="Η πρόσκληση ακυρώθηκε." wrap />}
                </p>
              ) : member ? (
                <div className="space-y-3">
                  {refusal ? (
                    <p role="alert" className="text-sm text-destructive-accessible"><BilingualText en={refusal.en} el={refusal.el} wrap /></p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={answering !== null} onClick={() => void answer('accept')}>
                      {answering === 'accept' ? <BilingualText en="Joining…" el="Συμμετοχή…" compact /> : <BilingualText en="Accept and join" el="Αποδοχή και συμμετοχή" compact />}
                    </Button>
                    <Button variant="outline" disabled={answering !== null} onClick={() => void answer('decline')}>
                      <BilingualText en="Decline" el="Απόρριψη" compact />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <BilingualText en="To accept, sign in with the invited address, or create an account with it." el="Για να την αποδεχτείτε, συνδεθείτε με τη διεύθυνση της πρόσκλησης ή δημιουργήστε λογαριασμό με αυτή." wrap />
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href={`/register?redirect=${encodeURIComponent(here)}`}><BilingualText en="Create an account" el="Δημιουργία λογαριασμού" compact /></Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/login?redirect=${encodeURIComponent(here)}`}><BilingualText en="Sign in" el="Σύνδεση" compact /></Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </MainLandmark>
    </div>
  );
}
