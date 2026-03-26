import { Suspense, ReactNode } from 'react';
import MessagesLoading from './loading';

/**
 * The messages page uses AppShell fullHeight which provides its own
 * TopBar + SideNav + MobileBottomNav. The Suspense boundary is required
 * so useSearchParams() in the client page works correctly in Next.js 15.
 */
export default function MessagesLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<MessagesLoading />}>{children}</Suspense>;
}
