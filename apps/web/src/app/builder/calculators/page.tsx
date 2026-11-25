'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { equityGrant, modelPricedRound, simulateRunway, unitEconomics } from '@/lib/equity';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';
import { cn } from '@/lib/utils';

/** One number the person types. A field left empty counts as zero. */
function Field({ id, en, el, value, onChange, suffix }: {
  id: string;
  en: string;
  el: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}><BilingualText en={en} el={el} compact wrap />{suffix ? ` (${suffix})` : ''}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </div>
  );
}

function Result({ en, el, value, tone }: { en: string; el: string; value: string; tone?: 'warning' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="min-w-0 text-sm text-muted-foreground"><BilingualText en={en} el={el} compact wrap /></dt>
      <dd className={cn('shrink-0 text-sm font-semibold tabular-nums text-foreground', tone === 'warning' && 'text-status-warning')}>{value}</dd>
    </div>
  );
}

/* Every figure in the reader's own number format (docs §154): the euros were
   always Greek («€3.750.000») and the decimals always English («20.0%»,
   «€0.292»), so a Greek page mixed the two marks in one column. */
const formats = (locale: 'el-GR' | 'en-GB') => ({
  euros: (value: number) => `€${Math.round(value).toLocaleString(locale)}`,
  percent: (fraction: number) => `${(fraction * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
  decimal: (value: number, digits = 1) => value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  count: (value: number) => value.toLocaleString(locale),
});
const EN = formats('en-GB');
const EL = formats('el-GR');

type Tool = 'round' | 'grant' | 'economics' | 'runway';
const TOOLS: Array<{ value: Tool; en: string; el: string }> = [
  { value: 'round', en: 'Priced round', el: 'Τιμολογημένος γύρος' },
  { value: 'grant', en: 'Employee equity', el: 'Μετοχές εργαζομένων' },
  { value: 'economics', en: 'Unit economics', el: 'Μοναδιαία οικονομικά' },
  { value: 'runway', en: 'Runway', el: 'Runway' },
];

/**
 * The numbers a founder works out before a conversation with an investor or a
 * first hire (docs §112). The arithmetic is `lib/equity`, the same tested module
 * as the AI Studio prototype, so the two never disagree: post-money round, the
 * option pool created in the pre-money, gross-margin LTV, month-by-month runway.
 */
export default function CalculatorsPage() {
  const { primary } = useLanguagePreference();
  const { euros, percent, decimal, count } = primary === 'el' ? EL : EN;
  const [tool, setTool] = useState<Tool>('round');

  const [preMoney, setPreMoney] = useState(3_000_000);
  const [investment, setInvestment] = useState(750_000);
  const [founderShares, setFounderShares] = useState(9_000_000);
  const [poolShares, setPoolShares] = useState(1_000_000);
  const [poolTarget, setPoolTarget] = useState(10);

  const [grantPct, setGrantPct] = useState(1);
  const [fullyDiluted, setFullyDiluted] = useState(10_000_000);
  const [sharePrice, setSharePrice] = useState(0.3);
  const [strike, setStrike] = useState(0.1);

  const [arpa, setArpa] = useState(120);
  const [margin, setMargin] = useState(80);
  const [churn, setChurn] = useState(3);
  const [cac, setCac] = useState(900);

  const [cash, setCash] = useState(375_000);
  const [expenses, setExpenses] = useState(28_000);
  const [revenue, setRevenue] = useState(6_000);
  const [growth, setGrowth] = useState(8);

  const round = useMemo(() => modelPricedRound({
    holders: [{ name: 'Founders', shares: founderShares }, { name: 'Option pool', shares: poolShares, kind: 'pool' }],
    safes: [],
    preMoney,
    investment,
    targetPoolPost: poolTarget / 100,
  }), [founderShares, poolShares, preMoney, investment, poolTarget]);
  const investorRow = round.rows.find((r) => r.kind === 'investor');
  const founderRow = round.rows.find((r) => r.kind === 'common');
  const poolRow = round.rows.find((r) => r.kind === 'pool');

  const grant = useMemo(() => equityGrant({ pct: grantPct / 100, fullyDilutedShares: fullyDiluted, pricePerShare: sharePrice, strikePrice: strike }), [grantPct, fullyDiluted, sharePrice, strike]);
  const economics = useMemo(() => unitEconomics({ arpa, grossMargin: margin / 100, monthlyChurn: churn / 100, cac }), [arpa, margin, churn, cac]);
  const runway = useMemo(() => simulateRunway({ cash, monthlyExpenses: expenses, monthlyRevenue: revenue, revenueGrowth: growth / 100 }), [cash, expenses, revenue, growth]);

  // The assistant reads the same results the page shows and can move between them.
  usePageList([
    {
      id: 'calculator_results',
      labelEn: 'Calculator results',
      labelEl: 'Αποτελέσματα υπολογιστών',
      rows: [
        `Priced round: post-money ${EN.euros(round.postMoney)}, new investor ${EN.percent(investorRow?.pctAfter ?? 0)}, founders ${EN.percent(founderRow?.pctAfter ?? 0)}, pool ${EN.percent(poolRow?.pctAfter ?? 0)}`,
        `Employee grant: ${EN.count(grant.shares)} shares, spread ${EN.euros(grant.spread)}`,
        `Unit economics: LTV ${economics.ltv === null ? '—' : EN.euros(economics.ltv)}, LTV:CAC ${(economics.ltvToCac == null ? '—' : EN.decimal(economics.ltvToCac))}, payback ${(economics.paybackMonths == null ? '—' : EN.decimal(economics.paybackMonths))} months`,
        `Runway: ${runway.runwayMonths ?? 'beyond the horizon'} months, default ${runway.defaultAlive ? 'alive' : 'dead'}`,
      ],
      rowsEl: [
        `Τιμολογημένος γύρος: post-money ${EL.euros(round.postMoney)}, νέος επενδυτής ${EL.percent(investorRow?.pctAfter ?? 0)}, ιδρυτές ${EL.percent(founderRow?.pctAfter ?? 0)}, pool ${EL.percent(poolRow?.pctAfter ?? 0)}`,
        `Παροχή μετοχών: ${EL.count(grant.shares)} μετοχές, διαφορά ${EL.euros(grant.spread)}`,
        `Μοναδιαία οικονομικά: LTV ${economics.ltv === null ? '—' : EL.euros(economics.ltv)}, LTV:CAC ${(economics.ltvToCac == null ? '—' : EL.decimal(economics.ltvToCac))}, απόσβεση ${(economics.paybackMonths == null ? '—' : EL.decimal(economics.paybackMonths))} μήνες`,
        `Runway: ${runway.runwayMonths ?? 'πέρα από τον ορίζοντα'} μήνες, ${runway.defaultAlive ? 'default alive' : 'default dead'}`,
      ],
    },
  ]);
  usePageControls([
    choiceControl('calculator', 'Calculator', 'Υπολογιστής', TOOLS, tool, (v) => setTool(v as Tool)),
  ]);

  return (
    <AppShell showHelp>
      <div className="space-y-6 pb-10">
        {/* One at a time on a phone: four forms in a row of tabs, not four screens of scrolling. */}
        <div className="tab-strip inline-flex max-w-full gap-1 overflow-x-auto scrollbar-hide rounded-full bg-muted/70 p-1" role="group" aria-label="Calculators">
          {TOOLS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tool === t.value}
              onClick={() => setTool(t.value)}
              className={cn('shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all', tool === t.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <BilingualText en={t.en} el={t.el} compact />
            </button>
          ))}
        </div>

        {tool === 'round' ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Card><CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="pre-money" en="Pre-money valuation" el="Αποτίμηση pre-money" suffix="€" value={preMoney} onChange={setPreMoney} />
              <Field id="investment" en="New money" el="Νέα κεφάλαια" suffix="€" value={investment} onChange={setInvestment} />
              <Field id="founder-shares" en="Founders’ shares" el="Μετοχές ιδρυτών" value={founderShares} onChange={setFounderShares} />
              <Field id="pool-shares" en="Option pool today" el="Option pool σήμερα" value={poolShares} onChange={setPoolShares} />
              <Field id="pool-target" en="Pool after the round" el="Pool μετά τον γύρο" suffix="%" value={poolTarget} onChange={setPoolTarget} />
            </CardContent></Card>
            <Card><CardContent>
              <dl className="divide-y divide-border">
                <Result en="Post-money" el="Post-money" value={euros(round.postMoney)} />
                <Result en="New investor" el="Νέος επενδυτής" value={percent(investorRow?.pctAfter ?? 0)} />
                <Result en="Founders after" el="Ιδρυτές μετά" value={percent(founderRow?.pctAfter ?? 0)} />
                <Result en="Pool after" el="Pool μετά" value={percent(poolRow?.pctAfter ?? 0)} />
                <Result en="Price per share" el="Τιμή μετοχής" value={`€${decimal(round.pricePerShare, 3)}`} />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                <BilingualText en="The pool is created in the pre-money, as in most term sheets, so it dilutes the founders and not the new investor." el="Το pool δημιουργείται στο pre-money, όπως στα περισσότερα term sheets, οπότε αραιώνει τους ιδρυτές και όχι τον νέο επενδυτή." wrap />
              </p>
            </CardContent></Card>
          </div>
        ) : null}

        {tool === 'grant' ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Card><CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="grant-pct" en="Grant" el="Παροχή" suffix="%" value={grantPct} onChange={setGrantPct} />
              <Field id="fully-diluted" en="Fully diluted shares" el="Σύνολο μετοχών (fully diluted)" value={fullyDiluted} onChange={setFullyDiluted} />
              <Field id="share-price" en="Share price" el="Τιμή μετοχής" suffix="€" value={sharePrice} onChange={setSharePrice} />
              <Field id="strike" en="Strike price" el="Τιμή άσκησης" suffix="€" value={strike} onChange={setStrike} />
            </CardContent></Card>
            <Card><CardContent>
              <dl className="divide-y divide-border">
                <Result en="Shares" el="Μετοχές" value={count(grant.shares)} />
                <Result en="Paper value" el="Χάρτινη αξία" value={euros(grant.value)} />
                <Result en="Spread over strike" el="Διαφορά από την τιμή άσκησης" value={euros(grant.spread)} />
              </dl>
              <h2 className="mt-4 text-sm font-semibold text-foreground"><BilingualText en="Four-year vesting, one-year cliff" el="Vesting τεσσάρων ετών, cliff ενός έτους" compact /></h2>
              <dl className="mt-1 divide-y divide-border">
                {grant.schedule.map((row) => (
                  <Result key={row.month} en={`Month ${row.month}`} el={`Μήνας ${row.month}`} value={`${count(row.vested)} · ${Math.round(row.pct * 100)}%`} />
                ))}
              </dl>
            </CardContent></Card>
          </div>
        ) : null}

        {tool === 'economics' ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Card><CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="arpa" en="Revenue per account a month" el="Έσοδα ανά λογαριασμό τον μήνα" suffix="€" value={arpa} onChange={setArpa} />
              <Field id="margin" en="Gross margin" el="Μικτό περιθώριο" suffix="%" value={margin} onChange={setMargin} />
              <Field id="churn" en="Monthly churn" el="Μηνιαίο churn" suffix="%" value={churn} onChange={setChurn} />
              <Field id="cac" en="Cost to acquire a customer" el="Κόστος απόκτησης πελάτη" suffix="€" value={cac} onChange={setCac} />
            </CardContent></Card>
            <Card><CardContent>
              <dl className="divide-y divide-border">
                <Result en="Lifetime value" el="Αξία ζωής (LTV)" value={economics.ltv === null ? '—' : euros(economics.ltv)} />
                <Result en="LTV to CAC" el="LTV προς CAC" value={economics.ltvToCac === null ? '—' : `${decimal(economics.ltvToCac)}×`} tone={economics.ltvToCac !== null && economics.ltvToCac < 3 ? 'warning' : undefined} />
                <Result en="Payback" el="Απόσβεση" value={economics.paybackMonths === null ? '—' : decimal(economics.paybackMonths)} />
                <Result en="Customer lifetime, months" el="Διάρκεια πελάτη, μήνες" value={economics.lifetimeMonths === null ? '—' : decimal(economics.lifetimeMonths)} />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                <BilingualText en="A common benchmark: LTV to CAC of 3 or more, payback under 12 months." el="Συνηθισμένο μέτρο: LTV προς CAC 3 ή περισσότερο, απόσβεση κάτω από 12 μήνες." wrap />
              </p>
            </CardContent></Card>
          </div>
        ) : null}

        {tool === 'runway' ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Card><CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="cash" en="Cash today" el="Ταμείο σήμερα" suffix="€" value={cash} onChange={setCash} />
              <Field id="expenses" en="Monthly expenses" el="Μηνιαία έξοδα" suffix="€" value={expenses} onChange={setExpenses} />
              <Field id="revenue" en="Monthly revenue" el="Μηνιαία έσοδα" suffix="€" value={revenue} onChange={setRevenue} />
              <Field id="growth" en="Revenue growth a month" el="Μηνιαία αύξηση εσόδων" suffix="%" value={growth} onChange={setGrowth} />
            </CardContent></Card>
            <Card><CardContent>
              <dl className="divide-y divide-border">
                <Result en="Runway, months" el="Runway, μήνες" value={runway.runwayMonths === null ? '60+' : String(runway.runwayMonths)} tone={runway.runwayMonths !== null && runway.runwayMonths < 6 ? 'warning' : undefined} />
                <Result en="Net burn now" el="Καθαρή καύση τώρα" value={euros(runway.netBurnNow)} />
                <Result en="Breakeven month" el="Μήνας break-even" value={runway.breakevenMonth === null ? '—' : String(runway.breakevenMonth)} />
                <Result en="Default alive" el="Default alive" value={runway.defaultAlive ? 'Ναι' : 'Όχι'} tone={runway.defaultAlive ? undefined : 'warning'} />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                <BilingualText en="Default alive means revenue catches expenses before the cash runs out, on this trajectory." el="Default alive σημαίνει ότι, με αυτή την πορεία, τα έσοδα προλαβαίνουν τα έξοδα πριν τελειώσει το ταμείο." wrap />
              </p>
            </CardContent></Card>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          <BilingualText en="Arithmetic to think with, not financial or legal advice. Nothing here is stored." el="Αριθμητική για σκέψη, όχι χρηματοοικονομική ή νομική συμβουλή. Δεν αποθηκεύεται τίποτα εδώ." wrap />
        </p>
      </div>
    </AppShell>
  );
}
