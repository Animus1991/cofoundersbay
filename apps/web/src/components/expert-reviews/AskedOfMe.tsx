'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, MessageCircle, PenLine, Star, X } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { FormDraftNotice } from '@/components/common/FormDraftNotice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  rateExpertReview,
  updateExpertReview,
  type ExpertReviewItem,
  type ExpertReviewStatus,
} from '@/lib/api';
import { parseReviewNotes, readScore } from '@/lib/assistant-drafts';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { REVIEW_AREAS } from '@/lib/mentoring/services';
import { qk } from '@/lib/query-keys';
import { cn, initialsOf } from '@/lib/utils';
import { onRadioGroupKeyDown } from '@/lib/radio-keys';

/**
 * The other side of Expert reviews (docs §107.7-4, §111): the reviews other
 * members asked of the reader.
 *
 * The API answered both sides since §90 and took the expert's answer
 * (`PATCH /expert-reviews/:id`), but no page showed a request to the person
 * it was asked of, so a request could only wait. Here it is accepted or
 * declined, then written: a summary, strengths and improvements as one
 * "area: note" per line, and an overall score. The API's order holds:
 * requested → accepted → in progress → submitted, and a submitted review
 * needs its written feedback. The assistant's draft (`draft_expert_review`)
 * fills the same form; nothing is sent until Submit.
 */

const STATUS_COPY: Record<ExpertReviewStatus, { en: string; el: string }> = {
  requested: { en: 'Asked of you', el: 'Σας ζητήθηκε' },
  accepted: { en: 'Accepted', el: 'Αποδεκτή' },
  in_progress: { en: 'Being written', el: 'Σε σύνταξη' },
  submitted: { en: 'Submitted', el: 'Υποβλήθηκε' },
  declined: { en: 'Declined', el: 'Απορρίφθηκε' },
  expired: { en: 'Expired', el: 'Έληξε' },
};

export type ReviewDraft = {
  reviewId?: string;
  summaryFeedback?: string;
  strengths?: string;
  improvements?: string;
  scoreOverall?: string;
};

function notesText(raw: Record<string, unknown>[] | undefined, key: 'comment' | 'recommendation'): string {
  return (raw ?? [])
    .map((entry) => {
      const area = typeof entry.area === 'string' ? entry.area : '';
      const text = typeof entry[key] === 'string' ? (entry[key] as string) : '';
      return text ? (area ? `${area}: ${text}` : text) : '';
    })
    .filter(Boolean)
    .join('\n');
}

