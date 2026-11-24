'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RouteError } from '@/components/common/RouteError';
import { HeaderBandSkeleton } from '@/components/layout/HeaderBandSkeleton';

export default function PerksError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppShell>
      <HeaderBandSkeleton />
      <RouteError error={error} reset={reset} section="Perks" />
    </AppShell>
  );
}
