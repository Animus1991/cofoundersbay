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
    { id: 'overview', label: 'Overview', icon: Rocket },
    { id: 'idea-core', label: 'Idea Core', icon: Lightbulb },
    { id: 'bmc', label: 'Business Model', icon: Target },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'pitch-deck', label: 'Pitch Deck', icon: Presentation },
    { id: 'mvp', label: 'MVP', icon: Code },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'readiness', label: 'Readiness', icon: Award },
    { id: 'applications', label: 'Applications', icon: CheckCircle2 },
  ];

  // Get document content by type
  const getDocumentContent = (type: string) => {
    const doc = documents.find((d) => d.type === type);
    return doc?.content || {};
  };

  if (isLoadingWorkspaces) {
    return (
      <AppShell title="Startup Builder" description="Structure idea, team, market, traction, and pitch — all in one workspace.">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Startup Builder"
      description="Structure idea, team, market, traction, and pitch — all in one workspace."
      showHelp
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="icon-md text-destructive-accessible" />
            <p className="text-sm text-destructive-accessible">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              <BilingualText en="Dismiss" el="Απόρριψη" compact />
            </Button>
          </div>
        )}

        {/* Behavioral Nudge */}
        <BehavioralNudge surface="builder" compact />

        {/* Expert Review CTA — surfaces when artifacts exist */}
        {!reviewBannerDismissed && documents.length >= 2 && (
          <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', STATUS.warning.border, STATUS.warning.bg)}>
            <Sparkles className={cn('icon-sm shrink-0', STATUS.warning.icon)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                <BilingualText en="Your artifacts are ready for expert review" el="Τα τεχνουργήματά σας είναι έτοιμα για αξιολόγηση ειδικού" />
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <BilingualText en="Get actionable feedback from a domain expert — investors, mentors, or industry specialists." el="Λάβετε πρακτική ανατροφοδότηση από ειδικό τομέα — επενδυτές, μέντορες ή ειδικούς κλάδου." />
              </p>
            </div>
            <a href="/expert-reviews" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn('h-7 gap-1 text-xs font-semibold hover:bg-status-warning-bg', STATUS.warning.text)}>
                <BilingualText en="Get review" el="Αξιολόγηση" compact /> <ArrowRight className="icon-sm" />
              </Button>
            </a>
            <button
              onClick={() => { setReviewBannerDismissed(true); localStorage.setItem(BUILDER_REVIEW_DISMISS_KEY, 'true'); }}
              className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="icon-sm" />
            </button>
          </div>
        )}

        {/* Context Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="icon-lg text-primary-accessible" />
              </div>
              {workspace?.name || 'Startup Builder'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {workspace?.description || 'Transform your idea into a validated startup plan with AI assistance'}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
            {BUILDER_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex min-h-10 shrink-0 items-center gap-1.5 text-xs"
                  title={tab.label}
                >
                  <Icon className="icon-sm" />
                  <span>{tab.label}</span>
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
