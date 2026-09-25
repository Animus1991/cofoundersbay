'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/toast';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import {
  getOrgProfile,
  listOrganizationMembers,
  updateOrganization,
  updateOrganizationMember,
  type OrgAdminMember,
} from '@/lib/api';
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
  /*
   * The three fields opened with another organisation's details written into
   * the source, and both Save buttons had no handler — typing into them
   * changed nothing anywhere. They load the organisation's own profile now
   * and write it back through `PATCH /organizations/:id`, which has existed
   * all along without a client.
   */
  const { slug, membership } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: profileData } = useQuery({
    queryKey: ['org', 'profile', slug],
    queryFn: () => getOrgProfile(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 0,
  });

  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [website, setWebsite] = useState('');
  /* type, country and timezone are real columns on the model — the selects
     used to render `defaultValue` and go nowhere. */
  const [orgType, setOrgType] = useState('accelerator');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  /* Access policies persist under `settings.policies` on the organisation. */
  const [policies, setPolicies] = useState<Record<string, boolean>>({
    publicProfile: true,
    openApplications: true,
    mentorSelfRegistration: false,
    workspaceAccess: true,
  });
  const savedSettings = profileData?.org?.settings ?? null;

  const membersQuery = useQuery({
    queryKey: ['org', 'admin-members', organizationId],
    queryFn: () => listOrganizationMembers(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
    retry: 0,
  });

  // Seed the form once the profile arrives, without stamping over edits made
  // while it was in flight.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !profileData?.org) return;
    const org = profileData.org;
    setOrgName(org?.name ?? '');
    setOrgDescription(org?.description ?? '');
    setWebsite(org?.website ?? '');
    if (org?.type) setOrgType(org.type);
    setCountry(org?.country ?? '');
    setTimezone(org?.timezone ?? '');
    if (org?.primaryColor) setPrimaryColor(org.primaryColor);
    const saved = (org?.settings as { policies?: Record<string, boolean> } | null)?.policies;
    if (saved) setPolicies((prev) => ({ ...prev, ...saved }));
    setSeeded(true);
  }, [profileData, seeded]);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateOrganization(organizationId!, {
        name: orgName.trim(),
        description: orgDescription.trim(),
        website: website.trim(),
        type: orgType,
        country,
        timezone,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org'] });
      success('Organisation details saved');
    },
    onError: (err) =>
      showError('Could not save the details', err instanceof Error ? err.message : undefined),
  });

  const saveBranding = useMutation({
    mutationFn: () => updateOrganization(organizationId!, { primaryColor }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org'] });
      success('Branding saved');
    },
    onError: (err) =>
      showError('Could not save the branding', err instanceof Error ? err.message : undefined),
  });

  const savePolicies = useMutation({
    mutationFn: (next: Record<string, boolean>) =>
      updateOrganization(organizationId!, {
        settings: { ...(savedSettings ?? {}), policies: next },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org'] });
      success('Access policies saved');
    },
    onError: (err) =>
      showError('Could not save the policies', err instanceof Error ? err.message : undefined),
  });
  const setPolicy = (key: string, value: boolean) => {
    const next = { ...policies, [key]: value };
    setPolicies(next);
    if (organizationId) savePolicies.mutate(next);
  };

  const changeMemberRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateOrganizationMember(organizationId!, memberId, { role }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org', 'admin-members', organizationId] });
      success('Role updated');
    },
    onError: (err) =>
      showError('Could not update the role', err instanceof Error ? err.message : undefined),
  });

  const memberName = (m: OrgAdminMember) =>
    m.user?.profile?.displayName ||
    [m.user?.profile?.firstName, m.user?.profile?.lastName].filter(Boolean).join(' ') ||
    m.user?.email ||
    'Member';

  return (
    <AppShell
      title="Organization Settings"
      description="Profile, branding, team, permissions, and billing for your organization."
    >
      <div className="space-y-6">

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="w-full lg:grid lg:grid-cols-5">
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
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger id="orgType">
                        <SelectValue placeholder="Choose a type" />
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
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Choose a country" />
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
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Choose a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="europe_athens">Europe/Athens (GMT+2)</SelectItem>
                        <SelectItem value="america_new_york">America/New_York (GMT-5)</SelectItem>
                        <SelectItem value="europe_london">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  disabled={!organizationId || saveProfile.isPending}
                  onClick={() => saveProfile.mutate()}
                >
                  <Save className="mr-2 icon-sm" aria-hidden="true" />
                  {saveProfile.isPending ? 'Saving…' : 'Save Changes'}
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
                    <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center">
                      <Building2 className="icon-xl text-muted-foreground" />
                    </div>
                    <Button variant="outline" disabled title="Logo storage is not connected yet">Upload Logo</Button>
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
                    <Button variant="outline" disabled title="Custom domains are not connected yet">Verify</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set up a custom domain for your organization's portal
                  </p>
                </div>
                {/* primaryColor is a real column; the logo and custom domain
                    have no backing field, so their controls stay inert with the
                    reason on them rather than looking live. */}
                <div className="flex items-center gap-3">
                  <Button
                    disabled={!organizationId || saveBranding.isPending}
                    onClick={() => saveBranding.mutate()}
                  >
                    <Save className="mr-2 icon-sm" aria-hidden="true" />
                    {saveBranding.isPending ? 'Saving…' : 'Save Branding'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Saves the primary colour. Logo and domain are not stored yet.
                  </p>
                </div>
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
                  <p className="text-sm text-muted-foreground">
                    {membersQuery.data
                      ? `${membersQuery.data.length} team member${membersQuery.data.length === 1 ? '' : 's'}`
                      : 'Members could not be loaded'}
                  </p>
                  <Button asChild>
                    <Link href={slug ? `/org/${slug}/admin` : '/org/dashboard'}>Invite Member</Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {(membersQuery.data ?? []).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{memberName(member)}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                      </div>
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          changeMemberRole.mutate({ memberId: member.id, role })
                        }
                        disabled={member.role === 'owner'}
                      >
                        <SelectTrigger aria-label={`Role for ${memberName(member)}`} className="w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="program_manager">Program Manager</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {!membersQuery.data && (
                    <p className="text-xs text-muted-foreground">
                      The member list lives under the organisation&apos;s admin page until the
                      directory responds.
                    </p>
                  )}
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
                {[
                  { key: 'publicProfile', label: 'Public Profile', hint: 'Allow your organization to be discovered publicly' },
                  { key: 'openApplications', label: 'Open Applications', hint: 'Accept applications from any startup' },
                  { key: 'mentorSelfRegistration', label: 'Mentor Self-Registration', hint: 'Allow mentors to request to join your pool' },
                  { key: 'workspaceAccess', label: 'Startup Workspace Access', hint: 'Org admins can view all startup workspaces' },
                ].map((p) => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-sm text-muted-foreground">{p.hint}</p>
                    </div>
                    <Switch
                      aria-label={p.label}
                      checked={policies[p.key]}
                      onCheckedChange={(v) => setPolicy(p.key, v)}
                      disabled={!organizationId || savePolicies.isPending}
                    />
                  </div>
                ))}
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
                <p className="text-xs text-muted-foreground">
                  Plan and payment details are illustrative — billing is not connected to the
                  organisation yet.
                </p>
                <div className="p-4 rounded-lg border bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Organization Pro</p>
                      <p className="text-sm text-muted-foreground">$299/month · Billed annually</p>
                    </div>
                    <Button variant="outline" disabled title="Billing is not connected yet">Change Plan</Button>
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
                    <Button variant="ghost" size="sm" disabled title="Billing is not connected yet">Update</Button>
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
