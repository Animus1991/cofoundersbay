'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { useModalA11y } from '@/hooks/useModalA11y';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Plus, Settings, Palette, Globe, Mail, FileText,
  Eye, Save, X, Upload, Check, AlertTriangle, ExternalLink,
  ChevronRight, Trash2, Users, Image as ImageIcon, Type,
} from 'lucide-react';
import {
  listTenants, createTenant, updateTenant, deleteTenant,
  updateTenantBranding, publishTenantBranding, unpublishTenantBranding,
  type TenantItem, type TenantBranding,
} from '@/lib/api';
import { BulkActionBar, useBulkSelection, BulkCheckbox } from '@/components/ui/bulk-action-bar';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { BilingualText } from '@/components/common/BilingualText';
import { analytics } from '@/lib/analytics';

const TENANT_DELETE_DESCRIPTION = (
  <BilingualText
    en="All their members, programs and data are removed permanently. This cannot be undone."
    el="Όλα τα μέλη, προγράμματα και δεδομένα τους αφαιρούνται οριστικά. Δεν μπορεί να αναιρεθεί."
  />
);

export default function TenantsAdminPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: tenants, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => listTenants({ limit: 100 }),
  });

  const tenantIds = tenants?.map(t => t.id) ?? [];
  const { selectedIds, toggle, clear, isAllSelected, isPartiallySelected } = useBulkSelection(tenantIds);

  const bulkActions = [
    {
      id: 'activate',
      label: 'Activate',
      onClick: async (ids: string[]) => {
        await Promise.all(ids.map(id => updateTenant(id, { status: 'active' })));
        queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
        void analytics.track('tenant_bulk_activate', { count: ids.length });
      },
    },
    {
      id: 'suspend',
      label: 'Suspend',
      variant: 'destructive' as const,
      onClick: async (ids: string[]) => {
        await Promise.all(ids.map(id => updateTenant(id, { status: 'suspended' })));
        queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
        void analytics.track('tenant_bulk_suspend', { count: ids.length });
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      variant: 'destructive' as const,
      onClick: async (ids: string[]) => {
        const ok = await confirm({
          title: <BilingualText en={`Delete ${ids.length} tenants?`} el={`Διαγραφή ${ids.length} tenants;`} />,
          description: TENANT_DELETE_DESCRIPTION,
          confirmLabel: <BilingualText en="Delete" el="Διαγραφή" compact />,
        });
        if (!ok) return;
        await Promise.all(ids.map(id => deleteTenant(id)));
        queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
        void analytics.track('tenant_bulk_delete', { count: ids.length });
      },
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-status-success-bg text-status-success border-status-success-border">Active</Badge>;
      case 'pending':
        return <Badge className="bg-status-warning-bg text-status-warning border-status-warning-border">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-status-danger-bg text-status-danger border-status-danger-border">Suspended</Badge>;
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
          <Plus className="icon-sm" />
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
              <Building2 className="icon-md text-primary-accessible" />
              <span className="text-xl font-bold">{tenants?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Check className="icon-md text-status-success" />
              <span className="text-xl font-bold">
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
              <Palette className="icon-md text-status-accent" />
              <span className="text-xl font-bold">
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
              <AlertTriangle className="icon-xl mx-auto mb-2 text-destructive-accessible" />
              <p>Failed to load tenants</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                Retry
              </Button>
            </div>
          ) : !tenants?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="icon-xl mx-auto mb-2" />
              <p>No tenants configured yet</p>
              <Button onClick={() => setIsCreating(true)} className="mt-4 gap-2">
                <Plus className="icon-sm" />
                Create First Tenant
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <BulkCheckbox
                      id={tenant.id}
                      selectedIds={selectedIds}
                      onToggle={toggle}
                      className="shrink-0"
                    />
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="icon-md text-primary-accessible" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{tenant.displayName || tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(tenant.status)}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(tenant)}>
                      <Settings className="icon-sm" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={clear}
        actions={bulkActions}
        entityLabel="tenant"
      />

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

const FONT_OPTIONS = ['Inter', 'Roboto', 'Poppins', 'Open Sans', 'Playfair Display', 'Montserrat', 'Lato'];
const BG_STYLES = ['flat', 'gradient', 'image', 'dark'];

function TenantEditor({
  tenant,
  onClose,
  onSave,
}: {
  tenant: TenantItem | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const panelRef = useModalA11y<HTMLDivElement>(true, onClose);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const isNew = !tenant;
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);
  const [saveError, setSaveError] = useState('');

  const b = tenant?.branding;

  const [general, setGeneral] = useState({
    name: tenant?.name ?? '',
    slug: tenant?.slug ?? '',
    displayName: tenant?.displayName ?? '',
    shortDescription: tenant?.shortDescription ?? '',
    description: tenant?.description ?? '',
    aboutText: tenant?.aboutText ?? '',
    website: tenant?.website ?? '',
    logoUrl: tenant?.logoUrl ?? '',
    faviconUrl: tenant?.faviconUrl ?? '',
    status: tenant?.status ?? 'draft',
  });

  const [branding, setBranding] = useState({
    primaryColor: b?.primaryColor ?? '#8b5cf6',
    secondaryColor: b?.secondaryColor ?? '#6366f1',
    accentColor: b?.accentColor ?? '#f59e0b',
    backgroundStyle: b?.backgroundStyle ?? 'flat',
    headingFont: b?.headingFont ?? 'Inter',
    bodyFont: b?.bodyFont ?? 'Inter',
    heroImageUrl: b?.heroImageUrl ?? '',
    heroTitle: b?.heroTitle ?? '',
    heroSubtitle: b?.heroSubtitle ?? '',
    aboutText: b?.aboutText ?? '',
    ctaLabel: b?.ctaLabel ?? 'Get Started',
    ctaUrl: b?.ctaUrl ?? '',
    onboardingIntroText: b?.onboardingIntroText ?? '',
    dashboardWelcomeText: b?.dashboardWelcomeText ?? '',
    communityNaming: b?.communityNaming ?? '',
    supportEmail: b?.supportEmail ?? '',
    websiteUrl: b?.websiteUrl ?? '',
    privacyPolicyUrl: b?.privacyPolicyUrl ?? '',
    termsUrl: b?.termsUrl ?? '',
    cookiePolicyUrl: b?.cookiePolicyUrl ?? '',
    linkedinUrl: b?.linkedinUrl ?? '',
    twitterUrl: b?.twitterUrl ?? '',
    instagramUrl: b?.instagramUrl ?? '',
    emailFromName: b?.emailFromName ?? '',
    emailFooterText: b?.emailFooterText ?? '',
  });

  const createMut = useMutation({
    mutationFn: () => createTenant({ ...general }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }); onSave(); },
    onError: (e: Error) => setSaveError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => updateTenant(tenant!.id, { ...general }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }); onSave(); },
    onError: (e: Error) => setSaveError(e.message),
  });

  const brandingMut = useMutation({
    mutationFn: () => updateTenantBranding(tenant!.id, { ...branding }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
    onError: (e: Error) => setSaveError(e.message),
  });

  const publishMut = useMutation({
    mutationFn: () => publishTenantBranding(tenant!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });

  const unpublishMut = useMutation({
    mutationFn: () => unpublishTenantBranding(tenant!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteTenant(tenant!.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }); onSave(); },
  });

  const isSaving = createMut.isPending || updateMut.isPending;
  const isBrandingSaving = brandingMut.isPending;

  const handleSaveGeneral = () => {
    setSaveError('');
    if (isNew) createMut.mutate();
    else updateMut.mutate();
  };

  const handleSaveBranding = () => {
    setSaveError('');
    if (!tenant) return;
    brandingMut.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      {/* `useModalA11y`: focus in on open, Tab trapped, Escape closes,
          scroll locked, focus returned. This was a bare overlay with a
          close handler and nothing else a dialog owes a keyboard user. */}
      <Card
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tenant details"
        tabIndex={-1}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <CardHeader className="flex flex-row items-center justify-between border-b shrink-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isNew ? 'Create Tenant' : (general.displayName || general.name)}
              {tenant && (
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {tenant.status}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Configure organization settings and branding</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="gap-2">
                <Eye className="icon-sm" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="icon-sm" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          {previewMode && !isNew ? (
            <TenantPreview general={general} branding={branding} />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="general" className="gap-1.5"><Settings className="icon-sm" />General</TabsTrigger>
                <TabsTrigger value="branding" className="gap-1.5"><Palette className="icon-sm" />Colors & Fonts</TabsTrigger>
                <TabsTrigger value="media" className="gap-1.5"><ImageIcon className="icon-sm" />Media</TabsTrigger>
                <TabsTrigger value="content" className="gap-1.5"><FileText className="icon-sm" />Content</TabsTrigger>
                <TabsTrigger value="links" className="gap-1.5"><Globe className="icon-sm" />Links & Legal</TabsTrigger>
                {!isNew && <TabsTrigger value="email" className="gap-1.5"><Mail className="icon-sm" />Email</TabsTrigger>}
              </TabsList>

              {saveError && (
                <div className="mb-4 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive-accessible flex items-center gap-2">
                  <AlertTriangle className="icon-sm shrink-0" />
                  {saveError}
                </div>
              )}

              {/* General tab */}
              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Internal Name *</label>
                    <Input value={general.name} onChange={e => setGeneral(p => ({ ...p, name: e.target.value }))} placeholder="acme-corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL Slug *</label>
                    <Input value={general.slug} onChange={e => setGeneral(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="acme" />
                    <p className="text-xs text-muted-foreground">Public URL: /t/{general.slug || 'slug'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input value={general.displayName} onChange={e => setGeneral(p => ({ ...p, displayName: e.target.value }))} placeholder="Acme Corporation" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <Input value={general.website} onChange={e => setGeneral(p => ({ ...p, website: e.target.value }))} placeholder="https://acme.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Input value={general.shortDescription} onChange={e => setGeneral(p => ({ ...p, shortDescription: e.target.value }))} placeholder="One-line description shown in listings" maxLength={160} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Description</label>
                  <textarea value={general.description} onChange={e => setGeneral(p => ({ ...p, description: e.target.value }))} placeholder="Detailed description of the organization..." className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">About Text (long-form landing page)</label>
                  <textarea value={general.aboutText} onChange={e => setGeneral(p => ({ ...p, aboutText: e.target.value }))} placeholder="Full about section displayed on the tenant landing page..." className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input value={general.logoUrl} onChange={e => setGeneral(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://cdn.acme.com/logo.png" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Favicon URL</label>
                    <Input value={general.faviconUrl} onChange={e => setGeneral(p => ({ ...p, faviconUrl: e.target.value }))} placeholder="https://cdn.acme.com/favicon.ico" />
                  </div>
                </div>
                {!isNew && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex gap-2">
                      {(['draft', 'active', 'suspended'] as const).map(s => (
                        <button key={s} type="button" onClick={() => setGeneral(p => ({ ...p, status: s }))}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${general.status === s ? 'border-primary bg-primary/10 text-primary-accessible' : 'border-border hover:bg-muted/50'}`}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveGeneral} disabled={isSaving || !general.name || !general.slug} className="gap-2">
                    <Save className="icon-sm" />
                    {isSaving ? 'Saving…' : isNew ? 'Create Tenant' : 'Save General'}
                  </Button>
                </div>
              </TabsContent>

              {/* Colors & Fonts tab */}
              <TabsContent value="branding" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Color Palette</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {([['primaryColor', 'Primary'], ['secondaryColor', 'Secondary'], ['accentColor', 'Accent']] as const).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-medium">{label}</label>
                        <div className="flex gap-2">
                          <input type="color" value={(branding as any)[key]} onChange={e => setBranding(p => ({ ...p, [key]: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer p-1" />
                          <Input value={(branding as any)[key]} onChange={e => setBranding(p => ({ ...p, [key]: e.target.value }))} className="flex-1 font-mono text-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg border flex gap-2">
                    {['primaryColor', 'secondaryColor', 'accentColor'].map(k => (
                      <div key={k} className="flex-1 h-10 rounded-md" style={{ backgroundColor: (branding as any)[k] }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Background Style</h4>
                  <div className="flex gap-2 flex-wrap">
                    {BG_STYLES.map(s => (
                      <button key={s} type="button" onClick={() => setBranding(p => ({ ...p, backgroundStyle: s }))}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${branding.backgroundStyle === s ? 'border-primary bg-primary/10 text-primary-accessible' : 'border-border hover:bg-muted/50'}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm flex items-center gap-2"><Type className="icon-sm" />Typography</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Heading Font</label>
                      <select value={branding.headingFont} onChange={e => setBranding(p => ({ ...p, headingFont: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Body Font</label>
                      <select value={branding.bodyFont} onChange={e => setBranding(p => ({ ...p, bodyFont: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                {!isNew && (
                  <div className="flex justify-end pt-2 gap-2">
                    <Button onClick={handleSaveBranding} disabled={isBrandingSaving} className="gap-2">
                      <Save className="icon-sm" />
                      {isBrandingSaving ? 'Saving…' : 'Save Colors & Fonts'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Media tab */}
              <TabsContent value="media" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hero Image URL</label>
                  <Input value={branding.heroImageUrl} onChange={e => setBranding(p => ({ ...p, heroImageUrl: e.target.value }))} placeholder="https://cdn.acme.com/hero-banner.jpg" />
                  <p className="text-xs text-muted-foreground">Displayed as hero background on /t/{general.slug || 'slug'}</p>
                </div>
                {branding.heroImageUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={branding.heroImageUrl} alt="Hero preview" className="w-full h-40 object-cover" />
                  </div>
                )}
                {!isNew && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveBranding} disabled={isBrandingSaving} className="gap-2">
                      <Save className="icon-sm" />
                      {isBrandingSaving ? 'Saving…' : 'Save Media'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Content tab */}
              <TabsContent value="content" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hero Title</label>
                    <Input value={branding.heroTitle} onChange={e => setBranding(p => ({ ...p, heroTitle: e.target.value }))} placeholder="Welcome to Our Innovation Hub" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CTA Button Label</label>
                    <Input value={branding.ctaLabel} onChange={e => setBranding(p => ({ ...p, ctaLabel: e.target.value }))} placeholder="Get Started" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hero Subtitle</label>
                  <textarea value={branding.heroSubtitle} onChange={e => setBranding(p => ({ ...p, heroSubtitle: e.target.value }))} placeholder="Connect with founders, mentors, and investors..." className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CTA URL</label>
                  <Input value={branding.ctaUrl} onChange={e => setBranding(p => ({ ...p, ctaUrl: e.target.value }))} placeholder="/register or https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">About / Long-form Content</label>
                  <textarea value={branding.aboutText} onChange={e => setBranding(p => ({ ...p, aboutText: e.target.value }))} placeholder="About section content shown on the landing page..." className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Onboarding Intro Text</label>
                    <textarea value={branding.onboardingIntroText} onChange={e => setBranding(p => ({ ...p, onboardingIntroText: e.target.value }))} placeholder="Welcome! Let's set up your profile..." className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dashboard Welcome Message</label>
                    <textarea value={branding.dashboardWelcomeText} onChange={e => setBranding(p => ({ ...p, dashboardWelcomeText: e.target.value }))} placeholder="Here's what's happening..." className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Community Naming</label>
                  <Input value={branding.communityNaming} onChange={e => setBranding(p => ({ ...p, communityNaming: e.target.value }))} placeholder='Custom label e.g. "Program", "Cohort", "Network"' />
                  <p className="text-xs text-muted-foreground">Replaces the word "community" in the UI for this tenant</p>
                </div>
                {!isNew && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveBranding} disabled={isBrandingSaving} className="gap-2">
                      <Save className="icon-sm" />
                      {isBrandingSaving ? 'Saving…' : 'Save Content'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Links & Legal tab */}
              <TabsContent value="links" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Support Email</label>
                    <Input type="email" value={branding.supportEmail} onChange={e => setBranding(p => ({ ...p, supportEmail: e.target.value }))} placeholder="support@acme.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Branding Website URL</label>
                    <Input value={branding.websiteUrl} onChange={e => setBranding(p => ({ ...p, websiteUrl: e.target.value }))} placeholder="https://acme.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Privacy Policy URL</label>
                    <Input value={branding.privacyPolicyUrl} onChange={e => setBranding(p => ({ ...p, privacyPolicyUrl: e.target.value }))} placeholder="https://acme.com/privacy" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Terms of Service URL</label>
                    <Input value={branding.termsUrl} onChange={e => setBranding(p => ({ ...p, termsUrl: e.target.value }))} placeholder="https://acme.com/terms" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cookie Policy URL</label>
                    <Input value={branding.cookiePolicyUrl} onChange={e => setBranding(p => ({ ...p, cookiePolicyUrl: e.target.value }))} placeholder="https://acme.com/cookies" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">LinkedIn</label>
                    <Input value={branding.linkedinUrl} onChange={e => setBranding(p => ({ ...p, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/company/acme" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twitter / X</label>
                    <Input value={branding.twitterUrl} onChange={e => setBranding(p => ({ ...p, twitterUrl: e.target.value }))} placeholder="https://x.com/acme" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instagram</label>
                    <Input value={branding.instagramUrl} onChange={e => setBranding(p => ({ ...p, instagramUrl: e.target.value }))} placeholder="https://instagram.com/acme" />
                  </div>
                </div>
                {!isNew && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveBranding} disabled={isBrandingSaving} className="gap-2">
                      <Save className="icon-sm" />
                      {isBrandingSaving ? 'Saving…' : 'Save Links'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Email tab */}
              {!isNew && (
                <TabsContent value="email" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Sender Name</label>
                      <Input value={branding.emailFromName} onChange={e => setBranding(p => ({ ...p, emailFromName: e.target.value }))} placeholder="Acme Startup Network" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Footer Text</label>
                    <textarea value={branding.emailFooterText} onChange={e => setBranding(p => ({ ...p, emailFooterText: e.target.value }))} placeholder="© 2025 Acme Corp. All rights reserved. | Powered by CoFounderBay" className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveBranding} disabled={isBrandingSaving} className="gap-2">
                      <Save className="icon-sm" />
                      {isBrandingSaving ? 'Saving…' : 'Save Email Settings'}
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t shrink-0">
          <div className="flex items-center gap-2">
            {tenant && (
              <>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={`/t/${tenant.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="icon-sm" />
                    View Public Page
                  </a>
                </Button>
                {b?.isBrandingActive ? (
                  <Button variant="outline" size="sm" onClick={() => unpublishMut.mutate()} className="gap-2 text-status-warning border-status-warning-border hover:bg-status-warning-bg">
                    Unpublish Branding
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => publishMut.mutate()} disabled={publishMut.isPending} className="gap-2 text-status-success border-status-success-border hover:bg-status-success-bg">
                    <Check className="icon-sm" />
                    Publish Branding
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {tenant && (
              <Button variant="ghost" size="sm" className="gap-2 text-destructive-accessible hover:text-destructive-accessible" onClick={async () => {
                if (await confirm({
                  title: <BilingualText en={`Delete tenant “${tenant.name}”?`} el={`Διαγραφή tenant “${tenant.name}”;`} />,
                  description: TENANT_DELETE_DESCRIPTION,
                  confirmLabel: <BilingualText en="Delete" el="Διαγραφή" compact />,
                })) deleteMut.mutate();
              }}>
                <Trash2 className="icon-sm" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {isNew && (
              <Button onClick={handleSaveGeneral} disabled={isSaving || !general.name || !general.slug} className="gap-2">
                <Plus className="icon-sm" />
                {isSaving ? 'Creating…' : 'Create Tenant'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function TenantPreview({
  general,
  branding,
}: {
  general: { displayName: string; logoUrl: string; name: string };
  branding: { primaryColor: string; secondaryColor: string; accentColor: string; heroTitle: string; heroSubtitle: string; ctaLabel: string; ctaUrl: string; heroImageUrl: string; aboutText: string; supportEmail: string };
}) {
  const displayName = general.displayName || general.name || 'Organization';
  return (
    <div className="p-6">
      <div className="rounded-lg border overflow-hidden">
        {/* Preview Header */}
        <div className="p-4 flex items-center justify-between" style={{ backgroundColor: branding.primaryColor }}>
          {general.logoUrl ? (
            <img src={general.logoUrl} alt="" className="h-8 object-contain" />
          ) : (
            <span className="text-white font-semibold">{displayName}</span>
          )}
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded bg-white/20" />
            <div className="h-8 w-16 rounded bg-white/20" />
          </div>
        </div>

        {/* Preview Hero */}
        <div
          className="p-8 text-center relative"
          style={branding.heroImageUrl ? { backgroundImage: `url(${branding.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `linear-gradient(135deg, ${branding.primaryColor}22, ${branding.secondaryColor}22)` }}
        >
          <h1 className="text-2xl font-bold mb-2">{branding.heroTitle || `Welcome to ${displayName}`}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{branding.heroSubtitle || 'Connect with founders, mentors, and investors in our ecosystem.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: branding.primaryColor }}>
              {branding.ctaLabel || 'Get Started'}
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}>
              Learn More
            </button>
          </div>
        </div>

        {/* About section */}
        {branding.aboutText && (
          <div className="p-6 bg-muted/20">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-sm text-muted-foreground">{branding.aboutText}</p>
          </div>
        )}

        {/* Preview Footer */}
        <div className="p-4 border-t bg-muted/30 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {displayName}. All rights reserved.</p>
          {branding.supportEmail && <p className="mt-1">Contact: {branding.supportEmail}</p>}
        </div>
      </div>
    </div>
  );
}
