import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** A link to private files: never in a search index, and never sent on as a referrer. */
export const metadata: Metadata = {
  title: 'Shared files',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function PublicRoomLayout({ children }: { children: ReactNode }) {
  return children;
}
