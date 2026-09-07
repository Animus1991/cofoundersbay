import { describe, expect, it } from 'vitest';
import {
  FUNDRAISING_SEED_DOCS,
  FUNDRAISING_SEED_LEADS,
  fundraisingPipelineStats,
  fundraisingRoundView,
} from '@/lib/fundraising-demo';

describe('fundraising catalogue lockstep', () => {
  const stats = fundraisingPipelineStats(FUNDRAISING_SEED_LEADS);
  const round = fundraisingRoundView(FUNDRAISING_SEED_LEADS);

  it('keeps pipeline counts internally consistent', () => {
    expect(FUNDRAISING_SEED_LEADS).toHaveLength(6);
    expect(stats.total).toBe(6);
    expect(stats.active).toBe(3);
    expect(stats.committed).toBe(1);
    expect(stats.conversion).toBe(17);
  });

  it('never shows a round investor count that disagrees with committed leads', () => {
    expect(round.investors).toBe(stats.committed);
    expect(round.raised).toBe(375_000);
    expect(round.target).toBe(750_000);
    expect(Math.round((round.raised / round.target) * 100)).toBe(50);
  });

  it('keeps the data room list at 10 documents for the Data Room tab badge', () => {
    expect(FUNDRAISING_SEED_DOCS).toHaveLength(10);
    expect(FUNDRAISING_SEED_DOCS.filter((d) => d.isRequired)).toHaveLength(5);
  });
});
