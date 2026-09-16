'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Full rewrite — pricing page backed by real /api/billing/plans data
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  Sparkles,
  Building2,
  Users,
  Crown,
  Zap,
  Shield,
  MessageCircle,
  Calendar,
  BarChart3,
  Palette,
  Key,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listBillingPlans, createBillingCheckout, type BillingPlanItem } from '@/lib/api';
import { formatCents, annualSavingsPct } from '@/lib/billing';
import { useSession } from '@/hooks/useSession';
import { LandingNav } from '@/components/layout/LandingNav';

type PlanFeature = {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
};

const FEATURES: PlanFeature[] = [
  { name: 'Profile & Discovery', free: true, pro: true, team: true, enterprise: true },
  { name: 'Basic Matching', free: true, pro: true, team: true, enterprise: true },
  { name: 'Direct Messages', free: '50/month', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Connection Requests', free: '10/month', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Event Access', free: true, pro: true, team: true, enterprise: true },
  { name: 'Advanced Matching Filters', free: false, pro: true, team: true, enterprise: true },
  { name: 'Priority in Discovery', free: false, pro: true, team: true, enterprise: true },
  { name: 'Mentor Booking', free: false, pro: true, team: true, enterprise: true },
  { name: 'Analytics Dashboard', free: false, pro: 'Basic', team: 'Advanced', enterprise: 'Custom' },
  { name: 'Team Members', free: false, pro: false, team: 'Up to 25', enterprise: 'Unlimited' },
  { name: 'Organization Branding', free: false, pro: false, team: true, enterprise: true },
  { name: 'Custom Domain', free: false, pro: false, team: false, enterprise: true },
  { name: 'SSO Integration', free: false, pro: false, team: false, enterprise: true },
  { name: 'API Access', free: false, pro: false, team: false, enterprise: true },
  { name: 'Dedicated Support', free: false, pro: false, team: 'Email', enterprise: '24/7 Priority' },
  { name: 'Custom Onboarding', free: false, pro: false, team: false, enterprise: true },
];

const PLANS = [
  {
    id: 'free',
    apiName: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    priceMonthly: 0,
    priceAnnual: 0,
    icon: Zap,
    color: 'text-muted-foreground',
    bgColor: 'bg-slate-500/10',
    popular: false,
    cta: 'Get Started',
    features: [
      'Basic profile & discovery',
      '50 messages per month',
      '10 connection requests',
      'Access to public events',
      'Community support',
    ],
  },
  {
    id: 'pro',
    apiName: 'premium',
    name: 'Pro',
    description: 'For serious founders & mentors',
    priceMonthly: 19,
    priceAnnual: 159,
    icon: Sparkles,
    color: 'text-primary-accessible',
    bgColor: 'bg-primary/10',
    popular: true,
    cta: 'Start Free Trial',
    features: [
      'Everything in Free',
      'Unlimited messages',
      'Unlimited connections',
      'Advanced matching filters',
      'Priority in discovery',
      'Mentor booking',
      'Basic analytics',
    ],
  },
  {
    id: 'team',
    apiName: 'team',
    name: 'Team',
    description: 'For accelerators & organizations',
    priceMonthly: 99,
    priceAnnual: 899,
    icon: Users,
    color: 'text-status-accent',
    bgColor: 'bg-status-accent-bg',
    popular: false,
    cta: 'Start Free Trial',
    features: [
      'Everything in Pro',
      'Up to 25 team members',
      'Organization branding',
      'Advanced analytics',
      'Program management',
      'Email support',
    ],
  },
  {
    id: 'enterprise',
    apiName: 'enterprise',
    name: 'Enterprise',
    description: 'For large institutions',
    priceMonthly: null,
    priceAnnual: null,
    icon: Building2,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning-bg',
    popular: false,
    cta: 'Contact Sales',
    features: [
      'Everything in Team',
      'Unlimited seats',
      'Custom domain',
      'SSO integration',
      'API access',
      '24/7 priority support',
      'Custom onboarding',
      'SLA guarantee',
    ],
  },
];

