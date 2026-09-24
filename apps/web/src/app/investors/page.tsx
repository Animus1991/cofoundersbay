'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, TrendingUp, Building2, MapPin, DollarSign, Briefcase,
  ChevronRight, CheckCircle2, Bookmark, MessageCircle, UserPlus,
  Zap, Globe, ArrowUpDown, Users, Eye, BadgeCheck, Telescope,
  BarChart3, SlidersHorizontal,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

// ── Types ─────────────────────────────────────────────────────────────────────

type Investor = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  investorType: string;
  firmName?: string;
  firmRole?: string;
  bio: string;
  industries: string[];
  stages: string[];
  checkSizeMin?: number;
  checkSizeMax?: number;
  geographies: string[];
  isVerified: boolean;
  isActivelyScouting: boolean;
  portfolioCount: number;
  viewCount: number;
  dealsThisYear: number;
  thesisSummary: string;
  notablePortfolio: string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
function formatCheckSize(min?: number, max?: number) {
  if (!min && !max) return 'Undisclosed';
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

const TYPE_LABEL: Record<string, string> = {
  angel_investor: 'Angel', vc: 'VC Fund', vc_scout: 'VC Scout',
  syndicate: 'Syndicate', cvc: 'CVC', family_office: 'Family Office',
};

const STAGE_TONE: Record<string, StatusTone> = {
  'pre-seed': 'accent',
  seed: 'info',
  'series-a': 'success',
  'series-b': 'warning',
  'series-c': 'danger',
  growth: 'warning',
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_INVESTORS: Investor[] = [
  {
    id: '1', userId: 'inv1', displayName: 'Sarah Chen', investorType: 'angel_investor',
    firmName: 'Chen Ventures', firmRole: 'Founding Partner',
    bio: 'Former Google PM & Product Lead. Investing in AI/ML, developer tools, and B2B SaaS. Hands-on operator angel — I roll up my sleeves with founders.',
    thesisSummary: 'AI-native tools that reduce human bottlenecks in enterprise workflows.',
    industries: ['AI/ML', 'Developer Tools', 'Enterprise SaaS'], stages: ['pre-seed', 'seed'],
    checkSizeMin: 25_000, checkSizeMax: 150_000, geographies: ['US', 'Europe'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 24, viewCount: 1842, dealsThisYear: 6,
    notablePortfolio: ['Linear', 'Loom', 'Notion'],
  },
  {
    id: '2', userId: 'inv2', displayName: 'Michael Torres', investorType: 'vc',
    firmName: 'Horizon Capital', firmRole: 'Principal',
    bio: 'Series A specialist at Horizon Capital. Background in product and growth. 8 years investing across SaaS, FinTech, and digital health.',
    thesisSummary: 'B2B SaaS companies with strong NRR and clear expansion revenue paths.',
    industries: ['B2B SaaS', 'FinTech', 'Digital Health'], stages: ['seed', 'series-a'],
    checkSizeMin: 500_000, checkSizeMax: 3_000_000, geographies: ['US', 'Canada'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 45, viewCount: 3210, dealsThisYear: 12,
    notablePortfolio: ['Stripe', 'Intercom', 'Figma'],
  },
  {
    id: '3', userId: 'inv3', displayName: 'Emma Williams', investorType: 'angel_investor',
    firmName: undefined, firmRole: 'Independent Angel',
    bio: 'Ex-Stripe (Head of Fintech Partnerships). Backing the next generation of fintech founders with hands-on GTM and BD support.',
    thesisSummary: 'FinTech infrastructure: payments, embedded finance, and financial access.',
    industries: ['FinTech', 'Payments', 'Embedded Finance'], stages: ['pre-seed', 'seed'],
    checkSizeMin: 10_000, checkSizeMax: 75_000, geographies: ['US', 'UK', 'Europe'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 18, viewCount: 967, dealsThisYear: 5,
    notablePortfolio: ['Plaid', 'Brex', 'Mercury'],
  },
  {
    id: '4', userId: 'inv4', displayName: 'Andreas Papadopoulos', investorType: 'vc',
    firmName: 'Athena Ventures', firmRole: 'Partner',
    bio: 'Co-founder of Athena Ventures, focused on Southern European tech ecosystem. Former founder (2 exits). Thesis: undervalued European deep tech.',
    thesisSummary: 'Deep tech, climate, and biotech with global market ambitions from Europe.',
    industries: ['Deep Tech', 'Climate', 'Biotech'], stages: ['seed', 'series-a'],
    checkSizeMin: 200_000, checkSizeMax: 1_500_000, geographies: ['Greece', 'SE Europe', 'EU'],
    isVerified: true, isActivelyScouting: false, portfolioCount: 31, viewCount: 2104, dealsThisYear: 8,
    notablePortfolio: ['Skroutz', 'Workable', 'Viva Wallet'],
  },
  {
    id: '5', userId: 'inv5', displayName: 'Priya Nair', investorType: 'vc_scout',
    firmName: 'Sequoia Capital', firmRole: 'Scout',
    bio: 'Sequoia Scout. Full-time operator at a Series B health-tech company. I surface exceptional early-stage founders for Sequoia\'s scout program.',
    thesisSummary: 'Consumer health, mental wellness, and longevity tech at pre-seed.',
    industries: ['Health Tech', 'Mental Health', 'Wellness'], stages: ['pre-seed', 'seed'],
    checkSizeMin: 100_000, checkSizeMax: 500_000, geographies: ['US', 'India'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 9, viewCount: 712, dealsThisYear: 3,
    notablePortfolio: ['Alto', 'Headway', 'Spring Health'],
  },
  {
    id: '6', userId: 'inv6', displayName: 'Klaus Weber', investorType: 'family_office',
    firmName: 'Weber Family Office', firmRole: 'Investment Director',
    bio: 'Managing the Weber Family Office direct investment portfolio. We co-invest alongside institutional VCs and focus on capital-efficient SaaS and marketplace businesses.',
    thesisSummary: 'Capital-efficient SaaS and marketplace businesses with €500K+ ARR.',
    industries: ['SaaS', 'Marketplaces', 'E-commerce'], stages: ['series-a', 'series-b'],
    checkSizeMin: 1_000_000, checkSizeMax: 5_000_000, geographies: ['DACH', 'EU'],
    isVerified: false, isActivelyScouting: false, portfolioCount: 14, viewCount: 455, dealsThisYear: 2,
    notablePortfolio: ['Personio', 'Scalable Capital'],
  },
];

// ── Investor Card ──────────────────────────────────────────────────────────────

function InvestorCard({ investor }: { investor: Investor }) {
  const [saved, setSaved] = useState(false);
  const initials = investor.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Card className="group transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-11 w-11 rounded-lg shrink-0">
            <AvatarImage src={investor.avatarUrl} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold truncate">{investor.displayName}</h3>
                  {investor.isVerified && <BadgeCheck className={cn('icon-sm shrink-0', STATUS.info.icon)} />}
                  {investor.isActivelyScouting && (
                    <Badge className={cn('text-2xs border', STATUS.success.chip)}>
                      <Zap className="h-2.5 w-2.5 mr-1" />Actively Scouting
                    </Badge>
                  )}
                </div>
                {investor.firmName && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="icon-sm" />
                    {investor.firmName}
                    {investor.firmRole && <span className="text-muted-foreground"> · {investor.firmRole}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-xs font-normal">
                  {TYPE_LABEL[investor.investorType] ?? investor.investorType}
                </Badge>
                <button aria-label={saved ? `Saved: ${investor.displayName}` : `Save ${investor.displayName}`} aria-pressed={saved} type="button" onClick={() => setSaved(!saved)} className="p-1 rounded hover:bg-muted transition-colors">
                  <Bookmark className={cn('icon-sm', saved ? 'fill-primary text-primary-accessible' : 'text-muted-foreground')} />
                </button>
              </div>
            </div>

            {/* Thesis */}
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{investor.thesisSummary}</p>

            {/* Stages */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {investor.stages.map(s => (
                <Badge key={s} variant="outline" className={cn('text-2xs border', STATUS[STAGE_TONE[s] ?? 'neutral'].chip)}>
                  {s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Badge>
              ))}
              <Badge variant="outline" className="text-2xs">
                <DollarSign className="h-2.5 w-2.5 mr-0.5" />{formatCheckSize(investor.checkSizeMin, investor.checkSizeMax)}
              </Badge>
              <Badge variant="outline" className="text-2xs">
                <Globe className="h-2.5 w-2.5 mr-0.5" />{investor.geographies.slice(0, 2).join(', ')}
              </Badge>
            </div>

            {/* Industries */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {investor.industries.map(ind => (
                <span key={ind} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{ind}</span>
              ))}
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase className="icon-sm" />{investor.portfolioCount} investments</span>
                <span className="flex items-center gap-1"><Eye className="icon-sm" />{investor.viewCount.toLocaleString('en-GB')} views</span>
                <span className="flex items-center gap-1"><BarChart3 className="icon-sm" />{investor.dealsThisYear} deals / yr</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                  <Link href={`/p/${investor.userId}`}>
                    <Eye className="icon-sm" />Profile
                  </Link>
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1">
                  <UserPlus className="icon-sm" />Request Intro
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InvestorsPage() {
  const [search, setSearch] = useState('');
  const [investorType, setInvestorType] = useState('all');
  const [stage, setStage] = useState('all');
  const [geo, setGeo] = useState('all');
  const [scoutingOnly, setScoutingOnly] = useState(false);
  const [sortBy, setSortBy] = useState('portfolio');

  const filtered = MOCK_INVESTORS
    .filter(inv => {
      const q = search.toLowerCase();
      const matchSearch = !search || inv.displayName.toLowerCase().includes(q) || (inv.firmName?.toLowerCase().includes(q) ?? false) || inv.industries.some(i => i.toLowerCase().includes(q));
      const matchType = investorType === 'all' || inv.investorType === investorType;
      const matchStage = stage === 'all' || inv.stages.includes(stage);
      const matchGeo = geo === 'all' || inv.geographies.some(g => g.toLowerCase().includes(geo.toLowerCase()));
      const matchScouting = !scoutingOnly || inv.isActivelyScouting;
      return matchSearch && matchType && matchStage && matchGeo && matchScouting;
    })
    .sort((a, b) => {
      if (sortBy === 'portfolio') return b.portfolioCount - a.portfolioCount;
      if (sortBy === 'views') return b.viewCount - a.viewCount;
      if (sortBy === 'deals') return b.dealsThisYear - a.dealsThisYear;
      return 0;
    });

  const activeCount = MOCK_INVESTORS.filter(i => i.isActivelyScouting).length;
  const totalPortfolio = MOCK_INVESTORS.reduce((s, i) => s + i.portfolioCount, 0);
  const uniqueIndustries = new Set(MOCK_INVESTORS.flatMap(i => i.industries)).size;

  return (
    <AppShell title="Investor Directory" description="Connect with investors actively seeking startups">
      <div className="space-y-6 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Investors', value: MOCK_INVESTORS.length.toString() },
            { icon: Zap, label: 'Actively Scouting', value: activeCount.toString() },
            { icon: Briefcase, label: 'Total Investments', value: `${totalPortfolio}+` },
            { icon: Telescope, label: 'Industries Covered', value: uniqueIndustries.toString() },
          ].map(s => (
            <Card key={s.label} className="shadow-sm border-border/50">
              <CardContent className="p-3 flex items-center gap-2">
                <s.icon className="h-4 w-4 text-primary-accessible shrink-0" />
                <div><p className="text-xs font-bold">{s.value}</p><p className="text-2xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
              <Input placeholder="Search by name, firm, or focus area..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={investorType} onValueChange={setInvestorType}>
              <SelectTrigger aria-label="Investor type" className="w-full sm:w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="angel_investor">Angel</SelectItem>
                <SelectItem value="vc">VC Fund</SelectItem>
                <SelectItem value="vc_scout">VC Scout</SelectItem>
                <SelectItem value="syndicate">Syndicate</SelectItem>
                <SelectItem value="family_office">Family Office</SelectItem>
                <SelectItem value="cvc">CVC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger aria-label="Stage" className="w-full sm:w-[150px]"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                <SelectItem value="seed">Seed</SelectItem>
                <SelectItem value="series-a">Series A</SelectItem>
                <SelectItem value="series-b">Series B</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger aria-label="Sort by" className="w-full sm:w-[150px]">
                <ArrowUpDown className="mr-2 icon-sm text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portfolio">Most Invested</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="deals">Most Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={scoutingOnly ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => setScoutingOnly(!scoutingOnly)}
            >
              <Zap className="mr-1.5 icon-sm" />Actively Scouting Only
            </Button>
            <p className="text-xs text-muted-foreground ml-auto">
              {filtered.length} of {MOCK_INVESTORS.length} investors
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filtered.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" aria-hidden="true" />
                <p className="font-medium">No investors match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">Try broadening your search criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
