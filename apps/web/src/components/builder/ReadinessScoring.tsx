'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users,
  TrendingUp,
  DollarSign,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  Award,
  Lightbulb,
  FileText,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadinessDimension {
  id: string;
  name: string;
  icon: any;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  criteria: ReadinessCriterion[];
  recommendations: string[];
}

interface ReadinessCriterion {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  weight: number;
  evidence?: string;
}

interface ReadinessData {
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'needs-work' | 'critical';
  dimensions: ReadinessDimension[];
  readinessLevel: 'idea' | 'validation' | 'mvp' | 'growth' | 'scale';
  nextMilestones: string[];
  blockers: string[];
}

interface ReadinessScoringProps {
  workspaceData?: any;
  onRefresh?: () => void;
}

const READINESS_DIMENSIONS: Omit<ReadinessDimension, 'score' | 'status' | 'recommendations'>[] = [
  {
    id: 'team',
    name: 'Team Readiness',
    icon: Users,
    maxScore: 100,
    criteria: [
      { id: 't1', name: 'Co-founder identified', description: 'Have you found a co-founder or core team?', completed: false, weight: 25 },
      { id: 't2', name: 'Complementary skills', description: 'Does your team have complementary skills?', completed: false, weight: 20 },
      { id: 't3', name: 'Full-time commitment', description: 'Is at least one founder full-time?', completed: false, weight: 20 },
      { id: 't4', name: 'Equity agreement', description: 'Have you agreed on equity split?', completed: false, weight: 15 },
      { id: 't5', name: 'Advisors/mentors', description: 'Do you have advisors or mentors?', completed: false, weight: 10 },
      { id: 't6', name: 'Hiring plan', description: 'Do you have a hiring plan?', completed: false, weight: 10 }
    ]
  },
  {
    id: 'market',
    name: 'Market Validation',
    icon: TrendingUp,
    maxScore: 100,
    criteria: [
      { id: 'm1', name: 'Problem validated', description: 'Have you validated the problem exists?', completed: false, weight: 25 },
      { id: 'm2', name: 'Customer interviews', description: 'Have you conducted 20+ customer interviews?', completed: false, weight: 20 },
      { id: 'm3', name: 'Market size defined', description: 'Have you defined TAM/SAM/SOM?', completed: false, weight: 15 },
      { id: 'm4', name: 'ICP defined', description: 'Have you defined your ideal customer profile?', completed: false, weight: 15 },
      { id: 'm5', name: 'Competitive analysis', description: 'Have you analyzed competitors?', completed: false, weight: 15 },
      { id: 'm6', name: 'Pricing validated', description: 'Have you validated pricing with customers?', completed: false, weight: 10 }
    ]
  },
  {
    id: 'product',
    name: 'Product Readiness',
    icon: Code,
    maxScore: 100,
    criteria: [
      { id: 'p1', name: 'MVP defined', description: 'Have you defined your MVP scope?', completed: false, weight: 20 },
      { id: 'p2', name: 'Core features built', description: 'Are core features built or in progress?', completed: false, weight: 25 },
      { id: 'p3', name: 'User testing', description: 'Have you conducted user testing?', completed: false, weight: 20 },
      { id: 'p4', name: 'Technical architecture', description: 'Is technical architecture defined?', completed: false, weight: 15 },
      { id: 'p5', name: 'Launch plan', description: 'Do you have a launch plan?', completed: false, weight: 10 },
      { id: 'p6', name: 'Metrics defined', description: 'Have you defined success metrics?', completed: false, weight: 10 }
    ]
  },
  {
    id: 'business',
    name: 'Business Model',
    icon: DollarSign,
    maxScore: 100,
    criteria: [
      { id: 'b1', name: 'Revenue model defined', description: 'Have you defined your revenue model?', completed: false, weight: 25 },
      { id: 'b2', name: 'Unit economics', description: 'Do you understand your unit economics?', completed: false, weight: 20 },
      { id: 'b3', name: 'BMC completed', description: 'Have you completed a Business Model Canvas?', completed: false, weight: 15 },
      { id: 'b4', name: 'Financial projections', description: 'Do you have financial projections?', completed: false, weight: 15 },
      { id: 'b5', name: 'Go-to-market strategy', description: 'Do you have a go-to-market strategy?', completed: false, weight: 15 },
      { id: 'b6', name: 'Partnerships identified', description: 'Have you identified key partnerships?', completed: false, weight: 10 }
    ]
  },
  {
    id: 'funding',
    name: 'Funding Readiness',
    icon: Award,
    maxScore: 100,
    criteria: [
      { id: 'f1', name: 'Pitch deck ready', description: 'Do you have an investor-ready pitch deck?', completed: false, weight: 25 },
      { id: 'f2', name: 'Funding strategy', description: 'Have you defined your funding strategy?', completed: false, weight: 20 },
      { id: 'f3', name: 'Investor list', description: 'Do you have a target investor list?', completed: false, weight: 15 },
      { id: 'f4', name: 'Legal structure', description: 'Is your legal structure in place?', completed: false, weight: 15 },
      { id: 'f5', name: 'Data room', description: 'Do you have a data room prepared?', completed: false, weight: 15 },
      { id: 'f6', name: 'Runway calculated', description: 'Have you calculated your runway needs?', completed: false, weight: 10 }
    ]
  },
  {
    id: 'execution',
    name: 'Execution Capability',
    icon: Rocket,
    maxScore: 100,
    criteria: [
      { id: 'e1', name: 'Milestones defined', description: 'Have you defined clear milestones?', completed: false, weight: 20 },
      { id: 'e2', name: 'Sprint planning', description: 'Do you have a sprint/iteration process?', completed: false, weight: 15 },
      { id: 'e3', name: 'Tools & infrastructure', description: 'Are your tools and infrastructure set up?', completed: false, weight: 15 },
      { id: 'e4', name: 'Communication cadence', description: 'Do you have regular team communication?', completed: false, weight: 15 },
      { id: 'e5', name: 'Decision-making process', description: 'Is your decision-making process clear?', completed: false, weight: 15 },
      { id: 'e6', name: 'Risk management', description: 'Have you identified and planned for risks?', completed: false, weight: 20 }
    ]
  }
];

