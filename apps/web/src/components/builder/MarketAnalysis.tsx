'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Target,
  Globe,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Save,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketData {
  // TAM/SAM/SOM Analysis
  tam: { value: string; description: string; sources: string };
  sam: { value: string; description: string; methodology: string };
  som: { value: string; description: string; assumptions: string };
  
  // Competitive Landscape
  directCompetitors: Competitor[];
  indirectCompetitors: Competitor[];
  substitutes: string[];
  
  // ICP & Personas
  idealCustomerProfile: ICP;
  personas: Persona[];
  
  // Market Dynamics
  trends: MarketTrend[];
  entryBarriers: string[];
  regulations: string[];
  
  // Positioning
  positioning: string;
  differentiators: string[];
  competitiveAdvantage: string;
}

interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  marketShare: string;
}

interface ICP {
  demographics: string;
  psychographics: string;
  painPoints: string[];
  buyingBehavior: string;
  decisionCriteria: string[];
  budget: string;
}

interface Persona {
  name: string;
  role: string;
  goals: string[];
  frustrations: string[];
  quote: string;
}

interface MarketTrend {
  trend: string;
  impact: 'positive' | 'negative' | 'neutral';
  timeframe: string;
  confidence: number;
}

interface MarketAnalysisProps {
  onSave?: (data: MarketData) => void;
  initialData?: Partial<MarketData>;
}

const defaultMarketData: MarketData = {
  tam: { value: '', description: '', sources: '' },
  sam: { value: '', description: '', methodology: '' },
  som: { value: '', description: '', assumptions: '' },
  directCompetitors: [],
  indirectCompetitors: [],
  substitutes: [],
  idealCustomerProfile: {
    demographics: '',
    psychographics: '',
    painPoints: [],
    buyingBehavior: '',
    decisionCriteria: [],
    budget: ''
  },
  personas: [],
  trends: [],
  entryBarriers: [],
  regulations: [],
  positioning: '',
  differentiators: [],
  competitiveAdvantage: ''
};

