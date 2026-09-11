'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Users, Gift, Copy, Check, Send, X, Clock,
  UserCheck, Loader2, Link2, Sparkles, Trophy,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  listInvites,
  getInviteStats,
  createInvite,
  cancelInvite,
  type InviteItem,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<InviteItem['status'], { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  accepted:  { label: 'Accepted',  color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  expired:   { label: 'Expired',   color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  description?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn('', accent && 'border-primary/30 bg-primary/5')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={cn('text-3xl font-bold mt-1', accent ? 'text-primary-emphasis' : 'text-foreground')}>{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-md', accent ? 'bg-primary/15' : 'bg-secondary')}>
            <Icon className={cn('h-4 w-4', accent ? 'text-primary-emphasis' : 'text-muted-foreground')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteRow({ invite, onCancel, cancelling }: {
  invite: InviteItem;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const cfg = STATUS_CONFIG[invite.status];
  return (
    <div className="flex items-center gap-3 border-b border-border/40 py-3 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
        <p className="text-xs text-muted-foreground">
          Sent {new Date(invite.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {invite.acceptedAt && ` · Joined ${new Date(invite.acceptedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </p>
      </div>
      <Badge className={cn('shrink-0 text-xs', cfg.color)}>{cfg.label}</Badge>
      {invite.status === 'pending' && (
        <Button aria-label="Close"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive-emphasis"
          onClick={() => onCancel(invite.id)}
          disabled={cancelling}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default function InvitePage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['invite-stats'],
    queryFn: getInviteStats,
    staleTime: 30_000,
  });

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: () => listInvites({ limit: 50 }),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => createInvite({ email: email.trim(), message: message.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      queryClient.invalidateQueries({ queryKey: ['invite-stats'] });
      success('Invitation sent!', `${email.trim()} will receive an invite to join CoFounderBay.`);
      setEmail('');
      setMessage('');
    },
    onError: (err) => {
      showError('Could not send invite', err instanceof Error ? err.message : 'Please try again');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      queryClient.invalidateQueries({ queryKey: ['invite-stats'] });
      setCancellingId(null);
      success('Invite cancelled', 'The invitation has been revoked.');
    },
    onError: () => {
      setCancellingId(null);
      showError('Could not cancel', 'Please try again');
    },
  });

  const stats = statsData?.stats;
  const invites = invitesData?.invites ?? [];
  const canInvite = (stats?.remaining ?? 1) > 0;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/register?ref=invite`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AppShell
      title="Invite People"
      description="Grow your network by inviting co-founders, mentors, and investors"
    >
      <div className="w-full space-y-6 pb-10">
        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatCard icon={Send} label="Sent" value={stats?.total ?? 0} />
              <StatCard icon={UserCheck} label="Joined" value={stats?.accepted ?? 0} description="Accepted your invite" accent />
              <StatCard icon={Gift} label="Remaining" value={stats?.remaining ?? 0} description="Invites left" />
            </>
          )}
        </div>

        {/* Invite form */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="icon-md text-primary-emphasis" aria-hidden="true" />
              Send an Invitation
            </CardTitle>
            <CardDescription>
              Invite someone to join CoFounderBay and expand your network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canInvite && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                <Trophy className="icon-sm shrink-0 text-amber-500" aria-hidden="true" />
                <p className="text-sm text-foreground">
                  You&apos;ve used all your invites for now. They refresh periodically.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address <span className="text-destructive-emphasis">*</span></Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!canInvite}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-message">Personal message (optional)</Label>
              <Textarea
                id="invite-message"
                placeholder="Hey! I've been using CoFounderBay to find collaborators — thought you'd find it useful too…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                disabled={!canInvite}
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                disabled={!email.trim() || !canInvite || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                ) : (
                  <Mail className="icon-sm" aria-hidden="true" />
                )}
                {createMutation.isPending ? 'Sending…' : 'Send Invitation'}
              </Button>

              <Button variant="outline" className="gap-2" onClick={handleCopyLink}>
                {copied ? <Check className="icon-sm text-emerald-500" aria-hidden="true" /> : <Link2 className="icon-sm" aria-hidden="true" />}
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invite history */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="icon-md text-muted-foreground" aria-hidden="true" />
              Invite History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {invitesLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-border/40">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Users className="icon-lg text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-foreground">No invitations yet</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Invite co-founders, mentors, or investors to grow your network.
                </p>
              </div>
            ) : (
              <div>
                {invites.map((inv) => (
                  <InviteRow
                    key={inv.id}
                    invite={inv}
                    onCancel={(id) => {
                      setCancellingId(id);
                      cancelMutation.mutate(id);
                    }}
                    cancelling={cancellingId === inv.id && cancelMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
