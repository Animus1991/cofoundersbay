'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useStoredUser } from '@/hooks/useStoredUser';
import { followPerson, getFollowStatus, unfollowPerson } from '@/lib/updates-api';
import { qk } from '@/lib/query-keys';

/**
 * "Follow updates" on a person's profile: their founder updates reach the
 * follower's /updates and notifications. Signed out, it is a sign-in link
 * that returns to the profile; on one's own profile it is not shown.
 */
/**
 * Whether the reader follows this person's updates, and the switch: shared by
 * the button and the profile's "More" menu (docs §101).
 */
export function useFollowPerson(userId: string) {
  const me = useStoredUser();
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const signedIn = Boolean(me?.id);
  const self = Boolean(me?.id && me.id === userId);
  const status = useQuery({ queryKey: qk('follows', userId), queryFn: () => getFollowStatus(userId), enabled: signedIn && !!userId && !self });
  const toggle = useMutation({
    mutationFn: () => (status.data?.following ? unfollowPerson(userId) : followPerson(userId)),
    onSuccess: (next) => {
      queryClient.setQueryData(qk('follows', userId), next);
      void queryClient.invalidateQueries({ queryKey: qk('founder-updates') });
    },
    onError: () => showError('Could not change following'),
  });
  return {
    signedIn,
    self,
    following: status.data?.following === true,
    busy: status.isLoading || toggle.isPending,
    toggle: () => toggle.mutate(),
  };
}

export function FollowButton({ userId, className }: { userId: string; className?: string }) {
  const { signedIn, self, following, busy, toggle } = useFollowPerson(userId);

  if (!userId || self) return null;
  if (!signedIn) {
    const here = typeof window !== 'undefined' ? window.location.pathname : '/';
    return (
      <Button asChild size="sm" variant="outline" className={className}>
        <Link href={`/login?redirect=${encodeURIComponent(here)}`}><BilingualText en="Follow updates" el="Ακολουθήστε" compact /></Link>
      </Button>
    );
  }
  return (
    <Button size="sm" variant={following ? 'secondary' : 'outline'} className={className} disabled={busy} aria-pressed={following} onClick={toggle}>
      <BilingualText en={following ? 'Following' : 'Follow updates'} el={following ? 'Ακολουθείτε' : 'Ακολουθήστε'} compact />
    </Button>
  );
}