export function MarketAnalysis({ onSave, initialData }: MarketAnalysisProps) {
  const [data, setData] = useState<MarketData>({ ...defaultMarketData, ...initialData });
  const [activeTab, setActiveTab] = useState('market-size');
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    // Calculate completion based on filled sections
    let completed = 0;
    let total = 10;
    
    if (data.tam.value) completed++;
    if (data.sam.value) completed++;
    if (data.som.value) completed++;
    if (data.directCompetitors.length > 0) completed++;
    if (data.idealCustomerProfile.demographics) completed++;
    if (data.personas.length > 0) completed++;
    if (data.trends.length > 0) completed++;
    if (data.positioning) completed++;
    if (data.differentiators.length > 0) completed++;
    if (data.competitiveAdvantage) completed++;
    
    setCompletionPercentage((completed / total) * 100);
  }, [data]);

  const generateWithAI = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation with realistic market analysis
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        tam: {
          value: '$50B',
          description: 'Global market for startup ecosystem tools and platforms',
          sources: 'Gartner, CB Insights, PitchBook 2024 reports'
        },
        sam: {
          value: '$8B',
          description: 'Addressable market in English-speaking regions with active startup ecosystems',
          methodology: 'Top-down analysis based on startup density and ecosystem maturity'
        },
        som: {
          value: '$200M',
          description: 'Realistic obtainable market in first 3 years focusing on EU and US markets',
          assumptions: '2% market penetration, premium tier adoption rate of 15%'
        },
        directCompetitors: [
          {
            name: 'Y Combinator Startup School',
            description: 'Free online program for early-stage founders',
            strengths: ['Brand recognition', 'Network effects', 'Free access'],
            weaknesses: ['Limited personalization', 'No team matching', 'One-size-fits-all'],
            pricing: 'Free',
            marketShare: '15%'
          },
          {
            name: 'Founder2be',
            description: 'Co-founder matching platform',
            strengths: ['Established user base', 'Simple UX'],
            weaknesses: ['Limited features', 'No AI', 'No document generation'],
            pricing: 'Freemium',
            marketShare: '5%'
          }
        ],
        trends: [
          { trend: 'AI-powered startup tools adoption', impact: 'positive', timeframe: '2024-2027', confidence: 85 },
          { trend: 'Remote-first team formation', impact: 'positive', timeframe: '2024-2026', confidence: 90 },
          { trend: 'Increased startup failure rates', impact: 'positive', timeframe: 'Ongoing', confidence: 75 }
        ],
        differentiators: [
          'Integrated team formation + execution platform',
          'AI-powered document generation with consistency checking',
          'Ecosystem-native (mentors, accelerators, universities)',
          'Readiness scoring and progress tracking'
        ]
      }));
      setIsGenerating(false);
    }, 3000);
  };

  const addCompetitor = (type: 'direct' | 'indirect') => {
    const newCompetitor: Competitor = {
      name: '',
      description: '',
      strengths: [],
      weaknesses: [],
      pricing: '',
      marketShare: ''
    };
    
    if (type === 'direct') {
      setData(prev => ({
        ...prev,
        directCompetitors: [...prev.directCompetitors, newCompetitor]
      }));
    } else {
      setData(prev => ({
        ...prev,
        indirectCompetitors: [...prev.indirectCompetitors, newCompetitor]
      }));
    }
  };

  const updateCompetitor = (type: 'direct' | 'indirect', index: number, field: keyof Competitor, value: any) => {
    const key = type === 'direct' ? 'directCompetitors' : 'indirectCompetitors';
    setData(prev => ({
      ...prev,
      [key]: prev[key].map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const addTrend = () => {
    setData(prev => ({
      ...prev,
      trends: [...prev.trends, { trend: '', impact: 'neutral', timeframe: '', confidence: 50 }]
    }));
  };

  const addPersona = () => {
    setData(prev => ({
      ...prev,
      personas: [...prev.personas, { name: '', role: '', goals: [], frustrations: [], quote: '' }]
    }));
  };

  const handleSave = () => {
    onSave?.(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="icon-md text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Market Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive market sizing, competitive landscape, and positioning
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {completionPercentage.toFixed(0)}% Complete
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="icon-sm mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="icon-sm mr-2" aria-hidden="true" />
            )}
            AI Generate
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="icon-sm mr-2" aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Market Analysis Completion</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="market-size" className="gap-1">
            <BarChart3 className="icon-2xs" aria-hidden="true" />
            Market Size
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1">
            <Target className="icon-2xs" aria-hidden="true" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1">
            <Users className="icon-2xs" aria-hidden="true" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1">
            <TrendingUp className="icon-2xs" aria-hidden="true" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="positioning" className="gap-1">
            <Zap className="icon-2xs" aria-hidden="true" />
            Positioning
          </TabsTrigger>
        </TabsList>

        {/* Market Size Tab */}
        <TabsContent value="market-size" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* TAM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="icon-md text-blue-500" aria-hidden="true" />
                  TAM (Total Addressable Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Market Value</Label>
                  <Input
                    placeholder="e.g., $50B"
                    value={data.tam.value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      tam: { ...prev.tam, value: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the total market opportunity..."
                    value={data.tam.description}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      tam: { ...prev.tam, description: e.target.value }
                    }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Sources</Label>
                  <Input
                    placeholder="Research sources and reports..."
                    value={data.tam.sources}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      tam: { ...prev.tam, sources: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SAM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="icon-md text-green-500" aria-hidden="true" />
                  SAM (Serviceable Addressable Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Market Value</Label>
                  <Input
                    placeholder="e.g., $8B"
                    value={data.sam.value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      sam: { ...prev.sam, value: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your serviceable market..."
                    value={data.sam.description}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      sam: { ...prev.sam, description: e.target.value }
                    }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Methodology</Label>
                  <Input
                    placeholder="How did you calculate this?"
                    value={data.sam.methodology}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      sam: { ...prev.sam, methodology: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SOM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="icon-md text-orange-500" aria-hidden="true" />
                  SOM (Serviceable Obtainable Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Market Value</Label>
                  <Input
                    placeholder="e.g., $200M"
                    value={data.som.value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      som: { ...prev.som, value: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your realistic obtainable market..."
                    value={data.som.description}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      som: { ...prev.som, description: e.target.value }
                    }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Key Assumptions</Label>
                  <Input
                    placeholder="What assumptions drive this estimate?"
                    value={data.som.assumptions}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      som: { ...prev.som, assumptions: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Size Visualization */}
          {(data.tam.value || data.sam.value || data.som.value) && (
            <Card>
              <CardHeader>
                <CardTitle>Market Size Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-8 h-48">
                  <div className="flex flex-col items-center">
                    <div className="w-32 bg-blue-500/20 border-2 border-blue-500 rounded-t-lg flex items-end justify-center" style={{ height: '160px' }}>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{data.tam.value || '—'}</span>
                    </div>
                    <span className="mt-2 text-sm font-medium">TAM</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-32 bg-green-500/20 border-2 border-green-500 rounded-t-lg flex items-end justify-center" style={{ height: '100px' }}>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">{data.sam.value || '—'}</span>
                    </div>
                    <span className="mt-2 text-sm font-medium">SAM</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-32 bg-orange-500/20 border-2 border-orange-500 rounded-t-lg flex items-end justify-center" style={{ height: '40px' }}>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">{data.som.value || '—'}</span>
                    </div>
                    <span className="mt-2 text-sm font-medium">SOM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Direct Competitors</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addCompetitor('direct')}>
                + Add Competitor
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.directCompetitors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="icon-xl mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>No competitors added yet. Click "Add Competitor" to start.</p>
                </div>
              ) : (
                data.directCompetitors.map((competitor, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={competitor.name}
                          onChange={(e) => updateCompetitor('direct', index, 'name', e.target.value)}
                          placeholder="Competitor name"
                        />
                      </div>
                      <div>
                        <Label>Market Share</Label>
                        <Input
                          value={competitor.marketShare}
                          onChange={(e) => updateCompetitor('direct', index, 'marketShare', e.target.value)}
                          placeholder="e.g., 15%"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={competitor.description}
                          onChange={(e) => updateCompetitor('direct', index, 'description', e.target.value)}
                          placeholder="Brief description of the competitor"
                        />
                      </div>
                      <div>
                        <Label>Pricing</Label>
                        <Input
                          value={competitor.pricing}
                          onChange={(e) => updateCompetitor('direct', index, 'pricing', e.target.value)}
                          placeholder="e.g., Freemium, $99/mo"
                        />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="icon-md" aria-hidden="true" />
                Ideal Customer Profile (ICP)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Demographics</Label>
                  <Textarea
                    placeholder="Age, location, company size, industry..."
                    value={data.idealCustomerProfile.demographics}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      idealCustomerProfile: { ...prev.idealCustomerProfile, demographics: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Psychographics</Label>
                  <Textarea
                    placeholder="Values, motivations, behaviors..."
                    value={data.idealCustomerProfile.psychographics}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      idealCustomerProfile: { ...prev.idealCustomerProfile, psychographics: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Buying Behavior</Label>
                  <Textarea
                    placeholder="How do they make purchasing decisions?"
                    value={data.idealCustomerProfile.buyingBehavior}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      idealCustomerProfile: { ...prev.idealCustomerProfile, buyingBehavior: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Budget Range</Label>
                  <Input
                    placeholder="e.g., $50-500/month"
                    value={data.idealCustomerProfile.budget}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      idealCustomerProfile: { ...prev.idealCustomerProfile, budget: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Personas</CardTitle>
              <Button variant="outline" size="sm" onClick={addPersona}>
                + Add Persona
              </Button>
            </CardHeader>
            <CardContent>
              {data.personas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="icon-xl mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>No personas created yet. Click "Add Persona" to start.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.personas.map((persona, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <Input
                          placeholder="Persona name (e.g., 'Technical Tom')"
                          value={persona.name}
                          onChange={(e) => {
                            const newPersonas = [...data.personas];
                            newPersonas[index] = { ...persona, name: e.target.value };
                            setData(prev => ({ ...prev, personas: newPersonas }));
                          }}
                        />
                        <Input
                          placeholder="Role (e.g., 'CTO at early-stage startup')"
                          value={persona.role}
                          onChange={(e) => {
                            const newPersonas = [...data.personas];
                            newPersonas[index] = { ...persona, role: e.target.value };
                            setData(prev => ({ ...prev, personas: newPersonas }));
                          }}
                        />
                        <Textarea
                          placeholder="Key quote that represents this persona"
                          value={persona.quote}
                          onChange={(e) => {
                            const newPersonas = [...data.personas];
                            newPersonas[index] = { ...persona, quote: e.target.value };
                            setData(prev => ({ ...prev, personas: newPersonas }));
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Market Trends</CardTitle>
              <Button variant="outline" size="sm" onClick={addTrend}>
                + Add Trend
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="icon-xl mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>No trends added yet. Click "Add Trend" to start.</p>
                </div>
              ) : (
                data.trends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      trend.impact === 'positive' ? 'bg-green-500' :
                      trend.impact === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    )} />
                    <div className="flex-1">
                      <Input
                        placeholder="Describe the trend..."
                        value={trend.trend}
                        onChange={(e) => {
                          const newTrends = [...data.trends];
                          newTrends[index] = { ...trend, trend: e.target.value };
                          setData(prev => ({ ...prev, trends: newTrends }));
                        }}
                      />
                    </div>
                    <select
                      value={trend.impact}
                      onChange={(e) => {
                        const newTrends = [...data.trends];
                        newTrends[index] = { ...trend, impact: e.target.value as 'positive' | 'negative' | 'neutral' };
                        setData(prev => ({ ...prev, trends: newTrends }));
                      }}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                    </select>
                    <Input
                      placeholder="Timeframe"
                      value={trend.timeframe}
                      onChange={(e) => {
                        const newTrends = [...data.trends];
                        newTrends[index] = { ...trend, timeframe: e.target.value };
                        setData(prev => ({ ...prev, trends: newTrends }));
                      }}
                      className="w-32"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positioning Tab */}
        <TabsContent value="positioning" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Positioning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Positioning Statement</Label>
                  <Textarea
                    placeholder="For [target customer] who [need], [product] is a [category] that [key benefit]. Unlike [competitors], we [differentiator]."
                    value={data.positioning}
                    onChange={(e) => setData(prev => ({ ...prev, positioning: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>
                <div>
                  <Label>Competitive Advantage</Label>
                  <Textarea
                    placeholder="What is your sustainable competitive advantage?"
                    value={data.competitiveAdvantage}
                    onChange={(e) => setData(prev => ({ ...prev, competitiveAdvantage: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Differentiators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.differentiators.map((diff, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="icon-sm text-green-500 shrink-0" aria-hidden="true" />
                    <Input
                      value={diff}
                      onChange={(e) => {
                        const newDiffs = [...data.differentiators];
                        newDiffs[index] = e.target.value;
                        setData(prev => ({ ...prev, differentiators: newDiffs }));
                      }}
                      placeholder="Enter a key differentiator..."
                    />
                    <Button
                      aria-label="Remove item"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          differentiators: prev.differentiators.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setData(prev => ({
                    ...prev,
                    differentiators: [...prev.differentiators, '']
                  }))}
                >
                  + Add Differentiator
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
