import type { ReactNode } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type VerificationMethod = string;
type NeedCardView = {
  kind: string;
  title: string;
  exists: string;
  goal: string;
  missing: string;
  offer: { role: string; equity: string | null; hoursPerWeek: number; scope: string };
  category: string;
  place: string | null;
  isRemote: boolean;
  stage: string;
  commitment: string;
  evidence?: Array<{ id: string; count?: number; value?: boolean }>;
  version?: number;
  outcome?: 'open' | 'in_discussion' | 'agreed' | 'closed';
  closedReason?: string | null;
  owner?: {
    displayName: string;
    headline: string | null;
    avatarUrl?: string | null;
    verifiedMethods?: readonly VerificationMethod[];
  };
};

type Presentation = 'current' | 'proposed';

const CMT = {
  exists: { en: 'What already exists', el: 'Τι υπάρχει ήδη' },
  goal: { en: 'The outcome it is for', el: 'Το αποτέλεσμα που επιδιώκεται' },
  missing: { en: 'Who is missing', el: 'Ποιος λείπει' },
  offer: { en: 'What is offered', el: 'Τι προσφέρεται' },
  evidence: { en: 'From their workspace', el: 'Από τον χώρο εργασίας τους' },
  per_week: { en: 'h/week', el: 'ώρ./εβδ.' },
  version: { en: 'version', el: 'έκδοση' },
  filters: { en: 'Details', el: 'Λεπτομέρειες' },
  remote: { en: 'Remote', el: 'Εξ αποστάσεως' },
};

const NON_GUARANTEE_COPY = {
  en: 'CoFounderBay organises the decision. It does not promise funding, income or returns.',
  el: 'Το CoFounderBay οργανώνει την απόφαση. Δεν υπόσχεται χρηματοδότηση, εισόδημα ή αποδόσεις.',
};

function BilingualText({
  en,
  el,
}: {
  en: string;
  el: string;
  compact?: boolean;
  wrap?: boolean;
}) {
  return <>{el || en}</>;
}

function useLanguagePreference() {
  return { primary: 'el' as const };
}

function kindCopy(kind: string) {
  return kind === 'cofounder'
    ? { en: 'Co-founder role', el: 'Θέση συνιδρυτή' }
    : { en: kind, el: kind };
}

function evidenceCopy(item: { id: string; count?: number; value?: boolean }) {
  if (item.id === 'milestone_completed' && item.count) {
    return {
      en: `${item.count} milestone completed`,
      el: `${item.count} ορόσημο ολοκληρωμένο`,
    };
  }
  if (item.id === 'work_email_verified' && item.value) {
    return { en: 'Verified work email', el: 'Επαληθευμένο email' };
  }
  return undefined;
}

function StatusText({ value }: { value: string }) {
  const labels: Record<string, string> = {
    idea: 'Ιδέα',
    part_time: 'Μερική απασχόληση',
  };
  return <>{labels[value] ?? value}</>;
}

function OutcomeChip({ outcome }: { outcome: NonNullable<NeedCardView['outcome']> }) {
  const labels = {
    open: 'Ανοιχτή',
    in_discussion: 'Σε συζήτηση',
    agreed: 'Συμφωνήθηκε',
    closed: 'Κλειστή',
  };
  return (
    <span className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary-accessible">
      {labels[outcome]}
    </span>
  );
}

function VerifiedBadge({
  methods,
}: {
  methods: readonly VerificationMethod[];
  variant: 'mark';
}) {
  if (!methods.length) return null;
  return (
    <BadgeCheck
      aria-label="Verified: Work email · Επαληθευμένο προφίλ: Εταιρικό email"
      className="h-4 w-4 shrink-0 text-status-success"
      strokeWidth={1.8}
    />
  );
}

function NonGuaranteeNote() {
  return (
    <p className="card-body text-muted-foreground">
      <BilingualText {...NON_GUARANTEE_COPY} wrap />
    </p>
  );
}

