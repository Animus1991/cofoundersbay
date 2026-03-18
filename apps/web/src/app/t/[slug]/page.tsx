'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTenantBySlug, type TenantItem } from '@/lib/api';
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

function TenantLanding({ tenant }: { tenant: TenantItem }) {
  const b = tenant.branding;
  const primaryHsl = b?.primaryColor ? hexToHsl(b.primaryColor) : null;

  return (
    <div
      className="min-h-screen bg-background"
      style={primaryHsl ? { '--primary': primaryHsl } as React.CSSProperties : undefined}
    >
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="mx-auto mb-6 h-16 w-auto rounded-lg"
            />
          )}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-4">
            {b?.heroTitle || tenant.displayName || tenant.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 mb-8">
            {b?.heroSubtitle || tenant.description || 'Join our startup ecosystem'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                {b?.ctaLabel || 'Get Started'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            {tenant.website && (
              <a href={tenant.website} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                  <Globe className="h-4 w-4" />
                  Learn More
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Users, title: 'Connect', desc: 'Find co-founders, mentors, and collaborators' },
            { icon: Sparkles, title: 'AI Matching', desc: 'Smart compatibility scoring for better teams' },
            { icon: Shield, title: 'Trusted Network', desc: 'Verified profiles and moderated community' },
          ].map((f) => (
            <Card key={f.title} className="text-center">
              <CardContent className="pt-6">
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

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <Briefcase className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Ready to build your next startup?</h2>
            <p className="text-muted-foreground mb-6">
              Join {tenant.displayName || tenant.name} and connect with the right people.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                {b?.ctaLabel || 'Join Now'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">{tenant.status}</Badge>
            <span className="text-sm text-muted-foreground">{tenant.displayName || tenant.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {b?.supportEmail && (
              <a href={`mailto:${b.supportEmail}`} className="text-muted-foreground hover:text-foreground">
                <Mail className="h-4 w-4" />
              </a>
            )}
            {b?.linkedinUrl && (
              <a href={b.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {b?.twitterUrl && (
              <a href={b.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {b?.privacyPolicyUrl && (
              <a href={b.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Privacy <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {b?.termsUrl && (
              <a href={b.termsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Terms <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TenantPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => getTenantBySlug(slug),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-10 w-32 mt-4" />
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Organization not found</h1>
        <p className="text-muted-foreground">The ecosystem you&apos;re looking for doesn&apos;t exist or is not active.</p>
        <Link href="/">
          <Button variant="outline">Back to CoFounderBay</Button>
        </Link>
      </div>
    );
  }

  return <TenantLanding tenant={tenant} />;
}
