'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { CopilotWorkspace } from '@/components/ai/CopilotWorkspace';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AIPageInner() {
  const searchParams = useSearchParams();
  const { hasSession, mounted } = useSession();
  const initialPrompt = searchParams?.get('q') ?? undefined;

  if (!mounted) {
    return (
      <AppShell fullHeight contentClassName="min-h-0">
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading assistant…
        </div>
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell title="AI Assistant" description="Sign in to let the copilot read your graph and act on it.">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card px-6 py-16 text-center">
          <Sparkles className="h-8 w-8 text-violet-500" />
          <p className="max-w-md text-sm text-muted-foreground">
            The full-page assistant uses your profile, matches, intros, and messages. Sign in to continue.
          </p>
          <Button asChild>
            <Link href="/login?redirect=/ai">Sign in</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fullHeight contentClassName="min-h-0 flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border/60 lg:border-b-0">
        <div className="hidden border-b border-border/60 px-4 py-2.5 lg:block">
          <h1 className="text-base font-semibold tracking-tight">AI Assistant</h1>
          <p className="text-xs text-muted-foreground">
            Full workspace · same tools as the popup · writes confirm before they hit the API
          </p>
        </div>
        <CopilotWorkspace variant="page" initialPrompt={initialPrompt ?? undefined} />
      </div>
    </AppShell>
  );
}

export default function AIPage() {
  return (
    <Suspense
      fallback={
        <AppShell fullHeight contentClassName="min-h-0">
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading assistant…
          </div>
        </AppShell>
      }
    >
      <AIPageInner />
    </Suspense>
  );
}
