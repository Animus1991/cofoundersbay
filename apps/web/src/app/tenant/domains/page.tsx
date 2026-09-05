'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTenantDomains,
  addTenantSubdomain,
  addTenantCustomDomain,
  verifyTenantDomain,
  setTenantPrimaryDomain,
  toggleTenantDomainActive,
  deleteTenantDomain,
  getDomainDnsInstructions,
  type TenantDomainItem,
  type DnsInstructions,
} from '@/lib/api';
import { useTenant } from '@/components/providers/TenantContext';
import { useToast } from '@/components/ui/toast';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Globe, Plus, Trash2, CheckCircle2, XCircle, Clock, RefreshCw,
  Star, Power, Copy, ChevronDown, ChevronRight, Link2, AlertTriangle,
  Shield, Info,
} from 'lucide-react';
import { EmptyTenantDomains } from '@/components/common/EmptyStates';

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: TenantDomainItem['verificationStatus']) {
  switch (status) {
    case 'verified': return <Badge className="bg-green-500/15 text-green-700 border-green-200 gap-1" size="sm"><CheckCircle2 className="icon-sm" />Verified</Badge>;
    case 'pending':  return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 gap-1" size="sm"><Clock className="icon-sm" />Pending</Badge>;
    case 'failed':   return <Badge className="bg-red-500/15 text-red-700 border-red-200 gap-1" size="sm"><XCircle className="icon-sm" />Failed</Badge>;
    case 'expired':  return <Badge className="bg-gray-500/15 text-gray-600 border-gray-200 gap-1" size="sm"><XCircle className="icon-sm" />Expired</Badge>;
  }
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy">
      {copied ? <CheckCircle2 className="icon-sm text-green-600" /> : <Copy className="icon-sm" />}
    </button>
  );
}

function DnsPanel({ instructions }: { instructions: DnsInstructions }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40 p-4 space-y-4 text-sm">
      <div className="flex items-start gap-2">
        <Info className="icon-sm text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground">DNS Configuration Required</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add these records to your DNS provider to verify ownership and route traffic to CoFounderBay.</p>
        </div>
      </div>

      {/* Step 1 — TXT verification */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Step 1 — TXT Verification Record</p>
        <div className="rounded-md border border-border/60 bg-background overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {['Type', 'Host / Name', 'Value', 'TTL'].map(h => (
                  <th key={h} className="px-3 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/40">
                <td className="px-3 py-2 font-mono">{instructions.verification.type}</td>
                <td className="px-3 py-2 font-mono break-all">
                  <div className="flex items-center gap-2">{instructions.verification.name}<CopyButton value={instructions.verification.name} /></div>
                </td>
                <td className="px-3 py-2 font-mono break-all max-w-[200px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{instructions.verification.value}</span>
                    <CopyButton value={instructions.verification.value ?? ''} />
                  </div>
                </td>
                <td className="px-3 py-2 font-mono">{instructions.verification.ttl}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 2 — CNAME */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Step 2 — CNAME Record</p>
        <div className="rounded-md border border-border/60 bg-background overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {['Type', 'Host / Name', 'Points to', 'TTL'].map(h => (
                  <th key={h} className="px-3 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/40">
                <td className="px-3 py-2 font-mono">{instructions.cname.type}</td>
                <td className="px-3 py-2 font-mono break-all">
                  <div className="flex items-center gap-2">{instructions.cname.name}<CopyButton value={instructions.cname.name} /></div>
                </td>
                <td className="px-3 py-2 font-mono">
                  <div className="flex items-center gap-2">{instructions.cname.value}<CopyButton value={instructions.cname.value} /></div>
                </td>
                <td className="px-3 py-2 font-mono">{instructions.verification.ttl}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside pl-0.5">
        {instructions.instructions.map((line, i) => <li key={i}>{line}</li>)}
      </ol>
    </div>
  );
}

// ── Domain row ────────────────────────────────────────────────────────────────

