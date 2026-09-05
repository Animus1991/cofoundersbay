'use client';

/**
 * CollaborationStarter
 *
 * Surfaces actionable next-steps when a connection has been accepted.
 * The goal is to bridge the gap between "connected" and "actively collaborating"
 * by providing a structured, low-friction workflow prompt.
 *
 * Modes:
 *   - inline: compact card embedded in a connection list row
 *   - banner: full-width suggestion bar (e.g. for the Connected tab header)
 *   - modal: shown after accepting a connection request
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  FolderPlus,
  Target,
  Calendar,
  ChevronRight,
  X,
  Sparkles,
  Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getOrCreateDirectConversation } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CollaborationStarterProps = {
  /** The user the current person just connected with */
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    role?: string;
    headline?: string | null;
  };
  /** Whether this is a freshly accepted connection (triggers the modal) */
  justAccepted?: boolean;
  /** Inline or banner display mode */
  mode?: 'inline' | 'banner' | 'modal';
  /** External dismiss handler (for modal or banner) */
  onDismiss?: () => void;
  className?: string;
};

// ─── Action definitions ───────────────────────────────────────────────────────

type CollabAction = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  variant: 'default' | 'outline' | 'secondary';
  href?: string;
  onClick?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CollaborationStarter({
  otherUser,
  justAccepted = false,
  mode = 'inline',
  onDismiss,
  className,
}: CollaborationStarterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(justAccepted && mode === 'modal');

  const handleMessage = async () => {
    setLoading('message');
    try {
      const { conversationId } = await getOrCreateDirectConversation(otherUser.id);
      router.push(`/messages?c=${conversationId}`);
    } catch {
      router.push(`/messages?to=${otherUser.id}`);
    } finally {
      setLoading(null);
    }
  };

  const actions: CollabAction[] = [
    {
      id: 'message',
      label: 'Send a message',
      description: 'Start the conversation',
      icon: MessageCircle,
      variant: 'default',
      onClick: handleMessage,
    },
    {
      id: 'project',
      label: 'Create a project',
      description: 'Collaborate on something together',
      icon: FolderPlus,
      variant: 'outline',
      href: `/projects/create?collaborator=${otherUser.id}`,
    },
    {
      id: 'milestone',
      label: 'Set a goal',
      description: 'Define a shared first milestone',
      icon: Target,
      variant: 'outline',
      href: `/milestones/new?with=${otherUser.id}`,
    },
    {
      id: 'schedule',
      label: 'Schedule a call',
      description: 'Find a time to meet',
      icon: Calendar,
      variant: 'outline',
      href: `/messages?to=${otherUser.id}&action=schedule`,
    },
  ];

  const handleAction = async (action: CollabAction) => {
    if (action.onClick) {
      await action.onClick();
      return;
    }
    if (action.href) {
      router.push(action.href);
    }
  };

  // ── Modal mode (post-accept flow) ──────────────────────────────────────────
  if (mode === 'modal') {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onDismiss?.(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-emerald-400/40">
                  <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold text-sm">
                    {otherUser.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                  {otherUser.avatarUrl && <AvatarFallback>{otherUser.displayName[0]}</AvatarFallback>}
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-white">
                  <Handshake className="icon-sm" />
                </span>
              </div>
              <div>
                <DialogTitle className="text-lg">
                  You&rsquo;re connected with {otherUser.displayName}!
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {otherUser.headline ?? 'Ready to start collaborating?'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground mb-3">
              What would you like to do next?
            </p>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={loading === action.id}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3',
                    'text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    loading === action.id && 'opacity-60 pointer-events-none',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4.5 w-4.5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ChevronRight className="icon-sm text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">You can always do this later from your connections</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); onDismiss?.(); }}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Banner mode ────────────────────────────────────────────────────────────
  if (mode === 'banner') {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-xl border border-status-success-border bg-status-success-bg px-4 py-3',
        className,
      )}>
        <Sparkles className="icon-sm shrink-0 text-status-success" />
        <p className="flex-1 text-sm text-foreground">
          <span className="font-medium">New connection:</span>{' '}
          {otherUser.displayName} accepted your request.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs gap-1"
            onClick={handleMessage}
            disabled={loading === 'message'}
          >
            <MessageCircle className="icon-sm" />
            Message
          </Button>
          <Link href={`/projects/create?collaborator=${otherUser.id}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <FolderPlus className="icon-sm" />
              Collaborate
            </Button>
          </Link>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="icon-sm" />
          </button>
        )}
      </div>
    );
  }

  // ── Inline mode (default — compact action strip below a connection card) ───
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 rounded-b-xl border-t border-border/40 bg-muted/30 px-4 py-2.5',
      className,
    )}>
      <span className="text-xs text-muted-foreground mr-1">Next step:</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs gap-1"
        onClick={handleMessage}
        disabled={loading === 'message'}
      >
        <MessageCircle className="icon-sm" />
        Message
      </Button>
      <Link href={`/projects/create?collaborator=${otherUser.id}`}>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <FolderPlus className="icon-sm" />
          Start project
        </Button>
      </Link>
      <Link href={`/milestones/new?with=${otherUser.id}`}>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground">
          <Target className="icon-sm" />
          Set milestone
        </Button>
      </Link>
    </div>
  );
}

// ─── Post-Accept Modal trigger wrapper ────────────────────────────────────────

/**
 * Rendered by the connections page after a successful `accept` mutation.
 * Automatically opens the modal and clears itself when dismissed.
 */
export function PostAcceptCollaborationModal({
  otherUser,
  onDismiss,
}: {
  otherUser: CollaborationStarterProps['otherUser'];
  onDismiss: () => void;
}) {
  return (
    <CollaborationStarter
      otherUser={otherUser}
      justAccepted
      mode="modal"
      onDismiss={onDismiss}
    />
  );
}
