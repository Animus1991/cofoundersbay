'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PREFETCH_ROUTES = [
  '/',
  '/discover',
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefetchRoute = (route: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);
    };

    const timeoutId = setTimeout(() => {
      PREFETCH_ROUTES.forEach((route) => {
        if (route !== pathname) {
          prefetchRoute(route);
        }
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const links = document.querySelectorAll('a[href^="/"]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            
            if (href && !href.startsWith('http')) {
              const prefetchLink = document.createElement('link');
              prefetchLink.rel = 'prefetch';
              prefetchLink.href = href;
              prefetchLink.as = 'document';
              document.head.appendChild(prefetchLink);
              
              observer.unobserve(link);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    links.forEach((link) => observer.observe(link));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
