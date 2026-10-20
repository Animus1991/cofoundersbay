/**
 * Onboarding answers kept across a reload or a lost tab.
 *
 * The conversational onboarding held everything in memory, so a refresh on
 * step five started again from "Welcome". The answers wait in localStorage
 * under the member's id until the profile is created, then they are removed.
 * Every read and write is guarded: private windows and blocked storage just
 * start over, as before.
 */

/** 'goals' is a founder's step (stage, commitment, who they look for); other roles skip it. */
export type OnboardingStepId = 'name' | 'role' | 'headline' | 'location' | 'bio' | 'goals' | 'skills';

export type OnboardingProgress = {
  step: OnboardingStepId;
  form: {
    displayName: string;
    headline: string;
    location: string;
    bio: string;
    role: 'founder' | 'mentor' | 'investor' | 'org';
    skillIds: string[];
    /** A founder's match fields; present only once answered. */
    stage?: string;
    commitment?: string;
    lookingFor?: string[];
  };
  at: number;
};

const STEPS: readonly OnboardingStepId[] = ['name', 'role', 'headline', 'location', 'bio', 'goals', 'skills'];
const ROLES = ['founder', 'mentor', 'investor', 'org'] as const;
/** Answers older than this were abandoned; the next visit starts clean. */
const MAX_AGE_MS = 7 * 24 * 60 * 60_000;

const key = (userId: string | null | undefined) => `cfb.onboarding.${userId || 'anon'}`;

export function saveOnboardingProgress(userId: string | null | undefined, progress: Omit<OnboardingProgress, 'at'>, now = Date.now()): void {
  try {
    window.localStorage.setItem(key(userId), JSON.stringify({ ...progress, at: now }));
  } catch {
    // Storage blocked: a reload starts over, as it always did.
  }
}

export function loadOnboardingProgress(userId: string | null | undefined, now = Date.now()): OnboardingProgress | null {
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<OnboardingProgress>;
    const f = p?.form;
    if (!p || !STEPS.includes(p.step as OnboardingStepId) || typeof p.at !== 'number' || now - p.at > MAX_AGE_MS || !f) return null;
    const text = (v: unknown) => (typeof v === 'string' ? v.slice(0, 2000) : '');
    return {
      step: p.step as OnboardingStepId,
      at: p.at,
      form: {
        displayName: text(f.displayName),
        headline: text(f.headline),
        location: text(f.location),
        bio: text(f.bio),
        role: (ROLES as readonly string[]).includes(f.role as string) ? (f.role as OnboardingProgress['form']['role']) : 'founder',
        skillIds: Array.isArray(f.skillIds) ? f.skillIds.filter((s): s is string => typeof s === 'string').slice(0, 50) : [],
        ...(typeof f.stage === 'string' && f.stage ? { stage: f.stage.slice(0, 100) } : {}),
        ...(typeof f.commitment === 'string' && f.commitment ? { commitment: f.commitment.slice(0, 100) } : {}),
        ...(Array.isArray(f.lookingFor) && f.lookingFor.length
          ? { lookingFor: f.lookingFor.filter((s): s is string => typeof s === 'string').slice(0, 10) }
          : {}),
      },
    };
  } catch {
    return null;
  }
}

export function clearOnboardingProgress(userId: string | null | undefined): void {
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}

/** Steps answered before `step`, in order. */
export function stepsBefore(step: OnboardingStepId): OnboardingStepId[] {
  return STEPS.slice(0, STEPS.indexOf(step));
}
