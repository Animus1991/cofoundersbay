'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Prefetches common routes on mount to speed up navigation.
 * Uses Next.js router.prefetch() for instant page transitions.
 */
export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch high-traffic routes after initial render
    const timeout = setTimeout(() => {
      const commonRoutes = [
        '/discover',
        '/messages',
        '/connections',
        '/profile',
        '/events',
        '/opportunities',
      ];

      commonRoutes.forEach((route) => {
        router.prefetch(route);
      });
    }, 1000); // Delay to not block initial page load

    return () => clearTimeout(timeout);
  }, [router]);

  return null;
}
