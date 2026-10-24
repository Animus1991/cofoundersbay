/**
 * An organisation's access policies (docs §103).
 *
 * Four switches in the organisation's settings were stored under
 * `settings.policies` and read by nothing: the settings page said so. The
 * owner chose to apply them. Each one's meaning, default and words live
 * here, for the API that enforces them, the demo and the settings page.
 */

export const ORG_POLICY_KEYS = ['publicProfile', 'openApplications', 'mentorSelfRegistration', 'workspaceAccess'] as const;
export type OrgPolicyKey = (typeof ORG_POLICY_KEYS)[number];
export type OrgPolicies = Record<OrgPolicyKey, boolean>;

/** What an organisation that never touched the switches gets: what the platform did before. */
export const ORG_POLICY_DEFAULTS: OrgPolicies = {
  publicProfile: true,
  openApplications: true,
  mentorSelfRegistration: false,
  workspaceAccess: true,
};

/** The policies stored in an organisation's `settings` JSON, over the defaults. Anything not a boolean is ignored. */
export function readOrgPolicies(settings: unknown): OrgPolicies {
  const stored = settings && typeof settings === 'object' && !Array.isArray(settings)
    ? (settings as { policies?: unknown }).policies
    : undefined;
  const out: OrgPolicies = { ...ORG_POLICY_DEFAULTS };
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    for (const key of ORG_POLICY_KEYS) {
      const v = (stored as Record<string, unknown>)[key];
      if (typeof v === 'boolean') out[key] = v;
    }
  }
  return out;
}

/** The settings page's words: what each switch does, as the platform applies it. */
export const ORG_POLICY_COPY: Record<OrgPolicyKey, { label: { en: string; el: string }; hint: { en: string; el: string } }> = {
  publicProfile: {
    label: { en: 'Public profile', el: 'Δημόσιο προφίλ' },
    hint: {
      en: "Off: the organisation's page, members and cohort list are seen only by its members, and it leaves the directory. Programmes keep their own visibility.",
      el: 'Κλειστό: τη σελίδα, τα μέλη και τη λίστα κύκλων του οργανισμού τα βλέπουν μόνο τα μέλη του, και φεύγει από τον κατάλογο. Τα προγράμματα κρατούν τη δική τους ορατότητα.',
    },
  },
  openApplications: {
    label: { en: 'Open applications', el: 'Ανοιχτές αιτήσεις' },
    hint: {
      en: "On: any startup can apply to your public programmes. Off: only your organisation's members can; others are told it is by invitation.",
      el: 'Ανοιχτό: κάθε startup μπορεί να κάνει αίτηση στα δημόσια προγράμματά σας. Κλειστό: μόνο τα μέλη του οργανισμού· οι υπόλοιποι βλέπουν ότι γίνεται με πρόσκληση.',
    },
  },
  mentorSelfRegistration: {
    label: { en: 'Mentor self-registration', el: 'Αυτοεγγραφή μεντόρων' },
    hint: {
      en: 'On: mentors can ask to join your mentor pool from your page; an admin accepts or declines each request.',
      el: 'Ανοιχτό: οι μέντορες μπορούν να ζητήσουν ένταξη στη δεξαμενή σας από τη σελίδα σας· ένας διαχειριστής αποδέχεται ή απορρίπτει κάθε αίτημα.',
    },
  },
  workspaceAccess: {
    label: { en: 'Startup workspace access', el: 'Πρόσβαση στους χώρους startups' },
    hint: {
      en: "On: your admins can open the Builder workspaces of your cohorts' founders. Off: they cannot.",
      el: 'Ανοιχτό: οι διαχειριστές σας ανοίγουν τους χώρους Builder των ιδρυτών των κύκλων σας. Κλειστό: δεν μπορούν.',
    },
  },
};

export type OrgPolicyProblem = 'applications_closed' | 'mentor_requests_closed' | 'workspace_access_off' | 'not_a_mentor' | 'already_in_pool' | 'already_requested';

export const ORG_POLICY_PROBLEM_COPY: Record<OrgPolicyProblem, { en: string; el: string }> = {
  applications_closed: {
    en: 'This organisation takes applications by invitation: ask them to add you.',
    el: 'Αυτός ο οργανισμός δέχεται αιτήσεις μόνο με πρόσκληση: ζητήστε του να σας προσθέσει.',
  },
  mentor_requests_closed: {
    en: 'This organisation does not take requests to join its mentor pool.',
    el: 'Αυτός ο οργανισμός δεν δέχεται αιτήματα ένταξης στη δεξαμενή μεντόρων του.',
  },
  workspace_access_off: {
    en: "This organisation has turned off access to its founders' workspaces.",
    el: 'Αυτός ο οργανισμός έχει κλείσει την πρόσβαση στους χώρους εργασίας των ιδρυτών του.',
  },
  not_a_mentor: {
    en: 'Only mentors can ask to join a mentor pool: set up your mentor listing first.',
    el: 'Μόνο μέντορες μπορούν να ζητήσουν ένταξη σε δεξαμενή μεντόρων: φτιάξτε πρώτα την καταχώριση μέντορα.',
  },
  already_in_pool: {
    en: "You are already in this organisation's mentor pool.",
    el: 'Είστε ήδη στη δεξαμενή μεντόρων αυτού του οργανισμού.',
  },
  already_requested: {
    en: 'Your request is already waiting for an answer.',
    el: 'Το αίτημά σας περιμένει ήδη απάντηση.',
  },
};

/** A note with a request to join a mentor pool is at most this long. */
export const MENTOR_POOL_REQUEST_NOTE_MAX = 500;

/** Where a mentor stands with one organisation's pool. */
export type MentorPoolStanding = 'closed' | 'can_request' | 'requested' | 'in_pool';
