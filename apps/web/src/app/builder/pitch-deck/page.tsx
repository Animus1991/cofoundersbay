'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PitchDeckBuilder } from '@/components/builder/PitchDeckBuilder';
import { BuilderAskAiButton } from '@/components/builder/BuilderStageChrome';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

function PitchDeckPageContent() {
  const {
    isLoadingWorkspaces,
    documents,
    activeDocument,
    error,
    loadWorkspaces,
    updateDocumentSection,
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

  const handleSave = async (data: Record<string, any>) => {
    try {
      let doc = documents.find((d) => d.type === 'pitch_deck');
      if (!doc) {
        doc = await createDocument('pitch_deck', 'Pitch Deck');
      }
      await updateDocumentSection(doc.id, 'pitchDeck', data);
    } catch {
      // BuilderContext already surfaces the error banner.
    }
  };

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
    <AppShell showHelp actions={<BuilderAskAiButton />}>
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <AlertCircle className="icon-md text-destructive-accessible" />
            <p className="text-sm text-destructive-accessible">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              <BilingualText en={builderEn('dismiss')} el={builderEl('dismiss')} compact />
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-start gap-3">
          <Link href="/builder">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-xl text-muted-foreground"
              aria-label={bilingualAria(builderEn('pitch_back'), builderEl('pitch_back'))}
            >
              <ArrowLeft className="icon-sm" />
              <CfbGlyph name="builder" className="icon-sm" />
              <BilingualText en={builderEn('pitch_back')} el={builderEl('pitch_back')} compact />
            </Button>
          </Link>
          <p className="max-w-2xl text-sm text-muted-foreground">
            <BilingualText en={builderEn('pitch_lead')} el={builderEl('pitch_lead')} />
          </p>
        </div>

        <PitchDeckBuilder hideTitle onSave={handleSave} initialData={rawContent} />
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
