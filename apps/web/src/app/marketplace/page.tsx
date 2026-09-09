'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Star, ExternalLink, Package, TrendingUp, DollarSign,
  CheckCircle, MessageCircle, Bookmark, Filter, ArrowUpDown,
  Clock, MapPin, Users, Zap, ChevronRight, ShieldCheck, Plus,
  Scale, Calculator, Megaphone, Code2, Brush, BrainCircuit, GraduationCap,
  Globe, BadgeCheck, Store,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { listMarketplaceServices, type MarketplaceCategory } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceProvider = {
  id: string;
  providerName: string;
  providerAvatar?: string;
  providerTitle: string;
  title: string;
  description: string;
  category: string;
  specialties: string[];
  pricing: string;
  pricingTier: 'free' | 'paid' | 'custom';
  avgRating: number;
  reviewCount: number;
  clientCount: number;
  responseTime: string;
  location: string;
  isVerified: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  websiteUrl?: string;
  contactUrl?: string;
};

// ── Category Config ────────────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  All: { label: 'All Services', icon: Store, color: 'text-foreground' },
  legal: { label: 'Legal', icon: Scale, color: 'text-status-info' },
  finance: { label: 'Finance', icon: Calculator, color: 'text-status-success' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'text-status-warning' },
  development: { label: 'Development', icon: Code2, color: 'text-status-accent' },
  design: { label: 'Design', icon: Brush, color: 'text-status-accent' },
  consulting: { label: 'Consulting', icon: BrainCircuit, color: 'text-status-warning' },
  coaching: { label: 'Coaching', icon: GraduationCap, color: 'text-status-success' },
  other: { label: 'Other', icon: Globe, color: 'text-muted-foreground' },
};

const CATEGORIES = Object.keys(CAT_CONFIG);

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_PROVIDERS: ServiceProvider[] = [
  {
    id: '1', providerName: 'Alexandra Kosta', providerTitle: 'Startup Legal Counsel',
    title: 'Startup Legal Package', description: 'Full legal coverage for early-stage startups: incorporation, term sheets, SAFE notes, IP protection, NDAs, and co-founder agreements.',
    category: 'legal', specialties: ['Incorporation', 'Term Sheets', 'IP', 'SAFE Notes'],
    pricing: 'From €500', pricingTier: 'paid', avgRating: 4.9, reviewCount: 47, clientCount: 82,
    responseTime: '< 24h', location: 'Athens, GR', isVerified: true, isFeatured: true, isAvailable: true,
  },
  {
    id: '2', providerName: 'Mark Thompson', providerTitle: 'CFO-as-a-Service',
    title: 'Financial Modeling & Fundraising Prep', description: 'Build investor-grade financial models, cap tables, and fundraising narratives. YC/Techstars alumni advising 50+ startups.',
    category: 'finance', specialties: ['Financial Modeling', 'Cap Table', 'Pitch Financials', 'Due Diligence'],
    pricing: 'From €800/mo', pricingTier: 'paid', avgRating: 4.8, reviewCount: 34, clientCount: 61,
    responseTime: '< 48h', location: 'London, UK', isVerified: true, isFeatured: true, isAvailable: true,
  },
  {
    id: '3', providerName: 'Sofia Papadaki', providerTitle: 'Growth Marketing Strategist',
    title: 'GTM Strategy & Growth Hacking', description: 'Full-funnel growth strategy for B2B SaaS. SEO, paid acquisition, content, and lifecycle marketing. 3x average ARR growth for clients.',
    category: 'marketing', specialties: ['GTM Strategy', 'SEO', 'Paid Ads', 'B2B SaaS'],
    pricing: 'From €600/mo', pricingTier: 'paid', avgRating: 4.7, reviewCount: 28, clientCount: 40,
    responseTime: '< 12h', location: 'Remote', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '4', providerName: 'ByteCraft Studio', providerTitle: 'Full-Stack Development Agency',
    title: 'MVP Development & Technical Architecture', description: 'From zero to deployed MVP in 6-8 weeks. React/Next.js + Node.js. Technical co-founder level quality without the equity.',
    category: 'development', specialties: ['React', 'Node.js', 'MVP', 'Architecture'],
    pricing: 'From €5K', pricingTier: 'paid', avgRating: 4.6, reviewCount: 19, clientCount: 28,
    responseTime: '< 24h', location: 'Berlin, DE', isVerified: true, isFeatured: true, isAvailable: false,
  },
  {
    id: '5', providerName: 'Nikos Andreou', providerTitle: 'Brand & UX Designer',
    title: 'Brand Identity & Product Design', description: 'End-to-end brand and product design. Logo, design system, UI/UX for web and mobile. Previously led design at 2 unicorns.',
    category: 'design', specialties: ['Brand Identity', 'UI/UX', 'Design Systems', 'Figma'],
    pricing: 'From €1.5K', pricingTier: 'paid', avgRating: 4.9, reviewCount: 63, clientCount: 90,
    responseTime: '< 6h', location: 'Thessaloniki, GR', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '6', providerName: 'Elena Vasilis', providerTitle: 'Startup Strategy Consultant',
    title: 'Business Model & Investor Readiness', description: 'Validate your business model, refine positioning, and prepare for investor conversations. Former VC turned founder advisor.',
    category: 'consulting', specialties: ['Business Model', 'Investor Readiness', 'Strategy', 'Positioning'],
    pricing: 'From €300/session', pricingTier: 'paid', avgRating: 4.8, reviewCount: 41, clientCount: 55,
    responseTime: '< 24h', location: 'Amsterdam, NL', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '7', providerName: 'James Obi', providerTitle: 'Founder & Executive Coach',
    title: 'Founder Coaching & Leadership Development', description: 'ICF-certified executive coach specializing in first-time founders. Clarity, resilience, team leadership, and high-performance habits.',
    category: 'coaching', specialties: ['Executive Coaching', 'Leadership', 'Mindset', 'Team Dynamics'],
    pricing: 'From €150/session', pricingTier: 'paid', avgRating: 5.0, reviewCount: 22, clientCount: 35,
    responseTime: '< 24h', location: 'Remote', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '8', providerName: 'Anna Christodoulou', providerTitle: 'Talent & Recruiting Partner',
    title: 'Technical & Startup Recruiting', description: 'Hire your first 10 engineers and product managers faster. Startup-native recruiting methodology with pre-vetted candidate pipeline.',
    category: 'other', specialties: ['Tech Recruiting', 'Talent Strategy', 'Sourcing', 'Interviews'],
    pricing: 'Custom', pricingTier: 'custom', avgRating: 4.7, reviewCount: 15, clientCount: 22,
    responseTime: '< 48h', location: 'Athens, GR', isVerified: false, isFeatured: false, isAvailable: true,
  },
];

