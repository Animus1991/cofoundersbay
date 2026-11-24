'use client';

import { RouteError } from '@/components/common/RouteError';
import { HeaderBandSkeleton } from '@/components/layout/HeaderBandSkeleton';

export default function ProfilesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-16">
      <HeaderBandSkeleton />
      <div className="flex flex-1 items-center justify-center">
      <RouteError error={error} reset={reset} section="Profile" backHref="/" backLabel="Back to home" />
      </div>
    </div>
  );
}
