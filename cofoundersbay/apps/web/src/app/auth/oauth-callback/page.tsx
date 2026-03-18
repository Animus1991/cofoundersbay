'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMe } from '@/lib/api';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your session…');

  useEffect(() => {
    const provider = searchParams.get('provider') ?? 'OAuth';
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    // Cookies are already set by the backend redirect.
    // Verify by calling getMe() — uses the httpOnly cookie.
    getMe()
      .then(({ user }) => {
        // Store display data only (no tokens)
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('cfb:login'));

        setStatus('success');
        setMessage(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);

        // New user → onboarding; existing user → dashboard
        const destination = searchParams.get('uid') ? '/' : '/';
        setTimeout(() => router.push(destination), 1200);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h2 className="text-lg font-semibold">Verifying…</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="text-lg font-semibold">Welcome!</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">Redirecting…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold">Authentication Failed</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => router.push('/login')}>Back to Login</Button>
                <Button onClick={() => router.push('/register')}>Create Account</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
