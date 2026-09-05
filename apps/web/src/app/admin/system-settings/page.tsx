'use client';

import { useState } from 'react';
import { Save, Settings, Mail, Shield, Globe } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

export default function SystemSettingsPage() {
  const { success } = useToast();
  const [maintenance, setMaintenance] = useState(false);
  const [signupOpen, setSignupOpen] = useState(true);
  const [supportEmail, setSupportEmail] = useState('support@cofounderbay.com');
  const [platformName, setPlatformName] = useState('CoFounderBay');

  const save = () => success('Settings saved', 'Platform configuration updated (demo).');

  return (
    <AppShell
      title="System settings"
      description="Global platform switches — maintenance mode, signups, support contact, and defaults."
      actions={
        <Button size="sm" onClick={save}>
          <Save className="icon-sm mr-1.5" /> Save changes
        </Button>
      }
    >
      <HelpCallout id="admin-system-settings" title="Platform-wide settings">
        <p>
          <strong>Maintenance mode</strong> shows a banner and blocks new sessions for non-admins.
          <strong> Registration</strong> toggle pauses new signups without affecting existing users.
        </p>
      </HelpCallout>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="icon-sm" /> Branding & access
              </CardTitle>
              <CardDescription>Visible to all users on public pages and emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform name</Label>
                <Input id="platform-name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support email</Label>
                <Input id="support-email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Maintenance mode</p>
                  <p className="text-sm text-muted-foreground">Temporarily limit access for upgrades</p>
                </div>
                <Switch checked={maintenance} onCheckedChange={setMaintenance} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Open registration</p>
                  <p className="text-sm text-muted-foreground">Allow new account signups</p>
                </div>
                <Switch checked={signupOpen} onCheckedChange={setSignupOpen} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="icon-sm" /> Security defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Session timeout: 7 days (refresh token rotation enabled)</p>
              <p>2FA: optional for users, required for platform admins</p>
              <p>Rate limiting: 100 req/min per IP on auth routes</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="icon-sm" /> Email delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="from-name">From name</Label>
                <Input id="from-name" defaultValue="CoFounderBay" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">From email</Label>
                <Input id="from-email" defaultValue="noreply@cofounderbay.com" />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
                <Globe className="icon-sm" /> SPF/DKIM configured per production deployment guide
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
