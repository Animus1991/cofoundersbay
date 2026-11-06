'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { deleteAccount, getAccountDeletion, type AccountDeletionPreview } from '@/lib/api';
import { qk } from '@/lib/query-keys';

/** The lines that have something to say; a count of nothing is not a warning. */
function consequences(counts: AccountDeletionPreview['counts']) {
  const n = (value: number, one: { en: string; el: string }, many: (v: number) => { en: string; el: string }) =>
    (value === 0 ? [] : [value === 1 ? one : many(value)]);
  return [
    ...n(counts.dataRoomFiles, { en: 'One data room file is deleted', el: 'Διαγράφεται ένα αρχείο του data room' }, (v) => ({ en: `${v} data room files are deleted`, el: `Διαγράφονται ${v} αρχεία του data room` })),
    ...n(counts.rounds, { en: 'Your fundraising round is deleted', el: 'Διαγράφεται ο γύρος χρηματοδότησής σας' }, (v) => ({ en: `${v} fundraising rounds are deleted`, el: `Διαγράφονται ${v} γύροι χρηματοδότησης` })),
    ...n(counts.sharedWorkspaces, { en: 'One shared workspace is deleted for everyone in it', el: 'Ένας κοινός χώρος εργασίας διαγράφεται για όλα τα μέλη του' }, (v) => ({ en: `${v} shared workspaces are deleted for everyone in them`, el: `${v} κοινοί χώροι εργασίας διαγράφονται για όλα τα μέλη τους` })),
    ...n(counts.groupsHandedOver, { en: 'One group passes to its next member', el: 'Μία ομάδα περνά στο επόμενο μέλος της' }, (v) => ({ en: `${v} groups pass to their next member`, el: `${v} ομάδες περνούν στο επόμενο μέλος τους` })),
    ...n(counts.groupsRemoved, { en: 'One group with no other members is deleted', el: 'Διαγράφεται μία ομάδα χωρίς άλλα μέλη' }, (v) => ({ en: `${v} groups with no other members are deleted`, el: `Διαγράφονται ${v} ομάδες χωρίς άλλα μέλη` })),
  ];
}

/**
 * Deleting an account, by its owner (docs §112). It says what will go before
 * asking, and what stands in the way when something does: a page that lets a
 * person press Delete and only then explains has already lost their trust.
 */
export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { error: showError } = useToast();
  const { data, isLoading, isError } = useQuery({ queryKey: qk('me', 'account-deletion'), queryFn: getAccountDeletion, enabled: open, staleTime: 0, retry: 1 });
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) return;
    setPassword('');
    setEmail('');
    setCode('');
    setUnderstood(false);
  }, [open]);

  const blocked = (data?.blockers.length ?? 0) > 0;
  const confirmed = data?.confirmWith === 'email' ? email.trim().length > 3 : password.length > 0;
  const ready = Boolean(data) && !blocked && confirmed && understood && (!data?.needsCode || code.trim().length >= 6);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount({
        password: data?.confirmWith === 'password' ? password : undefined,
        email: data?.confirmWith === 'email' ? email.trim() : undefined,
        code: data?.needsCode ? code.trim() : undefined,
      });
      // A full load: every query and every open tab's memory of this account goes with it.
      window.location.assign('/?account=deleted');
    } catch (err) {
      showError('Could not delete the account', err instanceof Error ? err.message : undefined);
      setDeleting(false);
    }
  }

  const lines = data ? consequences(data.counts) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88dvh,720px)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle><BilingualText en="Delete your account" el="Διαγραφή του λογαριασμού σας" compact /></DialogTitle>
            <DialogDescription>
              <BilingualText
                en="Your profile, messages, connections and everything you created go for good. This cannot be undone."
                el="Το προφίλ, τα μηνύματα, οι συνδέσεις και ό,τι δημιουργήσατε χάνονται οριστικά. Δεν αναιρείται."
                wrap
              />
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          ) : isError || !data ? (
            <p role="alert" className="text-sm text-muted-foreground">
              <BilingualText en="This could not be checked right now. Try again in a moment." el="Ο έλεγχος δεν έγινε τώρα. Δοκιμάστε ξανά σε λίγο." compact />
            </p>
          ) : blocked ? (
            <div role="alert" className="space-y-2 rounded-xl border border-status-warning-border bg-status-warning-bg p-3 text-sm text-foreground">
              {data.blockers.map((blocker) => (
                <p key={blocker.code}>
                  {blocker.code === 'last_super_admin' ? (
                    <BilingualText en="You are the last super admin. Give another account that role first." el="Είστε ο τελευταίος super admin. Δώστε πρώτα αυτόν τον ρόλο σε άλλον λογαριασμό." wrap />
                  ) : (
                    <BilingualText
                      en={`Other members belong to ${blocker.organizations.join(', ')}. Hand it to one of them first, or it would disappear under them.`}
                      el={`Άλλα μέλη ανήκουν στο ${blocker.organizations.join(', ')}. Παραδώστε το πρώτα σε ένα από αυτά, αλλιώς θα εξαφανιζόταν μαζί τους.`}
                      wrap
                    />
                  )}
                </p>
              ))}
            </div>
          ) : (
            <>
              {lines.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {lines.map((line) => <li key={line.en}><BilingualText en={line.en} el={line.el} wrap /></li>)}
                </ul>
              ) : null}
              <p className="text-sm text-muted-foreground">
                <BilingualText en="Want a copy first?" el="Θέλετε πρώτα ένα αντίγραφο;" compact />{' '}
                <Link href="/settings/data-export" className="text-primary-accessible underline underline-offset-4">
                  <BilingualText en="Export your data" el="Εξαγωγή των δεδομένων σας" compact />
                </Link>
              </p>
              {data.confirmWith === 'email' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="delete-email"><BilingualText en="Type your email to confirm" el="Γράψτε το email σας για επιβεβαίωση" compact /></Label>
                  <Input id="delete-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="delete-password"><BilingualText en="Your password" el="Ο κωδικός σας" compact /></Label>
                  <Input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}
              {data.needsCode ? (
                <div className="space-y-1.5">
                  <Label htmlFor="delete-code"><BilingualText en="Code from your authenticator app" el="Κωδικός από την εφαρμογή επαλήθευσης" compact /></Label>
                  <Input id="delete-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
              ) : null}
              <label className="flex min-h-11 items-start gap-3 text-sm text-foreground">
                <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
                <span><BilingualText en="I understand this cannot be undone" el="Κατανοώ ότι δεν αναιρείται" compact /></span>
              </label>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}><BilingualText en="Cancel" el="Ακύρωση" compact /></Button>
            {!blocked ? (
              <Button type="submit" variant="destructive" disabled={!ready || deleting}>
                <BilingualText en="Delete my account" el="Διαγραφή του λογαριασμού μου" compact />
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
