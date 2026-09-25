'use client';

import React, { useState } from 'react';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Globe,
  Linkedin,
  Github,
  Twitter,
  MessageCircle,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Languages,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Building2,
  Share2,
  Loader2,
} from 'lucide-react';
import {
  getPublicProfile,
  sendConnectionRequest,
  getConnectionStatus,
  getOrCreateDirectConversation,
  type ConnectionStatus,
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { SkillChip } from '@/components/common/SkillChip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { qk } from '@/lib/query-keys';

type PublicProfile = Awaited<ReturnType<typeof getPublicProfile>>;

function SocialLinkButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
    >
      <Icon className="icon-sm" />
      {label}
    </a>
  );
}

type RolePayloadValue = string | string[] | Record<string, string> | null | undefined;
function PayloadEntry({ entryKey, value }: { entryKey: string; value: RolePayloadValue }) {
  const label = entryKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  if (!value) return null;
  if (Array.isArray(value) && value.length > 0) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {(value as string[]).map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
          ))}
        </div>
      </div>
    );
  }
  if (typeof value === 'string' && value.trim()) {
    return (
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    );
  }
  return null;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  founder: Briefcase,
  mentor: GraduationCap,
  investor: TrendingUp,
  org: Building2,
};

export default function PublicProfilePage({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [connecting, setConnecting] = useState(false);
  const [messaging, setMessaging] = useState(false);

  // Read after mount, so the server and the first client render agree on
  // whether this is the reader's own profile.
  const viewerId = useStoredUser()?.id ?? null;
  const hasToken = useIsAuthenticated();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: qk('public-profile', userId),
    queryFn: () => getPublicProfile(userId),
    staleTime: 2 * 60_000,
    enabled: !!userId,
    retry: 1,
  });

  const { data: connStatus } = useQuery({
    queryKey: qk('connection-status', userId),
    queryFn: () => getConnectionStatus(userId),
    staleTime: 30_000,
    enabled: !!userId && hasToken,
  });

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await sendConnectionRequest({ receiverId: userId });
      queryClient.setQueryData(qk('connection-status', userId), {
        status: 'pending', connectionId: null, direction: 'sent',
      });
      success('Request sent!', `Your connection request has been sent.`);
    } catch (err) {
      showError('Could not connect', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setConnecting(false);
    }
  };

  const handleMessage = async () => {
    setMessaging(true);
    try {
      const { conversationId } = await getOrCreateDirectConversation(userId);
      router.push(`/messages?c=${conversationId}`);
    } catch {
      router.push(`/messages?to=${userId}`);
    } finally {
      setMessaging(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() =>
      success('Link copied!', 'Profile link copied to clipboard.')
    );
  };

  if (isLoading)
    return (
      <AppShell>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </AppShell>
    );

  if (isError || !profile)
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold text-foreground">
            <BilingualText en="Profile not found" el="Το προφίλ δεν βρέθηκε" />
          </p>
          <p className="text-sm text-muted-foreground">
            <BilingualText
              en="This profile may have been removed or is not publicly visible."
              el="Αυτό το προφίλ μπορεί να έχει αφαιρεθεί ή να μην είναι δημόσια ορατό."
            />
          </p>
          <button onClick={() => router.back()} className="text-sm text-primary-accessible hover:underline">
            <BilingualText en="Go back" el="Επιστροφή" compact />
          </button>
        </div>
      </AppShell>
    );

  const isOwnProfile = viewerId === userId;
  type RolePayloadValue = string | string[] | Record<string, string> | null | undefined;
  const rolePayload = (profile.rolePayload ?? {}) as Record<string, RolePayloadValue>;
  const RoleIcon = ROLE_ICONS[profile.role] ?? Briefcase;

  const rolePayloadNodes: React.ReactNode[] = Object.entries(rolePayload)
    .filter(([k]) => k !== 'links')
    .reduce<React.ReactNode[]>((acc, [key, val]) => {
      acc.push(<PayloadEntry key={key} entryKey={key} value={val} />);
      return acc;
    }, []);

  const connButtonLabel =
    connStatus?.status === 'blocked'
      ? 'Blocked'
      : connStatus?.status === 'accepted'
      ? 'Connected'
      : connStatus?.status === 'pending' && connStatus.direction === 'sent'
        ? 'Request sent'
        : 'Connect';

  const isBlocked = connStatus?.status === 'blocked';
  const isConnected = connStatus?.status === 'accepted';
  const isPendingSent = connStatus?.status === 'pending' && connStatus.direction === 'sent';

  return (
    <AppShell
      title={profile.displayName}
      // `??` guarded the headline but not the role, so a profile payload without
      // one interpolated the word itself and the page header read "undefined on
      // CoFounderBay". Passing undefined lets resolvePageHeader fall back to the
      // registry's own description, the same way the title already does.
      description={
        profile.headline ?? (profile.role ? `${profile.role} on CoFounderBay` : undefined)
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            title={bilingualAria('Copy link', 'Αντιγραφή συνδέσμου')}
            aria-label={bilingualAria('Copy link', 'Αντιγραφή συνδέσμου')}
          >
            <Share2 className="icon-sm" />
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <Link href="/discover">
              <ArrowLeft className="icon-sm" />
              <BilingualText en="Back" el="Πίσω" compact />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Identity card */}
        <div className="space-y-4">
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center gap-4 p-4 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <AvatarImage src={profile.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary-accessible text-xl font-bold">
                  {profile.displayName?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>

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
                    <MapPin className="icon-sm shrink-0" />
                    {profile.location}
                  </p>
                )}
                {profile.timezone && (
                  <p className="flex items-center justify-center gap-1.5">
                    <Clock className="icon-sm shrink-0" />
                    {profile.timezone}
                  </p>
                )}
                {profile.languages?.length ? (
                  <p className="flex items-center justify-center gap-1.5">
                    <Languages className="icon-sm shrink-0" />
                    {profile.languages.join(' · ')}
                  </p>
                ) : null}
              </div>

              {/* Actions */}
              {!isOwnProfile && viewerId && (
                <div className="flex w-full flex-col gap-2 pt-1">
                  <Button
                    className="w-full gap-2"
                    onClick={handleConnect}
                    disabled={connecting || isConnected || isPendingSent || isBlocked}
                    variant={isConnected || isBlocked ? 'secondary' : 'default'}
                  >
                    {connecting ? (
                      <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                    ) : isConnected || isBlocked ? (
                      <UserCheck className="icon-sm" aria-hidden="true" />
                    ) : (
                      <UserPlus className="icon-sm" aria-hidden="true" />
                    )}
                    {connButtonLabel}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleMessage}
                    disabled={messaging || isBlocked}
                  >
                    {messaging ? (
                      <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                    ) : (
                      <MessageCircle className="icon-sm" aria-hidden="true" />
                    )}
                    Message
                  </Button>
                  <AIInsightButton
                    prompt={`Analyze this ${profile.role} profile for collaboration potential:\n${profile.displayName} — ${profile.headline ?? 'No headline'}\nSkills: ${profile.skills?.map((s) => s.skillName).join(', ') || 'None listed'}\nBio: ${profile.bio ?? 'No bio'}`}
                    agentId="matching"
                    cacheKey={`profile-match-${userId}`}
                    variant="outline"
                    size="sm"
                    label="AI Match Analysis"
                    className="w-full"
                  />
                </div>
              )}

              {isOwnProfile && (
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/profile/edit" className="w-full">Edit your profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {profile.skills?.length ? (
            <Card className="animate-fade-in stagger-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-0">
                {profile.skills.map((s, i) => (
                  // skillId can be absent on a partially-populated payload, and
                  // key={undefined} is the same as no key to React.
                  <SkillChip key={s.skillId ?? s.skillName ?? i} label={s.skillName} />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-4">
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

          {Object.keys(rolePayload).length > 0 && (
            <Card className="animate-fade-in stagger-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RoleIcon className="icon-sm text-primary-accessible" />
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Generic role payload display */}
                <>{rolePayloadNodes}</>

                {/* Social links */}
                {rolePayload.links && typeof rolePayload.links === 'object' && (
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { key: 'websiteUrl', icon: Globe, label: 'Website' },
                          { key: 'linkedinUrl', icon: Linkedin, label: 'LinkedIn' },
                          { key: 'githubUrl', icon: Github, label: 'GitHub' },
                          { key: 'twitterUrl', icon: Twitter, label: 'Twitter/X' },
                        ] as { key: string; icon: React.ElementType; label: string }[]
                      )
                        .filter(({ key }) => {
                          const url = (rolePayload.links as Record<string, unknown>)[key];
                          return typeof url === 'string' && url.trim();
                        })
                        .map(({ key, icon: LinkIcon, label }) => (
                          <SocialLinkButton
                            key={key}
                            href={String((rolePayload.links as Record<string, unknown>)[key])}
                            icon={LinkIcon}
                            label={label}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
