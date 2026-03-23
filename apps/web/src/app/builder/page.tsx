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
  Plus
} from 'lucide-react';

function BuilderPageContent() {
  const [activeTab, setActiveTab] = useState('overview');
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

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!workspace && workspaces.length > 0) {
      selectWorkspace(workspaces[0].id);
    }
  }, [workspace, workspaces, selectWorkspace]);

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
        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              Dismiss
            </Button>
          </div>
        )}

        {/* Context Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="h-6 w-6 text-primary" />
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
                <Users className="h-4 w-4 text-muted-foreground" />
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
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Builder Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
            {BUILDER_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1 text-xs"
                  title={tab.label}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden lg:inline">{tab.label}</span>
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
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationGenerator 
              onSave={(data) => handleSave('applications', data)}
              workspaceData={documents.reduce((acc, d) => ({ ...acc, [d.type]: d.content }), {})}
            />
          </TabsContent>
        </Tabs>
      </div>
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
