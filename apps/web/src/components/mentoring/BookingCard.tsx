'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
  Video,
  XCircle,
} from 'lucide-react';
import { summarizeMeetingNotes, type MeetingNotesSummary, type MentorBookingItem } from '@/lib/api';
import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { bilingualInline } from '@/lib/i18n/format';
import { cn, initialsOf } from '@/lib/utils';
import { LocalTime } from '@/components/common/LocalTime';

export const MEETING_TYPE_LABEL: Record<string, { en: string; el: string }> = {
  video: { en: 'Video call', el: 'Βιντεοκλήση' },
  chat: { en: 'Chat', el: 'Συνομιλία' },
  in_person: { en: 'In person', el: 'Δια ζώσης' },
};

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  confirmed: 'bg-status-success-bg text-status-success border-status-success-border',
  completed: 'bg-primary/15 text-primary-accessible border-primary/30',
  cancelled: 'bg-destructive/15 text-destructive-accessible border-destructive/30',
  declined: 'bg-muted text-muted-foreground border-border',
};

export function BookingCard({
  booking,
  userId,
  onConfirm,
  onDecline,
  onCancel,
  isActing,
  showSource = false,
}: {
  booking: MentorBookingItem;
  userId: string | null;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
  isActing: boolean;
  /** Merged lists tag each row with the store it came from. */
  showSource?: boolean;
}) {
  const isMentor = booking.mentorId === userId;
  const other = isMentor ? booking.mentee : booking.mentor;
  const otherUserId = isMentor ? booking.menteeId : booking.mentorId;
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const isPast = end < new Date();

  const [showNotes, setShowNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [aiSummary, setAISummary] = useState<MeetingNotesSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const { success: _ns, error: notifyError } = useToast();

  const handleSummarize = async () => {
    if (!sessionNotes.trim()) return;
    setSummarizing(true);
    try {
      const { summary } = await summarizeMeetingNotes(sessionNotes);
      setAISummary(summary);
    } catch {
      notifyError(bilingualInline('AI unavailable', 'Η τεχνητή νοημοσύνη δεν είναι διαθέσιμη'), bilingualInline('Could not generate a summary right now.', 'Δεν ήταν δυνατή η δημιουργία περίληψης αυτή τη στιγμή.'));
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <Card className="card-interactive">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Link href={`/profiles/${otherUserId}`} aria-label={bilingualInline(`Open ${other.displayName}'s profile`, `Άνοιγμα προφίλ: ${other.displayName}`)}>
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={other.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold">
                {initialsOf(other.displayName)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link
                href={`/profiles/${otherUserId}`}
                className="inline-flex tap-target-y items-center font-semibold text-foreground transition-colors hover:text-primary-accessible"
              >
                {other.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">
                {isMentor
                  ? <BilingualText en="(mentee)" el="(μαθητευόμενος)" compact />
                  : <BilingualText en="(mentor)" el="(μέντορας)" compact />}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs', STATUS_COLORS[booking.status] ?? '')}
              >
                <StatusText value={booking.status} />
              </Badge>
              {showSource && (
                <Badge variant="secondary" className="text-2xs">
                  <BilingualText en="Booking" el="Κράτηση" compact />
                </Badge>
              )}
            </div>

            {isMentor && booking.status === 'requested' && (
              <p className="mt-1 text-xs font-medium text-status-warning">
                <BilingualText en="Awaiting your confirmation" el="Περιμένει την επιβεβαίωσή σας" compact />
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {start.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="icon-sm" />
                <LocalTime value={start} />
                {' – '}
                <LocalTime value={end} />
              </span>
              <span className="flex items-center gap-1">
                <Video className="icon-sm" aria-hidden="true" />
                {MEETING_TYPE_LABEL[booking.meetingType]
                  ? <BilingualText en={MEETING_TYPE_LABEL[booking.meetingType].en} el={MEETING_TYPE_LABEL[booking.meetingType].el} compact />
                  : booking.meetingType}
              </span>
            </div>

            {booking.notes && (
              <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                &ldquo;{booking.notes}&rdquo;
              </p>
            )}

            {isPast && (booking.status === 'completed' || booking.status === 'confirmed') && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  aria-expanded={showNotes}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-accessible hover:text-primary/80 transition-colors"
                >
                  <FileText className="icon-sm" aria-hidden="true" />
                  <BilingualText en="Session notes & AI summary" el="Σημειώσεις συνεδρίας & περίληψη AI" compact />
                  {showNotes ? <ChevronUp className="icon-sm" aria-hidden="true" /> : <ChevronDown className="icon-sm" aria-hidden="true" />}
                </button>
                {showNotes && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      placeholder={bilingualInline('Add your session notes, key points, decisions…', 'Προσθέστε σημειώσεις, βασικά σημεία, αποφάσεις…')}
                      aria-label={bilingualInline('Session notes', 'Σημειώσεις συνεδρίας')}
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-primary-accessible border-primary/30 hover:bg-primary/5"
                      onClick={handleSummarize}
                      disabled={summarizing || !sessionNotes.trim()}
                    >
                      {summarizing ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Sparkles className="icon-sm" aria-hidden="true" />}
                      {summarizing
                        ? <BilingualText en="Summarising…" el="Δημιουργία περίληψης…" compact />
                        : <BilingualText en="Summarise with AI" el="Περίληψη με AI" compact />}
                    </Button>
                    {aiSummary && (
                      <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="icon-sm text-primary-accessible" />
                          <span className="text-xs font-semibold text-primary-accessible"><BilingualText en="AI summary" el="Περίληψη AI" compact /></span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{aiSummary.summary}</p>
                        {aiSummary.actionItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1"><BilingualText en="Action items" el="Ενέργειες" compact /></p>
                            <ul className="space-y-0.5">
                              {aiSummary.actionItems.map((item, i) => (
                                <li key={i} className="flex items-start gap-1 text-xs text-foreground">
                                  <CheckCircle className="icon-sm text-primary-accessible mt-0.5 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSummary.followUps.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1"><BilingualText en="Follow-ups" el="Επόμενα βήματα" compact /></p>
                            <ul className="space-y-0.5">
                              {aiSummary.followUps.map((f, i) => (
                                <li key={i} className="text-xs text-muted-foreground">• {f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {booking.meetingUrl && booking.status === 'confirmed' && (
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary-accessible hover:underline"
              >
                <ExternalLink className="icon-sm" aria-hidden="true" />
                <BilingualText en="Join meeting" el="Συμμετοχή στη συνάντηση" compact />
              </a>
            )}
          </div>

          {!isPast && (
            <div className="flex shrink-0 gap-2">
              {isMentor && booking.status === 'requested' && (
                <>
                  <Button size="sm" className="gap-1" onClick={onConfirm} disabled={isActing}>
                    {isActing ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <CheckCircle className="icon-sm" aria-hidden="true" />}
                    <BilingualText en="Confirm" el="Επιβεβαίωση" compact />
                  </Button>
                  <Button aria-label={bilingualInline('Decline', 'Απόρριψη')} size="sm" variant="ghost" onClick={onDecline} disabled={isActing}
                    className="text-muted-foreground hover:text-destructive-accessible">
                    <XCircle className="icon-sm" aria-hidden="true" />
                  </Button>
                </>
              )}
              {!isMentor && booking.status === 'requested' && (
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isActing}
                  className="text-muted-foreground hover:text-destructive-accessible">
                  <BilingualText en="Cancel request" el="Ακύρωση αιτήματος" compact />
                </Button>
              )}
              {booking.status === 'confirmed' && (
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isActing}
                  className="text-muted-foreground hover:text-destructive-accessible">
                  <BilingualText en="Cancel session" el="Ακύρωση συνεδρίας" compact />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
