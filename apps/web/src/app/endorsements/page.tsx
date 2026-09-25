'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  getMeProfile,
  getEndorsementsForUser,
  getEndorsementStats,
  approveEndorsement,
  declineEndorsement,
  listConnectionRequests,
  type EndorsementItem,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { BilingualText } from '@/components/common/BilingualText';
import { MessageButton } from '@/components/common/PersonActions';
import { bilingualInline } from '@/lib/i18n/format';
import { GiveEndorsementDialog } from '@/components/endorsements/GiveEndorsementDialog';
import {
  Handshake, Plus, Star, CheckCircle2, Clock, MessageSquare,
  User, ChevronRight, Award, TrendingUp, BadgeCheck, Quote,
  ThumbsUp, ThumbsDown, Send, Search, Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn, initialsOf } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type Endorsement = {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  fromUserRole?: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  skill?: string;
  content: string;
  relationship?: string;
  isApproved: boolean;
  createdAt: string;
};

type SkillEndorsement = {
  skill: string;
  count: number;
  endorsers: { name: string; avatar?: string }[];
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const RECEIVED: Endorsement[] = [
  {
    id: '1', fromUserId: 'u1', fromUserName: 'Sarah Chen', fromUserRole: 'Angel Investor & Product Advisor',
    toUserId: 'me', toUserName: 'Me',
    skill: 'Product Strategy',
    content: 'Exceptional product thinking and ability to translate complex problems into elegant solutions. One of the sharpest product minds I\'ve worked with. Highly recommend working with them.',
    relationship: 'Investor', isApproved: true, createdAt: 'Jan 15, 2025',
  },
  {
    id: '2', fromUserId: 'u2', fromUserName: 'Michael Torres', fromUserRole: 'CTO at HorizonTech',
    toUserId: 'me', toUserName: 'Me',
    skill: 'Technical Leadership',
    content: 'An outstanding technical leader who seamlessly bridges business and engineering. Consistently delivers on commitments and elevates the entire team.',
    relationship: 'Co-founder', isApproved: false, createdAt: 'Jan 20, 2025',
  },
  {
    id: '3', fromUserId: 'u3', fromUserName: 'Emma Williams', fromUserRole: 'Ex-Stripe, Fintech Angel',
    toUserId: 'me', toUserName: 'Me',
    skill: 'Fundraising',
    content: 'Incredibly well-prepared founder. Knows their numbers inside and out, tells a compelling story, and treats investor relationships with the care they deserve.',
    relationship: 'Investor', isApproved: true, createdAt: 'Jan 5, 2025',
  },
  {
    id: '4', fromUserId: 'u4', fromUserName: 'Andreas Papadopoulos', fromUserRole: 'Partner at Athena Ventures',
    toUserId: 'me', toUserName: 'Me',
    skill: 'Team Building',
    content: 'Built an A-team in a challenging market. The team culture they\'ve created is rare. This founder knows how to attract and retain top talent.',
    relationship: 'Investor', isApproved: false, createdAt: 'Dec 28, 2024',
  },
];

const GIVEN: Endorsement[] = [
  {
    id: '5', fromUserId: 'me', fromUserName: 'Me',
    toUserId: 'u5', toUserName: 'Sofia Papadaki', toUserAvatar: undefined,
    skill: 'Growth Marketing',
    content: 'Sofia has an incredible ability to identify growth opportunities and execute on them rapidly. She helped us 3x our user base in 4 months with scrappy, high-ROI campaigns.',
    relationship: 'Service Provider', isApproved: true, createdAt: 'Dec 10, 2024',
  },
  {
    id: '6', fromUserId: 'me', fromUserName: 'Me',
    toUserId: 'u6', toUserName: 'Nikos Andreou', toUserAvatar: undefined,
    skill: 'UI/UX Design',
    content: 'Nikos transformed our product\'s visual identity and UX. His design systems thinking saved us months of rework. An absolute professional.',
    relationship: 'Service Provider', isApproved: true, createdAt: 'Nov 18, 2024',
  },
];

const MY_SKILLS: SkillEndorsement[] = [
  { skill: 'Product Strategy', count: 8, endorsers: [{ name: 'Sarah Chen' }, { name: 'Michael T.' }, { name: 'Emma W.' }] },
  { skill: 'Technical Leadership', count: 6, endorsers: [{ name: 'Michael Torres' }, { name: 'Andreas P.' }] },
  { skill: 'Fundraising', count: 5, endorsers: [{ name: 'Emma Williams' }, { name: 'Sarah C.' }] },
  { skill: 'Team Building', count: 4, endorsers: [{ name: 'Andreas P.' }] },
  { skill: 'Go-to-Market', count: 3, endorsers: [{ name: 'Sofia P.' }] },
  { skill: 'Pitch & Storytelling', count: 3, endorsers: [{ name: 'Emma W.' }] },
];

// ── Endorsement Card ───────────────────────────────────────────────────────────

function EndorsementCard({
  endorsement,
  type,
  onApprove,
  onDecline,
}: {
  endorsement: Endorsement;
  type: 'received' | 'given';
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
}) {
  const user = type === 'received'
    ? { name: endorsement.fromUserName, avatar: endorsement.fromUserAvatar, role: endorsement.fromUserRole, id: endorsement.fromUserId }
    : { name: endorsement.toUserName, avatar: endorsement.toUserAvatar, id: endorsement.toUserId };
  const initials = initialsOf(user.name);

  return (
    <Card className={cn(
      'transition-all hover:border-primary/20',
      // Waiting on the reader: a warning edge, not an amber-filled card.
      !endorsement.isApproved && type === 'received' && 'border-l-2 border-l-status-warning',
    )}>
      <CardContent className="p-5">
        {/* Quote icon + pending badge */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
            <Link href={`/p/${user.id}`}>
              <Avatar className="h-11 w-11 rounded-lg">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <Link href={`/p/${user.id}`} className="font-semibold text-sm hover:text-primary-accessible transition-colors">
                {user.name}
              </Link>
              {user.role && <p className="text-xs text-muted-foreground">{user.role}</p>}
              {endorsement.relationship && <p className="text-xs text-muted-foreground">Relationship: {endorsement.relationship}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {endorsement.skill && (
              <Badge variant="secondary" className="text-xs">{endorsement.skill}</Badge>
            )}
            {!endorsement.isApproved && type === 'received' && (
              <Badge variant="outline" className="text-xs bg-status-warning-bg text-status-warning border-status-warning-border">
                <Clock className="icon-sm mr-1" />Pending
              </Badge>
            )}
            {endorsement.isApproved && <BadgeCheck className="icon-sm text-status-info" />}
          </div>
        </div>

        {/* Quote */}
        <div className="relative pl-4 border-l-2 border-primary/30">
          <Quote className="absolute -top-1 -left-0.5 icon-sm text-primary-emphasis/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground leading-relaxed italic">{endorsement.content}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <span className="text-xs text-muted-foreground">{endorsement.createdAt}</span>
          {!endorsement.isApproved && type === 'received' && (
            <div className="flex gap-2">
              <Button size="sm" className="gap-1" onClick={() => onApprove?.(endorsement.id)}>
                <ThumbsUp className="icon-sm" aria-hidden="true" />Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onDecline?.(endorsement.id)}>
                <ThumbsDown className="icon-sm" aria-hidden="true" />Decline
              </Button>
            </div>
          )}
          {/* "Reply" had no handler and endorsements have no reply endpoint —
              but replying to someone who endorsed you is opening a thread with
              them, and their id is right here. */}
          {(endorsement.isApproved || type === 'given') && (
            <MessageButton userId={user.id} displayName={user.name} variant="ghost" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skills Grid ────────────────────────────────────────────────────────────────

function SkillsGrid({ skills }: { skills: SkillEndorsement[] }) {
  const maxCount = Math.max(...skills.map(s => s.count));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Award className="icon-sm text-primary-accessible" />My Endorsed Skills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.map(s => (
          <div key={s.skill} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{s.skill}</span>
                <div className="flex -space-x-1">
                  {s.endorsers.slice(0, 3).map((e, i) => (
                    <Avatar key={i} className="h-5 w-5 rounded-full border border-background">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary-accessible">{e.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
              <span className="text-xs font-semibold text-primary-accessible">{s.count}</span>
            </div>
            <Progress value={(s.count / maxCount) * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Request Panel ──────────────────────────────────────────────────────────────

const DEMO_CONNECTIONS = [
  { id: 'c1', name: 'Sarah Chen', role: 'Investor', endorsed: true },
  { id: 'c2', name: 'Michael Torres', role: 'CTO', endorsed: false },
  { id: 'c3', name: 'Emma Williams', role: 'Angel', endorsed: false },
  { id: 'c4', name: 'Sofia Papadaki', role: 'Growth Marketer', endorsed: false },
];

function RequestPanel({ meId, endorsedIds }: { meId?: string; endorsedIds: Set<string> }) {
  const [search, setSearch] = useState('');

  // The panel listed four hardcoded names with ids that belong to nobody, so
  // "Request" could not have reached a person even with a handler. These are
  // the reader's own accepted connections; the demo names stay as the fallback
  // for a session that has none.
  const { data: accepted } = useQuery({
    queryKey: ['connections', 'accepted', 'for-endorsements'],
    queryFn: () => listConnectionRequests({ type: 'accepted', limit: 50 }),
    enabled: !!meId,
    staleTime: 5 * 60_000,
  });

  const real = (accepted?.connections ?? []).map((c) => {
    const other = c.requesterId === meId ? c.receiver : c.requester;
    return {
      id: other?.id ?? c.id,
      name: other?.displayName ?? '',
      role: other?.role ?? '',
      endorsed: endorsedIds.has(other?.id ?? ''),
      real: true as const,
    };
  }).filter((c) => c.name);

  const CONNECTIONS = real.length ? real : DEMO_CONNECTIONS.map((c) => ({ ...c, real: false as const }));
  const filtered = CONNECTIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Send className="icon-sm text-primary-accessible" />Request Endorsements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input placeholder="Search connections..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible text-xs font-bold">{c.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
              </div>
              {c.endorsed ? (
                <Badge variant="secondary" size="sm">
                  <CheckCircle2 className="icon-sm mr-1" />
                  <BilingualText en="Endorsed" el="Έδωσε σύσταση" compact />
                </Badge>
              ) : c.real ? (
                /* Asking for an endorsement is a message, and there is no
                   endpoint for anything else. The thread is the request. */
                <MessageButton userId={c.id} displayName={c.name} variant="outline" />
              ) : (
                /* A demo name has no thread to open; the control says so
                   rather than looking available. */
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  title={bilingualInline('Sample connection', 'Ενδεικτική επαφή')}
                >
                  <BilingualText en="Request" el="Αίτημα" compact />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function mapApiItem(item: EndorsementItem): Endorsement {
  return {
    id: item.id,
    fromUserId: item.fromUserId,
    fromUserName: item.fromUser.displayName,
    fromUserAvatar: item.fromUser?.avatarUrl ?? undefined,
    fromUserRole: item.fromUser?.headline ?? undefined,
    toUserId: item.toUserId,
    toUserName: 'Me',
    skill: item.skill ?? undefined,
    content: item.content,
    relationship: item.relationship ?? undefined,
    isApproved: item.isApproved,
    createdAt: new Date(item.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

export default function EndorsementsPage() {
  // The two "give" buttons had no dialog to open, so the page could show,
  // approve and decline endorsements but never produce one.
  const [giving, setGiving] = useState(false);
  const { showDemoData } = useDemoData();
  const qc = useQueryClient();

  // Demo-mode local state
  const [demoReceived, setDemoReceived] = useState(RECEIVED);

  // Real API: current user
  const { data: meData } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    staleTime: 300_000,
    enabled: !showDemoData,
  });
  const meId = meData?.profile?.userId;

  // Real API: received endorsements
  const { data: receivedData } = useQuery({
    queryKey: ['endorsements', 'received', meId],
    queryFn: () => getEndorsementsForUser(meId!, { includeUnapproved: true }),
    enabled: !showDemoData && !!meId,
    staleTime: 60_000,
  });

  // Real API: stats
  const { data: statsData } = useQuery({
    queryKey: ['endorsements', 'stats'],
    queryFn: getEndorsementStats,
    enabled: !showDemoData,
    staleTime: 60_000,
  });

  // Computed data
  const received: Endorsement[] = showDemoData
    ? demoReceived
    : (receivedData?.endorsements?.map(mapApiItem) ?? []);
  const given: Endorsement[] = showDemoData ? GIVEN : [];
  // Whoever has already written one is shown as such rather than asked again.
  const endorsedIds = useMemo(
    () => new Set(received.map((e) => e.fromUserId).filter(Boolean)),
    [received],
  );

  const mySkills: SkillEndorsement[] = showDemoData
    ? MY_SKILLS
    : (() => {
        const skillMap = new Map<string, { count: number; endorsers: { name: string }[] }>();
        for (const e of received.filter(r => r.isApproved)) {
          if (!e.skill) continue;
          const entry = skillMap.get(e.skill) ?? { count: 0, endorsers: [] };
          entry.count++;
          entry.endorsers.push({ name: e.fromUserName });
          skillMap.set(e.skill, entry);
        }
        return Array.from(skillMap.entries())
          .map(([skill, data]) => ({ skill, ...data }))
          .sort((a, b) => b.count - a.count);
      })();

  const pendingCount = !showDemoData
    ? (statsData?.stats?.pending ?? received.filter(e => !e.isApproved).length)
    : received.filter(e => !e.isApproved).length;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: approveEndorsement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['endorsements'] }),
  });
  const declineMutation = useMutation({
    mutationFn: declineEndorsement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['endorsements'] }),
  });

  const handleApprove = (id: string) => {
    if (showDemoData) {
      setDemoReceived(prev => prev.map(e => e.id === id ? { ...e, isApproved: true } : e));
    } else {
      approveMutation.mutate(id);
    }
  };
  const handleDecline = (id: string) => {
    if (showDemoData) {
      setDemoReceived(prev => prev.filter(e => e.id !== id));
    } else {
      declineMutation.mutate(id);
    }
  };

  return (
    <AppShell title="Endorsements" description="Build credibility through peer endorsements and skill validation">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        {/* Left: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Star, label: 'Received', value: !showDemoData ? (statsData?.stats?.total ?? received.length) : received.length, color: 'text-primary-accessible' },
              { icon: Handshake, label: 'Given', value: !showDemoData ? (statsData?.stats?.given ?? given.length) : GIVEN.length, color: 'text-status-success' },
              { icon: Clock, label: 'Pending', value: pendingCount, color: 'text-status-warning' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="rounded-lg bg-secondary p-1.5 shrink-0">
                    <s.icon className={cn('icon-sm', s.color)} />
                  </div>
                  <div>
                    <p className="font-bold tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="received">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="received" className="gap-1.5">
                  Received
                  {pendingCount > 0 && <Badge variant="secondary" size="sm" className="px-1.5">{pendingCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="given">Given ({given.length})</TabsTrigger>
              </TabsList>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setGiving(true)}>
                <Plus className="icon-sm" />
                <BilingualText en="Give Endorsement" el="Δώστε σύσταση" compact />
              </Button>
            </div>

            <TabsContent value="received" className="space-y-3 mt-4">
              {pendingCount > 0 && (
                <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-3 text-sm text-status-warning ">
                  <strong>{pendingCount} pending endorsement{pendingCount > 1 ? 's' : ''}</strong> awaiting your approval
                </div>
              )}
              {received.map(e => (
                <EndorsementCard key={e.id} endorsement={e} type="received" onApprove={handleApprove} onDecline={handleDecline} />
              ))}
              {received.length === 0 && (
                <Card><CardContent className="py-12 text-center">
                  <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
                  <p className="font-medium">No endorsements received yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Ask connections to endorse your skills</p>
                </CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="given" className="space-y-3 mt-4">
              {given.map(e => <EndorsementCard key={e.id} endorsement={e} type="given" />)}
              {given.length === 0 && (
                <Card><CardContent className="py-12 text-center">
                  <Handshake className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
                  <p className="font-medium">No endorsements given yet</p>
                  <Button size="sm" className="mt-4" onClick={() => setGiving(true)}>
                    <Plus className="icon-sm mr-1.5" />
                    <BilingualText en="Give First Endorsement" el="Δώστε την πρώτη σύσταση" compact />
                  </Button>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          <SkillsGrid skills={mySkills} />
          <RequestPanel meId={meId} endorsedIds={endorsedIds} />
        </div>
      </div>

      <GiveEndorsementDialog open={giving} onOpenChange={setGiving} />
    </AppShell>
  );
}
