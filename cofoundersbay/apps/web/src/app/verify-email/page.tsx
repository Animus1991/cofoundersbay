'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyEmail, resendVerification } from '@/lib/api';

type Status = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'no-token');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then(({ email }) => {
        setVerifiedEmail(email);
        setStatus('success');
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Verification failed. The link may have expired.');
        setStatus('error');
      });
  }, [token]);

  async function handleResend() {
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      await resendVerification(resendEmail);
      setResendSent(true);
    } catch {
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Verifying your email…</h2>
              <p className="text-sm text-muted-foreground">Please wait while we confirm your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="text-lg font-semibold text-foreground">Email verified!</h2>
              <p className="text-sm text-muted-foreground">
                {verifiedEmail
                  ? `${verifiedEmail} has been verified.`
                  : 'Your email has been verified successfully.'}
              </p>
              <p className="text-sm text-muted-foreground">You can now sign in to your account.</p>
              <Button className="w-full mt-2" onClick={() => router.push('/login')}>
                Sign In
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Verification failed</h2>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>

              {!resendSent ? (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">Need a new verification link?</p>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    className="w-full"
                    onClick={handleResend}
                    disabled={!resendEmail || resendLoading}
                  >
                    {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend Verification Email'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 pt-2">
                  If that email is registered and unverified, a new link has been sent.
                </p>
              )}

              <Button variant="outline" onClick={() => router.push('/login')} className="w-full mt-2">
                Back to Login
              </Button>
            </>
          )}

          {status === 'no-token' && (
            <>
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">No verification token</h2>
              <p className="text-sm text-muted-foreground">
                This page requires a verification token from the email we sent you.
              </p>
              <Button variant="outline" onClick={() => router.push('/login')} className="w-full mt-2">
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
