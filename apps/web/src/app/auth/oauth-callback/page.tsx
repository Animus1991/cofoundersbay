'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMe } from '@/lib/api';
import { isPreviewDemo, PREVIEW_DEMO_USER } from '@/lib/preview-demo';
import { MainLandmark } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [provider, setProvider] = useState('');
  // The provider's own error text, shown as it came; null for our own failure.
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    const providerParam = searchParams?.get('provider') ?? 'OAuth';
    const error = searchParams?.get('error');
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    if (error) {
      setStatus('error');
      setErrorDetail(error);
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
        setProvider(providerParam.charAt(0).toUpperCase() + providerParam.slice(1));

        // New user → onboarding; existing user → dashboard
        const destination = searchParams?.get('uid') ? '/' : '/';
        redirectTimer = setTimeout(() => router.push(destination), 1200);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setErrorDetail(null);
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
        {/* The column stays centred on the page; the card reads like every
            other card: a mark, the title beside it, the line under it, and
            the actions on the mark's edge. */}
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            {status === 'loading' && (
              <div
                aria-hidden="true"
                className="h-10 w-10 shrink-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
              />
            )}
            {status === 'success' && (
              <div data-card-mark="" aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-success-bg text-xs font-semibold uppercase tracking-wide text-status-success">
                OK
              </div>
            )}
            {status === 'error' && (
              <div data-card-mark="" aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-sm font-semibold text-destructive-accessible">
                !
              </div>
            )}
            <div className="min-w-0">
              {status === 'loading' && (
                <>
                  <h1 className="card-title text-foreground"><BilingualText en="Signing you in" el="Γίνεται σύνδεση" wrap /></h1>
                  <p className="card-subtitle mt-0.5">
                    <BilingualText en="Checking the session your provider returned." el="Ελέγχουμε τη συνεδρία που επέστρεψε ο πάροχος." wrap />
                  </p>
                </>
              )}
              {status === 'success' && (
                <>
                  <h1 className="card-title text-foreground"><BilingualText en="Welcome" el="Καλώς ήρθατε" wrap /></h1>
                  <p className="card-subtitle mt-0.5" role="status">
                    <BilingualText en={`Signed in with ${provider}. Taking you in…`} el={`Συνδεθήκατε με ${provider}. Σας μεταφέρουμε…`} wrap />
                  </p>
                </>
              )}
              {status === 'error' && (
                <>
                  <h1 className="card-title text-foreground"><BilingualText en="Sign-in failed" el="Η σύνδεση απέτυχε" wrap /></h1>
                  <p className="card-subtitle mt-0.5">
                    {errorDetail ?? <BilingualText en="The session could not be confirmed. Try again, or create an account." el="Η συνεδρία δεν επιβεβαιώθηκε. Δοκιμάστε ξανά ή δημιουργήστε λογαριασμό." wrap />}
                  </p>
                </>
              )}
            </div>
          </div>
          {status === 'error' && (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/login')}><BilingualText en="Back to sign in" el="Πίσω στη σύνδεση" compact /></Button>
              <Button onClick={() => router.push('/register')}><BilingualText en="Create account" el="Δημιουργία λογαριασμού" compact /></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLandmark>
  );
}
