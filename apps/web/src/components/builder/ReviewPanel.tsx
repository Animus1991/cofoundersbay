'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { RelativeTime } from '@/components/common/RelativeTime';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Clock, Loader2, ThumbsUp, ThumbsDown, RotateCcw, Star, Info } from 'lucide-react';
import { cn, initialsOf } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  listProposals,
  submitProposalReview,
  type ChangeProposal,
} from '@/lib/api';
import { usePollingGuards } from '@/hooks/usePollingGuards';
import { qk } from '@/lib/query-keys';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';

// ── Proposal Status helpers ────────────────────────────────────────────────

// The whole panel was English on a Greek page, beside a Builder whose every
// other control speaks Greek (§163).
function proposalStatusMeta(status: string) {
  switch (status) {
    case 'open':
      return { label: 'Open', labelEl: 'Ανοιχτή', color: 'bg-status-info-bg text-status-info border-status-info-border', icon: Clock };
    case 'approved':
      return { label: 'Approved', labelEl: 'Εγκρίθηκε', color: 'bg-status-success-bg text-status-success border-status-success-border', icon: CheckCircle2 };
    case 'changes_requested':
      return { label: 'Changes needed', labelEl: 'Χρειάζεται αλλαγές', color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: AlertCircle };
    case 'merged':
      return { label: 'Accepted & applied', labelEl: 'Εγκρίθηκε και εφαρμόστηκε', color: 'bg-status-accent-bg text-status-accent border-status-accent-border', icon: CheckCircle2 };
    case 'closed':
      return { label: 'Closed', labelEl: 'Κλειστή', color: 'bg-muted text-muted-foreground border-border', icon: XCircle };
    default:
      return { label: status, labelEl: status, color: 'bg-muted text-muted-foreground border-border', icon: ClipboardCheck };
  }
}

/** "from variant “x”", in the reader's words and quotation marks. */
function FromVariant({ name }: { name: string }) {
  return <BilingualText en={`from variant “${name}”`} el={`από την εκδοχή «${name}»`} compact />;
}


// ── Review Decision Dialog ─────────────────────────────────────────────────

interface ReviewDecisionDialogProps {
  open: boolean;
  onClose: () => void;
  proposal: ChangeProposal;
  decision: 'approved' | 'changes_requested' | 'closed';
  onDecisionSubmitted: () => void;
}

