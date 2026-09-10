'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette, Type, FileText, Link2, Mail, Tag,
  Eye, Save, Globe, AlertCircle, CheckCircle2,
  Loader2, ExternalLink, Settings, Building2, Image, Camera,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTenant } from '@/components/providers/TenantContext';
import {
  getTenantBranding,
  updateTenantBranding,
  publishTenantBranding,
  unpublishTenantBranding,
  uploadAvatar,
  type TenantBranding,
} from '@/lib/api';
import { ImageCropperTrigger } from '@/components/ui/image-cropper';
import { analytics } from '@/lib/analytics';

// ── Color swatch + input ───────────────────────────────────────────────────────

function ColorField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value || '#6366f1'}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            id={`color-${label}`}
          />
          <label
            htmlFor={`color-${label}`}
            className="block w-10 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
            style={{ backgroundColor: value || '#6366f1' }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 font-mono text-sm"
          maxLength={7}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

const GOOGLE_FONTS = [
  'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Nunito',
  'Playfair Display', 'Merriweather', 'Source Serif Pro', 'DM Sans',
  'Plus Jakarta Sans', 'Outfit', 'Raleway', 'Montserrat',
];

const BG_STYLES = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'flat', label: 'Flat' },
  { value: 'image', label: 'Hero Image' },
  { value: 'dark', label: 'Dark' },
];

type FormState = Omit<TenantBranding, 'id' | 'tenantId' | 'publishedAt' | 'updatedAt' | 'isBrandingActive'>;

const DEFAULT_FORM: FormState = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#22d3ee',
  backgroundStyle: 'gradient',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  logoUrl: '',
  faviconUrl: '',
  heroImageUrl: '',
  websiteUrl: '',
  heroTitle: '',
  heroSubtitle: '',
  aboutText: '',
  ctaLabel: 'Get Started',
  ctaUrl: '',
  onboardingIntroText: '',
  dashboardWelcomeText: '',
  communityNaming: '',
  roleLabels: {},
  supportEmail: '',
  privacyPolicyUrl: '',
  termsUrl: '',
  cookiePolicyUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  websiteFooterUrl: '',
  emailSignature: '',
  emailLogoUrl: '',
  emailFooterText: '',
  emailFromName: '',
};

