'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Shield, Plus, Check, X, AlertTriangle,
  Key, Activity, ChevronRight, RefreshCw, Trash2,
  Lock, ShieldCheck, ShieldOff, Globe,
} from 'lucide-react';
import {
  listTenants,
  getSSOStats,
  getSSOAuthEvents,
  listSSOProviders,
  createSSOProvider,
  updateSSOProvider,
  deleteSSOProvider,
  getTenantSSOConfig,
  upsertTenantSSOConfig,
  listSSODomainMappings,
  createSSODomainMapping,
  deleteSSODomainMapping,
  verifySSODomainMapping,
  type TenantItem,
  type SSOMode,
  type SSOProviderType,
  type IdentityProviderItem,
  type TenantSSOConfig,
  type SSOAuthEvent,
  type SSODomainMapping,
} from '@/lib/api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

function SSOModeBadge({ mode }: { mode?: SSOMode | null }) {
  if (mode === 'required') return <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">SSO Required</Badge>;
  if (mode === 'optional') return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">SSO Optional</Badge>;
  return <Badge variant="secondary">SSO Disabled</Badge>;
}

export default function SSOAdminPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [eventsPage] = useState(0);

  const { data: tenants, isLoading: tenantsLoading, isError: tenantsError } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => listTenants({ limit: 100 }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'sso', 'stats'],
    queryFn: getSSOStats,
  });

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['admin', 'sso', 'events', eventsPage],
    queryFn: () => getSSOAuthEvents({ limit: 20, offset: eventsPage * 20 }),
  });

  return (
    <AppShell
      title="SSO Configuration"
      description="Configure Single Sign-On for organization tenants"
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-6">
        {[
          { label: 'Total Tenants', value: tenants?.length ?? 0, icon: Building2, color: 'text-primary-emphasis' },
          { label: 'Active Providers', value: statsLoading ? '…' : (stats?.activeProviders ?? 0), icon: Key, color: 'text-blue-500' },
          { label: 'Total Providers', value: statsLoading ? '…' : (stats?.totalProviders ?? 0), icon: Shield, color: 'text-violet-500' },
          { label: 'Events (24h)', value: statsLoading ? '…' : (stats?.recentEvents ?? 0), icon: Activity, color: 'text-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon className={`icon-md ${color}`} />
                <span className="text-xl font-bold">{value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenant list */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Tenants</CardTitle>
          <CardDescription>Click a tenant to configure its SSO settings</CardDescription>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />)}
            </div>
          ) : tenantsError ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="icon-xl mx-auto mb-2 text-destructive-emphasis" aria-hidden="true" />
              <p>Failed to load tenants</p>
            </div>
          ) : !tenants?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="icon-xl mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm">No tenants yet — create one in the Tenants admin page.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map(tenant => (
                <TenantSSORow
                  key={tenant.id}
                  tenant={tenant}
                  onClick={() => setSelectedTenantId(tenant.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSO Config Panel */}
      {selectedTenantId && (
        <SSOConfigPanel
          tenantId={selectedTenantId}
          tenantName={tenants?.find(t => t.id === selectedTenantId)?.displayName || tenants?.find(t => t.id === selectedTenantId)?.name || selectedTenantId}
          onClose={() => setSelectedTenantId(null)}
        />
      )}

      {/* Auth Events */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="icon-md" aria-hidden="true" />
              Recent SSO Auth Events
            </CardTitle>
            <CardDescription>Authentication activity across all tenants (last 20)</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetchEvents()} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />)}</div>
          ) : !events?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="icon-xl mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm">No SSO events yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {events.map(ev => <SSOEventRow key={ev.id} event={ev} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function TenantSSORow({ tenant, onClick }: { tenant: TenantItem; onClick: () => void }) {
  const { data: config } = useQuery({
    queryKey: ['admin', 'sso', 'config', tenant.id],
    queryFn: () => getTenantSSOConfig(tenant.id),
  });

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={40} height={40} />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="icon-md text-primary-emphasis" aria-hidden="true" />
          </div>
        )}
        <div>
          <h3 className="font-medium">{tenant.displayName || tenant.name}</h3>
          <p className="text-xs text-muted-foreground">{tenant.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SSOModeBadge mode={config?.ssoMode} />
        {config?.identityProvider && (
          <span className="text-xs text-muted-foreground">{config.identityProvider.providerName}</span>
        )}
        <ChevronRight className="icon-sm text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  );
}

function SSOEventRow({ event }: { event: SSOAuthEvent }) {
  const isSuccess = !event.errorCode;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 text-sm">
      {isSuccess
        ? <ShieldCheck className="icon-sm text-green-500 shrink-0" aria-hidden="true" />
        : <ShieldOff className="icon-sm text-destructive-emphasis shrink-0" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <span className="font-medium">{event.eventType}</span>
        {event.email && <span className="ml-2 text-muted-foreground">{event.email}</span>}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{event.identityProvider.tenant.name}</span>
      <span className="text-xs text-muted-foreground shrink-0">{new Date(event.createdAt).toLocaleString()}</span>
      {event.errorMessage && <span className="text-xs text-destructive-emphasis truncate max-w-[160px]">{event.errorMessage}</span>}
    </div>
  );
}

function SSOConfigPanel({
  tenantId, tenantName, onClose,
}: {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
}) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState('');

  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ['admin', 'sso', 'config', tenantId],
    queryFn: () => getTenantSSOConfig(tenantId),
  });

  const { data: providers, isLoading: providersLoading, refetch: refetchProviders } = useQuery({
    queryKey: ['admin', 'sso', 'providers', tenantId],
    queryFn: () => listSSOProviders(tenantId),
  });

  const [ssoMode, setSsoMode] = useState<SSOMode>('disabled');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [enforceEmailDomain, setEnforceEmailDomain] = useState(false);
  const [autoProvision, setAutoProvision] = useState(true);
  const [allowPasswordFallback, setAllowPasswordFallback] = useState(true);
  const [defaultRole, setDefaultRole] = useState('member');
  const [sessionDurationHours, setSessionDurationHours] = useState(24);
  const [roleMappingRules, setRoleMappingRules] = useState<{claim:string;value:string;role:string}[]>([]);
  const [activeTab, setActiveTab] = useState<'providers'|'policy'|'domains'>('providers');
  const [newDomain, setNewDomain] = useState('');
  const [newDomainAutoRedirect, setNewDomainAutoRedirect] = useState(false);

  const [showNewProvider, setShowNewProvider] = useState(false);
  const [providerType, setProviderType] = useState<SSOProviderType>('oidc');
  const [newProvider, setNewProvider] = useState({
    providerName: '',
    oidcIssuerUrl: '',
    oidcClientId: '',
    oidcClientSecret: '',
    oidcScopes: 'openid profile email',
    samlEntryPoint: '',
    samlIssuer: '',
    samlCert: '',
    samlMetadataUrl: '',
    loginButtonText: 'Continue with SSO',
  });

  // Sync form when existing config loads
  useEffect(() => {
    if (existingConfig) {
      setSsoMode(existingConfig.ssoMode);
      setSelectedProviderId(existingConfig.identityProviderId ?? '');
      setAllowedDomains(existingConfig.allowedDomains.join(', '));
      setEnforceEmailDomain(existingConfig.enforceEmailDomain);
      setAutoProvision(existingConfig.autoProvisionEnabled);
      setAllowPasswordFallback(existingConfig.allowPasswordFallback);
      setDefaultRole(existingConfig.defaultRole);
      setSessionDurationHours(existingConfig.sessionDurationHours);
    }
  }, [existingConfig]);

  const configMut = useMutation({
    mutationFn: () => upsertTenantSSOConfig(tenantId, {
      ssoMode,
      providerId: selectedProviderId || undefined,
      allowedDomains: allowedDomains.split(',').map(d => d.trim()).filter(Boolean),
      enforceEmailDomain,
      autoProvisionEnabled: autoProvision,
      allowPasswordFallback,
      defaultRole,
      sessionDurationHours,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'config', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'stats'] });
      setSaveError('');
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const createProviderMut = useMutation({
    mutationFn: () => createSSOProvider(tenantId, {
      providerType,
      providerName: newProvider.providerName,
      oidcIssuerUrl: newProvider.oidcIssuerUrl || undefined,
      oidcClientId: newProvider.oidcClientId || undefined,
      oidcClientSecret: newProvider.oidcClientSecret || undefined,
      oidcScopes: newProvider.oidcScopes || undefined,
      samlEntryPoint: newProvider.samlEntryPoint || undefined,
      samlIssuer: newProvider.samlIssuer || undefined,
      samlCert: newProvider.samlCert || undefined,
      samlMetadataUrl: newProvider.samlMetadataUrl || undefined,
      loginButtonText: newProvider.loginButtonText || undefined,
      isActive: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'providers', tenantId] });
      setShowNewProvider(false);
      setNewProvider({ providerName: '', oidcIssuerUrl: '', oidcClientId: '', oidcClientSecret: '', oidcScopes: 'openid profile email', samlEntryPoint: '', samlIssuer: '', samlCert: '', samlMetadataUrl: '', loginButtonText: 'Continue with SSO' });
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const deleteProviderMut = useMutation({
    mutationFn: (id: string) => deleteSSOProvider(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'providers', tenantId] }),
  });

  const { data: domainMappings, isLoading: domainsLoading } = useQuery({
    queryKey: ['admin', 'sso', 'domains', tenantId],
    queryFn: () => listSSODomainMappings(tenantId),
  });

  const addDomainMut = useMutation({
    mutationFn: () => createSSODomainMapping(tenantId, newDomain, newDomainAutoRedirect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'domains', tenantId] });
      setNewDomain('');
      setNewDomainAutoRedirect(false);
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const deleteDomainMut = useMutation({
    mutationFn: (id: string) => deleteSSODomainMapping(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'domains', tenantId] }),
  });

  const verifyDomainMut = useMutation({
    mutationFn: (id: string) => verifySSODomainMapping(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'domains', tenantId] }),
  });

  const toggleActive = (p: IdentityProviderItem) =>
    updateSSOProvider(p.id, { isActive: !p.isActive }).then(() =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'sso', 'providers', tenantId] })
    );

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        size="lg"
        // The panel's own Card provides the chrome and internal scrolling.
        showCloseButton={false}
        className="max-h-[90dvh] overflow-hidden border-0 bg-transparent p-0 shadow-none"
      >
      <Card className="max-h-[90dvh] w-full overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b sticky top-0 bg-card z-10">
          <div>
            <DialogTitle>SSO — {tenantName}</DialogTitle>
            <CardDescription>Configure providers and authentication policy</CardDescription>
          </div>
          <Button aria-label="Close SSO configuration" variant="ghost" size="icon" onClick={onClose}><X className="icon-sm" aria-hidden="true" /></Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {saveError && (
            <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive-emphasis flex items-center gap-2">
              <AlertTriangle className="icon-sm shrink-0" aria-hidden="true" />{saveError}
            </div>
          )}

          {/* Tab nav */}
          <div className="flex gap-1 border-b pb-2">
            {(['providers','policy','domains'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  activeTab === tab ? 'bg-primary/10 text-primary-emphasis font-medium' : 'text-muted-foreground hover:bg-muted/50'
                }`}>
                {tab === 'providers' ? 'Providers' : tab === 'policy' ? 'Policy' : 'Email Domains'}
              </button>
            ))}
          </div>

          {/* Identity Providers */}
          <div className={`space-y-3 ${activeTab !== 'providers' ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Identity Providers</label>
              <Button variant="outline" size="sm" onClick={() => setShowNewProvider(v => !v)} className="gap-2">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {showNewProvider ? 'Cancel' : 'Add Provider'}
              </Button>
            </div>

            {providersLoading ? (
              <div className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ) : !providers?.length && !showNewProvider ? (
              <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                No identity providers yet. Add one to enable SSO.
              </div>
            ) : (
              <div className="space-y-2">
                {providers?.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-medium">{p.providerName}</p>
                        <p className="text-xs text-muted-foreground uppercase">{p.providerType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleActive(p)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {p.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${p.providerName}`}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Delete "${p.providerName}"?`,
                            description: 'Members who sign in through this provider will lose access.',
                            confirmLabel: 'Delete provider',
                            intent: 'destructive',
                          });
                          if (ok) deleteProviderMut.mutate(p.id);
                        }}
                        className="focus-ring rounded text-xs text-destructive-emphasis hover:opacity-70"
                      >
                        <Trash2 className="icon-xs" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Provider Form */}
            {showNewProvider && (
              <div className="p-4 rounded-lg border space-y-4 bg-muted/20">
                <h4 className="text-sm font-semibold">New Identity Provider</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['oidc', 'saml', 'oauth2'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setProviderType(t)}
                      className={`p-2.5 rounded-lg border text-sm font-medium transition-colors ${providerType === t ? 'border-primary bg-primary/10 text-primary-emphasis' : 'border-border hover:bg-muted/50'}`}>
                      {t === 'oidc' ? 'OpenID Connect' : t === 'saml' ? 'SAML 2.0' : 'OAuth 2.0'}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Provider Name *</label>
                  <Input value={newProvider.providerName} onChange={e => setNewProvider(p => ({ ...p, providerName: e.target.value }))} placeholder="e.g., University SSO" />
                </div>
                {(providerType === 'oidc' || providerType === 'oauth2') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Issuer URL *</label>
                      <Input value={newProvider.oidcIssuerUrl} onChange={e => setNewProvider(p => ({ ...p, oidcIssuerUrl: e.target.value }))} placeholder="https://accounts.google.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Client ID *</label>
                        <Input value={newProvider.oidcClientId} onChange={e => setNewProvider(p => ({ ...p, oidcClientId: e.target.value }))} placeholder="client-id" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Client Secret</label>
                        <Input type="password" value={newProvider.oidcClientSecret} onChange={e => setNewProvider(p => ({ ...p, oidcClientSecret: e.target.value }))} placeholder="••••••••" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Scopes</label>
                      <Input value={newProvider.oidcScopes} onChange={e => setNewProvider(p => ({ ...p, oidcScopes: e.target.value }))} placeholder="openid profile email" />
                    </div>
                  </>
                )}
                {providerType === 'saml' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Metadata URL (optional)</label>
                      <Input value={newProvider.samlMetadataUrl} onChange={e => setNewProvider(p => ({ ...p, samlMetadataUrl: e.target.value }))} placeholder="https://idp.example.com/metadata.xml" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">SSO Entry Point</label>
                        <Input value={newProvider.samlEntryPoint} onChange={e => setNewProvider(p => ({ ...p, samlEntryPoint: e.target.value }))} placeholder="https://idp.example.com/sso" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Issuer / Entity ID</label>
                        <Input value={newProvider.samlIssuer} onChange={e => setNewProvider(p => ({ ...p, samlIssuer: e.target.value }))} placeholder="urn:example:idp" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Public Certificate (PEM)</label>
                      <textarea value={newProvider.samlCert} onChange={e => setNewProvider(p => ({ ...p, samlCert: e.target.value }))} placeholder="-----BEGIN CERTIFICATE-----\n..." className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Login Button Text</label>
                  <Input value={newProvider.loginButtonText} onChange={e => setNewProvider(p => ({ ...p, loginButtonText: e.target.value }))} placeholder="Continue with SSO" />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => createProviderMut.mutate()} disabled={createProviderMut.isPending || !newProvider.providerName} className="gap-2">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {createProviderMut.isPending ? 'Creating…' : 'Create Provider'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* SSO Policy */}
          <div className={`space-y-4 pt-2 ${activeTab !== 'policy' ? 'hidden' : ''}`}>
            <h4 className="text-sm font-semibold">Authentication Policy</h4>

            <div className="space-y-2">
              <label className="text-xs font-medium">SSO Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {([['disabled', 'Disabled', ShieldOff], ['optional', 'Optional', Shield], ['required', 'Required', Lock]] as const).map(([mode, label, Icon]) => (
                  <button key={mode} type="button" onClick={() => setSsoMode(mode)}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${ssoMode === mode ? 'border-primary bg-primary/10 text-primary-emphasis' : 'border-border hover:bg-muted/50'}`}>
                    <Icon className="icon-sm" />{label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {ssoMode === 'required' ? 'Password login is blocked; all users must authenticate via SSO.' :
                 ssoMode === 'optional' ? 'SSO is available but users can also use password login.' :
                 'SSO is not available for this tenant.'}
              </p>
            </div>

            {ssoMode !== 'disabled' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Identity Provider</label>
                  <select value={selectedProviderId} onChange={e => setSelectedProviderId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">— None selected —</option>
                    {providers?.map(p => <option key={p.id} value={p.id}>{p.providerName} ({p.providerType.toUpperCase()})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Allowed Email Domains</label>
                  <Input value={allowedDomains} onChange={e => setAllowedDomains(e.target.value)} placeholder="uoa.gr, di.uoa.gr (comma-separated)" />
                  <p className="text-xs text-muted-foreground">Leave empty to allow all domains</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Default Role for new users</label>
                    <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {['founder', 'investor', 'mentor', 'member'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Session Duration (hours)</label>
                    <Input type="number" min={1} max={720} value={sessionDurationHours} onChange={e => setSessionDurationHours(Number(e.target.value))} />
                  </div>
                </div>

                {[
                  { key: 'enforceEmailDomain', label: 'Enforce email domain', desc: 'Reject SSO logins from domains not in the allowed list', value: enforceEmailDomain, set: setEnforceEmailDomain },
                  { key: 'autoProvision', label: 'Auto-provision users (JIT)', desc: 'Create accounts automatically on first SSO login', value: autoProvision, set: setAutoProvision },
                  { key: 'allowPasswordFallback', label: 'Allow password fallback', desc: 'Users may also log in with email + password', value: allowPasswordFallback, set: setAllowPasswordFallback },
                ].map(({ key, label, desc, value, set }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <button type="button" onClick={() => set(!value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`absolute top-0.5 icon-md rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Domain Mappings */}
          {activeTab === 'domains' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Email Domain Mappings</h4>
              <p className="text-xs text-muted-foreground">Users entering emails at these domains will be offered this tenant&apos;s SSO on the login page.</p>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm shrink-0">@</span>
                <input
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value.replace('@',''))}
                  placeholder="uoa.gr"
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 cursor-pointer">
                  <input type="checkbox" checked={newDomainAutoRedirect} onChange={e => setNewDomainAutoRedirect(e.target.checked)} className="rounded" />
                  Auto-redirect
                </label>
                <Button size="sm" onClick={() => addDomainMut.mutate()} disabled={!newDomain.trim() || addDomainMut.isPending} className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />Add
                </Button>
              </div>

              {domainsLoading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />)}</div>
              ) : !domainMappings?.length ? (
                <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                  <Globe className="icon-lg mx-auto mb-1" aria-hidden="true" />
                  No email domains mapped for this tenant
                </div>
              ) : (
                <div className="space-y-2">
                  {domainMappings.map((m: SSODomainMapping) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm font-medium">@{m.domain}</span>
                        {m.isVerified
                          ? <span className="text-xs text-green-600 dark:text-green-400">✓ Verified</span>
                          : <button onClick={() => verifyDomainMut.mutate(m.id)} className="text-xs text-primary-emphasis hover:underline">Mark verified</button>}
                        {m.autoRedirectToSSO && <span className="text-xs text-muted-foreground">auto-redirect</span>}
                      </div>
                      <button onClick={() => deleteDomainMut.mutate(m.id)} className="text-muted-foreground hover:text-destructive-emphasis">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="text-sm font-semibold pt-2">Role Mapping Rules</h4>
              <p className="text-xs text-muted-foreground">Map IdP claim values to platform roles on first SSO login.</p>
              <div className="space-y-2">
                {roleMappingRules.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                    <input value={r.claim} onChange={e => setRoleMappingRules(rules => rules.map((x,idx) => idx===i ? {...x,claim:e.target.value} : x))}
                      placeholder="Claim" className="h-8 rounded-md border border-input bg-background px-2 text-xs" />
                    <input value={r.value} onChange={e => setRoleMappingRules(rules => rules.map((x,idx) => idx===i ? {...x,value:e.target.value} : x))}
                      placeholder="Value" className="h-8 rounded-md border border-input bg-background px-2 text-xs" />
                    <select value={r.role} onChange={e => setRoleMappingRules(rules => rules.map((x,idx) => idx===i ? {...x,role:e.target.value} : x))}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                      {['founder','investor','mentor','member','admin'].map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <button onClick={() => setRoleMappingRules(rules => rules.filter((_,idx) => idx !== i))} className="text-muted-foreground hover:text-destructive-emphasis">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setRoleMappingRules(r => [...r, {claim:'',value:'',role:'member'}])}
                  className="text-xs text-primary-emphasis hover:underline flex items-center gap-1">
                  <Plus className="icon-sm" aria-hidden="true" />Add rule
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => configMut.mutate()} loading={configMut.isPending} loadingText="Saving SSO configuration" className="gap-2">
              <Check className="icon-sm" aria-hidden="true" />
              Save SSO Config
            </Button>
          </div>
        </CardContent>
      </Card>
      </DialogContent>
    </Dialog>
  );
}