// ── Provider Card ──────────────────────────────────────────────────────────────

function ProviderCard({ provider, featured }: { provider: ServiceProvider; featured?: boolean }) {
  const [saved, setSaved] = useState(false);
  const catCfg = CAT_CONFIG[provider.category] ?? CAT_CONFIG['other'];
  const CatIcon = catCfg.icon;

  return (
    <Card className={cn(
      'group transition-all hover:shadow-md hover:border-primary/20',
      featured && 'border-primary/30 bg-primary/[0.02]',
      !provider.isAvailable && 'opacity-75',
    )}>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-11 w-11 shrink-0 rounded-xl">
              <AvatarImage src={provider.providerAvatar} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible font-bold">
                {provider.providerName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm truncate">{provider.providerName}</p>
                {provider.isVerified && <BadgeCheck className="icon-sm text-status-info shrink-0" />}
                {featured && <Badge className="text-2xs bg-primary/10 text-primary-accessible border-primary/20 border">Featured</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{provider.providerTitle}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="icon-sm fill-status-warning text-amber-400" />
                <span className="text-xs font-medium">{provider.avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({provider.reviewCount})</span>
              </div>
            </div>
          </div>
          {/* Their tap target and accessible name (this icon-only button had
              neither), kept with our icon-size and contrast-safe tokens. */}
          <button
            onClick={() => setSaved(!saved)}
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-muted transition-colors"
            aria-label={saved ? 'Remove bookmark' : 'Save provider'}
          >
            <Bookmark className={cn('icon-sm', saved ? 'fill-primary text-primary-accessible' : 'text-muted-foreground')} />
          </button>
        </div>

        {/* Service */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <CatIcon className={cn('icon-sm shrink-0', catCfg.color)} />
            <h3 className="font-semibold text-sm">{provider.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{provider.description}</p>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1">
          {provider.specialties.slice(0, 3).map(s => (
            <Badge key={s} variant="secondary" className="text-2xs">{s}</Badge>
          ))}
          {provider.specialties.length > 3 && (
            <Badge variant="secondary" className="text-2xs">+{provider.specialties.length - 3}</Badge>
          )}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><Clock className="icon-sm" />{provider.responseTime}</div>
          <div className="flex items-center gap-1"><Users className="icon-sm" />{provider.clientCount} clients</div>
          <div className="flex items-center gap-1"><MapPin className="icon-sm" />{provider.location}</div>
          <div className="flex items-center gap-1">
            <div className={cn('h-1.5 w-1.5 rounded-full', provider.isAvailable ? 'bg-green-500' : 'bg-gray-400')} />
            {provider.isAvailable ? 'Available' : 'Fully booked'}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div>
            <p className="text-xs text-muted-foreground">Starting at</p>
            <p className="font-semibold text-sm">{provider.pricing}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <MessageCircle className="icon-sm" />Message
            </Button>
            <Button size="sm" className="h-8 text-xs" disabled={!provider.isAvailable}>
              Request
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { label: 'Verified Providers', value: '120+', icon: ShieldCheck },
    { label: 'Avg. Rating', value: '4.8 / 5', icon: Star },
    { label: 'Response Time', value: '< 24h', icon: Zap },
    { label: 'Startups Served', value: '500+', icon: Users },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-3 flex items-center gap-2">
            <s.icon className="h-4 w-4 text-primary-accessible shrink-0" />
            <div>
              <p className="text-xs font-bold">{s.value}</p>
              <p className="text-2xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['marketplace', selectedCategory !== 'All' ? selectedCategory : undefined, search || undefined],
    queryFn: () => listMarketplaceServices({
      category: selectedCategory !== 'All' ? selectedCategory.toLowerCase() as MarketplaceCategory : undefined,
      search: search.trim() || undefined,
      limit: 50,
    }),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const backendProviders: ServiceProvider[] = (apiData?.services ?? []).map((s) => ({
    id: s.id,
    providerName: s.providerName,
    providerTitle: s.category,
    title: s.title,
    description: s.description ?? '',
    category: s.category,
    specialties: s.tags ?? [],
    pricing: s.pricing ?? 'Contact',
    pricingTier: 'paid' as const,
    avgRating: 0,
    reviewCount: 0,
    clientCount: 0,
    responseTime: 'Contact',
    location: 'Remote',
    isVerified: false,
    isFeatured: s.isFeatured,
    isAvailable: true,
    websiteUrl: s.websiteUrl ?? undefined,
    contactUrl: s.contactUrl ?? undefined,
  }));

  const allProviders = backendProviders.length > 0 ? backendProviders : MOCK_PROVIDERS;

  const filtered = allProviders
    .filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = !search || p.title.toLowerCase().includes(q) || p.providerName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.specialties.some(s => s.toLowerCase().includes(q));
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesAvail = !availableOnly || p.isAvailable;
      return matchesSearch && matchesCat && matchesAvail;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.avgRating - a.avgRating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      if (sortBy === 'clients') return b.clientCount - a.clientCount;
      return 0;
    });

  const featured = filtered.filter(p => p.isFeatured);
  const regular = filtered.filter(p => !p.isFeatured);

  return (
    <AppShell title="Services Marketplace" description="Find verified experts for every startup need">
      <div className="space-y-6 pb-10">
        {backendProviders.length === 0 && (
          <SampleDataNotice
            surface="Marketplace"
            detail="Live provider listings are not the source of truth yet. These cards are sample experts so you can browse the layout."
            askAiPrompt="The marketplace is showing sample providers. How should I evaluate legal, finance, and coaching help for an early-stage startup?"
          />
        )}
        {/* Banner CTA for providers */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Are you a service provider?</p>
              <p className="text-sm text-muted-foreground">List your services and reach 500+ founders on CoFounderBay</p>
            </div>
            {/* Theirs turns a dead button into a real link to /provider/services;
                our icon-size token is kept. */}
            <Button size="sm" className="shrink-0" asChild>
              <Link href="/provider/services">
                <Plus className="mr-1.5 icon-sm" />List Your Service
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <StatsBar />

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input placeholder="Search services, providers, specialties..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 icon-sm text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviewed</SelectItem>
              <SelectItem value="clients">Most Clients</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={availableOnly ? 'default' : 'outline'}
            size="sm"
            className="h-10"
            onClick={() => setAvailableOnly(!availableOnly)}
          >
            <CheckCircle className="mr-1.5 icon-sm" />Available
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {CATEGORIES.map(cat => {
              const cfg = CAT_CONFIG[cat];
              const CatIcon = cfg.icon;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1.5 text-xs data-[state=active]:bg-background">
                  <CatIcon className={cn('icon-sm', cfg.color)} />
                  {cfg.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-6 mt-4">
            {isLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-5 space-y-3">
                    <div className="flex gap-3"><Skeleton className="h-11 w-11 rounded-xl" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
                    <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
                  </CardContent></Card>
                ))}
              </div>
            )}

            {!isLoading && (
              <>
                {featured.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="icon-sm text-primary-accessible" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured Providers</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {featured.map(p => <ProviderCard key={p.id} provider={p} featured />)}
                    </div>
                  </div>
                )}

                {regular.length > 0 && (
                  <div className="space-y-3">
                    {featured.length > 0 && (
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Providers</h2>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {regular.map(p => <ProviderCard key={p.id} provider={p} />)}
                    </div>
                  </div>
                )}

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="h-12 w-12 mb-4 text-muted-foreground/30" />
                    <p className="font-medium">No services found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
