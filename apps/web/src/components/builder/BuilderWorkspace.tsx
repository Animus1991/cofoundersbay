'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  FileText, 
  Code, 
  DollarSign,
  Users,
  Rocket,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuilderWorkspaceProps {
  workspaceId?: string;
}

interface ReadinessScore {
  overall: number;
  idea: number;
  market: number;
  team: number;
  execution: number;
}

interface DocumentStatus {
  type: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'reviewed';
  lastUpdated?: string;
  hasMentorReview?: boolean;
}

const DOCUMENT_TYPES = [
  { id: 'idea-core', label: 'Idea Core', icon: Lightbulb, description: 'Core problem and solution definition' },
  { id: 'bmc', label: 'Business Model Canvas', icon: Target, description: 'Value proposition and business model' },
  { id: 'market', label: 'Market Analysis', icon: TrendingUp, description: 'TAM/SAM/SOM and competitive landscape' },
  { id: 'pitch-deck', label: 'Pitch Deck', icon: FileText, description: 'Investor and stakeholder presentations' },
  { id: 'mvp', label: 'MVP Planner', icon: Rocket, description: 'Product roadmap and technical requirements' },
  { id: 'tech-arch', label: 'Technical Architecture', icon: Code, description: 'Technology stack and system design' },
  { id: 'financials', label: 'Financial Planning', icon: DollarSign, description: 'Revenue models and projections' },
  { id: 'prd', label: 'PRD & User Stories', icon: FileText, description: 'Product requirements and features' },
  { id: 'branding', label: 'Branding Kit', icon: Users, description: 'Brand identity and messaging' },
  { id: 'applications', label: 'Applications', icon: CheckCircle2, description: 'Accelerator and funding applications' }
];

export function BuilderWorkspace({ workspaceId }: BuilderWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>(
    DOCUMENT_TYPES.map(doc => ({
      type: doc.id,
      status: 'not-started'
    }))
  );

  // Mock data - replace with actual API calls
  const readinessScore: ReadinessScore = {
    overall: 65,
    idea: 80,
    market: 45,
    team: 90,
    execution: 55
  };

  const completedDocuments = documentStatuses.filter(d => d.status === 'completed').length;
  const totalDocuments = documentStatuses.length;
  const completionPercentage = (completedDocuments / totalDocuments) * 100;

  const getStatusColor = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'reviewed': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'reviewed': return 'Reviewed';
      default: return 'Not Started';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Startup Builder</h1>
          <p className="text-sm text-muted-foreground">
            Transform your idea into a validated startup plan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Ready: {readinessScore.overall}%
          </Badge>
          <Button variant="outline" size="sm">
            Share with Team
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{completionPercentage.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Completion</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{readinessScore.idea}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Idea Clarity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{readinessScore.market}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Market Ready</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{readinessScore.team}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Team Fit</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="collaboration">Team</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Startup Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{completionPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  {Object.entries(readinessScore).filter(([key]) => key !== 'overall').map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{key}</span>
                        <span>{value}%</span>
                      </div>
                      <Progress value={value} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Refine Core Idea
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Update Business Model
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Pitch Deck
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Mentor Review
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DOCUMENT_TYPES.map((doc) => {
              const status = documentStatuses.find(d => d.type === doc.id)?.status || 'not-started';
              const Icon = doc.icon;
              
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{doc.label}</CardTitle>
                      </div>
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        getStatusColor(status)
                      )} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {getStatusText(status)}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        {status === 'not-started' ? 'Start' : 'Edit'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Invite team members and mentors to collaborate on your startup</p>
                <Button className="mt-4">Invite Collaborators</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Startup Readiness Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Readiness Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(readinessScore).filter(([key]) => key !== 'overall').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{key}</div>
                          <div className="text-sm text-muted-foreground">
                            {key === 'idea' && 'Problem-solution fit and clarity'}
                            {key === 'market' && 'Market size and competitive analysis'}
                            {key === 'team' && 'Team composition and skills'}
                            {key === 'execution' && 'MVP plan and technical readiness'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{value}%</div>
                          <Progress value={value} className="w-20 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
