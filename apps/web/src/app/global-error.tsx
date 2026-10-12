'use client';

import { useEffect } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import './globals.css';

export default function GlobalError({
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
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-accessible text-xl" aria-hidden="true">
              !
            </div>
            <h1 className="mt-4 text-xl font-semibold">
              <BilingualText en="This page could not load" el="Αυτή η σελίδα δεν φορτώθηκε" wrap />
            </h1>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </button>
              <a
                href="/"
                className="inline-flex h-9 items-center rounded-xl border border-border bg-secondary px-4 text-sm font-medium"
              >
                <BilingualText en="Go home" el="Πίσω στην αρχική" compact />
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
