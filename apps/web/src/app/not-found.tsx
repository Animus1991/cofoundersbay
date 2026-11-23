import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { MainLandmark } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { EmptyIllustration } from '@/components/common/EmptyIllustration';
import { NotFoundSuggestions } from '@/components/common/NotFoundSuggestions';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <MainLandmark className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo size="sm" />
      {/* A mark carries the mood; the words below carry the fact. */}
      <div data-keep-icon="" className="mt-10 h-24 w-24 text-muted-foreground">
        <EmptyIllustration type="search" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        <BilingualText en="Page not found" el="Η σελίδα δεν βρέθηκε" compact wrap />
      </h1>
      <div className="mt-6 flex flex-col items-center gap-2">
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
      </div>
      <NotFoundSuggestions />
    </MainLandmark>
  );
}
