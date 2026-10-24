import { describe, expect, it } from 'vitest';
import type { ServiceInquiryItem } from '@/lib/api';
import { averageRating, bookFigures, changeVs, serviceRows } from './provider-book';

const NOW = Date.parse('2026-10-23T12:00:00Z');
const DAY = 86_400_000;

function row(id: string, status: ServiceInquiryItem['status'], daysAgo: number, over: Partial<ServiceInquiryItem> = {}): ServiceInquiryItem {
  return {
    id,
    status,
    message: 'm',
    responseMessage: null,
    agreedScope: null,
    budgetEstimate: null,
    agreedPrice: null,
    currency: 'EUR',
    timelineExpected: null,
    rating: null,
    reviewComment: null,
    createdAt: new Date(NOW - daysAgo * DAY).toISOString(),
    resolvedAt: null,
    offer: { id: 'svc-a', title: 'Model', category: 'finance' },
    client: { id: 'c', displayName: 'C', avatarUrl: null },
    provider: { id: 'p', displayName: 'P', avatarUrl: null },
    ...over,
  };
}

describe('provider book', () => {
  const rows = [
    row('1', 'open', 2),
    row('2', 'in_discussion', 5),
    row('3', 'accepted', 10, { agreedPrice: 3800 }),
    row('4', 'completed', 20, { agreedPrice: 1800, rating: 5, offer: { id: 'svc-b', title: 'CFO', category: 'finance' } }),
    row('5', 'completed', 45, { agreedPrice: 1200, rating: 4 }),
  ];

  it('counts the window: received, answered, projects, agreed value', () => {
    const f = bookFigures(rows, NOW - 30 * DAY, NOW + 1);
    expect(f).toMatchObject({ inquiries: 4, answered: 3, projects: 2, completed: 1, agreedValue: 5600, currency: 'EUR', responseRate: 75, conversionRate: 50 });
  });

  it('says nothing rather than 0% for an empty window', () => {
    const f = bookFigures(rows, NOW - 400 * DAY, NOW - 300 * DAY);
    expect(f.responseRate).toBeNull();
    expect(f.conversionRate).toBeNull();
  });

  it('does not add up two currencies', () => {
    const f = bookFigures([...rows, row('6', 'accepted', 1, { agreedPrice: 500, currency: 'USD' })], NOW - 30 * DAY, NOW + 1);
    expect(f.agreedValue).toBeNull();
  });

  it('compares with the window before only when there is one', () => {
    expect(changeVs(6, 4)).toBe(50);
    expect(changeVs(6, 0)).toBeNull();
    expect(changeVs(null, 3)).toBeNull();
  });

  it('lists the services asked about in the window, with that window’s rating', () => {
    const list = serviceRows(rows, NOW - 30 * DAY, NOW + 1);
    expect(list.map((s) => [s.title, s.inquiries, s.agreedValue, s.rating])).toEqual([
      ['Model', 3, 3800, null],
      ['CFO', 1, 1800, 5],
    ]);
  });

  it('does not add a service’s prices across two currencies', () => {
    const list = serviceRows(
      [...rows, row('6', 'accepted', 1, { agreedPrice: 500, currency: 'USD' })],
      NOW - 30 * DAY,
      NOW + 1,
    );
    const model = list.find((s) => s.title === 'Model');
    expect(model?.agreedValue).toBeNull();
    expect(model?.projects).toBe(2);
  });

  it('averages every rating given, or only the window when one is named', () => {
    expect(averageRating(rows)).toEqual({ value: 4.5, count: 2 });
    expect(averageRating(rows, NOW - 30 * DAY, NOW + 1)).toEqual({ value: 5, count: 1 });
    expect(averageRating([])).toEqual({ value: null, count: 0 });
  });
});
