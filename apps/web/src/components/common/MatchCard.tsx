'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, X, MessageCircle, Bookmark, TrendingUp, ChevronDown, ChevronUp, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from './RoleBadge';
import { BilingualText } from './BilingualText';
import { cn } from '@/lib/utils';
import { bilingualAria } from '@/lib/i18n/format';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

import { pressableProps } from '@/lib/pressable';
import type { CommitmentStep } from '@cofounderbay/shared';
import { StepChip } from '@/components/commitments/OutcomeChip';
import { FactLine } from '@/components/common/FactLine';
import { matchReasonCopy } from '@/lib/match-reason';
import { splitReasons } from '@/lib/match-explain';
import { matchesEl, matchesEn } from '@/lib/i18n/strings-matches';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { PersonHovercard } from '@/components/common/PersonHovercard';
type MatchReason = {
  type: 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values';
  text: string;
  score: number; // 0-100
};

type ReasonCopy = { en: string; el: string };

/** Where a connection with this person stands; the card's one primary action follows it. */
export type MatchConnection = 'none' | 'sent' | 'received' | 'connected';

export type MatchPrimary = {
  key: 'connect' | 'accept' | 'message';
  Icon: typeof UserPlus;
  en: string;
  el: string;
  /** Names the person too, so a list of "Connect" buttons is not a list of the same name. */
  aria: string;
  onClick: () => void;
};

/**
 * The one primary action for a match, from where the connection stands:
 * Connect to someone new, Accept a request they sent, Message once
 * connected. A request already sent has none (it is said, not offered
 * again). The card, the list row and the preview panel all ask this.
 */
export function matchPrimary(
  state: MatchConnection,
  displayName: string,
  actions: { onConnect?: () => void; onAccept?: () => void; onMessage?: () => void },
): MatchPrimary | null {
  const message = actions.onMessage
    ? { key: 'message' as const, Icon: MessageCircle, en: 'Message', el: 'Μήνυμα', aria: bilingualAria(`Message ${displayName}`, `Μήνυμα προς ${displayName}`), onClick: actions.onMessage }
    : null;
  if (state === 'connected' && message) return message;
  if (state === 'received' && actions.onAccept) {
    return { key: 'accept', Icon: Check, en: 'Accept', el: 'Αποδοχή', aria: bilingualAria(`Accept ${displayName}'s request`, `Αποδοχή αιτήματος από ${displayName}`), onClick: actions.onAccept };
  }
  if (state === 'none' && actions.onConnect) {
    return { key: 'connect', Icon: UserPlus, en: 'Connect', el: 'Σύνδεση', aria: bilingualAria(`Connect with ${displayName}`, `Σύνδεση με ${displayName}`), onClick: actions.onConnect };
  }
  return state === 'sent' ? null : message;
}

type MatchCardProps = {
  id: string;
  userId: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  location?: string | null;
  timezone?: string | null;
  skills: string[];
  /** 0-100, or null when the engine gave none ("No score yet", never a made-up 50). */
  compatibilityScore: number | null;
  matchReasons: MatchReason[];
  /**
   * The reasons as sentences with their facts (`lib/match-explain`), most
   * telling first. When given they replace `matchReasons`, which are only
   * translated.
   */
  reasons?: readonly ReasonCopy[];
  /** Where a connection stands. Without it the card offers Connect, as it always has. */
  connection?: MatchConnection;
  /** Accept the request they sent (`connection` "received"). */
  onAccept?: () => void;
  isBookmarked?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onBookmark?: () => void;
  onBreakdown?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
  /**
   * Where a commitment with this person stands, under the headline, as a
   * link to its board: a sentence when `line` is given (`threadLine`), the
   * step's chip otherwise.
   */
  commitment?: { step: CommitmentStep; href: string; line?: ReasonCopy & { yourTurn?: boolean } } | null;
};

// ── Score tier helpers ────────────────────────────────────────────────────────

type MatchTier = 'excellent' | 'strong' | 'good' | 'potential';