function FeatureCheck({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="icon-sm text-status-success" />;
  }
  if (value === false) {
    return <X className="icon-sm text-muted-foreground/40" />;
  }
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { hasSession } = useSession();

  const { data: plansData } = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: listBillingPlans,
    staleTime: 10 * 60_000,
  });

  const apiPlans = plansData?.plans ?? [];

  async function handleCheckout(plan: typeof PLANS[0]) {
    if (plan.id === 'enterprise') { window.location.href = '/contact'; return; }
    if (!hasSession) { window.location.href = '/register'; return; }
    const apiPlan = apiPlans.find(p => p.name === plan.apiName);
    const priceId = annual ? apiPlan?.stripePriceIdAnnual : apiPlan?.stripePriceIdMonthly;
    setCheckoutLoading(plan.id);
    try {
      const { url } = await createBillingCheckout(priceId ?? undefined);
      if (url) window.location.href = url;
      else window.location.href = '/settings/billing';
    } finally {
      setCheckoutLoading(null);
    }
  }

  // Use real API prices if available, fall back to static
  function getPlanPrice(plan: typeof PLANS[0]) {
    const api = apiPlans.find(p => p.name === plan.apiName);
    if (!api) return annual ? plan.priceAnnual : plan.priceMonthly;
    return annual ? Math.round(api.priceAnnual / 100) : Math.round(api.priceMonthly / 100);
  }

  function getSavings(plan: typeof PLANS[0]) {
    const api = apiPlans.find(p => p.name === plan.apiName);
    if (!api || api.priceMonthly === 0) return plan.id === 'pro' ? 30 : plan.id === 'team' ? 24 : 0;
    return annualSavingsPct(api.priceMonthly, api.priceAnnual);
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent pt-[52px]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <Badge variant="secondary" className="mb-4">
            <Crown className="mr-1.5 icon-sm" />
            Simple, transparent pricing
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose the plan that fits your journey
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free and scale as you grow. All plans include a 14-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-border/60 bg-secondary/40 p-0.5">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                !annual ? 'bg-background text-foreground' : 'text-muted-foreground',
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                annual ? 'bg-background text-foreground' : 'text-muted-foreground',
              )}
            >
              Annual
            </button>
            {annual && (
              <span className="ml-2 pr-2 text-xs text-status-success">
                Save up to {Math.max(...PLANS.filter(p => p.priceMonthly).map(p => getSavings(p)))}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = getPlanPrice(plan);
            const isEnterprise = plan.id === 'enterprise';
            const isFree = plan.id === 'free';
            const savings = getSavings(plan);

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col transition-all duration-300 hover:shadow-lg',
                  plan.popular && 'border-primary ring-1 ring-primary/20'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-sm">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-lg', plan.bgColor)}>
                    <Icon className={cn('icon-md', plan.color)} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  {/* Price */}
                  <div className="mb-6">
                    {isEnterprise ? (
                      <div className="text-3xl font-bold text-foreground">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">${price}</span>
                        <span className="text-muted-foreground">/{annual ? 'yr' : 'mo'}</span>
                      </div>
                    )}
                    {!isEnterprise && !isFree && annual && savings > 0 && (
                      <p className="mt-1 text-xs text-status-success font-medium">{savings}% off vs monthly</p>
                    )}
                    {!isEnterprise && !isFree && !annual && (
                      <p className="mt-1 text-xs text-muted-foreground">Save {savings}% with annual billing</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 icon-sm shrink-0 text-status-success" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={cn('w-full gap-2', plan.popular && 'bg-primary hover:bg-primary/90')}
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={checkoutLoading === plan.id}
                    onClick={() => handleCheckout(plan)}
                  >
                    {checkoutLoading === plan.id ? 'Redirecting…' : plan.cta}
                    {checkoutLoading !== plan.id && <ArrowRight className="icon-sm" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground">
            Compare all features
          </h2>

          {/* A scroll container that a keyboard user cannot reach is a WCAG 2.1.1
              failure on narrow viewports, where this table is the only way to
              read the comparison. tabIndex + a group role make it focusable and
              scrollable with the arrow keys. */}
          <div
            className="focus-ring overflow-x-auto rounded-md"
            tabIndex={0}
            role="group"
            aria-label="Plan feature comparison, scrolls horizontally"
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-4 text-left text-sm font-semibold text-foreground">Feature</th>
                  <th className="py-4 text-center text-sm font-semibold text-foreground">Free</th>
                  <th className="py-4 text-center text-sm font-semibold text-primary-accessible">Pro</th>
                  <th className="py-4 text-center text-sm font-semibold text-foreground">Team</th>
                  <th className="py-4 text-center text-sm font-semibold text-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr key={feature.name} className={cn('border-b border-border/40', i % 2 === 0 && 'bg-card/50')}>
                    <td className="py-3 text-sm text-muted-foreground">{feature.name}</td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center">
                        <FeatureCheck value={feature.free} />
                      </div>
                    </td>
                    <td className="py-3 text-center bg-primary/5">
                      <div className="flex justify-center">
                        <FeatureCheck value={feature.pro} />
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center">
                        <FeatureCheck value={feature.team} />
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center">
                        <FeatureCheck value={feature.enterprise} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground">
          Frequently asked questions
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              q: 'Can I switch plans later?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any differences.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards (Visa, Mastercard, Amex) and can arrange invoicing for Enterprise customers.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes, all paid plans include a 14-day free trial. No credit card required to start.',
            },
            {
              q: 'What happens when my trial ends?',
              a: 'You\'ll be notified before your trial ends. If you don\'t upgrade, you\'ll be moved to the Free plan automatically.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Absolutely. You can cancel your subscription at any time. You\'ll retain access until the end of your billing period.',
            },
            {
              q: 'Do you offer discounts for nonprofits?',
              a: 'Yes! We offer special pricing for nonprofits, educational institutions, and social enterprises. Contact us to learn more.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <h3 className="font-semibold text-foreground">{q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border/50 bg-gradient-to-t from-primary/5 to-transparent">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Ready to accelerate your startup journey?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of founders, mentors, and investors building meaningful connections.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/register">
                Start free trial
                <ArrowRight className="icon-sm" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
