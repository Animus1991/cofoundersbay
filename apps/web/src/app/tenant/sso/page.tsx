'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock, Shield, Plus, Trash2, CheckCircle, AlertCircle,
  Copy, Key, Globe, ShieldOff, X, Check,
  AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/components/providers/TenantContext';
import {
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
  type SSOMode,
  type SSOProviderType,
  type IdentityProviderItem,
  type SSODomainMapping,
} from '@/lib/api';

type RoleMappingRule = { claim: string; value: string; role: string };

function SSOModeBadge({ mode }: { mode?: SSOMode | null }) {
  if (mode === 'required') return <Badge className="bg-status-success-bg text-status-success border-status-success-border">Required</Badge>;
  if (mode === 'optional') return <Badge className="bg-status-info-bg text-status-info border-status-info-border">Optional</Badge>;
  return <Badge variant="secondary">Disabled</Badge>;
}

function ProviderCard({
  provider,
  onToggle,
  onDelete,
  callbackBase,
}: {
  provider: IdentityProviderItem;
  onToggle: (p: IdentityProviderItem) => void;
  onDelete: (id: string) => void;
  callbackBase: string;
}) {
  const [copied, setCopied] = useState(false);
  const callbackUrl = `${callbackBase}/api/sso/callback/${provider.id}`;

  const copy = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isConfigured = provider.providerType === 'saml'
    ? !!(provider.samlEntryPoint || provider.samlMetadataUrl)
    : !!(provider.oidcIssuerUrl && provider.oidcClientId);

  return (
    <Card className={provider.isActive ? undefined : 'opacity-60'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Key className="icon-sm text-muted-foreground shrink-0" />
              <h3 className="font-semibold">{provider.providerName}</h3>
              <Badge variant="secondary" size="sm" className="uppercase">{provider.providerType}</Badge>
              {isConfigured ? (
                <Badge variant="outline" size="sm" className="bg-status-success-bg text-status-success border-status-success-border">
                  <CheckCircle className="mr-1 icon-sm" />Configured
                </Badge>
              ) : (
                <Badge variant="outline" size="sm" className="bg-status-warning-bg text-status-warning border-status-warning-border">
                  <AlertCircle className="mr-1 icon-sm" />Needs configuration
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Callback URL:</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-xs">{callbackUrl}</code>
              <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                {copied ? <Check className="icon-sm text-status-success" /> : <Copy className="icon-sm" />}
              </button>
            </div>
            {provider.oidcIssuerUrl && (
              <p className="text-xs text-muted-foreground mt-1">Issuer: {provider.oidcIssuerUrl}</p>
            )}
            {provider.samlEntryPoint && (
              <p className="text-xs text-muted-foreground mt-1">Entry point: {provider.samlEntryPoint}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch checked={provider.isActive} onCheckedChange={() => onToggle(provider)} />
            <button
              onClick={() => { if (confirm(`Delete "${provider.providerName}"?`)) onDelete(provider.id); }}
              className="text-muted-foreground hover:text-destructive-accessible transition-colors"
            >
              <Trash2 className="icon-sm" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DomainRow({
  mapping,
  onDelete,
  onVerify,
}: {
  mapping: SSODomainMapping;
  onDelete: (id: string) => void;
  onVerify: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <Globe className="icon-sm text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">@{mapping.domain}</p>
          <p className="text-xs text-muted-foreground">
            {mapping.autoRedirectToSSO ? 'Auto-redirect to SSO' : 'SSO suggested on match'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {mapping.isVerified ? (
          <Badge variant="outline" className="text-xs bg-status-success-bg text-status-success border-status-success-border">
            <CheckCircle className="mr-1 icon-sm" />Verified
          </Badge>
        ) : (
          <button onClick={() => onVerify(mapping.id)} className="text-xs text-primary-accessible hover:underline">
            Mark Verified
          </button>
        )}
        <button onClick={() => onDelete(mapping.id)} className="text-muted-foreground hover:text-destructive-accessible transition-colors ml-1">
          <X className="icon-sm" />
        </button>
      </div>
    </div>
  );
}

function RoleMappingEditor({
  rules,
  onChange,
}: {
  rules: RoleMappingRule[];
  onChange: (rules: RoleMappingRule[]) => void;
}) {
  const add = () => onChange([...rules, { claim: '', value: '', role: 'member' }]);
  const remove = (i: number) => onChange(rules.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof RoleMappingRule, val: string) =>
    onChange(rules.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Role Mapping Rules</label>
        <button type="button" onClick={add} className="text-xs text-primary-accessible hover:underline flex items-center gap-1">
          <Plus className="icon-sm" />Add rule
        </button>
      </div>
      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No rules — all SSO users get the default role</p>
      ) : (
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <Input value={r.claim} onChange={e => update(i, 'claim', e.target.value)} placeholder="Claim (e.g. groups)" className="text-xs h-8" />
              <Input value={r.value} onChange={e => update(i, 'value', e.target.value)} placeholder="Value (e.g. admins)" className="text-xs h-8" />
              <select value={r.role} onChange={e => update(i, 'role', e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs">
                {['founder', 'investor', 'mentor', 'member', 'admin'].map(role =>
                  <option key={role} value={role}>{role}</option>
                )}
              </select>
              <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive-accessible">
                <X className="icon-sm" />
              </button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">If a claim matches its value, assign that role to the user.</p>
        </div>
      )}
    </div>
  );
}

export default function TenantSSOPage() {
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? '';
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState(false);
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainAutoRedirect, setNewDomainAutoRedirect] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [providerType, setProviderType] = useState<SSOProviderType>('oidc');
  const [newProvider, setNewProvider] = useState({
    providerName: '', oidcIssuerUrl: '', oidcClientId: '',
    oidcClientSecret: '', oidcScopes: 'openid profile email',
    samlEntryPoint: '', samlIssuer: '', samlCert: '', samlMetadataUrl: '',
    loginButtonText: 'Continue with SSO',
  });

  const [ssoMode, setSsoMode] = useState<SSOMode>('disabled');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [enforceEmailDomain, setEnforceEmailDomain] = useState(false);
  const [autoProvision, setAutoProvision] = useState(true);
  const [allowPasswordFallback, setAllowPasswordFallback] = useState(true);
  const [defaultRole, setDefaultRole] = useState('member');
  const [sessionDuration, setSessionDuration] = useState(24);
  const [postLoginRedirect, setPostLoginRedirect] = useState('');
  const [roleMappingRules, setRoleMappingRules] = useState<RoleMappingRule[]>([]);

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['tenant', 'sso', 'providers', tenantId],
    queryFn: () => listSSOProviders(tenantId),
    enabled: !!tenantId,
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['tenant', 'sso', 'config', tenantId],
    queryFn: () => getTenantSSOConfig(tenantId),
    enabled: !!tenantId,
  });

  const { data: domainMappings, isLoading: domainsLoading } = useQuery({
    queryKey: ['tenant', 'sso', 'domains', tenantId],
    queryFn: () => listSSODomainMappings(tenantId),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (config) {
      setSsoMode(config.ssoMode);
      setSelectedProviderId(config.identityProviderId ?? '');
      setAllowedDomains(config.allowedDomains.join(', '));
      setEnforceEmailDomain(config.enforceEmailDomain);
      setAutoProvision(config.autoProvisionEnabled);
      setAllowPasswordFallback(config.allowPasswordFallback);
      setDefaultRole(config.defaultRole);
      setSessionDuration(config.sessionDurationHours);
      setRoleMappingRules((config as any).roleMappingRules ?? []);
    }
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () => upsertTenantSSOConfig(tenantId, {
      ssoMode,
      providerId: selectedProviderId || undefined,
      allowedDomains: allowedDomains.split(',').map(d => d.trim()).filter(Boolean),
      enforceEmailDomain,
      autoProvisionEnabled: autoProvision,
      allowPasswordFallback,
      defaultRole,
      sessionDurationHours: sessionDuration,
      postLoginRedirect: postLoginRedirect || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'config', tenantId] });
      setSaveError('');
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const createProviderMut = useMutation({
    mutationFn: () => createSSOProvider(tenantId, {
      providerType, providerName: newProvider.providerName,
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
      queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'providers', tenantId] });
      setShowNewProvider(false);
      setNewProvider({ providerName: '', oidcIssuerUrl: '', oidcClientId: '', oidcClientSecret: '', oidcScopes: 'openid profile email', samlEntryPoint: '', samlIssuer: '', samlCert: '', samlMetadataUrl: '', loginButtonText: 'Continue with SSO' });
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const toggleProviderMut = useMutation({
    mutationFn: (p: IdentityProviderItem) => updateSSOProvider(p.id, { isActive: !p.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'providers', tenantId] }),
  });

  const deleteProviderMut = useMutation({
    mutationFn: (id: string) => deleteSSOProvider(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'providers', tenantId] }),
  });

  const addDomainMut = useMutation({
    mutationFn: () => createSSODomainMapping(tenantId, newDomain, newDomainAutoRedirect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'domains', tenantId] });
      setNewDomain('');
      setNewDomainAutoRedirect(false);
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const deleteDomainMut = useMutation({
    mutationFn: (id: string) => deleteSSODomainMapping(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'domains', tenantId] }),
  });

  const verifyDomainMut = useMutation({
    mutationFn: (id: string) => verifySSODomainMapping(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'sso', 'domains', tenantId] }),
  });

  if (!tenantId) {
    return (
      <AppShell>
        <div className="py-12 text-center text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3" />
          <p>No organization context. Please access this page via your organization.</p>
        </div>
      </AppShell>
    );
  }

  const apiBase = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : '';
  const activeProviderCount = providers?.filter(p => p.isActive).length ?? 0;

  return (
    <AppShell
      title="SSO / Authentication"
      description="Configure SAML, OIDC, or Google Workspace SSO for your members. Optional rules map IdP claims to roles."
      actions={<SSOModeBadge mode={config?.ssoMode} />}
    >
      <div className="space-y-6">

        {/* Status Banner */}
        {ssoMode !== 'disabled' && activeProviderCount > 0 ? (
          <Card className="border-status-success-border bg-status-success-bg">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="icon-md text-status-success shrink-0" />
              <div>
                <p className="text-sm font-medium">SSO is active</p>
                <p className="text-xs text-muted-foreground">
                  {activeProviderCount} provider{activeProviderCount !== 1 ? 's' : ''} active ·{' '}
                  {ssoMode === 'required' ? 'Password login disabled' : 'Password login still allowed'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-status-warning-border bg-status-warning-bg">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="icon-md text-status-warning shrink-0" />
              <div>
                <p className="text-sm font-medium">SSO not configured</p>
                <p className="text-xs text-muted-foreground">Add an identity provider and set SSO mode to enable org sign-on.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {saveError && (
          <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive-accessible flex items-center gap-2">
            <AlertTriangle className="icon-sm shrink-0" />{saveError}
          </div>
        )}

        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">Identity Providers</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
            <TabsTrigger value="domains">Email Domains</TabsTrigger>
          </TabsList>

          {/* ── Providers Tab ─── */}
          <TabsContent value="providers" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{providers?.length ?? 0} provider{(providers?.length ?? 0) !== 1 ? 's' : ''} configured</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewProvider(v => !v)} className="gap-2">
                <Plus className="icon-sm" />
                {showNewProvider ? 'Cancel' : 'Add Provider'}
              </Button>
            </div>

            {showNewProvider && (
              <Card className="border-primary/30 bg-muted/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">New Identity Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['oidc', 'saml', 'oauth2'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setProviderType(t)}
                        className={`p-2.5 rounded-lg border text-sm font-medium transition-colors ${providerType === t ? 'border-primary bg-primary/10 text-primary-accessible' : 'border-border hover:bg-muted/50'}`}>
                        {t === 'oidc' ? 'OpenID Connect' : t === 'saml' ? 'SAML 2.0' : 'OAuth 2.0'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Provider Name *</label>
                    <Input value={newProvider.providerName} onChange={e => setNewProvider(p => ({ ...p, providerName: e.target.value }))} placeholder="e.g. University SSO, Okta, Azure AD" />
                  </div>

                  {(providerType === 'oidc' || providerType === 'oauth2') && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Issuer / Discovery URL *</label>
                        <Input value={newProvider.oidcIssuerUrl} onChange={e => setNewProvider(p => ({ ...p, oidcIssuerUrl: e.target.value }))} placeholder="https://accounts.google.com" />
                        <p className="text-xs text-muted-foreground">OIDC discovery will be attempted at this URL + /.well-known/openid-configuration</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Client ID *</label>
                          <Input value={newProvider.oidcClientId} onChange={e => setNewProvider(p => ({ ...p, oidcClientId: e.target.value }))} placeholder="client-id" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Client Secret</label>
                          <Input type="password" value={newProvider.oidcClientSecret} onChange={e => setNewProvider(p => ({ ...p, oidcClientSecret: e.target.value }))} placeholder="••••••••" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Scopes</label>
                        <Input value={newProvider.oidcScopes} onChange={e => setNewProvider(p => ({ ...p, oidcScopes: e.target.value }))} placeholder="openid profile email" />
                      </div>
                    </>
                  )}

                  {providerType === 'saml' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Metadata URL <span className="text-muted-foreground">(recommended)</span></label>
                        <Input value={newProvider.samlMetadataUrl} onChange={e => setNewProvider(p => ({ ...p, samlMetadataUrl: e.target.value }))} placeholder="https://idp.example.com/metadata.xml" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">SSO Entry Point</label>
                          <Input value={newProvider.samlEntryPoint} onChange={e => setNewProvider(p => ({ ...p, samlEntryPoint: e.target.value }))} placeholder="https://idp.example.com/sso" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Issuer / Entity ID</label>
                          <Input value={newProvider.samlIssuer} onChange={e => setNewProvider(p => ({ ...p, samlIssuer: e.target.value }))} placeholder="urn:example:idp" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Public Certificate (PEM)</label>
                        <textarea value={newProvider.samlCert} onChange={e => setNewProvider(p => ({ ...p, samlCert: e.target.value }))}
                          placeholder="-----BEGIN CERTIFICATE-----&#10;..." rows={3}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none" />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Login Button Text</label>
                    <Input value={newProvider.loginButtonText} onChange={e => setNewProvider(p => ({ ...p, loginButtonText: e.target.value }))} placeholder="Continue with SSO" />
                  </div>

                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => createProviderMut.mutate()} disabled={createProviderMut.isPending || !newProvider.providerName} className="gap-2">
                      <Plus className="icon-sm" />
                      {createProviderMut.isPending ? 'Creating…' : 'Create Provider'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {providersLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}</div>
            ) : !providers?.length ? (
              <div className="py-10 text-center text-muted-foreground border border-dashed rounded-xl">
                <Key className="icon-xl mx-auto mb-2" />
                <p className="text-sm">No identity providers yet</p>
                <p className="text-xs mt-1">Click "Add Provider" above to configure OIDC or SAML.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map(p => (
                  <ProviderCard key={p.id} provider={p} callbackBase={apiBase}
                    onToggle={p => toggleProviderMut.mutate(p)}
                    onDelete={id => deleteProviderMut.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Policy Tab ─── */}
          <TabsContent value="policy" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SSO Mode</CardTitle>
                <CardDescription>Controls how SSO interacts with password login for your organization members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['disabled', 'Disabled', ShieldOff, 'Standard login only'],
                    ['optional', 'Optional', Shield, 'SSO available, password allowed'],
                    ['required', 'Required', Lock, 'SSO mandatory for all members'],
                  ] as const).map(([mode, label, Icon, desc]) => (
                    <button key={mode} type="button" onClick={() => setSsoMode(mode as SSOMode)}
                      className={`p-3 rounded-lg border text-left transition-colors ${ssoMode === mode ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}`}>
                      <Icon className={`icon-sm mb-1 ${ssoMode === mode ? 'text-primary-accessible' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-medium ${ssoMode === mode ? 'text-primary-accessible' : ''}`}>{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                {ssoMode !== 'disabled' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Identity Provider</label>
                      <select value={selectedProviderId} onChange={e => setSelectedProviderId(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">— None selected —</option>
                        {providers?.map(p => <option key={p.id} value={p.id}>{p.providerName} ({p.providerType.toUpperCase()})</option>)}
                      </select>
                    </div>

                    {[
                      { key: 'allowPasswordFallback', label: 'Allow password fallback', desc: 'Members may also sign in with email + password', value: allowPasswordFallback, set: setAllowPasswordFallback },
                      { key: 'autoProvision', label: 'Auto-provision users (JIT)', desc: 'Create accounts automatically on first SSO login', value: autoProvision, set: setAutoProvision },
                    ].map(({ key, label, desc, value, set }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch checked={value} onCheckedChange={set} />
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {ssoMode !== 'disabled' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User Provisioning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Default Role for new SSO users</label>
                        <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          {['founder', 'investor', 'mentor', 'member'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Session Duration (hours)</label>
                        <Input type="number" min={1} max={720} value={sessionDuration} onChange={e => setSessionDuration(Number(e.target.value))} />
                      </div>
                    </div>

                    <RoleMappingEditor rules={roleMappingRules} onChange={setRoleMappingRules} />
                  </CardContent>
                </Card>

                <button type="button" onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showAdvanced ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                  Advanced settings
                </button>

                {showAdvanced && (
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Post-login redirect URL</label>
                        <Input value={postLoginRedirect} onChange={e => setPostLoginRedirect(e.target.value)} placeholder="/dashboard (leave blank for default)" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Allowed Email Domains</label>
                        <Input value={allowedDomains} onChange={e => setAllowedDomains(e.target.value)} placeholder="uoa.gr, di.uoa.gr (comma-separated)" />
                        <p className="text-xs text-muted-foreground">Leave empty to allow any domain</p>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">Enforce email domain</p>
                          <p className="text-xs text-muted-foreground">Reject SSO logins from domains not in the allowed list</p>
                        </div>
                        <Switch checked={enforceEmailDomain} onCheckedChange={setEnforceEmailDomain} />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {saveOk && <span className="text-xs text-status-success flex items-center gap-1"><Check className="icon-sm" />Saved</span>}
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="gap-2">
                <Check className="icon-sm" />
                {saveMut.isPending ? 'Saving…' : 'Save Policy'}
              </Button>
            </div>
          </TabsContent>

          {/* ── Email Domains Tab ─── */}
          <TabsContent value="domains" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Domain Mappings</CardTitle>
                <CardDescription>
                  When a user enters an email matching these domains on the login page, they will be offered your organization&apos;s SSO option.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">@</span>
                  <Input value={newDomain} onChange={e => setNewDomain(e.target.value.replace('@', ''))} placeholder="uoa.gr" className="flex-1" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <input type="checkbox" id="auto-redirect" checked={newDomainAutoRedirect} onChange={e => setNewDomainAutoRedirect(e.target.checked)} className="rounded" />
                    <label htmlFor="auto-redirect">Auto-redirect</label>
                  </div>
                  <Button size="sm" onClick={() => addDomainMut.mutate()} disabled={!newDomain.trim() || addDomainMut.isPending} className="gap-1.5 shrink-0">
                    <Plus className="icon-sm" />Add
                  </Button>
                </div>

                {domainsLoading ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />)}</div>
                ) : !domainMappings?.length ? (
                  <div className="py-8 text-center text-muted-foreground border border-dashed rounded-xl">
                    <Globe className="h-7 w-7 mx-auto mb-2" />
                    <p className="text-sm">No email domains mapped</p>
                    <p className="text-xs mt-1">Add your organization&apos;s email domain to enable SSO discovery.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {domainMappings.map(m => (
                      <DomainRow key={m.id} mapping={m}
                        onDelete={id => deleteDomainMut.mutate(id)}
                        onVerify={id => verifyDomainMut.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
