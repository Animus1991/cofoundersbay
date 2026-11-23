'use client';

import { useId, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BadgeCheck, Bookmark, CheckCircle2 } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardHead } from '@/components/common/CardAnatomy';
import { CardMoreMenu } from '@/components/common/CardMoreMenu';
import { FactLine } from '@/components/common/FactLine';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AskIntroDialog } from '@/components/intros/AskIntroDialog';
import { bilingualInline } from '@/lib/i18n/format';
import { cn, initialsOf } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { useHydrated } from '@/components/common/RelativeTime';
import { isPreviewDemo } from '@/lib/preview-demo';
import { termDisplay } from '@/lib/i18n/terms';
import { placeEl } from '@/lib/i18n/places';
import { STAGE_COPY, TYPE_LABEL, formatCheckSize, type InvestorType } from './investor-helpers';

/**
 * One row of the directory. People come from the profile search (role
 * investor), which knows who they are, where, and which industries they
 * follow; the investor-profile fields (type, check size, stages, track record)
 * are known only for the sample rows, so on a real row they are absent and
 * the card leaves them out rather than showing a zero.
 */
export type Investor = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  investorType?: InvestorType;
  firmName?: string;
  firmRole?: string;
  industries: string[];
  stages: string[];
  checkSizeMin?: number;
  checkSizeMax?: number;
  geographies: string[];
  isVerified?: boolean;
  isActivelyScouting?: boolean;
  portfolioCount?: number;
  viewCount?: number;
  dealsThisYear?: number;
  thesisSummary?: string;
  /** A fixture: no account stands behind it, so it has no profile or inbox. */
  sample: boolean;
};


// ── Investor card ──────────────────────────────────────────────────────────────

/** One caption over its value. An empty value omits the row; it never changes the row's shape. */
function CardFact({ en, el, children }: { en: string; el: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-foreground">
        <BilingualText en={en} el={el} compact />
      </span>
      {children}
    </div>
  );
}

/** A sector, a stage or a place: the same almost-transparent frame on every card. */
function QuietTag({ children }: { children: ReactNode }) {
  return <span role="listitem" className="quiet-tag text-xs">{children}</span>;
}

function TagList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="list" aria-label={label} className="flex flex-wrap gap-1">
      {children}
    </div>
  );
}

type RecordBit = { figureEn: string; figureEl: string; en: string; el: string };

function countLine(n: number, oneEn: string, manyEn: string, oneEl: string, manyEl: string): RecordBit {
  const figure = String(n);
  return { figureEn: figure, figureEl: figure, en: n === 1 ? oneEn : manyEn, el: n === 1 ? oneEl : manyEl };
}

