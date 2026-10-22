'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, UserPlus, ArrowUpDown, RefreshCw, BarChart3, Zap,
  X, LayoutGrid, List, Search, MapPin, Briefcase, GraduationCap, DollarSign, Users,
  Bookmark, BookmarkCheck, MessageCircle, RotateCcw, SlidersHorizontal, Clock,
  CheckSquare,
} from 'lucide-react';
import { getRecommendations, getMatchBreakdown, getMeProfile, respondToConnectionRequest, sendConnectionRequest, saveToShortlist, removeFromShortlist, recordMatchFeedback, restoreMatchFeedback, getShortlistIds, type SearchHit } from '@/lib/api';
import { createPassLedger } from '@/lib/match-pass';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { choiceControl, ROW_GONE, rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { MatchCard, matchPrimary, type MatchConnection } from '@/components/common/MatchCard';
import type { CommitmentStep } from '@cofounderbay/shared';
import { listCommitmentThreads } from '@/lib/commitments-api';
import { threadLine } from '@/lib/commitments-next';
import { RoleBadge } from '@/components/common/RoleBadge';
import { StatusText } from '@/components/common/StatusText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { useConnectionWith } from '@/hooks/useConnectionWith';
import { ProfileCardSkeleton } from '@/components/discover/ProfileCard';
import { BilingualText } from '@/components/common/BilingualText';
import { matchesEn, matchesEl } from '@/lib/i18n/strings-matches';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import type { ProfileCardData } from '@/components/discover/ProfileCard';
import { qk, queryKeys } from '@/lib/query-keys';
import { FirstRunTour, type TourStep } from '@/components/common/FirstRunTour';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { FactLine } from '@/components/common/FactLine';
import { explainMatch, viewerFacts, type ExplainedReason } from '@/lib/match-explain';
import { axisCopy, compatSummary, completenessCopy, frictionCopy, strengthTerms } from '@/lib/match-vs-copy';
import { ensureExtraCatalog } from '@/lib/i18n/translate';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { PageFacts } from '@/components/common/PageFacts';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { useBilingualString, useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { ASK } from '@/lib/page-questions';

const MATCHES_TOUR: TourStep[] = [
  {
    target: 'matches-stats',
    titleEn: 'Your match summary',
    titleEl: 'Η σύνοψη των αντιστοιχίσεών σας',
    bodyEn: 'Total matches, how many score 80%+ ("excellent"), and your average and top score. These count every match, not just the ones shown after filtering.',
    bodyEl: 'Σύνολο αντιστοιχίσεων, πόσες έχουν 80%+ («εξαιρετικές») και η μέση και κορυφαία βαθμολογία σας. Μετρούν όλες τις αντιστοιχίσεις, όχι μόνο όσες φαίνονται μετά το φιλτράρισμα.',
  },
  {
    target: 'matches-tiers',
    titleEn: 'Filter by match tier',
    titleEl: 'Φίλτρο ανά επίπεδο ταιριάσματος',
    bodyEn: 'Tap a tier to see only excellent, strong, or good matches. Tap it again to clear. Role, location and availability filters live in the page tools on the right.',
    bodyEl: 'Πατήστε ένα επίπεδο για να δείτε μόνο εξαιρετικές, ισχυρές ή καλές αντιστοιχίσεις. Πατήστε ξανά για καθαρισμό. Τα φίλτρα ρόλου, τοποθεσίας και διαθεσιμότητας είναι στα εργαλεία σελίδας δεξιά.',
  },
  {
    target: 'matches-toolbar',
    titleEn: 'Select, search, and change the view',
    titleEl: 'Επιλογή, αναζήτηση και αλλαγή προβολής',
    bodyEn: 'Select mode lets you pick two profiles and compare them side by side. Search finds a name, headline or skill. The view switch toggles grid or list.',
    bodyEl: 'Η λειτουργία επιλογής σάς αφήνει να διαλέξετε δύο προφίλ και να τα συγκρίνετε δίπλα-δίπλα. Η αναζήτηση βρίσκει όνομα, τίτλο ή δεξιότητα. Ο διακόπτης προβολής αλλάζει πλέγμα ή λίστα.',
  },
  {
    target: 'matches-grid',
    titleEn: 'Read "Why you match" before reaching out',
    titleEl: 'Διαβάστε το «Γιατί ταιριάζετε» πριν επικοινωνήσετε',
    bodyEn: 'Each card shows the score and the reasons behind it. Use Connect to send a request, Save to keep the profile for later, or Pass to hide it — Pass can be undone.',
    bodyEl: 'Κάθε κάρτα δείχνει τη βαθμολογία και τους λόγους πίσω από αυτή. Με Σύνδεση στέλνετε αίτημα, με Αποθήκευση κρατάτε το προφίλ για αργότερα, με Παράλειψη το κρύβετε — η Παράλειψη αναιρείται.',
  },
];

const ConnectionRequestDialog = dynamic(() => import('@/components/common/ConnectionRequest').then((m) => ({ default: m.ConnectionRequestDialog })), { ssr: false });
const MatchCompatibilityChart = dynamic(
  () => import('@/components/charts/MatchCompatibilityChart').then((m) => ({ default: m.MatchCompatibilityChart })),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-lg" /> }
);

/** Where a commitment with someone stands: the board's link and the line that says it. */
type CommitmentLink = { step: CommitmentStep; href: string; line: { en: string; el: string; yourTurn: boolean } };

/** The engine's score, or null when it gave none: never a made-up 50. */
function scoreOf(hit: SearchHit): number | null {
  return typeof hit.matchScore === 'number' && Number.isFinite(hit.matchScore) ? hit.matchScore : null;
}

/*
 * The five axes on this radar used to be one score nudged by fixed percentages
 * — +8% became "Skills", -15% became "Location" — which drew a shape that
 * looked measured and was arithmetic on a single number. The matching engine
 * already scores six real dimensions (`GET /api/recommendations/vs/:id`, the
 * same computation that ranks these very cards), so the chart reads those. If
 * the breakdown cannot be fetched the chart is absent, not invented.
 *
 * The dialog's one number is the card's. The comparison endpoint computes an
 * overall score of its own, with a different model, and the two disagreed
 * about the same pair (92 on the card, 96 here, with "96% confidence" under
 * it that read as a second score). How much the comparison stands on is said
 * in words; the axes, the points worth discussing and the shared strengths
 * are said in the reader's language (lib/match-vs-copy), where the endpoint
 * wrote English; and the reasons are the card's own, all of them.
 */

function CompatibilityModal({
  hit,
  reasons,
  viewerSkills,
  open,
  onClose,
}: {
  hit: SearchHit | null;
  reasons: ExplainedReason[];
  viewerSkills: string[];
  open: boolean;
  onClose: () => void;
}) {
  const sayOne = useBilingualString();
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: qk('matching', 'breakdown', hit?.userId),
    queryFn: () => getMatchBreakdown(hit!.userId),
    enabled: open && Boolean(hit?.userId),
    staleTime: 5 * 60_000,
    retry: 0,
  });

  if (!hit) return null;

  const score = scoreOf(hit);
  const completeness = completenessCopy(detail?.overall.confidence);
  // Recharts draws a tick from a plain string: the reader's language only.
  const dims = detail?.breakdown?.length
    ? detail.breakdown.map((axis) => {
        const name = axisCopy(axis.key, axis.label);
        return { subject: sayOne(name.en, name.el), value: axis.score, fullMark: 100 };
      })
    : null;
  const frictions = (detail?.frictionItems ?? []).map(frictionCopy).filter((f): f is { en: string; el: string } => f !== null);
  // A skill both list is already in «Κοινές δεξιότητες» above: one fact, one place.
  const sharedSkills = (hit.skillNames ?? []).filter((n) => viewerSkills.some((m) => m.toLowerCase() === n.toLowerCase()));
  const strengths = strengthTerms(detail?.strengthItems, sharedSkills);
  const compat = detail && 'compatibility' in detail ? compatSummary(detail.compatibility) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[min(90dvh,calc(100svh-2rem))] max-w-md overflow-y-auto max-md:top-[max(0.5rem,env(safe-area-inset-top))] max-md:translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="icon-md text-muted-foreground" />
            <BilingualText en={`${matchesEn('compatibility_with')} ${hit.displayName}`} el={`${matchesEl('compatibility_with')} ${hit.displayName}`} />
          </DialogTitle>
          <DialogDescription className="sr-only"><BilingualText en="Compatibility score, reasons, points worth discussing and dimensions for this match." el="Βαθμός συμβατότητας, λόγοι, σημεία για συζήτηση και διαστάσεις για αυτή την αντιστοίχιση." /></DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 rounded-xl bg-primary/8 p-4">
          <div className="text-center">
            {score !== null ? (
              <p className="text-2xl font-bold tabular-nums text-primary-accessible">{score}%</p>
            ) : (
              <p className="text-sm text-muted-foreground"><BilingualText en="No score yet" el="Χωρίς βαθμολογία ακόμη" compact /></p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              <BilingualText en={matchesEn('overall_match')} el={matchesEl('overall_match')} />
            </p>
            {completeness && (
              <p className="mt-1 text-2xs text-muted-foreground/80">
                <BilingualText en={completeness.en} el={completeness.el} compact wrap />
              </p>
            )}
          </div>
        </div>

        {reasons.length > 0 && (
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <BilingualText en={matchesEn('why_you_match')} el={matchesEl('why_you_match')} />
            </p>
            {reasons.map((r, i) => (
              <div key={`${r.en}-${i}`} className="flex items-start gap-2 text-sm">
                <Zap className="icon-sm text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground"><BilingualText en={r.en} el={r.el} compact wrap /></span>
              </div>
            ))}
          </div>
        )}

        {frictions.length > 0 && (
          <div className="rounded-lg border border-border bg-status-warning-bg/40 p-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BilingualText en={matchesEn('watch_outs')} el={matchesEl('watch_outs')} />
            </p>
            {frictions.map((f) => (
              <p key={f.en} className="text-sm text-foreground"><BilingualText en={f.en} el={f.el} compact wrap /></p>
            ))}
          </div>
        )}

        {compat && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><BilingualText en={compat.text.en} el={compat.text.el} wrap /></p>
            {!compat.enough && (
              <Link href="/settings#how-you-work" className="tap-target-y inline-flex items-center gap-1 font-medium text-primary-accessible underline-offset-4 hover:underline">
                <BilingualText en="Answer the working-style questions" el="Απαντήστε στις ερωτήσεις συνεργασίας" compact />
                <ArrowRight className="icon-sm" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        {dims ? (
          <MatchCompatibilityChart dims={dims} />
        ) : (
          <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            <BilingualText
              en={detailLoading ? matchesEn('breakdown_loading') : matchesEn('breakdown_unavailable')}
              el={detailLoading ? matchesEl('breakdown_loading') : matchesEl('breakdown_unavailable')}
            />
          </p>
        )}

        {strengths.length > 0 && (
          <div className="rounded-lg border border-border bg-status-success-bg/40 p-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BilingualText en={matchesEn('shared_strengths')} el={matchesEl('shared_strengths')} />
            </p>
            <FactLine className="text-sm text-foreground" items={strengths.map((t) => <BilingualText key={t.en} en={t.en} el={t.el} compact />)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function hitToProfile(hit: SearchHit): ProfileCardData {
  return {
    id: hit.id,
    userId: hit.userId,
    displayName: hit.displayName,
    headline: hit.headline,
    bio: hit.bio,
    avatarUrl: hit.avatarUrl,
    role: hit.role,
    location: hit.location,
    skills: hit.skillNames ?? [],
    matchScore: hit.matchScore,
    lookingFor: hit.lookingFor,
    availability: hit.availability,
  };
}

type FilterKey = 'all' | 'excellent' | 'strong' | 'good' | 'potential';
type RoleFilter = 'all' | 'founder' | 'mentor' | 'investor' | 'org';
type SortKey = 'score' | 'name' | 'recent';
type AvailFilter = 'full_time' | 'part_time' | 'advisory' | 'contract';
type ViewMode = 'grid2' | 'grid3' | 'list';

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

const TIER_DOT: Record<MatchTier, string> = {
  excellent: 'bg-status-success-mark',
  strong: 'bg-status-info-mark',
  good: 'bg-status-warning-mark',
  potential: 'bg-status-danger-mark',
};

function tierStyle(tier: MatchTier) {
  return STATUS[MATCH_TIER_TONE[tier]];
}

function getTier(score: number): MatchTier {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'strong';
  if (score >= 45) return 'good';
  return 'potential';
}

function roleMatchesFilter(role: string, filter: RoleFilter): boolean {
  if (filter === 'all') return true;
  const r = role.toLowerCase();
  if (filter === 'founder') return r.includes('founder') || r === 'technical_talent' || r === 'operator';
  if (filter === 'mentor') return r === 'mentor' || r === 'advisor' || r === 'coach';
  if (filter === 'investor') return r.includes('investor') || r === 'vc_analyst' || r === 'vc_scout' || r === 'angel_investor';
  if (filter === 'org') return r.includes('org') || r.includes('admin') || r === 'community_manager';
  return true;
}

/** The one primary action, or the sent request said; the same rule as the card's (`matchPrimary`). */
function PrimaryAction({
  hit,
  connection,
  onConnect,
  onAccept,
  onMessage,
  className,
}: {
  hit: SearchHit;
  connection: MatchConnection;
  onConnect: () => void;
  onAccept: () => void;
  onMessage: () => void;
  className?: string;
}) {
  const primary = matchPrimary(connection, hit.displayName, { onConnect, onAccept, onMessage });
  if (primary) {
    return (
      <Button size="sm" onClick={primary.onClick} className={cn('gap-1.5', className)} aria-label={primary.aria}>
        <primary.Icon className="icon-sm" /> <BilingualText en={primary.en} el={primary.el} compact />
      </Button>
    );
  }
  return (
    <span className={cn('inline-flex min-h-9 items-center justify-center gap-1.5 text-xs text-muted-foreground', className)}>
      <Clock className="icon-sm" aria-hidden="true" />
      <BilingualText en="Request sent" el="Το αίτημα στάλθηκε" compact />
    </span>
  );
}

/** Where a commitment stands, as a link to its board: the reader's turn reads in the accent. */
function CommitmentLine({ commitment }: { commitment: CommitmentLink }) {
  return (
    <Link
      href={commitment.href}
      className={cn('inline rounded-sm underline-offset-4 hover:underline', commitment.line.yourTurn ? 'font-medium text-primary-accessible' : 'text-muted-foreground')}
    >
      <BilingualText en={commitment.line.en} el={commitment.line.el} compact wrap />
    </Link>
  );
}

/* ── List-view row component ─────────────────────────────────────────────── */
function MatchListRow({
  hit,
  reasons,
  isSaved,
  connection,
  onConnect,
  onAccept,
  onMessage,
  onPass,
  onSave,
  onBreakdown,
  commitment,
}: {
  hit: SearchHit;
  reasons: ExplainedReason[];
  isSaved: boolean;
  connection: MatchConnection;
  commitment?: CommitmentLink | null;
  onConnect: () => void;
  onAccept: () => void;
  onMessage: () => void;
  onPass: () => void;
  onSave: () => void;
  onBreakdown: () => void;
}) {
  const score = scoreOf(hit);
  const tier = score === null ? null : getTier(score);
  const colors = tier ? tierStyle(tier) : STATUS.neutral;
  const stroke = tier ? TIER_STROKE[tier] : 'hsl(var(--border))';
  const initials = hit.displayName.slice(0, 2).toUpperCase();
  const circ = 2 * Math.PI * 23;
  const primaryIsMessage = matchPrimary(connection, hit.displayName, { onConnect, onAccept, onMessage })?.key === 'message';

  // The Connections card in a row: the score ring around the person's circle
  // is the mark (2.5rem, as every card's), the name and headline beside it,
  // the tier at the right; skills, reasons and the foot on the ring's edge.
  return (
    <Card className="shadow-sm border-border hover:border-primary/30 transition-all group">
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <div data-card-mark="" className="relative h-10 w-10 shrink-0">
              <svg viewBox="0 0 52 52" className="absolute inset-0 h-10 w-10" aria-hidden="true">
                <circle cx={26} cy={26} r={23} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
                <circle cx={26} cy={26} r={23} fill="none" stroke={stroke} strokeWidth={3}
                  strokeDasharray={`${((score ?? 0) / 100) * circ} ${circ}`}
                  strokeDashoffset={circ * 0.25}
                  strokeLinecap="round" />
              </svg>
              <Link href={`/profiles/${hit.userId}`} className="absolute inset-1 rounded-full" aria-label={bilingualAria(`Open ${hit.displayName}'s profile`, `Άνοιγμα προφίλ: ${hit.displayName}`)}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={hit.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          )}
          title={(
            <PersonHovercard userId={hit.userId}><Link href={`/profiles/${hit.userId}`} className="transition-colors hover:text-primary-accessible">{hit.displayName}</Link></PersonHovercard>
          )}
          subtitle={hit.headline ? <span className="line-clamp-1">{hit.headline}</span> : undefined}
          // The place, and where a commitment stands, on the title's edge;
          // the tier is the head's one pill at the right.
          meta={(hit.location || commitment) ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {hit.location ? <span>{hit.location}</span> : null}
              {commitment ? <CommitmentLine commitment={commitment} /> : null}
            </span>
          ) : undefined}
          aside={tier && score !== null ? (
            <Badge variant="outline" className={cn('border text-xs tabular-nums', colors.chip)}>
              <BilingualText en={`${matchesEn(`tier_${tier}` as const)} · ${score}%`} el={`${matchesEl(`tier_${tier}` as const)} · ${score}%`} compact />
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground"><BilingualText en="No score yet" el="Χωρίς βαθμολογία ακόμη" compact /></span>
          )}
        />

        {/* Skills and the two most telling reasons: facts on the ring's edge. */}
        {((hit.skillNames ?? []).length > 0 || reasons.length > 0) && (
          <div className="space-y-1">
            <FactLine
              items={[...(hit.skillNames ?? []).slice(0, 5), (hit.skillNames ?? []).length > 5 ? `+${(hit.skillNames ?? []).length - 5}` : null]}
            />
            <FactLine
              label={bilingualAria('Why you match', 'Γιατί ταιριάζετε')}
              items={reasons.slice(0, 2).map((r) => <BilingualText key={r.en} en={r.en} el={r.el} compact />)}
            />
          </div>
        )}

        {/* Foot: pass and save at the left, the next steps at the right.
            Round icons on a phone; from 640px they carry their word, so the
            width is auto - with `!`, because the global rule that squares
            every h-10 w-10 button on a desktop outranks sm:w-auto, and the
            words spilled over the circles. */}
        <CardFoot
          meta={(
            <div className="flex items-center gap-1.5">
              <button onClick={onPass}
                className="flex h-10 w-10 items-center justify-center gap-1.5 rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive-accessible sm:!w-auto sm:px-3"
                aria-label={bilingualAria(`Pass on ${hit.displayName}`, `Παράλειψη: ${hit.displayName}`)}>
                <X className="icon-sm" />
                <span className="hidden sm:inline text-xs"><BilingualText en="Pass" el="Παράλειψη" compact /></span>
              </button>
              <button onClick={onSave}
                className={cn('flex h-10 w-10 items-center justify-center gap-1.5 rounded-full border border-border transition-colors sm:!w-auto sm:px-3', isSaved ? STATUS.warning.icon : 'text-muted-foreground hover:text-status-warning')}
                aria-pressed={isSaved}
                aria-label={isSaved
                  ? bilingualAria(`${hit.displayName} is on your shortlist`, `${hit.displayName}: στη λίστα σας`)
                  : bilingualAria(`Save ${hit.displayName} to your shortlist`, `Αποθήκευση: ${hit.displayName} στη λίστα σας`)}>
                {isSaved ? <BookmarkCheck className="icon-sm" /> : <Bookmark className="icon-sm" />}
                <span className="hidden sm:inline text-xs"><BilingualText en={isSaved ? 'Saved' : 'Save'} el={isSaved ? 'Αποθηκεύτηκε' : 'Αποθήκευση'} compact /></span>
              </button>
            </div>
          )}
        >
          <Button size="sm" variant="ghost" onClick={onBreakdown} className="gap-1.5 text-muted-foreground hover:text-primary-accessible">
            <BarChart3 className="icon-sm" /> <BilingualText en="Compatibility" el="Συμβατότητα" compact />
          </Button>
          {!primaryIsMessage && (
            <Button size="sm" variant="outline" onClick={onMessage} className="gap-1.5">
              <MessageCircle className="icon-sm" /> <BilingualText en="Message" el="Μήνυμα" compact />
            </Button>
          )}
          <PrimaryAction hit={hit} connection={connection} onConnect={onConnect} onAccept={onAccept} onMessage={onMessage} />
        </CardFoot>
      </CardContent>
    </Card>
  );
}

/* ── Match Preview Panel ─────────────────────────────────────────────────── */
function MatchPreviewPanel({
  hit, reasons, savedIds, connection, commitment, onClose, onConnect, onAccept, onMessage, onSave, onPass, onBreakdown,
}: {
  hit: SearchHit;
  reasons: ExplainedReason[];
  savedIds: Set<string>;
  connection: MatchConnection;
  commitment?: CommitmentLink | null;
  onClose: () => void;
  onConnect: () => void;
  onAccept: () => void;
  onMessage: () => void;
  onSave: () => void;
  onPass: () => void;
  onBreakdown: () => void;
}) {
  const score = scoreOf(hit);
  const tier = score === null ? null : getTier(score);
  const colors = tier ? tierStyle(tier) : STATUS.neutral;
  const isSaved = savedIds.has(hit.userId);
  const primaryIsMessage = matchPrimary(connection, hit.displayName, { onConnect, onAccept, onMessage })?.key === 'message';

  return (
    <>
      {/* Backdrop (mobile) */}
      <div aria-hidden="true" className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />

      {/* Slide panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[360px] overflow-y-auto border-l border-border bg-card shadow-modal animate-in slide-in-from-right duration-200 max-md:max-w-none">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
          <p className="text-sm font-semibold"><BilingualText en="Profile Preview" el="Προεπισκόπηση προφίλ" compact /></p>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground" aria-label={bilingualAria('Close preview', 'Κλείσιμο προεπισκόπησης')}>
            <X className="icon-sm" />
          </button>
        </div>

        <div className="space-y-4 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          {/* The person, set as every card's head: circle, name with its
              role, headline; the score at the right. */}
          <CardHead
            mark={(
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={hit.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-muted text-sm font-semibold">
                  {hit.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            title={(
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {hit.displayName}
                <RoleBadge role={hit.role} size="sm" showIcon />
              </span>
            )}
            subtitle={hit.headline ? <span className="line-clamp-3">{hit.headline}</span> : undefined}
            meta={commitment ? <CommitmentLine commitment={commitment} /> : undefined}
            asideStays
            aside={tier && score !== null ? (
              <span className="flex flex-col items-end">
                <span className={cn('card-body font-semibold tabular-nums', colors.icon)}>{score}%</span>
                <span className={cn('text-xs font-medium', colors.icon)}>
                  <BilingualText en={matchesEn(`tier_${tier}` as const)} el={matchesEl(`tier_${tier}` as const)} compact />
                </span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground"><BilingualText en="No score yet" el="Χωρίς βαθμολογία ακόμη" compact /></span>
            )}
          />

          {/* Place and availability: facts, not pills. */}
          <FactLine items={[hit.location, hit.availability ? <StatusText key="availability" value={hit.availability} /> : null]} />

          {/* Skills */}
          {(hit.skillNames ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground"><BilingualText en="Skills" el="Δεξιότητες" compact /></p>
              <FactLine className="text-foreground" items={hit.skillNames ?? []} />
            </div>
          )}

          {/* Why you match: every reason, in the reader's language (they
              were printed as the engine wrote them, in English). */}
          {reasons.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground"><BilingualText en="Why you match" el="Γιατί ταιριάζετε" compact /></p>
              <ul className="space-y-1">
                {reasons.map((r, i) => (
                  <li key={`${r.en}-${i}`} className="flex items-start gap-2 text-xs text-foreground">
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', tier ? TIER_DOT[tier] : 'bg-border')} aria-hidden="true" />
                    <span className="min-w-0"><BilingualText en={r.en} el={r.el} compact wrap /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions: the one primary first, as on the card. */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex gap-2">
              <PrimaryAction hit={hit} connection={connection} onConnect={onConnect} onAccept={onAccept} onMessage={onMessage} className="flex-1" />
              {!primaryIsMessage && (
                <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={onMessage}>
                  <MessageCircle className="icon-sm" /> <BilingualText en="Message" el="Μήνυμα" compact />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onSave}>
                {isSaved ? <BookmarkCheck className={cn('icon-sm', STATUS.warning.icon)} /> : <Bookmark className="icon-sm" />}
                <BilingualText en={isSaved ? 'Saved' : 'Save'} el={isSaved ? 'Αποθηκεύτηκε' : 'Αποθήκευση'} compact />
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 hover:text-destructive-accessible" onClick={onPass}>
                <X className="icon-sm" /> <BilingualText en="Pass" el="Παράλειψη" compact />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" onClick={onBreakdown}>
              <BarChart3 className="icon-sm" /> <BilingualText en="Compatibility" el="Συμβατότητα" compact />
            </Button>
            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" asChild>
              <Link href={`/profiles/${hit.userId}`}>
                <ArrowRight className="icon-sm" /> <BilingualText en="Full profile" el="Πλήρες προφίλ" compact />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MatchesPage() {
  const sayOne = useBilingualString();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  /* ── UI state ── */
  const [connectionTarget, setConnectionTarget] = useState<ProfileCardData | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [viewMode, setViewMode] = useState<ViewMode>('grid2');
  const [nameSearch, setNameSearch] = useState('');
  const [breakdownTarget, setBreakdownTarget] = useState<SearchHit | null>(null);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [lastPassed, setLastPassed] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [availFilter, setAvailFilter] = useState<Set<AvailFilter>>(new Set());
  const [previewTarget, setPreviewTarget] = useState<SearchHit | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasToken = useIsAuthenticated();

  // Where a commitment with each person stands, shown under their headline:
  // the latest live thread from either side wins over a closed one, said as
  // a line (whose turn, and what the card is for) instead of the bare step.
  const { data: commitmentThreads } = useQuery({
    queryKey: qk('commitments', 'threads', 'all'),
    queryFn: () => listCommitmentThreads('all'),
    staleTime: 60_000,
  });
  const commitmentWith = useMemo(() => {
    const map = new Map<string, CommitmentLink>();
    for (const t of commitmentThreads ?? []) {
      const current = map.get(t.counterpart.id);
      if (current && current.step !== 'closed') continue;
      map.set(t.counterpart.id, {
        step: t.step,
        href: `/commitments/${encodeURIComponent(t.cardId)}?thread=${encodeURIComponent(t.id)}`,
        line: threadLine(t),
      });
    }
    return map;
  }, [commitmentThreads]);

  // The reader's own profile: each match's reasons compare it with theirs.
  // The same key the dashboards and /profile read, so it is usually cached.
  const { data: meData } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasToken,
    staleTime: 5 * 60_000,
  });
  const viewer = useMemo(() => viewerFacts(meData?.profile ?? null), [meData]);

  // Skill names in the reasons are translated from the Greek catalog, which
  // loads on demand; the reasons are worked out again once it has.
  const { primary: primaryLanguage, showSecondary } = useLanguagePreference();
  const needsGreek = primaryLanguage === 'el' || showSecondary;
  const [catalogTick, setCatalogTick] = useState(0);
  useEffect(() => {
    if (!needsGreek) return;
    let live = true;
    ensureExtraCatalog('el')
      .then(() => { if (live) setCatalogTick((n) => n + 1); })
      .catch(() => { /* English terms stay; the sentences are still Greek. */ });
    return () => { live = false; };
  }, [needsGreek]);
  const [nowMs] = useState(() => Date.now());

  // Where a connection with each person stands, so the one primary action
  // is the right one: Connect, Accept their request, or Message. The same
  // keys and reads as /connections and the founder home (useConnectionWith),
  // so an answer on any of them shows on the others.
  const { connectionWith, connectionOf } = useConnectionWith(hasToken, meData?.profile?.userId);
  const { data: shortlistIdsData } = useQuery({
    queryKey: qk('shortlist', 'ids'),
    queryFn: getShortlistIds,
    staleTime: 5 * 60_000,
    enabled: hasToken,
  });

  useEffect(() => {
    if (shortlistIdsData?.ids) {
      setSavedIds(new Set(shortlistIdsData.ids));
    }
  }, [shortlistIdsData]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk('recommendations', 'matches', { limit: 50 }),
    queryFn: () => getRecommendations({ limit: 50 }),
    staleTime: 3 * 60_000,
    enabled: hasToken,
  });

  const suggestions: SearchHit[] = useMemo(() => data?.suggestions ?? [], [data]);
  const visible = useMemo(() => suggestions.filter(s => !passedIds.has(s.id)), [suggestions, passedIds]);

  // Why each person matches, from both profiles (lib/match-explain): the
  // card, the list row, the preview and the dialog all read this one list.
  const reasonsByHit = useMemo(() => {
    // `catalogTick` is in the options so the reasons are worked out again
    // when the Greek catalog arrives (explainMatch reads only nowMs).
    const options = { nowMs, catalogTick };
    const map = new Map<string, ExplainedReason[]>();
    for (const hit of suggestions) map.set(hit.id, explainMatch(hit, viewer, options));
    return map;
  }, [suggestions, viewer, nowMs, catalogTick]);
  const reasonsOf = useCallback((hit: SearchHit) => reasonsByHit.get(hit.id) ?? [], [reasonsByHit]);

  // A person without a score is in "All" only: no tier, no average.
  const counts = useMemo(() => {
    const scored = visible.map(scoreOf).filter((sc): sc is number => sc !== null);
    return {
      all:       visible.length,
      excellent: scored.filter(sc => sc >= 80).length,
      strong:    scored.filter(sc => sc >= 65 && sc < 80).length,
      good:      scored.filter(sc => sc >= 45 && sc < 65).length,
      potential: scored.filter(sc => sc < 45).length,
    };
  }, [visible]);

  const avgScore = useMemo(() => {
    const scored = visible.map(scoreOf).filter((sc): sc is number => sc !== null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((sum, sc) => sum + sc, 0) / scored.length);
  }, [visible]);

  const topScore = useMemo(() => {
    const scored = visible.map(scoreOf).filter((sc): sc is number => sc !== null);
    return scored.length ? Math.max(...scored) : null;
  }, [visible]);

  const filtered = useMemo(() => {
    let list = [...visible];
    if (activeFilter !== 'all') {
      list = list.filter(s => { const sc = scoreOf(s); return sc !== null && getTier(sc) === activeFilter; });
    }
    if (roleFilter !== 'all') {
      list = list.filter(s => roleMatchesFilter(s.role, roleFilter));
    }
    if (nameSearch.trim()) {
      const q = nameSearch.toLowerCase();
      list = list.filter(s =>
        s.displayName.toLowerCase().includes(q) ||
        (s.headline ?? '').toLowerCase().includes(q) ||
        (s.skillNames ?? []).some(sk => sk.toLowerCase().includes(q))
      );
    }
    if (locationFilter.trim()) {
      const loc = locationFilter.toLowerCase();
      list = list.filter(s => (s.location ?? '').toLowerCase().includes(loc));
    }
    if (availFilter.size > 0) {
      list = list.filter(s => {
        const av = (s.availability ?? '').toLowerCase();
        return [...availFilter].some(f => av.includes(f.replace('_', ' ').replace('_', '-')));
      });
    }
    if (sortBy === 'score') list.sort((a, b) => (scoreOf(b) ?? -1) - (scoreOf(a) ?? -1));
    else if (sortBy === 'name') list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    // 'recent': preserve original API order — no-op
    return list;
  }, [visible, activeFilter, roleFilter, nameSearch, sortBy, locationFilter, availFilter]);

  const handleConnect = useCallback((profile: ProfileCardData) => {
    setConnectionTarget(profile);
    setShowConnectionDialog(true);
  }, []);

  const handleSendConnection = async (message: string) => {
    if (!connectionTarget) return;
    try {
      await sendConnectionRequest({ receiverId: connectionTarget.userId, message: message || undefined });
      success(
        sayOne('Connection request sent', 'Το αίτημα σύνδεσης στάλθηκε'),
        sayOne(`Your request to ${connectionTarget.displayName} has been sent.`, `Το αίτημά σας προς ${connectionTarget.displayName} στάλθηκε.`),
      );
      setShowConnectionDialog(false);
      setConnectionTarget(null);
      queryClient.invalidateQueries({ queryKey: qk('recommendations') });
      queryClient.invalidateQueries({ queryKey: qk('connections') });
    } catch (err) {
      showError(sayOne('Could not send the request', 'Το αίτημα δεν στάλθηκε'), err instanceof Error ? err.message : sayOne('Please try again.', 'Δοκιμάστε ξανά.'));
    }
  };

  // Their request to the reader, accepted from the match itself: the card
  // then offers Message, and /connections shows the same.
  const handleAccept = useCallback(async (hit: SearchHit) => {
    const link = connectionWith.get(hit.userId);
    if (!link || link.state !== 'received') return;
    try {
      await respondToConnectionRequest(link.id, 'accepted');
      success(sayOne('Connected', 'Η σύνδεση έγινε'), sayOne(`You are now connected with ${hit.displayName}.`, `Είστε πλέον σε σύνδεση με ${hit.displayName}.`));
      await queryClient.invalidateQueries({ queryKey: qk('connections') });
    } catch (err) {
      showError(sayOne('Could not accept the request', 'Το αίτημα δεν έγινε αποδεκτό'), err instanceof Error ? err.message : undefined);
    }
  }, [connectionWith, queryClient, success, showError, sayOne]);

  const handleMessage = useCallback((profile: ProfileCardData) => {
    router.push(`/messages?to=${profile.userId}`);
  }, [router]);

  // What each pass replaced on the server (lib/match-pass): Undo sends
  // exactly that back. Before, Undo only brought the card back on screen; the
  // pass stayed on the server and the person ranked lower from then on.
  const [passLedger] = useState(() => createPassLedger({
    record: (userId) => recordMatchFeedback({ targetUserId: userId, feedback: 'declined' }),
    restore: (r) => restoreMatchFeedback({ targetUserId: r.userId, previous: r.previous, signalId: r.signalId }),
  }));

  const unpass = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setPassedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setLastPassed((last) => (last && ids.includes(last) ? null : last));
    for (const id of ids) void passLedger.takeBack(id);
  }, [passLedger]);

  // The toast offers the undo it used to only mention ("removed · Undo?",
  // in English, with nothing to press): Undo brings this one card back, on
  // the screen and on the server.
  const handlePass = useCallback((id: string, name: string, userId: string) => {
    setPassedIds(prev => new Set(prev).add(id));
    setLastPassed(id);
    passLedger.pass(id, userId);
    success(sayOne('Passed', 'Παραλείφθηκε'), name, {
      action: {
        label: sayOne('Undo', 'Αναίρεση'),
        onClick: () => unpass([id]),
      },
    });
  }, [success, sayOne, unpass, passLedger]);

  const handleUndoPass = useCallback(() => {
    if (!lastPassed) return;
    unpass([lastPassed]);
  }, [lastPassed, unpass]);

  // The heart flips at once and a failed write flips it back. The request
  // used to be sent from inside the state updater, which React may run twice,
  // and nothing waited for it - so the assistant reported a save that could
  // still fail, and the reader never heard that it had.
  const handleSave = useCallback(async (userId: string, name: string): Promise<PageControlRunResult> => {
    const wasSaved = savedIds.has(userId);
    const flip = (saved: boolean) =>
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(userId);
        else next.delete(userId);
        return next;
      });
    flip(!wasSaved);
    try {
      await (wasSaved ? removeFromShortlist(userId) : saveToShortlist(userId));
      if (!wasSaved) success(sayOne('Saved to shortlist', 'Αποθηκεύτηκε στη λίστα'), sayOne(`${name} added to your saved profiles.`, `${name}: προστέθηκε στα αποθηκευμένα προφίλ.`));
    } catch (err) {
      flip(wasSaved);
      showError(
        wasSaved ? sayOne('Could not remove from shortlist', 'Η αφαίρεση από τη λίστα απέτυχε') : sayOne('Could not save to shortlist', 'Η αποθήκευση στη λίστα απέτυχε'),
        err instanceof Error ? err.message : undefined,
      );
      return { error: err instanceof Error && err.message ? err.message : 'Your saved profiles did not change.' };
    }
  }, [savedIds, success, showError, sayOne]);

  const TIER_TABS: { key: FilterKey; labelEn: string; labelEl: string; tier?: MatchTier }[] = [
    { key: 'all',       labelEn: matchesEn('tier_all'),       labelEl: matchesEl('tier_all') },
    { key: 'excellent', labelEn: matchesEn('tier_excellent'), labelEl: matchesEl('tier_excellent'), tier: 'excellent' },
    { key: 'strong',    labelEn: matchesEn('tier_strong'),    labelEl: matchesEl('tier_strong'),    tier: 'strong' },
    { key: 'good',      labelEn: matchesEn('tier_good'),      labelEl: matchesEl('tier_good'),      tier: 'good' },
    { key: 'potential', labelEn: matchesEn('tier_potential'), labelEl: matchesEl('tier_potential'), tier: 'potential' },
  ];

  const ROLE_TABS: { key: RoleFilter; labelEn: string; labelEl: string; icon: typeof Users }[] = [
    { key: 'all',      labelEn: matchesEn('all_roles'),  labelEl: matchesEl('all_roles'),  icon: Users },
    { key: 'founder',  labelEn: matchesEn('founders'),   labelEl: matchesEl('founders'),   icon: Briefcase },
    { key: 'mentor',   labelEn: matchesEn('mentors'),    labelEl: matchesEl('mentors'),    icon: GraduationCap },
    { key: 'investor', labelEn: matchesEn('investors'),  labelEl: matchesEl('investors'),  icon: DollarSign },
    { key: 'org',      labelEn: matchesEn('orgs'),       labelEl: matchesEl('orgs'),       icon: Users },
  ];

  const AVAIL_OPTIONS: { key: AvailFilter; labelEn: string; labelEl: string }[] = [
    { key: 'full_time', labelEn: matchesEn('full_time'), labelEl: matchesEl('full_time') },
    { key: 'part_time', labelEn: matchesEn('part_time'), labelEl: matchesEl('part_time') },
    { key: 'advisory',  labelEn: matchesEn('advisory'),  labelEl: matchesEl('advisory') },
    { key: 'contract',  labelEn: matchesEn('contract'),  labelEl: matchesEl('contract') },
  ];

  const hasActiveFilters = activeFilter !== 'all' || roleFilter !== 'all' || nameSearch || locationFilter || availFilter.size > 0;
  /* How many, for the rail's badge - availability is one filter however many
     values it holds, because that is how the reader thinks of it. */
  const activeFilterCount =
    (activeFilter !== 'all' ? 1 : 0) +
    (roleFilter !== 'all' ? 1 : 0) +
    (nameSearch ? 1 : 0) +
    (locationFilter ? 1 : 0) +
    (availFilter.size > 0 ? 1 : 0);

  const askAi = hasToken && visible.length > 0
    ? {
        en: `Matches: ${counts.all} total, ${counts.excellent} excellent (≥80%), average ${avgScore ?? '—'}%, top ${topScore ?? '—'}%. ${filtered.length !== counts.all ? `${filtered.length} showing with current filters. ` : ''}Recommend who I should connect with first and draft a short intro.`,
        el: `Αντιστοιχίσεις: ${counts.all} συνολικά, ${counts.excellent} εξαιρετικές (≥80%), μέσος όρος ${avgScore ?? '—'}%, κορυφαία ${topScore ?? '—'}%. ${filtered.length !== counts.all ? `${filtered.length} εμφανίζονται με τα τρέχοντα φίλτρα. ` : ''}Πρότεινε με ποιον να συνδεθώ πρώτα και ετοίμασε μια σύντομη γνωριμία.`,
      }
    : {
        en: 'I am on Matches. Explain how compatibility scoring works and what to complete on my profile so I get better cofounder suggestions.',
        el: 'Είμαι στις Αντιστοιχίσεις. Εξήγησε πώς βγαίνει η συμβατότητα και τι να συμπληρώσω στο προφίλ μου για να παίρνω καλύτερες προτάσεις συνιδρυτών.',
      };

  /*
   * The filter column, as a rail.
   *
   * These are the same four filters and the same sort the page has always
   * had, in the same order, with the same behaviour. What changes is that
   * they stop costing 220px of the results on every visit that is not a
   * filtering visit.
   */
  // Offered to the assistant: the rail's filters and sort and the column's
  // view switch, through the same setters. Availability is a set, so its
  // control toggles one value the way its chips do.
  const VIEWS = [
    { value: 'grid2', en: 'Two-column grid', el: 'Πλέγμα δύο στηλών' },
    { value: 'grid3', en: 'Three-column grid', el: 'Πλέγμα τριών στηλών' },
    { value: 'list', en: 'List', el: 'Λίστα' },
  ];
  usePageList([
    {
      id: 'matches',
      labelEn: 'Matches',
      labelEl: 'Αντιστοιχίσεις',
      // The two most telling reasons go with each row, so the assistant can
      // say why someone matches as the card does, in either language.
      rows: !hasToken || isLoading ? undefined : filtered.map((s) => {
        const why = reasonsOf(s).slice(0, 2).map((r) => r.en).join('; ');
        return `${s.displayName} · ${s.role ?? 'member'} · match ${s.matchScore ?? '—'}%${s.headline ? ` · ${s.headline}` : ''}${s.location ? ` · ${s.location}` : ''}${savedIds.has(s.userId) ? ' · shortlisted' : ''}${why ? ` · why: ${why}` : ''}`;
      }),
      rowsEl: !hasToken || isLoading ? undefined : filtered.map((s) => {
        const why = reasonsOf(s).slice(0, 2).map((r) => r.el).join('· ');
        return `${s.displayName} · αντιστοίχιση ${s.matchScore ?? '—'}%${s.headline ? ` · ${s.headline}` : ''}${s.location ? ` · ${s.location}` : ''}${savedIds.has(s.userId) ? ' · στη λίστα' : ''}${why ? ` · γιατί: ${why}` : ''}`;
      }),
      total: visible.length,
    },
  ]);
  // The row's own buttons as commands, over the rows on screen: the same
  // handlers the card and the list row call.
  const hitRows = (list: SearchHit[]) => rowOptions(list, (h) => h.id, (h) => h.displayName);
  const hitById = (id?: string) => filtered.find((h) => h.id === id);
  usePageControls([
    choiceControl('match_tier', 'Match strength filter', 'Φίλτρο ισχύος αντιστοίχισης', TIER_TABS, activeFilter, (v) => setActiveFilter(v as FilterKey)),
    choiceControl('role_filter', 'Role filter', 'Φίλτρο ρόλου', ROLE_TABS, roleFilter, (v) => setRoleFilter(v as RoleFilter)),
    choiceControl('sort', 'Sort matches', 'Ταξινόμηση αντιστοιχίσεων', [
      { key: 'score', labelEn: matchesEn('sort_best_match'), labelEl: matchesEl('sort_best_match') },
      { key: 'name', labelEn: matchesEn('sort_name_az'), labelEl: matchesEl('sort_name_az') },
      { key: 'recent', labelEn: matchesEn('sort_newest'), labelEl: matchesEl('sort_newest') },
    ], sortBy, (v) => setSortBy(v as SortKey)),
    choiceControl('view', 'Match layout', 'Διάταξη αντιστοιχίσεων', VIEWS, viewMode, (v) => setViewMode(v as ViewMode)),
    {
      id: 'availability',
      labelEn: 'Toggle availability filter',
      labelEl: 'Εναλλαγή φίλτρου διαθεσιμότητας',
      writes: false,
      options: AVAIL_OPTIONS.map((o) => ({ value: o.key, labelEn: o.labelEn, labelEl: o.labelEl })),
      run: (value) => {
        if (!value) return;
        setAvailFilter((prev) => {
          const next = new Set(prev);
          if (next.has(value as AvailFilter)) next.delete(value as AvailFilter);
          else next.add(value as AvailFilter);
          return next;
        });
      },
    },
    {
      id: 'connect_with',
      labelEn: 'Open a connection request to',
      labelEl: 'Άνοιγμα αιτήματος σύνδεσης προς',
      writes: false,
      options: hitRows(filtered),
      run: (v) => { const hit = hitById(v); if (hit) handleConnect(hitToProfile(hit)); },
    },
    {
      id: 'message_match',
      labelEn: 'Message match',
      labelEl: 'Μήνυμα σε αντιστοίχιση',
      writes: false,
      options: hitRows(filtered),
      run: (v) => { const hit = hitById(v); if (hit) handleMessage(hitToProfile(hit)); },
    },
    {
      id: 'shortlist_match',
      labelEn: 'Save match to shortlist',
      labelEl: 'Αποθήκευση αντιστοίχισης στη λίστα',
      writes: true,
      options: hitRows(filtered.filter((h) => !savedIds.has(h.userId))),
      // A save creates a fresh shortlist row, so removing it takes the save
      // back. Not the reverse: removing drops the row's note, which saving
      // again does not restore.
      undo: (v) => ({ control: 'unshortlist_match', value: v }),
      run: (v) => { const hit = hitById(v); return hit ? handleSave(hit.userId, hit.displayName) : ROW_GONE; },
    },
    {
      id: 'unshortlist_match',
      labelEn: 'Remove match from shortlist',
      labelEl: 'Αφαίρεση αντιστοίχισης από τη λίστα',
      writes: true,
      options: hitRows(filtered.filter((h) => savedIds.has(h.userId))),
      run: (v) => { const hit = hitById(v); return hit ? handleSave(hit.userId, hit.displayName) : ROW_GONE; },
    },
    {
      id: 'pass_match',
      labelEn: 'Pass on match',
      labelEl: 'Παράλειψη αντιστοίχισης',
      writes: true,
      options: hitRows(filtered),
      run: (v) => { const hit = hitById(v); if (hit) handlePass(hit.id, hit.displayName, hit.userId); },
      // Exact: the feedback answered with what it replaced, and unpass_match
      // puts that back on the server as well as the card on the screen.
      undo: (v) => (v ? { control: 'unpass_match', value: v } : undefined),
    },
    {
      id: 'unpass_match',
      labelEn: 'Bring back a match you passed on',
      labelEl: 'Επαναφορά αντιστοίχισης που απορρίψατε',
      writes: true,
      options: hitRows(suggestions.filter((h) => passedIds.has(h.id))),
      unavailableEn: passedIds.size ? undefined : 'You have not passed on anyone here.',
      unavailableEl: passedIds.size ? undefined : 'Δεν έχετε απορρίψει κανέναν εδώ.',
      run: (v) => { if (v && passedIds.has(v)) unpass([v]); else return ROW_GONE; },
    },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'filters',
      glyph: 'target',
      labelEn: 'Filters',
      labelEl: 'Φίλτρα',
      // The count is what keeps a collapsed rail honest: a narrowed list
      // with no visible reason reads as a broken list.
      badge: activeFilterCount || null,
      content: (
        <div className="space-y-2.5">

          {/* Role filter */}
          <Card className="shadow-sm border-border">
          <CardContent className="space-y-0.5">
          <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1.5">
          <BilingualText en={matchesEn('role')} el={matchesEl('role')} compact />
          </p>
          {ROLE_TABS.map(({ key, labelEn, labelEl, icon: Icon }) => {
          const isActive = roleFilter === key;
          return (
          <button key={key} onClick={() => setRoleFilter(key)}
          className={cn(
          'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          isActive ? 'bg-primary/10 text-primary-accessible border border-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}>
          <Icon className="icon-sm shrink-0" />
          <BilingualText en={labelEn} el={labelEl} compact />
          </button>
          );
          })}
          </CardContent>
          </Card>

          {/* Location */}
          <Card className="shadow-sm border-border">
          <CardContent className="space-y-1.5">
          <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          <BilingualText en={matchesEn('location')} el={matchesEl('location')} compact />
          </p>
          <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground pointer-events-none" />
          <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          placeholder={sayOne("City or country…", "Πόλη ή χώρα…")}
          className="w-full h-8 rounded-lg border border-border bg-background pl-7 pr-7 text-xs outline-none focus:border-primary/60 transition-colors" />
          {locationFilter && (
          <button aria-label="Clear location filter" onClick={() => setLocationFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="icon-sm" />
          </button>
          )}
          </div>
          </CardContent>
          </Card>

          {/* Availability */}
          <Card className="shadow-sm border-border">
          <CardContent className="space-y-0.5">
          <p className="px-1 pb-1.5 text-2xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
          <BilingualText en={matchesEn('availability')} el={matchesEl('availability')} compact wrap />
          </p>
          {AVAIL_OPTIONS.map(({ key, labelEn, labelEl }) => {
          const isOn = availFilter.has(key);
          return (
          <button key={key} onClick={() => setAvailFilter(prev => {
          const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next;
          })}
          className={cn('flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium leading-snug transition-all',
          isOn ? 'bg-primary/10 text-primary-accessible' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
          <span className={cn('mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-colors',
          isOn ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>
          {isOn && <span className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
          </span>
          <BilingualText en={labelEn} el={labelEl} compact wrap />
          </button>
          );
          })}
          </CardContent>
          </Card>

          {/* Clear all */}
          {hasActiveFilters && (
          <button
          onClick={() => { setActiveFilter('all'); setRoleFilter('all'); setNameSearch(''); setLocationFilter(''); setAvailFilter(new Set()); }}
          className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg text-xs text-muted-foreground border border-border hover:bg-secondary hover:text-foreground transition-colors">
          <X className="icon-sm" /> <BilingualText en={matchesEn('clear_all_filters')} el={matchesEl('clear_all_filters')} compact />
          </button>
          )}
        </div>
      ),
    },
    {
      id: 'sort',
      glyph: 'compare',
      labelEn: 'Sort',
      labelEl: 'Ταξινόμηση',
      content: (
        <div className="space-y-2.5">
          {/* Sort */}
          <Card className="shadow-sm border-border">
          <CardContent className="space-y-0.5">
          <p className="px-1 pb-1.5 text-2xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
          <BilingualText en={matchesEn('sort_by')} el={matchesEl('sort_by')} compact wrap />
          </p>
          {([
          { key: 'score'  as SortKey, labelEn: matchesEn('sort_best_match'), labelEl: matchesEl('sort_best_match'), icon: Zap },
          { key: 'name'   as SortKey, labelEn: matchesEn('sort_name_az'),    labelEl: matchesEl('sort_name_az'),    icon: ArrowUpDown },
          { key: 'recent' as SortKey, labelEn: matchesEn('sort_newest'),     labelEl: matchesEl('sort_newest'),     icon: Clock },
          ]).map(({ key, labelEn, labelEl, icon: Icon }) => (
          <button key={key} onClick={() => setSortBy(key)}
          className={cn('flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium leading-snug transition-all',
          sortBy === key ? 'bg-primary/10 text-primary-accessible border border-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
          <Icon className="mt-0.5 icon-sm shrink-0" />
          <BilingualText en={labelEn} el={labelEl} compact wrap />
          </button>
          ))}
          </CardContent>
          </Card>

        </div>
      ),
    },
    {
      id: 'next',
      glyph: 'discover',
      labelEn: 'Find more people',
      labelEl: 'Βρείτε περισσότερα άτομα',
      content: (
        <div className="space-y-2">
          <Button asChild variant="outline" className="h-auto min-h-14 w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left">
            <Link href="/discover">
              <CfbGlyph name="discover" className="icon-sm shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug">
                  <BilingualText en={matchesEn('explore')} el={matchesEl('explore')} wrap />
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  <BilingualText en="Search beyond this ranked list." el="Αναζήτηση πέρα από αυτή την κατάταξη." wrap />
                </span>
              </span>
              <ArrowRight className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];
  return (
    <AppShell
      rail={rail}
      title={matchesEn('page_title')}
      titleEl={matchesEl('page_title')}
      description={matchesEn('page_description')}
      descriptionEl={matchesEl('page_description')}
      showHelp
      askAi={askAi}
      contentClassName="overflow-x-clip"
      actions={
        <Button variant="ghost" size="sm" className="min-h-10 gap-1.5" onClick={() => void refetch()}>
          <RefreshCw className="icon-sm" />
          <BilingualText en={matchesEn('refresh')} el={matchesEl('refresh')} compact />
        </Button>
      }
    >
      <div className="min-w-0 space-y-6 overflow-x-clip pb-10">
        <FirstRunTour tourId="matches" steps={MATCHES_TOUR} ready={hasToken && !isLoading && visible.length > 0} />

        {/* ── Not authenticated ── */}
        {!hasToken && (
          <EmptyState
            title={<BilingualText en={matchesEn('sign_in_to_see')} el={matchesEl('sign_in_to_see')} />}
            description={<BilingualText en={matchesEn('sign_in_desc')} el={matchesEl('sign_in_desc')} />}
            illustration="connection"
            askAiPrompt={ASK.matchesSignedOut}
            action={
              <Button className="gap-2" asChild>
                <Link href="/login">
                  <UserPlus className="icon-sm" />
                  <BilingualText en={matchesEn('sign_in')} el={matchesEl('sign_in')} />
                </Link>
              </Button>
            }
          />
        )}

        {/* ── Error state ── */}
        {hasToken && isError && (
          <Card className="shadow-sm border-border">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                <BilingualText en={matchesEn('failed_to_load')} el={matchesEl('failed_to_load')} />
              </p>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                <BilingualText en={matchesEn('retry')} el={matchesEl('retry')} />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Loading skeletons ── */}
        {hasToken && isLoading && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <ProfileCardSkeleton key={i} variant="featured" />)}
          </div>
        )}

        {/* ── The figures, one line (docs §64) ──
            Four figure tiles and a banner ("3 excellent matches ready to
            connect · View") stood between the title and the first person:
            the first card started at 480px. The figures are one line now,
            the same four the tour describes, and "excellent" is the banner's
            View: it shows them. Undo stays in the toolbar and the toast. */}
        {hasToken && !isLoading && visible.length > 0 && (
          <PageFacts
            data-tour="matches-stats"
            labelEn="Your matches in figures"
            labelEl="Οι αντιστοιχίσεις σας σε αριθμούς"
            facts={[
              { id: 'all', value: counts.all, en: counts.all === 1 ? 'match' : 'matches', el: counts.all === 1 ? 'αντιστοίχιση' : 'αντιστοιχίσεις' },
              {
                id: 'excellent',
                value: counts.excellent > 0 ? counts.excellent : null,
                // "Ready to connect" was not measured (two of the three were
                // already connected or asked): the figure says what it counts.
                en: 'excellent (80%+)',
                el: counts.excellent === 1 ? 'εξαιρετική (80%+)' : 'εξαιρετικές (80%+)',
                onSelect: () => setActiveFilter(activeFilter === 'excellent' ? 'all' : 'excellent'),
                selected: activeFilter === 'excellent',
              },
              { id: 'avg', value: avgScore === null ? null : `${avgScore}%`, en: 'average', el: 'μέσος βαθμός' },
              { id: 'top', value: topScore === null ? null : `${topScore}%`, en: 'top score', el: 'υψηλότερος' },
            ]}
          />
        )}

        {/* ── No data at all ── */}
        {hasToken && !isLoading && visible.length === 0 && (
          <EmptyState
            title={<BilingualText en={matchesEn('no_matches_yet')} el={matchesEl('no_matches_yet')} />}
            description={<BilingualText en={matchesEn('no_matches_desc')} el={matchesEl('no_matches_desc')} />}
            illustration="rocket"
            askAiPrompt={ASK.matchesEmpty}
            action={
              <Button className="gap-2" asChild>
                <Link href="/profile/edit">
                  <BilingualText en={matchesEn('complete_profile')} el={matchesEl('complete_profile')} />
                  <ArrowRight className="icon-sm" />
                </Link>
              </Button>
            }
          />
        )}

        {/* ── Two-column: filter sidebar + results ── */}
        {hasToken && !isLoading && visible.length > 0 && (
          <div className="flex gap-4 items-start">

            {/* ── Sticky filter sidebar (desktop md+) ── */}

            {/* ── Results column ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Tier chips: the page's primary filter, at every width.
                  Secondary filters (role, location, availability) and sort
                  live in the page rail - the expanded panel that used to sit
                  here duplicated them, so it is gone rather than doubled. */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5" data-tour="matches-tiers">
                {TIER_TABS.map(tab => {
                  const isActive = activeFilter === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setActiveFilter(isActive && tab.key !== 'all' ? 'all' : tab.key)}
                      className={cn('flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all',
                        isActive ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground')}>
                      {tab.tier && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', TIER_DOT[tab.tier])} />}
                      <BilingualText en={tab.labelEn} el={tab.labelEl} compact />
                      <span className={cn('rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        {counts[tab.key]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Results toolbar */}
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2" data-tour="matches-toolbar">
                <p className="min-w-0 text-xs text-muted-foreground">
                  {/* The figures line above already says the total; this
                      count speaks only when a filter or a pass changed it. */}
                  {filtered.length > 0 && (filtered.length !== counts.all || passedIds.size > 0) && (
                    <BilingualText
                      en={`${filtered.length} ${filtered.length === 1 ? 'match' : 'matches'}${passedIds.size > 0 ? ` · ${passedIds.size} passed` : ''}`}
                      el={`${filtered.length} ${filtered.length === 1 ? 'αντιστοίχιση' : 'αντιστοιχίσεις'}${passedIds.size > 0 ? ` · ${passedIds.size} απορρίφθηκαν` : ''}`}
                      compact
                      wrap
                    />
                  )}
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}
                    className={cn('flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                      selectMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground')}
                    aria-pressed={selectMode}
                    title={bilingualAria('Select profiles to compare', 'Επιλογή προφίλ για σύγκριση')}>
                    <CheckSquare className="icon-sm" />
                    <span className="hidden sm:inline"><BilingualText en="Select" el="Επιλογή" compact /></span>
                    {selectedIds.size > 0 && <span className="rounded-full bg-primary-foreground/20 px-1 text-2xs font-bold">{selectedIds.size}</span>}
                  </button>

                  <button onClick={() => setShowSearch(s => !s)}
                    className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      showSearch ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary')}
                    aria-pressed={showSearch}
                    aria-label={bilingualAria('Search matches', 'Αναζήτηση αντιστοιχίσεων')}>
                    <Search className="icon-sm" />
                  </button>

                  <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                    {([
                      { mode: 'grid2' as ViewMode, icon: LayoutGrid, title: bilingualAria('Two columns', 'Δύο στήλες'), small: false, mobile: true },
                      { mode: 'grid3' as ViewMode, icon: LayoutGrid, title: bilingualAria('Three columns', 'Τρεις στήλες'), small: true, mobile: false },
                      { mode: 'list'  as ViewMode, icon: List,       title: bilingualAria('List', 'Λίστα'), small: false, mobile: true },
                    ] as { mode: ViewMode; icon: typeof LayoutGrid; title: string; small: boolean; mobile: boolean }[]).map(({ mode, icon: Icon, title, small, mobile }) => (
                      <button key={mode} onClick={() => setViewMode(mode)} title={title} aria-label={title} aria-pressed={viewMode === mode}
                        className={cn('h-9 items-center justify-center rounded-xl px-2 transition-all',
                          mobile ? 'flex' : 'hidden sm:flex',
                          viewMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                        <Icon className={cn('icon-sm', small && 'scale-90')} />
                        {mode === 'grid3' && <span className="ml-0.5 text-2xs font-bold">3</span>}
                      </button>
                    ))}
                  </div>

                  {lastPassed && (
                    <Button size="sm" variant="ghost" onClick={handleUndoPass} aria-label={bilingualAria('Undo the last pass', 'Αναίρεση της τελευταίας παράλειψης')} className="gap-1.5 text-xs h-8 text-muted-foreground px-2 sm:px-3">
                      <RotateCcw className="icon-sm" aria-hidden="true" />
                      <span className="hidden sm:inline"><BilingualText en="Undo" el="Αναίρεση" compact /></span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Search input (conditional) */}
              {showSearch && (
                <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                  <Input value={nameSearch} onChange={e => setNameSearch(e.target.value)}
                    placeholder={sayOne("Search by name, headline, or skill…", "Αναζήτηση με όνομα, τίτλο ή δεξιότητα…")} className="min-h-10 pl-9 text-sm" autoFocus />
                  {nameSearch && (
                    <button onClick={() => setNameSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                      <BilingualText en="Clear" el="Καθαρισμός" compact />
                    </button>
                  )}
                </div>
              )}

              {/* Active filter summary */}
              {hasActiveFilters && filtered.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <BilingualText
                    en={`Showing ${filtered.length} of ${visible.length} matches`}
                    el={`Εμφανίζονται ${filtered.length} από ${visible.length} αντιστοιχίσεις`}
                    compact
                  />
                  {nameSearch && ` · "${nameSearch}"`}
                </p>
              )}

              {/* No results for filters */}
              {filtered.length === 0 && (
                <Card className="shadow-sm border-border">
                  <CardContent className="py-12 text-center">
                    <SlidersHorizontal className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" aria-hidden="true" />
                    <p className="font-medium text-foreground mb-1"><BilingualText en="No matches for these filters" el="Καμία αντιστοίχιση για αυτά τα φίλτρα" compact /></p>
                    <p className="text-sm text-muted-foreground mb-4"><BilingualText en="Try adjusting your tier, role, or location filter" el="Αλλάξτε το φίλτρο βαθμίδας, ρόλου ή τοποθεσίας" wrap /></p>
                    <Button variant="outline" size="sm" onClick={() => { setActiveFilter('all'); setRoleFilter('all'); setNameSearch(''); setLocationFilter(''); setAvailFilter(new Set()); }}>
                      <BilingualText en="Clear all filters" el="Καθαρισμός όλων των φίλτρων" compact />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Matches grid */}
              {filtered.length > 0 && viewMode !== 'list' && (
                <div className={cn('grid grid-cols-1 gap-4',
                  viewMode === 'grid3' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}
                  data-tour="matches-grid">
                  {filtered.map((hit) => {
                    const profile = hitToProfile(hit);
                    return (
                      <MatchCard
                        key={hit.id}
                        id={hit.id}
                        userId={hit.userId}
                        displayName={hit.displayName}
                        headline={hit.headline}
                        avatarUrl={hit.avatarUrl}
                        role={hit.role}
                        location={hit.location}
                        skills={hit.skillNames ?? []}
                        compatibilityScore={scoreOf(hit)}
                        matchReasons={[]}
                        reasons={reasonsOf(hit)}
                        connection={connectionOf(hit.userId)}
                        onAccept={() => void handleAccept(hit)}
                        isBookmarked={savedIds.has(hit.userId)}
                        commitment={commitmentWith.get(hit.userId) ?? null}
                        onLike={() => handleConnect(profile)}
                        onPass={() => handlePass(hit.id, hit.displayName, hit.userId)}
                        onMessage={() => handleMessage(profile)}
                        onBookmark={() => void handleSave(hit.userId, hit.displayName)}
                        onBreakdown={() => setBreakdownTarget(hit)}
                        onClick={!selectMode ? () => setPreviewTarget(hit) : undefined}
                        isSelected={selectMode ? selectedIds.has(hit.id) : undefined}
                        onSelect={selectMode ? () => setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(hit.id)) next.delete(hit.id); else next.add(hit.id);
                          return next;
                        }) : undefined}
                      />
                    );
                  })}
                </div>
              )}

              {/* Matches list */}
              {filtered.length > 0 && viewMode === 'list' && (
                <div className="space-y-3">
                  {filtered.map((hit) => {
                    const profile = hitToProfile(hit);
                    return (
                      <MatchListRow
                        key={hit.id}
                        hit={hit}
                        reasons={reasonsOf(hit)}
                        isSaved={savedIds.has(hit.userId)}
                        connection={connectionOf(hit.userId)}
                        commitment={commitmentWith.get(hit.userId) ?? null}
                        onConnect={() => handleConnect(profile)}
                        onAccept={() => void handleAccept(hit)}
                        onMessage={() => handleMessage(profile)}
                        onPass={() => handlePass(hit.id, hit.displayName, hit.userId)}
                        onSave={() => void handleSave(hit.userId, hit.displayName)}
                        onBreakdown={() => setBreakdownTarget(hit)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Results footer */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>
                    <BilingualText
                      en={`${filtered.length} ${filtered.length === 1 ? 'match' : 'matches'} shown${passedIds.size > 0 ? ` · ${passedIds.size} passed` : ''}`}
                      el={`${filtered.length} ${filtered.length === 1 ? 'αντιστοίχιση εμφανίζεται' : 'αντιστοιχίσεις εμφανίζονται'}${passedIds.size > 0 ? ` · ${passedIds.size} ${passedIds.size === 1 ? 'απορρίφθηκε' : 'απορρίφθηκαν'}` : ''}`}
                      compact
                      wrap
                    />
                  </span>
                  {passedIds.size > 0 ? (
                    <button
                      type="button"
                      onClick={() => unpass([...passedIds])}
                      className="tap-target-y font-medium text-primary-accessible underline-offset-4 hover:underline"
                    >
                      <BilingualText en="Show the passed ones again" el="Επαναφορά όσων απορρίψατε" compact />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick-preview slide panel (b3) ── */}
      {previewTarget && (() => {
        const previewProfile = hitToProfile(previewTarget);
        return (
          <MatchPreviewPanel
            hit={previewTarget}
            reasons={reasonsOf(previewTarget)}
            savedIds={savedIds}
            connection={connectionOf(previewTarget.userId)}
            commitment={commitmentWith.get(previewTarget.userId) ?? null}
            onClose={() => setPreviewTarget(null)}
            onConnect={() => { handleConnect(previewProfile); setPreviewTarget(null); }}
            onAccept={() => void handleAccept(previewTarget)}
            onMessage={() => { handleMessage(previewProfile); setPreviewTarget(null); }}
            onSave={() => void handleSave(previewTarget.userId, previewTarget.displayName)}
            onPass={() => { handlePass(previewTarget.id, previewTarget.displayName, previewTarget.userId); setPreviewTarget(null); }}
            onBreakdown={() => { setBreakdownTarget(previewTarget); setPreviewTarget(null); }}
          />
        );
      })()}

      {/* ── Bulk action bar (b4) ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-modal animate-in slide-in-from-bottom duration-200 lg:bottom-6">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-border/60" />
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
            onClick={() => {
              const ids = [...selectedIds].slice(0, 4).join(',');
              router.push(`/compare?ids=${ids}`);
            }}>
            <BarChart3 className="icon-sm" /> <BilingualText en="Compare" el="Σύγκριση" compact />
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs hover:text-destructive-accessible"
            onClick={() => {
              filtered.forEach(h => {
                if (selectedIds.has(h.id)) handlePass(h.id, h.displayName, h.userId);
              });
              setSelectedIds(new Set());
              setSelectMode(false);
            }}>
            <X className="icon-sm" /> <BilingualText en="Pass All" el="Παράλειψη όλων" compact />
          </Button>
          <button aria-label="Exit selection" onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1">
            <X className="icon-sm" />
          </button>
        </div>
      )}

      <CompatibilityModal
        hit={breakdownTarget}
        reasons={breakdownTarget ? reasonsOf(breakdownTarget) : []}
        viewerSkills={viewer?.skills ?? []}
        open={!!breakdownTarget}
        onClose={() => setBreakdownTarget(null)}
      />

      {connectionTarget && (
        <ConnectionRequestDialog
          open={showConnectionDialog}
          onOpenChange={(open) => {
            setShowConnectionDialog(open);
            if (!open) setConnectionTarget(null);
          }}
          recipient={{
            id: connectionTarget.userId,
            displayName: connectionTarget.displayName,
            avatarUrl: connectionTarget.avatarUrl,
            role: connectionTarget.role,
            headline: connectionTarget.headline,
          }}
          onSend={handleSendConnection}
        />
      )}
    </AppShell>
  );
}