function DomainRow({
  domain,
  tenantId,
  onRefresh,
}: {
  domain: TenantDomainItem;
  tenantId: string;
  onRefresh: () => void;
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [showDns, setShowDns] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [loadingDns, setLoadingDns] = useState(false);

  const verify = useMutation({
    mutationFn: () => verifyTenantDomain(tenantId, domain.id),
    onSuccess: (res) => {
      onRefresh();
      if (res.verified) toastSuccess('Domain verified successfully');
      else toastError(res.message);
    },
    onError: (e: Error) => toastError(e.message),
  });

  const setPrimary = useMutation({
    mutationFn: () => setTenantPrimaryDomain(tenantId, domain.id),
    onSuccess: () => { onRefresh(); toastSuccess('Primary domain updated'); },
    onError: (e: Error) => toastError(e.message),
  });

  const toggle = useMutation({
    mutationFn: (active: boolean) => toggleTenantDomainActive(tenantId, domain.id, active),
    onSuccess: (_, active) => { onRefresh(); toastSuccess(active ? 'Domain activated' : 'Domain deactivated'); },
    onError: (e: Error) => toastError(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteTenantDomain(tenantId, domain.id),
    onSuccess: () => { onRefresh(); toastSuccess('Domain removed'); },
    onError: (e: Error) => toastError(e.message),
  });

  const handleShowDns = async () => {
    if (domain.domainType !== 'custom') return;
    if (dnsInstructions) { setShowDns(v => !v); return; }
    setLoadingDns(true);
    try {
      const result = await getDomainDnsInstructions(tenantId, domain.id);
      setDnsInstructions(result);
      setShowDns(true);
    } catch (e) {
      toastError((e as Error).message || 'Failed to load DNS instructions');
    } finally {
      setLoadingDns(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://${domain.domainName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-medium break-all hover:underline"
              >
                {domain.domainName}
              </a>
              {domain.isPrimary && (
                <Badge className="bg-primary/10 text-primary-accessible border-primary/20 text-xs">Primary</Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">{domain.domainType}</Badge>
              {statusBadge(domain.verificationStatus)}
              {domain.isActive
                ? <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Active</Badge>
                : <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
              {domain.sslStatus === 'active' && (
                <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-xs gap-1">
                  <Shield className="h-2.5 w-2.5" />SSL
                </Badge>
              )}
            </div>
            {domain.verifiedAt && (
              <p className="text-xs text-muted-foreground">
                Verified {new Date(domain.verifiedAt).toLocaleDateString()}
              </p>
            )}
            {domain.lastVerificationCheck && domain.verificationStatus === 'failed' && (
              <p className="text-xs text-red-500">
                Last check: {new Date(domain.lastVerificationCheck).toLocaleString()} — DNS record not found
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {domain.domainType === 'custom' && domain.verificationStatus !== 'verified' && (
            <>
              <Button
                size="sm" variant="outline"
                onClick={handleShowDns}
                disabled={loadingDns}
                className="gap-1 h-7 text-xs"
              >
                <Link2 className="h-3 w-3" />
                DNS Setup
                {showDns ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={() => verify.mutate()}
                disabled={verify.isPending}
                className="gap-1 h-7 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${verify.isPending ? 'animate-spin' : ''}`} />
                Verify
              </Button>
            </>
          )}
          {!domain.isPrimary && domain.isActive && (
            <Button
              size="sm" variant="ghost"
              onClick={() => setPrimary.mutate()}
              disabled={setPrimary.isPending}
              className="gap-1 h-7 text-xs"
            >
              <Star className="h-3 w-3" />Set Primary
            </Button>
          )}
          <Button
            size="sm" variant="ghost"
            onClick={() => toggle.mutate(!domain.isActive)}
            disabled={toggle.isPending || (domain.verificationStatus !== 'verified' && !domain.isActive)}
            className={`gap-1 h-7 text-xs ${domain.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
          >
            <Power className="h-3 w-3" />
            {domain.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm" variant="ghost"
            onClick={() => { if (confirm(`Remove ${domain.domainName}?`)) remove.mutate(); }}
            disabled={remove.isPending}
            className="gap-1 h-7 text-xs text-destructive-accessible hover:text-destructive-accessible"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showDns && dnsInstructions && <DnsPanel instructions={dnsInstructions} />}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TenantDomainsPage() {
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? '';
  const { success: toastSuccess, error: toastError } = useToast();
  const [subdomainInput, setSubdomainInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tenant', tenantId, 'domains'],
    queryFn: () => listTenantDomains(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });

  const addSub = useMutation({
    mutationFn: () => addTenantSubdomain(tenantId, subdomainInput.trim()),
    onSuccess: ({ domain }) => {
      setSubdomainInput('');
      refetch();
      toastSuccess(`Subdomain ${domain.domainName} created`);
    },
    onError: (e: Error) => toastError(e.message),
  });

  const addCustom = useMutation({
    mutationFn: () => addTenantCustomDomain(tenantId, customDomainInput.trim()),
    onSuccess: ({ domain }) => {
      setCustomDomainInput('');
      refetch();
      toastSuccess(`${domain.domainName} added — follow DNS instructions to verify`);
    },
    onError: (e: Error) => toastError(e.message),
  });

  const domains = data?.domains ?? [];
  const activeDomains = domains.filter(d => d.isActive);
  const primaryDomain = domains.find(d => d.isPrimary);

  if (!tenantId) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No organization context. Please select or join an organization first.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Domain Management"
      description="Add a subdomain or connect a custom domain. SSL is provisioned automatically once DNS verifies."
    >
      <div className="space-y-6">

        {/* Status overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/60">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">Total Domains</p>
              <p className="text-2xl font-bold mt-0.5">{domains.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-0.5 text-green-600">{activeDomains.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">Primary Domain</p>
              <p className="text-sm font-medium mt-0.5 truncate">
                {primaryDomain?.domainName ?? <span className="text-muted-foreground">—</span>}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Domain list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Domains</CardTitle>
            <CardDescription className="text-xs">
              Members can access your organization through any active domain. Set one as primary for a canonical URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : domains.length === 0 ? (
              <EmptyTenantDomains />
            ) : (
              <div className="space-y-2">
                {domains.map(d => (
                  <DomainRow key={d.id} domain={d} tenantId={tenantId} onRefresh={refetch} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add subdomain */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary-accessible" />
              Platform Subdomain
            </CardTitle>
            <CardDescription className="text-xs">
              Claim a subdomain on <code className="bg-muted px-1 rounded">cofounderbay.com</code>. Auto-verified, no DNS setup required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="yourorg"
                  value={subdomainInput}
                  onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="pr-44"
                  maxLength={63}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                  .cofounderbay.com
                </span>
              </div>
              <Button
                onClick={() => addSub.mutate()}
                disabled={addSub.isPending || subdomainInput.trim().length < 2}
                className="gap-1 shrink-0"
                size="sm"
              >
                <Plus className="icon-sm" />
                {addSub.isPending ? 'Adding…' : 'Add'}
              </Button>
            </div>
            {addSub.isError && (
              <p className="text-xs text-destructive-accessible flex items-center gap-1">
                <XCircle className="icon-sm" />{(addSub.error as Error).message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Subdomains are instantly active and covered by the platform SSL certificate.
            </p>
          </CardContent>
        </Card>

        {/* Add custom domain */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="icon-sm text-primary-accessible" />
              Custom Domain
            </CardTitle>
            <CardDescription className="text-xs">
              Use your own domain like <code className="bg-muted px-1 rounded">founders.youruni.edu</code>. Requires DNS verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="founders.yourorganization.org"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().trim())}
                className="flex-1"
              />
              <Button
                onClick={() => addCustom.mutate()}
                disabled={addCustom.isPending || !customDomainInput.trim().includes('.')}
                className="gap-1 shrink-0"
                size="sm"
              >
                <Plus className="icon-sm" />
                {addCustom.isPending ? 'Adding…' : 'Add'}
              </Button>
            </div>
            {addCustom.isError && (
              <p className="text-xs text-destructive-accessible flex items-center gap-1">
                <XCircle className="icon-sm" />{(addCustom.error as Error).message}
              </p>
            )}
            <div className="rounded-lg bg-muted/40 border border-border/40 p-3 space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">How it works:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-0.5">
                <li>Add your domain below — we generate DNS records for you</li>
                <li>Add those records in your DNS provider (Cloudflare, Route 53, etc.)</li>
                <li>Click &quot;Verify&quot; after DNS propagation (up to 48h)</li>
                <li>Once verified, activate and optionally set as primary</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
