'use client';

import { useState } from 'react';
import {
  Building2,
  Palette,
  Users,
  Shield,
  Bell,
  CreditCard,
  Globe,
  Save,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OrgSettingsPage() {
  const [orgName, setOrgName] = useState('TechStars Athens');
  const [orgDescription, setOrgDescription] = useState('Leading accelerator program in Southeast Europe');
  const [website, setWebsite] = useState('https://techstars.com/athens');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's profile and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="icon-md" aria-hidden="true" />
                  Organization Profile
                </CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgDescription">Description</Label>
                  <Textarea
                    id="orgDescription"
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgType">Organization Type</Label>
                    <Select defaultValue="accelerator">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incubator">Incubator</SelectItem>
                        <SelectItem value="accelerator">Accelerator</SelectItem>
                        <SelectItem value="venture_studio">Venture Studio</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="innovation_hub">Innovation Hub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select defaultValue="gr">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gr">Greece</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="europe_athens">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="europe_athens">Europe/Athens (GMT+2)</SelectItem>
                        <SelectItem value="america_new_york">America/New_York (GMT-5)</SelectItem>
                        <SelectItem value="europe_london">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>
                  <Save className="mr-2 icon-sm" aria-hidden="true" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="icon-md" aria-hidden="true" />
                  Branding
                </CardTitle>
                <CardDescription>
                  Customize your organization's appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center">
                      <Building2 className="icon-xl text-muted-foreground" aria-hidden="true" />
                    </div>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <div className="flex items-center gap-2">
                    <Input placeholder="accelerator.yourdomain.com" />
                    <Button variant="outline">Verify</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set up a custom domain for your organization's portal
                  </p>
                </div>
                <Button>
                  <Save className="mr-2 icon-sm" aria-hidden="true" />
                  Save Branding
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="icon-md" aria-hidden="true" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Manage your organization's team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">5 team members</p>
                  <Button>Invite Member</Button>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
                    { name: 'Jane Smith', email: 'jane@example.com', role: 'Program Manager' },
                    { name: 'Mike Johnson', email: 'mike@example.com', role: 'Reviewer' },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Select defaultValue={member.role.toLowerCase().replace(' ', '_')}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="program_manager">Program Manager</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Settings */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="icon-md" aria-hidden="true" />
                  Permissions & Access
                </CardTitle>
                <CardDescription>
                  Configure access controls for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Public Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Allow your organization to be discovered publicly
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Open Applications</p>
                    <p className="text-sm text-muted-foreground">
                      Accept applications from any startup
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mentor Self-Registration</p>
                    <p className="text-sm text-muted-foreground">
                      Allow mentors to request to join your pool
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Startup Workspace Access</p>
                    <p className="text-sm text-muted-foreground">
                      Org admins can view all startup workspaces
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="icon-md" aria-hidden="true" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Organization Pro</p>
                      <p className="text-sm text-muted-foreground">$299/month · Billed annually</p>
                    </div>
                    <Button variant="outline">Change Plan</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Usage</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Startups</p>
                      <p className="text-xl font-bold">32 / 50</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Team Members</p>
                      <p className="text-xl font-bold">5 / 10</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Programs</p>
                      <p className="text-xl font-bold">4 / Unlimited</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Payment Method</p>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="icon-md" aria-hidden="true" />
                      <span>•••• •••• •••• 4242</span>
                    </div>
                    <Button variant="ghost" size="sm">Update</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
