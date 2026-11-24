import { PageLoading } from '@/components/common/PageLoading';
import { HeaderBandSkeleton } from '@/components/layout/HeaderBandSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
    <HeaderBandSkeleton />
      <PageLoading label="Loading pitch" />
    </div>
  );
}
