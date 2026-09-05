'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard, Crown, ExternalLink, AlertTriangle, CheckCircle2,
  Clock, XCircle, Download, FileText, ChevronRight, Loader2,
  Shield, Zap, Users, Building2, RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { settingsEn, settingsEl } from '@/lib/i18n/strings-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import {
  getBillingSubscription, getUserInvoices, createBillingPortal, createBillingCheckout,
  getBillingContact, upsertBillingContact, type BillingInvoice, type BillingContact,
} from '@/lib/api';
import { formatCents, STATUS_COLORS } from '@/lib/billing';
import { cn } from '@/lib/utils';

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  premium: Crown,
  individual_premium: Crown,
  team: Users,
  organization: Building2,
  enterprise: Shield,
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-status-success-bg text-status-success border-status-success-border',
    open: 'bg-status-info-bg text-status-info border-status-info-border',
    draft: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
    void: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
    uncollectible: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  };
  return (
    <Badge variant="outline" className={cn('text-xs capitalize', colors[status] ?? 'bg-gray-500/10 text-muted-foreground')}>
      {status}
    </Badge>
  );
}

function InvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{invoice.invoiceNumber}</span>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(invoice.periodStart).toLocaleDateString()} – {new Date(invoice.periodEnd).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{formatCents(invoice.total, invoice.currency)}</p>
        {invoice.paidAt && (
          <p className="text-xs text-muted-foreground">{new Date(invoice.paidAt).toLocaleDateString()}</p>
        )}
      </div>
      {invoice.hostedInvoiceUrl && (
        <a
          href={invoice.hostedInvoiceUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </a>
      )}
    </div>
  );
}

