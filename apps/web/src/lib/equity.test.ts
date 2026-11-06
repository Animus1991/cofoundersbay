import { describe, expect, it } from 'vitest';
import {
  berkusValuation,
  burnMultiple,
  burnMultipleRating,
  equityGrant,
  annualized,
  formatMoney,
  formatPct,
  monthlyGrowthRate,
  proFormaCapTable,
  unitEconomics,
  modelPricedRound,
  safeOwnershipAtCap,
  scorecardValuation,
  SCORECARD_FACTORS,
  simulateRunway,
  summarizeSafes,
  valuationRange,
  vcMethodValuation,
  vestedShares,
} from './equity';

describe('post-money SAFE ownership', () => {
  it('is purchase amount over the post-money cap (6.25%, not the pre-money 5.88%)', () => {
    expect(safeOwnershipAtCap(500_000, 8_000_000)).toBeCloseTo(0.0625, 10);
  });

  it('is unknown for an uncapped SAFE', () => {
    expect(safeOwnershipAtCap(500_000, 0)).toBeNull();
  });

  it('adds up a SAFE stack and flags impossible terms', () => {
    const stack = summarizeSafes([
      { amount: 450_000, cap: 12_000_000 },
      { amount: 100_000, cap: 0 },
    ]);
    expect(stack.safeOwnership).toBeCloseTo(0.0375, 10);
    expect(stack.existingHoldersKeep).toBeCloseTo(0.9625, 10);
    expect(stack.raised).toBe(550_000);
    expect(stack.uncappedRaised).toBe(100_000);
    expect(summarizeSafes([{ amount: 2_000_000, cap: 2_000_000 }]).overSubscribed).toBe(true);
  });
});

