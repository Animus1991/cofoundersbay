'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '@/components/brand/Logo';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLandmark } from '@/components/layout/AppShell';
import { UpdateCard } from '@/components/updates/UpdateCard';
import { getPublicUpdate } from '@/lib/updates-api';
import { qk } from '@/lib/query-keys';
import { TOP_BANNER_STACK } from '@/components/layout/useTopBannerHeight';
import { useStoredUser } from '@/hooks/useStoredUser';
import { isNotFound } from '@/lib/read-status';

/**
 * A founder update its author made public, for readers without an account:
 * the author's name and headline (the product is not anonymous), the update,
 * and a way in that returns to the updates feed. No ids, no contact details.
 */
export default function PublicUpdatePage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? '');
  const query = useQuery({ queryKey: qk('founder-updates', 'public', token), queryFn: () => getPublicUpdate(token), enabled: Boolean(token), retry: false });
  const update = query.data;
  const join = `/register?redirect=${encodeURIComponent('/updates')}`;
  // A member reads it among their updates, where Follow is; visitors join.
  const member = Boolean(useStoredUser()?.id);
  // Only the server saying "no" makes it not public; the API down did too.
  const failed = query.isError && !isNotFound(query.error);

  return (
    // Outside the app frame: holds a top banner's height (docs §92).
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_BANNER_STACK }}>
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="CoFounderBay">
          <Logo size="sm" />
        </Link>
        {member ? null : (
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/login?redirect=${encodeURIComponent('/updates')}`}><BilingualText en="Sign in" el="Σύνδεση" compact /></Link>
          </Button>
        )}
      </header>
      <MainLandmark className="mx-auto w-full max-w-2xl space-y-6 px-4 pb-16">
        {query.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : !update && failed ? (
          <Card>
            <CardContent className="space-y-3 text-center">
              <h1 className="text-lg font-semibold text-foreground"><BilingualText en="Founder update" el="Ενημέρωση ιδρυτή" compact /></h1>
              <p role="alert" className="text-sm text-muted-foreground">
                <BilingualText en="The update could not be read just now. The link may still be fine." el="Η ενημέρωση δεν διαβάστηκε αυτή τη στιγμή. Ο σύνδεσμος μπορεί να είναι εντάξει." wrap />
              </p>
              <Button size="sm" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </Button>
            </CardContent>
          </Card>
        ) : !update ? (
          <Card>
            <CardContent className="space-y-3 text-center">
              <h1 className="text-lg font-semibold text-foreground"><BilingualText en="This update is not public" el="Αυτή η ενημέρωση δεν είναι δημόσια" wrap /></h1>
              <p className="text-sm text-muted-foreground"><BilingualText en="Its author made it private or deleted it." el="Ο συντάκτης την έκανε ιδιωτική ή τη διέγραψε." wrap /></p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/"><BilingualText en="Go to CoFounderBay" el="Μετάβαση στο CoFounderBay" compact /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <h1 className="sr-only">{update.title}</h1>
            <UpdateCard update={update} />
            <Card>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">
                  <BilingualText en={`Follow ${update.author.displayName} on CoFounderBay to get the next update.`} el={`Για την επόμενη ενημέρωση, ακολουθήστε στο CoFounderBay: ${update.author.displayName}.`} wrap />
                </p>
                {member ? (
                  <Button asChild>
                    <Link href="/updates"><BilingualText en="Open your updates" el="Άνοιγμα των ενημερώσεών σας" compact /></Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={join}><BilingualText en="Join CoFounderBay" el="Εγγραφή στο CoFounderBay" compact /></Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </MainLandmark>
    </div>
  );
}
