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
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Clock,
  Loader2, ThumbsUp, ThumbsDown,
  RotateCcw, Star,
} from 'lucide-react';
import { cn, initialsOf } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  listProposals,
  submitProposalReview,
  type ChangeProposal,
} from '@/lib/api';
import { usePollingGuards } from '@/hooks/usePollingGuards';
import { qk } from '@/lib/query-keys';

// ── Proposal Status helpers ────────────────────────────────────────────────

function proposalStatusMeta(status: string) {
  switch (status) {
    case 'open':
      return { label: 'Open', color: 'bg-status-info-bg text-status-info border-status-info-border', icon: Clock };
    case 'approved':
      return { label: 'Approved', color: 'bg-status-success-bg text-status-success border-status-success-border', icon: CheckCircle2 };
    case 'changes_requested':
      return { label: 'Changes Needed', color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: AlertCircle };
    case 'merged':
      return { label: 'Accepted & Applied', color: 'bg-status-accent-bg text-status-accent border-status-accent-border', icon: CheckCircle2 };
    case 'closed':
      return { label: 'Closed', color: 'bg-muted text-muted-foreground border-border', icon: XCircle };
    default:
      return { label: status, color: 'bg-muted text-muted-foreground border-border', icon: ClipboardCheck };
  }
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
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const decisionMeta = {
    approved: {
      title: 'Approve Proposal',
      desc: 'Confirm you approve the changes in this proposal.',
      buttonLabel: 'Approve',
      buttonClass: 'bg-status-success-mark hover:bg-status-success-mark',
    },
    changes_requested: {
      title: 'Request Changes',
      desc: 'Let the author know what needs to be revised.',
      buttonLabel: 'Request Changes',
      buttonClass: 'bg-status-warning-mark hover:bg-status-warning-mark',
    },
    closed: {
      title: 'Close Proposal',
      desc: 'Close and decline this proposal without merging.',
      buttonLabel: 'Close Proposal',
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
        <DialogHeader>
          <DialogTitle>{decisionMeta.title}</DialogTitle>
          <DialogDescription>{decisionMeta.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* The proposal under review, set as a card head (title, the
              variant it came from) with its sentence on the same edge. */}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <CardHead
              titleAs="p"
              title={proposal.title}
              subtitle={proposal.branch ? <>from variant &ldquo;{proposal.branch.name}&rdquo;</> : undefined}
            />
            {proposal.description && (
              <p className="card-body line-clamp-3 text-muted-foreground first-letter:uppercase">{proposal.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback">Feedback {decision !== 'approved' && <span className="text-destructive-accessible">*</span>}</Label>
            <Textarea id="feedback"
              placeholder={
                decision === 'approved'
                  ? 'Optional comments for the author...'
                  : 'Describe what needs to be changed...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {decision === 'approved' && (
            <div className="space-y-1.5">
              <p id="rating-optional-cap" className="text-sm font-medium leading-tight">Rating (optional)</p>
              <div role="group" aria-labelledby="rating-optional-cap" className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={rating !== null && n <= rating}
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className={decisionMeta.buttonClass}
            onClick={handleSubmit}
            disabled={loading || (decision !== 'approved' && !feedback.trim())}
          >
            {loading && <Loader2 className="icon-sm mr-2 animate-spin" />}
            {decisionMeta.buttonLabel}
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
              Change Proposals
              {openCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-status-warning-bg text-status-warning">
                  {openCount} pending
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              Review and accept or decline proposed changes to this document.
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
              Open ({openCount})
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
              All ({allProposals.length})
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
                  {activeFilter === 'open' ? 'No pending proposals' : 'No proposals yet'}
                </p>
                <p className="text-xs mt-1">
                  Proposals are created when someone submits a Draft Variant for review.
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
                        subtitle={proposal.branch ? <>from variant &ldquo;{proposal.branch.name}&rdquo;</> : undefined}
                        meta={<>{proposal.createdBy?.displayName} · <RelativeTime date={proposal.createdAt} /></>}
                        aside={(
                          <Badge variant="outline" className={cn('text-xs shrink-0', meta.color)}>
                            <StatusIcon className="h-2.5 w-2.5 mr-1" />
                            {meta.label}
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
                          <>{proposal.reviewerIds.length} reviewer{proposal.reviewerIds.length > 1 ? 's' : ''} assigned</>
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
                              Approve
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
                              Request Changes
                            </Button>
                            <Button aria-label="Reject"
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
