'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  Eye,
  Bell,
  BellOff,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Search,
  Filter,
  Trash2,
  MoreVertical,
  Users,
  MapPin,
  MessageCircle,
  GitCompare,
  Zap,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ── Mock data ─────────────────────────────────────────────────────────────────

type WatchedStartup = {
  id: string;
  name: string;
  logoUrl: string | null;
  tagline: string;
  industry: string;
  stage: string;
  location: string;
  teamSize: number;
  readinessScore: number;
  matchScore: number;
  raisingAmount: string;
  tags: string[];
  watchedSince: string;
  alertsEnabled: boolean;
  lastActivity: string;
  activityType: 'update' | 'fundraise' | 'milestone' | 'team';
  progressChange: number; // +/- % change
  notes: string;
};

type ActivityItem = {
  id: string;
  startupId: string;
  startupName: string;
  logoUrl: string | null;
  type: 'milestone' | 'fundraise' | 'team' | 'deck' | 'update';
  title: string;
  time: string;
};

const MOCK_WATCHED: WatchedStartup[] = [
  {
    id: '1',
    name: 'NeuralFlow AI',
    logoUrl: null,
    tagline: 'AI-powered workflow automation for enterprises',
    industry: 'AI/ML',
    stage: 'Seed',
    location: 'San Francisco',
    teamSize: 3,
    readinessScore: 85,
    matchScore: 92,
    raisingAmount: '$1.5M',
    tags: ['AI/ML', 'B2B', 'SaaS'],
    watchedSince: '3 weeks ago',
    alertsEnabled: true,
    lastActivity: '2 hours ago',
    activityType: 'milestone',
    progressChange: +8,
    notes: 'Strong team, unique positioning. Follow up after MVP demo.',
  },
  {
    id: '2',
    name: 'PayStream',
    logoUrl: null,
    tagline: 'Next-gen payment infrastructure for SMBs',
    industry: 'FinTech',
    stage: 'Seed',
    location: 'London',
    teamSize: 4,
    readinessScore: 91,
    matchScore: 88,
    raisingAmount: '$2M',
    tags: ['FinTech', 'Payments', 'B2B'],
    watchedSince: '2 weeks ago',
    alertsEnabled: true,
    lastActivity: '1 day ago',
    activityType: 'fundraise',
    progressChange: +5,
    notes: 'Already have LOIs from 2 angels. Valuation looks fair.',
  },
  {
    id: '3',
    name: 'GreenGrid Energy',
    logoUrl: null,
    tagline: 'Smart grid solutions for renewable energy',
    industry: 'CleanTech',
    stage: 'Pre-seed',
    location: 'Berlin',
    teamSize: 2,
    readinessScore: 72,
    matchScore: 78,
    raisingAmount: '$500K',
    tags: ['CleanTech', 'Energy', 'IoT'],
    watchedSince: '1 month ago',
    alertsEnabled: false,
    lastActivity: '3 days ago',
    activityType: 'update',
    progressChange: -2,
    notes: 'Tech is solid but market timing uncertain. Monitor for 3 more months.',
  },
  {
    id: '4',
    name: 'DataVault',
    logoUrl: null,
    tagline: 'Enterprise data security and compliance',
    industry: 'Cybersecurity',
    stage: 'Seed',
    location: 'New York',
    teamSize: 5,
    readinessScore: 78,
    matchScore: 85,
    raisingAmount: '$3M',
    tags: ['Security', 'Enterprise', 'SaaS'],
    watchedSince: '5 days ago',
    alertsEnabled: true,
    lastActivity: '5 hours ago',
    activityType: 'team',
    progressChange: +12,
    notes: 'New CTO hire is very strong. Re-evaluating conviction.',
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'a1', startupId: '1', startupName: 'NeuralFlow AI', logoUrl: null, type: 'milestone', title: 'Reached 100 beta users milestone', time: '2 hours ago' },
  { id: 'a2', startupId: '4', startupName: 'DataVault', logoUrl: null, type: 'team', title: 'Added ex-Palantir CTO to team', time: '5 hours ago' },
  { id: 'a3', startupId: '2', startupName: 'PayStream', logoUrl: null, type: 'fundraise', title: 'Updated raise target to $2M SAFE', time: '1 day ago' },
  { id: 'a4', startupId: '3', startupName: 'GreenGrid Energy', logoUrl: null, type: 'update', title: 'Published Q1 2025 progress update', time: '3 days ago' },
  { id: 'a5', startupId: '1', startupName: 'NeuralFlow AI', logoUrl: null, type: 'deck', title: 'Updated pitch deck (v4)', time: '4 days ago' },
];

