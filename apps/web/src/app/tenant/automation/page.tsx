'use client';

import { useState } from 'react';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Trash2,
  MoreVertical,
  Zap,
  Clock,
  CheckCircle,
  Mail,
  Bell,
  Users,
  GitMerge,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  isActive: boolean;
  runsCount: number;
  lastRun?: string;
  category: 'onboarding' | 'notification' | 'workflow' | 'reporting';
};

const CAT_CONFIG: Record<AutomationRule['category'], { label: string; color: string; icon: React.ElementType }> = {
  onboarding: { label: 'Onboarding', color: 'bg-blue-500/10 text-blue-600', icon: Users },
  notification: { label: 'Notification', color: 'bg-amber-500/10 text-amber-600', icon: Bell },
  workflow: { label: 'Workflow', color: 'bg-purple-500/10 text-purple-600', icon: GitMerge },
  reporting: { label: 'Reporting', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
};

const MOCK_AUTOMATIONS: AutomationRule[] = [
  { id: '1', name: 'Welcome New Members', trigger: 'user.joined', actions: ['Send welcome email', 'Add to onboarding cohort', 'Notify team lead'], isActive: true, runsCount: 234, lastRun: '10 minutes ago', category: 'onboarding' },
  { id: '2', name: 'Application Review Reminder', trigger: 'application.submitted + 48h', actions: ['Email reviewer', 'Create task in board'], isActive: true, runsCount: 67, lastRun: 'Yesterday', category: 'notification' },
  { id: '3', name: 'Weekly Progress Digest', trigger: 'schedule: every Monday 8am', actions: ['Generate cohort report', 'Email program managers'], isActive: true, runsCount: 18, lastRun: 'Monday', category: 'reporting' },
  { id: '4', name: 'Milestone Auto-Approval', trigger: 'milestone.submitted', actions: ['Assign to mentor for review', 'Send Slack notification'], isActive: false, runsCount: 12, lastRun: '1 week ago', category: 'workflow' },
];

function AutomationCard({ rule }: { rule: AutomationRule }) {
  const [active, setActive] = useState(rule.isActive);
  const cfg = CAT_CONFIG[rule.category];
  const CatIcon = cfg.icon;

  return (
    <Card className={cn('transition-all', !active && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CatIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{rule.name}</h3>
              <Badge variant="secondary" className={cn('text-xs', cfg.color)}>{cfg.label}</Badge>
            </div>
            <div className="mt-3 flex items-start gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-md bg-muted font-mono">{rule.trigger}</span>
                {rule.actions.map((action, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary">{action}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{rule.runsCount} runs</span>
              {rule.lastRun && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Last run {rule.lastRun}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={active} onCheckedChange={setActive} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Run Now</DropdownMenuItem>
                <DropdownMenuItem>View Logs</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantAutomationPage() {
  return (
    <AppShell>
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Workflow className="h-6 w-6 text-primary" />
              Automations
            </h1>
            <p className="text-muted-foreground">Automate repetitive tasks and workflows for your organization</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" />Create Automation</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Active Rules', value: MOCK_AUTOMATIONS.filter(a => a.isActive).length },
            { label: 'Total Runs (30d)', value: MOCK_AUTOMATIONS.reduce((s, a) => s + a.runsCount, 0) },
            { label: 'Time Saved', value: '~12h' },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="space-y-3">
          {MOCK_AUTOMATIONS.map(rule => <AutomationCard key={rule.id} rule={rule} />)}
        </div>
      </div>
    </AppShell>
  );
}