export function ReadinessScoring({ workspaceData, onRefresh }: ReadinessScoringProps) {
  const [data, setData] = useState<ReadinessData>({
    overallScore: 0,
    overallStatus: 'critical',
    dimensions: [],
    readinessLevel: 'idea',
    nextMilestones: [],
    blockers: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  useEffect(() => {
    // Initialize dimensions
    const initialDimensions: ReadinessDimension[] = READINESS_DIMENSIONS.map(dim => ({
      ...dim,
      score: 0,
      status: 'critical' as const,
      recommendations: []
    }));
    
    setData(prev => ({ ...prev, dimensions: initialDimensions }));
  }, []);

  const analyzeReadiness = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis based on workspace data
    setTimeout(() => {
      const analyzedDimensions: ReadinessDimension[] = READINESS_DIMENSIONS.map(dim => {
        // Simulate random completion for demo
        const completedCriteria = dim.criteria.map(c => ({
          ...c,
          completed: Math.random() > 0.4,
          evidence: Math.random() > 0.5 ? 'Based on workspace data' : undefined
        }));
        
        const score = completedCriteria.reduce((sum, c) => 
          sum + (c.completed ? c.weight : 0), 0
        );
        
        const status = score >= 80 ? 'excellent' : 
                       score >= 60 ? 'good' : 
                       score >= 40 ? 'needs-work' : 'critical';
        
        const recommendations = completedCriteria
          .filter(c => !c.completed)
          .slice(0, 3)
          .map(c => `Complete: ${c.name}`);
        
        return {
          ...dim,
          criteria: completedCriteria,
          score,
          status,
          recommendations
        };
      });
      
      const overallScore = Math.round(
        analyzedDimensions.reduce((sum, d) => sum + d.score, 0) / analyzedDimensions.length
      );
      
      const overallStatus = overallScore >= 80 ? 'excellent' : 
                            overallScore >= 60 ? 'good' : 
                            overallScore >= 40 ? 'needs-work' : 'critical';
      
      const readinessLevel = overallScore >= 80 ? 'scale' :
                             overallScore >= 60 ? 'growth' :
                             overallScore >= 40 ? 'mvp' :
                             overallScore >= 20 ? 'validation' : 'idea';
      
      const blockers = analyzedDimensions
        .filter(d => d.status === 'critical')
        .map(d => `${d.name} needs immediate attention`);
      
      const nextMilestones = analyzedDimensions
        .flatMap(d => d.recommendations)
        .slice(0, 5);
      
      setData({
        overallScore,
        overallStatus,
        dimensions: analyzedDimensions,
        readinessLevel,
        nextMilestones,
        blockers
      });
      
      setIsAnalyzing(false);
    }, 2000);
  };

  const toggleCriterion = (dimensionId: string, criterionId: string) => {
    setData(prev => ({
      ...prev,
      dimensions: prev.dimensions.map(dim => {
        if (dim.id !== dimensionId) return dim;
        
        const updatedCriteria = dim.criteria.map(c => 
          c.id === criterionId ? { ...c, completed: !c.completed } : c
        );
        
        const score = updatedCriteria.reduce((sum, c) => 
          sum + (c.completed ? c.weight : 0), 0
        );
        
        const status = score >= 80 ? 'excellent' : 
                       score >= 60 ? 'good' : 
                       score >= 40 ? 'needs-work' : 'critical';
        
        return { ...dim, criteria: updatedCriteria, score, status };
      })
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-work': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle2;
      case 'good': return CheckCircle2;
      case 'needs-work': return AlertTriangle;
      case 'critical': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'idea': return 'Early ideation stage - focus on problem validation';
      case 'validation': return 'Validation stage - focus on customer discovery';
      case 'mvp': return 'MVP stage - focus on building and testing';
      case 'growth': return 'Growth stage - focus on scaling';
      case 'scale': return 'Scale stage - ready for significant investment';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Target className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Readiness Assessment</h2>
            <p className="text-sm text-muted-foreground">
              Evaluate your startup's readiness across key dimensions
            </p>
          </div>
        </div>
        <Button 
          onClick={analyzeReadiness}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Readiness'}
        </Button>
      </div>

      {/* Overall Score */}
      <Card className={cn(
        "border-2",
        data.overallStatus === 'excellent' ? 'border-green-500' :
        data.overallStatus === 'good' ? 'border-blue-500' :
        data.overallStatus === 'needs-work' ? 'border-yellow-500' : 'border-red-500'
      )}>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(data.overallScore / 100) * 352} 352`}
                    className={cn(
                      data.overallStatus === 'excellent' ? 'text-green-500' :
                      data.overallStatus === 'good' ? 'text-blue-500' :
                      data.overallStatus === 'needs-work' ? 'text-yellow-500' : 'text-red-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{data.overallScore}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge className={cn("mt-4", getStatusColor(data.overallStatus))}>
                {data.overallStatus.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Stage Indicator */}
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Stage</h3>
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-primary" />
                <span className="text-xl font-semibold capitalize">{data.readinessLevel}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getLevelDescription(data.readinessLevel)}
              </p>
              
              {/* Stage Progress */}
              <div className="flex gap-1 mt-4">
                {['idea', 'validation', 'mvp', 'growth', 'scale'].map((stage, index) => (
                  <div
                    key={stage}
                    className={cn(
                      "h-2 flex-1 rounded-full",
                      ['idea', 'validation', 'mvp', 'growth', 'scale'].indexOf(data.readinessLevel) >= index
                        ? 'bg-primary'
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Dimension Scores</h3>
                {data.dimensions.slice(0, 4).map(dim => (
                  <div key={dim.id} className="flex items-center justify-between text-sm mb-1">
                    <span>{dim.name}</span>
                    <span className={cn(
                      "font-medium",
                      dim.status === 'excellent' ? 'text-green-600' :
                      dim.status === 'good' ? 'text-blue-600' :
                      dim.status === 'needs-work' ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {dim.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockers & Next Steps */}
      {(data.blockers.length > 0 || data.nextMilestones.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.blockers.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Critical Blockers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.blockers.map((blocker, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      {blocker}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {data.nextMilestones.length > 0 && (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Lightbulb className="h-5 w-5" />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.nextMilestones.map((milestone, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {milestone}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dimension Details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.dimensions.map(dimension => {
          const Icon = dimension.icon;
          const StatusIcon = getStatusIcon(dimension.status);
          const isExpanded = expandedDimension === dimension.id;
          
          return (
            <Card 
              key={dimension.id}
              className={cn(
                "cursor-pointer transition-all",
                isExpanded && "md:col-span-2 lg:col-span-3"
              )}
              onClick={() => setExpandedDimension(isExpanded ? null : dimension.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {dimension.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(dimension.status)}>
                      {dimension.score}%
                    </Badge>
                    <StatusIcon className={cn(
                      "h-5 w-5",
                      dimension.status === 'excellent' ? 'text-green-500' :
                      dimension.status === 'good' ? 'text-blue-500' :
                      dimension.status === 'needs-work' ? 'text-yellow-500' : 'text-red-500'
                    )} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={dimension.score} 
                  className={cn(
                    "h-2 mb-4",
                    dimension.status === 'excellent' ? '[&>div]:bg-green-500' :
                    dimension.status === 'good' ? '[&>div]:bg-blue-500' :
                    dimension.status === 'needs-work' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                  )}
                />
                
                {isExpanded && (
                  <div className="space-y-3 mt-4">
                    {dimension.criteria.map(criterion => (
                      <div 
                        key={criterion.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCriterion(dimension.id, criterion.id);
                        }}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                          criterion.completed 
                            ? "bg-green-500 border-green-500" 
                            : "border-gray-300"
                        )}>
                          {criterion.completed && (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "font-medium text-sm",
                              criterion.completed && "text-green-600"
                            )}>
                              {criterion.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {criterion.weight}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {criterion.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!isExpanded && (
                  <div className="text-xs text-muted-foreground">
                    {dimension.criteria.filter(c => c.completed).length} / {dimension.criteria.length} criteria met
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
