'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token';

async function verifyEmail(token: string): Promise<{ ok: boolean; email?: string }> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const response = await fetch(`${apiBase}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Verification failed');
  }
  
  return response.json();
}

async function resendVerification(email: string): Promise<{ ok: boolean }> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const response = await fetch(`${apiBase}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to resend verification');
  }
  
  return response.json();
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const token = searchParams?.get('token');
  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'no-token');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    verifyEmail(token)
      .then((result) => {
        setStatus('success');
        setVerifiedEmail(result.email || null);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Verification failed');
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    try {
      await resendVerification(resendEmail.trim());
      setResendSent(true);
      success('Verification email sent', 'Check your inbox for the verification link.');
    } catch (err: any) {
      showError('Failed to send', err.message || 'Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-xl font-bold text-foreground">CoFounderBay</span>
          </Link>
        </div>

        <Card className="border-border/60 shadow-lg">
          {status === 'loading' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="icon-xl text-primary-emphasis animate-spin" aria-hidden="true" />
                </div>
                <CardTitle>Verifying your email</CardTitle>
                <CardDescription>Please wait while we verify your email address...</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse w-2/3" />
                </div>
              </CardContent>
            </>
          )}

          {status === 'success' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="icon-xl text-emerald-500" aria-hidden="true" />
                </div>
                <CardTitle className="text-emerald-600 dark:text-emerald-400">Email Verified!</CardTitle>
                <CardDescription>
                  {verifiedEmail ? (
                    <>Your email <strong className="text-foreground">{verifiedEmail}</strong> has been verified.</>
                  ) : (
                    'Your email address has been successfully verified.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You now have full access to all CoFounderBay features.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => router.push('/')} className="w-full gap-2">
                    Go to Dashboard
                    <ArrowRight className="icon-sm" aria-hidden="true" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/profile')} className="w-full">
                    Complete Your Profile
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {status === 'error' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="icon-xl text-destructive-emphasis" aria-hidden="true" />
                </div>
                <CardTitle className="text-destructive-emphasis">Verification Failed</CardTitle>
                <CardDescription>
                  {errorMessage || 'The verification link is invalid or has expired.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground mb-3">Common reasons:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>The link has expired (valid for 24 hours)</li>
                    <li>The link has already been used</li>
                    <li>The link was copied incorrectly</li>
                  </ul>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm font-medium text-foreground mb-3">Request a new verification link:</p>
                  {resendSent ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                      <CheckCircle2 className="icon-md text-emerald-500 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Verification email sent! Check your inbox.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleResend} className="space-y-3">
                      <div>
                        <Label htmlFor="email" className="sr-only">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={isResending}>
                        {isResending ? (
                          <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                        ) : (
                          <Mail className="icon-sm" aria-hidden="true" />
                        )}
                        Resend Verification Email
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {status === 'no-token' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                  <Mail className="icon-xl text-amber-500" aria-hidden="true" />
                </div>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>
                  Enter your email to receive a verification link
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {resendSent ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <CheckCircle2 className="icon-lg text-emerald-500 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                      Verification email sent!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check your inbox and click the verification link.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-3">
                    <div>
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isResending}>
                      {isResending ? (
                        <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                      ) : (
                        <Mail className="icon-sm" aria-hidden="true" />
                      )}
                      Send Verification Email
                    </Button>
                  </form>
                )}
                
                <div className="text-center pt-2">
                  <Link href="/login" className="text-sm text-primary-emphasis hover:underline">
                    Back to Login
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help?{' '}
          <Link href="/help" className="text-primary-emphasis hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