export function InvestorCard({
  investor,
  saved,
  onToggleSave,
}: {
  investor: Investor;
  saved: boolean;
  onToggleSave: () => void;
}) {
  // The demo has these investors' profiles and opens conversations with
  // them; a real account's sample rows have neither.
  const inDemo = useHydrated() && isPreviewDemo();
  const sampleReasonId = useId();
  const [showFacts, setShowFacts] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const initials = initialsOf(investor.displayName);
  const checkSize = formatCheckSize(investor.checkSizeMin, investor.checkSizeMax);
  const type = investor.investorType ? TYPE_LABEL[investor.investorType] : null;
  const stages = investor.stages.map((stage) => STAGE_COPY[stage] ?? { en: stage, el: stage });
  const places = investor.geographies.length ? investor.geographies : investor.location ? [investor.location] : [];
  const record: RecordBit[] = [];
  if (investor.portfolioCount != null) record.push(countLine(investor.portfolioCount, 'investment', 'investments', 'επένδυση', 'επενδύσεις'));
  if (investor.dealsThisYear != null) record.push(countLine(investor.dealsThisYear, 'deal this year', 'deals this year', 'συμφωνία φέτος', 'συμφωνίες φέτος'));
  if (investor.viewCount != null) {
    record.push({
      figureEn: investor.viewCount.toLocaleString('en-GB'),
      figureEl: investor.viewCount.toLocaleString('el-GR'),
      en: investor.viewCount === 1 ? 'view' : 'views',
      el: investor.viewCount === 1 ? 'προβολή' : 'προβολές',
    });
  }
  const sampleReasonEn = 'Sample investor: there is no profile or inbox behind it';
  const sampleReasonEl = 'Δείγμα επενδυτή: δεν υπάρχει προφίλ ή εισερχόμενα';

  // Every investor, sparse or dense, uses this order. A missing value drops
  // its row and leaves the rest where they are, so two cards never look
  // like two different components. Tokens share one frame; the cheque and
  // the record's numbers are the only heavier ink.
  return (
    <Card className="group overflow-hidden transition-all hover:border-primary/30">
      <CardContent className="space-y-3">
        {/* One anatomy at every width (docs §115/§125): the full head with
            Save in its corner; the thesis is under More on a phone. */}
        <div>
          <CardHead
            mark={(
              <Avatar className="h-16 w-16">
                <AvatarImage src={investor.avatarUrl} alt="" />
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary-accessible">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            title={(
              <span className="inline-flex max-w-full items-center gap-1.5">
                <span className="min-w-0 break-words">{investor.displayName}</span>
                {investor.isVerified && (
                  <BadgeCheck
                    className={cn('icon-sm shrink-0', STATUS.info.icon)}
                    aria-label={bilingualInline('Verified', 'Επαληθευμένος')}
                  />
                )}
              </span>
            )}
            subtitle={type || investor.firmName || investor.firmRole || investor.headline ? (
              <>
                {type ? <BilingualText en={type.en} el={type.el} compact /> : null}
                {type && (investor.firmName || investor.firmRole || investor.headline) ? ' · ' : null}
                {investor.firmName || investor.firmRole ? (
                  <>
                    {investor.firmName}
                    {investor.firmName && investor.firmRole ? ' · ' : null}
                    {/* Its own node, so the catalogue can translate the role. */}
                    {investor.firmRole ? <span>{investor.firmRole}</span> : null}
                  </>
                ) : investor.headline}
              </>
            ) : undefined}
            meta={investor.isActivelyScouting ? (
              <span className="inline-flex items-center gap-1 text-xs text-primary-accessible">
                <CheckCircle2 className="icon-sm" aria-hidden="true" />
                <BilingualText en="Actively scouting" el="Αναζητά ενεργά" compact />
              </span>
            ) : undefined}
            asideStays
            aside={(
              <button
                aria-label={saved
                  ? bilingualInline(`Remove ${investor.displayName} from your shortlist`, `Αφαίρεση ${investor.displayName} από τη λίστα σας`)
                  : bilingualInline(`Save ${investor.displayName} to your shortlist`, `Αποθήκευση ${investor.displayName} στη λίστα σας`)}
                aria-pressed={saved}
                type="button"
                onClick={onToggleSave}
                className="tap-target flex items-center gap-1 rounded-md p-1 transition-colors hover:bg-muted sm:px-1.5"
              >
                <Bookmark className={cn('icon-sm', saved ? 'fill-primary text-primary-accessible' : 'text-muted-foreground')} aria-hidden="true" />
                <span className="hidden sm:inline text-xs"><BilingualText en={saved ? 'Saved' : 'Save'} el={saved ? 'Αποθηκεύτηκε' : 'Αποθήκευση'} compact /></span>
              </button>
            )}
          />
        </div>

        {investor.thesisSummary && (
          <p className="card-body line-clamp-2 text-muted-foreground max-sm:hidden">{investor.thesisSummary}</p>
        )}

        {/* The facts side by side where the card is wide: one column of
            five captions made each card about 480px tall at 1440 and the
            directory of seven 3,500px (docs §86). The order stays. */}
        <FactLine
          items={[
            checkSize ? <span key="cheque" className="font-semibold tabular-nums text-foreground">{checkSize}</span> : null,
            ...stages.slice(0, 2).map((stage) => <BilingualText key={stage.en} en={stage.en} el={stage.el} compact />),
          ]}
        />
        <button
          type="button"
          aria-expanded={showFacts}
          onClick={() => setShowFacts((value) => !value)}
          className="tap-extend-y text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showFacts ? <BilingualText en="Less" el="Λιγότερα" compact /> : <BilingualText en="More" el="Περισσότερα" compact />}
        </button>
        {/* A class, not `hidden`: the grid's own display would win over the attribute. */}
        <div className={cn(showFacts ? 'grid' : 'hidden', 'grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3')}>
        {investor.thesisSummary ? (
          <p className="card-body text-muted-foreground sm:hidden">{investor.thesisSummary}</p>
        ) : null}
        {investor.industries.length ? (
          <CardFact en="Sectors" el="Τομείς">
            <TagList label={bilingualInline('Sectors', 'Τομείς')}>
              {investor.industries.map((name) => <QuietTag key={name}>{termDisplay(name)}</QuietTag>)}
            </TagList>
          </CardFact>
        ) : null}

        {stages.length ? (
          <CardFact en="Stages" el="Στάδια">
            <TagList label={bilingualInline('Stages', 'Στάδια')}>
              {stages.map((stage) => (
                <QuietTag key={stage.en}><BilingualText en={stage.en} el={stage.el} compact wrap /></QuietTag>
              ))}
            </TagList>
          </CardFact>
        ) : null}

        {checkSize ? (
          <CardFact en="Cheque" el="Επιταγή">
            <span className="text-xs font-semibold tabular-nums text-foreground">{checkSize}</span>
          </CardFact>
        ) : null}

        {places.length ? (
          <CardFact en="Place" el="Τόπος">
            <TagList label={bilingualInline('Place', 'Τόπος')}>
              {places.map((place) => <QuietTag key={place}><BilingualText en={place} el={placeEl(place)} compact /></QuietTag>)}
            </TagList>
          </CardFact>
        ) : null}

        {record.length ? (
          <CardFact en="So far" el="Μέχρι σήμερα">
            <p className="text-xs text-muted-foreground">
              {record.map((item, index) => (
                <span key={item.en}>
                  {index > 0 ? ' · ' : null}
                  <span className="font-medium tabular-nums text-foreground">
                    <BilingualText en={item.figureEn} el={item.figureEl} compact />
                  </span>
                  {' '}
                  <BilingualText en={item.en} el={item.el} compact />
                </span>
              ))}
            </p>
          </CardFact>
        ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {investor.sample && !inDemo ? (
            <div className="flex max-w-full flex-col items-start gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" disabled title={bilingualInline(sampleReasonEn, sampleReasonEl)} aria-describedby={sampleReasonId}>
                  <BilingualText en="Profile" el="Προφίλ" compact />
                </Button>
                <Button variant="outline" size="sm" disabled title={bilingualInline(sampleReasonEn, sampleReasonEl)} aria-describedby={sampleReasonId}>
                  <BilingualText en="Message directly" el="Απευθείας μήνυμα" compact />
                </Button>
              </div>
              <span id={sampleReasonId} className="max-w-[16rem] text-2xs leading-snug text-muted-foreground sm:sr-only">
                <BilingualText en={sampleReasonEn} el={sampleReasonEl} compact wrap />
              </span>
            </div>
          ) : (
            <>
              {/* One button (docs §115): Message directly. The introduction
                  asks from the card's menu, as on every card. */}
              <Button size="sm" asChild>
                <Link href={`/messages?to=${investor.userId}`} aria-label={bilingualInline(`Message ${investor.displayName} directly`, `Απευθείας μήνυμα: ${investor.displayName}`)}>
                  <BilingualText en="Message directly" el="Απευθείας μήνυμα" compact />
                </Link>
              </Button>
              <CardMoreMenu name={investor.displayName} items={[
                { key: 'intro', en: 'Ask for an introduction', el: 'Ζητήστε γνωριμία', onSelect: () => setIntroOpen(true) },
                { key: 'profile', en: 'Profile', el: 'Προφίλ', href: `/profiles/${investor.userId}` },
              ]} />
            </>
          )}
        </div>
      </CardContent>
      {introOpen ? <AskIntroDialog open={introOpen} onOpenChange={setIntroOpen} targetId={investor.userId} targetName={investor.displayName} /> : null}
    </Card>
  );
}

