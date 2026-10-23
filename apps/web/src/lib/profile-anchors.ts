/**
 * Where the trust and working-style cards live: on one's own profile
 * (docs §99). Verification, "Open to" and "How you like to work" were in
 * Settings; the owner moved them to the profile, where they show. Old
 * `/settings#…` links still arrive there (Settings sends them on).
 */
export const PROFILE_VERIFICATION_HREF = '/profile#verification';
export const PROFILE_OPEN_TO_HREF = '/profile#open-to';
export const PROFILE_HOW_YOU_WORK_HREF = '/profile#how-you-work';

/** The Settings anchors that moved, and where each one is now. */
export const MOVED_SETTINGS_ANCHORS: Record<string, string> = {
  verification: PROFILE_VERIFICATION_HREF,
  'open-to': PROFILE_OPEN_TO_HREF,
  'how-you-work': PROFILE_HOW_YOU_WORK_HREF,
};
