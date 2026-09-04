'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { applyPreviewDemoSession, PREVIEW_DEMO_USER } from '@/lib/preview-demo';

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startDemo() {
      try {
        const result = await apiRequest<{ user?: typeof PREVIEW_DEMO_USER }>(
          '/api/auth/demo',
          { method: 'POST', signal: AbortSignal.timeout(2500) },
        );
        if (cancelled) return;
        applyPreviewDemoSession({
          ...PREVIEW_DEMO_USER,
          ...(result?.user ?? {}),
          email: result?.user?.email ?? PREVIEW_DEMO_USER.email,
          role: result?.user?.role ?? PREVIEW_DEMO_USER.role,
        });
      } catch {
        if (cancelled) return;
        applyPreviewDemoSession();
      }

      if (!cancelled) {
        router.replace('/dashboard/founder');
      }
    }

    startDemo().catch(() => {
      if (!cancelled) {
        setError('Demo login failed. Please try again.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Demo unavailable</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Loading demo…</h2>
          <p className="text-sm text-muted-foreground">Setting up your demo environment</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      </div>
    </div>
  );
}
