'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { ApplicationGenerator } from '@/components/builder/ApplicationGenerator';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

function ApplicationsPageContent() {
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
    const application = documents.find((d) => d.type === 'application');
    if (application && activeDocument?.id !== application.id) {
      void selectDocument(application.id);
    }
  }, [documents, activeDocument?.id, selectDocument]);

  const applicationDocument = documents.find((d) => d.type === 'application');
  const rawContent =
    (activeDocument?.type === 'application' ? activeDocument.content : undefined) ??
    applicationDocument?.content ??
    {};

  const handleSave = async (data: unknown) => {
    try {
      let doc = documents.find((d) => d.type === 'application');
      if (!doc) {
        doc = await createDocument('application', 'Program applications');
      }
      await updateDocumentSection(doc.id, 'applications', { applications: data } as Record<string, any>);
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
            <BilingualText en={builderEn('loading_apps')} el={builderEl('loading_apps')} compact />
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHelp askAi="Draft YC, Techstars, university, or grant answers from Idea Core, Market, and Pitch.">
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
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-muted-foreground" aria-label={bilingualAria(builderEn('app_back'), builderEl('app_back'))} asChild>
            <Link href="/builder">
              <ArrowLeft className="icon-sm" />
              <CfbGlyph name="builder" className="icon-sm" />
              <BilingualText en={builderEn('app_back')} el={builderEl('app_back')} compact />
            </Link>
          </Button>
          <p className="max-w-2xl text-sm text-muted-foreground">
            <BilingualText en={builderEn('app_lead')} el={builderEl('app_lead')} />
          </p>
        </div>

        <ApplicationGenerator
          hideTitle
          onSave={handleSave}
          initialData={rawContent}
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
