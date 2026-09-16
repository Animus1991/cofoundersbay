'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { BuilderStageHeader, useBuilderPrimaryText } from './BuilderStageChrome';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';

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
  const t = useBuilderPrimaryText();
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

  const updateCompetitor = (type: 'direct' | 'indirect', index: number, field: keyof Competitor, value: Competitor[keyof Competitor]) => {
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
      <BuilderStageHeader
        glyph="chart"
        titleEn={builderEn('mkt_title')}
        titleEl={builderEl('mkt_title')}
        subtitleEn={builderEn('mkt_sub')}
        subtitleEl={builderEl('mkt_sub')}
        completion={completionPercentage}
        extraActions={
          <>
            <Button variant="outline" size="sm" onClick={generateWithAI} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="spark" className="icon-sm mr-2" />}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_generate')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_generate')}
                compact
              />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="icon-sm mr-2" />
              <BilingualText en={builderEn('save')} el={builderEl('save')} compact />
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            <BilingualText en={builderEn('mkt_complete')} el={builderEl('mkt_complete')} compact />
          </span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 rounded-xl">
          <TabsTrigger value="market-size" className="gap-1">
            <CfbGlyph name="chart" className="icon-sm" />
            <BilingualText en={builderEn('mkt_tab_size')} el={builderEl('mkt_tab_size')} compact />
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1">
            <CfbGlyph name="shield" className="icon-sm" />
            <BilingualText en={builderEn('mkt_tab_comp')} el={builderEl('mkt_tab_comp')} compact />
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1">
            <CfbGlyph name="people" className="icon-sm" />
            <BilingualText en={builderEn('mkt_tab_cust')} el={builderEl('mkt_tab_cust')} compact />
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1">
            <CfbGlyph name="flag" className="icon-sm" />
            <BilingualText en={builderEn('mkt_tab_trends')} el={builderEl('mkt_tab_trends')} compact />
          </TabsTrigger>
          <TabsTrigger value="positioning" className="gap-1">
            <CfbGlyph name="target" className="icon-sm" />
            <BilingualText en={builderEn('mkt_tab_pos')} el={builderEl('mkt_tab_pos')} compact />
          </TabsTrigger>
        </TabsList>

        {/* Market Size Tab */}
        <TabsContent value="market-size" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* TAM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="discover" className="icon-md text-status-info" />
                  TAM (Total Addressable Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('mkt_value')} el={builderEl('mkt_value')} compact /></Label>
                  <Input
                    placeholder={t(builderEn('mkt_ph_value'), builderEl('mkt_ph_value'))}
                    value={data.tam.value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      tam: { ...prev.tam, value: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_desc')} el={builderEl('mkt_desc')} compact /></Label>
                  <Textarea
                    placeholder={t(builderEn('mkt_ph_tam'), builderEl('mkt_ph_tam'))}
                    value={data.tam.description}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      tam: { ...prev.tam, description: e.target.value }
                    }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_sources')} el={builderEl('mkt_sources')} compact /></Label>
                  <Input
                    placeholder={t(builderEn('mkt_ph_sources'), builderEl('mkt_ph_sources'))}
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
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="target" className="icon-md text-status-success" />
                  SAM (Serviceable Addressable Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('mkt_value')} el={builderEl('mkt_value')} compact /></Label>
                  <Input
                    placeholder={t(builderEn('mkt_ph_value'), builderEl('mkt_ph_value'))}
                    value={data.sam.value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      sam: { ...prev.sam, value: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_desc')} el={builderEl('mkt_desc')} compact /></Label>
                  <Textarea
                    placeholder={t(builderEn('mkt_ph_sam'), builderEl('mkt_ph_sam'))}
                    value={data.sam.description}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      sam: { ...prev.sam, description: e.target.value }
                    }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_method')} el={builderEl('mkt_method')} compact /></Label>
                  <Input
                    placeholder={t(builderEn('mkt_ph_method'), builderEl('mkt_ph_method'))}
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
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="flag" className="icon-md text-status-warning" />
                  SOM (Serviceable Obtainable Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('mkt_value')} el={builderEl('mkt_value')} compact /></Label>
                  <Input
                    placeholder={t(builderEn('mkt_ph_value'), builderEl('mkt_ph_value'))}
                    value={data.som.value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      som: { ...prev.som, value: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_desc')} el={builderEl('mkt_desc')} compact /></Label>
                  <Textarea
                    placeholder={t(builderEn('mkt_ph_som'), builderEl('mkt_ph_som'))}
                    value={data.som.description}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      som: { ...prev.som, description: e.target.value }
                    }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_assumptions')} el={builderEl('mkt_assumptions')} compact /></Label>
                  <Input
                    placeholder={t(builderEn('mkt_ph_assumptions'), builderEl('mkt_ph_assumptions'))}
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
          {(data.tam?.value || data.sam?.value || data.som.value) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('mkt_overview')} el={builderEl('mkt_overview')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-8 h-48">
                  <div className="flex flex-col items-center">
                    <div className="flex w-32 items-end justify-center rounded-t-xl border-2 border-status-info bg-status-info-bg" style={{ height: '160px' }}>
                      <span className="text-lg font-bold text-status-info mb-2">{data.tam?.value || '—'}</span>
                    </div>
                    <span className="mt-2 text-sm font-medium">TAM</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex w-32 items-end justify-center rounded-t-xl border-2 border-status-success bg-status-success-bg" style={{ height: '100px' }}>
                      <span className="text-lg font-bold text-status-success mb-2">{data.sam?.value || '—'}</span>
                    </div>
                    <span className="mt-2 text-sm font-medium">SAM</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex w-32 items-end justify-center rounded-t-xl border-2 border-status-warning bg-status-warning-bg" style={{ height: '40px' }}>
                      <span className="text-lg font-bold text-status-warning mb-2">{data.som?.value || '—'}</span>
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
              <CardTitle className="text-base">
                <BilingualText en={builderEn('mkt_direct')} el={builderEl('mkt_direct')} compact />
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => addCompetitor('direct')}>
                <BilingualText en={builderEn('mkt_add_comp')} el={builderEl('mkt_add_comp')} compact />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.directCompetitors.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CfbGlyph name="shield" className="icon-xl mx-auto mb-2 opacity-50" />
                  <p><BilingualText en={builderEn('mkt_no_comp')} el={builderEl('mkt_no_comp')} /></p>
                </div>
              ) : (
                data.directCompetitors.map((competitor, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label><BilingualText en={builderEn('mkt_name')} el={builderEl('mkt_name')} compact /></Label>
                        <Input
                          value={competitor.name}
                          onChange={(e) => updateCompetitor('direct', index, 'name', e.target.value)}
                          placeholder={t(builderEn('mkt_ph_comp_name'), builderEl('mkt_ph_comp_name'))}
                        />
                      </div>
                      <div>
                        <Label><BilingualText en={builderEn('mkt_share')} el={builderEl('mkt_share')} compact /></Label>
                        <Input
                          value={competitor.marketShare}
                          onChange={(e) => updateCompetitor('direct', index, 'marketShare', e.target.value)}
                          placeholder="e.g., 15%"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label><BilingualText en={builderEn('mkt_desc')} el={builderEl('mkt_desc')} compact /></Label>
                        <Textarea
                          value={competitor.description}
                          onChange={(e) => updateCompetitor('direct', index, 'description', e.target.value)}
                          placeholder={t(builderEn('mkt_ph_desc'), builderEl('mkt_ph_desc'))}
                        />
                      </div>
                      <div>
                        <Label><BilingualText en={builderEn('mkt_pricing')} el={builderEl('mkt_pricing')} compact /></Label>
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
              <CardTitle className="flex items-center gap-2 text-base">
                <CfbGlyph name="people" className="icon-md" />
                <BilingualText en={builderEn('mkt_icp')} el={builderEl('mkt_icp')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label><BilingualText en={builderEn('mkt_demo')} el={builderEl('mkt_demo')} compact /></Label>
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
                  <Label><BilingualText en={builderEn('mkt_psycho')} el={builderEl('mkt_psycho')} compact /></Label>
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
                  <Label><BilingualText en={builderEn('mkt_buying')} el={builderEl('mkt_buying')} compact /></Label>
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
                  <Label><BilingualText en={builderEn('mkt_budget')} el={builderEl('mkt_budget')} compact /></Label>
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
              <CardTitle className="text-base">
                <BilingualText en={builderEn('mkt_personas')} el={builderEl('mkt_personas')} compact />
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addPersona}>
                <BilingualText en={builderEn('mkt_add_persona')} el={builderEl('mkt_add_persona')} compact />
              </Button>
            </CardHeader>
            <CardContent>
              {data.personas.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CfbGlyph name="people" className="icon-xl mx-auto mb-2 opacity-50" />
                  <p><BilingualText en={builderEn('mkt_no_persona')} el={builderEl('mkt_no_persona')} /></p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {data.personas.map((persona, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <Input
                          placeholder={t(builderEn('mkt_ph_persona_name'), builderEl('mkt_ph_persona_name'))}
                          value={persona.name}
                          onChange={(e) => {
                            const newPersonas = [...data.personas];
                            newPersonas[index] = { ...persona, name: e.target.value };
                            setData(prev => ({ ...prev, personas: newPersonas }));
                          }}
                        />
                        <Input
                          placeholder={t(builderEn('mkt_ph_role'), builderEl('mkt_ph_role'))}
                          value={persona.role}
                          onChange={(e) => {
                            const newPersonas = [...data.personas];
                            newPersonas[index] = { ...persona, role: e.target.value };
                            setData(prev => ({ ...prev, personas: newPersonas }));
                          }}
                        />
                        <Textarea
                          placeholder={t(builderEn('mkt_ph_quote'), builderEl('mkt_ph_quote'))}
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
              <CardTitle className="text-base">
                <BilingualText en={builderEn('mkt_trends')} el={builderEl('mkt_trends')} compact />
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addTrend}>
                <BilingualText en={builderEn('mkt_add_trend')} el={builderEl('mkt_add_trend')} compact />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.trends.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CfbGlyph name="chart" className="icon-xl mx-auto mb-2 opacity-50" />
                  <p><BilingualText en={builderEn('mkt_no_trend')} el={builderEl('mkt_no_trend')} /></p>
                </div>
              ) : (
                data.trends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-4 rounded-xl border p-4">
                    <div className={cn(
                      'h-3 w-3 rounded-full',
                      trend.impact === 'positive' ? 'bg-status-success' :
                      trend.impact === 'negative' ? 'bg-status-danger' : 'bg-status-warning'
                    )} />
                    <div className="flex-1">
                      <Input
                        placeholder={t(builderEn('mkt_ph_trend'), builderEl('mkt_ph_trend'))}
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
                      <option value="positive">{t(builderEn('mkt_positive'), builderEl('mkt_positive'))}</option>
                      <option value="negative">{t(builderEn('mkt_negative'), builderEl('mkt_negative'))}</option>
                      <option value="neutral">{t(builderEn('mkt_neutral'), builderEl('mkt_neutral'))}</option>
                    </select>
                    <Input
                      placeholder={t(builderEn('mkt_timeframe'), builderEl('mkt_timeframe'))}
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('mkt_positioning')} el={builderEl('mkt_positioning')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('mkt_pos_stmt')} el={builderEl('mkt_pos_stmt')} compact /></Label>
                  <Textarea
                    placeholder={t(builderEn('mkt_ph_pos'), builderEl('mkt_ph_pos'))}
                    value={data.positioning}
                    onChange={(e) => setData(prev => ({ ...prev, positioning: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('mkt_advantage')} el={builderEl('mkt_advantage')} compact /></Label>
                  <Textarea
                    placeholder={t(builderEn('mkt_ph_adv'), builderEl('mkt_ph_adv'))}
                    value={data.competitiveAdvantage}
                    onChange={(e) => setData(prev => ({ ...prev, competitiveAdvantage: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('mkt_diffs')} el={builderEl('mkt_diffs')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.differentiators.map((diff, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="icon-sm text-status-success shrink-0" />
                    <Input
                      value={diff}
                      onChange={(e) => {
                        const newDiffs = [...data.differentiators];
                        newDiffs[index] = e.target.value;
                        setData(prev => ({ ...prev, differentiators: newDiffs }));
                      }}
                      placeholder={t(builderEn('mkt_ph_diff'), builderEl('mkt_ph_diff'))}
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
                  <BilingualText en={builderEn('mkt_add_diff')} el={builderEl('mkt_add_diff')} compact />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
