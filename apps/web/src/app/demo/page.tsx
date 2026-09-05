'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { applyPreviewDemoSession } from '@/lib/preview-demo';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    applyPreviewDemoSession();
    router.replace('/dashboard/founder');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Loading demo…</h2>
          <p className="text-sm text-muted-foreground">Opening the full product with sample data</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      </div>
    </div>
  );
}
