'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useEffect, useState } from 'react';
import { ApiError, ApiNetworkError } from '@/lib/api';

const CACHE_BUSTER = '2026-03';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        retry: (failureCount, error) => {
          if (error instanceof ApiNetworkError) return false;
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
        networkMode: 'online',
      },
      mutations: { retry: 0 },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  const [persister] = useState(() =>
    typeof window !== 'undefined'
      ? createSyncStoragePersister({
          storage: window.sessionStorage,
          key: 'cfb:rq-v1',
        })
      : null
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

  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 5 * 60_000,
          buster: CACHE_BUSTER,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
