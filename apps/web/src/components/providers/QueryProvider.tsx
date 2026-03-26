'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError, ApiNetworkError } from '@/lib/api';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
            // Retry policy:
            //  - ApiNetworkError: 0 retries — exponential circuit breaker in api.ts handles backoff.
            //    Stacking RQ retry on top of fetch attempts multiplied failed requests (3×2=6 per call).
            //  - 4xx: never retry — client errors won't self-heal.
            //  - 5xx / unknown: retry twice with backoff — transient server errors.
            retry: (failureCount, error) => {
              if (error instanceof ApiNetworkError) return false;
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
              return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
            // Only run queries when online — prevents flooding when backend is down
            networkMode: 'online',
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  // When the API comes back online (after a circuit-breaker blackout or server restart),
  // invalidate every query that is currently in 'error' state so pages automatically
  // re-fetch and recover without requiring a manual browser refresh.
  useEffect(() => {
    const handleApiOnline = () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.state.status === 'error',
      });
    };

    window.addEventListener('cfb:api-online', handleApiOnline);
    return () => window.removeEventListener('cfb:api-online', handleApiOnline);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
