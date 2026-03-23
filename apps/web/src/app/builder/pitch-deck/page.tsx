'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PitchDeckBuilder } from '@/components/builder/PitchDeckBuilder';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Presentation, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function PitchDeckPageContent() {
  const {
    workspace,
    workspaces,
    isLoadingWorkspaces,
    documents,
    activeDocument,
    error,
    loadWorkspaces,
    selectWorkspace,
    updateDocumentSection,
    clearError,
  } = useBuilder();

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!workspace && workspaces.length > 0) {
      selectWorkspace(workspaces[0].id);
    }
  }, [workspace, workspaces, selectWorkspace]);

  const handleSave = async (data: any) => {
    if (!activeDocument) return;
    await updateDocumentSection(activeDocument.id, 'pitchDeck', data);
  };

  const getDocumentContent = (type: string) => {
    const doc = documents.find((d) => d.type === type);
    return doc?.content || {};
  };

  if (isLoadingWorkspaces) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Link href="/builder">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Presentation className="h-6 w-6 text-primary" />
              </div>
              Pitch Deck Builder
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a compelling pitch deck for investors and stakeholders
            </p>
          </div>
        </div>

        <PitchDeckBuilder
          onSave={handleSave}
          initialData={getDocumentContent('pitch_deck')}
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
