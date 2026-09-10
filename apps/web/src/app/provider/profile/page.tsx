'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Save,
  RefreshCw,
  BadgeCheck,
  Globe,
  DollarSign,
  Star,
  Building2,
  Users,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { getMeProfile } from '@/lib/api';

const SERVICE_TYPES = [
  { value: 'legal', label: 'Legal' },
  { value: 'accounting', label: 'Accounting & Finance' },
  { value: 'development', label: 'Software Development' },
  { value: 'design', label: 'Design & UX' },
  { value: 'marketing', label: 'Marketing & Growth' },
  { value: 'recruiting', label: 'Recruiting & HR' },
  { value: 'consulting', label: 'Business Consulting' },
  { value: 'coaching', label: 'Executive Coaching' },
];

const PRICING_MODELS = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'project', label: 'Project-Based' },
  { value: 'retainer', label: 'Monthly Retainer' },
  { value: 'equity', label: 'Revenue Share / Equity' },
  { value: 'mixed', label: 'Mixed' },
];

const INDUSTRIES = [
  'SaaS', 'Fintech', 'Healthtech', 'Edtech', 'E-commerce', 'Marketplace',
  'Deep Tech', 'AI/ML', 'Climate Tech', 'Web3', 'Consumer', 'Enterprise',
];

const STARTUP_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+', 'Growth', 'All stages'];

export default function ProviderProfilePage() {
  const { hasSession, mounted } = useSession();
  const { success } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [serviceType, setServiceType] = useState('consulting');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState('project');
  const [startingPrice, setStartingPrice] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('3');
  const [clientsServed, setClientsServed] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['SaaS', 'Fintech']);
  const [selectedStages, setSelectedStages] = useState<string[]>(['Seed', 'Series A']);

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName ?? 'Provider';
  const avatarUrl = profile?.profile?.avatarUrl;

  function toggleChip(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }

  async function handleSave() {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    success('Profile updated', 'Your provider profile is now live.');
  }

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  const serviceTypeLabel = SERVICE_TYPES.find(s => s.value === serviceType)?.label ?? serviceType;

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="icon-lg text-primary-emphasis" aria-hidden="true" />
              Service Provider Profile
            </h1>
            <p className="text-muted-foreground">How startups discover your services</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="mr-2 icon-sm animate-spin" aria-hidden="true" /> : <Save className="mr-2 icon-sm" aria-hidden="true" />}
            Save Profile
          </Button>
        </div>

        {/* Preview Card */}
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 rounded-xl ring-2 ring-primary/20">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary-emphasis text-sm font-bold rounded-xl">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-lg">{companyName || displayName}</h2>
                  <BadgeCheck className="icon-sm text-primary-emphasis" aria-hidden="true" />
                  <Badge variant="secondary" className="text-xs">{serviceTypeLabel}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {headline || 'Add your service headline below...'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Star className="icon-2xs text-amber-400" aria-hidden="true" /> 4.8 (8 reviews)</span>
                  <span className="flex items-center gap-1"><Users className="icon-2xs" aria-hidden="true" /> {clientsServed || '?'} clients</span>
                  <span className="flex items-center gap-1"><TrendingUp className="icon-2xs" aria-hidden="true" /> {yearsInBusiness}y in business</span>
                  {companyWebsite && (
                    <span className="flex items-center gap-1"><Globe className="icon-2xs" aria-hidden="true" /> {companyWebsite}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basics">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          {/* Basics */}
          <TabsContent value="basics" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Legal Partners" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://acmelegal.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. Startup-focused legal services — term sheets, IP, incorporation"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your services, your process, and what makes you different..."
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Years in Business</Label>
                    <Select value={yearsInBusiness} onValueChange={setYearsInBusiness}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '5', '7', '10', '15', '20+'].map(v => (
                          <SelectItem key={v} value={v}>{v} year{v !== '1' ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Clients Served</Label>
                    <Input
                      type="number"
                      value={clientsServed}
                      onChange={e => setClientsServed(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Accepting New Clients</p>
                    <p className="text-xs text-muted-foreground">Show in service provider discovery</p>
                  </div>
                  <Switch checked={isAccepting} onCheckedChange={setIsAccepting} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targeting */}
          <TabsContent value="targeting" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Industries You Serve</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => toggleChip(selectedIndustries, setSelectedIndustries, ind)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedIndustries.includes(ind)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Startup Stages</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {STARTUP_STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleChip(selectedStages, setSelectedStages, stage)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedStages.includes(stage)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Pricing Model</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {PRICING_MODELS.map(pm => (
                    <div
                      key={pm.value}
                      onClick={() => setPricingModel(pm.value)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                        pricingModel === pm.value ? 'border-primary bg-primary/5' : 'hover:border-border/80'
                      )}
                    >
                      <p className="text-sm font-medium">{pm.label}</p>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 transition-all',
                        pricingModel === pm.value ? 'border-primary bg-primary' : 'border-border'
                      )} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Starting Price (USD)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={startingPrice}
                      onChange={e => setStartingPrice(e.target.value)}
                      placeholder="500"
                      className="w-36"
                    />
                    <span className="text-sm text-muted-foreground">minimum engagement</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
