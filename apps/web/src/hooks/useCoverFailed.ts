'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Whether a cover image failed to load. A blocked or deleted cover left an
 * empty band over the card (the image is painted transparent, layout.tsx):
 * 112-192px over an event (docs §71), a 224px column beside a programme
 * (docs §77). An image that failed before hydration fired no React onError,
 * so mount reads `complete` too.
 */
export function useCoverFailed(src: string | null | undefined) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const img = ref.current;
    setFailed(Boolean(img && img.complete && img.naturalWidth === 0));
  }, [src]);
  return { ref, failed, onError: () => setFailed(true) };
}
