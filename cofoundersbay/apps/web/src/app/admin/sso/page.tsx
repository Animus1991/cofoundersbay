'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Shield, 
  Settings, 
  Plus, 
  Check, 
  X, 
  AlertTriangle,
  Globe,
  Key,
  Users,
  Activity,
  ChevronRight
} from 'lucide-react';
import { listTenants, type TenantItem } from '@/lib/api';

type SSOConfigStatus = 'disabled' | 'optional' | 'required';

export default function SSOAdminPage() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const { data: tenants, isLoading, isError } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => listTenants({ limit: 100 }),
  });

  const getSSOStatus = (tenant: TenantItem): SSOConfigStatus => {
    // In real implementation, this would come from tenant.ssoConfig
    return 'disabled';
  };

  const getStatusBadge = (status: SSOConfigStatus) => {
    switch (status) {
      case 'required':
        return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">SSO Required</Badge>;
      case 'optional':
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30">SSO Optional</Badge>;
      default:
        return <Badge variant="secondary">SSO Disabled</Badge>;
    }
  };

  return (
    <AppShell
      title="SSO Configuration"
      description="Configure Single Sign-On for organization tenants"
      actions={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Identity Provider
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{tenants?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SSO Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Organization Tenants</CardTitle>
          <CardDescription>
            Configure SSO settings for each organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p>Failed to load tenants</p>
            </div>
          ) : !tenants?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <p>No tenants configured yet</p>
              <p className="text-sm mt-1">Create a tenant to configure SSO</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedTenant(tenant.id)}
                >
                  <div className="flex items-center gap-4">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{tenant.displayName || tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(getSSOStatus(tenant))}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSO Configuration Panel */}
      {selectedTenant && (
        <SSOConfigPanel 
          tenantId={selectedTenant} 
          onClose={() => setSelectedTenant(null)} 
        />
      )}

      {/* Recent Auth Events */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent SSO Events
          </CardTitle>
          <CardDescription>
            Authentication activity across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>No SSO events yet</p>
            <p className="text-sm mt-1">Events will appear here once SSO is configured</p>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function SSOConfigPanel({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const [ssoMode, setSsoMode] = useState<'disabled' | 'optional' | 'required'>('disabled');
  const [providerType, setProviderType] = useState<'oidc' | 'saml'>('oidc');
  const [config, setConfig] = useState({
    providerName: '',
    clientId: '',
    clientSecret: '',
    issuerUrl: '',
    allowedDomains: '',
    autoProvision: false,
    defaultRole: 'founder',
    loginButtonText: 'Continue with SSO',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configure SSO</CardTitle>
            <CardDescription>Set up Single Sign-On for this organization</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SSO Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium">SSO Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['disabled', 'optional', 'required'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSsoMode(mode)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    ssoMode === mode
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {ssoMode !== 'disabled' && (
            <>
              {/* Provider Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Provider Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProviderType('oidc')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      providerType === 'oidc'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    OpenID Connect
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderType('saml')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      providerType === 'saml'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    SAML 2.0
                  </button>
                </div>
              </div>

              {/* Provider Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider Name</label>
                <Input
                  placeholder="e.g., University of Athens SSO"
                  value={config.providerName}
                  onChange={(e) => setConfig({ ...config, providerName: e.target.value })}
                />
              </div>

              {providerType === 'oidc' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issuer URL</label>
                    <Input
                      placeholder="https://accounts.google.com"
                      value={config.issuerUrl}
                      onChange={(e) => setConfig({ ...config, issuerUrl: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Client ID</label>
                      <Input
                        placeholder="your-client-id"
                        value={config.clientId}
                        onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Client Secret</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={config.clientSecret}
                        onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Allowed Domains */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Allowed Email Domains</label>
                <Input
                  placeholder="uoa.gr, di.uoa.gr (comma separated)"
                  value={config.allowedDomains}
                  onChange={(e) => setConfig({ ...config, allowedDomains: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Only users with these email domains can use SSO
                </p>
              </div>

              {/* Auto Provisioning */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Auto-provision users</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically create accounts for new SSO users
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoProvision: !config.autoProvision })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.autoProvision ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      config.autoProvision ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Login Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Login Button Text</label>
                <Input
                  placeholder="Continue with SSO"
                  value={config.loginButtonText}
                  onChange={(e) => setConfig({ ...config, loginButtonText: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button className="gap-2">
              <Check className="h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
