'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
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
import { CollabToolbar } from '@/components/builder/CollabToolbar';
import { WorkspaceMetricsPanels } from '@/components/gamification/WorkspaceMetricsPanels';
import { BehavioralNudge } from '@/components/behavioral/BehavioralNudge';
import { VersionHistoryDrawer } from '@/components/builder/VersionHistoryDrawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Code, 
  DollarSign,
  Rocket,
  CheckCircle2,
  Presentation,
  Award,
  Users,
  Loader2,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

const BUILDER_REVIEW_DISMISS_KEY = 'cfb_builder_review_dismissed_v1';

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
    workspaces,
    isLoadingWorkspaces,
    documents,
    activeDocument,
    onlineCollaborators,
    error,
    isGenerating,
    loadWorkspaces,
    selectWorkspace,
    createDocument,
    selectDocument,
    updateDocumentSection,
    generateContent,
    clearError,
  } = useBuilder();

  // Load workspaces on mount + auto-select first (single flow, no waterfall)
  useEffect(() => {
    loadWorkspaces(true);
  }, [loadWorkspaces]);

  const handleSave = async (section: string, data: any) => {
    if (!activeDocument) return;
    await updateDocumentSection(activeDocument.id, section, data);
  };

  const handleGenerate = async (documentType: any, sectionKey?: string) => {
    try {
      const result = await generateContent(documentType, sectionKey);
      return result.content;
    } catch (err) {
      console.error('Generation failed:', err);
      return null;
    }
  };

  const BUILDER_TABS = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Rocket },
    { id: 'idea-core', label: 'Idea Core', shortLabel: 'Idea', icon: Lightbulb },
    { id: 'bmc', label: 'Business Model', shortLabel: 'Model', icon: Target },
    { id: 'market', label: 'Market', shortLabel: 'Market', icon: TrendingUp },
    { id: 'pitch-deck', label: 'Pitch Deck', shortLabel: 'Pitch', icon: Presentation },
    { id: 'mvp', label: 'MVP', shortLabel: 'MVP', icon: Code },
    { id: 'financials', label: 'Financials', shortLabel: 'Finance', icon: DollarSign },
    { id: 'readiness', label: 'Readiness', shortLabel: 'Ready', icon: Award },
    { id: 'applications', label: 'Applications', shortLabel: 'Apps', icon: CheckCircle2 },
  ];

  // Get document content by type
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
      <div className="min-w-0 space-y-6 overflow-x-clip">
        {/* Error Alert */}
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

        {/* Behavioral Nudge */}
        <BehavioralNudge surface="builder" compact />

        {/* Expert Review CTA — surfaces when artifacts exist */}
        {!reviewBannerDismissed && documents.length >= 2 && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Your artifacts are ready for expert review
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Get actionable feedback from a domain expert — investors, mentors, or industry specialists.
                </p>
              </div>
              <button
                onClick={() => { setReviewBannerDismissed(true); localStorage.setItem(BUILDER_REVIEW_DISMISS_KEY, 'true'); }}
                className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <a href="/expert-reviews" className="shrink-0 sm:self-center">
              <Button variant="ghost" size="sm" className="h-9 w-full gap-1 text-xs font-semibold text-amber-600 hover:bg-amber-500/10 sm:w-auto">
                Get review <ArrowRight className="h-3 w-3" />
              </Button>
            </a>
          </div>
        )}

        {/* Context Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-start gap-3 text-2xl font-semibold tracking-tight text-foreground">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                <Rocket className="icon-lg text-primary" />
              </div>
              <span className="min-w-0 break-words">{workspace?.name || 'Startup Builder'}</span>
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {workspace?.description || 'Transform your idea into a validated startup plan with AI assistance'}
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
                <Users className="icon-sm text-muted-foreground" />
                <div className="flex -space-x-2">
                  {onlineCollaborators.slice(0, 3).map((c) => (
                    <Avatar key={c.odId} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-xs bg-primary/20">
                        {c.odName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {onlineCollaborators.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                      +{onlineCollaborators.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* AI Generating Indicator */}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="icon-sm animate-spin" />
                <span>AI generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Collab Toolbar — shown when a document is active */}
        {activeDocument && workspace && (
          <CollabToolbar
            documentId={activeDocument.id}
            workspaceId={workspace.id}
            documentTitle={activeDocument.title}
            onHistoryClick={() => setShowVersionHistory(true)}
          />
        )}

        {/* Main Builder Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {BUILDER_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex min-h-10 shrink-0 snap-start items-center gap-1.5 text-xs"
                  title={tab.label}
                >
                  <Icon className="icon-sm" />
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
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
              workspaceName={workspace?.startupName || workspace?.name}
              ideaCore={getDocumentContent('idea_core')}
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
              initialData={getDocumentContent('financial_projections')}
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
              onSave={(data) => handleSave('applications', data)}
              workspaceData={documents.reduce((acc, d) => ({ ...acc, [d.type]: d.content }), {})}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Version History Drawer */}
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
