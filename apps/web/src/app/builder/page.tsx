'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { bilingualAria } from '@/lib/i18n/format';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import type { BuilderDocumentType } from '@/lib/builder-api';
import { AIInsightButton } from '@/components/ai/AIInsightButton';

const BUILDER_REVIEW_DISMISS_KEY = 'cfb_builder_review_dismissed_v1';

/** Greek for the preview workspace description seeded by `lib/preview-api.ts`. */
const PREVIEW_WS_DESC_EL: Record<string, string> = {
  'Sample workspace — preview demo, not live founder data.':
    'Δείγμα χώρου εργασίας — επίδειξη προεπισκόπησης, όχι πραγματικά δεδομένα ιδρυτή.',
};

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

function isBuilderTab(value: string | null): value is string {
  return Boolean(value && BUILDER_TABS.some((tab) => tab.id === value));
}

function builderHref(tab: string): string {
  return tab === 'overview' ? '/builder' : `/builder?tab=${encodeURIComponent(tab)}`;
}

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState('overview');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [reviewBannerDismissed, setReviewBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(BUILDER_REVIEW_DISMISS_KEY) === 'true') {
      setReviewBannerDismissed(true);
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams?.get('tab') ?? null;
    if (isBuilderTab(fromUrl)) setActiveTabState(fromUrl);
  }, [searchParams]);

  const setActiveTab = useCallback(
    (next: string) => {
      if (!isBuilderTab(next)) return;
      setActiveTabState(next);
      router.replace(builderHref(next), { scroll: false });
    },
    [router],
  );
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

  // Get document content by type
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
    <AppShell
      showHelp
      askAi="Summarize this startup workspace and tell me the next Builder section to complete — Idea Core, BMC, Market, or Pitch."
    >
      <div className="builder-type min-w-0 space-y-6 overflow-x-clip">
        {/* Error Alert */}
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

        <BehavioralNudge surface="builder" compact />

        {!reviewBannerDismissed && documents.length >= 2 && (
          <div className={cn('flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center', STATUS.warning.border, STATUS.warning.bg)}>
            <CfbGlyph name="award" className={cn('icon-sm shrink-0', STATUS.warning.icon)} />
            <div className="min-w-0 flex-1">
              {/* The trigger is "two or more documents exist", not "documents
                  are finished" — the stat card a few pixels below can say
                  "0 completed" while this banner runs. So the claim is about
                  what an expert can do with drafts, not that the work is done. */}
              <p className="text-sm font-semibold text-foreground">
                <BilingualText
                  en={`${documents.length} documents in progress — an expert can review drafts now`}
                  el={`${documents.length} έγγραφα σε εξέλιξη — ένας ειδικός μπορεί να αξιολογήσει τα προσχέδια τώρα`}
                />
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                <BilingualText en="Early feedback from an investor, mentor or industry specialist is cheapest before the documents are finished." el="Η έγκαιρη ανατροφοδότηση από επενδυτή, μέντορα ή ειδικό κλάδου κοστίζει λιγότερο πριν ολοκληρωθούν τα έγγραφα." />
              </p>
            </div>
            <a href="/expert-reviews" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn('h-9 w-full gap-1 text-xs font-semibold hover:bg-status-warning-bg sm:w-auto', STATUS.warning.text)}>
                <BilingualText en="Get review" el="Αξιολόγηση" compact /> <ArrowRight className="icon-sm" />
              </Button>
            </a>
            <button
              type="button"
              onClick={() => { setReviewBannerDismissed(true); localStorage.setItem(BUILDER_REVIEW_DISMISS_KEY, 'true'); }}
              className="shrink-0 rounded-xl p-1 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
              title={bilingualAria('Dismiss', 'Απόρριψη')}
              aria-label={bilingualAria('Dismiss expert-review suggestion', 'Απόρριψη πρότασης αξιολόγησης')}
            >
              <X className="icon-sm" />
            </button>
          </div>
        )}

        {/* Context Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {workspace?.name && (
              <p className="builder-title text-lg font-semibold tracking-tight text-foreground">{workspace.name}</p>
            )}
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              {/* The preview workspace ships an English description; map it so
                  the Greek-primary page is not interrupted. User workspaces
                  render whatever the founder wrote. */}
              {workspace?.description
                ? (PREVIEW_WS_DESC_EL[workspace.description]
                  ? <BilingualText en={workspace.description} el={PREVIEW_WS_DESC_EL[workspace.description]} wrap />
                  : workspace.description)
                : <BilingualText en={builderEn('tagline')} el={builderEl('tagline')} />}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <AIInsightButton
              className="h-9"
              prompt={`Startup Builder workspace "${workspace?.name ?? 'my venture'}": ${documents.length} artifacts (${documents.map((d) => `${d.title} ${d.completionPercent}%`).join(', ') || 'none yet'}). Recommend the next document — Idea Core, Business Model, interviews, pitch, MVP, or financials — and draft the first section.`}
            />
            {/* Online Collaborators */}
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
          <TabsList className="flex h-auto w-full snap-x snap-mandatory justify-start overflow-x-auto rounded-xl">
            {BUILDER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex min-h-10 shrink-0 snap-start items-center gap-1.5 text-xs"
                title={bilingualAria(tab.labelEn, tab.labelEl)}
              >
                <CfbGlyph name={tab.glyph} className="icon-sm" />
                <BilingualText en={tab.labelEn} el={tab.labelEl} compact />
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <BuilderWorkspace onOpenStage={setActiveTab} />
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
              workspaceName={workspace?.startupName || workspace?.name}
              ideaCore={getDocumentContent('idea_core')}
              bmc={getDocumentContent('business_model_canvas')}
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
            <ReadinessScoring workspaceId={workspace?.id} workspaceData={documents.reduce((acc, d) => ({ ...acc, [d.type]: d.content }), {})} />
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
