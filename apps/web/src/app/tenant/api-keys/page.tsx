'use client';

import { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Clock,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
};

const MOCK_KEYS: ApiKey[] = [
  { id: '1', name: 'Production Integration', prefix: 'cfb_prod_', scopes: ['read:users', 'write:programs', 'read:analytics'], createdAt: 'Jan 12, 2025', lastUsed: '1 hour ago', isActive: true },
  { id: '2', name: 'Zapier Automation', prefix: 'cfb_zap_', scopes: ['read:users', 'write:webhooks'], createdAt: 'Feb 3, 2025', lastUsed: 'Yesterday', isActive: true },
  { id: '3', name: 'Dev Testing', prefix: 'cfb_dev_', scopes: ['read:all'], createdAt: 'Mar 1, 2025', expiresAt: 'Apr 1, 2025', isActive: false },
];

function KeyRow({ apiKey }: { apiKey: ApiKey }) {
  const [revealed, setRevealed] = useState(false);
  const maskedKey = `${apiKey.prefix}${'•'.repeat(24)}`;
  const revealedKey = `${apiKey.prefix}abc123xyz789defghijklmnopqr`;

  return (
    <div className={cn('p-4 rounded-lg border transition-all hover:border-primary/20', !apiKey.isActive && 'opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{apiKey.name}</p>
            {apiKey.isActive ? (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-500">Inactive</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{revealed ? revealedKey : maskedKey}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRevealed(!revealed)}>
              {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3" /></Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {apiKey.scopes.map(s => (
              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Created {apiKey.createdAt}</span>
            {apiKey.lastUsed && <span>Last used {apiKey.lastUsed}</span>}
            {apiKey.expiresAt && <span className="text-amber-600">Expires {apiKey.expiresAt}</span>}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Scopes</DropdownMenuItem>
            <DropdownMenuItem>Regenerate</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Revoke</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function TenantApiKeysPage() {
  return (
    <AppShell>
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" />
              API Keys
            </h1>
            <p className="text-muted-foreground">Manage API keys for programmatic access to your tenant data</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" />Create API Key</Button>
        </div>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm">API keys grant full access to your tenant's resources. Store them securely and never share them publicly.</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {MOCK_KEYS.map(k => <KeyRow key={k.id} apiKey={k} />)}
        </div>
      </div>
    </AppShell>
  );
}