export default function UserBillingPage() {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '', email: '', company: '', vatId: '', addressLine1: '', city: '', postalCode: '', country: 'US',
  });

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: getBillingSubscription,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: getUserInvoices,
  });

  const { data: contactData } = useQuery({
    queryKey: ['billing', 'contact'],
    queryFn: getBillingContact,
  });

  useEffect(() => {
    const bc = (contactData as { billingContact?: BillingContact | null })?.billingContact;
    if (bc) {
      setContactForm({
        name: bc.name ?? '',
        email: bc.email ?? '',
        company: bc.company ?? '',
        vatId: bc.vatId ?? '',
        addressLine1: bc.addressLine1 ?? '',
        city: bc.city ?? '',
        postalCode: bc.postalCode ?? '',
        country: bc.country ?? 'US',
      });
    }
  }, [contactData]);

  const { mutate: openPortal, isPending: portalLoading } = useMutation({
    mutationFn: createBillingPortal,
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: () => toastError('Stripe portal unavailable'),
  });

  const { mutate: saveContact, isPending: savingContact } = useMutation({
    mutationFn: () => upsertBillingContact(contactForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'contact'] });
      setShowContactForm(false);
      toastSuccess('Billing contact saved');
    },
    onError: () => toastError('Failed to save contact'),
  });

  const sub = subData?.subscription;
  const invoices = invoicesData?.invoices ?? [];

  const PlanIcon = PLAN_ICONS[sub?.plan?.name ?? 'free'] ?? Crown;

  const statusIconMap: Record<string, React.ReactElement> = {
    active: <CheckCircle2 className="h-4 w-4 text-status-success" />,
    trialing: <Clock className="h-4 w-4 text-status-info" />,
    past_due: <AlertTriangle className="h-4 w-4 text-status-warning" />,
    canceled: <XCircle className="h-4 w-4 text-muted-foreground" />,
    incomplete: <AlertTriangle className="h-4 w-4 text-status-warning" />,
    incomplete_expired: <XCircle className="h-4 w-4 text-muted-foreground" />,
    paused: <Clock className="h-4 w-4 text-muted-foreground" />,
    unpaid: <AlertTriangle className="h-4 w-4 text-status-danger" />,
  };
  const statusIcon = statusIconMap[sub?.status ?? ''] ?? <Clock className="h-4 w-4 text-muted-foreground" />;

  return (
    <AppShell
      actions={
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <BilingualText en={settingsEn('settings')} el={settingsEl('settings')} />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="gap-2">
              View plans
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 pb-10">

        {/* Current Plan */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading subscription…</span>
              </div>
            ) : sub ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <PlanIcon className="h-6 w-6 text-primary-accessible" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{sub.plan?.displayName ?? 'Unknown Plan'}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize gap-1', STATUS_COLORS[sub.status] ?? '')}
                      >
                        {statusIcon}
                        {sub.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {sub.billingCycle} billing
                      {sub.currentPeriodEnd && (
                        <> · Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {formatCents(sub.billingCycle === 'annual' ? sub.plan?.priceAnnual : sub.plan?.priceMonthly ?? 0, sub.plan?.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">/{sub.billingCycle === 'annual' ? 'year' : 'month'}</p>
                  </div>
                </div>

                {sub.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2 rounded-lg bg-status-warning-bg border border-status-warning-border p-3 text-sm text-status-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Your subscription will cancel on {new Date(sub.currentPeriodEnd).toLocaleDateString()}.
                    Reactivate in the billing portal to continue.
                  </div>
                )}

                {sub.status === 'trialing' && sub.trialEnd && (
                  <div className="flex items-center gap-2 rounded-lg bg-status-info-bg border border-status-info-border p-3 text-sm text-status-info">
                    <Clock className="h-4 w-4 shrink-0" />
                    Free trial ends {new Date(sub.trialEnd).toLocaleDateString()}. Add a payment method to continue.
                  </div>
                )}

                {sub.status === 'past_due' && (
                  <div className="flex items-center gap-2 rounded-lg bg-status-danger-bg border border-status-danger-border p-3 text-sm text-status-danger">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Payment failed. Please update your payment method to avoid service interruption.
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => openPortal(undefined)}
                    disabled={portalLoading}
                  >
                    {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                    Manage payment &amp; billing
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  {(sub.plan?.name === 'free' || !sub) && (
                    <Link href="/pricing">
                      <Button size="sm" className="gap-2">
                        <Crown className="h-3.5 w-3.5" />
                        Upgrade plan
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">You are on the free plan.</p>
                <Link href="/pricing">
                  <Button size="sm" className="gap-2">
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan features */}
        {sub?.plan?.features && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your plan includes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sub.plan.features as Record<string, unknown>)
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-success shrink-0" />
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}{typeof v === 'string' ? `: ${v}` : ''}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Contact */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Billing Contact</CardTitle>
                <CardDescription className="text-xs mt-0.5">Used on invoices and for tax compliance.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowContactForm(!showContactForm)}>
                {showContactForm ? 'Cancel' : (contactData as { billingContact?: BillingContact | null })?.billingContact ? 'Edit' : 'Add'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showContactForm && (contactData as { billingContact?: BillingContact | null })?.billingContact ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                {(() => { const bc = (contactData as { billingContact?: BillingContact | null }).billingContact!; return (<>
                <p className="font-medium text-foreground">{bc.name}</p>
                {bc.company && <p>{bc.company}</p>}
                <p>{bc.email}</p>
                {bc.addressLine1 && (
                  <p>{bc.addressLine1}, {bc.city} {bc.postalCode}, {bc.country}</p>
                )}
                {bc.vatId && <p>VAT: {bc.vatId}</p>}
                </>); })()}
              </div>
            ) : !showContactForm ? (
              <p className="text-sm text-muted-foreground">No billing contact set.</p>
            ) : null}

            {showContactForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full name *</Label>
                    <Input
                      placeholder="Jane Doe"
                      value={contactForm.name}
                      onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      placeholder="billing@company.com"
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company</Label>
                    <Input
                      placeholder="Acme Inc."
                      value={contactForm.company}
                      onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">VAT / Tax ID</Label>
                    <Input
                      placeholder="EU123456789"
                      value={contactForm.vatId}
                      onChange={e => setContactForm(p => ({ ...p, vatId: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Address</Label>
                    <Input
                      placeholder="123 Main Street"
                      value={contactForm.addressLine1}
                      onChange={e => setContactForm(p => ({ ...p, addressLine1: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input
                      placeholder="Athens"
                      value={contactForm.city}
                      onChange={e => setContactForm(p => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Postal Code</Label>
                    <Input
                      placeholder="10431"
                      value={contactForm.postalCode}
                      onChange={e => setContactForm(p => ({ ...p, postalCode: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => saveContact()}
                    disabled={savingContact || !contactForm.name || !contactForm.email}
                  >
                    {savingContact && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Save contact
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowContactForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice history */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex items-center justify-center p-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading invoices…</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
