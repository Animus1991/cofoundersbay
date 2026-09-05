'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Users,
  CreditCard,
  Globe,
  Key,
  Save,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TenantSettingsPage() {
  const [autoApprove, setAutoApprove] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <AppShell
      title="Tenant Settings"
      description="General workspace settings: membership policy, notifications, and email preferences."
      actions={(
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      )}
    >
      <div className="space-y-6">

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Basic configuration for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="cet">Central European Time (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control */}
          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Access</CardTitle>
                <CardDescription>
                  Control how members join your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval for New Members</Label>
                    <p className="text-sm text-muted-foreground">
                      New members must be approved by an admin
                    </p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve from Allowed Domains</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve members from specific email domains
                    </p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
                {autoApprove && (
                  <div className="space-y-2">
                    <Label>Allowed Domains</Label>
                    <Input placeholder="example.com, company.org" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SSO Configuration</CardTitle>
                <CardDescription>
                  Enable Single Sign-On for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>SSO Provider</Label>
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="google">Google Workspace</SelectItem>
                      <SelectItem value="okta">Okta</SelectItem>
                      <SelectItem value="azure">Azure AD</SelectItem>
                      <SelectItem value="saml">Custom SAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Configure notification preferences for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications to members
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Send weekly summary emails to members
                    </p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>
                  Integrate with external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Slack', description: 'Send notifications to Slack channels', connected: true },
                  { name: 'Google Calendar', description: 'Sync events with Google Calendar', connected: false },
                  { name: 'Zoom', description: 'Create Zoom meetings for sessions', connected: true },
                  { name: 'Notion', description: 'Sync resources with Notion', connected: false },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                    <Button variant={integration.connected ? 'outline' : 'default'} size="sm">
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Manage API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input value="sk_live_xxxxxxxxxxxxxxxxxxxxx" readOnly className="font-mono text-sm" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Your organization's subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">Enterprise Plan</p>
                      <p className="text-sm text-muted-foreground">Up to 500 members, unlimited programs</p>
                    </div>
                    <p className="text-xl font-bold">$499<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">View Invoices</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Manage your payment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg border">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
