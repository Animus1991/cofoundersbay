import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerQueryClient, serverFetch } from '@/lib/server-query';
import FounderDashboardContent from './FounderDashboardContent';

export default async function FounderDashboardPage() {
  const queryClient = getServerQueryClient();

  // Prefetch the 4 main dashboard queries in parallel on the server
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['me-profile'],
      queryFn: () => serverFetch('/api/me/profile'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['dashboard-stats'],
      queryFn: () => serverFetch('/api/dashboard/stats'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['recommendations', { limit: 5 }],
      queryFn: () => serverFetch('/api/matching/recommendations?limit=5'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['connection-requests'],
      queryFn: () => serverFetch('/api/connections/requests'),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FounderDashboardContent />
    </HydrationBoundary>
  );
}
