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
import { queryKeys } from '@/lib/query-keys';
import { isPreviewDemo } from '@/lib/preview-demo';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { BilingualText } from '@/components/common/BilingualText';
import { SkillChip } from '@/components/common/SkillChip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ContributionGraph } from '@/components/shared/ContributionGraph';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { profileEn, profileEl } from '@/lib/i18n/strings-profile';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';

type ProfileData = Awaited<ReturnType<typeof getMeProfile>>['profile'];

const UserIcon = User;

function ProfileCompletionCard({ profile }: { profile: NonNullable<ProfileData> }) {
  const items = [
    { done: !!profile.displayName, labelEn: profileEn('display_name'), labelEl: profileEl('display_name') },
    { done: !!profile.headline, labelEn: profileEn('headline'), labelEl: profileEl('headline') },
    { done: !!profile.bio, labelEn: profileEn('bio'), labelEl: profileEl('bio') },
    { done: (profile.skills?.length ?? 0) >= 3, labelEn: profileEn('three_plus_skills'), labelEl: profileEl('three_plus_skills') },
    { done: !!profile.location, labelEn: profileEn('location'), labelEl: profileEl('location') },
    { done: !!profile.avatarUrl, labelEn: profileEn('avatar'), labelEl: profileEl('avatar') },
  ];
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  if (pct === 100) return null;

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            <BilingualText en={profileEn('profile_completion')} el={profileEl('profile_completion')} />
          </p>
          <span className="text-sm font-bold text-primary-accessible">{pct}%</span>
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
              key={item.labelEn}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                item.done
                  ? 'bg-primary/10 text-primary-accessible'
                  : 'bg-secondary/60 text-muted-foreground'
              }`}
            >
              {item.done
                ? <CheckCircle className="icon-sm shrink-0" />
                : <AlertCircle className="icon-sm shrink-0" />}
              <BilingualText en={item.labelEn} el={item.labelEl} compact />
            </div>
          ))}
        </div>
        <Link href="/profile/edit">
          <Button size="sm" variant="secondary" className="w-full gap-2 mt-1">
            <Edit className="icon-sm" />
            <BilingualText en={profileEn('complete_profile')} el={profileEl('complete_profile')} />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function VerificationCard({ email }: { email?: string | null }) {
  const items = [
    { labelEn: profileEn('email_verified'), labelEl: profileEl('email_verified'), verified: !!email, icon: Mail },
    { labelEn: profileEn('linkedin_connected'), labelEl: profileEl('linkedin_connected'), verified: false, icon: Linkedin },
    { labelEn: profileEn('github_connected'), labelEl: profileEl('github_connected'), verified: false, icon: Github },
    { labelEn: profileEn('identity_verified'), labelEl: profileEl('identity_verified'), verified: false, icon: Shield },
  ];
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <BilingualText en={profileEn('verification')} el={profileEl('verification')} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.map(({ labelEn, labelEl, verified, icon: Icon }) => (
          <div key={labelEn} className="flex items-center gap-2.5 text-xs">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${verified ? 'bg-primary/15' : 'bg-secondary/60'}`}>
              <Icon className={`icon-sm ${verified ? 'text-primary-accessible' : 'text-muted-foreground'}`} />
            </div>
            <span className={verified ? 'text-foreground' : 'text-muted-foreground'}>
              <BilingualText en={labelEn} el={labelEl} compact />
            </span>
            {verified
              ? <CheckCircle className="ml-auto icon-sm text-primary-accessible" />
              : <span className="ml-auto text-xs text-muted-foreground/60">
                  <BilingualText en={profileEn('not_connected')} el={profileEl('not_connected')} />
                </span>}
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

  const renderList = (arr: unknown, label: React.ReactNode): React.ReactNode => {
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

  const renderValue = (val: unknown, label: React.ReactNode): React.ReactNode => {
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
          { key: 'websiteUrl', icon: Globe, label: <BilingualText en={profileEn('website')} el={profileEl('website')} compact /> },
          // Brand names are proper nouns — intentionally not translated.
          { key: 'linkedinUrl', icon: Linkedin, label: profileEn('linkedin') },
          { key: 'githubUrl', icon: Github, label: profileEn('github') },
          { key: 'twitterUrl', icon: Twitter, label: profileEn('twitter_x') },
        ] as { key: string; icon: React.ElementType; label: React.ReactNode }[]
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
            <Icon2 className="icon-sm" />
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
          <Icon className="icon-md text-primary-accessible" />
          <BilingualText
            en={`${role.charAt(0).toUpperCase() + role.slice(1)} ${profileEn('details_suffix')}`}
            el={`${profileEl(role as 'founder' | 'mentor' | 'investor' | 'org') || role} — ${profileEl('details_suffix')}`}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {role === 'founder' && (
          <>
            {renderValue(payload.stage, <BilingualText en={profileEn('startup_stage')} el={profileEl('startup_stage')} stacked />)}
            {renderValue(payload.commitment, <BilingualText en={profileEn('commitment')} el={profileEl('commitment')} stacked />)}
            {renderList(payload.rolesSought, <BilingualText en={profileEn('looking_for')} el={profileEl('looking_for')} stacked />)}
            {renderList(payload.industries ?? (payload.industry ? [payload.industry] : []), <BilingualText en={profileEn('industries')} el={profileEl('industries')} stacked />)}
          </>
        )}
        {role === 'mentor' && (
          <>
            {renderList(payload.expertiseAreas, <BilingualText en={profileEn('expertise_areas')} el={profileEl('expertise_areas')} stacked />)}
            {renderValue(payload.availability, <BilingualText en={profileEn('availability')} el={profileEl('availability')} stacked />)}
            {renderValue(payload.meetingPreferences, <BilingualText en={profileEn('meeting_preference')} el={profileEl('meeting_preference')} stacked />)}
            {renderValue(payload.hourlyRate, <BilingualText en={profileEn('rate')} el={profileEl('rate')} stacked />)}
          </>
        )}
        {role === 'investor' && (
          <>
            {renderList(payload.investmentFocus, <BilingualText en={profileEn('investment_focus')} el={profileEl('investment_focus')} stacked />)}
            {renderList(payload.stages, <BilingualText en={profileEn('investment_stages')} el={profileEl('investment_stages')} stacked />)}
            {renderValue(payload.typicalCheckSize ?? [payload.checkSizeMin, payload.checkSizeMax].filter(Boolean).join(' – '), <BilingualText en={profileEn('check_size')} el={profileEl('check_size')} stacked />)}
            {renderList(payload.geography, <BilingualText en={profileEn('geography')} el={profileEl('geography')} stacked />)}
          </>
        )}
        {role === 'org' && (
          <>
            {renderValue(payload.organizationType, <BilingualText en={profileEn('organization_type')} el={profileEl('organization_type')} stacked />)}
            {renderList(payload.programTypes, <BilingualText en={profileEn('programs')} el={profileEl('programs')} stacked />)}
          </>
        )}
        {linkEntries && linkEntries.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <BilingualText en={profileEn('links')} el={profileEl('links')} />
            </p>
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

  const { data: meData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.me.profile(),
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
      success(bilingualInline(profileEn('link_copied'), profileEl('link_copied')), bilingualInline(profileEn('link_copied_desc'), profileEl('link_copied_desc')))
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
    // Reached when the query has settled but carries no profile. This used to be a
    // permanent dead end: a centred "Preparing your profile…" with no retry, no
    // error and no way out, on a query that was never going to run again inside
    // its 5-minute staleTime. It is a real state (a hydrated cache entry can hold
    // null, and an unreachable API resolves to nothing), so it needs an exit —
    // never a label that implies work still in progress when none is.
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isFetching ? (
              <BilingualText en={profileEn('preparing_profile')} el={profileEl('preparing_profile')} />
            ) : (
              <BilingualText
                en="We could not load your profile."
                el="Δεν μπορέσαμε να φορτώσουμε το προφίλ σας."
              />
            )}
          </p>
          {!isFetching && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </Button>
              <Button asChild size="sm">
                <Link href="/profile/edit">
                  <BilingualText en="Complete your profile" el="Ολοκληρώστε το προφίλ σας" compact />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const rolePayload = (profile.rolePayload ?? {}) as Record<string, unknown>;

  return (
    <AppShell
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 hidden sm:flex">
            <Share2 className="icon-sm" />
            <BilingualText en={profileEn('share_profile')} el={profileEl('share_profile')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="sm:hidden" title={bilingualAria(profileEn('copy_link'), profileEl('copy_link'))}>
            <Share2 className="icon-sm" />
          </Button>
          <Link href="/profile/edit">
            <Button size="sm" className="gap-2">
              <Edit className="icon-sm" />
              <BilingualText en={profileEn('edit_profile')} el={profileEl('edit_profile')} />
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
                  <AvatarFallback className="bg-primary/10 text-primary-accessible text-4xl font-bold">
                    {profile.displayName?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                  <div className="absolute bottom-2 right-2 rounded-full bg-background p-1 shadow-sm" title={bilingualAria(profileEn('verified_member'), profileEl('verified_member'))}>
                  <BadgeCheck className="icon-lg text-status-info" />
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
                        <BilingualText en={profileEn('no_headline_set')} el={profileEl('no_headline_set')} />
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <RoleBadge role={profile.role} className="text-sm px-3 py-1" />
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium bg-status-success-bg text-status-success hover:bg-status-success-bg border-status-success-border">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <BilingualText en={profileEn('open_to_work')} el={profileEl('open_to_work')} />
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
                    <UserIcon className="icon-md text-primary-accessible" />
                    <BilingualText en={profileEn('about')} el={profileEl('about')} />
                  </CardTitle>
                  <AIInsightButton
                    prompt={`Review my profile as a ${profile.role} and give me 3 specific tips to improve my positioning and appeal to the right collaborators:\nHeadline: ${profile.headline || 'Not set'}\nBio: ${profile.bio || 'Not set'}\nSkills: ${profile.skills?.map((s) => s.skillName).join(', ') || 'None listed'}`}
                    agentId="pitch-coach"
                    cacheKey={`own-profile-coach-${profile.userId}`}
                    variant="icon"
                    label={bilingualAria(profileEn('ai_coaching_label'), profileEl('ai_coaching_label'))}
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
                    <p className="text-sm text-muted-foreground mb-3">
                      <BilingualText en={profileEn('bio_empty_hint')} el={profileEl('bio_empty_hint')} />
                    </p>
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm">
                        <BilingualText en={profileEn('add_bio')} el={profileEl('add_bio')} />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Intent cards — What I'm looking for */}
          {(() => {
            const p = rolePayload as Record<string, string | undefined>;
            const cards: { icon: React.ElementType; labelEn: string; labelEl: string; value: string | undefined }[] = [
              { icon: Target, labelEn: profileEn('looking_for'), labelEl: profileEl('looking_for'), value: p.lookingFor },
              { icon: Rocket, labelEn: profileEn('startup_stage'), labelEl: profileEl('startup_stage'), value: p.stage },
              { icon: Users, labelEn: profileEn('commitment'), labelEl: profileEl('commitment'), value: p.commitment },
              { icon: DollarSign, labelEn: profileEn('compensation'), labelEl: profileEl('compensation'), value: p.compensation },
            ].filter((c) => c.value);
            if (!cards.length) return null;
            return (
              <Card className="animate-fade-in stagger-2 shadow-sm border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="icon-md text-primary-accessible" />
                    <BilingualText en={profileEn('what_looking_for')} el={profileEl('what_looking_for')} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 pt-5">
                  {cards.map(({ icon: Icon, labelEn, labelEl, value }) => (
                    <div key={labelEn} className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary-accessible">
                          <Icon className="icon-sm" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <BilingualText en={labelEn} el={labelEl} compact />
                        </span>
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
                    <BarChart3 className="icon-md text-primary-accessible" />
                    <BilingualText en={profileEn('top_skills')} el={profileEl('top_skills')} />
                  </CardTitle>
                  <Link href="/profile/edit">
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary-accessible">
                      <Plus className="icon-sm" /> <BilingualText en={profileEn('add')} el={profileEl('add')} />
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
                      <BilingualText en={`${profileEn('show_all_skills')} ${profile.skills.length} ${profileEn('skills_suffix')}`} el={`${profileEl('show_all_skills')} ${profile.skills.length} ${profileEl('skills_suffix')}`} />
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
                  <FolderOpen className="icon-md text-primary-accessible" />
                  <BilingualText en={profileEn('portfolio_showcase')} el={profileEl('portfolio_showcase')} />
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary-accessible">
                  <Plus className="icon-sm" /> <BilingualText en={profileEn('add')} el={profileEl('add')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col items-center gap-3 py-10 text-center rounded-xl bg-secondary/10 border border-dashed border-border/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary-accessible">
                  <FolderOpen className="icon-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    <BilingualText en={profileEn('showcase_title')} el={profileEl('showcase_title')} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    <BilingualText en={profileEn('showcase_desc')} el={profileEl('showcase_desc')} />
                  </p>
                </div>
                <Link href="/profile/edit" className="mt-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="icon-sm" /> <BilingualText en={profileEn('add_first_item')} el={profileEl('add_first_item')} />
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
                  <Activity className="icon-xl text-primary-accessible" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    <BilingualText en={profileEn('profile_bare_title')} el={profileEl('profile_bare_title')} />
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    <BilingualText en={profileEn('profile_bare_desc')} el={profileEl('profile_bare_desc')} />
                  </p>
                </div>
                <Link href="/profile/edit">
                  <Button className="gap-2 mt-2">
                    <Edit className="icon-sm" />
                    <BilingualText en={profileEn('complete_profile_now')} el={profileEl('complete_profile_now')} />
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
                  <Edit className="icon-sm" />
                  <BilingualText en={profileEn('edit_profile')} el={profileEl('edit_profile')} />
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                  <LinkIcon className="icon-sm" />
                  <BilingualText en={profileEn('copy_link')} el={profileEl('copy_link')} />
                </Button>
                <Link href="/settings/general" className="block w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <Zap className="icon-sm" />
                    <BilingualText en={profileEn('settings')} el={profileEl('settings')} />
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
                <BilingualText en={profileEn('activity_reputation')} el={profileEl('activity_reputation')} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              {[
                { icon: Users, labelEn: profileEn('connections'), labelEl: profileEl('connections'), value: '0', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                { icon: Star, labelEn: profileEn('endorsements'), labelEl: profileEl('endorsements'), value: '0', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: MessageSquare, labelEn: profileEn('posts'), labelEl: profileEl('posts'), value: '0', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { icon: Award, labelEn: profileEn('achievements'), labelEl: profileEl('achievements'), value: '0', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              ].map(({ icon: Icon, labelEn, labelEl, value, color, bg }) => (
                <div key={labelEn} className="flex flex-col items-center rounded-xl border border-border/40 bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-full ${bg} mb-2`}>
                    <Icon className={`icon-sm ${color}`} />
                  </div>
                  <span className="text-lg font-bold text-foreground leading-none">{value}</span>
                  <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                    <BilingualText en={labelEn} el={labelEl} compact />
                  </span>
                </div>
              ))}
              <div className="col-span-2 mt-2">
                <Link href="/reputation">
                  <Button variant="secondary" className="w-full text-xs h-8">
                    <BilingualText en={profileEn('view_reputation')} el={profileEl('view_reputation')} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Graph */}
          <Card className="animate-fade-in shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <BilingualText en={profileEn('activity_graph')} el={profileEl('activity_graph')} />
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
