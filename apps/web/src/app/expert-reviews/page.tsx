'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  listExpertReviews,
  type ExpertReviewItem,
} from '@/lib/api';
import { REVIEW_AREAS, areaKeys, directoryHref } from '@/lib/mentoring/services';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  DollarSign,
  Eye,
  FileText,
  Lightbulb,
  MessageCircle,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Star,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailStats } from '@/components/layout/RailParts';
import { Button } from '@/components/ui/button';
import { WithDisabledReason } from '@/components/common/UnavailableButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, initialsOf } from '@/lib/utils';
import { STATUS, scoreTenPointClass, type StatusTone } from '@/lib/semantic-colors';
import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { qk } from '@/lib/query-keys';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';
import { FactLine } from '@/components/common/FactLine';
import { CardHead, CardFoot } from '@/components/common/CardAnatomy';
import { attachDemoPhotos } from '@/lib/demo/photos';
import { ASK } from '@/lib/page-questions';

/** Why the one disabled control is disabled, in both languages. */
const MESSAGE_HINT = bilingualAria(
  'Message expert. Sample review - there is no expert to write to',
  'Μήνυμα στον ειδικό. Δείγμα αξιολόγησης - δεν υπάρχει ειδικός για μήνυμα',
);

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewStatus = 'requested' | 'accepted' | 'in_progress' | 'submitted' | 'declined' | 'expired';
type ReviewType =
  | 'pitch_deck' | 'business_model' | 'financial_model' | 'legal_structure'
  | 'market_analysis' | 'go_to_market' | 'technical_architecture' | 'product_strategy' | 'general';

