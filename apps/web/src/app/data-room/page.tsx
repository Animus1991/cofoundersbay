'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { downloadFundraisingDocument, listSharedRooms, type SharedRoom } from '@/lib/fundraising-api';
import { bilingualAria, formatShortDate } from '@/lib/i18n/format';
import { fundraisingEl, fundraisingEn } from '@/lib/i18n/strings-fundraising';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { usePageControls, usePageList } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';
import { initialsOf } from '@/lib/utils';

function sizeOf(bytes: number | null) {
  if (!bytes) return null;
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RoomCard({ room }: { room: SharedRoom }) {
  const { primary } = useLanguagePreference();
  const { error: showError } = useToast();
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={room.owner?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-sm">{initialsOf(room.owner?.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="card-title truncate">{room.roundName}</h2>
            {room.owner ? <p className="truncate text-sm text-muted-foreground">{room.owner.displayName}</p> : null}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {room.documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-2.5">
              <FileText className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[sizeOf(doc.fileSizeBytes), formatShortDate(doc.updatedAt, primary)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-11 w-11 shrink-0 p-0 sm:h-9 sm:w-9"
                aria-label={bilingualAria(fundraisingEn('download'), fundraisingEl('download'))}
                title={bilingualAria(fundraisingEn('download'), fundraisingEl('download'))}
                onClick={() => {
                  downloadFundraisingDocument(doc.id, doc.fileName ?? doc.name).catch((err: unknown) => showError('Could not download the document', err instanceof Error ? err.message : undefined));
                }}
              >
                <Download className="icon-sm" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * The investor's side of the data room: what founders opened to this account
 * (docs §112). The founder sees each opening, and access ends the moment they
 * stop sharing or remove the link.
 */
export default function SharedRoomsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk('fundraising', 'shared'),
    queryFn: listSharedRooms,
    staleTime: 30_000,
    retry: 1,
  });
  const rooms = data?.rooms ?? [];
  const documents = rooms.flatMap((room) => room.documents.map((doc) => ({ ...doc, room })));

  // The assistant reads what is here and can fetch a file, which logs the opening like the button does.
  usePageList([
    {
      id: 'shared_documents',
      labelEn: 'Documents shared with you',
      labelEl: 'Έγγραφα που μοιράστηκαν μαζί σας',
      rows: isLoading ? undefined : documents.map((d) => `${d.name} · ${d.room.roundName} · ${d.room.owner?.displayName ?? '—'}`),
    },
  ]);
  usePageControls([
    {
      id: 'download_shared_document',
      labelEn: 'Download a shared document',
      labelEl: 'Λήψη κοινόχρηστου εγγράφου',
      writes: false,
      options: documents.map((d) => ({ value: d.id, labelEn: d.name, labelEl: d.name })),
      run: async (value?: string) => {
        const doc = documents.find((d) => d.id === value);
        if (doc) await downloadFundraisingDocument(doc.id, doc.fileName ?? doc.name);
      },
    },
  ]);

  return (
    <AppShell showHelp>
      <div className="space-y-6 pb-10">
        {isError ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p role="alert" className="text-sm text-muted-foreground"><BilingualText en={fundraisingEn('shared_failed')} el={fundraisingEl('shared_failed')} compact /></p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}><BilingualText en="Try again" el="Δοκιμάστε ξανά" compact /></Button>
          </CardContent></Card>
        ) : isLoading ? (
          <Card><CardContent className="space-y-3"><Skeleton className="h-10 w-48" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
        ) : rooms.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="page-section font-semibold"><BilingualText en={fundraisingEn('shared_empty_title')} el={fundraisingEl('shared_empty_title')} compact /></p>
            <p className="max-w-sm text-sm text-muted-foreground"><BilingualText en={fundraisingEn('shared_empty_hint')} el={fundraisingEl('shared_empty_hint')} wrap /></p>
            <Button size="sm" variant="outline" asChild><Link href="/fundraising"><BilingualText en={fundraisingEn('shared_own_room')} el={fundraisingEl('shared_own_room')} compact /></Link></Button>
          </CardContent></Card>
        ) : (
          rooms.map((room) => <RoomCard key={room.roundId} room={room} />)
        )}
      </div>
    </AppShell>
  );
}
