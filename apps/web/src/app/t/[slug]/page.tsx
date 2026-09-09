'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTenantBySlug, discoverSSOByTenant, getSSOLoginUrl, type TenantItem, type SSODiscoveryResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Briefcase,
  ChevronRight,
  Globe,
  Mail,
  ExternalLink,
  Sparkles,
  Shield,
  Linkedin,
  Twitter,
  Instagram,
  Building2,
  LogIn,
} from 'lucide-react';
import Link from 'next/link';

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function TenantLanding({ tenant, sso }: { tenant: TenantItem; sso: SSODiscoveryResult | null }) {
  const b = tenant.branding;

  const cssVars: React.CSSProperties = {};
  if (b?.primaryColor) {
    const h = hexToHsl(b.primaryColor);
    if (h) {
      (cssVars as any)['--primary'] = h;
      (cssVars as any)['--primary-foreground'] = '0 0% 100%';
    }
  }
  if (b?.secondaryColor) {
    const h = hexToHsl(b.secondaryColor);
    if (h) (cssVars as any)['--secondary'] = h;
  }
  if (b?.accentColor) {
    const h = hexToHsl(b.accentColor);
    if (h) (cssVars as any)['--accent'] = h;
  }

  const handleSSOLogin = () => {
    if (!sso?.provider?.id) return;
    window.location.href = getSSOLoginUrl(sso.provider.id, `/t/${tenant.slug}`);
  };

  return (
    <div className="min-h-screen bg-background" style={cssVars}>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={b?.heroImageUrl
          ? { backgroundImage: `url(${b.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined}
      >
        {/* Overlay — always present so text is readable over both gradient and photo heroes */}
        <div
          className="absolute inset-0"
          style={b?.heroImageUrl
            ? { background: 'linear-gradient(to bottom right, rgba(0,0,0,0.65), rgba(0,0,0,0.45))' }
            : { background: 'linear-gradient(to bottom right, var(--tw-gradient-from, oklch(0.6 0.2 264)), var(--tw-gradient-to, oklch(0.45 0.2 264)))' }}
        />
        {/* Subtle light burst */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          {tenant.logoUrl && (
            <img src={tenant.logoUrl} alt={tenant.name} className="mx-auto mb-6 h-16 w-auto rounded-xl shadow-lg" />
          )}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-4 drop-shadow">
            {b?.heroTitle || tenant.displayName || tenant.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80 mb-8 drop-shadow-sm">
            {b?.heroSubtitle || tenant.shortDescription || tenant.description || 'Join our startup ecosystem'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* SSO login button (shown first if SSO available) */}
            {sso?.ssoAvailable && sso.provider && (
              <Button
                size="lg"
                onClick={handleSSOLogin}
                className="gap-2 bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Building2 className="icon-sm" aria-hidden="true" />
                {sso.provider.loginButtonText || 'Sign in with Organization SSO'}
              </Button>
            )}

            <Link href={b?.ctaUrl || '/register'}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 shadow">
                {b?.ctaLabel || 'Get Started'}
                <ChevronRight className="icon-sm" aria-hidden="true" />
              </Button>
            </Link>

            <Link href="/login">
              <Button size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10 gap-2">
                <LogIn className="icon-sm" aria-hidden="true" />
                Sign In
              </Button>
            </Link>
          </div>

          {sso?.ssoRequired && (
            <p className="mt-4 text-xs text-white/60">This organization requires SSO authentication for member access.</p>
          )}
        </div>
      </section>

      {/* About section — shown only when aboutText is set */}
      {(b?.aboutText || tenant.aboutText) && (
        <section className="bg-muted/30 border-b border-border/60">
          <div className="mx-auto max-w-4xl px-6 py-14">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-1">
                <Building2 className="icon-md text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3">About {tenant.displayName || tenant.name}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {b?.aboutText || tenant.aboutText}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Users, title: b?.communityNaming ? `Join the ${b.communityNaming}` : 'Connect', desc: 'Find co-founders, mentors, and collaborators' },
            { icon: Sparkles, title: 'AI Matching', desc: 'Smart compatibility scoring for better teams' },
            { icon: Shield, title: 'Trusted Network', desc: 'Verified profiles and moderated community' },
          ].map((f) => (
            <Card key={f.title} className="text-center border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <Briefcase className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">
              {b?.dashboardWelcomeText || `Ready to join ${tenant.displayName || tenant.name}?`}
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect with the right people and build something great.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {sso?.ssoAvailable && sso.provider && (
                <Button onClick={handleSSOLogin} variant="outline" className="gap-2">
                  <Building2 className="icon-sm" aria-hidden="true" />
                  {sso.provider.loginButtonText || 'SSO Login'}
                </Button>
              )}
              <Link href={b?.ctaUrl || '/register'}>
                <Button size="lg" className="gap-2">
                  {b?.ctaLabel || 'Join Now'}
                  <ChevronRight className="icon-sm" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl
              ? <img src={tenant.logoUrl} alt="" className="h-6 w-auto" />
              : <Badge variant="secondary" className="text-xs">{tenant.status}</Badge>}
            <span className="text-sm font-medium">{tenant.displayName || tenant.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {b?.supportEmail && (
              <a href={`mailto:${b.supportEmail}`} className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="icon-sm" aria-hidden="true" />
              </a>
            )}
            {(b?.websiteUrl || tenant.website) && (
              <a href={b?.websiteUrl || tenant.website!} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="icon-sm" aria-hidden="true" />
              </a>
            )}
            {b?.linkedinUrl && (
              <a href={b.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="icon-sm" aria-hidden="true" />
              </a>
            )}
            {b?.twitterUrl && (
              <a href={b.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="icon-sm" aria-hidden="true" />
              </a>
            )}
            {b?.instagramUrl && (
              <a href={b.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="icon-sm" aria-hidden="true" />
              </a>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {b?.privacyPolicyUrl && (
                <a href={b.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                  Privacy <ExternalLink className="icon-2xs" aria-hidden="true" />
                </a>
              )}
              {b?.termsUrl && (
                <a href={b.termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                  Terms <ExternalLink className="icon-2xs" aria-hidden="true" />
                </a>
              )}
              {b?.cookiePolicyUrl && (
                <a href={b.cookiePolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                  Cookies <ExternalLink className="icon-2xs" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
        {b?.emailFooterText && (
          <div className="border-t border-border/40 mx-auto max-w-5xl px-6 py-3">
            <p className="text-xs text-muted-foreground text-center">{b.emailFooterText}</p>
          </div>
        )}
      </footer>
    </div>
  );
}

export default function TenantPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => getTenantBySlug(slug),
    staleTime: 5 * 60_000,
  });

  const { data: sso } = useQuery({
    queryKey: ['tenant', slug, 'sso'],
    queryFn: () => discoverSSOByTenant(slug),
    enabled: !!tenant,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[50vh] bg-muted animate-pulse" />
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid gap-4 sm:grid-cols-3 pt-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-6">
        <Building2 className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Organization not found</h1>
        <p className="text-muted-foreground max-w-sm">The ecosystem you&apos;re looking for doesn&apos;t exist or is not active.</p>
        <Link href="/">
          <Button variant="outline">Back to CoFounderBay</Button>
        </Link>
      </div>
    );
  }

  return <TenantLanding tenant={tenant} sso={sso ?? null} />;
}
