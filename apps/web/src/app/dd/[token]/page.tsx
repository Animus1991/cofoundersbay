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
import { TOP_BANNER_STACK } from '@/components/layout/useTopBannerHeight';
import { getPublicRoom, publicRoomFileHref } from '@/lib/fundraising-api';
import { formatShortDate } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { qk } from '@/lib/query-keys';
import { isNotFound } from '@/lib/read-status';

/**
 * A founder's shared files, for someone without an account, while the link
 * lives. It says whose they are and when the link ends; a wrong, ended or
 * revoked link all read the same, so the page gives nothing away.
 */
export default function PublicRoomPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? '');
  const { primary } = useLanguagePreference();
  const query = useQuery({ queryKey: qk('fundraising', 'public-room', token), queryFn: () => getPublicRoom(token), enabled: Boolean(token), retry: 0 });
  const room = query.data;
  // Only the server saying "no" ends the link; the API being down does not.
  const failed = query.isError && !isNotFound(query.error);

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: TOP_BANNER_STACK }}>
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="CoFounderBay">
          <Logo size="sm" />
        </Link>
      </header>
      <MainLandmark className="mx-auto w-full max-w-2xl space-y-6 px-4 pb-16">
        {query.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : !room && failed ? (
          <Card>
            <CardContent className="space-y-3 text-center">
              <h1 className="text-lg font-semibold text-foreground"><BilingualText en="Shared files" el="Κοινόχρηστα αρχεία" compact /></h1>
              <p role="alert" className="text-sm text-muted-foreground">
                <BilingualText en="The files could not be read just now. The link may still be fine." el="Τα αρχεία δεν διαβάστηκαν αυτή τη στιγμή. Ο σύνδεσμος μπορεί να είναι εντάξει." compact wrap />
              </p>
              <Button size="sm" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </Button>
            </CardContent>
          </Card>
        ) : !room ? (
          <Card>
            <CardContent className="space-y-3 text-center">
              <h1 className="text-lg font-semibold text-foreground"><BilingualText en="This link does not open" el="Αυτός ο σύνδεσμος δεν ανοίγει" compact wrap /></h1>
              <p className="text-sm text-muted-foreground">
                <BilingualText en="It may have ended. Ask whoever sent it for a new one." el="Μπορεί να έχει λήξει. Ζητήστε νέο από όποιον σας τον έστειλε." compact wrap />
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="page-title text-foreground">{room.roundName}</h1>
              <p className="text-sm text-muted-foreground">
                <BilingualText
                  en={`Shared by ${room.founderName}. The link ends ${formatShortDate(room.expiresAt, 'en')}.`}
                  el={`Από: ${room.founderName}. Ο σύνδεσμος λήγει ${formatShortDate(room.expiresAt, primary === 'el' ? 'el' : 'en')}.`}
                  compact
                  wrap
                />
              </p>
            </div>
            <Card>
              <CardContent>
                {room.documents.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {room.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{doc.name}</span>
                        <Button size="sm" variant="outline" asChild>
                          <a href={publicRoomFileHref(token, doc.id)}><BilingualText en="Download" el="Λήψη" compact /></a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <BilingualText en="Nothing is shared at the moment." el="Δεν υπάρχει κάτι κοινόχρηστο αυτή τη στιγμή." compact wrap />
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </MainLandmark>
    </div>
  );
}
