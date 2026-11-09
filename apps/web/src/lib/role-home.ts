import { starterAudience } from '@/lib/copilot-starters';
import { saysLookingFor } from '@/lib/match-explain';

/**
 * The first page says one thing to each kind of member (docs §119): what they
 * came for, and the one thing the platform needs from them to answer it. The
 * layout is the same for all of them; a platform admin keeps the console.
 */
export type HomeAudience = 'founder' | 'mentor' | 'investor' | 'provider' | 'org';

type Words = { en: string; el: string };

export const HOME_COPY: Record<HomeAudience, { title: Words; description: Words; want: Words }> = {
  founder: {
    title: { en: 'Find who you will build your company with', el: 'Βρείτε με ποιον θα χτίσετε την εταιρεία σας' },
    description: { en: 'People who fit what you are looking for, and a way to start working with them.', el: 'Άνθρωποι που ταιριάζουν με όσα ψάχνετε, και ένας τρόπος να ξεκινήσετε μαζί τους.' },
    want: { en: 'Say who you are looking for', el: 'Πείτε ποιον ψάχνετε' },
  },
  mentor: {
    title: { en: 'Find the founders you can help', el: 'Βρείτε τους ιδρυτές που μπορείτε να βοηθήσετε' },
    description: { en: 'People who fit what you know, and a way to start working with them.', el: 'Άνθρωποι που ταιριάζουν με όσα γνωρίζετε, και ένας τρόπος να ξεκινήσετε μαζί τους.' },
    want: { en: 'Say what you can help with', el: 'Πείτε σε τι μπορείτε να βοηθήσετε' },
  },
  investor: {
    title: { en: 'Find the teams worth backing', el: 'Βρείτε τις ομάδες που αξίζει να στηρίξετε' },
    description: { en: 'People who fit what you invest in, and a way to start talking with them.', el: 'Άνθρωποι που ταιριάζουν με όσα επενδύετε, και ένας τρόπος να ξεκινήσετε τη συζήτηση μαζί τους.' },
    want: { en: 'Say what you invest in', el: 'Πείτε σε τι επενδύετε' },
  },
  provider: {
    title: { en: 'Find the founders who need what you offer', el: 'Βρείτε τους ιδρυτές που χρειάζονται αυτό που προσφέρετε' },
    description: { en: 'People who fit what you do, and a way to start working with them.', el: 'Άνθρωποι που ταιριάζουν με αυτό που κάνετε, και ένας τρόπος να ξεκινήσετε μαζί τους.' },
    want: { en: 'Say what you offer', el: 'Πείτε τι προσφέρετε' },
  },
  org: {
    title: { en: 'Find the people for your programmes', el: 'Βρείτε τους ανθρώπους για τα προγράμματά σας' },
    description: { en: 'Founders and mentors who fit your programmes, and a way to start working with them.', el: 'Ιδρυτές και μέντορες που ταιριάζουν με τα προγράμματά σας, και ένας τρόπος να ξεκινήσετε μαζί τους.' },
    want: { en: 'Describe your programmes', el: 'Περιγράψτε τα προγράμματά σας' },
  },
};

/** The role an account chose at registration, in the words `starterAudience` does not know. */
const ACCOUNT_ROLES = { investor: 'investor', provider: 'provider', org: 'org', admin: 'admin' } as const;

/**
 * Who this member is. A real account has no role facet unless one was added, and
 * the API then answers `aspiring_founder` whatever they signed up as; the role
 * chosen at registration is the one that says so.
 */
export function memberRole(primaryRole: string | null | undefined, accountRole: string | null | undefined): string | undefined {
  return primaryRole && primaryRole !== 'aspiring_founder' ? primaryRole : (accountRole ?? primaryRole ?? undefined);
}

/** Course creators teach, so they read as mentors, as their dashboard does. */
function audienceOf(role: string | null | undefined) {
  if (role === 'course_creator') return 'mentor';
  return (role && ACCOUNT_ROLES[role as keyof typeof ACCOUNT_ROLES]) || starterAudience(role);
}

export function homeAudience(role: string | null | undefined): HomeAudience {
  const audience = audienceOf(role);
  return audience === 'admin' ? 'founder' : audience;
}

const OVERVIEW = {
  founder: '/dashboard/founder',
  mentor: '/dashboard/mentor',
  investor: '/dashboard/investor',
  provider: '/dashboard/provider',
  org: '/dashboard/incubator',
  admin: '/admin/dashboard',
} as const;

/** The member's Overview: the working dashboard, one link from the first page. */
export function overviewPathFor(role: string | null | undefined): string {
  return OVERVIEW[audienceOf(role)];
}

const filled = (value: unknown) => Array.isArray(value) && value.some((item) => typeof item === 'string' && item.trim() !== '');

/** Whether the profile answers the first step, in the field profile edit saves it to. */
export function saysWhatTheyWant(
  audience: HomeAudience,
  profile: { rolePayload?: Record<string, unknown> | null; skills?: ReadonlyArray<unknown> | null } | null | undefined,
): boolean {
  const payload = profile?.rolePayload ?? {};
  switch (audience) {
    case 'mentor':
      return filled(payload.expertiseAreas);
    case 'investor':
      return filled(payload.investmentFocus) || filled(payload.stages);
    case 'provider':
      return (profile?.skills?.length ?? 0) > 0;
    case 'org':
      return filled(payload.programTypes) || (typeof payload.organizationType === 'string' && payload.organizationType !== '');
    default:
      return saysLookingFor(profile);
  }
}
