import Link from 'next/link';
import { LayoutDashboard, ShieldAlert, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { MainLandmark } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';

export const metadata = {
  title: 'No access to this page',
  robots: { index: false, follow: false },
};

/**
 * Where `withRoleGuard` sends someone whose roles do not include the
 * permission a page needs. The redirect existed; the page did not, so a
 * permission check ended on a 404 that said nothing about why.
 *
 * Server-rendered, in the same shape as `not-found.tsx`. The words go through
 * BilingualText like the buttons below them: written out in both languages,
 * a Greek reader got one screen in two.
 */
export default function UnauthorizedPage() {
  return (
    <MainLandmark className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo size="sm" />
      <ShieldAlert className="mt-8 icon-xl text-status-warning" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-semibold text-foreground">
        <BilingualText en="You do not have access to this page" el="Δεν έχετε πρόσβαση σε αυτή τη σελίδα" compact wrap />
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        <BilingualText
          en="It needs a role your account does not have yet. Switch to a role that has it, or ask an administrator to add the role to your account."
          el="Απαιτεί έναν ρόλο που ο λογαριασμός σας δεν έχει ακόμη. Αλλάξτε σε ρόλο που τον έχει ή ζητήστε από έναν διαχειριστή να τον προσθέσει."
          compact
          wrap
        />
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard" className="gap-2">
            <LayoutDashboard className="icon-sm" aria-hidden="true" />
            <BilingualText en="Go to your dashboard" el="Στον πίνακα ελέγχου" compact />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings" className="gap-2">
            <UserCog className="icon-sm" aria-hidden="true" />
            <BilingualText en="Account and roles" el="Λογαριασμός και ρόλοι" compact />
          </Link>
        </Button>
      </div>
    </MainLandmark>
  );
}
