'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users, Crown, Building2, AlertTriangle, CheckCircle2, Clock,
  CreditCard, ExternalLink, Mail, FileText, Download, Loader2,
  UserMinus, UserPlus, ChevronRight, Shield,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { useTenant } from '@/components/providers/TenantContext';
import {
  getTenantBillingSubscription, listTenantSeats, revokeTenantSeat,
  upsertTenantBillingContact, createBillingPortal,
  type SeatAllocation,
} from '@/lib/api';
import { formatCents, STATUS_COLORS } from '@/lib/billing';
import { cn } from '@/lib/utils';

function SeatRow({
  seat, onRevoke, revoking,
}: {
  seat: SeatAllocation;
  onRevoke: (userId: string) => void;
  revoking: boolean;
}) {
  const initials = seat.user.email.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{seat.user.email}</p>
        <p className="text-xs text-muted-foreground">
          Allocated {new Date(seat.allocatedAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-destructive-accessible hover:text-destructive-accessible gap-1.5 shrink-0"
        onClick={() => onRevoke(seat.userId)}
        disabled={revoking}
      >
        {revoking ? <Loader2 className="icon-sm animate-spin" /> : <UserMinus className="icon-sm" />}
        Revoke
      </Button>
    </div>
  );
}

export default function TenantBillingPage() {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? '';

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '', email: '', company: '', vatId: '', legalName: '',
    addressLine1: '', city: '', postalCode: '', country: 'US',
  });
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['billing', 'tenant', tenantId],
    queryFn: () => getTenantBillingSubscription(tenantId),
    enabled: Boolean(tenantId),
  });

  const { data: seatsData, isLoading: seatsLoading } = useQuery({
    queryKey: ['billing', 'tenant', tenantId, 'seats'],
    queryFn: () => listTenantSeats(tenantId),
    enabled: Boolean(tenantId),
  });

  const { mutate: openPortal, isPending: portalLoading } = useMutation({
    mutationFn: createBillingPortal,
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: () => toastError('Stripe portal unavailable'),
  });

  const { mutate: saveContact, isPending: savingContact } = useMutation({
    mutationFn: () => upsertTenantBillingContact(tenantId, contactForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'tenant', tenantId] });
      setShowContactForm(false);
      toastSuccess('Billing contact saved');
    },
    onError: () => toastError('Failed to save contact'),
  });

  async function handleRevokeSeat(userId: string) {
    setRevokingId(userId);
    try {
      await revokeTenantSeat(tenantId, userId);
      qc.invalidateQueries({ queryKey: ['billing', 'tenant', tenantId, 'seats'] });
      qc.invalidateQueries({ queryKey: ['billing', 'tenant', tenantId] });
      toastSuccess('Seat revoked');
    } catch {
      toastError('Failed to revoke seat');
    } finally {
      setRevokingId(null);
    }
  }

  const sub = subData?.subscription;
  const seats = seatsData?.seats ?? [];
  const seatUsage = sub?.activeSeatCount ?? seats.length;
  const seatLimit = sub?.seatLimit ?? null;
  const seatPct = seatLimit ? Math.round((seatUsage / seatLimit) * 100) : null;

  return (
    <AppShell
      title="Organization Billing"
      description="Plan, seats, invoices, and payment methods for your workspace."
      actions={(
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/pricing">
            View plans
            <ChevronRight className="icon-sm" />
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6 max-w-3xl">

        {/* Plan Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="icon-sm animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : sub ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-accent-bg shrink-0">
                    <Building2 className="icon-lg text-status-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{sub.plan?.displayName}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize', STATUS_COLORS[sub.status] ?? '')}
                      >
                        {sub.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {sub.billingCycle} · Renews {new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold">
                      {formatCents(
                        sub.billingCycle === 'annual' ? (sub.plan?.priceAnnual ?? 0) : (sub.plan?.priceMonthly ?? 0),
                        sub.plan?.currency,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">/{sub.billingCycle === 'annual' ? 'year' : 'month'}</p>
                  </div>
                </div>

                {sub.status === 'past_due' && (
                  <div className="flex items-center gap-2 rounded-lg bg-status-danger-bg border border-status-danger-border p-3 text-sm text-status-danger">
                    <AlertTriangle className="icon-sm shrink-0" />
                    Payment overdue. Update your payment method to avoid service interruption.
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm" variant="outline" className="gap-2"
                    onClick={() => openPortal(undefined)}
                    disabled={portalLoading}
                  >
                    {portalLoading ? <Loader2 className="icon-sm animate-spin" /> : <CreditCard className="icon-sm" />}
                    Manage billing
                    <ExternalLink className="icon-sm" />
                  </Button>
                  {(sub.plan?.planType === 'team' || sub.plan?.planType === 'organization') && (
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <a href="mailto:enterprise@cofounderbay.com?subject=Enterprise Upgrade Request">
                        <Crown className="icon-sm" />
                        Request enterprise upgrade
                      </a>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No active subscription for this organization.</p>
                <Button size="sm" className="gap-2" asChild>
                  <Link href="/pricing">
                    <Building2 className="icon-sm" />
                    See organization plans
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seat Usage */}
        {sub && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Seat Usage</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {seatLimit ? `${seatUsage} of ${seatLimit} seats used` : `${seatUsage} seats active`}
                  </CardDescription>
                </div>
                {seatLimit && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      (seatPct ?? 0) >= 90 ? 'bg-status-danger-bg text-status-danger border-status-danger-border' :
                      (seatPct ?? 0) >= 70 ? 'bg-status-warning-bg text-status-warning border-status-warning-border' :
                      'bg-status-success-bg text-status-success border-status-success-border',
                    )}
                  >
                    {seatPct}% used
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {seatLimit && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (seatPct ?? 0) >= 90 ? 'bg-red-500' :
                      (seatPct ?? 0) >= 70 ? 'bg-amber-500' : 'bg-green-500',
                    )}
                    style={{ width: `${Math.min(seatPct ?? 0, 100)}%` }}
                  />
                </div>
              )}

              {seatLimit && seatUsage >= seatLimit && (
                <div className="flex items-center gap-2 rounded-lg bg-status-warning-bg border border-status-warning-border p-3 text-sm text-status-warning">
                  <AlertTriangle className="icon-sm shrink-0" />
                  Seat limit reached. Upgrade your plan or revoke unused seats to add more members.
                </div>
              )}

              <div className="space-y-0.5">
                {seatsLoading ? (
                  <p className="text-sm text-muted-foreground p-3">Loading seats…</p>
                ) : seats.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">No seats allocated yet.</p>
                ) : (
                  seats.map(seat => (
                    <SeatRow
                      key={seat.id}
                      seat={seat}
                      onRevoke={handleRevokeSeat}
                      revoking={revokingId === seat.userId}
                    />
                  ))
                )}
              </div>

              {seatLimit && seatUsage < seatLimit && (
                <div className="pt-1 flex items-center gap-2">
                  <Users className="icon-sm text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {seatLimit - seatUsage} seat{seatLimit - seatUsage !== 1 ? 's' : ''} available. Invite team members from the Members page.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Included Features */}
        {sub?.plan?.features && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sub.plan.features as Record<string, unknown>)
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="icon-sm text-status-success shrink-0" />
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}{typeof v === 'string' ? `: ${v}` : ''}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Contact */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Billing Contact</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Used for invoices and legal/tax documentation.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowContactForm(!showContactForm)}>
                {showContactForm ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showContactForm ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                {contactForm.name ? (
                  <>
                    <p className="font-medium text-foreground">{contactForm.name}</p>
                    {contactForm.company && <p>{contactForm.company}</p>}
                    {contactForm.legalName && <p className="text-xs">Legal: {contactForm.legalName}</p>}
                    <p>{contactForm.email}</p>
                    {contactForm.addressLine1 && (
                      <p>{contactForm.addressLine1}, {contactForm.city} {contactForm.postalCode}, {contactForm.country}</p>
                    )}
                    {contactForm.vatId && <p>VAT: {contactForm.vatId}</p>}
                  </>
                ) : (
                  <p>No billing contact set. Click Edit to add one.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contact name *</Label>
                    <Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Billing email *</Label>
                    <Input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="billing@org.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company name</Label>
                    <Input value={contactForm.company} onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Accelerator" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Legal entity name</Label>
                    <Input value={contactForm.legalName} onChange={e => setContactForm(p => ({ ...p, legalName: e.target.value }))} placeholder="Acme Accelerator Ltd." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">VAT / Tax ID</Label>
                    <Input value={contactForm.vatId} onChange={e => setContactForm(p => ({ ...p, vatId: e.target.value }))} placeholder="EU123456789" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country</Label>
                    <Input value={contactForm.country} onChange={e => setContactForm(p => ({ ...p, country: e.target.value }))} placeholder="US" maxLength={2} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Street address</Label>
                    <Input value={contactForm.addressLine1} onChange={e => setContactForm(p => ({ ...p, addressLine1: e.target.value }))} placeholder="123 Innovation Blvd" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input value={contactForm.city} onChange={e => setContactForm(p => ({ ...p, city: e.target.value }))} placeholder="San Francisco" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Postal code</Label>
                    <Input value={contactForm.postalCode} onChange={e => setContactForm(p => ({ ...p, postalCode: e.target.value }))} placeholder="94107" />
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

        {/* Enterprise upgrade CTA */}
        {sub && sub.plan?.planType !== 'enterprise' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Shield className="icon-md text-primary-accessible" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Need enterprise features?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Custom domain, SSO, unlimited seats, white-labeling, dedicated support, and SLA guarantees.
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 gap-2" asChild>
                <a href="mailto:enterprise@cofounderbay.com?subject=Enterprise Upgrade">
                  <Mail className="icon-sm" />
                  Contact sales
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
