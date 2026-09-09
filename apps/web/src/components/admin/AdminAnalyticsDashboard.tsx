'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, TrendingUp, Award, Zap, Shield, RefreshCw,
} from 'lucide-react';
import {
  adminGetXPDistribution,
  adminGetBadgeUnlockRates,
  XPDistributionBucket,
  BadgeUnlockRate,
} from '@/lib/api';
import { useChartTheme } from '@/lib/chart-theme';

/**
 * Badge rarity is an ordinal domain ramp, not a chart series: the tiers carry
 * fixed meaning across the gamification surface, so they stay pinned rather
 * than drawing from the categorical palette in lib/chart-theme.
 */
const RARITY_COLORS: Record<string, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'indigo',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'indigo' | 'green' | 'amber' | 'rose';
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminAnalyticsDashboard() {
  const theme = useChartTheme();
  const [xpDist, setXpDist] = useState<XPDistributionBucket[]>([]);
  const [badgeRates, setBadgeRates] = useState<BadgeUnlockRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [xp, badges] = await Promise.all([
        adminGetXPDistribution(),
        adminGetBadgeUnlockRates(),
      ]);
      setXpDist(xp);
      setBadgeRates(badges);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const totalUsers = xpDist.reduce((s, b) => s + b.count, 0);
  const usersWithXP = xpDist.filter((b) => b.bucket !== '0–99').reduce((s, b) => s + b.count, 0);
  const totalBadgeUnlocks = badgeRates.reduce((s, b) => s + b.unlockCount, 0);
  const avgBadgeRate =
    badgeRates.length > 0
      ? (badgeRates.reduce((s, b) => s + b.unlockRate, 0) / badgeRates.length).toFixed(1)
      : '0';

  // Gini coefficient for XP distribution (contribution inequality measure)
  const gini = (() => {
    if (xpDist.length === 0) return 0;
    const counts = xpDist.map((b) => b.count);
    const n = counts.reduce((s, c) => s + c, 0);
    if (n === 0) return 0;
    // Approximate with bucket midpoints
    const midpoints = [50, 200, 450, 800, 1500, 3500, 6000];
    let sumNumer = 0;
    for (let i = 0; i < counts.length; i++) {
      for (let j = 0; j < counts.length; j++) {
        sumNumer += counts[i] * counts[j] * Math.abs((midpoints[i] ?? 0) - (midpoints[j] ?? 0));
      }
    }
    const meanXp = midpoints.reduce((s, m, i) => s + m * counts[i], 0) / n;
    return meanXp > 0 ? parseFloat((sumNumer / (2 * n * n * meanXp)).toFixed(3)) : 0;
  })();

  // Badge pie chart — top 6 by unlock rate
  const topBadges = [...badgeRates]
    .sort((a, b) => b.unlockCount - a.unlockCount)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="icon-lg text-indigo-500 animate-spin" aria-hidden="true" />
        <span className="ml-2 text-gray-500">Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Failed to load analytics: {error}
        <button onClick={load} className="ml-4 underline text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gamification Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide scoring health and engagement metrics</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="icon-sm" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} color="indigo" />
        <StatCard
          icon={TrendingUp}
          label="Users with XP"
          value={usersWithXP}
          sub={`${totalUsers > 0 ? ((usersWithXP / totalUsers) * 100).toFixed(1) : 0}% of total`}
          color="green"
        />
        <StatCard
          icon={Award}
          label="Total Badge Unlocks"
          value={totalBadgeUnlocks}
          sub={`Avg rate ${avgBadgeRate}%`}
          color="amber"
        />
        <StatCard
          icon={Zap}
          label="XP Gini Coefficient"
          value={gini}
          sub={gini < 0.4 ? 'Healthy distribution' : gini < 0.6 ? 'Moderate inequality' : 'High inequality'}
          color={gini < 0.4 ? 'green' : gini < 0.6 ? 'amber' : 'rose'}
        />
      </div>

      {/* XP Distribution Histogram */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">XP Distribution Histogram</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={xpDist} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              formatter={(v: number) => [`${v} users`, 'Count']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="count" fill={theme.series[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2">
          Each bar shows how many users fall within that XP range.
          A healthy platform shows a gradual right-tail, not a spike at 0.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badge Unlock Rates */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Badge Unlock Rates (Top 6)</h3>
          {topBadges.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No badges defined yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={topBadges}
                  dataKey="unlockCount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, unlockRate }: { name: string; unlockRate: number }) =>
                    `${name} (${unlockRate}%)`
                  }
                  labelLine={false}
                >
                  {topBadges.map((b, i) => (
                    <Cell
                      key={b.badgeId}
                      fill={
                        RARITY_COLORS[b.rarity] ??
                        theme.series[i % theme.series.length]
                      }
                    />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v} unlocks`, name]}
                  contentStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Badge Rate Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">All Badge Rates</h3>
          <div className="overflow-auto max-h-[220px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Badge</th>
                  <th className="pb-2 font-medium">Rarity</th>
                  <th className="pb-2 font-medium text-right">Unlocks</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {badgeRates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">No badges yet</td>
                  </tr>
                ) : (
                  badgeRates.map((b) => (
                    <tr key={b.badgeId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-1.5 font-medium text-gray-800">{b.name}</td>
                      <td className="py-1.5">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: `${RARITY_COLORS[b.rarity] ?? '#6b7280'}22`,
                            color: RARITY_COLORS[b.rarity] ?? '#6b7280',
                          }}
                        >
                          {b.rarity}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{b.unlockCount}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-500">
                        {b.unlockRate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shield indicator */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
        <Shield className="icon-sm mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <span className="font-semibold">Explainability note: </span>
          All scores are computed from real user actions — no synthetic inflation.
          Gini coefficient &lt; 0.4 indicates healthy distribution. XP histogram
          should show a gradual right-tail for a healthy active community.
        </div>
      </div>
    </div>
  );
}
