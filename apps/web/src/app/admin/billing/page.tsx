'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, Search, TrendingUp, CreditCard, Building2,
  AlertTriangle, CheckCircle2, Clock, XCircle, Plus, Trash2,
  RefreshCw, Loader2, FileText, Download, Tag, Settings,
  ChevronDown, Users, Crown,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  getAdminBillingStats, listAdminSubscriptions, listAdminInvoices,
  adminCreatePlan, adminUpdatePlan, adminDeletePlan,
  adminOverrideSubscription, adminExtendTrial, adminCancelSubscription,
  listCoupons, createCoupon, deleteCoupon,
  type BillingSubscription, type BillingInvoice, type BillingPlanItem, type PromotionCodeItem,
} from '@/lib/api';
import { formatCents, STATUS_COLORS } from '@/lib/billing';
import { cn } from '@/lib/utils';

const ALL_STATUSES = 'all';

function SubRow({
  sub, plans, onExtendTrial, onCancel, onOverride,
}: {
  sub: BillingSubscription;
  plans: BillingPlanItem[];
  onExtendTrial: (id: string) => void;
  onCancel: (id: string, immediate: boolean) => void;
  onOverride: (sub: BillingSubscription) => void;
}) {
  const owner = (sub as Record<string, unknown>).user as { email?: string } | null
    ?? (sub as Record<string, unknown>).tenant as { name?: string } | null;
  const ownerLabel = (owner as { email?: string })?.email
    ?? (owner as { name?: string })?.name
    ?? sub.userId ?? sub.tenantId ?? '—';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate max-w-[200px]">{ownerLabel}</span>
          <Badge variant="outline" className={cn('text-xs capitalize shrink-0', STATUS_COLORS[sub.status] ?? '')}>
            {sub.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="text-xs shrink-0">{sub.plan?.displayName ?? '—'}</Badge>
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          {sub.billingCycle} · {sub.currentPeriodEnd ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          {sub.seatLimit ? ` · ${sub.activeSeatCount}/${sub.seatLimit} seats` : ''}
        </p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-semibold">
          {formatCents(sub.billingCycle === 'annual' ? (sub.plan?.priceAnnual ?? 0) : (sub.plan?.priceMonthly ?? 0), sub.plan?.currency)}
        </p>
        <p className="text-xs text-muted-foreground">/{sub.billingCycle === 'annual' ? 'yr' : 'mo'}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onOverride(sub)}>
          <Settings className="icon-sm mr-1" aria-hidden="true" />Override
        </Button>
        {sub.status === 'trialing' && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onExtendTrial(sub.id)}>
            <Clock className="icon-sm mr-1" aria-hidden="true" />+7d
          </Button>
        )}
        {sub.status !== 'canceled' && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive-emphasis hover:text-destructive-emphasis" onClick={() => onCancel(sub.id, false)}>
            <XCircle className="icon-sm mr-1" aria-hidden="true" />Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function InvRow({ inv }: { inv: BillingInvoice }) {
  const statusColors: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    open: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    void: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    uncollectible: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  };
  const sub = (inv as Record<string, unknown>).subscription as { user?: { email?: string }; tenant?: { name?: string } } | null;
  const ownerLabel = sub?.user?.email ?? sub?.tenant?.name ?? inv.subscriptionId.slice(0, 8);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <FileText className="icon-sm text-muted-foreground shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{inv.invoiceNumber}</span>
          <Badge variant="outline" className={cn('text-xs capitalize', statusColors[inv.status] ?? '')}>{inv.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{ownerLabel} · {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
      <p className="text-sm font-semibold shrink-0">{formatCents(inv.total, inv.currency)}</p>
      {inv.hostedInvoiceUrl && (
        <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer">
          <Button aria-label="Download" variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </a>
      )}
    </div>
  );
}

export default function AdminBillingPage() {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  // Radix <Select.Item> forbids an empty-string value (it is reserved for
  // "cleared"), so the no-filter option carries a sentinel that is mapped
  // back to `undefined` at the query boundary.
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [overrideTarget, setOverrideTarget] = useState<BillingSubscription | null>(null);
  const [overridePlanId, setOverridePlanId] = useState('');
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: 10, maxRedemptions: '' as string | number });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'billing', 'stats'],
    queryFn: getAdminBillingStats,
    staleTime: 60_000,
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['admin', 'billing', 'subscriptions', statusFilter, search],
    queryFn: () => listAdminSubscriptions({ status: statusFilter === ALL_STATUSES ? undefined : statusFilter, search: search || undefined }),
    staleTime: 30_000,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['admin', 'billing', 'invoices', statusFilter],
    queryFn: () => listAdminInvoices({ status: statusFilter === ALL_STATUSES ? undefined : statusFilter }),
    staleTime: 30_000,
  });

  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['admin', 'billing', 'coupons'],
    queryFn: listCoupons,
    staleTime: 60_000,
  });

  const plans = statsData?.plans ?? [];
  const subs = subsData ?? [];
  const invoices = invoicesData ?? [];
  const coupons = couponsData ?? [];

  const { mutate: extendTrial } = useMutation({
    mutationFn: (id: string) => adminExtendTrial(id, 7),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'billing', 'subscriptions'] }); toastSuccess('Trial extended by 7 days'); },
    onError: () => toastError('Failed to extend trial'),
  });

  const { mutate: cancelSub } = useMutation({
    mutationFn: ({ id, immediate }: { id: string; immediate: boolean }) => adminCancelSubscription(id, immediate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'billing', 'subscriptions'] }); toastSuccess('Subscription canceled'); },
    onError: () => toastError('Failed to cancel'),
  });

  const { mutate: applyOverride, isPending: overriding } = useMutation({
    mutationFn: () => adminOverrideSubscription(overrideTarget!.id, { planId: overridePlanId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'billing', 'subscriptions'] });
      setOverrideTarget(null);
      toastSuccess('Plan override applied');
    },
    onError: () => toastError('Override failed'),
  });

  const { mutate: saveCoupon, isPending: savingCoupon } = useMutation({
    mutationFn: () => createCoupon({
      code: couponForm.code,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      maxRedemptions: couponForm.maxRedemptions ? Number(couponForm.maxRedemptions) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'billing', 'coupons'] });
      setShowCouponForm(false);
      setCouponForm({ code: '', discountType: 'percent', discountValue: 10, maxRedemptions: '' });
      toastSuccess('Coupon created');
    },
    onError: () => toastError('Failed to create coupon'),
  });

  const { mutate: removeCoupon } = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'billing', 'coupons'] }); toastSuccess('Coupon deactivated'); },
    onError: () => toastError('Failed to remove coupon'),
  });

  const mrr = statsData?.mrrCents ?? 0;
  const arr = mrr * 12;

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight">Billing Administration</h1>
            <p className="text-sm text-muted-foreground">Subscriptions, invoices, plans, and coupons.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'billing'] })}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'MRR', value: formatCents(mrr), icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
            { label: 'ARR (est.)', value: formatCents(arr), icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Active Subs', value: statsData?.activeSubs ?? '—', icon: CheckCircle2, color: 'text-violet-600 dark:text-violet-400' },
            { label: 'Past Due', value: statsData?.pastDueSubs ?? '—', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className={cn('icon-sm', color)} />
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
                <p className="text-xl font-bold mt-1">
                  {statsLoading ? <Loader2 className="icon-md animate-spin text-muted-foreground" aria-hidden="true" /> : value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TabsList>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
            </TabsList>
            <div className="flex gap-2 sm:ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 w-48 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subscriptions tab */}
          <TabsContent value="subscriptions" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {subsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="icon-md animate-spin text-muted-foreground" aria-hidden="true" /></div>
                ) : subs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No subscriptions found</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {subs.map(sub => (
                      <SubRow
                        key={sub.id}
                        sub={sub}
                        plans={plans}
                        onExtendTrial={id => extendTrial(id)}
                        onCancel={(id, immediate) => cancelSub({ id, immediate })}
                        onOverride={s => { setOverrideTarget(s); setOverridePlanId(s.planId); }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices tab */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {invoicesLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="icon-md animate-spin text-muted-foreground" aria-hidden="true" /></div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No invoices found</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {invoices.map(inv => <InvRow key={inv.id} inv={inv} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans tab */}
          <TabsContent value="plans" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Billing Plans</CardTitle>
                  <p className="text-xs text-muted-foreground">Edit plan details via the API or admin actions.</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {statsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="icon-md animate-spin text-muted-foreground" aria-hidden="true" /></div>
                ) : plans.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No plans configured</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {plans.map(plan => (
                      <div key={plan.id} className="flex items-center gap-3 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                          <Crown className="icon-sm text-muted-foreground" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{plan.displayName}</span>
                            <Badge variant="outline" className="text-xs capitalize">{plan.planType.replace('_', ' ')}</Badge>
                            {!plan.isActive && <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-500">Inactive</Badge>}
                            {!plan.isPublic && <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-500">Private</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCents(plan.priceMonthly)}/mo · {formatCents(plan.priceAnnual)}/yr
                            {plan.seatLimit ? ` · ${plan.seatLimit} seats` : ' · Unlimited seats'}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {(statsData?.totalSubs ?? 0)} active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons tab */}
          <TabsContent value="coupons" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-2" onClick={() => setShowCouponForm(!showCouponForm)}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New coupon
              </Button>
            </div>

            {showCouponForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Create coupon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Code *</Label>
                      <Input
                        placeholder="LAUNCH30"
                        value={couponForm.code}
                        onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Discount type</Label>
                      <Select value={couponForm.discountType} onValueChange={v => setCouponForm(p => ({ ...p, discountType: v }))}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percent</SelectItem>
                          <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Value ({couponForm.discountType === 'percent' ? '%' : '$'})</Label>
                      <Input
                        type="number"
                        value={couponForm.discountValue}
                        onChange={e => setCouponForm(p => ({ ...p, discountValue: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max redemptions (optional)</Label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={couponForm.maxRedemptions}
                        onChange={e => setCouponForm(p => ({ ...p, maxRedemptions: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => saveCoupon()} disabled={savingCoupon || !couponForm.code}>
                      {savingCoupon && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                      Create
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCouponForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                {couponsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="icon-md animate-spin text-muted-foreground" aria-hidden="true" /></div>
                ) : coupons.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No coupons yet</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {coupons.map(coupon => (
                      <div key={coupon.id} className="flex items-center gap-3 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                          <Tag className="icon-sm text-muted-foreground" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold">{coupon.code}</span>
                            {!coupon.isActive && <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-500">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : formatCents(coupon.discountValue)} ·
                            {coupon.timesRedeemed}/{coupon.maxRedemptions ?? '∞'} used
                            {coupon.validUntil ? ` · Expires ${new Date(coupon.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                          </p>
                        </div>
                        {coupon.isActive && (
                          <Button aria-label="Delete"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive-emphasis hover:text-destructive-emphasis shrink-0"
                            onClick={() => removeCoupon(coupon.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Override Dialog */}
      <Dialog open={Boolean(overrideTarget)} onOpenChange={open => !open && setOverrideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Select a new plan to apply immediately. This bypasses payment.</p>
            <div className="space-y-1.5">
              <Label className="text-xs">New plan</Label>
              <Select value={overridePlanId} onValueChange={setOverridePlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideTarget(null)}>Cancel</Button>
            <Button onClick={() => applyOverride()} disabled={overriding || !overridePlanId}>
              {overriding && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Apply override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
