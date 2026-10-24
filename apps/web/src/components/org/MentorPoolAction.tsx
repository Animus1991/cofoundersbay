'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MENTOR_POOL_REQUEST_NOTE_MAX } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useStoredUser } from '@/hooks/useStoredUser';
import { getMentorPoolStanding, requestToJoinMentorPool, withdrawMentorPoolRequest } from '@/lib/api';
import { qk } from '@/lib/query-keys';

/**
 * A mentor asking to join an organisation's mentor pool, from its page
 * (docs §103). Shown only to a signed-in mentor, and only while the
 * organisation's "Mentor self-registration" policy is on - or while their
 * own request waits, or once they are in the pool. Nothing for anyone else.
 */
export function MentorPoolAction({ slug }: { slug: string }) {
  const signedIn = Boolean(useStoredUser()?.id);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<{ en: string; el: string } | null>(null);
  const key = qk('org', 'mentor-pool-standing', slug);
  const standing = useQuery({ queryKey: key, queryFn: () => getMentorPoolStanding(slug), enabled: signedIn && Boolean(slug), retry: 0, staleTime: 60_000 });
  const data = standing.data;

  const ask = useMutation({
    mutationFn: () => requestToJoinMentorPool(data!.organizationId, note.trim() || undefined),
    onSuccess: () => {
      success('Request sent', data?.name);
      setOpen(false);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (err) => {
      const e = err as { message?: string; details?: { messageEl?: string } };
      const en = e?.message || 'The request was not sent.';
      setProblem({ en, el: e?.details?.messageEl ?? en });
      showError('Could not send the request', en);
    },
  });
  const withdraw = useMutation({
    mutationFn: () => withdrawMentorPoolRequest(data!.organizationId),
    onSuccess: () => {
      success('Request withdrawn', data?.name);
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (err) => showError('Could not answer the request', err instanceof Error ? err.message : undefined),
  });

  if (!signedIn || !data || !data.isMentor) return null;
  if (data.standing === 'in_pool') {
    return (
      <span className="text-sm text-muted-foreground">
        <BilingualText en="In this mentor pool" el="Στη δεξαμενή μεντόρων" compact />
      </span>
    );
  }
  if (data.standing === 'requested') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <BilingualText en="Request to mentor sent" el="Το αίτημα καθοδήγησης στάλθηκε" compact />
        <Button size="sm" variant="ghost" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
          <BilingualText en="Withdraw" el="Ανάκληση" compact />
        </Button>
      </span>
    );
  }
  if (data.standing !== 'can_request') return null;
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { setProblem(null); setOpen(true); }}>
        <BilingualText en="Ask to mentor here" el="Ζητήστε να γίνετε μέντορας" compact />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle><BilingualText en={`Mentor with ${data.name}`} el={`Καθοδήγηση με ${data.name}`} compact wrap /></DialogTitle>
            <DialogDescription>
              <BilingualText
                en="Your request goes to the organisation's admins; they add you to their mentor pool or decline, and you are told either way."
                el="Το αίτημα πηγαίνει στους διαχειριστές του οργανισμού· σας προσθέτουν στη δεξαμενή μεντόρων τους ή το απορρίπτουν, και ενημερώνεστε σε κάθε περίπτωση."
                wrap
              />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="mentor-pool-note"><BilingualText en="Note (optional)" el="Σημείωμα (προαιρετικό)" compact /></Label>
            <Textarea id="mentor-pool-note" rows={3} maxLength={MENTOR_POOL_REQUEST_NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {problem ? <p role="alert" className="text-sm text-destructive-accessible"><BilingualText en={problem.en} el={problem.el} wrap /></p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}><BilingualText en="Cancel" el="Ακύρωση" compact /></Button>
            <Button disabled={ask.isPending} onClick={() => ask.mutate()}>
              {ask.isPending ? <BilingualText en="Sending…" el="Αποστολή…" compact /> : <BilingualText en="Send request" el="Αποστολή αιτήματος" compact />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
