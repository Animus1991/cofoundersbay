'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMe } from '@/lib/api';
import { isPreviewDemo, PREVIEW_DEMO_USER } from '@/lib/preview-demo';
import { MainLandmark } from '@/components/layout/AppShell';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your session…');

  useEffect(() => {
    const provider = searchParams?.get('provider') ?? 'OAuth';
    const error = searchParams?.get('error');
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    if (error) {
      setStatus('error');
      setMessage(error);
      return () => { cancelled = true; };
    }

    // Cookies are already set by the backend redirect.
    // Verify by calling getMe() — uses the httpOnly cookie.
    getMe()
      .then(({ user }) => {
        if (cancelled) return;
        // Store display data only (no tokens)
        // A callback visited with an already-established preview session must
        // not reset every query observer by broadcasting a second login.
        let restoredPreview = false;
        try {
          const previousUser = localStorage.getItem('user');
          restoredPreview = isPreviewDemo() && user.id === PREVIEW_DEMO_USER.id &&
            previousUser != null && JSON.parse(previousUser)?.id === user.id;
        } catch {
          // Malformed or unavailable storage is not evidence of an existing session.
        }
        if (!restoredPreview) {
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new CustomEvent('cfb:login'));
        }

        setStatus('success');
        setMessage(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);

        // New user → onboarding; existing user → dashboard
        const destination = searchParams?.get('uid') ? '/' : '/';
        redirectTimer = setTimeout(() => router.push(destination), 1200);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      });
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLandmark className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          {status === 'loading' && (
            <>
              <div
                aria-hidden="true"
                className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
              />
              <h1 className="text-lg font-semibold">Verifying…</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-xs font-semibold uppercase tracking-wide text-status-success">
                OK
              </div>
              <h1 className="text-lg font-semibold">Welcome!</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">Redirecting…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive-accessible">
                !
              </div>
              <h1 className="text-lg font-semibold">Authentication Failed</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => router.push('/login')}>Back to Login</Button>
                <Button onClick={() => router.push('/register')}>Create Account</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </MainLandmark>
  );
}
