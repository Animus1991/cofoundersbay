'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PREFETCH_ROUTES = [
  '/',
  '/discover',
  '/matches',
  '/members',
  '/activity',
  '/analytics',
  '/achievements',
  '/connections',
  '/messages',
  '/events',
  '/opportunities',
  '/mentoring',
  '/profile',
];

export function RoutePrefetcher() {
  const pathname = usePathname();
  const router = useRouter();
  // Track which hrefs have already been prefetched so we never duplicate
  const prefetchedRef = useRef<Set<string>>(new Set());

  // Use Next.js router.prefetch (not <link> DOM injection) for static routes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      PREFETCH_ROUTES.forEach((route) => {
        if (route !== pathname && !prefetchedRef.current.has(route)) {
          prefetchedRef.current.add(route);
          router.prefetch(route);
        }
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [pathname, router]);

  // Prefetch in-viewport anchor links via IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const links = document.querySelectorAll('a[href^="/"]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !prefetchedRef.current.has(href)) {
              prefetchedRef.current.add(href);
              router.prefetch(href);
              observer.unobserve(link);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    links.forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [pathname, router]);

  return null;
}
