'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PitchDeckBuilder } from '@/components/builder/PitchDeckBuilder';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Presentation, Loader2, AlertCircle } from 'lucide-react';
import type { BuilderDocumentType } from '@/lib/builder-api';

function PitchDeckPageContent() {
  const {
    workspace,
    documents,
    isLoadingWorkspaces,
    error,
    loadWorkspaces,
    createDocument,
    updateDocument,
    clearError,
  } = useBuilder();

  useEffect(() => {
    loadWorkspaces(true);
  }, [loadWorkspaces]);

  const ideaCore = documents.find((d) => d.type === 'idea_core')?.content ?? {};
  const bmc = documents.find((d) => d.type === 'business_model_canvas')?.content ?? {};
  const pitchDoc = documents.find((d) => d.type === 'pitch_deck');
  const workspaceName = workspace?.startupName || workspace?.name || '';

  const pitchRaw = pitchDoc?.content || {};
  const pitchInitial = Array.isArray((pitchRaw as { slides?: unknown }).slides)
    ? pitchRaw
    : ((pitchRaw as { pitchDeck?: Record<string, unknown> }).pitchDeck ?? {});

  const handleSave = async (data: {
    companyName?: string;
    tagline?: string;
    askAmount?: string;
    slides?: unknown[];
    deckType?: string;
  }) => {
    if (!workspace) return;
    let doc = documents.find((d) => d.type === 'pitch_deck');
    if (!doc) {
      doc = await createDocument(
        'pitch_deck' as BuilderDocumentType,
        data.companyName ? `${data.companyName} Pitch Deck` : 'Pitch Deck',
      );
    }
    const filled = Array.isArray(data.slides)
      ? data.slides.filter((s) => typeof s === 'object' && s && 'content' in s && String((s as { content?: string }).content || '').trim()).length
      : 0;
    const total = Array.isArray(data.slides) ? data.slides.length : 0;
    await updateDocument(doc.id, {
      content: data,
      completionPercent: total ? Math.round((filled / total) * 100) : 0,
    });
  };

  const askPrompt = `Build an investor pitch deck for ${workspaceName || 'this startup'}. Idea Core: ${ideaCore.problemStatement || ideaCore.solution || 'not filled yet'}. Value proposition: ${bmc.valueProposition || 'not filled yet'}. Recommend 10 slides and draft Cover + Problem.`;

  if (isLoadingWorkspaces) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      askAi={false}
      contentClassName="overflow-x-clip"
    >
      <div className="min-w-0 space-y-6 overflow-x-clip">
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <AlertCircle className="icon-md shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError} className="sm:ml-auto">
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link href="/builder" className="mt-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Back to Startup Builder">
                <ArrowLeft className="icon-sm" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="flex items-start gap-3 text-2xl font-semibold tracking-tight text-foreground">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <Presentation className="icon-lg text-primary" />
                </div>
                <span className="min-w-0 break-words">Pitch Deck Builder</span>
              </h1>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                Create a compelling pitch deck for investors and stakeholders
                {workspaceName ? ` · ${workspaceName}` : ''}
              </p>
            </div>
          </div>
          <AIInsightButton className="h-9 w-full sm:w-auto" prompt={askPrompt} />
        </div>

        <PitchDeckBuilder
          onSave={handleSave}
          initialData={pitchInitial}
          workspaceName={workspaceName}
          ideaCore={ideaCore}
          askPrompt={askPrompt}
        />
      </div>
    </AppShell>
  );
}

export default function PitchDeckPage() {
  return (
    <BuilderProvider>
      <PitchDeckPageContent />
    </BuilderProvider>
  );
}
