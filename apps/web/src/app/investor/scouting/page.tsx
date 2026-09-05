'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  Compass,
  Search,
  Filter,
  Star,
  MoreVertical,
  TrendingUp,
  Users,
  MapPin,
  Eye,
  GanttChart,
  MessageCircle,
  LayoutGrid,
  List,
  ArrowUpDown,
  Zap,
  DollarSign,
  Globe,
  Rocket,
  GitCompare,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Startup = {
  id: string;
  name: string;
  logoUrl?: string;
  tagline: string;
  industry: string;
  stage: string;
  location: string;
  teamSize: number;
  readinessScore: number;
  matchScore: number;
  tags: string[];
  raisingAmount: string;
  businessModel: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace';
  isHot: boolean;
  isFeatured: boolean;
  revenue: string;
};

function StartupCard({ startup, compact = false }: { startup: Startup; compact?: boolean }) {
  const [inWatchlist, setInWatchlist] = useState(false);

  return (
    <Card className={cn('transition-all hover:shadow-md hover:border-primary/30', startup.isFeatured && 'border-primary/40 bg-primary/2')}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-11 w-11 rounded-xl shrink-0">
            <AvatarImage src={startup.logoUrl} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible font-bold text-sm">
              {startup.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/startups/${startup.id}`} className="font-semibold hover:text-primary-accessible transition-colors">
                    {startup.name}
                  </Link>
                  {startup.isHot && <Badge variant="destructive" className="text-2xs h-4 px-1.5">🔥 HOT</Badge>}
                  {startup.isFeatured && <Badge className="text-2xs h-4 px-1.5 bg-primary/20 text-primary-accessible border-primary/30">Featured</Badge>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{startup.tagline}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setInWatchlist(!inWatchlist)} title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}>
                  <Eye className={cn('icon-sm', inWatchlist ? 'text-primary-accessible fill-primary/20' : 'text-muted-foreground')} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="icon-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/startups/${startup.id}`}><Eye className="mr-2 icon-sm" />View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem><GanttChart className="mr-2 icon-sm" />Add to Pipeline</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setInWatchlist(!inWatchlist)}>
                      <Eye className="mr-2 icon-sm" />{inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><MessageCircle className="mr-2 icon-sm" />Request Intro</DropdownMenuItem>
                    <DropdownMenuItem><GitCompare className="mr-2 icon-sm" />Compare</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="outline" className="text-2xs h-4 px-1.5">{startup.stage}</Badge>
              <Badge variant="secondary" className="text-2xs h-4 px-1.5">{startup.businessModel}</Badge>
              {startup.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-2xs h-4 px-1.5">{tag}</Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="icon-sm" />{startup.location}</span>
              <span className="flex items-center gap-1"><Users className="icon-sm" />{startup.teamSize} founders</span>
              <span className="flex items-center gap-1 font-medium text-primary-accessible"><DollarSign className="icon-sm" />Raising {startup.raisingAmount}</span>
              {startup.revenue !== 'Pre-revenue' && (
                <span className="flex items-center gap-1 text-status-success"><TrendingUp className="icon-sm" />{startup.revenue}</span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Readiness</span>
                  <span className="font-medium">{startup.readinessScore}%</span>
                </div>
                <Progress value={startup.readinessScore} className="h-1.5" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Match Score</p>
                <p className={cn('text-sm font-bold', startup.matchScore >= 85 ? 'text-status-success' : startup.matchScore >= 70 ? 'text-primary-accessible' : 'text-muted-foreground')}>
                  {startup.matchScore}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
              <Button size="sm" variant="default" className="h-7 text-xs flex-1" asChild>
                <Link href={`/startups/${startup.id}`}><Eye className="mr-1 icon-sm" />View</Link>
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                <GanttChart className="mr-1 icon-sm" />Pipeline
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                <MessageCircle className="mr-1 icon-sm" />Intro
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ALL_STARTUPS: Startup[] = [
  { id: '1', name: 'NeuralFlow AI', tagline: 'AI-powered workflow automation for enterprises', industry: 'AI/ML', stage: 'Seed', location: 'San Francisco', teamSize: 3, readinessScore: 85, matchScore: 92, tags: ['SaaS', 'Automation'], raisingAmount: '$1.5M', businessModel: 'B2B', isHot: true, isFeatured: true, revenue: '$24K MRR' },
  { id: '2', name: 'GreenGrid Energy', tagline: 'Smart grid solutions for renewable energy', industry: 'CleanTech', stage: 'Pre-seed', location: 'Berlin', teamSize: 2, readinessScore: 72, matchScore: 78, tags: ['Energy', 'IoT'], raisingAmount: '$500K', businessModel: 'B2B', isHot: false, isFeatured: false, revenue: 'Pre-revenue' },
  { id: '3', name: 'PayStream', tagline: 'Next-gen payment infrastructure for SMBs', industry: 'FinTech', stage: 'Seed', location: 'London', teamSize: 4, readinessScore: 91, matchScore: 88, tags: ['Payments', 'API'], raisingAmount: '$2M', businessModel: 'B2B', isHot: true, isFeatured: true, revenue: '$58K MRR' },
  { id: '4', name: 'HealthPulse', tagline: 'Remote patient monitoring platform', industry: 'HealthTech', stage: 'Pre-seed', location: 'Boston', teamSize: 2, readinessScore: 65, matchScore: 71, tags: ['IoT', 'Clinical'], raisingAmount: '$750K', businessModel: 'B2B2C', isHot: false, isFeatured: false, revenue: 'Pre-revenue' },
  { id: '5', name: 'DataVault', tagline: 'Enterprise data security and compliance', industry: 'Cybersecurity', stage: 'Seed', location: 'New York', teamSize: 5, readinessScore: 78, matchScore: 85, tags: ['Security', 'Enterprise'], raisingAmount: '$3M', businessModel: 'B2B', isHot: false, isFeatured: false, revenue: '$12K MRR' },
  { id: '6', name: 'EduTrack', tagline: 'Adaptive learning for K-12 institutions', industry: 'EdTech', stage: 'Pre-seed', location: 'Toronto', teamSize: 3, readinessScore: 69, matchScore: 74, tags: ['Education', 'AI'], raisingAmount: '$600K', businessModel: 'B2B', isHot: false, isFeatured: false, revenue: 'Pre-revenue' },
  { id: '7', name: 'LogiChain', tagline: 'Supply chain visibility for e-commerce', industry: 'Logistics', stage: 'Series A', location: 'Singapore', teamSize: 8, readinessScore: 93, matchScore: 80, tags: ['Logistics', 'Analytics'], raisingAmount: '$5M', businessModel: 'B2B', isHot: true, isFeatured: false, revenue: '$210K MRR' },
];

export default function InvestorScoutingPage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [stage, setStage] = useState('all');
  const [model, setModel] = useState('all');
  const [sortBy, setSortBy] = useState('match');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const startups = showDemoData ? ALL_STARTUPS : [];
  const industries = useMemo(() => ['all', ...new Set(startups.map(s => s.industry))], [startups]);
  const stages = useMemo(() => ['all', ...new Set(startups.map(s => s.stage))], [startups]);

  const filtered = useMemo(() => {
    let list = startups.filter(s => {
      const q = search.toLowerCase();
      return (
        (!search || s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q) || s.industry.toLowerCase().includes(q)) &&
        (industry === 'all' || s.industry === industry) &&
        (stage === 'all' || s.stage === stage) &&
        (model === 'all' || s.businessModel === model)
      );
    });
    if (sortBy === 'match') list = [...list].sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'readiness') list = [...list].sort((a, b) => b.readinessScore - a.readinessScore);
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [startups, search, industry, stage, model, sortBy]);

  const featured = startups.filter(s => s.isFeatured);
  const activeFilters = [industry !== 'all' && industry, stage !== 'all' && stage, model !== 'all' && model].filter(Boolean) as string[];

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Compass className="icon-lg text-primary-accessible" />
              Scout Startups
            </h1>
            <p className="text-muted-foreground">Discover startups that match your investment thesis</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
              <List className="icon-sm" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="icon-sm" />
            </Button>
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <Card className="border-primary/20 bg-primary/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Zap className="icon-sm text-primary-accessible" />Featured Startups</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {featured.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-bold">{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.tagline}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-primary-accessible font-bold">{s.matchScore}% match</p>
                    <p className="text-xs text-muted-foreground">{s.raisingAmount}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
              <Input placeholder="Search by name, industry, or keyword..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                {industries.map(i => <SelectItem key={i} value={i}>{i === 'all' ? 'All Industries' : i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                {stages.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Stages' : s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Model" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {['B2B', 'B2C', 'B2B2C', 'Marketplace'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[130px]"><ArrowUpDown className="mr-1.5 icon-sm" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="readiness">Readiness</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {activeFilters.map(f => (
                <Badge key={f} variant="secondary" className="gap-1 text-xs">
                  {f}
                  <button onClick={() => { if (f === industry) setIndustry('all'); else if (f === stage) setStage('all'); else setModel('all'); }}>
                    <X className="icon-sm" />
                  </button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setIndustry('all'); setStage('all'); setModel('all'); setSearch(''); }}>Clear all</Button>
            </div>
          )}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> startup{filtered.length !== 1 ? 's' : ''} found
            {ALL_STARTUPS.filter(s => s.isHot).length > 0 && <span className="ml-2 text-status-warning">🔥 {ALL_STARTUPS.filter(s => s.isHot).length} trending</span>}
          </p>
          <Link href="/investor/pipeline" className="text-xs text-primary-accessible hover:underline flex items-center gap-1">
            <GanttChart className="icon-sm" />View Pipeline
          </Link>
        </div>

        {/* Results */}
        <div className={cn('gap-4', viewMode === 'grid' ? 'grid md:grid-cols-2' : 'space-y-3')}>
          {filtered.map(startup => (
            <StartupCard key={startup.id} startup={startup} compact={viewMode === 'grid'} />
          ))}
          {filtered.length === 0 && (
            <Card className="col-span-2">
              <CardContent className="py-12 text-center">
                <Compass className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-medium">No startups found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setIndustry('all'); setStage('all'); setModel('all'); setSearch(''); }}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
