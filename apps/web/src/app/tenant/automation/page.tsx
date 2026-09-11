'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAutomationRules,
  setAutomationRuleStatus,
  triggerAutomationRule,
  deleteAutomationRule,
  getTenantAutomationConfig,
  upsertTenantAutomationConfig,
  type AutomationRuleItem,
  type TenantAutomationConfigItem,
} from '@/lib/api';
import { useTenant } from '@/components/providers/TenantContext';
import { useToast } from '@/components/ui/toast';
import { useConfirm, deleteConfirmCopy } from '@/components/ui/confirm-dialog';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Zap, Clock, Play, Pause, Trash2,
  CheckCircle2, XCircle, AlertTriangle,
  Settings, Bell, Users, GitMerge, CreditCard, RefreshCw,
} from 'lucide-react';
import { EmptyTenantAutomations } from '@/components/common/EmptyStates';
import { EmptyState } from '@/components/common/EmptyState';
import Link from 'next/link';

const TRIGGER_LABELS: Record<string, string> = {
  user_signup: 'User Signup',
  onboarding_incomplete: 'Onboarding Incomplete',
  profile_incomplete: 'Profile Incomplete',
  match_generated: 'Match Generated',
  match_not_viewed: 'Match Not Viewed',
  connection_request_sent: 'Connection Sent',
  connection_not_answered: 'Connection Unanswered',
  connection_accepted: 'Connection Accepted',
  mentor_request_submitted: 'Mentor Request',
  mentor_request_accepted: 'Mentor Accepted',
  mentor_session_idle: 'Mentor Session Idle',
  community_join: 'Community Join',
  community_inactive: 'Community Inactive',
  content_reported_threshold: 'Report Threshold',
  tenant_setup_incomplete: 'Tenant Setup Incomplete',
  subscription_trial_ending: 'Trial Ending',
  subscription_failed_payment: 'Failed Payment',
  subscription_canceled: 'Subscription Canceled',
  user_inactive: 'User Inactive',
  scheduled: 'Scheduled',
  manual: 'Manual',
};

const TRIGGER_CATEGORY: Record<string, { label: string; color: string }> = {
  user_signup: { label: 'Onboarding', color: 'bg-status-info-bg text-status-info' },
  onboarding_incomplete: { label: 'Onboarding', color: 'bg-status-info-bg text-status-info' },
  profile_incomplete: { label: 'Onboarding', color: 'bg-status-info-bg text-status-info' },
  connection_not_answered: { label: 'Matching', color: 'bg-status-accent-bg text-status-accent' },
  connection_accepted: { label: 'Matching', color: 'bg-status-accent-bg text-status-accent' },
  match_not_viewed: { label: 'Matching', color: 'bg-status-accent-bg text-status-accent' },
  match_generated: { label: 'Matching', color: 'bg-status-accent-bg text-status-accent' },
  mentor_request_submitted: { label: 'Mentorship', color: 'bg-status-success-bg text-status-success' },
  mentor_request_accepted: { label: 'Mentorship', color: 'bg-status-success-bg text-status-success' },
  mentor_session_idle: { label: 'Mentorship', color: 'bg-status-success-bg text-status-success' },
  community_join: { label: 'Community', color: 'bg-status-success-bg text-status-success' },
  community_inactive: { label: 'Community', color: 'bg-status-success-bg text-status-success' },
  subscription_trial_ending: { label: 'Billing', color: 'bg-status-warning-bg text-status-warning' },
  subscription_failed_payment: { label: 'Billing', color: 'bg-status-warning-bg text-status-warning' },
  subscription_canceled: { label: 'Billing', color: 'bg-status-warning-bg text-status-warning' },
  user_inactive: { label: 'Engagement', color: 'bg-status-danger-bg text-status-danger' },
  content_reported_threshold: { label: 'Moderation', color: 'bg-status-danger-bg text-status-danger' },
  tenant_setup_incomplete: { label: 'Tenant', color: 'bg-status-accent-bg text-status-accent' },
};

// ── Config toggle panel ──────────────────────────────────────────────────────