describe('priced round', () => {
  it('converts a capped post-money SAFE and prices the new money (worked example)', () => {
    const result = modelPricedRound({
      holders: [
        { name: 'Founders', shares: 9_000_000 },
        { name: 'Option pool', shares: 1_000_000, kind: 'pool' },
      ],
      safes: [{ amount: 1_000_000, cap: 10_000_000, holder: 'Angel SAFE' }],
      preMoney: 20_000_000,
      investment: 5_000_000,
    });
    expect(result.ok).toBe(true);
    // Company capitalization = 10M / (1 − 10%) = 11.11M; SAFE owns 10% of it.
    expect(result.pricePerShare).toBeCloseTo(1.8, 6);
    expect(result.postMoney).toBe(25_000_000);
    expect(result.pricePerShare * result.postMoneyFullyDiluted).toBeCloseTo(25_000_000, 0);
    const safe = result.rows.find((row) => row.kind === 'safe')!;
    expect(safe.convertedBy).toBe('cap');
    expect(safe.pricePerShare).toBeCloseTo(0.9, 6);
    expect(safe.pctAfter).toBeCloseTo(0.08, 6);
    const investor = result.rows.find((row) => row.kind === 'investor')!;
    expect(investor.pctAfter).toBeCloseTo(0.2, 6);
    const founders = result.rows.find((row) => row.name === 'Founders')!;
    expect(founders.pctAfter).toBeCloseTo(0.648, 6);
    const total = result.rows.reduce((sum, row) => sum + row.pctAfter, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it('uses the discount when it beats the cap', () => {
    const result = modelPricedRound({
      holders: [{ name: 'Founders', shares: 10_000_000 }],
      safes: [{ amount: 1_000_000, cap: 30_000_000, discount: 0.2 }],
      preMoney: 20_000_000,
      investment: 0,
    });
    const safe = result.rows.find((row) => row.kind === 'safe')!;
    expect(safe.convertedBy).toBe('discount');
    expect(result.pricePerShare).toBeCloseTo(1.875, 6);
    expect(safe.pricePerShare).toBeCloseTo(1.5, 6);
    expect(safe.sharesAfter).toBeCloseTo(666_666.67, 1);
  });

  it('creates the target pool in the pre-money (option pool shuffle)', () => {
    const result = modelPricedRound({
      holders: [{ name: 'Founders', shares: 10_000_000 }],
      safes: [],
      preMoney: 8_000_000,
      investment: 2_000_000,
      targetPoolPost: 0.1,
    });
    const pool = result.rows.find((row) => row.kind === 'pool')!;
    expect(pool.pctAfter).toBeCloseTo(0.1, 6);
    expect(result.rows.find((row) => row.kind === 'investor')!.pctAfter).toBeCloseTo(0.2, 6);
    expect(result.rows.find((row) => row.name === 'Founders')!.pctAfter).toBeCloseTo(0.7, 6);
    expect(result.pricePerShare).toBeCloseTo(0.7, 6);
    expect(result.founderDilutionPts).toBeCloseTo(30, 6);
  });

  it('refuses inputs it cannot model', () => {
    expect(modelPricedRound({ holders: [], safes: [], preMoney: 1, investment: 1 }).problem).toBe('no-shares');
    expect(modelPricedRound({ holders: [{ name: 'F', shares: 1 }], safes: [], preMoney: 0, investment: 1 }).problem).toBe('no-valuation');
    expect(
      modelPricedRound({ holders: [{ name: 'F', shares: 1 }], safes: [{ amount: 5, cap: 4 }], preMoney: 10, investment: 1 }).problem,
    ).toBe('safes-exceed-cap');
  });
});

describe('valuation methods', () => {
  it('Berkus tops out at five factors of $500k', () => {
    expect(berkusValuation({ idea: 1, prototype: 1, team: 1, relationships: 1, rollout: 1 }).value).toBe(2_500_000);
    expect(berkusValuation({ idea: 0.5, team: 1 }).value).toBe(750_000);
  });

  it('Scorecard weights sum to 1 and average comparisons return the median', () => {
    expect(SCORECARD_FACTORS.reduce((sum, factor) => sum + factor.weight, 0)).toBeCloseTo(1, 10);
    expect(scorecardValuation(2_000_000, {}).value).toBeCloseTo(2_000_000, 6);
    expect(scorecardValuation(2_000_000, { team: 1.25, opportunity: 1.5 }).multiplier).toBeCloseTo(1.2, 10);
  });

  it('VC method divides terminal value by the target return, net of later dilution', () => {
    const vc = vcMethodValuation({ exitMetric: 20_000_000, exitMultiple: 5, targetReturn: 20, investment: 500_000, retention: 0.5 });
    expect(vc.terminalValue).toBe(100_000_000);
    expect(vc.postMoney).toBe(2_500_000);
    expect(vc.preMoney).toBe(2_000_000);
    expect(vc.requiredOwnership).toBeCloseTo(0.2, 10);
  });

  it('reports low, median and high of the methods that produced a number', () => {
    expect(valuationRange([3, 0, 1, 2])).toEqual({ low: 1, mid: 2, high: 3 });
    expect(valuationRange([1, 3])).toEqual({ low: 1, mid: 2, high: 3 });
    expect(valuationRange([0, Number.NaN])).toBeNull();
  });
});

describe('runway', () => {
  it('equals cash / net burn floored when nothing grows', () => {
    const result = simulateRunway({ cash: 180_000, monthlyExpenses: 22_000 });
    expect(result.runwayMonths).toBe(Math.floor(180_000 / 22_000));
    expect(result.defaultAlive).toBe(false);
    expect(result.breakevenMonth).toBeNull();
  });

  it('finds the breakeven month and calls a company default alive', () => {
    const result = simulateRunway({ cash: 100_000, monthlyExpenses: 20_000, monthlyRevenue: 10_000, revenueGrowth: 0.2 });
    expect(result.breakevenMonth).toBe(5);
    expect(result.runwayMonths).toBeNull();
    expect(result.defaultAlive).toBe(true);
    expect(result.lowestCash).toBeCloseTo(73_680, 0);
  });

  it('is not alive when expenses outgrow revenue after a breakeven', () => {
    const result = simulateRunway({ cash: 10_000, monthlyExpenses: 10_000, monthlyRevenue: 10_000, expenseGrowth: 0.1, horizon: 36 });
    expect(result.breakevenMonth).toBe(1);
    expect(result.runwayMonths).not.toBeNull();
    expect(result.defaultAlive).toBe(false);
  });

  it('rates the burn multiple', () => {
    expect(burnMultiple(150_000, 100_000)).toBeCloseTo(1.5, 10);
    expect(burnMultipleRating(burnMultiple(150_000, 100_000))).toBe('good');
    expect(burnMultiple(100, 0)).toBeNull();
    expect(burnMultipleRating(0.8)).toBe('amazing');
    expect(burnMultipleRating(4)).toBe('bad');
  });
});

describe('equity grants', () => {
  it('vests nothing before the cliff, then 1/48 a month', () => {
    expect(vestedShares(48_000, 11)).toBe(0);
    expect(vestedShares(48_000, 12)).toBe(12_000);
    expect(vestedShares(48_000, 13)).toBe(13_000);
    expect(vestedShares(48_000, 60)).toBe(48_000);
  });

  it('sizes and values a grant', () => {
    const grant = equityGrant({ pct: 0.01, fullyDilutedShares: 10_000_000, pricePerShare: 1.2, strikePrice: 0.2 });
    expect(grant.shares).toBe(100_000);
    expect(grant.value).toBeCloseTo(120_000, 6);
    expect(grant.spread).toBeCloseTo(100_000, 6);
    expect(grant.schedule.map((point) => point.pct)).toEqual([0.25, 0.5, 0.75, 1]);
  });
});

describe('formatting', () => {
  it('prints compact money and percents', () => {
    expect(formatMoney(1_500_000)).toBe('$1.5M');
    expect(formatMoney(12_000_000)).toBe('$12M');
    expect(formatMoney(450_000)).toBe('$450k');
    expect(formatMoney(950)).toBe('$950');
    expect(formatPct(0.0625)).toBe('6.25%');
  });
});

describe('pro-forma cap table', () => {
  it('shares what the capped SAFEs leave pro rata among existing holders', () => {
    const table = proFormaCapTable(
      [
        { name: 'Founders', shares: 9_000_000 },
        { name: 'Option pool', shares: 1_000_000, kind: 'pool' },
      ],
      [{ amount: 450_000, cap: 12_000_000, holder: 'Pre-seed SAFEs' }, { amount: 50_000, holder: 'Uncapped' }],
    );
    expect(table.ok).toBe(true);
    const pct = Object.fromEntries(table.rows.map((row) => [row.name, row.pct]));
    expect(pct['Pre-seed SAFEs']).toBeCloseTo(0.0375, 10);
    expect(pct.Founders).toBeCloseTo(0.9 * 0.9625, 10);
    expect(pct['Option pool']).toBeCloseTo(0.1 * 0.9625, 10);
    expect(pct.Uncapped).toBeNull();
  });
});

describe('unit economics', () => {
  it('computes LTV, LTV:CAC and CAC payback', () => {
    const result = unitEconomics({ arpa: 100, grossMargin: 0.8, monthlyChurn: 0.02, cac: 1_200 });
    expect(result.ltv).toBeCloseTo(4_000, 6);
    expect(result.lifetimeMonths).toBeCloseTo(50, 6);
    expect(result.ltvToCac).toBeCloseTo(3.3333, 3);
    expect(result.paybackMonths).toBeCloseTo(15, 6);
    expect(unitEconomics({ arpa: 100, grossMargin: 0.8, monthlyChurn: 0, cac: 0 }).ltv).toBeNull();
  });

  it('compounds growth', () => {
    expect(monthlyGrowthRate(10_000, 20_000, 12)).toBeCloseTo(2 ** (1 / 12) - 1, 10);
    expect(annualized(monthlyGrowthRate(10_000, 20_000, 12)!)).toBeCloseTo(1, 10);
    expect(monthlyGrowthRate(0, 1, 1)).toBeNull();
  });
});
