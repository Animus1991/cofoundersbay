'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoIcon } from '@/components/brand/Logo';
import { bilingualAria } from '@/lib/i18n/format';
import { forgotPassword } from '@/lib/api';
import { MainLandmark } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  // The sentence around the address reads in the reader's language.
  const { primary } = useLanguagePreference();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim().toLowerCase());
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    // The centred card on the theme's flat primary wash, opening on the
    // mark's tinted squircle (docs §137, B2.4).
    <MainLandmark className="flex min-h-screen items-center justify-center bg-primary-subtle px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in rounded-3xl border border-border/60 bg-card p-6 shadow-md sm:p-10">
        <div className="space-y-2">
          <Link href="/" className="mb-8 inline-flex hover:opacity-80 transition-opacity" aria-label={bilingualAria('Back to the CoFounderBay home page', 'Επιστροφή στην αρχική του CoFounderBay')}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-status-accent-bg text-status-accent">
              <LogoIcon size={34} />
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            <BilingualText en="Reset your password" el="Επαναφορά κωδικού" compact />
          </h1>
          <p className="text-muted-foreground text-sm">
            <BilingualText en="Enter your email and we'll send you a reset link." el="Γράψτε το email σας και θα σας στείλουμε σύνδεσμο επαναφοράς." wrap />
          </p>
        </div>

        {sent ? (
          // The column stays centred; the card's text starts on one left
          // axis, the mark beside the title like every other card.
          <div className="space-y-3 rounded-xl border border-status-success-border bg-status-success-bg p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div data-card-mark="" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-status-success">
                <MailCheck className="icon-md" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="card-title text-foreground"><BilingualText en="Check your inbox" el="Ελέγξτε τα εισερχόμενά σας" compact /></h2>
                {primary === 'el' ? (
                  <p className="card-subtitle mt-0.5" lang="el">
                    Αν το <span className="break-all font-medium text-foreground">{email}</span> είναι εγγεγραμμένο,
                    θα λάβετε σύνδεσμο επαναφοράς σε λίγα λεπτά.
                  </p>
                ) : (
                  <p className="card-subtitle mt-0.5">
                    If <span className="break-all font-medium text-foreground">{email}</span> is registered,
                    you&apos;ll receive a reset link within a few minutes.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground"><BilingualText en="Check your spam folder if you don't see it." el="Αν δεν το βλέπετε, ελέγξτε τον φάκελο ανεπιθύμητων." wrap /></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-accessible">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium"><BilingualText en="Email address" el="Διεύθυνση email" compact /></label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                placeholder="you@startup.com"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? <BilingualText en="Sending…" el="Αποστολή…" compact /> : <BilingualText en="Send reset link" el="Αποστολή συνδέσμου επαναφοράς" compact />}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            <BilingualText en="Back to sign in" el="Επιστροφή στη σύνδεση" compact />
          </Link>
        </div>
      </div>
    </MainLandmark>
  );
}
