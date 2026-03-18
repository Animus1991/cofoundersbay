'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resendVerification } from '@/lib/api';
import Link from 'next/link';

export default function VerifyPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResendLoading(true);
    try {
      await resendVerification(email);
    } catch {
      // Silently ignore — anti-enumeration response
    } finally {
      setResendSent(true);
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to{' '}
            {email ? <strong className="text-foreground">{email}</strong> : 'your email address'}.
            Click the link in that email to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder or request a new link below.
          </p>

          {!resendSent ? (
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleResend}
              disabled={!email || resendLoading}
            >
              {resendLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                : 'Resend Verification Email'
              }
            </Button>
          ) : (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              A new verification link has been sent (if the email exists).
            </p>
          )}

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
