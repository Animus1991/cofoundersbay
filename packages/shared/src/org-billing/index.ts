/**
 * An organisation's own plan (docs §104).
 *
 * Billing existed for people and for white-label tenants; an organisation
 * had none, and its settings showed an illustrative "Organization Pro" with a
 * card ending 4242. The plan an organisation buys is the one the pricing page
 * already sells "for accelerators & organizations": Team, up to 25 members;
 * Enterprise is by contact. Rules shared by the API, the demo and the page.
 */

/** Plans an organisation can hold, by `BillingPlan.name`. */
export const ORG_PLAN_NAMES = ['team', 'enterprise'] as const;
export type OrgPlanName = (typeof ORG_PLAN_NAMES)[number];

/**
 * The Team plan as the pricing page sells it, written when the plan row does
 * not exist yet. Prices are in minor units; an admin changes them, and sets
 * the Stripe price ids, in Billing plans.
 */
export const ORG_TEAM_PLAN_DEFAULTS = {
  name: 'team',
  displayName: 'Team',
  description: 'For accelerators & organizations',
  planType: 'team',
  priceMonthly: 9_900,
  priceAnnual: 89_900,
  currency: 'USD',
  seatLimit: 25,
  features: { members: 25, branding: true, analytics: 'advanced', programs: true, support: 'email' },
  sortOrder: 2,
} as const;

export type OrgBillingCycle = 'monthly' | 'annual';

/** Statuses during which a plan's seat limit applies. */
export const ORG_PLAN_LIVE_STATUSES = ['active', 'trialing', 'past_due'] as const;

/** Members against the plan's seats; no limit without a plan. */
export function orgSeats(used: number, limit: number | null | undefined): { used: number; limit: number | null; full: boolean; left: number | null } {
  const l = typeof limit === 'number' && limit > 0 ? limit : null;
  return { used, limit: l, full: l !== null && used >= l, left: l === null ? null : Math.max(0, l - used) };
}

export const ORG_BILLING_STATUS_COPY: Record<string, { en: string; el: string }> = {
  trialing: { en: 'Trial', el: 'Δοκιμαστική περίοδος' },
  active: { en: 'Active', el: 'Ενεργό' },
  past_due: { en: 'Payment overdue', el: 'Ληξιπρόθεσμη πληρωμή' },
  unpaid: { en: 'Unpaid', el: 'Απλήρωτο' },
  canceled: { en: 'Cancelled', el: 'Ακυρωμένο' },
  incomplete: { en: 'Waiting for payment', el: 'Αναμονή πληρωμής' },
  incomplete_expired: { en: 'Payment not completed', el: 'Η πληρωμή δεν ολοκληρώθηκε' },
  paused: { en: 'Paused', el: 'Σε παύση' },
};

export type OrgBillingProblem = 'billing_not_configured' | 'not_an_org_plan' | 'enterprise_by_contact' | 'plan_has_no_price' | 'no_subscription' | 'seats_full';

export const ORG_BILLING_PROBLEM_COPY: Record<OrgBillingProblem, { en: string; el: string }> = {
  billing_not_configured: { en: 'Payments are not set up on this server yet.', el: 'Οι πληρωμές δεν έχουν ρυθμιστεί ακόμη σε αυτόν τον διακομιστή.' },
  not_an_org_plan: { en: 'That plan is not one an organisation can hold.', el: 'Αυτό το πλάνο δεν είναι πλάνο οργανισμού.' },
  enterprise_by_contact: { en: 'Enterprise is arranged with our team: write to enterprise@cofounderbay.com.', el: 'Το Enterprise συμφωνείται με την ομάδα μας: γράψτε στο enterprise@cofounderbay.com.' },
  plan_has_no_price: { en: 'This plan has no price for that billing period yet.', el: 'Αυτό το πλάνο δεν έχει ακόμη τιμή για αυτή την περίοδο χρέωσης.' },
  no_subscription: { en: 'Your organisation has no paid plan to manage yet.', el: 'Ο οργανισμός σας δεν έχει ακόμη πληρωμένο πλάνο για διαχείριση.' },
  seats_full: { en: "Every seat of your organisation's plan is taken: change the plan or remove a member first.", el: 'Όλες οι θέσεις του πλάνου του οργανισμού σας είναι πιασμένες: αλλάξτε πλάνο ή αφαιρέστε πρώτα ένα μέλος.' },
};
