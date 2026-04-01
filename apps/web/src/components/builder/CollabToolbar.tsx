'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  GitBranch,
  GitPullRequest,
  History,
  Share2,
  ChevronDown,
  Plus,
  Loader2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  listBranches,
  createBranch,
  listProposals,
  createShareLink,
  type ArtifactBranch,
  type ChangeProposal,
  type ArtifactShareLink,
} from '@/lib/api';
import { ReviewPanel } from './ReviewPanel';
import { BranchPanel } from './BranchPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CollabToolbarProps {
  documentId: string;
  workspaceId: string;
  documentTitle?: string;
  readonly?: boolean;
  className?: string;
  onHistoryClick?: () => void;
}

// ── Share Link Dialog ─────────────────────────────────────────────────────────

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  documentId?: string;
  workspaceId?: string;
}

function ShareLinkDialog({ open, onClose, documentId, workspaceId }: ShareDialogProps) {
  const { success, error: toastError } = useToast();
  const [label, setLabel] = useState('');
  const [permission, setPermission] = useState<'view' | 'comment' | 'suggest'>('view');
  const [expiresIn, setExpiresIn] = useState('7');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const expiresAt = expiresIn !== 'never'
        ? new Date(Date.now() + Number(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const link = await createShareLink({
        documentId,
        workspaceId: !documentId ? workspaceId : undefined,
        permissions: permission,
        label: label || undefined,
        expiresAt,
      });

      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${link.token}`;
      setGeneratedUrl(url);
      success('Share link created');
    } catch {
      toastError('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      success('Link copied to clipboard');
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setLabel('');
    setPermission('view');
    setExpiresIn('7');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Create a shareable link for external stakeholders, mentors, or investors.
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1 font-mono">{generatedUrl}</span>
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with anyone. Link expires{' '}
              {expiresIn !== 'never' ? `in ${expiresIn} days` : 'never'}.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input
                placeholder="e.g. Investor preview, Mentor review..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Permission level</Label>
              <div className="flex gap-2">
                {(['view', 'comment', 'suggest'] as const).map(p => (
                  <Button
                    key={p}
                    size="sm"
                    variant={permission === p ? 'default' : 'outline'}
                    onClick={() => setPermission(p)}
                    className="capitalize flex-1"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expires in</Label>
              <div className="flex gap-2 flex-wrap">
                {[['1', '1 day'], ['7', '7 days'], ['30', '30 days'], ['never', 'Never']].map(([v, l]) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={expiresIn === v ? 'default' : 'outline'}
                    onClick={() => setExpiresIn(v)}
                    className="flex-1 min-w-[70px]"
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {generatedUrl ? 'Done' : 'Cancel'}
          </Button>
          {!generatedUrl && (
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              Generate Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Proposal Status Icon ──────────────────────────────────────────────────────

function ProposalStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case 'changes_requested':
      return <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />;
    case 'closed':
      return <XCircle className="h-3.5 w-3.5 text-gray-400" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-blue-500" />;
  }
}

// ── Main CollabToolbar ────────────────────────────────────────────────────────

export function CollabToolbar({
  documentId,
  workspaceId,
  documentTitle,
  readonly = false,
  className,
  onHistoryClick,
}: CollabToolbarProps) {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showBranchPanel, setShowBranchPanel] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data: branchesData } = useQuery({
    queryKey: ['branches', documentId],
    queryFn: () => listBranches(documentId),
    refetchInterval: 30_000,
    enabled: !!documentId,
  });

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals', documentId],
    queryFn: () => listProposals(documentId),
    refetchInterval: 30_000,
    enabled: !!documentId,
  });

  const branches: ArtifactBranch[] = Array.isArray(branchesData) ? branchesData : [];
  const proposals: ChangeProposal[] = Array.isArray(proposalsData) ? proposalsData : [];

  const openBranches = branches.filter(b => b.status === 'open');
  const openProposals = proposals.filter(p => p.status === 'open' || p.status === 'changes_requested');

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1.5', className)}>

        {/* ── Version History ────────────────────────────────────────────── */}
        {onHistoryClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
                onClick={onHistoryClick}
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs hidden sm:inline">History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View version history</TooltipContent>
          </Tooltip>
        )}

        {/* ── Draft Variants (Branches) ──────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground relative"
              onClick={() => setShowBranchPanel(true)}
            >
              <GitBranch className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs hidden sm:inline">Variants</span>
              {openBranches.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-medium">
                  {openBranches.length}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Draft Variants — {openBranches.length} open</TooltipContent>
        </Tooltip>

        {/* ── Review Proposals ──────────────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground relative"
              onClick={() => setShowReviewPanel(true)}
            >
              <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs hidden sm:inline">Proposals</span>
              {openProposals.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1.5 text-[10px] bg-orange-100 text-orange-700 border-orange-200"
                >
                  {openProposals.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Change Proposals — {openProposals.length} pending</TooltipContent>
        </Tooltip>

        {/* ── Share ─────────────────────────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs hidden sm:inline">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share document externally</TooltipContent>
        </Tooltip>

        {/* ── Dialogs / Panels ──────────────────────────────────────────── */}
        <ShareLinkDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          documentId={documentId}
          workspaceId={workspaceId}
        />

        <BranchPanel
          open={showBranchPanel}
          onClose={() => setShowBranchPanel(false)}
          documentId={documentId}
          workspaceId={workspaceId}
          documentTitle={documentTitle}
          readonly={readonly}
        />

        <ReviewPanel
          open={showReviewPanel}
          onClose={() => setShowReviewPanel(false)}
          documentId={documentId}
          workspaceId={workspaceId}
          readonly={readonly}
        />
      </div>
    </TooltipProvider>
  );
}
