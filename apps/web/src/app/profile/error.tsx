'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RouteError } from '@/components/common/RouteError';
import { HeaderBandSkeleton } from '@/components/layout/HeaderBandSkeleton';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Rendered inside the shell so the sidebar and top bar survive the failure
  // and the user can navigate away without a reload.
  return (
    <AppShell>
      <HeaderBandSkeleton />
      <RouteError error={error} reset={reset} section="Profile" />
    </AppShell>
  );
}
