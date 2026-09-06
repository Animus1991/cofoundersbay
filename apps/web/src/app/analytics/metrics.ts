import { Activity, Eye, Heart, MessageCircle, Target, TrendingUp, UserPlus } from 'lucide-react';
import type { UserMetrics } from '@/lib/api';
import type { StatusTone } from '@/lib/semantic-colors';

export interface AnalyticsMetric {
  label: string;
  value: number | null;
  change: number | null;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: typeof TrendingUp;
  tone: StatusTone;
}

export const METRIC_TONE: Record<string, StatusTone> = {
  'Profile Views': 'info',
  'New Connections': 'success',
  'Messages Sent': 'accent',
  'Engagement Rate': 'accent',
  'Search Appearances': 'warning',
  'Activity Score': 'info',
};

/**
 * Builds the metric tiles from whatever the API actually returned.
 *
 * `UserMetrics` declares every field as required, but that is a compile-time
 * promise about a runtime payload — `apiRequest` casts the response without
 * validating it. When the shape disagreed (an unhandled preview route, a partial
 * payload, an older API), the previous version dereferenced `m.profileViews` and
 * took the whole page down through the error boundary.
 *
 * Accepting a partial input and defaulting each field keeps the page rendering:
 * a metric the server didn't send reads as 0 with a neutral trend, which is what
 * "no data for this period" should look like anyway.
 *
 * Lives outside `page.tsx` so it can be unit-tested — the App Router only allows
 * a fixed set of named exports from a page module.
 */
export function metricsToDisplay(m?: Partial<{ [K in keyof UserMetrics]: number | null }> | null): AnalyticsMetric[] {
  const changeType = (v: number | null): 'increase' | 'decrease' | 'neutral' =>
    v === null ? 'neutral' : v > 0 ? 'increase' : v < 0 ? 'decrease' : 'neutral';
  // Guards against null/NaN/strings as well as undefined — a JSON payload can
  // carry any of them, and NaN would render as "NaN" in the tile.
  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  const tile = (
    label: string,
    value: unknown,
    change: unknown,
    icon: AnalyticsMetric['icon'],
  ): AnalyticsMetric => ({
    label,
    value: num(value),
    change: num(change),
    changeType: changeType(num(change)),
    icon,
    tone: METRIC_TONE[label] ?? 'neutral',
  });

  return [
    tile('Profile Views', m?.profileViews, m?.profileViewsChange, Eye),
    tile('New Connections', m?.newConnections, m?.newConnectionsChange, UserPlus),
    tile('Messages Sent', m?.messagesSent, m?.messagesSentChange, MessageCircle),
    tile('Engagement Rate', m?.engagementRate, m?.engagementRateChange, Heart),
    tile('Search Appearances', m?.searchAppearances, m?.searchAppearancesChange, Target),
    tile('Activity Score', m?.activityScore, m?.activityScoreChange, Activity),
  ];
}
