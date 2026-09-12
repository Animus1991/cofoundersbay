'use client';

import { useState } from 'react';
import {
  Zap, Search, Plus, MoreVertical, Users, Percent,
  FlaskConical, CheckCircle2, XCircle, AlertTriangle,
  Edit, Trash2, Copy, RefreshCw, Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type FlagStatus = 'enabled' | 'disabled' | 'rollout' | 'experiment';
type FlagTarget = 'all' | 'beta' | 'admins' | 'specific_tenants' | 'percentage';

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  status: FlagStatus;
  target: FlagTarget;
  rolloutPct?: number;
  affectedUsers?: number;
  category: 'ui' | 'backend' | 'experiment' | 'infra' | 'billing';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

const STATUS_CONFIG: Record<FlagStatus, { label: string; color: string; icon: React.ElementType }> = {
  enabled:    { label: 'Enabled',    color: 'bg-status-success-bg text-status-success border-status-success-border',  icon: CheckCircle2 },
  disabled:   { label: 'Disabled',   color: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',     icon: XCircle },
  rollout:    { label: 'Rollout',    color: 'bg-status-info-bg text-status-info border-status-info-border',     icon: Percent },
  experiment: { label: 'Experiment', color: 'bg-status-accent-bg text-status-accent border-status-accent-border', icon: FlaskConical },
};

const CATEGORY_COLORS: Record<string, string> = {
  ui:         'bg-status-info-bg text-status-info',
  backend:    'bg-status-warning-bg text-status-warning',
  experiment: 'bg-status-accent-bg text-status-accent',
  infra:      'bg-status-danger-bg text-status-danger',
  billing:    'bg-status-success-bg text-status-success',
};

const MOCK_FLAGS: FeatureFlag[] = [
  {
    id: '1', key: 'ai_match_v2', name: 'AI Matching v2', description: 'New ML-based co-founder matching algorithm with compatibility scoring.',
    status: 'rollout', target: 'percentage', rolloutPct: 30, affectedUsers: 1420, category: 'backend',
    createdAt: 'Jan 5, 2025', updatedAt: 'Mar 15, 2025', createdBy: 'admin@cofounderbay.com',
  },
  {
    id: '2', key: 'investor_data_room', name: 'Investor Data Room', description: 'Secure document sharing room for investor due diligence.',
    status: 'experiment', target: 'beta', affectedUsers: 248, category: 'ui',
    createdAt: 'Feb 12, 2025', updatedAt: 'Mar 20, 2025', createdBy: 'admin@cofounderbay.com',
  },
  {
    id: '3', key: 'blockchain_validation', name: 'Blockchain Message Validation', description: 'On-chain validation of key conversation milestones.',
    status: 'experiment', target: 'beta', affectedUsers: 112, category: 'backend',
    createdAt: 'Feb 20, 2025', updatedAt: 'Mar 18, 2025', createdBy: 'ops@cofounderbay.com',
  },
  {
    id: '4', key: 'new_onboarding_flow', name: 'Redesigned Onboarding', description: 'Step-by-step onboarding with role-specific path selection.',
    status: 'enabled', target: 'all', affectedUsers: 4730, category: 'ui',
    createdAt: 'Jan 20, 2025', updatedAt: 'Feb 28, 2025', createdBy: 'admin@cofounderbay.com',
  },
  {
    id: '5', key: 'rate_limit_v2', name: 'Enhanced Rate Limiting', description: 'Per-tenant dynamic rate limits with burst allowance.',
    status: 'rollout', target: 'percentage', rolloutPct: 75, affectedUsers: 3550, category: 'infra',
    createdAt: 'Mar 1, 2025', updatedAt: 'Mar 22, 2025', createdBy: 'ops@cofounderbay.com',
  },
  {
    id: '6', key: 'billing_usage_alerts', name: 'Billing Usage Alerts', description: 'Email and in-app alerts when tenant approaches plan limits.',
    status: 'enabled', target: 'all', affectedUsers: 4730, category: 'billing',
    createdAt: 'Mar 10, 2025', updatedAt: 'Mar 10, 2025', createdBy: 'admin@cofounderbay.com',
  },
  {
    id: '7', key: 'legacy_search', name: 'Legacy Search Engine', description: 'Old keyword-based search before semantic search rollout.',
    status: 'disabled', target: 'all', affectedUsers: 0, category: 'backend',
    createdAt: 'Jun 1, 2024', updatedAt: 'Jan 15, 2025', createdBy: 'admin@cofounderbay.com',
  },
  {
    id: '8', key: 'mentor_video_rooms', name: 'Mentor Video Rooms', description: 'Native video call integration for mentorship sessions.',
    status: 'experiment', target: 'beta', affectedUsers: 87, category: 'ui',
    createdAt: 'Mar 18, 2025', updatedAt: 'Mar 20, 2025', createdBy: 'admin@cofounderbay.com',
  },
];

function FlagCard({ flag, onToggle }: { flag: FeatureFlag; onToggle: (id: string, enabled: boolean) => void }) {
  const statusCfg = STATUS_CONFIG[flag.status];
  const StatusIcon = statusCfg.icon;
  const isEnabled = flag.status !== 'disabled';

  return (
    <Card className={cn('transition-all', !isEnabled && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Switch
            checked={isEnabled}
            onCheckedChange={(v) => onToggle(flag.id, v)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{flag.name}</span>
              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{flag.key}</code>
              <Badge variant="outline" className={cn('text-xs', statusCfg.color)}>
                <StatusIcon className="mr-1 icon-sm" />
                {statusCfg.label}
              </Badge>
              <Badge className={cn('text-xs border-0', CATEGORY_COLORS[flag.category])}>
                {flag.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>

            {flag.status === 'rollout' && flag.rolloutPct !== undefined && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Rollout Progress</span>
                  <span>{flag.rolloutPct}%</span>
                </div>
                <Progress value={flag.rolloutPct} className="h-1.5" />
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {flag.affectedUsers?.toLocaleString('en-GB') ?? 0} affected
              </span>
              <span>Updated {flag.updatedAt}</span>
              <span>By {flag.createdBy}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Edit className="mr-2 icon-sm" />Edit Flag</DropdownMenuItem>
              <DropdownMenuItem><Percent className="mr-2 icon-sm" />Set Rollout %</DropdownMenuItem>
              <DropdownMenuItem><Copy className="mr-2 icon-sm" />Copy Key</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive-accessible"><Trash2 className="mr-2 icon-sm" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminFeatureFlagsPage() {
  const [search, setSearch] = useState('');
  const [flags, setFlags] = useState<FeatureFlag[]>(MOCK_FLAGS);
  const [activeTab, setActiveTab] = useState('all');

  const handleToggle = (id: string, enabled: boolean) => {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: enabled ? 'enabled' : 'disabled' } : f
      )
    );
  };

  const filtered = flags.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      activeTab === f.status ||
      activeTab === f.category;
    return matchesSearch && matchesTab;
  });

  const stats = {
    enabled:    flags.filter((f) => f.status === 'enabled').length,
    rollout:    flags.filter((f) => f.status === 'rollout').length,
    experiment: flags.filter((f) => f.status === 'experiment').length,
    disabled:   flags.filter((f) => f.status === 'disabled').length,
  };

  return (
    <AppShell
      title="Feature Flags"
      description="Control feature rollouts, experiments, and gradual deployments"
      actions={
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="icon-sm" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">Feature flags are scaffold-level. Backend persistence is not yet implemented.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="sm">
            <Plus className="mr-2 icon-sm" />
            New Flag
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Enabled', value: stats.enabled, icon: CheckCircle2, color: 'text-status-success' },
            { label: 'In Rollout', value: stats.rollout, icon: Percent, color: 'text-status-info' },
            { label: 'Experiments', value: stats.experiment, icon: FlaskConical, color: 'text-status-accent' },
            { label: 'Disabled', value: stats.disabled, icon: XCircle, color: 'text-muted-foreground' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary">
                  <Icon className={cn('icon-sm', color)} />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            placeholder="Search flags by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({flags.length})</TabsTrigger>
            <TabsTrigger value="enabled">Enabled</TabsTrigger>
            <TabsTrigger value="rollout">Rollout</TabsTrigger>
            <TabsTrigger value="experiment">Experiments</TabsTrigger>
            <TabsTrigger value="disabled">Disabled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">No flags found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((flag) => (
                <FlagCard key={flag.id} flag={flag} onToggle={handleToggle} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
