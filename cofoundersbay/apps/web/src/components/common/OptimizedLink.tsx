'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ComponentProps } from 'react';

type OptimizedLinkProps = ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

/**
 * Optimized Link component that prefetches on hover for instant navigation.
 * Uses intersection observer to prefetch visible links in viewport.
 */
export function OptimizedLink({
  href,
  prefetchOnHover = true,
  children,
  ...props
}: OptimizedLinkProps) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const prefetchedRef = useRef(false);

  // Prefetch on viewport intersection (for visible links)
  useEffect(() => {
    if (!linkRef.current || typeof href !== 'string') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetchedRef.current) {
            router.prefetch(href);
            prefetchedRef.current = true;
          }
        });
      },
      { rootMargin: '50px' } // Start prefetching 50px before link enters viewport
    );

    observer.observe(linkRef.current);
    return () => observer.disconnect();
  }, [href, router]);

  // Additional prefetch on hover for instant feel
  const handleMouseEnter = () => {
    if (prefetchOnHover && typeof href === 'string' && !prefetchedRef.current) {
      router.prefetch(href);
      prefetchedRef.current = true;
    }
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}
