'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Download, FileText, Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { settingsEn, settingsEl } from '@/lib/i18n/strings-settings';
import { bilingualAria } from '@/lib/i18n/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import {
  getBillingSubscription, getUserInvoices, createBillingPortal,
  getBillingContact, upsertBillingContact, type BillingInvoice, type BillingContact,
} from '@/lib/api';
import { formatCents } from '@/lib/billing';
import { HairlineMeter } from '@/components/ui/hairline-meter';
import { SettingsRow } from '@/components/ui/settings-row';
import { cn } from '@/lib/utils';

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
        <FileText className="icon-sm text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{invoice.invoiceNumber}</span>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(invoice.periodStart).toLocaleDateString('en-GB', { timeZone: 'UTC' })} – {new Date(invoice.periodEnd).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{formatCents(invoice.total, invoice.currency)}</p>
        {invoice.paidAt && (
          <p className="text-xs text-muted-foreground">{new Date(invoice.paidAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</p>
        )}
      </div>
      {invoice.hostedInvoiceUrl && (
        <a
          href={invoice.hostedInvoiceUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={bilingualAria(`Download invoice ${invoice.invoiceNumber}`, `Λήψη τιμολογίου ${invoice.invoiceNumber}`)}>
            <Download className="icon-sm" />
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

  return (
    <AppShell
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings">
            <BilingualText en={settingsEn('settings')} el={settingsEl('settings')} />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6 pb-10">

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/50 shadow-none">
            <CardHeader className="pb-2">
              <p className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">
                <BilingualText en="Current plan" el="Τρέχον πλάνο" />
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {subLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="icon-sm animate-spin" />
                  <span className="text-sm">Loading subscription…</span>
                </div>
              ) : sub ? (
                <>
                  <div>
                    <p className="text-lg font-semibold">{sub.plan?.displayName ?? 'Unknown Plan'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCents(sub.billingCycle === 'annual' ? sub.plan?.priceAnnual : sub.plan?.priceMonthly ?? 0, sub.plan?.currency)}
                      /{sub.billingCycle === 'annual' ? 'year' : 'mo'}
                      {sub.currentPeriodEnd && (
                        <> · Renews {new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary-accessible hover:underline"
                    onClick={() => openPortal(undefined)}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Opening…' : 'Adjust plan'}
                  </button>
                </>
              ) : (
                <div>
                  <p className="text-lg font-semibold">Free</p>
                  <p className="text-sm text-muted-foreground">$0/mo</p>
                </div>
              )}
            </CardContent>
          </Card>

          {(sub?.plan?.name === 'free' || !sub) && (
            <Card className="border-primary/20 bg-primary/[0.04] shadow-none">
              <CardHeader className="pb-2">
                <p className="text-2xs font-medium uppercase tracking-widest text-primary-accessible">
                  <BilingualText en="Upgrade available" el="Διαθέσιμη αναβάθμιση" />
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">Pro</p>
                  <p className="text-sm text-muted-foreground">
                    Unlock more usage on matching, messages, and mentor booking.
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/pricing">Upgrade</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {sub?.cancelAtPeriodEnd && (
          <p className="text-sm text-status-warning">
            Subscription cancels on {new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB', { timeZone: 'UTC' })}.
          </p>
        )}
        {sub?.status === 'trialing' && sub.trialEnd && (
          <p className="text-sm text-status-info">
            Free trial ends {new Date(sub.trialEnd).toLocaleDateString('en-GB', { timeZone: 'UTC' })}.
          </p>
        )}
        {sub?.status === 'past_due' && (
          <p className="text-sm text-status-danger">Payment failed. Update the payment method in Adjust plan.</p>
        )}

        {sub?.plan?.features && (
          <Card className="border-border/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(sub.plan.features as Record<string, unknown>)
                .filter(([, v]) => Boolean(v))
                .map(([k, v]) => (
                  <HairlineMeter
                    key={k}
                    label={k.replace(/([A-Z])/g, ' $1').trim()}
                    caption={typeof v === 'string' ? String(v) : undefined}
                    percent={v === true || v === 'Unlimited' ? 0 : 0}
                    trailing={v === true ? 'Included' : typeof v === 'string' ? String(v) : undefined}
                  />
                ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 shadow-none">
          <CardContent className="pt-2">
            <SettingsRow
              label="Payment method"
              helper="Opens the Stripe billing portal."
            >
              <button
                type="button"
                className="text-sm font-medium text-primary-accessible hover:underline"
                onClick={() => openPortal(undefined)}
                disabled={portalLoading}
              >
                {portalLoading ? 'Opening…' : 'Manage'}
              </button>
            </SettingsRow>
          </CardContent>
        </Card>

        {/* Billing Contact */}
        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Billing Contact</CardTitle>
                <CardDescription className="text-xs mt-0.5">Used on invoices and for tax compliance.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowContactForm(!showContactForm)}>
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
                    {savingContact && <Loader2 className="mr-1.5 icon-sm animate-spin" />}
                    Save contact
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowContactForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice history */}
        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex items-center justify-center p-8 gap-2 text-muted-foreground">
                <Loader2 className="icon-sm animate-spin" />
                <span className="text-sm">Loading invoices…</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="icon-xl mx-auto text-muted-foreground/40 mb-2" />
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