interface ExpertReview {
  id: string;
  /** The expert's user id; a sample row has none. */
  expertId?: string;
  expertName: string;
  expertTitle: string;
  expertAvatar?: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  requestMessage?: string;
  dueDate?: string;
  submittedAt?: string;
  scoreOverall?: number;
  summaryFeedback?: string;
  strengthsJson?: { area: string; comment: string }[];
  improvementsJson?: { area: string; recommendation: string }[];
  scoresByArea?: Record<string, number>;
  isPaid: boolean;
  agreedFee?: number;
  rating?: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const REVIEW_TYPE_TONE: Record<ReviewType, StatusTone> = {
  pitch_deck: 'info',
  business_model: 'accent',
  financial_model: 'success',
  legal_structure: 'warning',
  market_analysis: 'info',
  go_to_market: 'warning',
  technical_architecture: 'accent',
  product_strategy: 'accent',
  general: 'neutral',
};

/** An area's two names, from the directory's vocabulary, so both pages say the same. */
const areaNames = (key: ReviewType) => ({ label: REVIEW_AREAS[key].en, labelEl: REVIEW_AREAS[key].el });

const REVIEW_TYPE_CONFIG: Record<ReviewType, { label: string; labelEl: string; icon: React.ElementType; tone: StatusTone }> = {
  pitch_deck:             { ...areaNames('pitch_deck'),             icon: FileText,    tone: 'info' },
  business_model:         { ...areaNames('business_model'),         icon: Target,      tone: 'accent' },
  financial_model:        { ...areaNames('financial_model'),        icon: DollarSign,  tone: 'success' },
  legal_structure:        { ...areaNames('legal_structure'),        icon: Scale,       tone: 'warning' },
  market_analysis:        { ...areaNames('market_analysis'),        icon: BarChart3,   tone: 'info' },
  go_to_market:           { ...areaNames('go_to_market'),           icon: TrendingUp,  tone: 'warning' },
  technical_architecture: { ...areaNames('technical_architecture'), icon: Code2,       tone: 'accent' },
  product_strategy:       { ...areaNames('product_strategy'),       icon: Lightbulb,   tone: 'accent' },
  general:                { ...areaNames('general'),                icon: Eye,         tone: 'neutral' },
};

const REVIEW_STATUS_TONE: Record<ReviewStatus, StatusTone> = {
  requested: 'info',
  accepted: 'success',
  in_progress: 'warning',
  submitted: 'success',
  declined: 'danger',
  expired: 'neutral',
};

const STATUS_CONFIG: Record<ReviewStatus, { label: string; labelEl: string; tone: StatusTone; icon: React.ElementType }> = {
  requested:   { label: 'Requested', labelEl: 'Ζητήθηκε',   tone: 'info',    icon: Clock },
  accepted:    { label: 'Accepted', labelEl: 'Αποδεκτή',    tone: 'success', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', labelEl: 'Σε εξέλιξη', tone: 'warning', icon: RefreshCw },
  submitted:   { label: 'Submitted', labelEl: 'Υποβλήθηκε',   tone: 'success', icon: CheckCircle2 },
  declined:    { label: 'Declined', labelEl: 'Απορρίφθηκε',    tone: 'danger',  icon: XCircle },
  expired:     { label: 'Expired', labelEl: 'Έληξε',     tone: 'neutral', icon: AlertTriangle },
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const DEMO_REVIEWS: ExpertReview[] = attachDemoPhotos([
  {
    id: '1',
    expertName: 'Stavros Nikolaou',
    expertTitle: 'Serial Founder & Pitch Coach',
    reviewType: 'pitch_deck',
    status: 'submitted',
    requestMessage: 'Looking for feedback on our Series A deck before approaching investors.',
    submittedAt: '2026-03-20T11:00:00Z',
    scoreOverall: 7,
    summaryFeedback: 'Strong team slide and clear market opportunity. The financial projections need more realistic assumptions and the problem slide should be sharper. The "ask" slide needs more specific use of funds.',
    strengthsJson: [
      { area: 'Team', comment: 'Clear credibility signals, strong domain expertise shown.' },
      { area: 'Market Size', comment: 'Well-researched TAM/SAM/SOM breakdown with credible sources.' },
    ],
    improvementsJson: [
      { area: 'Problem Statement', recommendation: 'Lead with a single, specific customer pain — avoid generic statements.' },
      { area: 'Financial Projections', recommendation: 'Add explicit assumption breakdown: CAC, LTV, churn rate, unit economics.' },
      { area: 'Use of Funds', recommendation: 'Break down the €500K ask into milestones, not just categories.' },
    ],
    scoresByArea: { storytelling: 8, market: 9, financials: 5, team: 9, design: 7, ask: 6 },
    isPaid: true,
    agreedFee: 200,
    rating: 5,
  },
  {
    id: '2',
    expertName: 'Katerina Vassiliou',
    expertTitle: 'CFO Advisor & Financial Modelling Expert',
    reviewType: 'financial_model',
    status: 'in_progress',
    requestMessage: 'Please review our 3-year financial model for our SaaS product.',
    dueDate: '2026-03-28T23:59:00Z',
    isPaid: true,
    agreedFee: 350,
  },
  {
    id: '3',
    expertName: 'Nikos Papadakis',
    expertTitle: 'GTM Strategist',
    reviewType: 'go_to_market',
    status: 'requested',
    requestMessage: 'We need feedback on our go-to-market strategy for EU market expansion.',
    isPaid: false,
  },
]);

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ExpertReview }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[review.status];
  const type = REVIEW_TYPE_CONFIG[review.reviewType];
  const StatusIcon = status.icon;
  // Empty lists are not feedback: "See feedback" sat on every requested and
  // in-progress review and opened an empty panel (docs §90).
  const hasFeedback = Boolean(review.strengthsJson?.length || review.improvementsJson?.length || review.scoresByArea);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <CardHead
            mark={(
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.expertAvatar} alt="" />
                <AvatarFallback className="bg-primary/10 font-semibold text-primary-accessible">
                  {initialsOf(review.expertName)}
                </AvatarFallback>
              </Avatar>
            )}
            title={review.expertName}
            aside={(
              <Badge variant="outline" className="gap-1 text-xs">
                <StatusIcon className={cn('icon-sm', STATUS[status.tone].icon)} aria-hidden="true" />
                <BilingualText en={status.label} el={status.labelEl} compact />
              </Badge>
            )}
          />

