'use client';

import { useState } from 'react';
import {
  Lock,
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Key,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type SSOProvider = {
  id: string;
  name: string;
  protocol: 'SAML' | 'OIDC' | 'OAuth2';
  isEnabled: boolean;
  isConfigured: boolean;
  entityId?: string;
  callbackUrl: string;
  lastUsed?: string;
};

const MOCK_PROVIDERS: SSOProvider[] = [
  {
    id: '1',
    name: 'Google Workspace',
    protocol: 'OIDC',
    isEnabled: true,
    isConfigured: true,
    entityId: 'google-workspace-corp',
    callbackUrl: 'https://platform.cofoundersbay.com/auth/callback/google',
    lastUsed: '2 hours ago',
  },
  {
    id: '2',
    name: 'Okta',
    protocol: 'SAML',
    isEnabled: false,
    isConfigured: false,
    callbackUrl: 'https://platform.cofoundersbay.com/auth/callback/okta',
  },
  {
    id: '3',
    name: 'Microsoft Azure AD',
    protocol: 'OIDC',
    isEnabled: false,
    isConfigured: false,
    callbackUrl: 'https://platform.cofoundersbay.com/auth/callback/azure',
  },
];

function ProviderCard({ provider }: { provider: SSOProvider }) {
  const [enabled, setEnabled] = useState(provider.isEnabled);

  return (
    <Card className={cn('transition-all', !enabled && 'opacity-70')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{provider.name}</h3>
              <Badge variant="secondary" className="text-xs">{provider.protocol}</Badge>
              {provider.isConfigured ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="mr-1 h-3 w-3" />Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <AlertCircle className="mr-1 h-3 w-3" />Not configured
                </Badge>
              )}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Callback URL:</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{provider.callbackUrl}</code>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {provider.lastUsed && (
                <p className="text-xs text-muted-foreground">Last used: {provider.lastUsed}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Button variant="outline" size="sm">
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              {provider.isConfigured ? 'Edit' : 'Configure'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantSSOPage() {
  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              SSO / Authentication
            </h1>
            <p className="text-muted-foreground">Configure single sign-on for your organization members</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {/* Status Banner */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">SSO is active for your organization</p>
              <p className="text-xs text-muted-foreground">Members can sign in with Google Workspace. 1 provider configured.</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="providers" className="mt-4 space-y-3">
            {MOCK_PROVIDERS.map(p => <ProviderCard key={p.id} provider={p} />)}
          </TabsContent>
          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">SSO Enforcement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Require SSO for all members', desc: 'Members must use SSO to access the platform', defaultOn: true },
                  { label: 'Allow email/password fallback', desc: 'Allow members to log in with email/password if SSO fails', defaultOn: true },
                  { label: 'Auto-provision new members', desc: 'Automatically create accounts for new SSO users', defaultOn: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultOn} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
