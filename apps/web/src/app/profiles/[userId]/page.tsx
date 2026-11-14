import { Metadata } from 'next';
import PublicProfilePage from './ProfileContent';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * The link preview's name and headline, from the endpoint the page itself
 * reads (`GET /profiles/:userId`, which already hides a members-only profile
 * from a visitor). It asked `/profiles/:userId/public`, which never existed,
 * so every shared profile link previewed as the generic card. The API wraps
 * its answer in `{ data }`; a slow or missing API keeps the generic preview.
 */
async function fetchPublicProfile(userId: string) {
  if (!/^[\w.-]{1,80}$/.test(userId)) return null;
  try {
    const res = await fetch(`${API_URL}/api/profiles/${encodeURIComponent(userId)}`, {
      signal: AbortSignal.timeout(1500),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: Record<string, unknown> } & Record<string, unknown>;
    const profile = (body?.data ?? body) as { displayName?: string; headline?: string | null; role?: string | null; avatarUrl?: string | null } | null;
    return profile?.displayName ? profile : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const profile = await fetchPublicProfile(userId);
  if (!profile) {
    return { title: 'Profile | CoFounderBay', description: 'View this profile on CoFounderBay' };
  }
  // `??` guarded the headline but not the role, so a payload without one put the
  // literal word into the description: "undefined on CoFounderBay", in the meta
  // tag and the OpenGraph card that link previews read.
  const summary =
    profile.headline ??
    (profile.role ? `${profile.role} on CoFounderBay` : 'View this profile on CoFounderBay');

  return {
    title: `${profile.displayName ?? 'Profile'} | CoFounderBay`,
    description: summary,
    openGraph: {
      title: `${profile.displayName ?? 'Profile'} on CoFounderBay`,
      description: summary,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <PublicProfilePage userId={userId} />;
}