function AskedReviewCard({ review, draft, onDraftUsed, focused }: {
  review: ExpertReviewItem;
  draft: ReviewDraft | null;
  onDraftUsed: () => void;
  focused: boolean;
}) {
  const sayOne = useBilingualString();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const name = review.requester?.displayName ?? sayOne('A member', 'Ένα μέλος');
  const type = REVIEW_AREAS[review.reviewType] ?? REVIEW_AREAS.general;
  const open = review.status === 'accepted' || review.status === 'in_progress';
  const [writing, setWriting] = useState(false);
  const [summary, setSummary] = useState(review.summaryFeedback ?? '');
  const [strengths, setStrengths] = useState(notesText(review.strengths, 'comment'));
  const [improvements, setImprovements] = useState(notesText(review.improvements, 'recommendation'));
  const [score, setScore] = useState(review.scoreOverall ? String(review.scoreOverall) : '');
  const [filled, setFilled] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // The assistant's draft for this review opens the form with its fields.
  useEffect(() => {
    if (!draft || draft.reviewId !== review.id) return;
    const used: string[] = [];
    if (draft.summaryFeedback) { setSummary(draft.summaryFeedback); used.push('summaryFeedback'); }
    if (draft.strengths) { setStrengths(parseReviewNotes(draft.strengths).map((n) => (n.area ? `${n.area}: ${n.text}` : n.text)).join('\n')); used.push('strengths'); }
    if (draft.improvements) { setImprovements(parseReviewNotes(draft.improvements).map((n) => (n.area ? `${n.area}: ${n.text}` : n.text)).join('\n')); used.push('improvements'); }
    const s = readScore(draft.scoreOverall);
    if (s !== null) { setScore(String(s)); used.push('scoreOverall'); }
    setFilled(used);
    setWriting(true);
    onDraftUsed();
  }, [draft, review.id, onDraftUsed]);

  useEffect(() => {
    if (focused) cardRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focused]);

  const done = () => queryClient.invalidateQueries({ queryKey: qk('expert-reviews') });

  const move = useMutation({
    mutationFn: (status: ExpertReviewStatus) => updateExpertReview(review.id, { status }),
    onSuccess: (_res, status) => {
      void done();
      if (status === 'accepted') success(bilingualInline('Review accepted', 'Η αξιολόγηση έγινε δεκτή'), bilingualInline(`${name} is told you will write it.`, `Ενημερώθηκε ότι θα τη γράψετε: ${name}.`));
      if (status === 'declined') success(bilingualInline('Review declined', 'Η αξιολόγηση απορρίφθηκε'));
    },
    onError: (err) => showError(bilingualInline('Not changed', 'Δεν άλλαξε'), err instanceof Error ? err.message : undefined),
  });

  const body = () => {
    const strengthNotes = parseReviewNotes(strengths.replace(/\n/g, ';'));
    const improvementNotes = parseReviewNotes(improvements.replace(/\n/g, ';'));
    const s = readScore(score);
    return {
      summaryFeedback: summary.trim(),
      strengths: strengthNotes.map((n) => ({ area: n.area || sayOne('General', 'Γενικά'), comment: n.text })),
      improvements: improvementNotes.map((n) => ({ area: n.area || sayOne('General', 'Γενικά'), recommendation: n.text })),
      ...(s !== null ? { scoreOverall: s } : {}),
    };
  };

  const save = useMutation({
    mutationFn: async (submit: boolean) => {
      // The API moves one step at a time: an accepted review is "being
      // written" before it can be submitted.
      if (review.status === 'accepted') await updateExpertReview(review.id, { status: 'in_progress' });
      return updateExpertReview(review.id, { ...body(), ...(submit ? { status: 'submitted' as const } : {}) });
    },
    onSuccess: (_res, submit) => {
      void done();
      setFilled([]);
      if (submit) {
        setWriting(false);
        success(bilingualInline('Review submitted', 'Η αξιολόγηση υποβλήθηκε'), bilingualInline(`${name} can read it now.`, `Μπορεί να τη διαβάσει τώρα: ${name}.`));
      } else {
        success(bilingualInline('Saved', 'Αποθηκεύτηκε'), bilingualInline('The review is kept as you left it.', 'Η αξιολόγηση κρατήθηκε όπως την αφήσατε.'));
      }
    },
    onError: (err) => showError(bilingualInline('Not saved', 'Δεν αποθηκεύτηκε'), err instanceof Error ? err.message : undefined),
  });

  const decline = async () => {
    const ok = await confirm({
      title: <BilingualText en={`Decline the review ${name} asked for?`} el={`Απόρριψη της αξιολόγησης που ζήτησε ${name};`} />,
      description: <BilingualText en="They are told it was declined, and can ask someone else." el="Ενημερώνεται ότι απορρίφθηκε και μπορεί να τη ζητήσει από άλλον." />,
      confirmLabel: sayOne('Decline', 'Απόρριψη'),
    });
    if (ok) move.mutate('declined');
  };

  const submit = async () => {
    const ok = await confirm({
      title: <BilingualText en={`Submit the review to ${name}?`} el={`Υποβολή της αξιολόγησης σε ${name};`} />,
      description: <BilingualText en="It is sent as written and cannot be changed afterwards." el="Στέλνεται όπως είναι γραμμένη και δεν αλλάζει μετά." />,
      confirmLabel: sayOne('Submit', 'Υποβολή'),
      variant: 'default',
    });
    if (ok) save.mutate(true);
  };

  const busy = move.isPending || save.isPending;

  return (
    <Card ref={cardRef} id={`asked-review-${review.id}`} className={cn('scroll-mt-24', focused && 'ring-2 ring-primary/30')}>
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.requester?.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary-accessible">{initialsOf(name)}</AvatarFallback>
            </Avatar>
          )}
          title={name}
          subtitle={review.requester?.headline ?? undefined}
          aside={(
            <Badge variant="outline" className="text-xs">
              <BilingualText en={STATUS_COPY[review.status].en} el={STATUS_COPY[review.status].el} compact />
            </Badge>
          )}
        />
        <FactLine
          items={[
            <BilingualText key="type" en={type.en} el={type.el} compact />,
            review.dueDate ? (
              <BilingualText
                key="due"
                en={`Needed by ${new Date(review.dueDate).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' })}`}
                el={`Έως ${new Date(review.dueDate).toLocaleDateString('el-GR', { timeZone: 'UTC', day: 'numeric', month: 'short' })}`}
                compact
              />
            ) : null,
            review.isPaid && review.agreedFee ? <span key="fee" className="tabular-nums">€{review.agreedFee}</span> : null,
          ]}
        />
        {review.requestMessage ? (
          <p className="card-body text-muted-foreground">
            <BilingualText en="They ask:" el="Ζητά:" compact />{' '}
            <span className="text-foreground">{review.requestMessage}</span>
          </p>
        ) : null}

        {writing && open ? (
          <form
            className="space-y-3 border-t border-border pt-3"
            onSubmit={(event) => { event.preventDefault(); void submit(); }}
          >
            <FormDraftNotice filled={filled} onDismiss={() => setFilled([])} />
            <div className="space-y-1.5">
              <Label htmlFor={`rv-summary-${review.id}`}><BilingualText en="Summary" el="Σύνοψη" compact /></Label>
              <Textarea id={`rv-summary-${review.id}`} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={8000}
                placeholder={sayOne('What holds, what does not, and the one change that matters most.', 'Τι στέκει, τι όχι, και η μία αλλαγή που μετρά περισσότερο.')} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`rv-strengths-${review.id}`}><BilingualText en="Strengths (one per line, “area: note”)" el="Δυνατά σημεία (ένα ανά γραμμή, «τομέας: σημείωση»)" compact wrap /></Label>
                <Textarea id={`rv-strengths-${review.id}`} rows={4} value={strengths} onChange={(e) => setStrengths(e.target.value)}
                  placeholder={sayOne('Problem: named in one sentence', 'Πρόβλημα: διατυπώνεται σε μία πρόταση')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`rv-improvements-${review.id}`}><BilingualText en="Improvements (one per line, “area: change”)" el="Βελτιώσεις (μία ανά γραμμή, «τομέας: αλλαγή»)" compact wrap /></Label>
                <Textarea id={`rv-improvements-${review.id}`} rows={4} value={improvements} onChange={(e) => setImprovements(e.target.value)}
                  placeholder={sayOne('Traction: lead with retention, not pipeline', 'Traction: πρώτα η διατήρηση, όχι το pipeline')} />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`rv-score-${review.id}`}><BilingualText en="Overall score" el="Συνολική βαθμολογία" compact /></Label>
                <Select value={score || 'none'} onValueChange={(v) => setScore(v === 'none' ? '' : v)}>
                  <SelectTrigger id={`rv-score-${review.id}`} className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><BilingualText en="No score" el="Χωρίς" compact /></SelectItem>
                    {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((v) => (
                      <SelectItem key={v} value={v}>{v}/10</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setWriting(false)} disabled={busy}>
                  <BilingualText en="Close" el="Κλείσιμο" compact />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => save.mutate(false)} disabled={busy}>
                  {save.isPending && !save.variables ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : null}
                  <BilingualText en="Save" el="Αποθήκευση" compact />
                </Button>
                <Button type="submit" size="sm" className="gap-1.5" disabled={busy || !summary.trim()}>
                  {save.isPending && save.variables ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Check className="icon-sm" aria-hidden="true" />}
                  <BilingualText en="Submit review" el="Υποβολή αξιολόγησης" compact />
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {review.status === 'submitted' && review.summaryFeedback ? (
          <p className="card-body line-clamp-2 italic text-muted-foreground">“{review.summaryFeedback}”</p>
        ) : null}

        <CardFoot end>
          {review.requester?.id ? (
            <Button size="sm" variant="ghost" className="gap-1" asChild>
              <Link href={`/messages?to=${encodeURIComponent(review.requester.id)}`} aria-label={bilingualAria(`Message ${name}`, `Μήνυμα προς ${name}`)}>
                <MessageCircle className="icon-sm" aria-hidden="true" />
                <BilingualText en="Message" el="Μήνυμα" compact />
              </Link>
            </Button>
          ) : null}
          {review.status === 'requested' ? (
            <>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => void decline()} disabled={busy}>
                <X className="icon-sm" aria-hidden="true" />
                <BilingualText en="Decline" el="Απόρριψη" compact />
              </Button>
              <Button size="sm" className="gap-1" onClick={() => move.mutate('accepted')} disabled={busy}>
                {move.isPending ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Check className="icon-sm" aria-hidden="true" />}
                <BilingualText en="Accept" el="Αποδοχή" compact />
              </Button>
            </>
          ) : null}
          {open && !writing ? (
            <>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => void decline()} disabled={busy}>
                <BilingualText en="Decline" el="Απόρριψη" compact />
              </Button>
              <Button size="sm" className="gap-1" onClick={() => setWriting(true)}>
                <PenLine className="icon-sm" aria-hidden="true" />
                <BilingualText en={review.status === 'in_progress' ? 'Continue the review' : 'Write the review'} el={review.status === 'in_progress' ? 'Συνέχεια της αξιολόγησης' : 'Γράψτε την αξιολόγηση'} compact />
              </Button>
            </>
          ) : null}
        </CardFoot>
      </CardContent>
    </Card>
  );
}

