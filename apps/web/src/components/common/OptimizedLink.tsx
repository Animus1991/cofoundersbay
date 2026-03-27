'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type ComponentProps } from 'react';

type OptimizedLinkProps = ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

/**
 * Lightweight Link wrapper that relies on Next prefetch plus a single
 * hover/focus prefetch to keep navigation warm without aggressive observers.
 */
export function OptimizedLink({
  href,
  prefetchOnHover = true,
  children,
  onFocus,
  onMouseEnter,
  prefetch: linkPrefetch,
  ...props
}: OptimizedLinkProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const prefetch = () => {
    if (!prefetchOnHover || typeof href !== 'string' || href.startsWith('http') || prefetchedRef.current) {
      return;
    }

    prefetchedRef.current = true;
    void router.prefetch(href);
  };

  return (
    <Link
      href={href}
      prefetch={linkPrefetch}
      onFocus={(event) => {
        onFocus?.(event);
        prefetch();
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        prefetch();
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
