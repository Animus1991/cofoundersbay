'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ApplicationGenerator } from '@/components/builder/ApplicationGenerator';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardList, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ApplicationsPageContent() {
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
    await updateDocumentSection(activeDocument.id, 'applications', data);
  };

  if (isLoadingWorkspaces) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="icon-md text-destructive-emphasis" aria-hidden="true" />
            <p className="text-sm text-destructive-emphasis">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button aria-label="Go back" variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/builder">
              <ArrowLeft className="icon-sm" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="icon-lg text-primary-emphasis" aria-hidden="true" />
              </div>
              Application Generator
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and manage applications for accelerators, incubators, and grants
            </p>
          </div>
        </div>

        <ApplicationGenerator
          onSave={handleSave}
          workspaceData={documents.reduce((acc, d) => ({ ...acc, [d.type]: d.content }), {})}
        />
      </div>
    </AppShell>
  );
}

export default function ApplicationsPage() {
  return (
    <BuilderProvider>
      <ApplicationsPageContent />
    </BuilderProvider>
  );
}