/** The list of reviews asked of the reader, open ones first. */
export function AskedOfMe({ reviews, draft, onDraftUsed, focusId }: {
  reviews: ExpertReviewItem[];
  draft: ReviewDraft | null;
  onDraftUsed: () => void;
  focusId: string | null;
}) {
  const order: Record<string, number> = { requested: 0, accepted: 1, in_progress: 1, submitted: 2, declined: 3, expired: 3 };
  const sorted = [...reviews].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));
  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        <BilingualText
          en="Nobody has asked you for a review yet. Members find reviewers in the mentor directory, under “An expert review”."
          el="Δεν σας έχει ζητηθεί ακόμη αξιολόγηση. Τα μέλη βρίσκουν αξιολογητές στον κατάλογο μεντόρων, στο «Αξιολόγηση ειδικού»."
          wrap
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sorted.map((review) => (
        <AskedReviewCard key={review.id} review={review} draft={draft} onDraftUsed={onDraftUsed} focused={focusId === review.id} />
      ))}
    </div>
  );
}

/**
 * The requester rates a review they received: five stars and a line. It
 * was shown when set and could not be given (docs §111).
 */
export function RateReview({ reviewId, expertName }: { reviewId: string; expertName: string }) {
  const sayOne = useBilingualString();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const rate = useMutation({
    mutationFn: () => rateExpertReview(reviewId, { rating, ...(comment.trim() ? { ratingComment: comment.trim() } : {}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk('expert-reviews') });
      setOpen(false);
      success(bilingualInline('Thank you', 'Ευχαριστούμε'), bilingualInline(`Your rating is with ${expertName}'s review.`, `Η βαθμολογία σας μπήκε στην αξιολόγηση: ${expertName}.`));
    },
    onError: (err) => showError(bilingualInline('Not rated', 'Δεν βαθμολογήθηκε'), err instanceof Error ? err.message : undefined),
  });
  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
        <Star className="icon-sm" aria-hidden="true" />
        <BilingualText en="Rate the review" el="Βαθμολογήστε την αξιολόγηση" compact />
      </Button>
    );
  }
  return (
    <form
      className="flex w-full flex-wrap items-center gap-2"
      onSubmit={(event) => { event.preventDefault(); if (rating) rate.mutate(); }}
    >
      <div data-keep-icon="" className="flex items-center gap-0.5" role="radiogroup" aria-label={bilingualAria('Your rating', 'Η βαθμολογία σας')} onKeyDown={(event) => onRadioGroupKeyDown(event)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            tabIndex={rating ? (rating === n ? 0 : -1) : n === 1 ? 0 : -1}
            aria-label={bilingualAria(`${n} of 5`, `${n} από 5`)}
            onClick={() => setRating(n)}
            className="rounded-sm p-0.5 focus-ring"
          >
            <Star className={cn('icon-sm', n <= rating ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/40')} aria-hidden="true" />
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        aria-label={bilingualAria('A line about it (optional)', 'Μια γραμμή γι’ αυτήν (προαιρετικά)')}
        placeholder={sayOne('A line about it (optional)', 'Μια γραμμή γι’ αυτήν (προαιρετικά)')}
        className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
      />
      <Button type="submit" size="sm" disabled={!rating || rate.isPending}>
        {rate.isPending ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : null}
        <BilingualText en="Send" el="Αποστολή" compact />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        <BilingualText en="Cancel" el="Ακύρωση" compact />
      </Button>
    </form>
  );
}

