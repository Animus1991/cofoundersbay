import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { MainLandmark } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { EmptyState } from '@/components/common/EmptyState';
import { NotFoundSuggestions } from '@/components/common/NotFoundSuggestions';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <MainLandmark className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo size="sm" />
      {/* The shared empty state draws the search disc, the words and the
          ways on (B2.5); the h1 stays for the document's outline. */}
      <h1 className="sr-only">
        <BilingualText en="Page not found" el="Η σελίδα δεν βρέθηκε" compact wrap />
      </h1>
      <EmptyState
        className="mt-8 w-full max-w-lg"
        illustration="search"
        title={<BilingualText en="Page not found" el="Η σελίδα δεν βρέθηκε" compact wrap />}
        action={(
          <>
            <Button asChild>
              <Link href="/" className="gap-2">
                <Home className="icon-sm" />
                <BilingualText en="Back to home" el="Στην αρχική" compact />
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/discover" className="gap-2">
                <Compass className="icon-sm" />
                <BilingualText en="Discover people" el="Εξερεύνηση ανθρώπων" compact />
              </Link>
            </Button>
          </>
        )}
      />
      <NotFoundSuggestions />
    </MainLandmark>
  );
}
