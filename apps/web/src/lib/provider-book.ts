import type { ServiceInquiryItem } from '@/lib/api';

/**
 * A provider's figures, counted from their inquiries (docs §97).
 *
 * /provider/analytics drew Inquiries, Revenue, Response Rate, a funnel and a
 * per-service table from constants (27 inquiries, $8,400, 94%, "Legal
 * Consultation"), and said "not tracked yet" outside the showcase. The
 * owner chose to count them from the inquiries, as the provider home does:
 * an inquiry is answered once it leaves `open`, it became a project at
 * `accepted` or `completed`, and a project's value is its agreed price.
 * Nothing is paid through the platform, so the value is "agreed", not
 * revenue.
 */

const PROJECT = new Set(['accepted', 'completed']);

export type BookFigures = {
  inquiries: number;
  answered: number;
  projects: number;
  completed: number;
  /** Sum of agreed prices of the projects; null when currencies differ. */
  agreedValue: number | null;
  currency: string | null;
  /** Answered out of received, 0-100; null with no inquiry. */
  responseRate: number | null;
  /** Became projects out of received, 0-100; null with no inquiry. */
  conversionRate: number | null;
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);

/** The inquiries received in [from, to), and what became of them. */
export function bookFigures(rows: readonly ServiceInquiryItem[], from: number, to: number): BookFigures {
  const received = rows.filter((r) => {
    const t = Date.parse(r.createdAt);
    return t >= from && t < to;
  });
  const answered = received.filter((r) => r.status !== 'open').length;
  const projects = received.filter((r) => PROJECT.has(r.status));
  const currencies = new Set(projects.filter((r) => r.agreedPrice != null).map((r) => r.currency || 'EUR'));
  const single = currencies.size <= 1;
  return {
    inquiries: received.length,
    answered,
    projects: projects.length,
    completed: received.filter((r) => r.status === 'completed').length,
    agreedValue: single ? projects.reduce((sum, r) => sum + (r.agreedPrice ?? 0), 0) : null,
    currency: single ? [...currencies][0] ?? null : null,
    responseRate: pct(answered, received.length),
    conversionRate: pct(projects.length, received.length),
  };
}

/** Change against the window before, in percent; null when there is nothing to compare with. */
export function changeVs(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type ServiceRow = {
  id: string;
  title: string;
  inquiries: number;
  projects: number;
  /** Null when the projects in the window are priced in more than one currency. */
  agreedValue: number | null;
  currency: string | null;
  /** Mean of the ratings on inquiries received in the window; null when none. */
  rating: number | null;
};

/** One row per service asked about in [from, to), most asked first. */
export function serviceRows(rows: readonly ServiceInquiryItem[], from: number, to: number): ServiceRow[] {
  const byOffer = new Map<string, ServiceRow & { ratings: number[]; currencies: Set<string> }>();
  for (const r of rows) {
    const id = r.offer?.id;
    if (!id) continue;
    const t = Date.parse(r.createdAt);
    if (!(t >= from && t < to)) continue;
    const row = byOffer.get(id) ?? {
      id,
      title: r.offer?.title ?? '—',
      inquiries: 0,
      projects: 0,
      agreedValue: 0,
      currency: r.currency || 'EUR',
      rating: null,
      ratings: [],
      currencies: new Set<string>(),
    };
    row.inquiries += 1;
    if (r.rating != null) row.ratings.push(r.rating);
    if (PROJECT.has(r.status)) {
      row.projects += 1;
      if (r.agreedPrice != null) row.currencies.add(r.currency || 'EUR');
      if (row.currencies.size > 1) row.agreedValue = null;
      else if (row.agreedValue != null) row.agreedValue += r.agreedPrice ?? 0;
    }
    byOffer.set(id, row);
  }
  return [...byOffer.values()]
    .filter((r) => r.inquiries > 0)
    .map(({ ratings, currencies, ...r }) => ({
      ...r,
      currency: currencies.size === 1 ? [...currencies][0] : r.agreedValue == null ? null : r.currency,
      rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    }))
    .sort((a, b) => b.inquiries - a.inquiries || (b.agreedValue ?? 0) - (a.agreedValue ?? 0));
}

/**
 * Mean rating, one decimal; null when none is rated.
 * With `from` and `to`, only inquiries received in [from, to).
 */
export function averageRating(
  rows: readonly ServiceInquiryItem[],
  from?: number,
  to?: number,
): { value: number | null; count: number } {
  const rated = rows.filter((r) => {
    if (r.rating == null) return false;
    if (from == null || to == null) return true;
    const t = Date.parse(r.createdAt);
    return t >= from && t < to;
  });
  return {
    value: rated.length ? Math.round((rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length) * 10) / 10 : null,
    count: rated.length,
  };
}
