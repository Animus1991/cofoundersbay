import type { ExpertDirectoryItem, MentorProfileItem, SearchHit } from '@/lib/api';
import {
  coachingAreasFrom,
  reviewAreasFrom,
  type MentorService,
} from './services';

/** A person in the one mentor directory (docs §90.5, §111). */
export interface Mentor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  headline?: string;
  expertise: string[];
  hourlyRate?: number;
  /** The currency the mentor bills in, when their profile records one. */
  currency?: string;
  rating: number;
  totalSessions: number;
  location?: string;
  isFeatured?: boolean;
  matchScore?: number;       // 0-100
  availabilityStatus?: 'available' | 'busy' | 'limited';
  isVerified?: boolean;
  isRemote?: boolean;
  responseTime?: string;     // e.g. "Responds in 2h"
  /** Every word the person filed their help under: the areas are read from these. */
  areaWords: string[];
  /** Set when the person takes review requests (the expert directory lists them). */
  review?: {
    completed: number;
    rating: number | null;
    feeFrom: number | null;
    currency: string;
  };
}

/** A mentor from the profile search: what a search hit carries, nothing more. */
export function hitToMentor(hit: SearchHit): Mentor {
  const rp = (hit as unknown as { rolePayload?: Record<string, unknown> }).rolePayload ?? {};
  const expertise = Array.isArray(rp.expertiseAreas)
    ? (rp.expertiseAreas as string[])
    : hit.skillNames ?? [];
  const hourlyRate = typeof rp.hourlyRate === 'string' ? parseFloat(rp.hourlyRate) : undefined;
  return {
    id: hit.userId,
    displayName: hit.displayName,
    avatarUrl: hit.avatarUrl ?? null,
    bio: hit.bio ?? '',
    expertise: expertise.slice(0, 5),
    hourlyRate: hourlyRate && !isNaN(hourlyRate) ? hourlyRate : undefined,
    rating: 0,
    totalSessions: 0,
    location: hit.location ?? undefined,
    isFeatured: false,
    areaWords: [...expertise],
  };
}

const availabilityOf = (status: MentorProfileItem['availabilityStatus']): Mentor['availabilityStatus'] =>
  status === 'unavailable' ? 'busy' : status;

/** A mentor from the mentorship directory, which knows ratings, sessions and availability. */
export function profileToMentor(profile: MentorProfileItem): Mentor {
  const words = [...profile.skills, ...profile.industries];
  return {
    id: profile.userId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio ?? '',
    headline: profile.headline ?? undefined,
    expertise: words.slice(0, 5),
    hourlyRate: profile.isFree ? undefined : (profile.hourlyRate ?? undefined),
    currency: profile.currency ?? undefined,
    rating: profile.rating ?? 0,
    totalSessions: profile.sessionCount,
    location: profile.location ?? undefined,
    isFeatured: false,
    availabilityStatus: availabilityOf(profile.availabilityStatus),
    areaWords: words,
  };
}

/** The search hit, with what the mentorship directory knows about the same person. */
function withProfile(mentor: Mentor, profile: MentorProfileItem): Mentor {
  return {
    ...mentor,
    headline: mentor.headline ?? profile.headline ?? undefined,
    rating: mentor.rating > 0 ? mentor.rating : (profile.rating ?? 0),
    totalSessions: mentor.totalSessions || profile.sessionCount,
    availabilityStatus: mentor.availabilityStatus ?? availabilityOf(profile.availabilityStatus),
    hourlyRate: mentor.hourlyRate ?? (profile.isFree ? undefined : (profile.hourlyRate ?? undefined)),
    currency: mentor.currency ?? profile.currency ?? undefined,
    location: mentor.location ?? profile.location ?? undefined,
    areaWords: [...mentor.areaWords, ...profile.skills, ...profile.industries],
  };
}

/** The person, with their standing as a reviewer. */
function withExpert(mentor: Mentor, expert: ExpertDirectoryItem): Mentor {
  return {
    ...mentor,
    isVerified: mentor.isVerified || expert.isVerified,
    areaWords: [...mentor.areaWords, ...expert.specializations, ...expert.skills, ...expert.industries],
    review: {
      completed: expert.completedReviews,
      rating: expert.rating,
      feeFrom: expert.isFree ? null : expert.feeFrom,
      currency: expert.currency,
    },
  };
}

/**
 * The one directory, from the three reads that used to fill three pages.
 *
 * The profile search leads (it is what the search box asks), each person
 * gains what the mentorship directory knows about them (ratings, sessions,
 * availability, currency), and the expert directory marks who takes review
 * requests. Without a search, mentors the search did not return are added
 * from the mentorship directory, so nobody Coaching listed goes missing here.
 */
export function mergeDirectory({
  hits,
  profiles,
  experts,
  searching,
}: {
  hits: readonly Mentor[];
  profiles: readonly MentorProfileItem[];
  experts: readonly ExpertDirectoryItem[];
  searching: boolean;
}): Mentor[] {
  const profileOf = new Map(profiles.map((profile) => [profile.userId, profile]));
  const expertOf = new Map(experts.map((expert) => [expert.userId, expert]));
  const seen = new Set<string>();
  const people: Mentor[] = [];
  for (const hit of hits) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    const profile = profileOf.get(hit.id);
    people.push(profile ? withProfile(hit, profile) : hit);
  }
  if (!searching) {
    for (const profile of profiles) {
      if (seen.has(profile.userId)) continue;
      seen.add(profile.userId);
      people.push(profileToMentor(profile));
    }
  }
  return people.map((mentor) => {
    const expert = expertOf.get(mentor.id);
    return expert ? withExpert(mentor, expert) : mentor;
  });
}

/** The areas a person is filed under for a service (none for plain mentoring). */
export function areasOf(mentor: Mentor, service: MentorService): string[] {
  if (service === 'coaching') return coachingAreasFrom(mentor.areaWords);
  if (service === 'review') return reviewAreasFrom(mentor.areaWords);
  return [];
}

/** Whether the person offers the service: everyone mentors and coaches; reviewers are listed. */
export function offers(mentor: Mentor, service: MentorService): boolean {
  return service === 'review' ? mentor.review != null : true;
}

/** What the service costs with this person: the review fee from, or the hourly rate. */
export function priceOf(mentor: Mentor, service: MentorService): number | null {
  if (service === 'review') return mentor.review?.feeFrom ?? null;
  return mentor.hourlyRate ?? null;
}

/**
 * The area chips for a service: each area the people on screen are filed
 * under, most common first, with how many. An area the link arrived with
 * stays as a chip even at nought, so it can be seen and cleared.
 */
export function areaChips(
  mentors: readonly Mentor[],
  service: MentorService,
  keys: readonly string[],
  selected: string | null,
): Array<{ key: string; count: number }> {
  if (service === 'mentoring') return [];
  const counts = new Map<string, number>();
  for (const mentor of mentors) {
    for (const area of areasOf(mentor, service)) counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return keys
    .map((key, index) => ({ key, count: counts.get(key) ?? 0, index }))
    .filter((chip) => chip.count > 0 || chip.key === selected)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ key, count }) => ({ key, count }));
}
