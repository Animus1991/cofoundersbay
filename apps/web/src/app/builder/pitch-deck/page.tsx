'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PitchDeckBuilder } from '@/components/builder/PitchDeckBuilder';
import { BuilderAskAiButton } from '@/components/builder/BuilderStageChrome';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

function PitchDeckPageContent() {
  const {
    workspace,
    documents,
    activeDocument,
    isLoadingWorkspaces,
    error,
    loadWorkspaces,
    updateDocumentSection,
    updateDocument,
    createDocument,
    selectDocument,
    clearError,
  } = useBuilder();

  useEffect(() => {
    loadWorkspaces(true);
  }, [loadWorkspaces]);

  useEffect(() => {
    const pitch = documents.find((d) => d.type === 'pitch_deck');
    if (pitch && activeDocument?.id !== pitch.id) {
      void selectDocument(pitch.id);
    }
  }, [documents, activeDocument?.id, selectDocument]);

  const pitchDocument = documents.find((d) => d.type === 'pitch_deck');
  const rawContent =
    (activeDocument?.type === 'pitch_deck' ? activeDocument.content : undefined) ??
    pitchDocument?.content ??
    {};

  const ideaCore = documents.find((d) => d.type === 'idea_core')?.content ?? {};
  const bmc = documents.find((d) => d.type === 'business_model_canvas')?.content ?? {};
  const workspaceName = workspace?.startupName || workspace?.name || '';

  const handleSave = async (data: {
    companyName?: string;
    tagline?: string;
    askAmount?: string;
    slides?: unknown[];
    deckType?: string;
  }) => {
    try {
      let doc = documents.find((d) => d.type === 'pitch_deck');
      if (!doc) {
        doc = await createDocument(
          'pitch_deck',
          data.companyName ? `${data.companyName} Pitch Deck` : 'Pitch Deck',
        );
      }
      await updateDocumentSection(doc.id, 'pitchDeck', data as Record<string, any>);
      const slides = Array.isArray(data.slides) ? data.slides : [];
      const filled = slides.filter(
        (s) => typeof s === 'object' && s && 'content' in s && String((s as { content?: string }).content || '').trim(),
      ).length;
      await updateDocument(doc.id, {
        completionPercent: slides.length ? Math.round((filled / slides.length) * 100) : 0,
      });
    } catch {
      // BuilderContext already surfaces the error banner.
    }
  };

  const askPrompt = `Build an investor pitch deck for ${workspaceName || 'this startup'}. Idea Core: ${ideaCore.problemStatement || ideaCore.solution || 'not filled yet'}. Value proposition: ${bmc.valueProposition || bmc.valuePropositions || 'not filled yet'}. Recommend 10 slides and draft Cover + Problem.`;

  if (isLoadingWorkspaces) {
    return (
      <AppShell showHelp>
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <BilingualText en={builderEn('loading_pitch')} el={builderEl('loading_pitch')} compact />
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHelp contentClassName="overflow-x-clip" actions={<BuilderAskAiButton />}>
      <div className="min-w-0 space-y-6 overflow-x-clip">
        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <AlertCircle className="icon-md shrink-0 text-destructive-accessible" />
              <p className="text-sm text-destructive-accessible">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError} className="sm:ml-auto">
              <BilingualText en={builderEn('dismiss')} el={builderEl('dismiss')} compact />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-start gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-muted-foreground" aria-label={bilingualAria(builderEn('pitch_back'), builderEl('pitch_back'))} asChild>
              <Link href="/builder">
                <ArrowLeft className="icon-sm" />
                <CfbGlyph name="builder" className="icon-sm" />
                <BilingualText en={builderEn('pitch_back')} el={builderEl('pitch_back')} compact />
              </Link>
            </Button>
            <p className="max-w-2xl text-sm leading-snug text-muted-foreground">
              <BilingualText en={builderEn('pitch_lead')} el={builderEl('pitch_lead')} />
              {workspaceName ? ` · ${workspaceName}` : ''}
            </p>
          </div>
          <AIInsightButton className="h-9 w-full sm:w-auto" prompt={askPrompt} />
        </div>

        <PitchDeckBuilder
          hideTitle
          onSave={handleSave}
          initialData={rawContent}
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
