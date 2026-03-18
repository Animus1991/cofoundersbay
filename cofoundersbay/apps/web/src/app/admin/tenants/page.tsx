'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Plus,
  Settings,
  Palette,
  Globe,
  Mail,
  FileText,
  Eye,
  Save,
  X,
  Upload,
  Check,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { listTenants, type TenantItem } from '@/lib/api';

export default function TenantsAdminPage() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: tenants, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => listTenants({ limit: 100 }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppShell
      title="Tenant Management"
      description="Manage organizations and their white-label branding"
      actions={
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Tenant
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {tenants?.filter(t => t.status === 'active').length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Branding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {tenants?.filter(t => t.logoUrl).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            Configure branding, SSO, and settings for each tenant
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
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                Retry
              </Button>
            </div>
          ) : !tenants?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <p>No tenants configured yet</p>
              <Button onClick={() => setIsCreating(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create First Tenant
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedTenant(tenant)}
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
                      <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(tenant.status)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenant Editor Modal */}
      {(selectedTenant || isCreating) && (
        <TenantEditor
          tenant={selectedTenant}
          onClose={() => {
            setSelectedTenant(null);
            setIsCreating(false);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
            setSelectedTenant(null);
            setIsCreating(false);
          }}
        />
      )}
    </AppShell>
  );
}

function TenantEditor({
  tenant,
  onClose,
  onSave,
}: {
  tenant: TenantItem | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = !tenant;
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    slug: tenant?.slug || '',
    displayName: tenant?.displayName || '',
    description: tenant?.description || '',
    logoUrl: tenant?.logoUrl || '',
    faviconUrl: '',
    primaryColor: '#8b5cf6',
    secondaryColor: '#6366f1',
    accentColor: '#f59e0b',
    heroTitle: '',
    heroSubtitle: '',
    supportEmail: '',
    websiteUrl: '',
    privacyPolicyUrl: '',
    termsUrl: '',
    linkedinUrl: '',
    onboardingIntroText: '',
    dashboardWelcomeText: '',
  });
  const [previewMode, setPreviewMode] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // In real implementation, this would call the API
    console.log('Saving tenant:', formData);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b shrink-0">
          <div>
            <CardTitle>{isNew ? 'Create Tenant' : `Edit: ${tenant?.displayName || tenant?.name}`}</CardTitle>
            <CardDescription>Configure organization settings and branding</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="gap-2">
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          {previewMode ? (
            <TenantPreview data={formData} />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
              <TabsList className="mb-6">
                <TabsTrigger value="general" className="gap-2">
                  <Settings className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="branding" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Links
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Internal Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="acme-corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => handleChange('slug', e.target.value)}
                      placeholder="acme"
                    />
                    <p className="text-xs text-muted-foreground">
                      Accessible at /t/{formData.slug || 'slug'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the organization..."
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="branding" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Logo URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.logoUrl}
                          onChange={(e) => handleChange('logoUrl', e.target.value)}
                          placeholder="https://..."
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Favicon URL</label>
                      <Input
                        value={formData.faviconUrl}
                        onChange={(e) => handleChange('faviconUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {formData.logoUrl ? (
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2">Logo Preview</p>
                        <img src={formData.logoUrl} alt="Logo" className="h-16 object-contain" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border bg-muted/30 h-24 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No logo uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Color Palette</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          className="h-10 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => handleChange('secondaryColor', e.target.value)}
                          className="h-10 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => handleChange('secondaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Accent Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => handleChange('accentColor', e.target.value)}
                          className="h-10 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.accentColor}
                          onChange={(e) => handleChange('accentColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-3">Color Preview</p>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-24 rounded"
                        style={{ backgroundColor: formData.primaryColor }}
                      />
                      <div
                        className="h-10 w-24 rounded"
                        style={{ backgroundColor: formData.secondaryColor }}
                      />
                      <div
                        className="h-10 w-24 rounded"
                        style={{ backgroundColor: formData.accentColor }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hero Title</label>
                  <Input
                    value={formData.heroTitle}
                    onChange={(e) => handleChange('heroTitle', e.target.value)}
                    placeholder="Welcome to Our Innovation Hub"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hero Subtitle</label>
                  <textarea
                    value={formData.heroSubtitle}
                    onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                    placeholder="Connect with founders, mentors, and investors..."
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Onboarding Intro Text</label>
                  <textarea
                    value={formData.onboardingIntroText}
                    onChange={(e) => handleChange('onboardingIntroText', e.target.value)}
                    placeholder="Welcome! Let's set up your profile..."
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dashboard Welcome Message</label>
                  <textarea
                    value={formData.dashboardWelcomeText}
                    onChange={(e) => handleChange('dashboardWelcomeText', e.target.value)}
                    placeholder="Here's what's happening in your network..."
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Support Email</label>
                    <Input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                      placeholder="support@acme.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website URL</label>
                    <Input
                      value={formData.websiteUrl}
                      onChange={(e) => handleChange('websiteUrl', e.target.value)}
                      placeholder="https://acme.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Privacy Policy URL</label>
                    <Input
                      value={formData.privacyPolicyUrl}
                      onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)}
                      placeholder="https://acme.com/privacy"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Terms of Service URL</label>
                    <Input
                      value={formData.termsUrl}
                      onChange={(e) => handleChange('termsUrl', e.target.value)}
                      placeholder="https://acme.com/terms"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    value={formData.linkedinUrl}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/company/acme"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t shrink-0">
          <div className="flex items-center gap-2">
            {tenant && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={`/t/${tenant.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View Public Page
                </a>
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {isNew ? 'Create Tenant' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TenantPreview({ data }: { data: Record<string, string> }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border overflow-hidden">
        {/* Preview Header */}
        <div
          className="p-4 flex items-center justify-between"
          style={{ backgroundColor: data.primaryColor }}
        >
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-8 object-contain" />
          ) : (
            <span className="text-white font-semibold">{data.displayName || 'Organization'}</span>
          )}
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded bg-white/20" />
            <div className="h-8 w-16 rounded bg-white/20" />
          </div>
        </div>

        {/* Preview Hero */}
        <div className="p-8 text-center bg-gradient-to-b from-muted/50 to-background">
          <h1 className="text-2xl font-bold mb-2">
            {data.heroTitle || 'Welcome to ' + (data.displayName || 'Our Platform')}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {data.heroSubtitle || 'Connect with founders, mentors, and investors in our ecosystem.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: data.primaryColor }}
            >
              Get Started
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: data.primaryColor, color: data.primaryColor }}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Preview Footer */}
        <div className="p-4 border-t bg-muted/30 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {data.displayName || 'Organization'}. All rights reserved.</p>
          {data.supportEmail && <p className="mt-1">Contact: {data.supportEmail}</p>}
        </div>
      </div>
    </div>
  );
}
