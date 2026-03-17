'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setStatus('success');
      setMessage(`Successfully signed in with ${provider || 'OAuth'}!`);
      
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setStatus('error');
      setMessage('Authentication failed. No tokens received.');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-lg font-semibold mb-2">Authenticating</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Success!</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground mt-2">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-lg font-semibold mb-2">Authentication Failed</h2>
              <p className="text-sm text-muted-foreground mb-4">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push('/login')}>
                  Back to Login
                </Button>
                <Button onClick={() => router.push('/register')}>
                  Create Account
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