const MATCH_TIER_TONE: Record<MatchTier, StatusTone> = {
  excellent: 'success',
  strong: 'info',
  good: 'warning',
  potential: 'danger',
};

const TIER_STROKE: Record<MatchTier, string> = {
  excellent: 'hsl(var(--status-success-mark))',
  strong: 'hsl(var(--status-info-mark))',
  good: 'hsl(var(--status-warning-mark))',
  potential: 'hsl(var(--status-danger-mark))',
};

function tierGlow(stroke: string) {
  return `color-mix(in srgb, ${stroke} 12%, transparent)`;
}

function getScoreTier(score: number | null) {
  if (score === null) {
    const stroke = 'hsl(var(--border))';
    return { label: null, tier: null, stroke, glow: tierGlow(stroke), colors: STATUS.neutral };
  }
  let tier: MatchTier = 'potential';
  if (score >= 80) tier = 'excellent';
  else if (score >= 65) tier = 'strong';
  else if (score >= 45) tier = 'good';
  const stroke = TIER_STROKE[tier];
  // The page's tier chips name the lowest tier «Δυνητική»; the card said
  // «Χαμηλή» for the same people. One word, from the page's strings.
  const label = { en: matchesEn(`tier_${tier}`), el: matchesEl(`tier_${tier}`) };
  return { label, tier, stroke, glow: tierGlow(stroke), colors: STATUS[MATCH_TIER_TONE[tier]] };
}

// ── Score Badge (top-right) ───────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="text-xs text-muted-foreground">
        <BilingualText en="No score yet" el="Χωρίς βαθμολογία ακόμη" compact />
      </span>
    );
  }
  const { label } = getScoreTier(score);
  const r = 8, cx = 10, cy = 10;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  // One line, the ring in front of its words: the score and the tier read
  // as a state at the head's right (under the headline on a phone), not a
  // 44px dial with the tier hanging alone beneath it.
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-[hsl(var(--ring-gold-ink))]">
      <svg width={20} height={20} viewBox="0 0 20 20" className="shrink-0" aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--ring-gold-track))" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--ring-gold))" strokeWidth={2}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transformOrigin: '10px 10px', transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <span className="tabular-nums">{score}%</span>
      {label ? (
        <span className="min-w-0">
          <BilingualText en={label.en} el={label.el} compact />
        </span>
      ) : null}
    </span>
  );
}

