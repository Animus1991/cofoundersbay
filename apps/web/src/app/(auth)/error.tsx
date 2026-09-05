'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AuthError]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </Link>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive-accessible" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">Authentication error</h1>
            <p className="text-sm text-muted-foreground">
              Something went wrong while loading this page. This is usually transient — try again.
            </p>
          </div>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <pre className="rounded-lg bg-muted p-3 text-left text-[11px] text-muted-foreground overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Link href="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
