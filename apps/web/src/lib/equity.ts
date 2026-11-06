/**
 * Equity and early-stage finance math — one tested implementation for every
 * calculator, card and assistant answer in the studio.
 *
 * Conventions (stated once, because the industry uses both and mixing them is
 * the most common cap-table error):
 *
 *  - **Post-money SAFE (Y Combinator, 2018+).** The valuation cap is a
 *    *post-money* number: before the priced round, a SAFE holder owns
 *    `purchase amount / post-money cap` of the company capitalization, which
 *    includes every SAFE and the existing option pool. A $500k SAFE at an $8M
 *    post-money cap is 6.25% — not 500 / (8000 + 500) = 5.88%, which is the
 *    pre-money reading.
 *  - **SAFE conversion at a priced round.** Each SAFE converts at the lower of
 *    its cap price (`cap / company capitalization`) and its discount price
 *    (`(1 − discount) × round price`); an uncapped, undiscounted SAFE converts
 *    at the round price.
 *  - **Priced round.** `post-money = pre-money + new money`; the round price is
 *    `pre-money / pre-money fully diluted shares`. A target option pool is set
 *    as a share of the *post*-money fully diluted count and, as in most term
 *    sheets, created in the pre-money (the "option pool shuffle"), so it dilutes
 *    existing holders and SAFEs, not the new investor.
 *
 * Valuation methods: Berkus (pre-revenue, five risk factors), Scorecard (Bill
 * Payne: a regional median adjusted by weighted comparisons), and the Venture
 * Capital method (exit value / target multiple, adjusted for later dilution).
 * Runway: month-by-month cash simulation with revenue growth, the breakeven
 * month and "default alive" (Paul Graham) — whether revenue catches expenses
 * before the cash runs out on the current trajectory.
 *
 * Every function is pure: inputs in, numbers out, no storage and no React.
 */

// ── Shared helpers ──────────────────────────────────────────────────────────

const finite = (value: number) => (Number.isFinite(value) ? value : 0);
const nonNegative = (value: number) => Math.max(0, finite(value));
const clamp01 = (value: number) => Math.min(1, Math.max(0, finite(value)));

/** Rounds to `digits` decimals without floating-point surprises in the UI. */
export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((finite(value) + Number.EPSILON) * factor) / factor;
}

