'use client';

import { useState } from 'react';
import {
  Zap,
  Search,
  Plus,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'paused' | 'error';
  lastRun: string;
  runsToday: number;
};

function AutomationCard({ automation }: { automation: Automation }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    paused: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    error: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    paused: <Pause className="h-4 w-4 text-gray-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{automation.name}</span>
              <Badge variant="outline" className={cn('text-xs', statusColors[automation.status])}>
                {statusIcons[automation.status]}
                <span className="ml-1">{automation.status}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {automation.description}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs">
                <span className="text-muted-foreground">Trigger:</span>{' '}
                <span className="font-medium">{automation.trigger}</span>
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">Actions:</span>{' '}
                <span className="font-medium">{automation.actions.join(' → ')}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last run: {automation.lastRun}
              </span>
              <span>{automation.runsToday} runs today</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={automation.status === 'active'} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAutomationPage() {
  const [search, setSearch] = useState('');

  // Mock data
  const automations: Automation[] = [
    {
      id: '1',
      name: 'Welcome New Users',
      description: 'Send welcome email and create onboarding tasks for new users',
      trigger: 'User Registration',
      actions: ['Send Email', 'Create Tasks', 'Assign Mentor'],
      status: 'active',
      lastRun: '2 min ago',
      runsToday: 12,
    },
    {
      id: '2',
      name: 'Match Notification',
      description: 'Notify users when they receive a new match above 80%',
      trigger: 'New Match (>80%)',
      actions: ['Send Push', 'Send Email'],
      status: 'active',
      lastRun: '15 min ago',
      runsToday: 45,
    },
    {
      id: '3',
      name: 'Inactive User Reminder',
      description: 'Send reminder to users inactive for 7 days',
      trigger: 'User Inactive (7 days)',
      actions: ['Send Email'],
      status: 'active',
      lastRun: '1 hour ago',
      runsToday: 8,
    },
    {
      id: '4',
      name: 'Program Milestone Alert',
      description: 'Alert program managers when startups miss milestones',
      trigger: 'Milestone Overdue',
      actions: ['Send Email', 'Create Task'],
      status: 'paused',
      lastRun: '2 days ago',
      runsToday: 0,
    },
    {
      id: '5',
      name: 'Weekly Digest',
      description: 'Send weekly activity digest to all users',
      trigger: 'Schedule (Every Monday 9AM)',
      actions: ['Generate Report', 'Send Email'],
      status: 'active',
      lastRun: '3 days ago',
      runsToday: 0,
    },
    {
      id: '6',
      name: 'Failed Payment Alert',
      description: 'Alert admins when subscription payment fails',
      trigger: 'Payment Failed',
      actions: ['Send Email', 'Create Task', 'Slack Notify'],
      status: 'error',
      lastRun: '1 hour ago',
      runsToday: 2,
    },
  ];

  const filteredAutomations = automations.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === 'active').length,
    runsToday: automations.reduce((acc, a) => acc + a.runsToday, 0),
    errors: automations.filter((a) => a.status === 'error').length,
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Automation</h1>
            <p className="text-muted-foreground">
              Manage automated workflows and triggers
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Automations</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Runs Today</p>
              <p className="text-2xl font-bold">{stats.runsToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Automations List */}
        <div className="space-y-3">
          {filteredAutomations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} />
          ))}
          {filteredAutomations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No automations found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or create a new automation
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
