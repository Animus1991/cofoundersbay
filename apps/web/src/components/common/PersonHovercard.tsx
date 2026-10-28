'use client';

import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ConnectButton, MessageButton } from '@/components/common/PersonActions';
import { useStoredUser } from '@/hooks/useStoredUser';
import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { getConnectionStatus, getPublicProfile } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { initialsOf } from '@/lib/utils';

const MONTHS_ACCUSATIVE = ['Ιανουάριο', 'Φεβρουάριο', 'Μάρτιο', 'Απρίλιο', 'Μάιο', 'Ιούνιο', 'Ιούλιο', 'Αύγουστο', 'Σεπτέμβριο', 'Οκτώβριο', 'Νοέμβριο', 'Δεκέμβριο'];

/**
 * Who someone is, on hover or keyboard focus of their name, without leaving
 * the page - GitHub's user hovercard. The name keeps its link; after half a
 * second a small card shows the photo, headline, role, place, first skills
 * and when they joined.
 *
 * It reads the profile only when it opens, under the profile page's own query
 * key, so opening the profile afterwards is already loaded. Touch screens
 * never open it (a tap follows the link).
 *
 * With GitHub's two actions since §111 (§54.7-3): Message, and Connect or
 * where the connection stands. It is a hover card now, not a tooltip, because
 * a tooltip is read as a description and may not hold buttons. The actions
 * are the shared PersonActions, so they do what the profile's do; none for
 * oneself, and none for a visitor, who has nobody to act as.
 */
export function PersonHovercard({ userId, children }: { userId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const me = useStoredUser()?.id ?? null;
  const canAct = Boolean(me) && me !== userId;
  const { data: profile, isLoading } = useQuery({
    queryKey: qk('public-profile', userId),
    queryFn: () => getPublicProfile(userId),
    enabled: open && Boolean(userId),
    staleTime: 5 * 60_000,
  });
  const joined = profile?.createdAt ? new Date(profile.createdAt) : null;
  const joinedValid = joined && !Number.isNaN(joined.getTime());
  const joinedEn = joinedValid ? joined.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;
  // «από τον Φεβρουάριο του 2026»: after «από» the month takes the accusative.
  // A table, because ICU's bare Greek month is nominative in one engine and
  // genitive («Φεβρουαρίου») in another.
  const joinedEl = joinedValid ? `τον ${MONTHS_ACCUSATIVE[joined.getMonth()]} του ${joined.getFullYear()}` : null;
  const skills = (profile?.skills ?? []).slice(0, 3).map((s) => s.skillName).filter(Boolean);
  // Where the connection stands, under the profile page's key, read on opening.
  const { data: link } = useQuery({
    queryKey: qk('connection-status', userId),
    queryFn: () => getConnectionStatus(userId),
    enabled: open && canAct,
    staleTime: 60_000,
    retry: 0,
  });
  const linkStatus = link?.status ?? null;

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={500} closeDelay={150}>
        <HoverCardTrigger asChild>{children}</HoverCardTrigger>
        <HoverCardContent side="bottom" align="start" className="w-72 max-w-[calc(100vw-2rem)] rounded-lg p-3 text-sm">
          {isLoading || !profile ? (
            <p className="text-xs text-muted-foreground">
              {isLoading ? <BilingualText en="Loading…" el="Φόρτωση…" compact /> : <BilingualText en="Profile not available" el="Το προφίλ δεν είναι διαθέσιμο" compact />}
            </p>
          ) : (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/10 font-semibold text-primary-accessible">{initialsOf(profile.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate font-semibold text-foreground">{profile.displayName}</p>
                {profile.headline ? <p className="line-clamp-2 text-xs text-muted-foreground">{profile.headline}</p> : null}
                <p className="text-xs text-muted-foreground">
                  <StatusText value={profile.role} />
                  {profile.location ? <> · {profile.location}</> : null}
                </p>
                {skills.length ? <p className="truncate text-xs text-foreground">{skills.join(' · ')}</p> : null}
                {joinedEn && joinedEl ? (
                  <p className="pt-0.5 text-2xs text-muted-foreground">
                    <BilingualText en={`Member since ${joinedEn}`} el={`Μέλος από ${joinedEl}`} compact />
                  </p>
                ) : null}
              </div>
            </div>
          )}
          {canAct && profile ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3" data-hovercard-actions="">
              <MessageButton userId={userId} displayName={profile.displayName} />
              {linkStatus === 'accepted' ? (
                <span className="text-xs text-muted-foreground"><BilingualText en="Connected" el="Συνδεδεμένοι" compact /></span>
              ) : linkStatus === 'pending' ? (
                <span className="text-xs text-muted-foreground">
                  {link?.direction === 'received'
                    ? <BilingualText en="Asked to connect with you" el="Ζήτησε σύνδεση μαζί σας" compact />
                    : <BilingualText en="Request pending" el="Αίτημα σε αναμονή" compact />}
                </span>
              ) : (
                <ConnectButton userId={userId} displayName={profile.displayName} />
              )}
            </div>
          ) : null}
        </HoverCardContent>
    </HoverCard>
  );
}
