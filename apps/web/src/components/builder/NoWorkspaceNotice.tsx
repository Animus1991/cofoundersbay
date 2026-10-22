'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BilingualText } from '@/components/common/BilingualText';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';

/**
 * A Builder page with no workspace to show, said as what it is (docs §79).
 *
 * `failed`: the list of workspaces was not read - with the API down the pitch
 * deck and the applications drew an empty form under the raw "Unable to reach
 * the API server." and offered Save. `none`: read, and there is no workspace
 * yet, so nothing on this page can save; the Startup Builder creates one.
 */
export function NoWorkspaceNotice({
  state,
  onRetry,
  noneEn,
  noneEl,
}: {
  state: 'failed' | 'none';
  onRetry: () => void;
  noneEn: string;
  noneEl: string;
}) {
  const failed = state === 'failed';
  return (
    <Card>
      <CardContent className="space-y-4">
        <p role={failed ? 'alert' : undefined} className="text-sm">
          {failed
            ? <BilingualText en={builderEn('ws_read_failed')} el={builderEl('ws_read_failed')} />
            : <BilingualText en={noneEn} el={noneEl} />}
        </p>
        {failed ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <BilingualText en={builderEn('try_again')} el={builderEl('try_again')} compact />
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/builder"><BilingualText en={builderEn('open_builder_cta')} el={builderEl('open_builder_cta')} compact /></Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