function ReviewDecisionDialog({
  open,
  onClose,
  proposal,
  decision,
  onDecisionSubmitted,
}: ReviewDecisionDialogProps) {
  const { success, error: toastError } = useToast();
  const sayOne = useBilingualString();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const decisionMeta = {
    approved: {
      title: { en: 'Approve proposal', el: 'Έγκριση πρότασης' },
      desc: { en: 'Confirm you approve the changes in this proposal.', el: 'Επιβεβαιώστε ότι εγκρίνετε τις αλλαγές αυτής της πρότασης.' },
      buttonLabel: { en: 'Approve', el: 'Έγκριση' },
      buttonClass: 'bg-status-success-mark hover:bg-status-success-mark',
    },
    changes_requested: {
      title: { en: 'Request changes', el: 'Αίτημα αλλαγών' },
      desc: { en: 'Let the author know what needs to be revised.', el: 'Πείτε σε όποιον την έγραψε τι χρειάζεται αναθεώρηση.' },
      buttonLabel: { en: 'Request changes', el: 'Αίτημα αλλαγών' },
      buttonClass: 'bg-status-warning-mark hover:bg-status-warning-mark',
    },
    closed: {
      title: { en: 'Close proposal', el: 'Κλείσιμο πρότασης' },
      desc: { en: 'Close and decline this proposal without merging.', el: 'Η πρόταση κλείνει και απορρίπτεται χωρίς συγχώνευση.' },
      buttonLabel: { en: 'Close proposal', el: 'Κλείσιμο πρότασης' },
      buttonClass: 'bg-destructive hover:bg-destructive/90',
    },
  }[decision];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitProposalReview(proposal.id, {
        decision,
        feedback: feedback || undefined,
        rating: rating ?? undefined,
      });
      success(
        decision === 'approved'
          ? 'Proposal approved'
          : decision === 'changes_requested'
          ? 'Changes requested'
          : 'Proposal closed',
      );
      onDecisionSubmitted();
      onClose();
    } catch {
      toastError('Failed to submit review decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader icon={Info} tone="neutral">
          <DialogTitle><BilingualText {...decisionMeta.title} compact /></DialogTitle>
          <DialogDescription><BilingualText {...decisionMeta.desc} wrap /></DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* The proposal under review, set as a card head (title, the
              variant it came from) with its sentence on the same edge. */}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <CardHead
              titleAs="p"
              title={proposal.title}
              subtitle={proposal.branch ? <FromVariant name={proposal.branch.name} /> : undefined}
            />
            {proposal.description && (
              <p className="card-body line-clamp-3 text-muted-foreground first-letter:uppercase">{proposal.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback"><BilingualText en="Feedback" el="Σχόλια" compact /> {decision !== 'approved' && <span className="text-destructive-accessible">*</span>}</Label>
            <Textarea id="feedback"
              placeholder={
                decision === 'approved'
                  ? sayOne('Optional comments for the author…', 'Προαιρετικά σχόλια για όποιον την έγραψε…')
                  : sayOne('Describe what needs to be changed…', 'Περιγράψτε τι πρέπει να αλλάξει…')
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {decision === 'approved' && (
            <div className="space-y-1.5">
              <p id="rating-optional-cap" className="text-sm font-medium leading-tight"><BilingualText en="Rating (optional)" el="Βαθμολογία (προαιρετικά)" compact /></p>
              <div role="group" aria-labelledby="rating-optional-cap" className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button aria-label={bilingualAria(`${n} star${n > 1 ? 's' : ''}`, `${n} ${n > 1 ? 'αστέρια' : 'αστέρι'}`)} aria-pressed={rating !== null && n <= rating}
                    key={n}
                    type="button"
                    onClick={() => setRating(n === rating ? null : n)}
                    className={cn(
                      'transition-colors',
                      n <= (rating ?? 0) ? 'text-status-warning' : 'text-muted-foreground/40',
                    )}
                  >
                    <Star className="icon-sm fill-current" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}><BilingualText en="Cancel" el="Ακύρωση" compact /></Button>
          <Button
            className={decisionMeta.buttonClass}
            onClick={handleSubmit}
            disabled={loading || (decision !== 'approved' && !feedback.trim())}
          >
            {loading && <Loader2 className="icon-sm mr-2 animate-spin" />}
            <BilingualText {...decisionMeta.buttonLabel} compact />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ReviewPanel ───────────────────────────────────────────────────────

interface ReviewPanelProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  workspaceId: string;
  readonly?: boolean;
}

export function ReviewPanel({ open, onClose, documentId, workspaceId, readonly = false }: ReviewPanelProps) {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'open' | 'all'>('open');
  const [decisionState, setDecisionState] = useState<{
    proposal: ChangeProposal;
    decision: 'approved' | 'changes_requested' | 'closed';
  } | null>(null);
  const { apiAvailable, pollInterval } = usePollingGuards();

  const { data, isLoading } = useQuery({
    queryKey: qk('builder', 'proposals', documentId),
    queryFn: () => listProposals(documentId),
    enabled: open && !!documentId && apiAvailable,
    refetchInterval: pollInterval(30_000),
    refetchIntervalInBackground: false,
    retry: 0,
  });

  const allProposals: ChangeProposal[] = Array.isArray(data) ? data : [];
  const filtered = activeFilter === 'open'
    ? allProposals.filter(p => p.status === 'open' || p.status === 'changes_requested')
    : allProposals;

  const openCount = allProposals.filter(p => p.status === 'open' || p.status === 'changes_requested').length;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardCheck className="icon-sm text-muted-foreground" />
              <BilingualText en="Change proposals" el="Προτάσεις αλλαγών" compact />
              {openCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-status-warning-bg text-status-warning">
                  <BilingualText en={`${openCount} pending`} el={`${openCount} σε αναμονή`} compact />
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              <BilingualText en="Review and accept or decline proposed changes to this document." el="Ελέγξτε, εγκρίνετε ή απορρίψτε τις προτεινόμενες αλλαγές του εγγράφου." wrap />
            </SheetDescription>
          </SheetHeader>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-4 p-1 bg-muted rounded-lg">
            <button
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
                activeFilter === 'open'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setActiveFilter('open')}
            >
              <BilingualText en={`Open (${openCount})`} el={`Ανοιχτές (${openCount})`} compact />
            </button>
            <button
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
                activeFilter === 'all'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setActiveFilter('all')}
            >
              <BilingualText en={`All (${allProposals.length})`} el={`Όλες (${allProposals.length})`} compact />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="icon-xl mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {activeFilter === 'open'
                    ? <BilingualText en="No pending proposals" el="Καμία πρόταση σε αναμονή" compact />
                    : <BilingualText en="No proposals yet" el="Δεν υπάρχουν ακόμη προτάσεις" compact />}
                </p>
                <p className="text-xs mt-1">
                  <BilingualText en="Proposals are created when someone submits a draft variant for review." el="Μια πρόταση δημιουργείται όταν κάποιος υποβάλλει πρόχειρη εκδοχή για έλεγχο." wrap />
                </p>
              </div>
            ) : (
              filtered.map(proposal => {
                const meta = proposalStatusMeta(proposal.status);
                const StatusIcon = meta.icon;
                const isPending = proposal.status === 'open' || proposal.status === 'changes_requested';

                return (
                  <Card
                    key={proposal.id}
                    className={cn('transition-all hover:border-primary/20', isPending && 'border-status-warning-border')}
                  >
                    <CardContent className="space-y-3">
                      <CardHead
                        mark={(
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={proposal.createdBy?.avatarUrl} />
                            <AvatarFallback>
                              {initialsOf(proposal.createdBy?.displayName ?? 'U')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        title={proposal.title}
                        subtitle={proposal.branch ? <FromVariant name={proposal.branch.name} /> : undefined}
                        meta={<>{proposal.createdBy?.displayName} · <RelativeTime date={proposal.createdAt} /></>}
                        aside={(
                          <Badge variant="outline" className={cn('text-xs shrink-0', meta.color)}>
                            <StatusIcon className="h-2.5 w-2.5 mr-1" />
                            <BilingualText en={meta.label} el={meta.labelEl} compact />
                          </Badge>
                        )}
                      />

                      {proposal.description && (
                        <p className="card-body line-clamp-3 text-muted-foreground first-letter:uppercase">
                          {proposal.description}
                        </p>
                      )}

                      <CardFoot
                        meta={proposal.reviewerIds && proposal.reviewerIds.length > 0 ? (
                          <BilingualText
                            en={`${proposal.reviewerIds.length} reviewer${proposal.reviewerIds.length > 1 ? 's' : ''} assigned`}
                            el={`${proposal.reviewerIds.length} ${proposal.reviewerIds.length > 1 ? 'πρόσωπα ελέγχουν' : 'πρόσωπο ελέγχει'}`}
                            compact
                          />
                        ) : undefined}
                      >
                        {!readonly && isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-status-success-border text-status-success hover:bg-status-success-bg"
                              onClick={() =>
                                setDecisionState({ proposal, decision: 'approved' })
                              }
                            >
                              <ThumbsUp className="icon-sm mr-1.5" />
                              <BilingualText en="Approve" el="Έγκριση" compact />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-status-warning-border text-status-warning hover:bg-status-warning-bg"
                              onClick={() =>
                                setDecisionState({ proposal, decision: 'changes_requested' })
                              }
                            >
                              <RotateCcw className="icon-sm mr-1.5" />
                              <BilingualText en="Request changes" el="Αίτημα αλλαγών" compact />
                            </Button>
                            <Button aria-label={bilingualAria('Close proposal', 'Κλείσιμο πρότασης')}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-status-danger-border text-status-danger hover:bg-status-danger-bg"
                              onClick={() =>
                                setDecisionState({ proposal, decision: 'closed' })
                              }
                            >
                              <XCircle className="icon-sm" />
                            </Button>
                          </>
                        )}
                      </CardFoot>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Review decision dialog */}
      {decisionState && (
        <ReviewDecisionDialog
          open={!!decisionState}
          onClose={() => setDecisionState(null)}
          proposal={decisionState.proposal}
          decision={decisionState.decision}
          onDecisionSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: qk('builder', 'proposals', documentId) });
            setDecisionState(null);
          }}
        />
      )}
    </>
  );
}
