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
  Star,
  Award,
  Activity,
  ExternalLink,
  FolderOpen,
  Plus,
  Zap,
  BarChart3,
  BadgeCheck,
  Calendar,
  MessageSquare,
  Link as LinkIcon,
  User,
} from 'lucide-react';
import { getMeProfile } from '@/lib/api';
import { isPreviewDemo } from '@/lib/preview-demo';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { SkillChip } from '@/components/common/SkillChip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ContributionGraph } from '@/components/shared/ContributionGraph';
import { AIInsightButton } from '@/components/ai/AIInsightButton';

type ProfileData = Awaited<ReturnType<typeof getMeProfile>>['profile'];

const UserIcon = User;

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
                ? <CheckCircle className="icon-sm shrink-0" />
                : <AlertCircle className="icon-sm shrink-0" />}
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
              <Icon className={`icon-sm ${verified ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className={verified ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
            {verified
              ? <CheckCircle className="ml-auto icon-sm text-primary" />
              : <span className="ml-auto text-xs text-muted-foreground/60">Not connected</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  founder: Rocket,
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
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Icon className="icon-md text-primary" />
          {role.charAt(0).toUpperCase() + role.slice(1)} Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
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
    if (isPreviewDemo()) return;
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
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 hidden sm:flex">
            <Share2 className="icon-sm" />
            Share Profile
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="sm:hidden" title="Copy profile link">
            <Share2 className="icon-sm" />
          </Button>
          <Link href="/profile/edit">
            <Button size="sm" className="gap-2">
              <Edit className="icon-sm" />
              Edit Profile
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 pb-10">
        {/* Cover Photo & Basic Identity Header */}
        <div className="relative rounded-2xl overflow-hidden border bg-card shadow-sm animate-fade-in">
          {/* Cover Photo */}
          <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary w-full relative sm:h-48 md:h-64">
            <div className="absolute inset-0 bg-grid-white/10" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(var(--primary-rgb), 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          </div>
          
          <div className="px-6 sm:px-8 pb-6 md:pb-8 relative">
            <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 md:-mt-20">
              <div className="relative inline-block">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                    {profile.displayName?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 rounded-full bg-background p-1 shadow-sm" title="Verified Member">
                  <BadgeCheck className="icon-lg text-blue-500" />
                </div>
              </div>

              <div className="flex-1 space-y-3 pt-2 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                      {profile.displayName}
                    </h1>
                    {profile.headline ? (
                      <p className="text-base md:text-lg text-muted-foreground font-medium">
                        {profile.headline}
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground italic opacity-70">
                        No headline set
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <RoleBadge role={profile.role} className="text-sm px-3 py-1" />
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      Open to work
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium pt-1">
                  {profile.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="icon-sm" />
                      {profile.location}
                    </div>
                  )}
                  {profile.timezone && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="icon-sm" />
                      {profile.timezone}
                    </div>
                  )}
                  {profile.languages?.length ? (
                    <div className="flex items-center gap-1.5">
                      <Languages className="icon-sm" />
                      {profile.languages.join(', ')}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="icon-sm" />
                    Joined {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content column */}
          <div className="space-y-6">
            {/* Bio */}
            <Card className="animate-fade-in stagger-1 shadow-sm border-border/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="icon-md text-primary" />
                    About
                  </CardTitle>
                  <AIInsightButton
                    prompt={`Review my profile as a ${profile.role} and give me 3 specific tips to improve my positioning and appeal to the right collaborators:\nHeadline: ${profile.headline || 'Not set'}\nBio: ${profile.bio || 'Not set'}\nSkills: ${profile.skills?.map((s) => s.skillName).join(', ') || 'None listed'}`}
                    agentId="pitch-coach"
                    cacheKey={`own-profile-coach-${profile.userId}`}
                    variant="icon"
                    label="Get AI coaching tips for your profile"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {profile.bio ? (
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                ) : (
                  <div className="text-center py-6 bg-secondary/20 rounded-lg border border-dashed border-border/50">
                    <p className="text-sm text-muted-foreground mb-3">Your bio is empty. Tell the community about yourself!</p>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm">Add Bio</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

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
              <Card className="animate-fade-in stagger-2 shadow-sm border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="icon-md text-primary" />
                    What I&apos;m Looking For
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 pt-5">
                  {cards.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <Icon className="icon-sm" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground pl-1">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* Role-specific details */}
          {Object.keys(rolePayload).length > 0 && (
            <div className="animate-fade-in stagger-2">
              <RoleDetails role={profile.role} payload={rolePayload} />
            </div>
          )}

          {/* Skill proficiency bars */}
          {profile.skills && profile.skills.length > 0 && (
            <Card className="animate-fade-in stagger-3 shadow-sm border-border/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="icon-md text-primary" />
                    Top Skills & Proficiency
                  </CardTitle>
                  <Link href="/profile/edit">
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.skills.slice(0, 6).map((s, i) => {
                    const lvl = s.level ?? (i % 3 === 0 ? 'expert' : i % 3 === 1 ? 'intermediate' : 'beginner');
                    const pct = lvl === 'expert' ? 92 - i * 2 : lvl === 'intermediate' ? 68 - i * 3 : 42 - i * 2;
                    return (
                      <div key={s.skillId} className="space-y-1.5 bg-secondary/20 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-foreground">{s.skillName}</span>
                          <Badge variant="secondary" size="sm" className="capitalize bg-background">{lvl}</Badge>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${Math.max(pct, 20)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {profile.skills.length > 6 && (
                  <div className="mt-4 pt-4 border-t border-border/50 text-center">
                    <Button variant="link" size="sm" className="text-muted-foreground h-auto p-0">
                      Show all {profile.skills.length} skills
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Portfolio placeholder */}
          <Card className="animate-fade-in shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FolderOpen className="icon-md text-primary" />
                  Portfolio &amp; Showcase
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col items-center gap-3 py-10 text-center rounded-xl bg-secondary/10 border border-dashed border-border/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FolderOpen className="icon-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Showcase your best work</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Add projects, startups, publications, or key achievements to stand out.</p>
                </div>
                <Link href="/profile/edit" className="mt-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add First Item
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* No content placeholder */}
          {!profile.bio && Object.keys(rolePayload).length === 0 && (
            <Card className="animate-fade-in bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 p-5 text-center">
                <div className="p-3 bg-background rounded-full shadow-sm mb-2">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Your profile is looking bare</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Profiles with bios and role details receive 4x more connection requests. Take 2 minutes to fill it out!
                  </p>
                </div>
                <Link href="/profile/edit">
                  <Button className="gap-2 mt-2">
                    <Edit className="h-4 w-4" />
                    Complete Profile Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="shadow-sm border-border/50 sticky top-6">
            <CardContent className="p-5 space-y-4">
              <Link href="/profile/edit" className="block w-full">
                <Button className="w-full gap-2 font-medium">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                  <LinkIcon className="h-4 w-4" />
                  Copy Link
                </Button>
                <Link href="/settings/general" className="block w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Profile completion meter */}
          <ProfileCompletionCard profile={profile} />

          {/* Verification status */}
          <VerificationCard email={profile.email} />

          {/* Reputation / Stats mini-card */}
          <Card className="animate-fade-in shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Activity & Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              {[
                { icon: Users,    label: 'Connections', value: '0', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                { icon: Star,     label: 'Endorsements',value: '0', color: 'text-amber-500', bg: 'bg-amber-500/10'  },
                { icon: MessageSquare, label: 'Posts', value: '0', color: 'text-blue-500', bg: 'bg-blue-500/10'   },
                { icon: Award,    label: 'Achievements', value: '0', color: 'text-emerald-500', bg: 'bg-emerald-500/10'},
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="flex flex-col items-center rounded-xl border border-border/40 bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-full ${bg} mb-2`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-lg font-bold text-foreground leading-none">{value}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">{label}</span>
                </div>
              ))}
              <div className="col-span-2 mt-2">
                <Link href="/reputation">
                  <Button variant="secondary" className="w-full text-xs h-8">View Reputation Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Graph */}
          <Card className="animate-fade-in shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Activity Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-hidden">
              <div className="-mx-2 scale-95 transform origin-left">
                <ContributionGraph 
                  weeks={18} 
                  colorScheme="primary" 
                  size="sm"
                  showDays={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </AppShell>
  );
}
