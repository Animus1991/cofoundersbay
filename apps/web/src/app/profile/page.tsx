'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Edit,
  Share2,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Building2,
  Languages,
  CheckCircle,
  AlertCircle,
  Shield,
  Mail,
  Target,
  Rocket,
  Users,
  DollarSign,
} from 'lucide-react';
import { getMeProfile } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { SkillChip } from '@/components/common/SkillChip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

type ProfileData = Awaited<ReturnType<typeof getMeProfile>>['profile'];

function ProfileCompletionCard({ profile }: { profile: NonNullable<ProfileData> }) {
  const items = [
    { done: !!profile.displayName, label: 'Display name' },
    { done: !!profile.headline, label: 'Headline' },
    { done: !!profile.bio, label: 'Bio' },
    { done: (profile.skills?.length ?? 0) >= 3, label: '3+ skills' },
    { done: !!profile.location, label: 'Location' },
    { done: !!profile.avatarUrl, label: 'Avatar' },
  ];
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  if (pct === 100) return null;

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Profile completion</p>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                item.done
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary/60 text-muted-foreground'
              }`}
            >
              {item.done
                ? <CheckCircle className="h-3 w-3 shrink-0" />
                : <AlertCircle className="h-3 w-3 shrink-0" />}
              {item.label}
            </div>
          ))}
        </div>
        <Link href="/profile/edit">
          <Button size="sm" variant="secondary" className="w-full gap-2 mt-1">
            <Edit className="h-3.5 w-3.5" />
            Complete profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function VerificationCard({ email }: { email?: string | null }) {
  const items = [
    { label: 'Email verified', verified: !!email, icon: Mail },
    { label: 'LinkedIn connected', verified: false, icon: Linkedin },
    { label: 'GitHub connected', verified: false, icon: Github },
    { label: 'Identity verified', verified: false, icon: Shield },
  ];
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.map(({ label, verified, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${verified ? 'bg-primary/15' : 'bg-secondary/60'}`}>
              <Icon className={`h-3.5 w-3.5 ${verified ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className={verified ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
            {verified
              ? <CheckCircle className="ml-auto h-3.5 w-3.5 text-primary" />
              : <span className="ml-auto text-[10px] text-muted-foreground/60">Not connected</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  founder: Briefcase,
  mentor: GraduationCap,
  investor: TrendingUp,
  org: Building2,
};

function RoleDetails({ role, payload }: { role: string; payload: Record<string, unknown> }) {
  const Icon = ROLE_ICONS[role] ?? Briefcase;

  const renderList = (arr: unknown, label: string): React.ReactNode => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {(arr as string[]).map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderValue = (val: unknown, label: string): React.ReactNode => {
    if (!val || (typeof val === 'string' && !val.trim())) return null;
    return (
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{String(val)}</p>
      </div>
    );
  };

  const linkEntries = payload.links && typeof payload.links === 'object'
    ? (
        [
          { key: 'websiteUrl', icon: Globe, label: 'Website' },
          { key: 'linkedinUrl', icon: Linkedin, label: 'LinkedIn' },
          { key: 'githubUrl', icon: Github, label: 'GitHub' },
          { key: 'twitterUrl', icon: Twitter, label: 'Twitter/X' },
        ] as { key: string; icon: React.ElementType; label: string }[]
      ).reduce<React.ReactNode[]>((acc, { key, icon: Icon2, label }) => {
        const url = (payload.links as Record<string, unknown>)[key];
        if (typeof url !== 'string' || !url.trim()) return acc;
        const href = url.startsWith('http') ? url : `https://${url}`;
        acc.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <Icon2 className="h-3.5 w-3.5" />
            {label}
          </a>
        );
        return acc;
      }, [])
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {role.charAt(0).toUpperCase() + role.slice(1)} details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {role === 'founder' && (
          <>
            {renderValue(payload.stage, 'Startup stage')}
            {renderValue(payload.commitment, 'Commitment')}
            {renderList(payload.rolesSought, 'Looking for')}
            {renderList(payload.industries ?? (payload.industry ? [payload.industry] : []), 'Industries')}
          </>
        )}
        {role === 'mentor' && (
          <>
            {renderList(payload.expertiseAreas, 'Expertise areas')}
            {renderValue(payload.availability, 'Availability')}
            {renderValue(payload.meetingPreferences, 'Meeting preference')}
            {renderValue(payload.hourlyRate, 'Rate')}
          </>
        )}
        {role === 'investor' && (
          <>
            {renderList(payload.investmentFocus, 'Investment focus')}
            {renderList(payload.stages, 'Investment stages')}
            {renderValue(payload.typicalCheckSize ?? [payload.checkSizeMin, payload.checkSizeMax].filter(Boolean).join(' – '), 'Check size')}
            {renderList(payload.geography, 'Geography')}
          </>
        )}
        {role === 'org' && (
          <>
            {renderValue(payload.organizationType, 'Organization type')}
            {renderList(payload.programTypes, 'Programs')}
          </>
        )}
        {linkEntries && linkEntries.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links</p>
            <div className="flex flex-wrap gap-2">
              {linkEntries}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { success } = useToast();

  const { data: meData, isLoading, error } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: getMeProfile,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  React.useEffect(() => {
    if (error) { router.replace('/login'); return; }
    if (meData && !meData.hasCompletedOnboarding) { router.replace('/onboarding'); }
  }, [meData, error, router]);

  const profile = meData?.profile ?? null;

  const handleShare = () => {
    if (!profile) return;
    const url = `${window.location.origin}/profiles/${profile.userId}`;
    navigator.clipboard.writeText(url).then(() =>
      success('Link copied!', 'Your profile link is in your clipboard.')
    );
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-80">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Preparing your profile...</p>
      </div>
    );
  }

  const rolePayload = (profile.rolePayload ?? {}) as Record<string, unknown>;

  return (
    <AppShell
      title="My Profile"
      description="Your public presence in the CoFounderBay ecosystem"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} title="Copy profile link">
            <Share2 className="h-4 w-4" />
          </Button>
          <Link href="/profile/edit">
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Edit profile
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left column: identity card */}
        <div className="space-y-4">
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                  <AvatarImage src={profile.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                    {profile.displayName?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{profile.displayName}</h2>
                {profile.headline && (
                  <p className="text-sm text-muted-foreground">{profile.headline}</p>
                )}
                <div className="flex justify-center pt-1">
                  <RoleBadge role={profile.role} />
                </div>
              </div>

              <div className="w-full space-y-2 text-sm text-muted-foreground">
                {profile.location && (
                  <p className="flex items-center justify-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {profile.location}
                  </p>
                )}
                {profile.timezone && (
                  <p className="flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {profile.timezone}
                  </p>
                )}
                {profile.languages?.length ? (
                  <p className="flex items-center justify-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 shrink-0" />
                    {profile.languages.join(' · ')}
                  </p>
                ) : null}
              </div>

              <div className="flex w-full gap-2 pt-2">
                <Link href="/profile/edit" className="flex-1">
                  <Button variant="secondary" className="w-full gap-2" size="sm">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile completion meter */}
          <ProfileCompletionCard profile={profile} />

          {/* Skills */}
          {profile.skills?.length ? (
            <Card className="animate-fade-in stagger-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-0">
                {profile.skills.map((s) => (
                  <SkillChip key={s.skillId} label={s.skillName} />
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Verification status */}
          <VerificationCard email={profile.email} />
        </div>

        {/* Right column: bio + role details */}
        <div className="space-y-4">
          {/* Bio */}
          {profile.bio && (
            <Card className="animate-fade-in stagger-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Intent cards — What I'm looking for */}
          {(() => {
            const p = rolePayload as Record<string, string | undefined>;
            const cards: { icon: React.ElementType; label: string; value: string | undefined }[] = [
              { icon: Target, label: 'Looking for', value: p.lookingFor },
              { icon: Rocket, label: 'Startup stage', value: p.stage },
              { icon: Users, label: 'Commitment', value: p.commitment },
              { icon: DollarSign, label: 'Compensation', value: p.compensation },
            ].filter((c) => c.value);
            if (!cards.length) return null;
            return (
              <Card className="animate-fade-in stagger-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What I&apos;m Looking For</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 pt-0">
                  {cards.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-border/30 bg-secondary/30 p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* Role-specific details */}
          {Object.keys(rolePayload).length > 0 && (
            <div className="animate-fade-in stagger-3">
              <RoleDetails role={profile.role} payload={rolePayload} />
            </div>
          )}

          {/* No content placeholder */}
          {!profile.bio && Object.keys(rolePayload).length === 0 && (
            <Card className="animate-fade-in">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Your profile is sparse. Add a bio and role details to get better matches.
                </p>
                <Link href="/profile/edit">
                  <Button className="gap-2">
                    <Edit className="h-4 w-4" />
                    Complete your profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