type ConfigKey = keyof Omit<TenantAutomationConfigItem, 'id' | 'tenantId' | 'maxEmailsPerUserPerDay' | 'maxNotificationsPerDay' | 'quietHoursStart' | 'quietHoursEnd' | 'timezone'>;

const CONFIG_TOGGLES: { key: ConfigKey; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'automationsEnabled', label: 'Automation Engine', description: 'Master switch — enable or disable all automations for this organization', icon: Zap },
  { key: 'onboardingAutomation', label: 'Onboarding', description: 'Welcome messages, profile nudges, and setup reminders', icon: Users },
  { key: 'matchingAutomation', label: 'Matching', description: 'Match notifications, connection follow-ups, and nudges', icon: GitMerge },
  { key: 'mentorshipAutomation', label: 'Mentorship', description: 'Mentor request notifications and idle session reminders', icon: Bell },
  { key: 'communityAutomation', label: 'Community', description: 'Group join welcomes and community activity notifications', icon: Users },
  { key: 'billingAutomation', label: 'Billing', description: 'Trial reminders, payment failure notices, renewal alerts', icon: CreditCard },
  { key: 'reEngagementAutomation', label: 'Re-engagement', description: 'Inactive user prompts (use cautiously to avoid spam)', icon: RefreshCw },
];

