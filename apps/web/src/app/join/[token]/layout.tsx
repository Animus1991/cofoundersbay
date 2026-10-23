import type { Metadata } from 'next';

/**
 * An invitation link (docs §100) is meant for one person: never indexed,
 * and the preview names no organisation (the token is the only key).
 */
export const metadata: Metadata = {
  title: 'An invitation to CoFounderBay',
  description: 'You were invited to join an organisation on CoFounderBay.',
  robots: { index: false, follow: false },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
