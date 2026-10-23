'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserOrganizations, type OrgMembershipItem } from '@/lib/api';
import { qk } from '@/lib/query-keys';

/**
 * Which organisation the /org screens are administering.
 *
 * Those eleven screens each showed a fixed array and never asked. The
 * endpoints they needed existed the whole time — `/api/org/:slug/cohorts`,
 * `/api/org/:slug/members`, `/api/programs/my-programs` — but every one of
 * them is scoped to an organisation, and nothing on the page knew which. This
 * is that answer, in one place: resolve it once, and eleven pages agree about
 * whose data they are showing instead of eleven copies of the same lookup
 * drifting apart.
 *
 * The first membership is the answer today. A person in two organisations
 * needs a switcher, and when one exists it changes here and everywhere at
 * once — which is the reason this is a hook and not a line in each page.
 */
export type CurrentOrg = {
  membership: OrgMembershipItem | null;
  /** The slug every `/api/org/:slug/...` route wants. Null until it is known. */
  slug: string | null;
  name: string | null;
  /** The viewer's role in that organisation, for screens that gate on it. */
  role: string | null;
  /** True while the lookup is in flight — distinct from "belongs to none". */
  isLoading: boolean;
  /** True once the lookup finished and found no organisation. */
  isNone: boolean;
  /**
   * True when the lookup failed and nothing is cached: not "belongs to none".
   * The /org screens read it, so an unread membership is not drawn as an
   * organisation with nothing in it (docs §96).
   */
  failed: boolean;
  isFetching: boolean;
  refetch: () => void;
  memberships: OrgMembershipItem[];
};

export function useCurrentOrg(): CurrentOrg {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: qk('org', 'my-memberships'),
    queryFn: getUserOrganizations,
    // An organisation membership changes rarely and every /org screen asks for
    // it, so this is cached longer than the data it unlocks.
    staleTime: 5 * 60_000,
    retry: 0,
  });

  const memberships = data?.memberships ?? [];
  const membership = memberships[0] ?? null;

  return {
    membership,
    slug: membership?.organization?.slug ?? null,
    name: membership?.organization?.name ?? null,
    role: membership?.role ?? null,
    isLoading,
    // "No organisation yet" only from an answer; a failed read said it too.
    isNone: !isLoading && Boolean(data) && memberships.length === 0,
    failed: isError && !data,
    isFetching,
    refetch: () => void refetch(),
    memberships,
  };
}
