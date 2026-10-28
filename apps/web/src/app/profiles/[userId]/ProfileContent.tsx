'use client';

import React, { useState } from 'react';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useRecordProfileView } from '@/hooks/useRecordProfileView';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProfileMoreMenu } from '@/components/profile/ProfileMoreMenu';
import { AskIntroDialog } from '@/components/intros/AskIntroDialog';
import { useFollowPerson } from '@/components/updates/FollowButton';
import { OpenToLine } from '@/components/intros/OpenToLine';
import { SkillEvidencePanel } from '@/components/profile/SkillEvidencePanel';
import { IntroVideoLink } from '@/components/profile/IntroVideoLink';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileActivity, ProfileExperience, ProfileRecommendations, SimilarProfiles } from '@/components/profile/ProfileSections';
import type { PageRailSection } from '@/components/layout/PageRail';
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
  ApiError,
  getPublicProfile,
  sendConnectionRequest,
  getConnectionStatus,
  getOrCreateDirectConversation,
  respondToConnectionRequest,
} from '@/lib/api';
import { useConnectionWith } from '@/hooks/useConnectionWith';
import { hasInAppPrevious } from '@/lib/in-app-history';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/common/RoleBadge';
import { StatusText, statusEl } from '@/components/common/StatusText';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { qk } from '@/lib/query-keys';
import { PersonVerifiedBadge } from '@/components/commitments/PersonVerifiedBadge';
import { usePageControls, type PageControlRunResult } from '@/lib/page-controls';
import { FactLine } from '@/components/common/FactLine';
import { cn } from '@/lib/utils';

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
      className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
    >
      <Icon className="icon-sm" />
      {label}
    </a>
  );
}

type RolePayloadValue = string | string[] | Record<string, string> | null | undefined;

// camelCase payload keys that ship Greek labels; an unknown key keeps the
// derived English label rather than inventing a translation.
const PAYLOAD_LABELS: Record<string, [string, string]> = {
  lookingFor: ['Looking for', 'Αναζητά'],
  availability: ['Availability', 'Διαθεσιμότητα'],
  industries: ['Industries', 'Κλάδοι'],
  services: ['Services', 'Υπηρεσίες'],
  expertise: ['Expertise', 'Εξειδίκευση'],
  hourlyRate: ['Hourly rate', 'Ωριαία χρέωση'],
  stage: ['Stage', 'Στάδιο'],
};

