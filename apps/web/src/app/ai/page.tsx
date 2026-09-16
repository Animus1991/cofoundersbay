'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
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
          <BilingualText en="Loading assistant…" el="Φόρτωση βοηθού…" compact />
        </div>
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell askAi={false}>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card px-6 py-16 text-center">
          <Sparkles className="h-8 w-8 text-violet-500" />
          <p className="max-w-md text-sm text-muted-foreground">
            <BilingualText
              en="The full-page assistant uses your profile, matches, intros, and messages. Sign in to continue."
              el="Ο βοηθός πλήρους σελίδας διαβάζει το προφίλ, τις αντιστοιχίσεις, τις συστάσεις και τα μηνύματά σας. Συνδεθείτε για να συνεχίσετε."
            />
          </p>
          <Button asChild>
            <Link href="/login?redirect=/ai">
              <BilingualText en="Sign in" el="Σύνδεση" compact />
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fullHeight contentClassName="min-h-0 flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border/60 lg:border-b-0">
        <div className="border-b border-border/60 px-4 py-2.5">
          <h1 className="text-base font-semibold tracking-tight">
            <BilingualText en="AI Assistant" el="Βοηθός AI" compact />
          </h1>
          {/* An em dash inside the sentence, not a middot: `BilingualText`
              joins the two languages with a middot, and a third one inside a
              half would read as three fragments rather than one line twice. */}
          <p className="text-xs text-muted-foreground">
            <BilingualText
              en="Same tools as the popup — writes wait for your confirm"
              el="Ίδια εργαλεία με το αναδυόμενο — οι εγγραφές περιμένουν την επιβεβαίωσή σας"
              compact
            />
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
            <BilingualText en="Loading assistant…" el="Φόρτωση βοηθού…" compact />
          </div>
        </AppShell>
      }
    >
      <AIPageInner />
    </Suspense>
  );
}
