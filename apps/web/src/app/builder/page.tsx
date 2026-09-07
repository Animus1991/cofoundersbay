'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { BuilderWorkspace } from '@/components/builder/BuilderWorkspace';
import { IdeaCore } from '@/components/builder/IdeaCore';
import { BusinessModelCanvas } from '@/components/builder/BusinessModelCanvas';
import { MarketAnalysis } from '@/components/builder/MarketAnalysis';
import { MVPPlanner } from '@/components/builder/MVPPlanner';
import { FinancialPlanning } from '@/components/builder/FinancialPlanning';
import { PitchDeckBuilder } from '@/components/builder/PitchDeckBuilder';
import { ReadinessScoring } from '@/components/builder/ReadinessScoring';
import { ApplicationGenerator } from '@/components/builder/ApplicationGenerator';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { STATUS } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';
import { CollabToolbar } from '@/components/builder/CollabToolbar';
import { WorkspaceMetricsPanels } from '@/components/gamification/WorkspaceMetricsPanels';
import { BehavioralNudge } from '@/components/behavioral/BehavioralNudge';
import { VersionHistoryDrawer } from '@/components/builder/VersionHistoryDrawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { bilingualAria } from '@/lib/i18n/format';
import type { BuilderDocumentType } from '@/lib/builder-api';

const BUILDER_REVIEW_DISMISS_KEY = 'cfb_builder_review_dismissed_v1';

const BUILDER_TABS: { id: string; glyph: CfbGlyphName; labelEn: string; labelEl: string }[] = [
  { id: 'overview', glyph: 'builder', labelEn: builderEn('tab_overview'), labelEl: builderEl('tab_overview') },
  { id: 'idea-core', glyph: 'spark', labelEn: builderEn('tab_idea'), labelEl: builderEl('tab_idea') },
  { id: 'bmc', glyph: 'target', labelEn: builderEn('tab_bmc'), labelEl: builderEl('tab_bmc') },
  { id: 'market', glyph: 'chart', labelEn: builderEn('tab_market'), labelEl: builderEl('tab_market') },
  { id: 'pitch-deck', glyph: 'builder', labelEn: builderEn('tab_pitch'), labelEl: builderEl('tab_pitch') },
  { id: 'mvp', glyph: 'flag', labelEn: builderEn('tab_mvp'), labelEl: builderEl('tab_mvp') },
  { id: 'financials', glyph: 'wallet', labelEn: builderEn('tab_financials'), labelEl: builderEl('tab_financials') },
  { id: 'readiness', glyph: 'award', labelEn: builderEn('tab_readiness'), labelEl: builderEl('tab_readiness') },
  { id: 'applications', glyph: 'applications', labelEn: builderEn('tab_applications'), labelEl: builderEl('tab_applications') },
];

function AskAiButton() {
  const { open } = usePopupChat();
  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => open()}>
      <CfbGlyph name="spark" className="icon-sm" />
      <BilingualText en={builderEn('ask_ai')} el={builderEl('ask_ai')} compact />
    </Button>
  );
}

function BuilderPageContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [reviewBannerDismissed, setReviewBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(BUILDER_REVIEW_DISMISS_KEY) === 'true') {
      setReviewBannerDismissed(true);
    }
  }, []);
  const {
    workspace,
    isLoadingWorkspaces,
    documents,
    activeDocument,
    onlineCollaborators,
    error,
    isGenerating,
    loadWorkspaces,
    updateDocumentSection,
    generateContent,
    createDocument,
    clearError,
  } = useBuilder();

  useEffect(() => {
    loadWorkspaces(true);
  }, [loadWorkspaces]);

  const handleSave = async (section: string, data: unknown) => {
    if (!activeDocument) return;
    await updateDocumentSection(activeDocument.id, section, (data ?? {}) as Record<string, any>);
  };

  const handleSaveApplications = async (data: unknown) => {
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

  const handleGenerate = async (documentType: string, sectionKey?: string) => {
    try {
      const result = await generateContent(documentType as BuilderDocumentType, sectionKey);
      return result.content;
    } catch (err) {
      console.error('Generation failed:', err);
      return null;
    }
  };

  const getDocumentContent = (type: string) => {
    const doc = documents.find((d) => d.type === type);
    return doc?.content || {};
  };

  if (isLoadingWorkspaces) {
    return (
      <AppShell showHelp>
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <BilingualText en={builderEn('loading')} el={builderEl('loading')} compact />
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHelp actions={<AskAiButton />}>
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

        <BehavioralNudge surface="builder" compact />

        {!reviewBannerDismissed && documents.length >= 2 && (
          <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', STATUS.warning.border, STATUS.warning.bg)}>
            <CfbGlyph name="award" className={cn('icon-sm shrink-0', STATUS.warning.icon)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                <BilingualText en="Your artifacts are ready for expert review" el="Τα τεχνουργήματά σας είναι έτοιμα για αξιολόγηση ειδικού" />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <BilingualText en="Get actionable feedback from a domain expert — investors, mentors, or industry specialists." el="Λάβετε πρακτική ανατροφοδότηση από ειδικό τομέα — επενδυτές, μέντορες ή ειδικούς κλάδου." />
              </p>
            </div>
            <a href="/expert-reviews" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn('h-7 gap-1 text-xs font-semibold hover:bg-status-warning-bg', STATUS.warning.text)}>
                <BilingualText en="Get review" el="Αξιολόγηση" compact /> <ArrowRight className="icon-sm" />
              </Button>
            </a>
            <button
              type="button"
              onClick={() => { setReviewBannerDismissed(true); localStorage.setItem(BUILDER_REVIEW_DISMISS_KEY, 'true'); }}
              className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
              title={bilingualAria('Dismiss', 'Απόρριψη')}
              aria-label={bilingualAria('Dismiss expert-review suggestion', 'Απόρριψη πρότασης αξιολόγησης')}
            >
              <X className="icon-sm" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {workspace?.name && (
              <p className="text-lg font-semibold tracking-tight text-foreground">{workspace.name}</p>
            )}
            <p className="mt-0.5 text-sm text-muted-foreground">
              {workspace?.description
                ? workspace.description
                : <BilingualText en={builderEn('tagline')} el={builderEl('tagline')} />}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onlineCollaborators.length > 0 && (
              <div className="flex items-center gap-1">
                <CfbGlyph name="people" className="icon-sm text-muted-foreground" />
                <div className="flex -space-x-2">
                  {onlineCollaborators.slice(0, 3).map((c) => (
                    <Avatar key={c.odId} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="bg-primary/20 text-xs">
                        {c.odName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {onlineCollaborators.length > 3 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      +{onlineCollaborators.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="icon-sm animate-spin" />
                <BilingualText en={builderEn('ai_generating')} el={builderEl('ai_generating')} compact />
              </div>
            )}
          </div>
        </div>

        {activeDocument && workspace && (
          <CollabToolbar
            documentId={activeDocument.id}
            workspaceId={workspace.id}
            documentTitle={activeDocument.title}
            onHistoryClick={() => setShowVersionHistory(true)}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto rounded-xl">
            {BUILDER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex min-h-10 shrink-0 items-center gap-1.5 text-xs"
                title={bilingualAria(tab.labelEn, tab.labelEl)}
              >
                <CfbGlyph name={tab.glyph} className="icon-sm" />
                <BilingualText en={tab.labelEn} el={tab.labelEl} compact />
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <BuilderWorkspace />
          </TabsContent>

          <TabsContent value="idea-core" className="space-y-6">
            <IdeaCore
              onSave={(data) => handleSave('ideaCore', data)}
              initialData={getDocumentContent('idea_core')}
            />
          </TabsContent>

          <TabsContent value="bmc" className="space-y-6">
            <BusinessModelCanvas
              onSave={(data) => handleSave('bmc', data)}
              initialData={getDocumentContent('business_model_canvas')}
            />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <MarketAnalysis
              onSave={(data) => handleSave('marketAnalysis', data)}
              initialData={getDocumentContent('market_analysis')}
            />
          </TabsContent>

          <TabsContent value="pitch-deck" className="space-y-6">
            <PitchDeckBuilder
              onSave={(data) => handleSave('pitchDeck', data)}
              initialData={getDocumentContent('pitch_deck')}
            />
          </TabsContent>

          <TabsContent value="mvp" className="space-y-6">
            <MVPPlanner
              onSave={(data) => handleSave('mvpPlan', data)}
              initialData={getDocumentContent('mvp_plan')}
            />
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            <FinancialPlanning
              onSave={(data) => handleSave('financials', data)}
              initialData={getDocumentContent('financials')}
            />
          </TabsContent>

          <TabsContent value="readiness" className="space-y-6">
            <ReadinessScoring workspaceData={documents.reduce((acc, d) => ({ ...acc, [d.type]: d.content }), {})} />
            {workspace?.id && (
              <WorkspaceMetricsPanels workspaceId={workspace.id} />
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationGenerator
              onSave={handleSaveApplications}
              initialData={getDocumentContent('application')}
              workspaceData={documents.reduce((acc, d) => ({ ...acc, [d.type]: d.content }), {})}
            />
          </TabsContent>
        </Tabs>
      </div>

      {activeDocument && (
        <VersionHistoryDrawer
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          documentId={activeDocument.id}
          documentTitle={activeDocument.title}
          currentVersion={activeDocument.version}
          onRestored={() => setShowVersionHistory(false)}
        />
      )}
    </AppShell>
  );
}

export default function BuilderPage() {
  return (
    <BuilderProvider>
      <BuilderPageContent />
    </BuilderProvider>
  );
}