function MatchCardInner({
  id,
  userId,
  displayName,
  headline,
  bio,
  avatarUrl,
  role,
  location,
  timezone,
  skills,
  compatibilityScore,
  matchReasons,
  reasons,
  connection,
  onAccept,
  isBookmarked = false,
  onLike,
  onPass,
  onMessage,
  onBookmark,
  onBreakdown,
  onClick,
  isSelected,
  onSelect,
  className,
  commitment,
}: MatchCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const { stroke, glow, colors } = getScoreTier(compatibilityScore);
  const reasonCopies: ReasonCopy[] = reasons ? [...reasons] : matchReasons.map((reason) => matchReasonCopy(reason.text));
  // Two causes on the card; the rest behind one disclosure that adds them
  // under the two, instead of a toggle that listed the first one again.
  const { face, rest } = splitReasons(reasonCopies);
  const shownReasons = showAllReasons ? reasonCopies : face;

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  // One primary action, from where the connection stands: Connect to a new
  // match, Accept a request they sent, Message once connected. A request
  // already sent is said, not offered again.
  const state: MatchConnection = connection ?? 'none';
  const primary = matchPrimary(state, displayName, { onConnect: onLike, onAccept, onMessage });
  const messageInCluster = Boolean(onMessage) && primary?.key !== 'message';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:border-primary/30',
        isSelected && 'ring-2 ring-primary ring-offset-1',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ '--hover-glow': glow } as React.CSSProperties}
      onClick={(e) => {
        if (onClick && !(e.target as HTMLElement).closest('button, a')) {
          onClick();
        }
      }}
      // A link role keeps the inner action buttons announced (role="button"
      // would flatten them); the label keeps the card's name from becoming
      // its entire text content.
      {...(onClick ? pressableProps({ role: 'link', label: bilingualAria(`Preview ${displayName}`, `Προεπισκόπηση: ${displayName}`) }) : {})}
    >
      {/* Left score-color border strip */}
      <div
        className="absolute left-0 inset-y-0 w-0.5 transition-all duration-200 group-hover:w-1"
        style={{ background: stroke }}
      />

      {/* The Connections card: the person's circle, the name with its role,
          the headline under it, the score at the right of the head; facts,
          the reasons and the foot all start on the avatar's edge. */}
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Link href={`/profiles/${userId}`} aria-label={bilingualAria(`Open ${displayName}'s profile`, `Άνοιγμα προφίλ: ${displayName}`)}>
              <Avatar className="h-10 w-10 border border-border transition-transform group-hover:scale-105">
                <AvatarImage src={avatarUrl || undefined} alt="" />
                <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          title={(
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <PersonHovercard userId={userId}><Link href={`/profiles/${userId}`} className="transition-colors hover:text-primary-accessible">{displayName}</Link></PersonHovercard>
              <RoleBadge role={role} size="sm" />
            </span>
          )}
          subtitle={headline ? <span className="line-clamp-2">{headline}</span> : undefined}
          // Where a commitment stands: a state on the title's edge, under
          // the headline, so the head keeps one thing at its right.
          meta={commitment ? (
            commitment.line ? (
              <Link
                href={commitment.href}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'inline rounded-sm underline-offset-4 hover:underline',
                  commitment.line.yourTurn ? 'font-medium text-primary-accessible' : 'text-muted-foreground',
                )}
              >
                <BilingualText en={commitment.line.en} el={commitment.line.el} compact wrap />
              </Link>
            ) : (
              <Link href={commitment.href} onClick={(e) => e.stopPropagation()} className="inline-flex rounded-full" aria-label={bilingualAria(`Commitment with ${displayName}`, `Δέσμευση με ${displayName}`)}>
                <StepChip step={commitment.step} />
              </Link>
            )
          ) : undefined}
          aside={(
            <>
              {/* Selection checkbox (compare mode): beside the score, never
                  over the avatar. */}
              {onSelect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(); }}
                  className="flex h-10 w-10 items-center justify-center rounded-md"
                  aria-pressed={Boolean(isSelected)}
                  aria-label={bilingualAria(`Select ${displayName}`, `Επιλογή: ${displayName}`)}
                >
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-sm border-2 transition-colors',
                    isSelected ? 'bg-primary border-primary' : 'bg-background/80 border-border hover:border-primary'
                  )}>
                    {isSelected && <Check className="icon-sm text-primary-foreground" />}
                  </span>
                </button>
              )}
              <ScoreBadge score={compatibilityScore} />
            </>
          )}
        />

        {/* Place, time zone and skills: facts on one muted line each. */}
        {(location || timezone || skills.length > 0) && (
          <div className="space-y-1">
            <FactLine items={[location, timezone]} />
            <FactLine items={[...skills.slice(0, 4), skills.length > 4 ? `+${skills.length - 4}` : null]} />
          </div>
        )}

        {/* Why you match: the two most telling causes, with their facts. */}
        {shownReasons.length > 0 && (
          <ul className="space-y-1" aria-label={bilingualAria('Why you match', 'Γιατί ταιριάζετε')}>
            {shownReasons.map((copy, i) => (
              <li key={`${copy.en}-${i}`} className="flex items-start gap-2 text-xs text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: stroke }} aria-hidden="true" />
                <span className="min-w-0 flex-1"><BilingualText en={copy.en} el={copy.el} compact wrap /></span>
              </li>
            ))}
          </ul>
        )}
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAllReasons(!showAllReasons)}
            aria-expanded={showAllReasons}
            // tap-target-y: a 16px-tall disclosure is under the 24px target minimum.
            className={cn('flex tap-target-y items-center gap-1.5 text-xs font-medium transition-colors', colors.text)}
          >
            {showAllReasons
              ? <BilingualText en="Fewer reasons" el="Λιγότεροι λόγοι" compact />
              : <BilingualText en={`All reasons (${reasonCopies.length})`} el={`Όλοι οι λόγοι (${reasonCopies.length})`} compact />}
            {showAllReasons ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
          </button>
        )}

        {/* Foot: the quick answers at the left, the next steps at the right. */}
        <CardFoot
          meta={(onPass || messageInCluster || onBookmark) ? (
            <div className="flex items-center gap-1.5">
              {onPass && (
                <button
                  onClick={onPass}
                  aria-label={bilingualAria(`Pass on ${displayName}`, `Παράλειψη: ${displayName}`)}
                  title={bilingualAria(`Pass on ${displayName}`, `Παράλειψη: ${displayName}`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive-accessible"
                >
                  <X className="icon-sm" />
                </button>
              )}
              {messageInCluster && (
                <button
                  onClick={onMessage}
                  aria-label={bilingualAria(`Message ${displayName}`, `Μήνυμα προς ${displayName}`)}
                  title={bilingualAria(`Message ${displayName}`, `Μήνυμα προς ${displayName}`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-accessible"
                >
                  <MessageCircle className="icon-sm" />
                </button>
              )}
              {onBookmark && (
                <button
                  onClick={handleBookmark}
                  aria-pressed={bookmarked}
                  aria-label={
                    bookmarked
                      ? bilingualAria(`${displayName} is on your shortlist`, `${displayName}: στη λίστα επιλογών`)
                      : bilingualAria(`Save ${displayName} to shortlist`, `Αποθήκευση ${displayName} στη λίστα`)
                  }
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors',
                    bookmarked ? STATUS.warning.icon : cn('text-muted-foreground', 'hover:text-status-warning')
                  )}
                >
                  <Bookmark className={cn('icon-sm', bookmarked && 'fill-current')} />
                </button>
              )}
            </div>
          ) : undefined}
        >
          {onBreakdown ? (
            <Button
              size="sm"
              variant="outline"
              className={cn('gap-1.5', colors.border, colors.text)}
              style={{ borderColor: `color-mix(in srgb, ${stroke} 25%, transparent)` }}
              onClick={onBreakdown}
            >
              <TrendingUp className="icon-sm" />
              <BilingualText en="Compatibility" el="Συμβατότητα" compact />
            </Button>
          ) : (
            <Button size="sm" variant="outline" className={cn('gap-1.5', colors.text)} style={{ borderColor: `color-mix(in srgb, ${stroke} 25%, transparent)` }} asChild>
              <Link href={`/matches/${userId}`}>
                <TrendingUp className="icon-sm" />
                <BilingualText en="Compatibility" el="Συμβατότητα" compact />
              </Link>
            </Button>
          )}

          {primary ? (
            <Button onClick={primary.onClick} size="sm" className="gap-1.5" aria-label={primary.aria}>
              <primary.Icon className="icon-sm" />
              <BilingualText en={primary.en} el={primary.el} compact />
            </Button>
          ) : state === 'sent' ? (
            <span className="inline-flex min-h-9 items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="icon-sm" aria-hidden="true" />
              <BilingualText en="Request sent" el="Το αίτημα στάλθηκε" compact />
            </span>
          ) : null}
        </CardFoot>
      </CardContent>
    </Card>
  );
}

export const MatchCard = React.memo(MatchCardInner);

// Swipeable Match Card for mobile
export function SwipeableMatchCard(props: MatchCardProps & { onSwipeLeft?: () => void; onSwipeRight?: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Note: Full swipe implementation would require a gesture library like framer-motion or react-spring
  // This is a simplified version
  return (
    <div
      className="touch-pan-y"
      style={{
        transform: `translateX(${position.x}px) rotate(${position.x * 0.05}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      <MatchCard {...props} />
    </div>
  );
}