function PayloadEntry({ entryKey, value }: { entryKey: string; value: RolePayloadValue }) {
  const derived = entryKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  const [en, el] = PAYLOAD_LABELS[entryKey] ?? [derived, derived];
  const label = <BilingualText en={en} el={el} compact />;
  if (!value) return null;
  if (Array.isArray(value) && value.length > 0) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {/* Enum values ("full_time", "pre_seed") read as words in both
            languages; free text passes through, capitalised. */}
        <FactLine className="text-sm text-foreground" items={(value as string[]).map((item) => <StatusText key={item} value={item} />)} />
      </div>
    );
  }
  if (typeof value === 'string' && value.trim()) {
    return (
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="card-body text-foreground"><StatusText value={value} /></p>
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
  // "Ask for an introduction" and "Follow updates" moved into the profile's
  // More menu (docs §101); the page keeps their state so the assistant can
  // press them too.
  const [introOpen, setIntroOpen] = useState(false);
  const follow = useFollowPerson(userId);

  // Read after mount, so the server and the first client render agree on
  // whether this is the reader's own profile.
  const viewerId = useStoredUser()?.id ?? null;
  const hasToken = useIsAuthenticated();

  const { data: profile, isLoading, isError, error: readError, refetch, isFetching } = useQuery({
    queryKey: qk('public-profile', userId),
    queryFn: () => getPublicProfile(userId),
    staleTime: 2 * 60_000,
    enabled: !!userId,
    retry: 1,
  });

  // One view counted per visit, never the owner's (who viewed: Analytics).
  useRecordProfileView(userId, Boolean(profile), true);

  // "Back" goes back: to the page the reader came from inside the product,
  // or to Explore when they arrived from outside. It always went to
  // /discover, so a profile opened from Messages "went back" to Explore
  // (docs §75).
  const goBack = () => {
    if (hasInAppPrevious()) router.back();
    else router.push('/discover');
  };

  const { data: connStatus } = useQuery({
    queryKey: qk('connection-status', userId),
    queryFn: () => getConnectionStatus(userId),
    staleTime: 30_000,
    enabled: !!userId && hasToken,
  });

  const handleConnect = async (): Promise<PageControlRunResult> => {
    setConnecting(true);
    try {
      await sendConnectionRequest({ receiverId: userId });
      queryClient.setQueryData(qk('connection-status', userId), {
        status: 'pending', connectionId: null, direction: 'sent',
      });
      success('Request sent!', `Your connection request has been sent.`);
    } catch (err) {
      showError('Could not connect', err instanceof Error ? err.message : 'Please try again');
      return { error: err instanceof Error && err.message ? err.message : 'The connection request was not sent.' };
    } finally {
      setConnecting(false);
    }
  };

  // Where the connection stands, read from the /connections lists as the
  // founder home and /matches read it (useConnectionWith). The status
  // endpoint has no "they asked you" answer the page used, so a person whose
  // request was waiting was offered Connect here and Accept everywhere else
  // (docs §75).
  const { connectionWith } = useConnectionWith(Boolean(viewerId) && viewerId !== userId, viewerId);
  const linkToThem = connectionWith.get(userId);
  const waitingOnMe = linkToThem?.state === 'received' || (connStatus?.status === 'pending' && connStatus.direction === 'received');
  const waitingRequestId = linkToThem?.state === 'received' ? linkToThem.id : connStatus?.direction === 'received' ? connStatus.connectionId : null;
  const handleAccept = async (): Promise<PageControlRunResult> => {
    if (!waitingRequestId) return { error: 'The request could not be found.' };
    setConnecting(true);
    try {
      await respondToConnectionRequest(waitingRequestId, 'accepted');
      queryClient.setQueryData(qk('connection-status', userId), { status: 'accepted', connectionId: waitingRequestId, direction: 'received' });
      await queryClient.invalidateQueries({ queryKey: qk('connections') });
      success('Request accepted', 'You are now connected.');
    } catch (err) {
      showError('Could not accept the request', err instanceof Error ? err.message : 'Please try again');
      return { error: err instanceof Error && err.message ? err.message : 'The request was not accepted.' };
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

  /*
   * Connect, message and share, offered to the assistant. Connecting names no
   * page-level undo: the request's id is not known here until the status is
   * read again, and the assistant's own send_connection action carries the
   * partial withdraw the API allows (pending requests only).
   */
  const own = viewerId === userId;
  const blocked = connStatus?.status === 'blocked';
  const connected = connStatus?.status === 'accepted';
  const pending = connStatus?.status === 'pending';
  const noActor = !viewerId ? 'Sign in first.' : own ? 'This is your own profile.' : blocked ? 'This connection is blocked.' : undefined;
  const noActorEl = !viewerId ? 'Συνδεθείτε πρώτα.' : own ? 'Αυτό είναι το δικό σας προφίλ.' : blocked ? 'Η σύνδεση είναι αποκλεισμένη.' : undefined;
  usePageControls([
    {
      id: 'connect_with_person',
      labelEn: 'Send a connection request',
      labelEl: 'Αποστολή αιτήματος σύνδεσης',
      writes: true,
      unavailableEn: noActor ?? (connected ? 'You are already connected.' : waitingOnMe ? 'They asked to connect: accept their request instead.' : pending ? 'A request is already pending.' : undefined),
      unavailableEl: noActorEl ?? (connected ? 'Είστε ήδη συνδεδεμένοι.' : waitingOnMe ? 'Σας ζήτησαν σύνδεση: αποδεχτείτε το αίτημά τους.' : pending ? 'Υπάρχει ήδη εκκρεμές αίτημα.' : undefined),
      run: handleConnect,
    },
    {
      id: 'accept_connection_from_person',
      labelEn: 'Accept their connection request',
      labelEl: 'Αποδοχή του αιτήματος σύνδεσης',
      writes: true,
      unavailableEn: noActor ?? (waitingOnMe ? undefined : 'There is no request from them to accept.'),
      unavailableEl: noActorEl ?? (waitingOnMe ? undefined : 'Δεν υπάρχει αίτημά τους για αποδοχή.'),
      run: handleAccept,
    },
    {
      id: 'message_person',
      labelEn: 'Open a conversation with this person',
      labelEl: 'Άνοιγμα συνομιλίας με αυτό το άτομο',
      // Opens the thread, creating it when there is none - a write.
      writes: true,
      unavailableEn: noActor,
      unavailableEl: noActorEl,
      run: handleMessage,
    },
    { id: 'copy_profile_link', labelEn: 'Copy the profile link', labelEl: 'Αντιγραφή συνδέσμου προφίλ', writes: false, run: handleShare },
    {
      id: 'follow_updates',
      labelEn: follow.following ? 'Stop following their updates' : 'Follow their updates',
      labelEl: follow.following ? 'Διακοπή παρακολούθησης των ενημερώσεών τους' : 'Παρακολούθηση των ενημερώσεών τους',
      writes: true,
      unavailableEn: noActor,
      unavailableEl: noActorEl,
      run: () => follow.toggle(),
    },
    {
      id: 'ask_for_introduction',
      labelEn: 'Ask someone you both know for an introduction',
      labelEl: 'Ζητήστε γνωριμία μέσω κάποιου που γνωρίζετε και οι δύο',
      writes: false,
      unavailableEn: noActor,
      unavailableEl: noActorEl,
      run: () => setIntroOpen(true),
    },
  ]);

  // The skeleton has the page's own shape: the top card, then the story
  // beside the facts.
  if (isLoading)
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="[container-type:inline-size]">
            <div className="grid grid-cols-1 gap-6 [@container(min-width:72rem)]:grid-cols-3">
              <div className="space-y-6 [@container(min-width:72rem)]:col-span-2">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-56 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );

  // "Profile not found" only when the answer says so. A read that failed
  // (the API unreachable) said the person "may have been removed" (§75).
  const notFound = !profile && (!isError || (readError instanceof ApiError && (readError.status === 404 || readError.status === 403)));
  if (isError || !profile)
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          {notFound ? (
            <>
              <p className="text-lg font-semibold text-foreground">
                <BilingualText en="Profile not found" el="Το προφίλ δεν βρέθηκε" />
              </p>
              <p className="text-sm text-muted-foreground">
                <BilingualText
                  en="This profile may have been removed or is not publicly visible."
                  el="Αυτό το προφίλ μπορεί να έχει αφαιρεθεί ή να μην είναι δημόσια ορατό."
                />
              </p>
              <Button variant="outline" size="sm" onClick={goBack}>
                <BilingualText en="Go back" el="Επιστροφή" compact />
              </Button>
            </>
          ) : (
            <>
              <p role="alert" className="text-lg font-semibold text-foreground">
                <BilingualText en="This profile could not be read just now." el="Το προφίλ δεν διαβάστηκε αυτή τη στιγμή." wrap />
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
                  <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
                </Button>
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <BilingualText en="Go back" el="Επιστροφή" compact />
                </Button>
              </div>
            </>
          )}
        </div>
      </AppShell>
    );

  const isOwnProfile = viewerId === userId;
  type RolePayloadValue = string | string[] | Record<string, string> | null | undefined;
  const rolePayload = (profile.rolePayload ?? {}) as Record<string, RolePayloadValue>;
  const RoleIcon = ROLE_ICONS[profile.role] ?? Briefcase;

  const rolePayloadNodes: React.ReactNode[] = Object.entries(rolePayload)
    .filter(([k]) => k !== 'links' && k !== 'experience' && k !== 'education' && k !== 'introVideoUrl')
    .reduce<React.ReactNode[]>((acc, [key, val]) => {
      acc.push(<PayloadEntry key={key} entryKey={key} value={val} />);
      return acc;
    }, []);

  const hasDetails = Object.keys(rolePayload).filter((k) => k !== 'experience' && k !== 'education').length > 0;
  const skillNames = (profile.skills ?? []).map((sk) => sk.skillName).filter((n): n is string => typeof n === 'string' && n.trim() !== '');

  const connLabel: [string, string] =
    connStatus?.status === 'blocked'
      ? ['Blocked', 'Αποκλεισμένο']
      : connStatus?.status === 'accepted' || linkToThem?.state === 'connected'
      ? ['Connected', 'Συνδεδεμένοι']
      : waitingOnMe
        ? ['Accept', 'Αποδοχή']
        : (connStatus?.status === 'pending' && connStatus.direction === 'sent') || linkToThem?.state === 'sent'
          ? ['Request sent', 'Το αίτημα στάλθηκε']
          : ['Connect', 'Σύνδεση'];
  const connButtonLabel = <BilingualText en={connLabel[0]} el={connLabel[1]} compact />;

  const isBlocked = connStatus?.status === 'blocked';
  const isConnected = connStatus?.status === 'accepted' || linkToThem?.state === 'connected';
  const isPendingSent = !waitingOnMe && ((connStatus?.status === 'pending' && connStatus.direction === 'sent') || linkToThem?.state === 'sent');

  /*
   * Rail: what supports reading this person, never a copy of a control. Similar
   * profiles come from shared role, skills and industry; recommendations are
   * what others wrote and the person approved.
   */
  const rail: PageRailSection[] = [
    {
      id: 'similar',
      glyph: 'people',
      labelEn: 'Similar profiles',
      labelEl: 'Παρόμοια προφίλ',
      content: (
        <SimilarProfiles
          person={{
            userId,
            role: profile.role,
            skills: (profile.skills ?? []).map((s) => s.skillName).filter((n): n is string => typeof n === 'string'),
            industries: Array.isArray(rolePayload.industries) ? (rolePayload.industries as string[]) : [],
            location: profile.location,
          }}
          viewerId={viewerId}
        />
      ),
    },
    {
      id: 'recommendations',
      glyph: 'star',
      labelEn: 'Recommendations',
      labelEl: 'Συστάσεις',
      content: <ProfileRecommendations userId={userId} />,
    },
  ];

  return (
    <AppShell
      // The header keeps the registry's "Profile" title and line: the person's
      // name and headline are the top card's own, read once, as on a
      // professional profile. Passing them here printed both twice.
      rail={rail}
      actions={
        <Button variant="secondary" size="sm" className="gap-2" onClick={goBack}>
          <ArrowLeft className="icon-sm" />
          <BilingualText en="Back" el="Πίσω" compact />
        </Button>
      }
    >
      <div className="space-y-6">
        <ProfileHero
          name={profile.displayName}
          avatarUrl={profile.avatarUrl}
          nameBadge={<PersonVerifiedBadge userId={userId} />}
          headline={profile.headline}
          meta={[
            profile.location ? <><MapPin className="icon-sm shrink-0" aria-hidden="true" />{profile.location}</> : null,
            profile.timezone ? <><Clock className="icon-sm shrink-0" aria-hidden="true" />{profile.timezone}</> : null,
            profile.languages?.length ? <><Languages className="icon-sm shrink-0" aria-hidden="true" />{profile.languages.join(' · ')}</> : null,
          ]}
          openTo={!isOwnProfile ? <OpenToLine userId={userId} /> : null}
          aside={<RoleBadge role={profile.role} />}
          actions={
            isOwnProfile ? (
              <>
                <Button variant="secondary" asChild>
                  <Link href="/profile/edit"><BilingualText en="Edit your profile" el="Επεξεργασία προφίλ" compact /></Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  title={bilingualAria('Copy link', 'Αντιγραφή συνδέσμου')}
                  aria-label={bilingualAria('Copy link', 'Αντιγραφή συνδέσμου')}
                >
                  <Share2 className="icon-sm" />
                </Button>
              </>
            ) : (
              <>
                {viewerId ? (
                  <>
                    <Button
                      className="gap-2"
                      onClick={() => void (waitingOnMe ? handleAccept() : handleConnect())}
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
                      className="gap-2"
                      onClick={handleMessage}
                      disabled={messaging || isBlocked}
                      title={isBlocked ? bilingualAria('Messages are closed between you and this member', 'Τα μηνύματα είναι κλειστά ανάμεσα σε εσάς και αυτό το μέλος') : undefined}
                    >
                      {messaging ? (
                        <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                      ) : (
                        <MessageCircle className="icon-sm" aria-hidden="true" />
                      )}
                      <BilingualText en="Message" el="Μήνυμα" compact />
                    </Button>
                  </>
                ) : null}
                {viewerId ? (
                  // The full comparison - match reasons, and where the two of
                  // you agree on the compatibility questions - lives on the
                  // match page; from a profile it is one step away.
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/matches/${encodeURIComponent(userId)}`}>
                      <BilingualText en="How we fit" el="Πώς ταιριάζουμε" compact />
                    </Link>
                  </Button>
                ) : null}
                {/* Follow updates, Ask for an introduction, the AI's read of
                    the fit and Copy link: one press away (docs §101). */}
                <ProfileMoreMenu
                  userId={userId}
                  name={profile.displayName}
                  signedIn={Boolean(viewerId)}
                  onCopyLink={handleShare}
                  onAskIntro={() => setIntroOpen(true)}
                  askAboutFit={{
                    en: `Analyze this ${profile.role} profile for collaboration potential:\n${profile.displayName} — ${profile.headline ?? 'No headline'}\nSkills: ${profile.skills?.map((s) => s.skillName).join(', ') || 'None listed'}\nBio: ${profile.bio ?? 'No bio'}`,
                    el: `Ανάλυσε αυτό το προφίλ (${statusEl(profile.role) ?? profile.role}) για δυνατότητα συνεργασίας:\n${profile.displayName} — ${profile.headline ?? 'Χωρίς τίτλο'}\nΔεξιότητες: ${profile.skills?.map((s) => s.skillName).join(', ') || 'Καμία'}\nΒιογραφικό: ${profile.bio ?? 'Κανένα'}`,
                  }}
                />
              </>
            )
          }
        />

        {/* Two columns once the content is 72rem wide, as one's own profile
            reads: the story on the left, the facts a visitor scans (what
            they are looking for, availability, stage) beside it. They sat at
            the foot of a 2,276px column (docs §75). */}
        <div className="[container-type:inline-size]">
        <div className={cn('grid grid-cols-1 gap-6', hasDetails && '[@container(min-width:72rem)]:grid-cols-3 [@container(min-width:72rem)]:items-start')}>
        <div className={cn('min-w-0 space-y-6', hasDetails && '[@container(min-width:72rem)]:col-span-2')}>
        {profile.bio && (
          <Card>
            <CardHeader>
              <CardTitle><BilingualText en="About" el="Σχετικά" compact /></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="card-body whitespace-pre-wrap text-muted-foreground first-letter:uppercase">
                {profile.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {viewerId ? <ProfileActivity userId={userId} own={isOwnProfile} /> : null}

        <ProfileExperience payload={rolePayload as Record<string, unknown>} own={isOwnProfile} />

        {/* One skills card. Signed in, the evidence panel lists the profile's
            skills with what backs each one; it followed a "Skills" card that
            named the same skills (docs §75). Signed out there is no evidence
            to read, so the names stand alone. */}
        {viewerId ? (
          <SkillEvidencePanel userId={userId} declared={skillNames} levels={Object.fromEntries((profile.skills ?? []).map((sk) => [sk.skillName ?? '', sk.level]))} />
        ) : skillNames.length ? (
          <Card>
            <CardHeader>
              <CardTitle>
                <BilingualText en="Skills" el="Δεξιότητες" compact />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FactLine className="text-sm text-foreground" items={skillNames} />
            </CardContent>
          </Card>
        ) : null}
        </div>

        {hasDetails && (
          <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RoleIcon className="icon-sm text-muted-foreground" aria-hidden="true" />
                <BilingualText
                  en={`${(profile.role ?? '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())} details`}
                  el={`${(statusEl(profile.role) ?? profile.role ?? '').replace(/^./, (c) => c.toUpperCase())} — λεπτομέρειες`}
                  compact
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Generic role payload display */}
              <>{rolePayloadNodes}</>
              <IntroVideoLink raw={rolePayload.introVideoUrl} />

              {rolePayload.links && typeof rolePayload.links === 'object' && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider"><BilingualText en="Links" el="Σύνδεσμοι" compact /></p>
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
          </div>
        )}
        </div>
        </div>
      </div>
      {introOpen && viewerId && !isOwnProfile ? (
        <AskIntroDialog open={introOpen} onOpenChange={setIntroOpen} targetId={userId} targetName={profile.displayName} />
      ) : null}
    </AppShell>
  );
}
