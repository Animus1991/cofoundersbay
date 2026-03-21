'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

export default function SSOCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = searchParams?.get('userId');
    const redirect = searchParams?.get('redirect') || '/';
    const errorParam = searchParams?.get('error');
    const message = searchParams?.get('message');

    if (errorParam) {
      setStatus('error');
      setError(message || 'SSO authentication failed');
      return;
    }

    if (!userId) {
      setStatus('error');
      setError('Invalid SSO response - no user ID received');
      return;
    }

    // SSO was successful - complete the login process
    // In a real implementation, this would exchange the userId for proper auth tokens
    // For now, we'll simulate success and redirect
    const completeLogin = async () => {
      try {
        // Store minimal user info (actual auth is via httpOnly cookies set by API)
        if (typeof window !== 'undefined') {
          // The API should have already set the auth cookies
          // We just need to redirect to the appropriate page
        }

        setStatus('success');
        
        // Short delay to show success state, then redirect
        setTimeout(() => {
          router.push(redirect);
        }, 1000);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to complete login');
      }
    };

    completeLogin();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <Logo size="sm" className="mx-auto" />

        {status === 'loading' && (
          <div className="space-y-4">
            <div
              aria-hidden="true"
              className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
            />
            <div>
              <h1 className="text-xl font-semibold">Completing sign in...</h1>
              <p className="text-muted-foreground mt-1">
                Please wait while we verify your credentials
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-xs font-semibold uppercase tracking-wide text-green-600">
              OK
            </div>
            <div>
              <h1 className="text-xl font-semibold text-green-600">Sign in successful!</h1>
              <p className="text-muted-foreground mt-1">
                Redirecting you now...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive">
              !
            </div>
            <div>
              <h1 className="text-xl font-semibold text-destructive">Sign in failed</h1>
              <p className="text-muted-foreground mt-1">
                {error || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/login')} className="w-full">
                Try again
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Go to homepage
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
