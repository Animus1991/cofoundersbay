/**
 * billing.ts — Feature gating constants and plan-to-feature mapping.
 * This is the single source of truth for what each plan includes.
 * The backend enforces the same rules via BillingService.getFeatureAccess().
 */

export type PlanFeatureKey =
  | 'advancedMatching'
  | 'unlimitedMessages'
  | 'mentorBooking'
  | 'analyticsBasic'
  | 'analyticsAdvanced'
  | 'teamSeats'
  | 'orgBranding'
  | 'customDomain'
  | 'sso'
  | 'whiteLabel'
  | 'apiAccess'
  | 'prioritySupport'
  | 'dedicatedSupport'
  | 'customOnboarding'
  | 'programManagement'
  | 'communityModules'
  | 'advancedExports'
  | 'featureFlags';

export type PlanFeatureSet = Record<PlanFeatureKey, boolean | string>;

/** What each plan tier includes. Mirrors the BillingPlan.features JSON in the DB. */
export const PLAN_FEATURES: Record<string, PlanFeatureSet> = {
  free: {
    advancedMatching: false,
    unlimitedMessages: false,
    mentorBooking: false,
    analyticsBasic: false,
    analyticsAdvanced: false,
    teamSeats: false,
    orgBranding: false,
    customDomain: false,
    sso: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: false,
    dedicatedSupport: false,
    customOnboarding: false,
    programManagement: false,
    communityModules: false,
    advancedExports: false,
    featureFlags: false,
  },
  individual_premium: {
    advancedMatching: true,
    unlimitedMessages: true,
    mentorBooking: true,
    analyticsBasic: true,
    analyticsAdvanced: false,
    teamSeats: false,
    orgBranding: false,
    customDomain: false,
    sso: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: true,
    dedicatedSupport: false,
    customOnboarding: false,
    programManagement: false,
    communityModules: false,
    advancedExports: false,
    featureFlags: false,
  },
  team: {
    advancedMatching: true,
    unlimitedMessages: true,
    mentorBooking: true,
    analyticsBasic: true,
    analyticsAdvanced: 'advanced',
    teamSeats: true,
    orgBranding: true,
    customDomain: false,
    sso: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: true,
    dedicatedSupport: 'email',
    customOnboarding: false,
    programManagement: true,
    communityModules: true,
    advancedExports: true,
    featureFlags: false,
  },
  organization: {
    advancedMatching: true,
    unlimitedMessages: true,
    mentorBooking: true,
    analyticsBasic: true,
    analyticsAdvanced: true,
    teamSeats: true,
    orgBranding: true,
    customDomain: true,
    sso: true,
    whiteLabel: false,
    apiAccess: true,
    prioritySupport: true,
    dedicatedSupport: 'email',
    customOnboarding: false,
    programManagement: true,
    communityModules: true,
    advancedExports: true,
    featureFlags: false,
  },
  enterprise: {
    advancedMatching: true,
    unlimitedMessages: true,
    mentorBooking: true,
    analyticsBasic: true,
    analyticsAdvanced: true,
    teamSeats: true,
    orgBranding: true,
    customDomain: true,
    sso: true,
    whiteLabel: true,
    apiAccess: true,
    prioritySupport: true,
    dedicatedSupport: '24/7',
    customOnboarding: true,
    programManagement: true,
    communityModules: true,
    advancedExports: true,
    featureFlags: true,
  },
};

/** Returns true if the given plan includes the feature. */
export function planHasFeature(planName: string, feature: PlanFeatureKey): boolean {
  const features = PLAN_FEATURES[planName] ?? PLAN_FEATURES.free;
  const value = features[feature];
  return Boolean(value);
}

/** Cents to display string. E.g. 1900 → "$19" */
export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Compute annual savings % vs paying monthly × 12 */
export function annualSavingsPct(monthlyPriceCents: number, annualPriceCents: number): number {
  if (monthlyPriceCents === 0) return 0;
  const monthlyCost12 = monthlyPriceCents * 12;
  return Math.round(((monthlyCost12 - annualPriceCents) / monthlyCost12) * 100);
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 border-green-500/20',
  trialing: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  past_due: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  canceled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  unpaid: 'bg-red-500/10 text-red-700 border-red-500/20',
  incomplete: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  incomplete_expired: 'bg-red-500/10 text-red-700 border-red-500/20',
  paused: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};
