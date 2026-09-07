'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Save,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { BuilderStageHeader, useBuilderPrimaryText } from './BuilderStageChrome';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';

interface RevenueStream {
  name: string;
  type: 'subscription' | 'transaction' | 'one-time' | 'advertising' | 'other';
  monthlyRevenue: number;
  growthRate: number;
  assumptions: string;
}

interface CostItem {
  category: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  isFixed: boolean;
}

interface FundingRound {
  stage: string;
  amount: number;
  timeline: string;
  use: string[];
  dilution: number;
}

interface FinancialData {
  startupCosts: CostItem[];
  operatingCosts: CostItem[];
  revenueStreams: RevenueStream[];
  fundingRounds: FundingRound[];
  runway: number;
  burnRate: number;
  breakEvenMonth: number;
  pricingModel: string;
  unitEconomics: {
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackPeriod: number;
    grossMargin: number;
  };
  scenarios: {
    conservative: { revenue12m: number; costs12m: number };
    realistic: { revenue12m: number; costs12m: number };
    aggressive: { revenue12m: number; costs12m: number };
  };
}

interface FinancialPlanningProps {
  onSave?: (data: FinancialData) => void;
  initialData?: Partial<FinancialData>;
}

const defaultFinancialData: FinancialData = {
  startupCosts: [],
  operatingCosts: [],
  revenueStreams: [],
  fundingRounds: [],
  runway: 0,
  burnRate: 0,
  breakEvenMonth: 0,
  pricingModel: '',
  unitEconomics: {
    cac: 0,
    ltv: 0,
    ltvCacRatio: 0,
    paybackPeriod: 0,
    grossMargin: 0
  },
  scenarios: {
    conservative: { revenue12m: 0, costs12m: 0 },
    realistic: { revenue12m: 0, costs12m: 0 },
    aggressive: { revenue12m: 0, costs12m: 0 }
  }
};

