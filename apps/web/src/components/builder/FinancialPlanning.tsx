'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Calculator,
  Target,
  AlertTriangle,
  Sparkles,
  Save,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Financial Planning</h2>
            <p className="text-sm leading-snug text-muted-foreground">
              Revenue models, cost projections, and funding requirements
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {completionPercentage.toFixed(0)}% Complete
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="min-h-10"
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Generate
          </Button>
          <Button size="sm" className="min-h-10" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
              <span className="text-xs text-muted-foreground leading-snug">Monthly Burn</span>
            </div>
            <div className="text-xl font-bold text-red-600 sm:text-2xl">
              {formatCurrency(data.burnRate > 0 ? data.burnRate : totalMonthlyOperating - totalMonthlyRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Runway</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {data.runway > 0 ? `${data.runway} months` : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Monthly Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMonthlyRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">LTV/CAC Ratio</span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              data.unitEconomics.ltvCacRatio >= 3 ? "text-green-600" :
              data.unitEconomics.ltvCacRatio >= 1 ? "text-yellow-600" : "text-red-600"
            )}>
              {data.unitEconomics.ltvCacRatio.toFixed(1)}x
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="costs" className="gap-1">
            <TrendingDown className="h-3 w-3" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="unit-economics" className="gap-1">
            <Calculator className="h-3 w-3" />
            Unit Economics
          </TabsTrigger>
          <TabsTrigger value="funding" className="gap-1">
            <PiggyBank className="h-3 w-3" />
            Funding
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Startup Costs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Startup Costs (One-time)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => addCost('startup')}>
                  + Add
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
                  <span className="font-medium">Total Startup Costs</span>
                  <span className="font-bold">{formatCurrency(totalStartupCosts)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Costs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Operating Costs (Monthly)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => addCost('operating')}>
                  + Add
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
                  <span className="font-medium">Total Monthly Operating</span>
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
              <CardTitle>Revenue Streams</CardTitle>
              <Button variant="outline" size="sm" onClick={addRevenueStream}>
                + Add Stream
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.revenueStreams.map((stream, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <span className="font-medium">Total Monthly Revenue</span>
                <span className="font-bold text-green-600">{formatCurrency(totalMonthlyRevenue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Model</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md"
                placeholder="Describe your pricing model, tiers, and strategy..."
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
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer Acquisition Cost (CAC)</Label>
                  <Input
                    type="number"
                    value={data.unitEconomics.cac || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      unitEconomics: { ...prev.unitEconomics, cac: Number(e.target.value) }
                    }))}
                    placeholder="$0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total marketing spend / new customers acquired
                  </p>
                </div>
                <div>
                  <Label>Payback Period (months)</Label>
                  <Input
                    type="number"
                    value={data.unitEconomics.paybackPeriod || ''}
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
                <CardTitle>Customer Value</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Lifetime Value (LTV)</Label>
                  <Input
                    type="number"
                    value={data.unitEconomics.ltv || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      unitEconomics: { ...prev.unitEconomics, ltv: Number(e.target.value) }
                    }))}
                    placeholder="$0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Average revenue per customer over their lifetime
                  </p>
                </div>
                <div>
                  <Label>Gross Margin (%)</Label>
                  <Input
                    type="number"
                    value={data.unitEconomics.grossMargin || ''}
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
              <CardTitle>Unit Economics Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className={cn(
                    "text-3xl font-bold mb-2",
                    data.unitEconomics.ltvCacRatio >= 3 ? "text-green-600" :
                    data.unitEconomics.ltvCacRatio >= 1 ? "text-yellow-600" : "text-red-600"
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
                  <div className="text-3xl font-bold mb-2 text-blue-600">
                    {data.unitEconomics.paybackPeriod} mo
                  </div>
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                  <div className="text-xs mt-1">
                    {data.unitEconomics.paybackPeriod <= 12 ? '✅ Good (<12 mo)' : '⚠️ Long payback'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold mb-2 text-purple-600">
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
              <CardTitle>Funding Rounds</CardTitle>
              <Button variant="outline" size="sm" onClick={addFundingRound}>
                + Add Round
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.fundingRounds.map((round, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <span className="font-medium">Total Funding Target</span>
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
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Conservative
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>12-Month Revenue</Label>
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
                  <Label>12-Month Costs</Label>
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
                    <span>Net</span>
                    <span className={cn(
                      "font-bold",
                      data.scenarios.conservative.revenue12m - data.scenarios.conservative.costs12m >= 0
                        ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(data.scenarios.conservative.revenue12m - data.scenarios.conservative.costs12m)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Realistic */}
            <Card className="border-blue-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Realistic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>12-Month Revenue</Label>
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
                  <Label>12-Month Costs</Label>
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
                    <span>Net</span>
                    <span className={cn(
                      "font-bold",
                      data.scenarios.realistic.revenue12m - data.scenarios.realistic.costs12m >= 0
                        ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(data.scenarios.realistic.revenue12m - data.scenarios.realistic.costs12m)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aggressive */}
            <Card className="border-green-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Aggressive
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>12-Month Revenue</Label>
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
                  <Label>12-Month Costs</Label>
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
                    <span>Net</span>
                    <span className={cn(
                      "font-bold",
                      data.scenarios.aggressive.revenue12m - data.scenarios.aggressive.costs12m >= 0
                        ? "text-green-600" : "text-red-600"
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