          {/* The role is short beside the status pill, so it takes the full
              card width and stays one line. Kind, fee and score share the
              next line: facts on the left, the figure on the right. */}
          {review.expertTitle ? <p className="card-subtitle">{review.expertTitle}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <FactLine
              items={[
                <BilingualText key="type" en={type.label} el={type.labelEl} compact />,
                review.isPaid && review.agreedFee ? <span key="fee" className="tabular-nums">€{review.agreedFee}</span> : null,
                !review.isPaid ? <BilingualText key="free" en="Free" el="Δωρεάν" compact /> : null,
                review.dueDate && review.status !== 'submitted' ? (
                  <span key="due" className={STATUS.warning.icon}>
                    {/* Pinned to UTC on both sides so the server pass and
                        hydration agree on the day. */}
                    <BilingualText
                      en={`Due ${new Date(review.dueDate).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' })}`}
                      el={`Προθεσμία ${new Date(review.dueDate).toLocaleDateString('el-GR', { timeZone: 'UTC', day: 'numeric', month: 'short' })}`}
                      compact
                    />
                  </span>
                ) : null,
              ]}
            />
            {review.scoreOverall ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-xs text-muted-foreground">
                  <BilingualText en="Overall score:" el="Συνολική βαθμολογία:" compact />{' '}
                  <span className={cn('card-body font-semibold tabular-nums', scoreTenPointClass(review.scoreOverall))}>
                    {review.scoreOverall}/10
                  </span>
                </p>
                {review.rating ? (
                  // Five stars beside "7/10" read as the expert's score; they
                  // are the founder's rating of the review, and now say so.
                  <div className="flex items-center gap-1.5">
                    <div data-keep-icon="" className="flex items-center gap-0.5" role="img" aria-label={bilingualAria(`Your rating: ${review.rating} of 5`, `Η βαθμολογία σας: ${review.rating} από 5`)}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('icon-sm', i < review.rating! ? cn('fill-current', STATUS.warning.icon) : 'text-muted-foreground/30')} aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">
                      <BilingualText en="Your rating" el="Η βαθμολογία σας" compact />
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* What was asked, while the review is open: the expert reads it,
            and the card never showed it to the one who sent it (docs §111). */}
        {review.requestMessage && review.status !== 'submitted' ? (
          <p className="card-body line-clamp-3 text-muted-foreground">
            <BilingualText en="Your request:" el="Το αίτημά σας:" compact />{' '}
            <span className="text-foreground">{review.requestMessage}</span>
          </p>
        ) : null}

        {review.summaryFeedback && (
          <p className="card-body line-clamp-2 italic text-muted-foreground">
            “{review.summaryFeedback}”
          </p>
        )}

        <CardFoot end>
          {/* A review from the API carries the expert's user id, so the
              conversation opens; it was disabled on every row, real ones
              included (docs §90). A sample row has no one to write to. */}
          {review.expertId ? (
            <Button size="sm" variant="outline" className="gap-1" asChild>
              <Link
                href={`/messages?to=${encodeURIComponent(review.expertId)}`}
                aria-label={bilingualAria(`Message expert: ${review.expertName}`, `Μήνυμα στον ειδικό: ${review.expertName}`)}
              >
                <MessageCircle className="icon-sm" aria-hidden="true" />
                <BilingualText en="Message expert" el="Μήνυμα στον ειδικό" compact wrap />
              </Link>
            </Button>
          ) : (
            <WithDisabledReason
              reasonEn="Sample review - there is no expert to write to"
              reasonEl="Δείγμα αξιολόγησης - δεν υπάρχει ειδικός για μήνυμα"
            >
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                aria-label={MESSAGE_HINT}
                disabled
              >
                <MessageCircle className="icon-sm" aria-hidden="true" />
                <BilingualText en="Message expert" el="Μήνυμα στον ειδικό" compact wrap />
              </Button>
            </WithDisabledReason>
          )}
          {/* "View full review" is gone rather than wired: "See feedback"
              already expands the full review in place, and did so while
              that one did nothing. Two buttons for one action is the defect. */}
          {hasFeedback ? (
            <Button size="sm" variant="ghost" className="gap-0.5" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
              <BilingualText
                en={expanded ? 'Collapse' : 'See feedback'}
                el={expanded ? 'Σύμπτυξη' : 'Δείτε την ανατροφοδότηση'}
                compact
              />
              <ChevronRight className={cn('icon-sm transition-transform', expanded && 'rotate-90')} aria-hidden="true" />
            </Button>
          ) : null}
        </CardFoot>
      </CardContent>

      {/* Expanded feedback */}
      {expanded && hasFeedback && (
        <div className="space-y-4 border-t border-border bg-muted/30 p-4 sm:p-6">
          {/* Scores by area */}
          {review.scoresByArea && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><BilingualText en="Scores by Area" el="Βαθμοί ανά τομέα" compact /></p>
              <div className="space-y-1.5">
                {Object.entries(review.scoresByArea).map(([area, score]) => (
                  <div key={area} className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground capitalize w-24 shrink-0">{area}</span>
                    <Progress value={score * 10} className="flex-1 h-1.5" />
                    <span className={cn('text-xs font-semibold w-8 text-right', scoreTenPointClass(score))}>
                      {score}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {review.strengthsJson && review.strengthsJson.length > 0 && (
            <div>
              <p className={cn('mb-2 flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider', STATUS.success.icon)}><CheckCircle2 className="h-3 w-3" aria-hidden="true" /><BilingualText en="Strengths" el="Δυνατά σημεία" compact /></p>
              <ul className="space-y-2">
                {review.strengthsJson.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="font-semibold text-foreground shrink-0">{s.area}:</span>
                    <span className="text-muted-foreground">{s.comment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {review.improvementsJson && review.improvementsJson.length > 0 && (
            <div>
              <p className={cn('mb-2 flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider', STATUS.warning.icon)}><Lightbulb className="h-3 w-3" aria-hidden="true" /><BilingualText en="Recommendations" el="Προτάσεις" compact /></p>
              <ul className="space-y-2">
                {review.improvementsJson.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="font-semibold text-foreground shrink-0">{s.area}:</span>
                    <span className="text-muted-foreground">{s.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** A read that failed, said once, with the way to try again (docs §90). */
function FailedRead({ en, el, onRetry, busy = false }: { en: string; el: string; onRetry: () => void; busy?: boolean }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
      <p role="alert"><BilingualText en={en} el={el} wrap /></p>
      <Button size="sm" variant="outline" disabled={busy} onClick={onRetry}>
        <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

/** `[{ area, comment }]` out of a free JSON column, defensively. */
function notes(raw: Record<string, unknown>[], key: 'comment' | 'recommendation') {
  return raw
    .map((entry) => ({
      area: typeof entry?.area === 'string' ? entry.area : '',
      [key]: typeof entry?.[key] === 'string' ? (entry[key] as string) : '',
    }))
    .filter((entry) => entry.area.length > 0) as never;
}

/**
 * One review, from the ExpertReview row it already is.
 *
 * This page is the requester's side, so the person named on every card is the
 * expert - the requester is whoever is reading.
 */
function toPageReview(row: ExpertReviewItem): ExpertReview {
  return {
    id: row.id,
    expertId: row.expert?.id || undefined,
    expertName: row.expert?.displayName ?? 'An expert',
    expertTitle: row.expert?.headline ?? '',
    expertAvatar: row.expert?.avatarUrl ?? undefined,
    reviewType: row.reviewType,
    status: row.status,
    requestMessage: row.requestMessage ?? undefined,
    dueDate: row.dueDate ?? undefined,
    submittedAt: row.submittedAt ?? undefined,
    scoreOverall: row.scoreOverall ?? undefined,
    summaryFeedback: row.summaryFeedback ?? undefined,
    strengthsJson: notes(row.strengths, 'comment'),
    improvementsJson: notes(row.improvements, 'recommendation'),
    scoresByArea: Object.keys(row.scoresByArea).length > 0 ? row.scoresByArea : undefined,
    isPaid: row.isPaid,
    agreedFee: row.agreedFee ?? undefined,
    rating: row.rating ?? undefined,
  };
}

/** One expert, from the directory the module serves. */
export default function ExpertReviewsPage() {
  const [activeTab, setActiveTab] = useState('my-reviews');
  const { showDemoData } = useDemoData();
  const router = useRouter();

  /*
   * The founder's own reviews, from the module that now reads ExpertReview.
   * `side: 'requester'` is what keeps an expert's own requests out of the
   * queue of requests made of them.
   */
  const { data: reviewData, isLoading: reviewsLoading, isError: reviewsError, isFetching: reviewsFetching, refetch: refetchReviews } = useQuery({
    queryKey: qk('expert-reviews', 'requester'),
    queryFn: () => listExpertReviews({ side: 'requester', limit: 50 }),
    staleTime: 60_000,
    retry: 0,
  });

  const liveReviews = useMemo(
    () => (reviewData?.reviews ?? []).map(toPageReview),
    [reviewData],
  );

  const myReviews =
    liveReviews.length > 0
      ? liveReviews
      : reviewsLoading
        ? []
        : showDemoData
          ? DEMO_REVIEWS
          : [];

  /*
   * The expert list was the mentor directory again - the same people, read
   * a second time, and its "Request a review" opened Mentors without the
   * person. Experts are found in the one directory now, with "An expert
   * review" chosen, where the request is sent to the person on the card
   * (owner, 2026-10-28; docs §90.5, §111).
   */
  // A list not yet read is not empty (docs §90).
  const sampleReviews = liveReviews.length === 0 && !reviewsLoading && showDemoData;
  const reviewsFailed = reviewsError && !reviewData && !sampleReviews;
  const submitted = myReviews.filter((r) => r.status === 'submitted');
  const pending = myReviews.filter((r) => r.status !== 'submitted' && r.status !== 'declined');

  const reviewsEmpty = !reviewsLoading && !reviewsFailed && myReviews.length === 0;

  // Offered to the assistant: the tab, and finding an expert by area, which
  // opens the one directory with "An expert review" and the area chosen.
  usePageList([
    { id: 'my_reviews', labelEn: 'My reviews', labelEl: 'Οι αξιολογήσεις μου', rows: reviewsLoading ? undefined : myReviews.map((r) => `${r.expertName} · ${REVIEW_TYPE_CONFIG[r.reviewType]?.label ?? r.reviewType} · ${r.status}${r.scoreOverall != null ? ` · score ${r.scoreOverall}` : ''}${r.dueDate ? ` · due ${r.dueDate.slice(0, 10)}` : ''}`), sample: sampleReviews },
  ]);
  usePageControls([
    choiceControl('expert_tab', 'Expert reviews section', 'Ενότητα αξιολογήσεων', [
      { value: 'my-reviews', en: 'My reviews', el: 'Οι αξιολογήσεις μου' },
      { value: 'insights', en: 'Insights', el: 'Αναλύσεις' },
    ], activeTab, setActiveTab),
    {
      id: 'find_expert',
      labelEn: 'Find an expert in the mentor directory, for',
      labelEl: 'Εύρεση ειδικού στον κατάλογο μεντόρων, για',
      writes: false,
      options: [
        { value: 'any', labelEn: 'Any area', labelEl: 'Οποιοσδήποτε τομέας' },
        ...areaKeys('review').map((key) => ({ value: key, labelEn: REVIEW_TYPE_CONFIG[key as ReviewType].label, labelEl: REVIEW_TYPE_CONFIG[key as ReviewType].labelEl })),
      ],
      run: (v) => router.push(directoryHref('review', v && v !== 'any' ? v : null)),
    },
  ]);

  // Over the scored reviews only: a submitted review without a score made it 0/0.
  const scored = submitted.filter((r) => r.scoreOverall);
  const avgScore = scored.length
    ? scored.reduce((acc, r) => acc + (r.scoreOverall ?? 0), 0) / scored.length
    : null;

  /*
   * The column leads with the tabs and the reviews. The four counts and the
   * domain chips sat above the first card; they live in the rail now. Request
   * review stays: it is this page's next step, not another surface.
   */
  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'award',
      labelEn: 'At a glance',
      labelEl: 'Με μια ματιά',
      content: (
        <RailStats
          items={[
            // A figure that was not read is a dash, never 0 (docs §90).
            { key: 'total', label: 'Total reviews', labelEl: 'Συνολικές αξιολογήσεις', value: reviewsFailed ? '—' : myReviews.length, icon: FileText, tone: 'bg-status-accent-bg text-status-accent' },
            { key: 'pending', label: 'In progress', labelEl: 'Σε εξέλιξη', value: reviewsFailed ? '—' : pending.length, icon: Clock, tone: 'bg-status-warning-bg text-status-warning' },
            { key: 'done', label: 'Completed', labelEl: 'Ολοκληρωμένες', value: reviewsFailed ? '—' : submitted.length, icon: CheckCircle2, tone: 'bg-status-success-bg text-status-success' },
            { key: 'avg', label: 'Avg score', labelEl: 'Μέση βαθμολογία', value: avgScore ? `${avgScore.toFixed(1)}/10` : '—', icon: BarChart3, tone: 'bg-status-info-bg text-status-info' },
          ]}
        />
      ),
    },
    {
      id: 'request',
      glyph: 'sliders',
      labelEn: 'Request a review',
      labelEl: 'Αίτημα αξιολόγησης',
      content: (
        // The areas filtered an expert list here; the list is the mentor
        // directory now, so each opens it narrowed to that area (docs §111).
        <div className="space-y-1">
          {areaKeys('review').map((key) => {
            const cfg = REVIEW_TYPE_CONFIG[key as ReviewType];
            return (
              <RailAction key={key} icon={cfg.icon} en={cfg.label} el={cfg.labelEl} onClick={() => router.push(directoryHref('review', key))} />
            );
          })}
          <RailAction icon={Search} en="All experts" el="Όλοι οι ειδικοί" onClick={() => router.push(directoryHref('review'))} />
        </div>
      ),
    },
    {
      id: 'related',
      glyph: 'flag',
      labelEn: 'Linked pages',
      labelEl: 'Συνδεδεμένες σελίδες',
      content: (
        <div className="space-y-1">
          <RailAction icon={Target} en="Open readiness" el="Άνοιγμα ετοιμότητας" onClick={() => router.push('/readiness')} />
          <RailAction icon={FileText} en="Open pitch deck" el="Άνοιγμα pitch deck" onClick={() => router.push('/builder/pitch-deck')} />
          <RailAction icon={DollarSign} en="Open fundraising" el="Άνοιγμα χρηματοδότησης" onClick={() => router.push('/fundraising')} />
        </div>
      ),
    },
  ];

  return (
    <AppShell showHelp rail={rail} askAi={ASK.expertReviews}>
      <div className="space-y-6 pb-10">

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-3">
            <TabsList className="h-9">
              <TabsTrigger value="my-reviews" className="text-xs">
                <BilingualText en="My Reviews" el="Οι αξιολογήσεις μου" compact />
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">
                <BilingualText en="Insights" el="Αναλύσεις" compact />
              </TabsTrigger>
            </TabsList>
            {/* It opens the mentor directory with "An expert review" chosen;
                the empty My Reviews carries its own "Find an expert". */}
            {activeTab === 'my-reviews' && reviewsEmpty ? null : (
              <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
                <Link href={directoryHref('review')}>
                  <Plus className="icon-sm" aria-hidden="true" />{' '}
                  <BilingualText en="Request review" el="Αίτημα αξιολόγησης" compact wrap />
                </Link>
              </Button>
            )}
          </div>

          {/* My Reviews */}
          <TabsContent value="my-reviews" className="mt-4 space-y-3">
            {reviewsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
              </div>
            ) : null}
            {reviewsFailed ? (
              <FailedRead
                en="Your reviews could not be read just now."
                el="Οι αξιολογήσεις σας δεν διαβάστηκαν αυτή τη στιγμή."
                onRetry={() => void refetchReviews()}
                busy={reviewsFetching}
              />
            ) : null}
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <BilingualText en="Active Requests" el="Ενεργά αιτήματα" compact />
                </p>
                <div className="space-y-4">{pending.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
              </div>
            )}
            {submitted.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <BilingualText en="Completed Reviews" el="Ολοκληρωμένες αξιολογήσεις" compact />
                </p>
                <div className="space-y-4">{submitted.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
              </div>
            )}
            {reviewsEmpty && (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Award className="h-7 w-7 text-primary-accessible" />
                </div>
                <div>
                  <p className="font-medium text-foreground"><BilingualText en="No reviews yet" el="Δεν υπάρχουν κριτικές ακόμα" compact /></p>
                  <p className="mt-1 text-sm text-muted-foreground"><BilingualText en="Request expert feedback on your pitch, financials, or strategy." el="Ζητήστε γνώμη ειδικού για το pitch, τα οικονομικά ή τη στρατηγική σας." wrap /></p>
                </div>
                <Button size="sm" asChild>
                  <Link href={directoryHref('review')}><BilingualText en="Find an expert" el="Βρείτε ειδικό" compact /></Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="mt-4 space-y-4">
            {reviewsFailed ? (
              <FailedRead
                en="Your reviews could not be read just now."
                el="Οι αξιολογήσεις σας δεν διαβάστηκαν αυτή τη στιγμή."
                onRetry={() => void refetchReviews()}
                busy={reviewsFetching}
              />
            ) : submitted.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <BilingualText en="Complete your first review to see insights." el="Ολοκληρώστε την πρώτη σας αξιολόγηση για να δείτε στοιχεία." wrap />
              </div>
            ) : (
              <>
                {/* Score breakdown from completed reviews */}
                {submitted.filter((r) => r.scoresByArea).map((r) => (
                  <Card key={r.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="icon-sm text-muted-foreground" />
                        <BilingualText
                          en={`${REVIEW_TYPE_CONFIG[r.reviewType].label} — Detailed Scores`}
                          el={`${REVIEW_TYPE_CONFIG[r.reviewType].labelEl} — Αναλυτικές βαθμολογίες`}
                          compact
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(r.scoresByArea!).map(([area, score]) => (
                        <div key={area} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground capitalize w-28 shrink-0">{area}</span>
                          <Progress value={score * 10} className="flex-1 h-2" />
                          <span className={cn(
                            'w-8 text-right text-xs font-bold tabular-nums',
                            scoreTenPointClass(score),
                          )}>
                            {score}/10
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}

                {/* Summary recommendations */}
                {submitted.filter((r) => r.improvementsJson?.length).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className={cn('icon-sm', STATUS.warning.icon)} /> <BilingualText en="Top Recommendations" el="Κορυφαίες προτάσεις" compact />
                      </CardTitle>
                    </CardHeader>
                    {/* One row per recommendation, hairlines between them: each
                        was a warning-tinted box inside the card. */}
                    <CardContent className="card-rows">
                      {submitted.flatMap((r) => (r.improvementsJson ?? []).slice(0, 2).map((imp, i) => (
                        <div key={`${r.id}-${i}`} className="flex gap-2">
                          <AlertTriangle className={cn('icon-sm shrink-0 mt-0.5', STATUS.warning.icon)} aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{imp.area}</p>
                            <p className="text-xs text-muted-foreground">{imp.recommendation}</p>
                          </div>
                        </div>
                      )))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
