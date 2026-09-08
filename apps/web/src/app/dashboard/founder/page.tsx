import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerQueryClient, serverFetch } from '@/lib/server-query';
import { queryKeys } from '@/lib/query-keys';
import FounderDashboardContent from './FounderDashboardContent';

export default async function FounderDashboardPage() {
  const queryClient = getServerQueryClient();

  // Prefetch the 4 main dashboard queries in parallel on the server.
  // Keys must match FounderDashboardContent's useQuery calls exactly, or the
  // client hydration match fails silently and it refetches instead of using
  // this SSR data.
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.me.profile(),
      queryFn: () => serverFetch('/api/me/profile'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['dashboard-stats'],
      queryFn: () => serverFetch('/api/dashboard/stats'),
    }),
    queryClient.prefetchQuery({
      // Must stay `queryKeys.recommendations` (= ['recommendations']) to match the
      // client's useQuery. It previously prefetched ['recommendations', {limit:5}],
      // which hydrates into a different cache entry — so this fetch was paid for on
      // the server, shipped in the payload, then thrown away and refetched on the
      // client, exactly the silent miss the comment above warns about.
      queryKey: queryKeys.recommendations,
      queryFn: () => serverFetch('/api/matching/recommendations?limit=5'),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.connections.pendingReceived(),
      queryFn: () => serverFetch('/api/connections/requests'),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FounderDashboardContent />
    </HydrationBoundary>
  );
}
