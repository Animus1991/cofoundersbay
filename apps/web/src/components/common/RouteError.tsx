'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';

/** Section names passed by each route's error.tsx, in the reader's language. */
const SECTION_EL: Record<string, string> = {
  Updates: 'Ενημερώσεις',
  Themes: 'Θέματα',
  'Transparency report': 'Αναφορά διαφάνειας',
  'Founder update': 'Ενημέρωση ιδρυτή',
  'Terms of service': 'Όροι χρήσης',
  'Onboarding preview': 'Προεπισκόπηση ένταξης',
  Shortlist: 'Αποθηκευμένα προφίλ',
  'Shared link': 'Κοινόχρηστος σύνδεσμος',
  Workspace: 'Χώρος εργασίας',
  'Workspace admin': 'Διαχείριση χώρου',
  Settings: 'Ρυθμίσεις',
  'Research boards': 'Πίνακες έρευνας',
  'Readiness assessment': 'Αξιολόγηση ετοιμότητας',
  Referrals: 'Προσκλήσεις',
  'Co-founder scout': 'Ανιχνευτής συνιδρυτών',
  'Saved searches': 'Αποθηκευμένες αναζητήσεις',
  Recommendations: 'Προτάσεις',
  Search: 'Αναζήτηση',
  Reputation: 'Φήμη',
  Profile: 'Προφίλ',
  'Provider workspace': 'Χώρος παρόχου',
  Pitch: 'Παρουσίαση',
  Projects: 'Έργα',
  Pricing: 'Τιμές',
  'Privacy policy': 'Πολιτική απορρήτου',
  Programs: 'Προγράμματα',
  Onboarding: 'Ένταξη',
  Notifications: 'Ειδοποιήσεις',
  Opportunities: 'Ευκαιρίες',
  'Organisation workspace': 'Χώρος οργανισμού',
  Milestones: 'Ορόσημα',
  Members: 'Μέλη',
  Messages: 'Μηνύματα',
  'Learning hub': 'Κέντρο μάθησης',
  Mentoring: 'Καθοδήγηση',
  Matches: 'Αντιστοιχίσεις',
  'Mentor workspace': 'Χώρος μέντορα',
  Marketplace: 'Αγορά',
  'Investor directory': 'Κατάλογος επενδυτών',
  Introductions: 'Συστάσεις',
  Invites: 'Προσκλήσεις',
  'Help centre': 'Κέντρο βοήθειας',
  Jobs: 'Θέσεις',
  'Investor workspace': 'Χώρος επενδυτή',
  Demo: 'Επίδειξη',
  Discover: 'Εξερεύνηση',
  Groups: 'Ομάδες',
  Fundraising: 'Χρηματοδότηση',
  Events: 'Εκδηλώσεις',
  'Expert reviews': 'Κρίσεις ειδικών',
  Endorsements: 'Συστάσεις δεξιοτήτων',
  Feed: 'Ροή',
  Dashboard: 'Πίνακας',
  Commitments: 'Δεσμεύσεις',
  Comparison: 'Σύγκριση',
  Connections: 'Συνδέσεις',
  'Data room': 'Αίθουσα εγγράφων',
  Coaching: 'Καθοδήγηση',
  'Startup builder': 'Εργαλείο startup',
  Calendar: 'Ημερολόγιο',
  'Need card': 'Κάρτα ανάγκης',
  Authentication: 'Ταυτοποίηση',
  Analytics: 'Αναλυτικά',
  'API status': 'Κατάσταση API',
  Admin: 'Διαχείριση',
  Activity: 'Δραστηριότητα',
  Achievements: 'Επιτεύγματα',
};

const BACK_EL: Record<string, string> = {
  'Back to dashboard': 'Πίσω στον πίνακα',
  'Back to home': 'Πίσω στην αρχική',
};

export type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Human name of the section, e.g. "Investor pipeline". */
  section?: string;
  /** Where "Go back" should point. Defaults to the dashboard. */
  backHref?: string;
  backLabel?: string;
};

/**
 * Shared body for every route-segment error.tsx.
 *
 * A segment-level boundary keeps the app shell (sidebar, top bar, navigation)
 * mounted and confines the failure to the page body, so a failed query on one
 * screen no longer blanks the whole application.
 */
export function RouteError({
  error,
  reset,
  section,
  backHref = '/dashboard',
  backLabel = 'Back to dashboard',
}: RouteErrorProps) {
  useEffect(() => {
    // The global ErrorBoundary reports to the error service; segment errors are
    // logged here so they are not silently swallowed in development.
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${section ?? 'route'}]`, error);
    }
  }, [error, section]);

  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-lg flex-col items-center rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-emphasis">
        <AlertTriangle className="icon-md" aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        <BilingualText
          en={section ? `${section} could not load` : 'This page could not load'}
          el={section ? `${SECTION_EL[section] ?? section} δεν φορτώθηκε` : 'Αυτή η σελίδα δεν φορτώθηκε'}
          wrap
        />
      </h2>

      {error.digest && (
        <p className="mt-3 font-mono text-2xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="icon-sm" aria-hidden="true" />
          <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
        </Button>
        <Button asChild variant="secondary">
          <Link href={backHref}>
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            <BilingualText en={backLabel} el={BACK_EL[backLabel] ?? backLabel} compact />
          </Link>
        </Button>
      </div>
    </div>
  );
}