function Field({
  label,
  tone = 'lead',
  presentation,
  children,
}: {
  label: { en: string; el: string };
  tone?: 'lead' | 'aside' | 'offer' | 'meta';
  presentation: Presentation;
  children: ReactNode;
}) {
  const proposed = presentation === 'proposed';
  return (
    <div
      data-card-field={tone}
      className={cn(proposed && tone === 'offer' && 'rounded-md bg-primary/5')}
    >
      <dt
        className={cn(
          'text-xs',
          proposed && 'font-medium',
          proposed && tone === 'offer' ? 'text-primary-accessible' : 'text-muted-foreground',
        )}
      >
        <BilingualText en={label.en} el={label.el} compact wrap />
      </dt>
      <dd
        className={cn(
          'mt-0.5',
          tone === 'meta' ? 'text-xs text-muted-foreground' : 'card-body',
          tone === 'aside' && (proposed ? 'text-foreground' : 'text-muted-foreground'),
          tone === 'lead' && 'font-medium text-foreground',
          proposed && tone === 'offer' && 'font-medium text-primary-accessible',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * Extracted from apps/web/src/components/commitments/NeedCard.tsx.
 * Product copy, field order, compact mode, badges, facts, and footer behavior
 * are kept intact. Only the presentation prop selects the before/after styling.
 */
function NeedCard({
  card,
  compact = false,
  showOwner = true,
  actions,
  footer,
  className,
  headingLevel = 3,
  presentation,
}: {
  card: NeedCardView;
  compact?: boolean;
  showOwner?: boolean;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  headingLevel?: 1 | 2 | 3;
  presentation: Presentation;
}) {
  const kind = kindCopy(card.kind);
  const perWeek = useLanguagePreference().primary === 'el' ? CMT.per_week.el : CMT.per_week.en;
  const Heading = headingLevel === 1 ? 'h1' : headingLevel === 2 ? 'h2' : 'h3';
  const evidence = (card.evidence ?? [])
    .map(evidenceCopy)
    .filter((pair): pair is { en: string; el: string } => Boolean(pair));
  const showsMoney = Boolean(card.offer.equity) || card.kind === 'investor_intro';
  const offerLine = [
    card.offer.equity ? card.offer.equity : null,
    card.offer.hoursPerWeek ? `${card.offer.hoursPerWeek} ${perWeek}` : null,
  ].filter(Boolean);
  const version = card.version && card.version > 1 ? card.version : null;
  const owner = showOwner ? card.owner : undefined;
  const proposed = presentation === 'proposed';

  return (
    <article data-need-card="" className={cn('space-y-4', className)}>
      <header className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 pt-0.5 text-xs text-muted-foreground">
            <BilingualText
              en={version ? `${kind.en} · ${CMT.version.en} ${version}` : kind.en}
              el={version ? `${kind.el} · ${CMT.version.el} ${version}` : kind.el}
              compact
              wrap
            />
          </p>
          {card.outcome ? <OutcomeChip outcome={card.outcome} /> : null}
        </div>
        <Heading className="card-title text-foreground">{card.title || '—'}</Heading>
        {owner ? (
          <div className="flex min-w-0 items-center gap-2.5 pt-1.5">
            <Avatar className="h-8 w-8" data-keep-icon="">
              <AvatarImage src={owner.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="bg-primary/15 text-2xs text-foreground">
                {owner.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="card-subtitle card-byline flex min-w-0 items-center gap-1">
                <span className="min-w-0 truncate">{owner.displayName}</span>
                <VerifiedBadge methods={owner.verifiedMethods ?? []} variant="mark" />
              </p>
              {owner.headline ? <p className="text-xs text-muted-foreground">{owner.headline}</p> : null}
            </div>
          </div>
        ) : null}
      </header>

      <dl className="space-y-3">
        {!compact && (card.exists || card.goal) ? (
          <div
            data-need-card-group="context"
            className={
              proposed
                ? 'grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-x-4'
                : 'space-y-2'
            }
          >
            {card.exists ? (
              <Field label={CMT.exists} tone="aside" presentation={presentation}>
                {card.exists}
              </Field>
            ) : null}
            {card.goal ? (
              <Field label={CMT.goal} tone="aside" presentation={presentation}>
                {card.goal}
              </Field>
            ) : null}
          </div>
        ) : null}

        {proposed ? (
          <div
            data-need-card-group="needs-and-offer"
            className="grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-4 md:gap-y-0"
          >
            {card.missing ? (
              <Field label={CMT.missing} presentation={presentation}>{card.missing}</Field>
            ) : null}
            <Field label={CMT.offer} tone="offer" presentation={presentation}>
              <span className="block font-medium">{card.offer?.role || '—'}</span>
              {offerLine.length ? (
                <span className="block font-medium tabular-nums">{offerLine.join(' · ')}</span>
              ) : null}
              {!compact && card.offer.scope ? (
                <span className="mt-1 block font-normal text-muted-foreground">{card.offer.scope}</span>
              ) : null}
            </Field>
          </div>
        ) : (
          <>
            {card.missing ? (
              <Field label={CMT.missing} presentation={presentation}>{card.missing}</Field>
            ) : null}
            <Field label={CMT.offer} presentation={presentation}>
              <span className="block font-medium">{card.offer?.role || '—'}</span>
              {offerLine.length ? (
                <span className="block font-medium tabular-nums">{offerLine.join(' · ')}</span>
              ) : null}
              {!compact && card.offer.scope ? (
                <span className="mt-1 block font-normal text-muted-foreground">{card.offer.scope}</span>
              ) : null}
            </Field>
          </>
        )}

        {!compact && evidence.length ? (
          <Field label={CMT.evidence} tone="meta" presentation={presentation}>
            <ul className="facts-dotted flex flex-wrap gap-x-2">
              {evidence.map((pair) => (
                <li key={pair.en}><BilingualText en={pair.en} el={pair.el} compact /></li>
              ))}
            </ul>
          </Field>
        ) : null}
      </dl>

      <ul
        aria-label={`${CMT.filters.en} · ${CMT.filters.el}`}
        className="facts-dotted flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground"
      >
        {card.category ? <li>{card.category}</li> : null}
        {card.isRemote ? (
          <li><BilingualText en={CMT.remote.en} el={CMT.remote.el} compact /></li>
        ) : null}
        {card.place ? <li>{card.place}</li> : null}
        {card.stage ? <li><StatusText value={card.stage} /></li> : null}
        {card.commitment ? <li><StatusText value={card.commitment} /></li> : null}
      </ul>

      {showsMoney || footer || actions ? (
        <footer className="space-y-3 border-t border-border pt-3">
          {showsMoney ? <NonGuaranteeNote /> : null}
          {footer}
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </footer>
      ) : null}
    </article>
  );
}

const demoCard: NeedCardView = {
  kind: 'cofounder',
  title: 'Community co-founder for an Athens founder-intro programme',
  exists: 'A mapped list of 40 Athens founder communities and two warm-intro paths already tested.',
  goal: 'Run a weekly founder-intro programme in Athens with partner communities by spring.',
  missing: 'A community-minded co-founder who has run events or a founder programme before.',
  offer: {
    role: 'Co-founder, community and partnerships',
    equity: '5–10%',
    hoursPerWeek: 20,
    scope: 'Run the weekly intros and own relationships with partner communities.',
  },
  category: 'Κοινότητα',
  place: 'Αθήνα, Ελλάδα',
  isRemote: false,
  stage: 'idea',
  commitment: 'part_time',
  evidence: [
    { id: 'milestone_completed', count: 1 },
    { id: 'work_email_verified', value: true },
  ],
  outcome: 'in_discussion',
  owner: {
    displayName: 'Alex Demo',
    headline: 'Founder · Athens founder networks',
    verifiedMethods: ['work_email'],
  },
};

export function NeedCardPreview({ variant }: { variant: Presentation }) {
  return (
    <main className="min-h-screen bg-background px-4 py-3">
      <div className="mx-auto max-w-[900px] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-none">
        <NeedCard card={demoCard} presentation={variant} />
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="mt-4 inline-block text-sm text-primary-accessible underline underline-offset-2"
        >
          Άνοιγμα του έργου
        </a>
      </div>
    </main>
  );
}