function ConfigPanel({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data: config, isLoading } = useQuery({
    queryKey: ['tenant-automation-config', tenantId],
    queryFn: () => getTenantAutomationConfig(tenantId),
    enabled: !!tenantId,
  });

  const update = useMutation({
    mutationFn: (data: Partial<TenantAutomationConfigItem>) => upsertTenantAutomationConfig(tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-automation-config', tenantId] });
      success('Automation settings saved');
    },
    onError: () => toastError('Failed to save settings'),
  });

  if (isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;

  const current = config ?? {
    automationsEnabled: true,
    onboardingAutomation: true,
    matchingAutomation: true,
    mentorshipAutomation: true,
    communityAutomation: true,
    billingAutomation: true,
    reEngagementAutomation: false,
  } as Partial<TenantAutomationConfigItem>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="icon-sm text-primary-accessible" />
          Automation Settings
        </CardTitle>
        <CardDescription className="text-xs">
          Control which automation categories are active for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {CONFIG_TOGGLES.map(({ key, label, description, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Icon className="icon-sm text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <Switch
              checked={!!(current as any)[key]}
              disabled={update.isPending || (key !== 'automationsEnabled' && !current.automationsEnabled)}
              onCheckedChange={(val) => update.mutate({ [key]: val })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Rule row ─────────────────────────────────────────────────────────────────

function RuleRow({ rule, tenantId, onRefresh }: { rule: AutomationRuleItem; tenantId: string; onRefresh: () => void }) {
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  const setStatus = useMutation({
    mutationFn: (status: 'active' | 'paused') => setAutomationRuleStatus(rule.id, status),
    onSuccess: (_, status) => { onRefresh(); success(status === 'active' ? 'Rule activated' : 'Rule paused'); },
    onError: () => toastError('Failed to update rule'),
  });

  const trigger = useMutation({
    mutationFn: () => triggerAutomationRule(rule.id),
    onSuccess: () => success('Rule triggered manually'),
    onError: () => toastError('Failed to trigger rule'),
  });

  const remove = useMutation({
    mutationFn: () => deleteAutomationRule(rule.id),
    onSuccess: () => { onRefresh(); success('Rule deleted'); },
    onError: () => toastError('Failed to delete rule'),
  });

  const cat = TRIGGER_CATEGORY[rule.triggerType];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{rule.name}</span>
            {rule.tenantId === null && (
              <Badge variant="outline" className="text-xs text-muted-foreground">Platform</Badge>
            )}
            <Badge variant="secondary" className={`text-xs ${cat?.color ?? 'bg-muted text-muted-foreground'}`}>
              {cat?.label ?? 'Other'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}
            </Badge>
            {rule.status === 'active'
              ? <Badge className="bg-status-success-bg text-status-success text-xs">Active</Badge>
              : rule.status === 'paused'
              ? <Badge className="bg-status-warning-bg text-status-warning text-xs">Paused</Badge>
              : <Badge variant="outline" className="text-xs">{rule.status}</Badge>}
          </div>
          {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Zap className="icon-sm" />{rule.executionCount} runs</span>
            {rule.failureCount > 0 && (
              <span className="flex items-center gap-1 text-status-warning"><AlertTriangle className="icon-sm" />{rule.failureCount} failures</span>
            )}
            {rule.lastRunAt && (
              <span className="flex items-center gap-1"><Clock className="icon-sm" />{new Date(rule.lastRunAt).toLocaleDateString()}</span>
            )}
            {rule.delaySeconds > 0 && <span>Delay: {rule.delaySeconds}s</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Run now" onClick={() => trigger.mutate()} disabled={trigger.isPending}>
            <Play className="icon-sm" />
          </Button>
          {rule.status === 'active' ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Pause" onClick={() => setStatus.mutate('paused')} disabled={setStatus.isPending}>
              <Pause className="icon-sm" />
            </Button>
          ) : rule.status !== 'archived' ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Activate" onClick={() => setStatus.mutate('active')} disabled={setStatus.isPending}>
              <Zap className="icon-sm text-status-success" />
            </Button>
          ) : null}
          {rule.tenantId !== null && (
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-destructive-accessible hover:text-destructive-accessible"
              onClick={async () => { if (await confirm(deleteConfirmCopy({ en: 'automation rule', el: 'κανόνα αυτοματισμού' }, rule.name))) remove.mutate(); }}
              disabled={remove.isPending}
            >
              <Trash2 className="icon-sm" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TenantAutomationPage() {
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? '';
  const [activeTab, setActiveTab] = useState<'rules' | 'settings'>('rules');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const { data: rulesData, isLoading, refetch } = useQuery({
    queryKey: ['tenant-automation-rules', tenantId, filter],
    queryFn: () => listAutomationRules({ status: filter === 'all' ? undefined : filter, limit: 100 }),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const rules = (rulesData?.rules ?? []).filter(r =>
    r.tenantId === null || r.tenantId === tenantId
  );
  const activeCount = rules.filter(r => r.status === 'active').length;
  const totalRuns = rules.reduce((s, r) => s + r.executionCount, 0);
  const failureRules = rules.filter(r => r.failureCount > 0).length;

  if (!tenantId) {
    return (
      <AppShell title="Automation">
        <EmptyState
          title="No organization selected"
          description="Automations run inside an organization — they react to events like a new member joining or an application being submitted. Pick or create an organization to set them up."
          illustration="rocket"
          askAiPrompt="I opened organization automations without an organization selected. Help me pick or create one and explain what automation rules I should turn on first."
          action={
            <>
              <Button asChild>
                <Link href="/tenant/dashboard">Choose an organization</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/org/dashboard">Browse organizations</Link>
              </Button>
            </>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Automation"
      description="Event-driven workflows: triggers fire when events happen, conditions filter, actions notify or update data."
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Rules', value: activeCount, color: 'text-status-success' },
            { label: 'Total Runs', value: totalRuns, color: 'text-status-info' },
            { label: 'Rules with Failures', value: failureRules, color: failureRules > 0 ? 'text-status-warning' : 'text-muted-foreground' },
          ].map(s => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50 gap-1">
          {(['rules', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab ? 'border-primary text-primary-accessible' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'rules' ? 'Rules' : 'Settings'}
            </button>
          ))}
        </div>

        {/* Rules tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-1">
              {(['all', 'active', 'paused'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            )}

            {!isLoading && rules.length === 0 && <EmptyTenantAutomations />}

            {rules.map(rule => (
              <RuleRow key={rule.id} rule={rule} tenantId={tenantId} onRefresh={refetch} />
            ))}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <ConfigPanel tenantId={tenantId} />
        )}
      </div>
    </AppShell>
  );
}
