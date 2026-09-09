'use client';

import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GitBranch, GitPullRequest, MessageSquare, UserPlus, Share2,
  FileText, Edit3, CheckCircle2, XCircle, RotateCcw, History,
  Settings, Star, Zap, Clock, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import type { BuilderActivityLog } from '@/lib/builder-api';

// ── Activity type metadata ────────────────────────────────────────────────────

interface ActivityMeta {
  icon: React.ElementType;
  color: string;
  label: (activity: BuilderActivityLog) => string;
}

const ACTIVITY_META: Record<string, ActivityMeta> = {
  'workspace.created':    { icon: Zap,            color: 'text-purple-500 bg-purple-50',  label: () => 'created this workspace' },
  'workspace.updated':    { icon: Settings,        color: 'text-gray-500 bg-gray-100',     label: () => 'updated workspace settings' },
  'document.created':     { icon: FileText,        color: 'text-blue-500 bg-blue-50',      label: (a) => `created document "${a.metadata?.title ?? ''}"` },
  'document.updated':     { icon: Edit3,           color: 'text-blue-400 bg-blue-50',      label: (a) => `edited "${a.metadata?.title ?? 'a document'}"` },
  'document.completed':   { icon: CheckCircle2,    color: 'text-green-500 bg-green-50',    label: (a) => `marked "${a.metadata?.title ?? 'document'}" as complete` },
  'document.archived':    { icon: XCircle,         color: 'text-gray-400 bg-gray-100',     label: (a) => `archived "${a.metadata?.title ?? 'document'}"` },
  'version.restored':     { icon: RotateCcw,       color: 'text-orange-500 bg-orange-50',  label: (a) => `restored to v${a.metadata?.targetVersion}` },
  'branch.created':       { icon: GitBranch,       color: 'text-indigo-500 bg-indigo-50',  label: (a) => `created draft variant "${a.metadata?.name ?? ''}"` },
  'branch.closed':        { icon: XCircle,         color: 'text-gray-400 bg-gray-100',     label: (a) => `closed variant "${a.metadata?.name ?? ''}"` },
  'proposal.created':     { icon: GitPullRequest,  color: 'text-orange-500 bg-orange-50',  label: (a) => `submitted proposal "${a.metadata?.title ?? ''}"` },
  'proposal.updated':     { icon: Edit3,           color: 'text-orange-400 bg-orange-50',  label: () => 'updated a change proposal' },
  'review.requested':     { icon: GitPullRequest,  color: 'text-yellow-600 bg-yellow-50',  label: () => 'requested a review' },
  'review.approved':      { icon: CheckCircle2,    color: 'text-green-500 bg-green-50',    label: () => 'approved a change proposal' },
  'review.changes_requested': { icon: RotateCcw,   color: 'text-yellow-500 bg-yellow-50',  label: () => 'requested changes to a proposal' },
  'review.closed':        { icon: XCircle,         color: 'text-red-500 bg-red-50',        label: () => 'closed a proposal' },
  'collaborator.added':   { icon: UserPlus,        color: 'text-teal-500 bg-teal-50',      label: () => 'added a collaborator' },
  'collaborator.removed': { icon: UserPlus,        color: 'text-gray-400 bg-gray-100',     label: () => 'removed a collaborator' },
  'share.created':        { icon: Share2,          color: 'text-pink-500 bg-pink-50',      label: () => 'created a share link' },
  'comment.created':      { icon: MessageSquare,   color: 'text-violet-500 bg-violet-50',  label: () => 'left a comment' },
  'readiness.assessed':   { icon: Star,            color: 'text-yellow-500 bg-yellow-50',  label: () => 'ran a readiness assessment' },
};

const DEFAULT_META: ActivityMeta = {
  icon: Clock,
  color: 'text-muted-foreground bg-muted',
  label: (a) => a.action.replace('.', ' '),
};

function getActivityMeta(action: string): ActivityMeta {
  return ACTIVITY_META[action] ?? DEFAULT_META;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── API call ─────────────────────────────────────────────────────────────────

async function getActivityLog(
  workspaceId: string,
  limit = 30,
): Promise<BuilderActivityLog[]> {
  const result = await apiRequest<{ activities: BuilderActivityLog[] }>(
    `/api/builder/workspaces/${workspaceId}/activity?limit=${limit}`,
  );
  return result.activities;
}

// ── ActivityTimeline component ───────────────────────────────────────────────

interface ActivityTimelineProps {
  workspaceId: string;
  limit?: number;
  compact?: boolean;
  className?: string;
}

export function ActivityTimeline({
  workspaceId,
  limit = 20,
  compact = false,
  className,
}: ActivityTimelineProps) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['activityLog', workspaceId, limit],
    queryFn: () => getActivityLog(workspaceId, limit),
    refetchInterval: 60_000,
    enabled: !!workspaceId,
  });

  const activities: BuilderActivityLog[] = data ?? [];

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <History className="icon-xl mx-auto mb-2 opacity-30" aria-hidden="true" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {/* Refresh button */}
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[13px] top-0 bottom-0 w-px bg-border/60" />

        <div className="space-y-0">
          {activities.map((activity, idx) => {
            const meta = getActivityMeta(activity.action);
            const Icon = meta.icon;
            const isLast = idx === activities.length - 1;

            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-3 relative pl-1',
                  !isLast && 'pb-4',
                )}
              >
                {/* Icon bubble */}
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 relative border-2 border-background',
                    meta.color,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {compact ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {activity.user && (
                        <span className="font-medium text-foreground">
                          {activity.user.displayName}&nbsp;
                        </span>
                      )}
                      {meta.label(activity)}
                      <span className="text-muted-foreground/60 ml-1.5">{timeAgo(activity.createdAt)}</span>
                    </p>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {activity.user && (
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={activity.user.avatarUrl} />
                              <AvatarFallback className="text-2xs">
                                {(activity.user.displayName ?? 'U').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <p className="text-sm text-foreground leading-snug">
                            {activity.user && (
                              <span className="font-medium">{activity.user.displayName}&nbsp;</span>
                            )}
                            <span className="text-muted-foreground">{meta.label(activity)}</span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
                          {timeAgo(activity.createdAt)}
                        </span>
                      </div>

                      {activity.entityType && (
                        <Badge
                          variant="secondary"
                          className="text-2xs h-4 px-1.5 mt-1.5 capitalize"
                        >
                          {activity.entityType}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
