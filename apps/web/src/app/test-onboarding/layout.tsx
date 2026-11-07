import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

/** A development page: there to look at, not for visitors. Set NEXT_PUBLIC_SHOW_DEV_PAGES=1 to see it in a build. */
export default function DevelopmentOnlyLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_DEV_PAGES !== '1') notFound();
  return children;
}