export function FinancialPlanning({ onSave, initialData }: FinancialPlanningProps) {
  const t = useBuilderPrimaryText();
  const [data, setData] = useState<FinancialData>({ ...defaultFinancialData, ...initialData });
  const [activeTab, setActiveTab] = useState('costs');
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    let completed = 0;
    let total = 6;
    
    if (data.startupCosts.length > 0) completed++;
    if (data.operatingCosts.length > 0) completed++;
    if (data.revenueStreams.length > 0) completed++;
    if (data.unitEconomics.cac > 0) completed++;
    if (data.pricingModel) completed++;
    if (data.fundingRounds.length > 0) completed++;
    
    setCompletionPercentage((completed / total) * 100);
  }, [data]);

  // Calculate derived metrics
  useEffect(() => {
    const monthlyOperatingCosts = data.operatingCosts
      .filter(c => c.frequency === 'monthly')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const monthlyRevenue = data.revenueStreams
      .reduce((sum, r) => sum + r.monthlyRevenue, 0);
    
    const burnRate = monthlyOperatingCosts - monthlyRevenue;
    const totalFunding = data.fundingRounds.reduce((sum, r) => sum + r.amount, 0);
    const runway = burnRate > 0 ? Math.floor(totalFunding / burnRate) : 0;
    
    // Calculate LTV/CAC ratio
    const ltvCacRatio = data.unitEconomics.cac > 0 
      ? data.unitEconomics.ltv / data.unitEconomics.cac 
      : 0;
    
    setData(prev => ({
      ...prev,
      burnRate,
      runway,
      unitEconomics: {
        ...prev.unitEconomics,
        ltvCacRatio
      }
    }));
  }, [data.operatingCosts, data.revenueStreams, data.fundingRounds, data.unitEconomics.cac, data.unitEconomics.ltv]);

  const generateWithAI = async () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        startupCosts: [
          { category: 'Legal', name: 'Company Formation', amount: 2000, frequency: 'one-time', isFixed: true },
          { category: 'Legal', name: 'IP & Trademarks', amount: 3000, frequency: 'one-time', isFixed: true },
          { category: 'Technology', name: 'Initial Development', amount: 25000, frequency: 'one-time', isFixed: true },
          { category: 'Marketing', name: 'Brand & Website', amount: 5000, frequency: 'one-time', isFixed: true }
        ],
        operatingCosts: [
          { category: 'Team', name: 'Salaries', amount: 15000, frequency: 'monthly', isFixed: true },
          { category: 'Infrastructure', name: 'Cloud Services', amount: 500, frequency: 'monthly', isFixed: false },
          { category: 'Tools', name: 'SaaS Subscriptions', amount: 300, frequency: 'monthly', isFixed: true },
          { category: 'Marketing', name: 'Digital Marketing', amount: 2000, frequency: 'monthly', isFixed: false },
          { category: 'Operations', name: 'Office & Misc', amount: 500, frequency: 'monthly', isFixed: true }
        ],
        revenueStreams: [
          { name: 'Pro Subscriptions', type: 'subscription', monthlyRevenue: 5000, growthRate: 15, assumptions: 'Based on 100 users at $50/mo' },
          { name: 'Enterprise Plans', type: 'subscription', monthlyRevenue: 3000, growthRate: 20, assumptions: 'Based on 3 organizations at $1000/mo' },
          { name: 'AI Generation Packs', type: 'transaction', monthlyRevenue: 1000, growthRate: 25, assumptions: 'Based on 200 packs at $5 each' }
        ],
        fundingRounds: [
          { stage: 'Pre-seed', amount: 150000, timeline: 'Q2 2024', use: ['Product development', 'Initial team'], dilution: 10 },
          { stage: 'Seed', amount: 500000, timeline: 'Q4 2024', use: ['Scale team', 'Marketing', 'Operations'], dilution: 15 }
        ],
        pricingModel: 'Freemium with Pro ($49/mo) and Enterprise ($999/mo) tiers. Additional AI generation packs available for purchase.',
        unitEconomics: {
          cac: 50,
          ltv: 400,
          ltvCacRatio: 8,
          paybackPeriod: 3,
          grossMargin: 80
        },
        scenarios: {
          conservative: { revenue12m: 80000, costs12m: 220000 },
          realistic: { revenue12m: 150000, costs12m: 220000 },
          aggressive: { revenue12m: 300000, costs12m: 280000 }
        }
      }));
      setIsGenerating(false);
    }, 3000);
  };

  const addCost = (type: 'startup' | 'operating') => {
    const newCost: CostItem = {
      category: '',
      name: '',
      amount: 0,
      frequency: type === 'startup' ? 'one-time' : 'monthly',
      isFixed: true
    };
    
    if (type === 'startup') {
      setData(prev => ({ ...prev, startupCosts: [...prev.startupCosts, newCost] }));
    } else {
      setData(prev => ({ ...prev, operatingCosts: [...prev.operatingCosts, newCost] }));
    }
  };

  const addRevenueStream = () => {
    const newStream: RevenueStream = {
      name: '',
      type: 'subscription',
      monthlyRevenue: 0,
      growthRate: 0,
      assumptions: ''
    };
    setData(prev => ({ ...prev, revenueStreams: [...prev.revenueStreams, newStream] }));
  };

  const addFundingRound = () => {
    const newRound: FundingRound = {
      stage: '',
      amount: 0,
      timeline: '',
      use: [],
      dilution: 0
    };
    setData(prev => ({ ...prev, fundingRounds: [...prev.fundingRounds, newRound] }));
  };

  const handleSave = () => {
    onSave?.(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalStartupCosts = data.startupCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalMonthlyOperating = data.operatingCosts
    .filter(c => c.frequency === 'monthly')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalMonthlyRevenue = data.revenueStreams.reduce((sum, r) => sum + r.monthlyRevenue, 0);

  return (
    <div className="space-y-6">
      <BuilderStageHeader
        glyph="wallet"
        titleEn={builderEn('fin_title')}
        titleEl={builderEl('fin_title')}
        subtitleEn={builderEn('fin_sub')}
        subtitleEl={builderEl('fin_sub')}
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

      {/* Key Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="icon-sm text-status-danger" />
              <span className="text-sm text-muted-foreground">
                <BilingualText en={builderEn('fin_burn')} el={builderEl('fin_burn')} compact />
              </span>
            </div>
            <div className="text-2xl font-bold text-status-danger">
              {formatCurrency(data.burnRate > 0 ? data.burnRate : totalMonthlyOperating - totalMonthlyRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CfbGlyph name="wallet" className="icon-sm text-status-info" />
              <span className="text-sm text-muted-foreground">
                <BilingualText en={builderEn('fin_runway')} el={builderEl('fin_runway')} compact />
              </span>
            </div>
            <div className="text-2xl font-bold text-status-info">
              {data.runway > 0 ? (
                <>
                  {data.runway}{' '}
                  <BilingualText en={builderEn('fin_months')} el={builderEl('fin_months')} compact />
                </>
              ) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="icon-sm text-status-success" />
              <span className="text-sm text-muted-foreground">
                <BilingualText en={builderEn('fin_mrev')} el={builderEl('fin_mrev')} compact />
              </span>
            </div>
            <div className="text-2xl font-bold text-status-success">
              {formatCurrency(totalMonthlyRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CfbGlyph name="chart" className="icon-sm text-status-accent" />
              <span className="text-sm text-muted-foreground">
                <BilingualText en={builderEn('fin_ltv_cac')} el={builderEl('fin_ltv_cac')} compact />
              </span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              data.unitEconomics.ltvCacRatio >= 3 ? "text-status-success" :
              data.unitEconomics.ltvCacRatio >= 1 ? "text-status-warning" : "text-status-danger"
            )}>
              {data.unitEconomics.ltvCacRatio.toFixed(1)}x
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 rounded-xl">
          <TabsTrigger value="costs" className="gap-1">
            <TrendingDown className="icon-sm" />
            <BilingualText en={builderEn('fin_tab_costs')} el={builderEl('fin_tab_costs')} compact />
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1">
            <TrendingUp className="icon-sm" />
            <BilingualText en={builderEn('fin_tab_rev')} el={builderEl('fin_tab_rev')} compact />
          </TabsTrigger>
          <TabsTrigger value="unit-economics" className="gap-1">
            <CfbGlyph name="chart" className="icon-sm" />
            <BilingualText en={builderEn('fin_tab_unit')} el={builderEl('fin_tab_unit')} compact />
          </TabsTrigger>
          <TabsTrigger value="funding" className="gap-1">
            <CfbGlyph name="wallet" className="icon-sm" />
            <BilingualText en={builderEn('fin_tab_fund')} el={builderEl('fin_tab_fund')} compact />
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1">
            <CfbGlyph name="compare" className="icon-sm" />
            <BilingualText en={builderEn('fin_tab_scen')} el={builderEl('fin_tab_scen')} compact />
          </TabsTrigger>
        </TabsList>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Startup Costs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('fin_startup')} el={builderEl('fin_startup')} compact />
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => addCost('startup')}>
                  <BilingualText en={builderEn('add')} el={builderEl('add')} compact />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.startupCosts.map((cost, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Category"
                      value={cost.category}
                      onChange={(e) => {
                        const newCosts = [...data.startupCosts];
                        newCosts[index] = { ...cost, category: e.target.value };
                        setData(prev => ({ ...prev, startupCosts: newCosts }));
                      }}
                    />
                    <Input
                      placeholder="Item name"
                      value={cost.name}
                      onChange={(e) => {
                        const newCosts = [...data.startupCosts];
                        newCosts[index] = { ...cost, name: e.target.value };
                        setData(prev => ({ ...prev, startupCosts: newCosts }));
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={cost.amount || ''}
                        onChange={(e) => {
                          const newCosts = [...data.startupCosts];
                          newCosts[index] = { ...cost, amount: Number(e.target.value) };
                          setData(prev => ({ ...prev, startupCosts: newCosts }));
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            startupCosts: prev.startupCosts.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between">
                  <span className="font-medium">
                    <BilingualText en={builderEn('fin_total_start')} el={builderEl('fin_total_start')} compact />
                  </span>
                  <span className="font-bold">{formatCurrency(totalStartupCosts)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Costs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('fin_operating')} el={builderEl('fin_operating')} compact />
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => addCost('operating')}>
                  <BilingualText en={builderEn('add')} el={builderEl('add')} compact />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.operatingCosts.map((cost, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Category"
                      value={cost.category}
                      onChange={(e) => {
                        const newCosts = [...data.operatingCosts];
                        newCosts[index] = { ...cost, category: e.target.value };
                        setData(prev => ({ ...prev, operatingCosts: newCosts }));
                      }}
                    />
                    <Input
                      placeholder="Item name"
                      value={cost.name}
                      onChange={(e) => {
                        const newCosts = [...data.operatingCosts];
                        newCosts[index] = { ...cost, name: e.target.value };
                        setData(prev => ({ ...prev, operatingCosts: newCosts }));
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={cost.amount || ''}
                        onChange={(e) => {
                          const newCosts = [...data.operatingCosts];
                          newCosts[index] = { ...cost, amount: Number(e.target.value) };
                          setData(prev => ({ ...prev, operatingCosts: newCosts }));
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            operatingCosts: prev.operatingCosts.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between">
                  <span className="font-medium">
                    <BilingualText en={builderEn('fin_total_op')} el={builderEl('fin_total_op')} compact />
                  </span>
                  <span className="font-bold">{formatCurrency(totalMonthlyOperating)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <BilingualText en={builderEn('fin_streams')} el={builderEl('fin_streams')} compact />
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addRevenueStream}>
                <BilingualText en={builderEn('fin_add_stream')} el={builderEl('fin_add_stream')} compact />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.revenueStreams.map((stream, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={stream.name}
                        onChange={(e) => {
                          const newStreams = [...data.revenueStreams];
                          newStreams[index] = { ...stream, name: e.target.value };
                          setData(prev => ({ ...prev, revenueStreams: newStreams }));
                        }}
                        placeholder="Revenue stream name"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        value={stream.type}
                        onChange={(e) => {
                          const newStreams = [...data.revenueStreams];
                          newStreams[index] = { ...stream, type: e.target.value as RevenueStream['type'] };
                          setData(prev => ({ ...prev, revenueStreams: newStreams }));
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="subscription">Subscription</option>
                        <option value="transaction">Transaction</option>
                        <option value="one-time">One-time</option>
                        <option value="advertising">Advertising</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Monthly Revenue</Label>
                      <Input
                        type="number"
                        value={stream.monthlyRevenue || ''}
                        onChange={(e) => {
                          const newStreams = [...data.revenueStreams];
                          newStreams[index] = { ...stream, monthlyRevenue: Number(e.target.value) };
                          setData(prev => ({ ...prev, revenueStreams: newStreams }));
                        }}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <Label>Growth Rate (%/mo)</Label>
                      <Input
                        type="number"
                        value={stream.growthRate || ''}
                        onChange={(e) => {
                          const newStreams = [...data.revenueStreams];
                          newStreams[index] = { ...stream, growthRate: Number(e.target.value) };
                          setData(prev => ({ ...prev, revenueStreams: newStreams }));
                        }}
                        placeholder="0%"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="pt-3 border-t flex justify-between">
                <span className="font-medium">
                  <BilingualText en={builderEn('fin_total_mrev')} el={builderEl('fin_total_mrev')} compact />
                </span>
                <span className="font-bold text-status-success">{formatCurrency(totalMonthlyRevenue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <BilingualText en={builderEn('fin_pricing')} el={builderEl('fin_pricing')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md"
                placeholder={t(builderEn('fin_pricing_ph'), builderEl('fin_pricing_ph'))}
                value={data.pricingModel}
                onChange={(e) => setData(prev => ({ ...prev, pricingModel: e.target.value }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unit Economics Tab */}
        <TabsContent value="unit-economics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('fin_acq')} el={builderEl('fin_acq')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('fin_cac')} el={builderEl('fin_cac')} compact /></Label>
                  <Input
                    type="number"
                    value={data.unitEconomics?.cac || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      unitEconomics: { ...prev.unitEconomics, cac: Number(e.target.value) }
                    }))}
                    placeholder="$0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <BilingualText en={builderEn('fin_cac_hint')} el={builderEl('fin_cac_hint')} />
                  </p>
                </div>
                <div>
                  <Label><BilingualText en={builderEn('fin_payback')} el={builderEl('fin_payback')} compact /></Label>
                  <Input
                    type="number"
                    value={data.unitEconomics?.paybackPeriod || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      unitEconomics: { ...prev.unitEconomics, paybackPeriod: Number(e.target.value) }
                    }))}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('fin_value')} el={builderEl('fin_value')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('fin_ltv')} el={builderEl('fin_ltv')} compact /></Label>
                  <Input
                    type="number"
                    value={data.unitEconomics?.ltv || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      unitEconomics: { ...prev.unitEconomics, ltv: Number(e.target.value) }
                    }))}
                    placeholder="$0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <BilingualText en={builderEn('fin_ltv_hint')} el={builderEl('fin_ltv_hint')} />
                  </p>
                </div>
                <div>
                  <Label><BilingualText en={builderEn('fin_margin')} el={builderEl('fin_margin')} compact /></Label>
                  <Input
                    type="number"
                    value={data.unitEconomics?.grossMargin || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      unitEconomics: { ...prev.unitEconomics, grossMargin: Number(e.target.value) }
                    }))}
                    placeholder="0%"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unit Economics Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <BilingualText en={builderEn('fin_health')} el={builderEl('fin_health')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className={cn(
                    "text-3xl font-bold mb-2",
                    data.unitEconomics.ltvCacRatio >= 3 ? "text-status-success" :
                    data.unitEconomics.ltvCacRatio >= 1 ? "text-status-warning" : "text-status-danger"
                  )}>
                    {data.unitEconomics.ltvCacRatio.toFixed(1)}x
                  </div>
                  <div className="text-sm text-muted-foreground">LTV/CAC Ratio</div>
                  <div className="text-xs mt-1">
                    {data.unitEconomics.ltvCacRatio >= 3 ? '✅ Healthy (>3x)' :
                     data.unitEconomics.ltvCacRatio >= 1 ? '⚠️ Needs improvement' : '❌ Unsustainable'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold mb-2 text-status-info">
                    {data.unitEconomics.paybackPeriod} mo
                  </div>
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                  <div className="text-xs mt-1">
                    {data.unitEconomics.paybackPeriod <= 12 ? '✅ Good (<12 mo)' : '⚠️ Long payback'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold mb-2 text-status-accent">
                    {data.unitEconomics.grossMargin}%
                  </div>
                  <div className="text-sm text-muted-foreground">Gross Margin</div>
                  <div className="text-xs mt-1">
                    {data.unitEconomics.grossMargin >= 70 ? '✅ SaaS-level (>70%)' : '⚠️ Below SaaS average'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funding Tab */}
        <TabsContent value="funding" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <BilingualText en={builderEn('fin_rounds')} el={builderEl('fin_rounds')} compact />
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addFundingRound}>
                <BilingualText en={builderEn('fin_add_round')} el={builderEl('fin_add_round')} compact />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.fundingRounds.map((round, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <Label>Stage</Label>
                      <Input
                        value={round.stage}
                        onChange={(e) => {
                          const newRounds = [...data.fundingRounds];
                          newRounds[index] = { ...round, stage: e.target.value };
                          setData(prev => ({ ...prev, fundingRounds: newRounds }));
                        }}
                        placeholder="e.g., Pre-seed, Seed"
                      />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={round.amount || ''}
                        onChange={(e) => {
                          const newRounds = [...data.fundingRounds];
                          newRounds[index] = { ...round, amount: Number(e.target.value) };
                          setData(prev => ({ ...prev, fundingRounds: newRounds }));
                        }}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <Label>Timeline</Label>
                      <Input
                        value={round.timeline}
                        onChange={(e) => {
                          const newRounds = [...data.fundingRounds];
                          newRounds[index] = { ...round, timeline: e.target.value };
                          setData(prev => ({ ...prev, fundingRounds: newRounds }));
                        }}
                        placeholder="e.g., Q2 2024"
                      />
                    </div>
                    <div>
                      <Label>Dilution (%)</Label>
                      <Input
                        type="number"
                        value={round.dilution || ''}
                        onChange={(e) => {
                          const newRounds = [...data.fundingRounds];
                          newRounds[index] = { ...round, dilution: Number(e.target.value) };
                          setData(prev => ({ ...prev, fundingRounds: newRounds }));
                        }}
                        placeholder="0%"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="pt-3 border-t flex justify-between">
                <span className="font-medium">
                  <BilingualText en={builderEn('fin_total_fund')} el={builderEl('fin_total_fund')} compact />
                </span>
                <span className="font-bold">
                  {formatCurrency(data.fundingRounds.reduce((sum, r) => sum + r.amount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Conservative */}
            <Card className="border-status-warning-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="icon-md text-status-warning" />
                  <BilingualText en={builderEn('fin_cons')} el={builderEl('fin_cons')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('fin_12rev')} el={builderEl('fin_12rev')} compact /></Label>
                  <Input
                    type="number"
                    value={data.scenarios.conservative.revenue12m || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      scenarios: {
                        ...prev.scenarios,
                        conservative: { ...prev.scenarios.conservative, revenue12m: Number(e.target.value) }
                      }
                    }))}
                    placeholder="$0"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('fin_12cost')} el={builderEl('fin_12cost')} compact /></Label>
                  <Input
                    type="number"
                    value={data.scenarios.conservative.costs12m || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      scenarios: {
                        ...prev.scenarios,
                        conservative: { ...prev.scenarios.conservative, costs12m: Number(e.target.value) }
                      }
                    }))}
                    placeholder="$0"
                  />
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span><BilingualText en={builderEn('fin_net')} el={builderEl('fin_net')} compact /></span>
                    <span className={cn(
                      "font-bold",
                      data.scenarios.conservative.revenue12m - data.scenarios.conservative.costs12m >= 0
                        ? "text-status-success" : "text-status-danger"
                    )}>
                      {formatCurrency(data.scenarios.conservative.revenue12m - data.scenarios.conservative.costs12m)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Realistic */}
            <Card className="border-status-info-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CfbGlyph name="target" className="icon-md text-status-info" />
                  <BilingualText en={builderEn('fin_real')} el={builderEl('fin_real')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('fin_12rev')} el={builderEl('fin_12rev')} compact /></Label>
                  <Input
                    type="number"
                    value={data.scenarios.realistic.revenue12m || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      scenarios: {
                        ...prev.scenarios,
                        realistic: { ...prev.scenarios.realistic, revenue12m: Number(e.target.value) }
                      }
                    }))}
                    placeholder="$0"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('fin_12cost')} el={builderEl('fin_12cost')} compact /></Label>
                  <Input
                    type="number"
                    value={data.scenarios.realistic.costs12m || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      scenarios: {
                        ...prev.scenarios,
                        realistic: { ...prev.scenarios.realistic, costs12m: Number(e.target.value) }
                      }
                    }))}
                    placeholder="$0"
                  />
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span><BilingualText en={builderEn('fin_net')} el={builderEl('fin_net')} compact /></span>
                    <span className={cn(
                      "font-bold",
                      data.scenarios.realistic.revenue12m - data.scenarios.realistic.costs12m >= 0
                        ? "text-status-success" : "text-status-danger"
                    )}>
                      {formatCurrency(data.scenarios.realistic.revenue12m - data.scenarios.realistic.costs12m)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aggressive */}
            <Card className="border-status-success-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="icon-md text-status-success" />
                  <BilingualText en={builderEn('fin_aggr')} el={builderEl('fin_aggr')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label><BilingualText en={builderEn('fin_12rev')} el={builderEl('fin_12rev')} compact /></Label>
                  <Input
                    type="number"
                    value={data.scenarios.aggressive.revenue12m || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      scenarios: {
                        ...prev.scenarios,
                        aggressive: { ...prev.scenarios.aggressive, revenue12m: Number(e.target.value) }
                      }
                    }))}
                    placeholder="$0"
                  />
                </div>
                <div>
                  <Label><BilingualText en={builderEn('fin_12cost')} el={builderEl('fin_12cost')} compact /></Label>
                  <Input
                    type="number"
                    value={data.scenarios.aggressive.costs12m || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      scenarios: {
                        ...prev.scenarios,
                        aggressive: { ...prev.scenarios.aggressive, costs12m: Number(e.target.value) }
                      }
                    }))}
                    placeholder="$0"
                  />
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span><BilingualText en={builderEn('fin_net')} el={builderEl('fin_net')} compact /></span>
                    <span className={cn(
                      "font-bold",
                      data.scenarios.aggressive.revenue12m - data.scenarios.aggressive.costs12m >= 0
                        ? "text-status-success" : "text-status-danger"
                    )}>
                      {formatCurrency(data.scenarios.aggressive.revenue12m - data.scenarios.aggressive.costs12m)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
