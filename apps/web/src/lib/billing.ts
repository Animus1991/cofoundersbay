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
  active: 'bg-status-success-bg text-status-success border-status-success-border',
  trialing: 'bg-status-info-bg text-status-info border-status-info-border',
  past_due: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  canceled: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
  unpaid: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  incomplete: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  incomplete_expired: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  paused: 'bg-slate-500/10 text-muted-foreground border-slate-500/20',
};
