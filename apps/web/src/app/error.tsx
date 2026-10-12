'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-accessible">
          <AlertTriangle className="icon-md" />
        </div>
        <h1 className="mt-4 text-xl sm:text-2xl xl:text-3xl font-semibold text-foreground">
          <BilingualText en="This page could not load" el="Αυτή η σελίδα δεν φορτώθηκε" wrap />
        </h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="icon-sm" />
            <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/"><BilingualText en="Go home" el="Πίσω στην αρχική" compact /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
