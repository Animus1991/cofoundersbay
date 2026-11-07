'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, UserPlus, X, MessageCircle, Bookmark, TrendingUp, ChevronDown, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BilingualText } from './BilingualText';
import { cn } from '@/lib/utils';
import { bilingualAria } from '@/lib/i18n/format';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

import type { CommitmentStep } from '@cofounderbay/shared';
import { StepChip } from '@/components/commitments/OutcomeChip';
import { FactLine } from '@/components/common/FactLine';
import { matchReasonCopy } from '@/lib/match-reason';
import { splitReasons } from '@/lib/match-explain';
import { matchesEl, matchesEn } from '@/lib/i18n/strings-matches';
import type { CardMoreItem } from '@/components/common/CardMoreMenu';
import { PersonCard } from '@/components/common/PersonCard';
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
  const { stroke } = getScoreTier(compatibilityScore);
  const reasonCopies: ReasonCopy[] = reasons ? [...reasons] : matchReasons.map((reason) => matchReasonCopy(reason.text));
  // One cause on the card, the most telling; the rest are one press away.
  const { face, rest } = splitReasons(reasonCopies, 1);

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  // One primary action, from where the connection stands: Connect to a new
  // match, Accept a request they sent, Message once connected. A request
  // already sent is said, not offered again.
  const state: MatchConnection = connection ?? 'none';
  const primary = matchPrimary(state, displayName, { onConnect: onLike, onAccept, onMessage });

  // Everything the card could always do, in the order it is reached for.
  const more: CardMoreItem[] = [
    onBreakdown
      ? { key: 'compatibility', en: 'Compatibility', el: 'Συμβατότητα', icon: TrendingUp, onSelect: onBreakdown }
      : { key: 'compatibility', en: 'Compatibility', el: 'Συμβατότητα', icon: TrendingUp, href: `/matches/${userId}` },
    ...(onMessage && primary?.key !== 'message' ? [{ key: 'message', en: 'Message', el: 'Μήνυμα', icon: MessageCircle, onSelect: onMessage }] : []),
    ...(onBookmark ? [{
      key: 'save',
      en: bookmarked ? 'Saved to your shortlist' : 'Save to shortlist',
      el: bookmarked ? 'Στη λίστα επιλογών' : 'Αποθήκευση στη λίστα',
      icon: Bookmark,
      onSelect: handleBookmark,
    }] : []),
    ...(rest.length > 0 ? [{
      key: 'reasons',
      en: `All reasons (${reasonCopies.length})`,
      el: `Όλοι οι λόγοι (${reasonCopies.length})`,
      icon: ChevronDown,
      // The preview panel lists them where a page has one; a card on its own opens them in place.
      onSelect: onClick ?? (() => setShowAllReasons((value) => !value)),
    }] : []),
    { key: 'profile', en: 'Full profile', el: 'Πλήρες προφίλ', icon: ArrowRight, href: `/profiles/${userId}` },
    ...(onPass ? [{ key: 'pass', en: 'Pass', el: 'Παράλειψη', icon: X, onSelect: onPass, destructive: true }] : []),
  ];

  const shown = showAllReasons ? reasonCopies : face;
  return (
    <PersonCard
      userId={userId}
      name={displayName}
      avatarUrl={avatarUrl}
      role={role}
      headline={headline}
      edge={stroke}
      onOpen={onClick}
      selected={Boolean(isSelected)}
      className={className}
      // Where they are, and where a commitment stands: states on the title's
      // edge, so the head keeps one thing at its right.
      meta={location || timezone || commitment ? (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <FactLine items={[location, timezone]} />
          {commitment ? (
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
          ) : null}
        </span>
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
      fact={shown.length > 0 ? (
        <ul className="space-y-1" aria-label={bilingualAria('Why you match', 'Γιατί ταιριάζετε')}>
          {shown.map((copy, i) => (
            <li key={`${copy.en}-${i}`} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: stroke }} aria-hidden="true" />
              <span className={cn('min-w-0 flex-1', !showAllReasons && 'line-clamp-2')}><BilingualText en={copy.en} el={copy.el} compact wrap /></span>
            </li>
          ))}
        </ul>
      ) : undefined}
      primary={primary ? (
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
      more={more}
    />
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
