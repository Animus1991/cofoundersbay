'use client';

import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { getPublicProfile } from '@/lib/api';
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
 * key, so opening the profile afterwards is already loaded. Read-only on
 * purpose: a tooltip holds no buttons, and the profile is one click away.
 * Touch screens never open it (a tap follows the link).
 */
export function PersonHovercard({ userId, children }: { userId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
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

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="w-72 max-w-[calc(100vw-2rem)] rounded-lg p-3 text-sm">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