/** "$1.5M", "$450k", "$950" — compact money for cards and replies. */
export function formatMoney(value: number): string {
  const amount = finite(value);
  const sign = amount < 0 ? '−' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}$${round(abs / 1_000_000_000, abs % 1_000_000_000 === 0 ? 0 : 2)}B`;
  if (abs >= 1_000_000) return `${sign}$${round(abs / 1_000_000, abs % 1_000_000 === 0 ? 0 : 2)}M`;
  if (abs >= 1_000) return `${sign}$${round(abs / 1_000, abs % 1_000 === 0 ? 0 : 1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/** 0.0625 → "6.25%". */
export function formatPct(fraction: number, digits = 2): string {
  return `${round(finite(fraction) * 100, digits)}%`;
}

// ── SAFE: ownership before the priced round ─────────────────────────────────

export type Safe = {
  /** Purchase amount in dollars. */
  amount: number;
  /** Post-money valuation cap in dollars; 0 or missing = uncapped. */
  cap?: number;
  /** Discount as a fraction (0.2 = 20%); 0 or missing = no discount. */
  discount?: number;
  /** Holder name for cap tables. */
  holder?: string;
};

/**
 * Ownership a post-money SAFE implies before the priced round
 * (`amount / post-money cap`). Null for an uncapped SAFE: its ownership is only
 * known at the priced round.
 */
export function safeOwnershipAtCap(amount: number, postMoneyCap: number): number | null {
  if (!(postMoneyCap > 0)) return null;
  return nonNegative(amount) / postMoneyCap;
}

export type SafeStackSummary = {
  /** Sum of capped SAFE ownership, as a fraction. */
  safeOwnership: number;
  /** What the existing holders (founders + pool) keep before the priced round. */
  existingHoldersKeep: number;
  /** Total raised on SAFEs. */
  raised: number;
  /** Raised on SAFEs without a cap — their ownership is decided at the priced round. */
  uncappedRaised: number;
  /** True when the capped SAFEs alone would own 100% or more — impossible terms. */
  overSubscribed: boolean;
};

/** Ownership of a stack of post-money SAFEs before the priced round. */
export function summarizeSafes(safes: readonly Safe[]): SafeStackSummary {
  let safeOwnership = 0;
  let raised = 0;
  let uncappedRaised = 0;
  for (const safe of safes) {
    const amount = nonNegative(safe.amount);
    raised += amount;
    const own = safeOwnershipAtCap(amount, safe.cap ?? 0);
    if (own == null) uncappedRaised += amount;
    else safeOwnership += own;
  }
  return {
    safeOwnership,
    existingHoldersKeep: Math.max(0, 1 - safeOwnership),
    raised,
    uncappedRaised,
    overSubscribed: safeOwnership >= 1,
  };
}

// ── Priced round with SAFE conversion and the option-pool shuffle ───────────

export type Holder = {
  name: string;
  shares: number;
  /** 'common' (founders, employees, angels on common) or 'pool' (unissued options). */
  kind?: 'common' | 'pool';
};

export type PricedRoundInput = {
  /** Issued shares and the existing option pool, before the round. */
  holders: readonly Holder[];
  /** SAFEs that convert in this round. */
  safes: readonly Safe[];
  /** Pre-money valuation of the priced round. */
  preMoney: number;
  /** New money invested in the priced round. */
  investment: number;
  /** Option pool target as a fraction of post-money fully diluted shares (0 = keep the current pool). */
  targetPoolPost?: number;
  /** Name for the new investor line. */
  investorName?: string;
};

export type CapTableRow = {
  name: string;
  kind: 'common' | 'pool' | 'safe' | 'investor';
  sharesBefore: number;
  sharesAfter: number;
  /** Fully diluted ownership before the round (SAFEs not yet converted → 0). */
  pctBefore: number;
  /** Fully diluted ownership after the round. */
  pctAfter: number;
  /** Price per share this line paid in the round (SAFEs and the new investor). */
  pricePerShare?: number;
  /** For SAFEs: whether the cap or the discount set the price. */
  convertedBy?: 'cap' | 'discount' | 'round price';
};

export type PricedRoundResult = {
  ok: boolean;
  /** Why the inputs cannot be modelled, when ok is false. */
  problem?: 'no-shares' | 'no-valuation' | 'safes-exceed-cap';
  pricePerShare: number;
  postMoney: number;
  preMoneyFullyDiluted: number;
  postMoneyFullyDiluted: number;
  newInvestorShares: number;
  poolIncrease: number;
  rows: CapTableRow[];
  /** Ownership the common holders (founders) lose in this round, in percentage points. */
  founderDilutionPts: number;
  iterations: number;
};

const EMPTY_ROUND: PricedRoundResult = {
  ok: false,
  pricePerShare: 0,
  postMoney: 0,
  preMoneyFullyDiluted: 0,
  postMoneyFullyDiluted: 0,
  newInvestorShares: 0,
  poolIncrease: 0,
  rows: [],
  founderDilutionPts: 0,
  iterations: 0,
};

/**
 * Models a priced round: SAFEs convert (cap vs discount), the pool is topped up
 * in the pre-money, the new investor buys at the round price. The SAFE share
 * counts, the round price and the pool top-up depend on each other, so the
 * model iterates to a fixed point (it converges in a handful of steps for any
 * realistic terms; capped at 200).
 */
export function modelPricedRound(input: PricedRoundInput): PricedRoundResult {
  const holders = input.holders.map((h) => ({ ...h, shares: nonNegative(h.shares) })).filter((h) => h.shares > 0 || h.kind === 'pool');
  const existing = holders.reduce((sum, h) => sum + h.shares, 0);
  const existingPool = holders.filter((h) => h.kind === 'pool').reduce((sum, h) => sum + h.shares, 0);
  const preMoney = nonNegative(input.preMoney);
  const investment = nonNegative(input.investment);
  const targetPool = clamp01(input.targetPoolPost ?? 0);
  const safes = input.safes.filter((s) => nonNegative(s.amount) > 0);

  if (existing <= 0) return { ...EMPTY_ROUND, problem: 'no-shares' };
  if (preMoney <= 0) return { ...EMPTY_ROUND, problem: 'no-valuation' };
  if (summarizeSafes(safes).overSubscribed) return { ...EMPTY_ROUND, problem: 'safes-exceed-cap' };

  let safeShares = safes.map(() => 0);
  let poolIncrease = 0;
  let price = preMoney / existing;
  let iterations = 0;
  let convertedBy: CapTableRow['convertedBy'][] = safes.map(() => 'round price');

  for (iterations = 1; iterations <= 200; iterations += 1) {
    // Post-money SAFE "company capitalization": existing shares, existing pool and
    // every converting SAFE — but not the pool increase made for this round.
    const companyCap = existing + safeShares.reduce((a, b) => a + b, 0);
    const preFd = companyCap + poolIncrease;
    price = preMoney / preFd;
    const nextConverted: CapTableRow['convertedBy'][] = [];
    const nextShares = safes.map((safe) => {
      const candidates: { price: number; by: CapTableRow['convertedBy'] }[] = [{ price, by: 'round price' }];
      if ((safe.cap ?? 0) > 0) candidates.push({ price: (safe.cap as number) / companyCap, by: 'cap' });
      if ((safe.discount ?? 0) > 0) candidates.push({ price: price * (1 - clamp01(safe.discount as number)), by: 'discount' });
      const best = candidates.reduce((low, c) => (c.price < low.price ? c : low));
      nextConverted.push(best.by);
      return nonNegative(safe.amount) / best.price;
    });
    const newInvestorShares = investment / price;
    const postFd = preFd + newInvestorShares;
    const nextPool = targetPool > 0 ? Math.max(0, targetPool * postFd - existingPool) : 0;

    const moved = Math.abs(nextPool - poolIncrease) + nextShares.reduce((sum, s, i) => sum + Math.abs(s - (safeShares[i] ?? 0)), 0);
    safeShares = nextShares;
    poolIncrease = nextPool;
    convertedBy = nextConverted;
    if (moved < 1e-6) break;
  }

  const companyCap = existing + safeShares.reduce((a, b) => a + b, 0);
  const preFd = companyCap + poolIncrease;
  price = preMoney / preFd;
  const newInvestorShares = investment / price;
  const postFd = preFd + newInvestorShares;

  const rows: CapTableRow[] = [];
  for (const holder of holders) {
    const isPool = holder.kind === 'pool';
    const after = holder.shares + (isPool ? poolIncrease : 0);
    rows.push({
      name: holder.name,
      kind: isPool ? 'pool' : 'common',
      sharesBefore: holder.shares,
      sharesAfter: after,
      pctBefore: holder.shares / existing,
      pctAfter: after / postFd,
    });
  }
  if (poolIncrease > 0 && !holders.some((h) => h.kind === 'pool')) {
    rows.push({ name: 'Option pool', kind: 'pool', sharesBefore: 0, sharesAfter: poolIncrease, pctBefore: 0, pctAfter: poolIncrease / postFd });
  }
  safes.forEach((safe, index) => {
    const shares = safeShares[index] ?? 0;
    rows.push({
      name: safe.holder || `SAFE ${index + 1}`,
      kind: 'safe',
      sharesBefore: 0,
      sharesAfter: shares,
      pctBefore: 0,
      pctAfter: shares / postFd,
      pricePerShare: shares > 0 ? nonNegative(safe.amount) / shares : undefined,
      convertedBy: convertedBy[index],
    });
  });
  if (investment > 0) {
    rows.push({
      name: input.investorName || 'New investor',
      kind: 'investor',
      sharesBefore: 0,
      sharesAfter: newInvestorShares,
      pctBefore: 0,
      pctAfter: newInvestorShares / postFd,
      pricePerShare: price,
    });
  }

  const commonBefore = rows.filter((r) => r.kind === 'common').reduce((sum, r) => sum + r.pctBefore, 0);
  const commonAfter = rows.filter((r) => r.kind === 'common').reduce((sum, r) => sum + r.pctAfter, 0);

  return {
    ok: true,
    pricePerShare: price,
    postMoney: preMoney + investment,
    preMoneyFullyDiluted: preFd,
    postMoneyFullyDiluted: postFd,
    newInvestorShares,
    poolIncrease,
    rows,
    founderDilutionPts: (commonBefore - commonAfter) * 100,
    iterations: Math.min(iterations, 200),
  };
}

// ── Valuation methods ───────────────────────────────────────────────────────

export const BERKUS_FACTORS = [
  { key: 'idea', en: 'Sound idea (basic value, product risk)', el: 'Ισχυρή ιδέα (βασική αξία, κίνδυνος προϊόντος)' },
  { key: 'prototype', en: 'Prototype (technology risk)', el: 'Πρωτότυπο (τεχνολογικός κίνδυνος)' },
  { key: 'team', en: 'Quality management team (execution risk)', el: 'Ποιοτική ομάδα διοίκησης (κίνδυνος εκτέλεσης)' },
  { key: 'relationships', en: 'Strategic relationships (market risk)', el: 'Στρατηγικές σχέσεις (κίνδυνος αγοράς)' },
  { key: 'rollout', en: 'Product rollout or sales (production risk)', el: 'Κυκλοφορία ή πωλήσεις (κίνδυνος παραγωγής)' },
] as const;

export type BerkusKey = (typeof BERKUS_FACTORS)[number]['key'];

/**
 * Berkus method: each of five risk-reduction factors adds up to `maxPerFactor`
 * (Dave Berkus: $500k each, so at most $2.5M pre-money, pre-revenue only).
 * `ratings` are 0–1 per factor.
 */
export function berkusValuation(ratings: Partial<Record<BerkusKey, number>>, maxPerFactor = 500_000): { value: number; parts: { key: BerkusKey; value: number }[] } {
  const parts = BERKUS_FACTORS.map((factor) => ({ key: factor.key, value: clamp01(ratings[factor.key] ?? 0) * nonNegative(maxPerFactor) }));
  return { value: parts.reduce((sum, part) => sum + part.value, 0), parts };
}

export const SCORECARD_FACTORS = [
  { key: 'team', weight: 0.3, en: 'Strength of the team', el: 'Δύναμη της ομάδας' },
  { key: 'opportunity', weight: 0.25, en: 'Size of the opportunity', el: 'Μέγεθος της ευκαιρίας' },
  { key: 'product', weight: 0.15, en: 'Product and technology', el: 'Προϊόν και τεχνολογία' },
  { key: 'competition', weight: 0.1, en: 'Competitive environment', el: 'Ανταγωνιστικό περιβάλλον' },
  { key: 'channels', weight: 0.1, en: 'Marketing, sales channels, partnerships', el: 'Μάρκετινγκ, κανάλια πωλήσεων, συνεργασίες' },
  { key: 'funding', weight: 0.05, en: 'Need for additional investment', el: 'Ανάγκη για επιπλέον επένδυση' },
  { key: 'other', weight: 0.05, en: 'Other factors', el: 'Άλλοι παράγοντες' },
] as const;

export type ScorecardKey = (typeof SCORECARD_FACTORS)[number]['key'];

/**
 * Scorecard method (Bill Payne): the median pre-money of comparable pre-revenue
 * deals in the region, multiplied by Σ weight × comparison. A comparison of 1
 * means "as good as the typical deal", 1.5 = 150%, 0.5 = 50% (clamped 0–3).
 */
export function scorecardValuation(medianPreMoney: number, comparisons: Partial<Record<ScorecardKey, number>>): { value: number; multiplier: number } {
  const multiplier = SCORECARD_FACTORS.reduce((sum, factor) => {
    const raw = comparisons[factor.key];
    const comparison = raw == null ? 1 : Math.min(3, Math.max(0, finite(raw)));
    return sum + factor.weight * comparison;
  }, 0);
  return { value: nonNegative(medianPreMoney) * multiplier, multiplier };
}

export type VcMethodInput = {
  /** Expected revenue (or earnings) in the exit year. */
  exitMetric: number;
  /** Exit multiple applied to that metric (e.g. 5× revenue). */
  exitMultiple: number;
  /** Target return multiple for this investor (e.g. 10×–30× at seed). */
  targetReturn: number;
  /** Investment in this round. */
  investment: number;
  /** Share of this round's ownership kept after later rounds (e.g. 0.6). Default 1. */
  retention?: number;
};

/**
 * Venture Capital method: terminal value = exit metric × multiple; post-money
 * today = terminal value × retention / target return; pre-money = post − investment.
 */
export function vcMethodValuation(input: VcMethodInput): { terminalValue: number; postMoney: number; preMoney: number; requiredOwnership: number | null } {
  const terminalValue = nonNegative(input.exitMetric) * nonNegative(input.exitMultiple);
  const retention = input.retention == null ? 1 : clamp01(input.retention);
  const target = nonNegative(input.targetReturn);
  const postMoney = target > 0 ? (terminalValue * retention) / target : 0;
  const investment = nonNegative(input.investment);
  return {
    terminalValue,
    postMoney,
    preMoney: Math.max(0, postMoney - investment),
    requiredOwnership: postMoney > 0 ? Math.min(1, investment / postMoney) : null,
  };
}

/** Low, median and high of the methods that produced a number. */
export function valuationRange(values: readonly number[]): { low: number; mid: number; high: number } | null {
  const usable = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (usable.length === 0) return null;
  const middle = Math.floor(usable.length / 2);
  const mid = usable.length % 2 ? usable[middle]! : (usable[middle - 1]! + usable[middle]!) / 2;
  return { low: usable[0]!, mid, high: usable[usable.length - 1]! };
}

// ── Runway, breakeven and "default alive" ───────────────────────────────────

export type RunwayInput = {
  cash: number;
  /** Monthly operating expenses (gross burn). */
  monthlyExpenses: number;
  /** Monthly revenue today. */
  monthlyRevenue?: number;
  /** Month-over-month revenue growth as a fraction (0.08 = 8%). */
  revenueGrowth?: number;
  /** Month-over-month expense growth as a fraction. */
  expenseGrowth?: number;
  /** How many months to simulate at most. */
  horizon?: number;
};

export type RunwayMonth = { month: number; revenue: number; expenses: number; netBurn: number; cash: number };

export type RunwayResult = {
  /** Months until cash runs out; null when it never does within the horizon. */
  runwayMonths: number | null;
  /** First month (1-based) in which revenue covers expenses; null when it does not within the horizon. */
  breakevenMonth: number | null;
  /** Revenue catches expenses before the cash runs out (Paul Graham). */
  defaultAlive: boolean;
  /** Net burn this month (expenses − revenue). Negative = profitable. */
  netBurnNow: number;
  /** Lowest cash balance on the path (before any month that goes negative). */
  lowestCash: number;
  months: RunwayMonth[];
};

/**
 * Simulates the cash balance month by month. Revenue and expenses compound at
 * their monthly growth rates; the month the balance would go below zero is the
 * end of the runway. With no growth this equals cash / net burn (floored).
 */
export function simulateRunway(input: RunwayInput): RunwayResult {
  const horizon = Math.max(1, Math.min(240, Math.round(input.horizon ?? 60)));
  let cash = nonNegative(input.cash);
  let revenue = nonNegative(input.monthlyRevenue ?? 0);
  let expenses = nonNegative(input.monthlyExpenses);
  const revenueGrowth = Math.max(-0.99, finite(input.revenueGrowth ?? 0));
  const expenseGrowth = Math.max(-0.99, finite(input.expenseGrowth ?? 0));
  const months: RunwayMonth[] = [];
  let runwayMonths: number | null = null;
  let breakevenMonth: number | null = null;
  let lowestCash = cash;
  const netBurnNow = expenses - revenue;

  for (let month = 1; month <= horizon; month += 1) {
    const netBurn = expenses - revenue;
    if (breakevenMonth == null && netBurn <= 0 && expenses > 0) breakevenMonth = month;
    if (cash - netBurn < 0) {
      runwayMonths = month - 1;
      months.push({ month, revenue, expenses, netBurn, cash: cash - netBurn });
      break;
    }
    cash -= netBurn;
    lowestCash = Math.min(lowestCash, cash);
    months.push({ month, revenue, expenses, netBurn, cash });
    revenue *= 1 + revenueGrowth;
    expenses *= 1 + expenseGrowth;
  }

  return {
    runwayMonths,
    breakevenMonth,
    // Alive = revenue catches expenses and the cash never runs out on this path
    // (a breakeven followed by burn that outgrows revenue again is not alive).
    defaultAlive: breakevenMonth != null && runwayMonths == null,
    netBurnNow,
    lowestCash,
    months,
  };
}

/** Burn multiple (David Sacks): net burn ÷ net new ARR in the same period. Lower is better; null without new ARR. */
export function burnMultiple(netBurn: number, netNewArr: number): number | null {
  if (!(netNewArr > 0)) return null;
  return nonNegative(netBurn) / netNewArr;
}

/** A plain reading of the burn multiple, as commonly bucketed. */
export function burnMultipleRating(multiple: number | null): 'amazing' | 'great' | 'good' | 'suspect' | 'bad' | null {
  if (multiple == null) return null;
  if (multiple < 1) return 'amazing';
  if (multiple < 1.5) return 'great';
  if (multiple < 2) return 'good';
  if (multiple < 3) return 'suspect';
  return 'bad';
}

// ── Equity grants and vesting ───────────────────────────────────────────────

export type GrantInput = {
  /** Grant as a fraction of fully diluted shares (0.01 = 1%). */
  pct: number;
  fullyDilutedShares: number;
  /** Price per share used to value the grant (latest preferred or 409A). */
  pricePerShare?: number;
  /** Strike price per share for options (0 for RSAs). */
  strikePrice?: number;
  vestingMonths?: number;
  cliffMonths?: number;
};

export type GrantResult = {
  shares: number;
  /** Paper value at pricePerShare. */
  value: number;
  /** Spread over strike (what options are worth if exercised at pricePerShare). */
  spread: number;
  /** Vested shares at the end of each year of the schedule. */
  schedule: { month: number; vested: number; pct: number }[];
};

/** Shares vested after `month` months: nothing before the cliff, then linear monthly vesting. */
export function vestedShares(totalShares: number, month: number, vestingMonths = 48, cliffMonths = 12): number {
  const total = nonNegative(totalShares);
  const span = Math.max(1, Math.round(vestingMonths));
  const cliff = Math.max(0, Math.round(cliffMonths));
  if (month < cliff) return 0;
  return Math.floor((total * Math.min(month, span)) / span);
}

export function equityGrant(input: GrantInput): GrantResult {
  const shares = Math.round(clamp01(input.pct) * nonNegative(input.fullyDilutedShares));
  const price = nonNegative(input.pricePerShare ?? 0);
  const strike = nonNegative(input.strikePrice ?? 0);
  const vesting = Math.max(1, Math.round(input.vestingMonths ?? 48));
  const cliff = Math.max(0, Math.round(input.cliffMonths ?? 12));
  const schedule: GrantResult['schedule'] = [];
  for (let month = 12; month <= vesting; month += 12) {
    const vested = vestedShares(shares, month, vesting, cliff);
    schedule.push({ month, vested, pct: shares > 0 ? vested / shares : 0 });
  }
  if (schedule[schedule.length - 1]?.month !== vesting) {
    schedule.push({ month: vesting, vested: shares, pct: shares > 0 ? 1 : 0 });
  }
  return { shares, value: shares * price, spread: shares * Math.max(0, price - strike), schedule };
}

// ── Pro-forma cap table before the priced round ─────────────────────────────

export type ProFormaRow = {
  name: string;
  kind: 'common' | 'pool' | 'safe';
  /** Shares (SAFEs: the as-converted count at the cap). */
  shares: number;
  /** Fully diluted ownership; null for an uncapped SAFE (decided at the priced round). */
  pct: number | null;
};

/**
 * Ownership today with the capped post-money SAFEs as converted at their caps:
 * each SAFE owns `amount / cap` of the company capitalization and the existing
 * holders share the rest pro rata. Uncapped SAFEs are listed without a share.
 */
export function proFormaCapTable(holders: readonly Holder[], safes: readonly Safe[]): { rows: ProFormaRow[]; capitalization: number; ok: boolean } {
  const existing = holders.reduce((sum, h) => sum + nonNegative(h.shares), 0);
  const stack = summarizeSafes(safes);
  if (existing <= 0 || stack.overSubscribed) return { rows: [], capitalization: 0, ok: false };
  const capitalization = existing / (1 - stack.safeOwnership);
  const rows: ProFormaRow[] = holders
    .filter((h) => nonNegative(h.shares) > 0)
    .map((h) => ({ name: h.name, kind: h.kind === 'pool' ? 'pool' : 'common', shares: nonNegative(h.shares), pct: nonNegative(h.shares) / capitalization }));
  safes.forEach((safe, index) => {
    const own = safeOwnershipAtCap(safe.amount, safe.cap ?? 0);
    if (nonNegative(safe.amount) <= 0) return;
    rows.push({ name: safe.holder || `SAFE ${index + 1}`, kind: 'safe', shares: own == null ? 0 : own * capitalization, pct: own });
  });
  return { rows, capitalization, ok: true };
}

// ── Unit economics and growth ───────────────────────────────────────────────

export type UnitEconomicsInput = {
  /** Average revenue per account per month. */
  arpa: number;
  /** Gross margin as a fraction (0.8 = 80%). */
  grossMargin: number;
  /** Monthly logo churn as a fraction (0.03 = 3%). */
  monthlyChurn: number;
  /** Fully loaded customer acquisition cost. */
  cac: number;
};

export type UnitEconomics = {
  /** Gross-margin lifetime value: ARPA × GM ÷ churn; null without churn. */
  ltv: number | null;
  /** Expected customer lifetime in months (1 ÷ churn). */
  lifetimeMonths: number | null;
  ltvToCac: number | null;
  /** Months of gross margin to earn back the CAC. */
  paybackMonths: number | null;
};

/**
 * The standard SaaS unit economics. Common benchmarks: LTV:CAC of 3 or more,
 * CAC payback under 12 months (under 18 for enterprise sales).
 */
export function unitEconomics(input: UnitEconomicsInput): UnitEconomics {
  const arpa = nonNegative(input.arpa);
  const margin = clamp01(input.grossMargin);
  const churn = clamp01(input.monthlyChurn);
  const cac = nonNegative(input.cac);
  const monthlyMargin = arpa * margin;
  const ltv = churn > 0 ? monthlyMargin / churn : null;
  return {
    ltv,
    lifetimeMonths: churn > 0 ? 1 / churn : null,
    ltvToCac: ltv != null && cac > 0 ? ltv / cac : null,
    paybackMonths: monthlyMargin > 0 && cac > 0 ? cac / monthlyMargin : null,
  };
}

/** Compound monthly growth rate between two values `months` apart; null when it cannot be computed. */
export function monthlyGrowthRate(from: number, to: number, months: number): number | null {
  if (!(from > 0) || !(to > 0) || !(months > 0)) return null;
  return (to / from) ** (1 / months) - 1;
}

/** A monthly rate expressed per year: (1 + m)^12 − 1. */
export function annualized(monthlyRate: number): number {
  return (1 + finite(monthlyRate)) ** 12 - 1;
}
