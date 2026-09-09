'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  DollarSign, 
  Package,
  Activity,
  Heart,
  Building,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BMCSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  content: string;
  color: string;
}

interface BMCData {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

interface BusinessModelCanvasProps {
  onSave?: (data: BMCData) => void;
  initialData?: Partial<BMCData>;
}

const BMC_SECTIONS: BMCSection[] = [
  {
    id: 'keyPartners',
    title: 'Key Partners',
    icon: Building,
    description: 'Who help you?',
    content: '',
    color: 'bg-blue-500'
  },
  {
    id: 'keyActivities',
    title: 'Key Activities',
    icon: Activity,
    description: 'What do you do?',
    content: '',
    color: 'bg-green-500'
  },
  {
    id: 'keyResources',
    title: 'Key Resources',
    icon: Key,
    description: 'What do you need?',
    content: '',
    color: 'bg-purple-500'
  },
  {
    id: 'valuePropositions',
    title: 'Value Propositions',
    icon: Package,
    description: 'What do you offer?',
    content: '',
    color: 'bg-orange-500'
  },
  {
    id: 'customerRelationships',
    title: 'Customer Relationships',
    icon: Heart,
    description: 'How do you interact?',
    content: '',
    color: 'bg-pink-500'
  },
  {
    id: 'channels',
    title: 'Channels',
    icon: Users,
    description: 'How do you reach?',
    content: '',
    color: 'bg-cyan-500'
  },
  {
    id: 'customerSegments',
    title: 'Customer Segments',
    icon: Users,
    description: 'Who do you serve?',
    content: '',
    color: 'bg-indigo-500'
  },
  {
    id: 'costStructure',
    title: 'Cost Structure',
    icon: DollarSign,
    description: 'What do you spend?',
    content: '',
    color: 'bg-red-500'
  },
  {
    id: 'revenueStreams',
    title: 'Revenue Streams',
    icon: DollarSign,
    description: 'How do you earn?',
    content: '',
    color: 'bg-emerald-500'
  }
];

export function BusinessModelCanvas({ onSave, initialData }: BusinessModelCanvasProps) {
  const [sections, setSections] = useState<BMCSection[]>(
    BMC_SECTIONS.map(section => ({
      ...section,
      content: initialData?.[section.id as keyof BMCData] || ''
    }))
  );

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const completedSections = sections.filter(section => 
      section.content.trim().length > 0
    ).length;
    setCompletionPercentage((completedSections / sections.length) * 100);
  }, [sections]);

  const handleSectionChange = (sectionId: string, content: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId ? { ...section, content } : section
      )
    );
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation based on typical startup patterns
    setTimeout(() => {
      setSections(prev => prev.map(section => {
        let generatedContent = '';
        
        switch (section.id) {
          case 'keyPartners':
            generatedContent = 'Technology providers, distribution partners, strategic alliances, suppliers';
            break;
          case 'keyActivities':
            generatedContent = 'Product development, marketing, customer support, sales, partnerships';
            break;
          case 'keyResources':
            generatedContent = 'Technical team, brand IP, customer data, partnerships, funding';
            break;
          case 'valuePropositions':
            generatedContent = 'Time-saving solution, cost reduction, improved efficiency, better user experience';
            break;
          case 'customerRelationships':
            generatedContent = 'Self-service, automated support, community building, personal assistance';
            break;
          case 'channels':
            generatedContent = 'Direct website, app stores, social media, partner networks, content marketing';
            break;
          case 'customerSegments':
            generatedContent = 'Small businesses, startups, enterprise customers, specific user personas';
            break;
          case 'costStructure':
            generatedContent = 'Development costs, marketing expenses, operational overhead, partnership fees';
            break;
          case 'revenueStreams':
            generatedContent = 'Subscription fees, transaction fees, premium features, enterprise licenses';
            break;
        }
        
        return { ...section, content: generatedContent };
      }));
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    const bmcData: BMCData = sections.reduce((acc, section) => {
      acc[section.id as keyof BMCData] = section.content;
      return acc;
    }, {} as BMCData);
    
    onSave?.(bmcData);
  };

  const getConfidenceLevel = (content: string) => {
    if (content.length === 0) return 'low';
    if (content.length < 50) return 'medium';
    return 'high';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="icon-md text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Business Model Canvas</h2>
            <p className="text-sm text-muted-foreground">
              Map out your business model across 9 key components
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            {completionPercentage.toFixed(0)}% Complete
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Canvas
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>BMC Completion</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* BMC Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-4">
          {sections.slice(0, 3).map(section => {
            const Icon = section.icon;
            const confidence = getConfidenceLevel(section.content);
            
            return (
              <Card key={section.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded', section.color + '/20')}>
                        <Icon className="h-4 w-4" style={{ color: section.color.replace('bg-', '') }} />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                    <div className={cn('w-2 h-2 rounded-full', getConfidenceColor(confidence))} />
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder={`Describe ${section.title.toLowerCase()}...`}
                    value={section.content}
                    onChange={(e) => handleSectionChange(section.id, e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Middle Column */}
        <div className="space-y-4">
          {sections.slice(3, 6).map(section => {
            const Icon = section.icon;
            const confidence = getConfidenceLevel(section.content);
            
            return (
              <Card key={section.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded', section.color + '/20')}>
                        <Icon className="h-4 w-4" style={{ color: section.color.replace('bg-', '') }} />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                    <div className={cn('w-2 h-2 rounded-full', getConfidenceColor(confidence))} />
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder={`Describe ${section.title.toLowerCase()}...`}
                    value={section.content}
                    onChange={(e) => handleSectionChange(section.id, e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {sections.slice(6).map(section => {
            const Icon = section.icon;
            const confidence = getConfidenceLevel(section.content);
            
            return (
              <Card key={section.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded', section.color + '/20')}>
                        <Icon className="h-4 w-4" style={{ color: section.color.replace('bg-', '') }} />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                    <div className={cn('w-2 h-2 rounded-full', getConfidenceColor(confidence))} />
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder={`Describe ${section.title.toLowerCase()}...`}
                    value={section.content}
                    onChange={(e) => handleSectionChange(section.id, e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Canvas Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sections.filter(s => getConfidenceLevel(s.content) === 'high').length}
              </div>
              <div className="text-xs text-muted-foreground">Well-defined sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {sections.filter(s => getConfidenceLevel(s.content) === 'medium').length}
              </div>
              <div className="text-xs text-muted-foreground">Needs refinement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {sections.filter(s => getConfidenceLevel(s.content) === 'low').length}
              </div>
              <div className="text-xs text-muted-foreground">Missing content</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
