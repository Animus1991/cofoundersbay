import { ReactNode } from 'react';

/**
 * The messages page uses AppShell fullHeight which provides its own
 * TopBar + SideNav + MobileBottomNav. This layout is intentionally
 * a passthrough to avoid double headers.
 */
export default function MessagesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