export default function TenantBrandingPage() {
  const qc = useQueryClient();
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? '';
  const tenantSlug = activeTenant?.slug ?? '';

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  const { data: branding, isLoading } = useQuery({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => getTenantBranding(tenantId),
    enabled: !!tenantId,
  });

  // Sync remote branding into form once loaded
  useEffect(() => {
    if (!branding) return;
    setForm({
      primaryColor: branding.primaryColor ?? DEFAULT_FORM.primaryColor,
      secondaryColor: branding.secondaryColor ?? DEFAULT_FORM.secondaryColor,
      accentColor: branding.accentColor ?? DEFAULT_FORM.accentColor,
      backgroundStyle: branding.backgroundStyle ?? DEFAULT_FORM.backgroundStyle,
      headingFont: branding.headingFont ?? DEFAULT_FORM.headingFont,
      bodyFont: branding.bodyFont ?? DEFAULT_FORM.bodyFont,
      logoUrl: branding.logoUrl ?? '',
      faviconUrl: branding.faviconUrl ?? '',
      heroImageUrl: branding.heroImageUrl ?? '',
      websiteUrl: branding.websiteUrl ?? '',
      heroTitle: branding.heroTitle ?? '',
      heroSubtitle: branding.heroSubtitle ?? '',
      aboutText: branding.aboutText ?? '',
      ctaLabel: branding.ctaLabel ?? 'Get Started',
      ctaUrl: branding.ctaUrl ?? '',
      onboardingIntroText: branding.onboardingIntroText ?? '',
      dashboardWelcomeText: branding.dashboardWelcomeText ?? '',
      communityNaming: branding.communityNaming ?? '',
      roleLabels: branding.roleLabels ?? {},
      supportEmail: branding.supportEmail ?? '',
      privacyPolicyUrl: branding.privacyPolicyUrl ?? '',
      termsUrl: branding.termsUrl ?? '',
      cookiePolicyUrl: branding.cookiePolicyUrl ?? '',
      linkedinUrl: branding.linkedinUrl ?? '',
      twitterUrl: branding.twitterUrl ?? '',
      instagramUrl: branding.instagramUrl ?? '',
      websiteFooterUrl: branding.websiteFooterUrl ?? '',
      emailSignature: branding.emailSignature ?? '',
      emailLogoUrl: branding.emailLogoUrl ?? '',
      emailFooterText: branding.emailFooterText ?? '',
      emailFromName: branding.emailFromName ?? '',
    });
  }, [branding]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveMutation = useMutation({
    mutationFn: (data: FormState) => updateTenantBranding(tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-branding', tenantId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      void analytics.track('tenant_branding_updated', {
        tenant_id: tenantId,
        has_logo: !!form.logoUrl,
        has_favicon: !!form.faviconUrl,
        has_custom_colors: !!(form.primaryColor !== DEFAULT_FORM.primaryColor || form.secondaryColor !== DEFAULT_FORM.secondaryColor),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishTenantBranding(tenantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-branding', tenantId] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishTenantBranding(tenantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-branding', tenantId] }),
  });

  const handleSave = () => saveMutation.mutate(form);
  const handlePreview = () => {
    if (tenantSlug) window.open(`/t/${tenantSlug}`, '_blank');
  };

  const roleLabels = (form.roleLabels as Record<string, string>) ?? {};
  const setRoleLabel = (role: string, label: string) => {
    setField('roleLabels', { ...roleLabels, [role]: label });
  };

  if (!tenantId) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
            <p className="text-lg font-medium">No organization context</p>
            <p className="text-sm text-muted-foreground">You must be a member of an organization to manage branding.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Palette className="icon-lg text-primary-emphasis" aria-hidden="true" />
              Branding
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Customize your organization's visual identity and content
            </p>
          </div>
          <div className="flex items-center gap-2">
            {branding?.isBrandingActive ? (
              <Badge variant="default" className="gap-1.5 bg-green-600 hover:bg-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Published
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Draft
              </Badge>
            )}
            {tenantSlug && (
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="mr-1.5 icon-sm" aria-hidden="true" />
                Preview
                <ExternalLink className="ml-1.5 icon-2xs opacity-60" aria-hidden="true" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-1.5 icon-sm animate-spin" aria-hidden="true" />
              ) : saved ? (
                <CheckCircle2 className="mr-1.5 icon-sm" aria-hidden="true" />
              ) : (
                <Save className="mr-1.5 icon-sm" aria-hidden="true" />
              )}
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {saveMutation.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-emphasis">
            <AlertCircle className="icon-sm shrink-0" aria-hidden="true" />
            Failed to save changes. Please try again.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="icon-xl animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="colors"><Palette className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Colors</TabsTrigger>
              <TabsTrigger value="typography"><Type className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Typography</TabsTrigger>
              <TabsTrigger value="assets"><Image className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Assets</TabsTrigger>
              <TabsTrigger value="content"><FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Content</TabsTrigger>
              <TabsTrigger value="labels"><Tag className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Labels</TabsTrigger>
              <TabsTrigger value="legal"><Globe className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Legal & Social</TabsTrigger>
              <TabsTrigger value="email"><Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Email</TabsTrigger>
              <TabsTrigger value="publish"><Settings className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Publish</TabsTrigger>
            </TabsList>

            {/* ── Colors ── */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors</CardTitle>
                  <CardDescription>Define your organization's color palette. These are applied as CSS variables throughout the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <ColorField
                      label="Primary Color"
                      value={form.primaryColor ?? '#6366f1'}
                      onChange={(v) => setField('primaryColor', v)}
                      description="Buttons, links, accents"
                    />
                    <ColorField
                      label="Secondary Color"
                      value={form.secondaryColor ?? '#8b5cf6'}
                      onChange={(v) => setField('secondaryColor', v)}
                      description="Secondary actions, hover states"
                    />
                    <ColorField
                      label="Accent Color"
                      value={form.accentColor ?? '#22d3ee'}
                      onChange={(v) => setField('accentColor', v)}
                      description="Highlights, badges, tags"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Background Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {BG_STYLES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setField('backgroundStyle', s.value)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            form.backgroundStyle === s.value
                              ? 'border-primary bg-primary/10 text-primary-emphasis'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border p-5 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Live Preview</p>
                    <div className="flex flex-wrap gap-2">
                      <Button style={{ backgroundColor: form.primaryColor ?? undefined }}>Primary</Button>
                      <Button
                        variant="outline"
                        style={{
                          borderColor: form.secondaryColor ?? undefined,
                          color: form.secondaryColor ?? undefined,
                        }}
                      >
                        Secondary
                      </Button>
                      <Button variant="ghost" style={{ color: form.accentColor ?? undefined }}>
                        Accent
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <div className="h-6 w-16 rounded" style={{ backgroundColor: form.primaryColor ?? '#6366f1' }} />
                      <div className="h-6 w-16 rounded" style={{ backgroundColor: form.secondaryColor ?? '#8b5cf6' }} />
                      <div className="h-6 w-16 rounded" style={{ backgroundColor: form.accentColor ?? '#22d3ee' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Typography ── */}
            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>Choose Google Fonts for headings and body text. They are loaded dynamically per tenant.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(['headingFont', 'bodyFont'] as const).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label>{key === 'headingFont' ? 'Heading Font' : 'Body Font'}</Label>
                      <div className="flex flex-wrap gap-2">
                        {GOOGLE_FONTS.map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => setField(key, font)}
                            className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                              form[key] === font
                                ? 'border-primary bg-primary/10 text-primary-emphasis font-medium'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={form[key] ?? ''}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder="Custom font name..."
                        className="mt-2 max-w-sm"
                      />
                    </div>
                  ))}
                  <div className="rounded-lg border p-5">
                    <p className="text-xs text-muted-foreground mb-3">Preview</p>
                    <p className="text-2xl font-bold mb-1" style={{ fontFamily: form.headingFont ?? 'Inter' }}>
                      {activeTenant?.displayName ?? activeTenant?.name ?? 'Organization Name'}
                    </p>
                    <p className="text-muted-foreground" style={{ fontFamily: form.bodyFont ?? 'Inter' }}>
                      Empowering founders to build the future. Your mission starts here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Assets ── */}
            <TabsContent value="assets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media Assets</CardTitle>
                  <CardDescription>Provide URLs for your logo, favicon, and hero image. Use a CDN or image hosting service.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label>Organization Logo</Label>
                    <div className="flex items-start gap-4">
                      <ImageCropperTrigger
                        cropShape="rect"
                        aspectRatio={2}
                        outputSize={400}
                        title="Crop Organization Logo"
                        onCrop={async (blob, dataUrl) => {
                          try {
                            const file = new File([blob], 'logo.png', { type: 'image/png' });
                            const { upload } = await uploadAvatar(file);
                            setField('logoUrl', upload.url);
                          } catch {
                            // Handle error silently or show toast
                          }
                        }}
                      >
                        <div className="relative group cursor-pointer">
                          {form.logoUrl ? (
                            <img
                              src={form.logoUrl}
                              alt="Logo preview"
                              className="h-16 w-32 rounded-lg border border-border/60 object-contain bg-background/50"
                            />
                          ) : (
                            <div className="h-16 w-32 rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/20">
                              <Image className="icon-lg text-muted-foreground" aria-hidden="true" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="icon-lg text-white" aria-hidden="true" />
                          </div>
                        </div>
                      </ImageCropperTrigger>
                      <div className="flex-1">
                        <Input
                          value={form.logoUrl ?? ''}
                          onChange={(e) => setField('logoUrl', e.target.value)}
                          placeholder="https://..."
                          className="mb-1"
                        />
                        <p className="text-xs text-muted-foreground">Click to crop & upload, or paste URL. Recommended: 400×200px, transparent PNG.</p>
                      </div>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-3">
                    <Label>Favicon</Label>
                    <div className="flex items-start gap-4">
                      <ImageCropperTrigger
                        cropShape="circle"
                        aspectRatio={1}
                        outputSize={64}
                        title="Crop Favicon"
                        onCrop={async (blob, dataUrl) => {
                          try {
                            const file = new File([blob], 'favicon.ico', { type: 'image/png' });
                            const { upload } = await uploadAvatar(file);
                            setField('faviconUrl', upload.url);
                          } catch {
                            // Handle error silently or show toast
                          }
                        }}
                      >
                        <div className="relative group cursor-pointer">
                          {form.faviconUrl ? (
                            <img
                              src={form.faviconUrl}
                              alt="Favicon preview"
                              className="h-8 w-8 rounded border border-border/60 object-contain bg-background/50"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/20">
                              <Image className="icon-2xs text-muted-foreground" aria-hidden="true" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="icon-2xs text-white" aria-hidden="true" />
                          </div>
                        </div>
                      </ImageCropperTrigger>
                      <div className="flex-1">
                        <Input
                          value={form.faviconUrl ?? ''}
                          onChange={(e) => setField('faviconUrl', e.target.value)}
                          placeholder="https://..."
                          className="mb-1"
                        />
                        <p className="text-xs text-muted-foreground">Click to crop & upload, or paste URL. 64×64px, square format.</p>
                      </div>
                    </div>
                  </div>

                  {[
                    { key: 'heroImageUrl' as const, label: 'Hero / Banner Image URL', hint: 'Displayed on the public landing page. Recommended: 1920×1080px.' },
                    { key: 'emailLogoUrl' as const, label: 'Email Logo URL', hint: 'Shown in email headers. Transparent PNG recommended.' },
                  ].map(({ key, label, hint }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Input
                        value={form[key] ?? ''}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">{hint}</p>
                      {form[key] && (
                        <img
                          src={form[key] as string}
                          alt="Preview"
                          className="mt-2 max-h-24 rounded-lg border object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Content ── */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Landing Page Content</CardTitle>
                  <CardDescription>Text shown on the public tenant landing page at /t/{'{slug}'}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Hero Title</Label>
                      <Input
                        value={form.heroTitle ?? ''}
                        onChange={(e) => setField('heroTitle', e.target.value)}
                        placeholder="Your next co-founder is waiting"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Subtitle</Label>
                      <Input
                        value={form.heroSubtitle ?? ''}
                        onChange={(e) => setField('heroSubtitle', e.target.value)}
                        placeholder="Build, connect, grow with your community"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Button Label</Label>
                      <Input
                        value={form.ctaLabel ?? ''}
                        onChange={(e) => setField('ctaLabel', e.target.value)}
                        placeholder="Get Started"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Button URL</Label>
                      <Input
                        value={form.ctaUrl ?? ''}
                        onChange={(e) => setField('ctaUrl', e.target.value)}
                        placeholder="/register"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>About Text</Label>
                    <Textarea
                      rows={4}
                      value={form.aboutText ?? ''}
                      onChange={(e) => setField('aboutText', e.target.value)}
                      placeholder="Long-form description shown on your public landing page..."
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Platform Copy</CardTitle>
                  <CardDescription>Customized text inside the platform for your members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Dashboard Welcome Message</Label>
                    <Input
                      value={form.dashboardWelcomeText ?? ''}
                      onChange={(e) => setField('dashboardWelcomeText', e.target.value)}
                      placeholder="Welcome back! Continue building your network."
                    />
                    <p className="text-xs text-muted-foreground">Shown on login page and dashboard header.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Onboarding Introduction</Label>
                    <Textarea
                      rows={3}
                      value={form.onboardingIntroText ?? ''}
                      onChange={(e) => setField('onboardingIntroText', e.target.value)}
                      placeholder="Welcome to [Organization]! Let's set up your profile..."
                    />
                    <p className="text-xs text-muted-foreground">Displayed at the start of the onboarding flow.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Labels ── */}
            <TabsContent value="labels" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Naming</CardTitle>
                  <CardDescription>Override default platform terminology with organization-specific language.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Community Naming</Label>
                    <Input
                      value={form.communityNaming ?? ''}
                      onChange={(e) => setField('communityNaming', e.target.value)}
                      placeholder="Community (default)"
                    />
                    <p className="text-xs text-muted-foreground">Replace "Community" with e.g. "Program", "Cohort", "Circle".</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Role Labels</CardTitle>
                  <CardDescription>Customize how user roles are displayed to your members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { role: 'founder', default: 'Founder' },
                    { role: 'investor', default: 'Investor' },
                    { role: 'mentor', default: 'Mentor' },
                    { role: 'member', default: 'Member' },
                  ].map(({ role, default: def }) => (
                    <div key={role} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-muted-foreground capitalize">{def}</span>
                      <span className="text-muted-foreground">→</span>
                      <Input
                        className="flex-1 max-w-xs"
                        value={roleLabels[role] ?? ''}
                        onChange={(e) => setRoleLabel(role, e.target.value)}
                        placeholder={def}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Legal & Social ── */}
            <TabsContent value="legal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Legal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { key: 'supportEmail' as const, label: 'Support Email', placeholder: 'support@yourorg.com', type: 'email' },
                      { key: 'websiteUrl' as const, label: 'Organization Website', placeholder: 'https://yourorg.com', type: 'url' },
                      { key: 'privacyPolicyUrl' as const, label: 'Privacy Policy URL', placeholder: 'https://...', type: 'url' },
                      { key: 'termsUrl' as const, label: 'Terms of Service URL', placeholder: 'https://...', type: 'url' },
                      { key: 'cookiePolicyUrl' as const, label: 'Cookie Policy URL', placeholder: 'https://...', type: 'url' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-2">
                        <Label>{label}</Label>
                        <Input
                          value={form[key] ?? ''}
                          onChange={(e) => setField(key, e.target.value)}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { key: 'linkedinUrl' as const, label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
                      { key: 'twitterUrl' as const, label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
                      { key: 'instagramUrl' as const, label: 'Instagram', placeholder: 'https://instagram.com/...' },
                      { key: 'websiteFooterUrl' as const, label: 'Footer Website', placeholder: 'https://...' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-2">
                        <Label>{label}</Label>
                        <div className="flex items-center gap-2">
                          <Link2 className="icon-sm text-muted-foreground shrink-0" aria-hidden="true" />
                          <Input
                            value={form[key] ?? ''}
                            onChange={(e) => setField(key, e.target.value)}
                            placeholder={placeholder}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Email ── */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Branding</CardTitle>
                  <CardDescription>Customize how your organization appears in outgoing emails.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Sender Name</Label>
                      <Input
                        value={form.emailFromName ?? ''}
                        onChange={(e) => setField('emailFromName', e.target.value)}
                        placeholder="TechHub Accelerator"
                      />
                      <p className="text-xs text-muted-foreground">Shown as "From" in emails.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Logo URL</Label>
                      <Input
                        value={form.emailLogoUrl ?? ''}
                        onChange={(e) => setField('emailLogoUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Footer Text</Label>
                    <Textarea
                      rows={2}
                      value={form.emailFooterText ?? ''}
                      onChange={(e) => setField('emailFooterText', e.target.value)}
                      placeholder="© 2025 TechHub Accelerator. Powered by CoFounderBay."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Signature</Label>
                    <Textarea
                      rows={3}
                      value={form.emailSignature ?? ''}
                      onChange={(e) => setField('emailSignature', e.target.value)}
                      placeholder="The TechHub Accelerator Team&#10;support@techhub.com | techhub.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Publish ── */}
            <TabsContent value="publish" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publish Branding</CardTitle>
                  <CardDescription>
                    When active, your branding is applied to all members who access the platform through your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Branding Status</p>
                      <p className="text-sm text-muted-foreground">
                        {branding?.isBrandingActive
                          ? `Published ${branding.publishedAt ? `on ${new Date(branding.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
                          : 'Not yet published — save changes first, then publish.'}
                      </p>
                    </div>
                    <Switch
                      checked={branding?.isBrandingActive ?? false}
                      onCheckedChange={(checked) => {
                        if (checked) publishMutation.mutate();
                        else unpublishMutation.mutate();
                      }}
                      disabled={publishMutation.isPending || unpublishMutation.isPending}
                    />
                  </div>

                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-sm font-medium">Safeguards</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${form.primaryColor ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                        Primary color defined
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${form.heroTitle ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                        Hero title set
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${form.supportEmail ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                        Support email configured
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${form.privacyPolicyUrl && form.termsUrl ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                        Legal links provided
                      </li>
                    </ul>
                  </div>

                  {tenantSlug && (
                    <Button variant="outline" className="w-full" onClick={handlePreview}>
                      <Eye className="mr-2 icon-sm" aria-hidden="true" />
                      Preview Public Landing Page
                      <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                    </Button>
                  )}

                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? (
                        <Loader2 className="mr-2 icon-sm animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="mr-2 icon-sm" aria-hidden="true" />
                      )}
                      Save Draft
                    </Button>
                    {!branding?.isBrandingActive && (
                      <Button
                        variant="default"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => { saveMutation.mutate(form); publishMutation.mutate(); }}
                        disabled={saveMutation.isPending || publishMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 icon-sm" aria-hidden="true" />
                        Save & Publish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
