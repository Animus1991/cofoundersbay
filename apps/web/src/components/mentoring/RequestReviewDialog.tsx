'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { requestExpertReview } from '@/lib/api';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { bilingualInline } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { formatFee } from '@/lib/mentor-fee';
import { qk } from '@/lib/query-keys';
import type { Mentor } from '@/lib/mentoring/directory';
import { REVIEW_AREAS, type ReviewArea } from '@/lib/mentoring/services';

function localIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * A review request to one expert (docs §111).
 *
 * The API took review requests since §90; the page offered none. "Request a
 * review" opened the mentor list, where the reader had to find the same
 * person again and book a session instead. This sends the request itself:
 * what to review, what to look at, and an optional date, to the person on
 * the card. It then sits under Expert reviews → My reviews, where the
 * expert's answer arrives.
 */
export function RequestReviewDialog({
  expert,
  defaultArea,
  onClose,
}: {
  expert: Mentor | null;
  defaultArea: string | null;
  onClose: () => void;
}) {
  const sayOne = useBilingualString();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [area, setArea] = useState<ReviewArea>('general');
  const [message, setMessage] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sending, setSending] = useState(false);

  // Each opening starts from the area the directory is narrowed to.
  useEffect(() => {
    if (!expert) return;
    setArea(defaultArea && defaultArea in REVIEW_AREAS ? (defaultArea as ReviewArea) : 'general');
    setMessage('');
    setDueDate('');
  }, [expert, defaultArea]);

  if (!expert) return null;
  const fee = expert.review?.feeFrom ?? null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      await requestExpertReview({
        expertId: expert.id,
        reviewType: area,
        requestMessage: message.trim() || undefined,
        // The end of the chosen day, where the reader is.
        dueDate: dueDate ? new Date(`${dueDate}T23:59:00`).toISOString() : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: qk('expert-reviews') });
      success(
        bilingualInline('Review requested', 'Το αίτημα αξιολόγησης στάλθηκε'),
        bilingualInline(
          `Sent to ${expert.displayName}. Follow it under Expert reviews → My reviews.`,
          `Το αίτημα στάλθηκε σε: ${expert.displayName}. Θα το βρείτε στις Αξιολογήσεις ειδικών → Οι αξιολογήσεις μου.`,
        ),
      );
      onClose();
    } catch (err) {
      showError(
        bilingualInline('The request was not sent', 'Το αίτημα δεν στάλθηκε'),
        err instanceof Error ? err.message : bilingualInline('Please try again', 'Δοκιμάστε ξανά'),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !sending) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <BilingualText en={`Request a review from ${expert.displayName}`} el={`Αίτημα αξιολόγησης προς ${expert.displayName}`} />
          </DialogTitle>
          <DialogDescription>
            <BilingualText
              en="Say what to review and what you want checked. If the request is accepted, the review arrives under Expert reviews."
              el="Πείτε τι θα αξιολογηθεί και τι θέλετε να ελεγχθεί. Αν το αίτημα γίνει δεκτό, η αξιολόγηση έρχεται στις Αξιολογήσεις ειδικών."
              wrap
            />
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-area"><BilingualText en="What to review" el="Τι θα αξιολογηθεί" compact /></Label>
            <Select value={area} onValueChange={(v) => setArea(v as ReviewArea)}>
              <SelectTrigger id="review-area">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REVIEW_AREAS) as ReviewArea[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    <BilingualText en={REVIEW_AREAS[key].en} el={REVIEW_AREAS[key].el} compact />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-message"><BilingualText en="What should they look at? (optional)" el="Τι να κοιτάξει; (προαιρετικά)" compact /></Label>
            <Textarea
              id="review-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={sayOne('For example: is the traction slide honest enough for a seed round?', 'Για παράδειγμα: είναι αρκετά τεκμηριωμένη η διαφάνεια traction για γύρο seed;')}
              rows={4}
              maxLength={4000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-due"><BilingualText en="Needed by (optional)" el="Χρειάζεται έως (προαιρετικά)" compact /></Label>
            <Input id="review-due" type="date" value={dueDate} min={localIsoDate()} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {fee != null ? (
            <p className="rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground">
              <BilingualText
                en={`Reviews from ${formatFee(fee, expert.review?.currency)}. The fee is agreed when the request is accepted.`}
                el={`Αξιολογήσεις από ${formatFee(fee, expert.review?.currency)}. Η αμοιβή συμφωνείται με την αποδοχή του αιτήματος.`}
                wrap
              />
            </p>
          ) : null}

          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/expert-reviews">
                <BilingualText en="My reviews" el="Οι αξιολογήσεις μου" compact />
              </Link>
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
              <BilingualText en="Cancel" el="Ακύρωση" compact />
            </Button>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending && <Loader2 className="icon-sm animate-spin" aria-hidden="true" />}
              <BilingualText en="Send request" el="Αποστολή αιτήματος" compact />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
