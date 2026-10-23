'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, initialsOf } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { formatDate } from '@/lib/i18n/format';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/toast';
import { qk } from '@/lib/query-keys';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import {
  getMyReceivedMentorRequests,
  respondToMentorRequest,
  type MentorRequestItem,
} from '@/lib/api';
import { FactLine } from '@/components/common/FactLine';
import { CardHead, CardFoot } from '@/components/common/CardAnatomy';
import { StatusText } from '@/components/common/StatusText';
import { Counter } from '@/components/ui/counter';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { FailedLine } from '@/components/dashboard/SectionCard';

type RequestCardProps = {
  request: MentorRequestItem;
  onAccept?: () => void;
  onDecline?: () => void;
  isResponding?: boolean;
};

const STATUS_LABEL: Record<string, { en: string; el: string }> = {
  pending: { en: 'Pending', el: 'Σε αναμονή' },
  accepted: { en: 'Accepted', el: 'Αποδεκτό' },
  declined: { en: 'Declined', el: 'Απορρίφθηκε' },
};

function RequestCard({ request, onAccept, onDecline, isResponding }: RequestCardProps) {
  const displayName = request.requester?.displayName || '\u2014';
  const initials = initialsOf(displayName);

  const statusColors: Record<string, string> = {
    pending: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    accepted: 'bg-status-success-bg text-status-success border-status-success-border',
    declined: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  };

  const formattedDate = formatDate(request.createdAt, 'en', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedDateEl = formatDate(request.createdAt, 'el', { day: 'numeric', month: 'short', year: 'numeric' });
  const statusLabel = STATUS_LABEL[request.status];

  return (
    <Card className={cn(
      'transition-all hover:border-primary/20',
      // Waiting on the reader: a warning edge, as on Endorsements.
      request.status === 'pending' && 'border-l-2 border-l-status-warning'
    )}>
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Link href={`/profiles/${request.requesterId}`} aria-label={`${displayName}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.requester?.avatarUrl || undefined} alt="" />
                <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          title={(
            <PersonHovercard userId={request.requesterId}><Link href={`/profiles/${request.requesterId}`} className="hover:text-primary-accessible transition-colors">{displayName}</Link></PersonHovercard>
          )}
          subtitle={request.requester?.headline ? <span className="line-clamp-1">{request.requester.headline}</span> : undefined}
          aside={(
            <Badge variant="outline" className={cn('text-xs', statusColors[request.status])}>
              {request.status === 'pending' && <Clock className="icon-sm mr-1" aria-hidden="true" />}
              {request.status === 'accepted' && <CheckCircle2 className="icon-sm mr-1" aria-hidden="true" />}
              {request.status === 'declined' && <XCircle className="icon-sm mr-1" aria-hidden="true" />}
              {statusLabel ? <BilingualText en={statusLabel.en} el={statusLabel.el} compact /> : <StatusText value={request.status} />}
            </Badge>
          )}
        />

        {/* The message and the focus areas start on the avatar's edge. */}
        {request.message ? (
          <p className="card-body line-clamp-2 text-muted-foreground">
            &ldquo;{request.message}&rdquo;
          </p>
        ) : null}

        <FactLine items={request.focusAreas ?? []} />

        {/* Wraps: at 390px the date and three buttons were 15px wider
            than the card, and the page scrolled sideways. */}
        <CardFoot meta={<BilingualText en={formattedDate} el={formattedDateEl} compact />}>
          {request.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={onAccept}
                disabled={isResponding}
              >
                {isResponding ? (
                  <Loader2 className="icon-sm mr-1 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="icon-sm mr-1" aria-hidden="true" />
                )}
                <BilingualText en="Accept" el="Αποδοχή" compact />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDecline}
                disabled={isResponding}
              >
                <BilingualText en="Decline" el="Απόρριψη" compact />
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/messages?to=${request.requesterId}`}>
                  <MessageCircle className="icon-sm mr-1" aria-hidden="true" />
                  <BilingualText en="Message" el="Μήνυμα" compact />
                </Link>
              </Button>
            </>
          )}
          {request.status === 'accepted' && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/mentor/sessions?new=1&mentee=${request.requesterId}`}>
                <Calendar className="icon-sm mr-1" aria-hidden="true" />
                <BilingualText en="Schedule a session" el="Προγραμματισμός συνεδρίας" compact />
              </Link>
            </Button>
          )}
        </CardFoot>
      </CardContent>
    </Card>
  );
}

export default function MentorRequestsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { hasSession, mounted } = useSession();
  const queryClient = useQueryClient();
  const { error: toastError } = useToast();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: qk('mentorships', 'requests-received'),
    queryFn: getMyReceivedMentorRequests,
    enabled: hasSession && mounted,
  });

  const respondMutation = useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondToMentorRequest(requestId, { accept }),
    onMutate: ({ requestId }) => {
      setRespondingId(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk('mentorships', 'requests-received') });
      queryClient.invalidateQueries({ queryKey: qk('mentorships') });
    },
    // A failed answer used to vanish: the buttons came back and nothing said
    // the request was still waiting.
    onError: (e: unknown) => toastError('Could not answer the request', e instanceof Error ? e.message : undefined),
    onSettled: () => {
      setRespondingId(null);
    },
  });

  const requests = data?.requests || [];
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const declinedRequests = requests.filter((r) => r.status === 'declined');

  // Offered to the assistant, above the loading and error returns: the tab
  // and Accept / Decline on a pending request - the card's own mutation.
  const byRequester = (list: typeof requests) => rowOptions(list, (r) => r.id, (r) => r.requester?.displayName || 'Request');
  usePageList([
    {
      id: 'requests',
      labelEn: 'Mentorship requests',
      labelEl: 'Αιτήματα καθοδήγησης',
      rows: isLoading ? undefined : requests.map((r) => `${r.requester?.displayName || 'Unknown'}${r.requester?.headline ? ` · ${r.requester.headline}` : ''} · ${r.status}${r.focusAreas?.length ? ` · ${r.focusAreas.join(', ')}` : ''}`),
    },
  ]);
  usePageControls([
    choiceControl('request_tab', 'Request filter', 'Φίλτρο αιτημάτων', [
      { value: 'pending', en: 'Pending', el: 'Σε αναμονή' },
      { value: 'accepted', en: 'Accepted', el: 'Αποδεκτά' },
      { value: 'declined', en: 'Declined', el: 'Απορριφθέντα' },
    ], activeTab, setActiveTab),
    { id: 'accept_request', labelEn: 'Accept mentorship request', labelEl: 'Αποδοχή αιτήματος καθοδήγησης', writes: true, options: byRequester(pendingRequests), unavailableEn: pendingRequests.length ? undefined : 'No request is waiting.', unavailableEl: pendingRequests.length ? undefined : 'Κανένα αίτημα δεν περιμένει.', run: async (v) => { if (v) await respondMutation.mutateAsync({ requestId: v, accept: true }); } },
    { id: 'decline_request', labelEn: 'Decline mentorship request', labelEl: 'Απόρριψη αιτήματος καθοδήγησης', writes: true, options: byRequester(pendingRequests), unavailableEn: pendingRequests.length ? undefined : 'No request is waiting.', unavailableEl: pendingRequests.length ? undefined : 'Κανένα αίτημα δεν περιμένει.', run: async (v) => { if (v) await respondMutation.mutateAsync({ requestId: v, accept: false }); } },
  ]);

  if (!mounted) {
    return (
      <AppShell showHelp>
        <div className="py-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  // The transport's own English ("Unable to reach the API server") under a
  // heading; it says what was not read, in both languages.
  if (error && !data) {
    return (
      <AppShell showHelp>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FailedLine en="Your requests could not be read just now." el="Τα αιτήματά σας δεν διαβάστηκαν αυτή τη στιγμή." busy={isFetching} onRetry={() => void refetch()} />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHelp
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('icon-sm mr-2', isLoading && 'animate-spin')} aria-hidden="true" />
            <BilingualText en="Refresh" el="Ανανέωση" compact />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Three tiles repeated the three tabs below, the first one with the
            tab's own counter; each tab carries its count now (docs §94). */}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <BilingualText en="Pending" el="Σε αναμονή" compact />
              {pendingRequests.length > 0 && (
                <Counter value={pendingRequests.length} />
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2"><BilingualText en="Accepted" el="Αποδεκτά" compact />{acceptedRequests.length > 0 && <Counter value={acceptedRequests.length} />}</TabsTrigger>
            <TabsTrigger value="declined" className="gap-2"><BilingualText en="Declined" el="Απορριφθέντα" compact />{declinedRequests.length > 0 && <Counter value={declinedRequests.length} />}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="icon-xl animate-spin text-muted-foreground" />
              </div>
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request}
                  onAccept={() => respondMutation.mutate({ requestId: request.id, accept: true })}
                  onDecline={() => respondMutation.mutate({ requestId: request.id, accept: false })}
                  isResponding={respondingId === request.id}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium"><BilingualText en="No pending requests" el="Δεν υπάρχουν αιτήματα σε αναμονή" /></h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <BilingualText en="New mentorship requests will appear here." el="Τα νέα αιτήματα καθοδήγησης θα εμφανίζονται εδώ." wrap />
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="icon-xl animate-spin text-muted-foreground" />
              </div>
            ) : acceptedRequests.length > 0 ? (
              acceptedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium"><BilingualText en="No accepted requests" el="Δεν υπάρχουν αποδεκτά αιτήματα" /></h3>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="declined" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="icon-xl animate-spin text-muted-foreground" />
              </div>
            ) : declinedRequests.length > 0 ? (
              declinedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium"><BilingualText en="No declined requests" el="Δεν υπάρχουν απορριφθέντα αιτήματα" /></h3>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