const ACTIVITY_TYPE_CONFIG: Record<ActivityItem['type'], { label: string; color: string }> = {
  milestone: { label: 'Milestone', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  fundraise: { label: 'Fundraise', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  team: { label: 'Team', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  deck: { label: 'Deck', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  update: { label: 'Update', color: 'bg-gray-500/10 text-gray-600' },
};

function WatchlistCard({ startup }: { startup: WatchedStartup }) {
  const [alertsEnabled, setAlertsEnabled] = useState(startup.alertsEnabled);

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 rounded-lg shrink-0">
            <AvatarImage src={startup.logoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary-emphasis font-bold">
              {startup.name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/startups/${startup.id}`}
                  className="font-semibold hover:text-primary-emphasis transition-colors"
                >
                  {startup.name}
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-1">{startup.tagline}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button aria-label="Notifications"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  title={alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                >
                  {alertsEnabled ? (
                    <Bell className="h-3.5 w-3.5 text-primary-emphasis" aria-hidden="true" />
                  ) : (
                    <BellOff className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/startups/${startup.id}`}>
                        <Eye className="mr-2 icon-sm" aria-hidden="true" /> View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ArrowUpRight className="mr-2 icon-sm" aria-hidden="true" /> Add to Pipeline
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageCircle className="mr-2 icon-sm" aria-hidden="true" /> Request Intro
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <GitCompare className="mr-2 icon-sm" aria-hidden="true" /> Compare
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive-emphasis">
                      <Trash2 className="mr-2 icon-sm" aria-hidden="true" /> Remove from Watchlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-2xs">{startup.stage}</Badge>
              <span className="flex items-center gap-1"><Users className="icon-2xs" aria-hidden="true" />{startup.teamSize}</span>
              <span className="flex items-center gap-1"><MapPin className="icon-2xs" aria-hidden="true" />{startup.location}</span>
              <span className="flex items-center gap-1 text-primary-emphasis font-medium">{startup.raisingAmount}</span>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Readiness</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{startup.readinessScore}%</span>
                    {startup.progressChange !== 0 && (
                      <span className={cn(
                        'text-2xs flex items-center',
                        startup.progressChange > 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {startup.progressChange > 0 ? <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" /> : <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />}
                        {Math.abs(startup.progressChange)}%
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={startup.readinessScore} className="h-1.5" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Match</p>
                <p className="text-sm font-bold text-primary-emphasis">{startup.matchScore}%</p>
              </div>
            </div>

            {/* Notes */}
            {startup.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                📝 {startup.notes}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="icon-2xs" aria-hidden="true" /> {startup.lastActivity}
              </span>
              <span className="text-xs text-muted-foreground">Watching since {startup.watchedSince}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestorWatchlistPage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const watched = showDemoData ? MOCK_WATCHED : [];
  const activity = showDemoData ? MOCK_ACTIVITY : [];

  const filtered = watched.filter(
    s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.tagline.toLowerCase().includes(search.toLowerCase())
  );

  const alertCount = watched.filter(s => s.alertsEnabled).length;

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Eye className="icon-lg text-primary-emphasis" aria-hidden="true" />
              Watchlist
            </h1>
            <p className="text-muted-foreground">
              Track startups on your radar with alerts on key changes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Bell className="icon-2xs" aria-hidden="true" />
              {alertCount} alerts active
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/investor/scouting">
                <Search className="mr-1.5 icon-sm" aria-hidden="true" />
                Scout More
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Watching', value: watched.length, icon: Eye },
            { label: 'Alerts On', value: alertCount, icon: Bell },
            { label: 'New Activity', value: activity.length, icon: Zap },
            { label: 'Avg Match', value: watched.length ? `${Math.round(watched.reduce((s, w) => s + w.matchScore, 0) / watched.length)}%` : '—', icon: Star },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary-emphasis" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="watchlist">
          <TabsList>
            <TabsTrigger value="watchlist">My Watchlist ({watched.length})</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity ({activity.length})</TabsTrigger>
          </TabsList>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search watchlist..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-1.5 icon-sm" aria-hidden="true" />
                Filter
              </Button>
              {selectedIds.size > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/investor/scouting">
                    <GitCompare className="mr-1.5 icon-sm" aria-hidden="true" />
                    Compare ({selectedIds.size})
                  </Link>
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {filtered.map(startup => (
                <WatchlistCard key={startup.id} startup={startup} />
              ))}
              {filtered.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Eye className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
                    <h3 className="font-medium">No results</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {search ? 'No startups match your search' : 'Add startups from the scouting feed'}
                    </p>
                    <Button size="sm" className="mt-4" asChild>
                      <Link href="/investor/scouting">Scout Startups</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity" className="space-y-3">
            {activity.map(item => {
              const cfg = ACTIVITY_TYPE_CONFIG[item.type];
              return (
                <Card key={item.id} className="transition-all hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 rounded-lg shrink-0">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary-emphasis text-xs font-bold">
                          {item.startupName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{item.startupName}</p>
                          <Badge variant="secondary" className={cn('text-xs shrink-0', cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" asChild>
                        <Link href={`/startups/${item.startupId}`}>
                          <ArrowUpRight className="icon-sm" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
