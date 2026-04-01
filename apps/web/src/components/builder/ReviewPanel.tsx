'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  GitBranch, Loader2, MessageSquare, ThumbsUp, ThumbsDown,
  RotateCcw, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  listProposals,
  submitProposalReview,
  type ChangeProposal,
} from '@/lib/api';

// ── Proposal Status helpers ────────────────────────────────────────────────

function proposalStatusMeta(status: string) {
  switch (status) {
    case 'open':
      return { label: 'Open', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock };
    case 'approved':
      return { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
    case 'changes_requested':
      return { label: 'Changes Needed', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle };
    case 'merged':
      return { label: 'Accepted & Applied', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle2 };
    case 'closed':
      return { label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle };
    default:
      return { label: status, color: 'bg-muted text-muted-foreground border-border', icon: ClipboardCheck };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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
      buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    changes_requested: {
      title: 'Request Changes',
      desc: 'Let the author know what needs to be revised.',
      buttonLabel: 'Request Changes',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
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
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">{proposal.title}</p>
            {proposal.description && (
              <p className="text-muted-foreground mt-1 text-xs">{proposal.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Feedback {decision !== 'approved' && <span className="text-destructive">*</span>}</Label>
            <Textarea
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
              <Label>Rating (optional)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n === rating ? null : n)}
                    className={cn(
                      'transition-colors',
                      n <= (rating ?? 0) ? 'text-yellow-400' : 'text-muted-foreground/40',
                    )}
                  >
                    <Star className="h-5 w-5 fill-current" />
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
            {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
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

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', documentId],
    queryFn: () => listProposals(documentId),
    enabled: open && !!documentId,
    refetchInterval: 30_000,
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
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Change Proposals
              {openCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700">
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
                'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
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
                'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
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
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
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
                  <div
                    key={proposal.id}
                    className={cn(
                      'p-4 rounded-lg border transition-colors',
                      isPending
                        ? 'border-orange-200 bg-orange-50/40 dark:bg-orange-950/10 dark:border-orange-900/40'
                        : 'border-border/60 bg-card',
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-sm font-medium truncate">{proposal.title}</p>
                        </div>
                        {proposal.branch && (
                          <p className="text-xs text-muted-foreground">
                            from variant &ldquo;{proposal.branch.name}&rdquo;
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn('text-xs shrink-0', meta.color)}>
                        <StatusIcon className="h-2.5 w-2.5 mr-1" />
                        {meta.label}
                      </Badge>
                    </div>

                    {proposal.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                        {proposal.description}
                      </p>
                    )}

                    {/* Author + time */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={proposal.createdBy.avatarUrl} />
                        <AvatarFallback className="text-[9px]">
                          {(proposal.createdBy.displayName ?? 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {proposal.createdBy.displayName} · {timeAgo(proposal.createdAt)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {!readonly && isPending && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() =>
                            setDecisionState({ proposal, decision: 'approved' })
                          }
                        >
                          <ThumbsUp className="h-3 w-3 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                          onClick={() =>
                            setDecisionState({ proposal, decision: 'changes_requested' })
                          }
                        >
                          <RotateCcw className="h-3 w-3 mr-1.5" />
                          Request Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-xs border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() =>
                            setDecisionState({ proposal, decision: 'closed' })
                          }
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Reviewer count */}
                    {proposal.reviewerIds && proposal.reviewerIds.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {proposal.reviewerIds.length} reviewer{proposal.reviewerIds.length > 1 ? 's' : ''} assigned
                      </div>
                    )}
                  </div>
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
            queryClient.invalidateQueries({ queryKey: ['proposals', documentId] });
            setDecisionState(null);
          }}
        />
      )}
    </>
  );
}
