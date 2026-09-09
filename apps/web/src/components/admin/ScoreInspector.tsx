'use client';

import { useState } from 'react';
import {
  Search, ChevronDown, ChevronUp, AlertTriangle, Award,
  Zap, TrendingUp, Shield, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  adminInspectUserScore,
  AdminScoreInspectReport,
  AdminXPBreakdownItem,
} from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  actioned: 'bg-rose-100 text-rose-700',
  dismissed:'bg-gray-100 text-gray-500',
};

function Section({
  title, icon: Icon, children, defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-sm text-gray-700">
          <Icon className="w-4 h-4" />
          {title}
        </div>
        {open ? <ChevronUp className="icon-sm text-gray-400" aria-hidden="true" /> : <ChevronDown className="icon-sm text-gray-400" aria-hidden="true" />}
      </button>
      {open && <div className="p-5 bg-white">{children}</div>}
    </div>
  );
}

function XPEventRow({ e }: { e: AdminXPBreakdownItem }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 text-sm">
      <td className="py-2 pr-3">
        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
          {e.eventType}
        </span>
      </td>
      <td className="py-2 pr-3 tabular-nums text-gray-500">{e.baseXp}</td>
      <td className="py-2 pr-3 tabular-nums font-medium text-gray-900">{e.finalXp}</td>
      <td className="py-2 pr-3 tabular-nums text-gray-500">×{e.weightMultiplier.toFixed(2)}</td>
      <td className="py-2 pr-3">
        {e.isDiminished && (
          <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">DR</span>
        )}
      </td>
      <td className="py-2 text-xs text-gray-400">{e.explain}</td>
    </tr>
  );
}

export function ScoreInspector() {
  const [userId, setUserId] = useState('');
  const [query, setQuery] = useState('');
  const [report, setReport] = useState<AdminScoreInspectReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runInspection = async () => {
    const id = userId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const r = await adminInspectUserScore(id);
      setReport(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // XP by event type chart data
  const xpChartData = report
    ? Object.entries(report.xpByEventType)
        .map(([type, v]) => ({ type: type.replace(/_/g, ' '), xp: v.totalXp, count: v.count }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10)
    : [];

  const pendingFlags = report?.anomalies.filter((a) => a.status === 'pending') ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Score Inspector</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Full per-user scoring audit: XP breakdown, badges, streak, contributions, anomaly flags.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-gray-400" aria-hidden="true" />
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void runInspection()}
            placeholder="Enter user ID…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={() => void runInspection()}
          disabled={loading || !userId.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : 'Inspect'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {report.avatarUrl ? (
                  <img src={report.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {(report.displayName ?? report.email)[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">
                    {report.displayName ?? '—'}{' '}
                    <span className="text-gray-400 font-normal text-sm">({report.role})</span>
                  </div>
                  <div className="text-sm text-gray-500">{report.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{report.userId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{report.totalXp} XP</div>
                <div className="text-sm text-gray-500">
                  Level {report.level} · {report.levelLabel}
                </div>
              </div>
            </div>

            {/* Human summary */}
            <div className="mt-4 bg-indigo-50 rounded-lg px-4 py-3 text-sm text-indigo-800">
              <Shield className="inline w-3.5 h-3.5 mr-1 opacity-70" aria-hidden="true" />
              {report.humanSummary}
            </div>

            {/* Suppression warning */}
            {report.suppressedUntil && (
              <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5 text-sm text-rose-700 flex items-center gap-2">
                <AlertTriangle className="icon-sm shrink-0" aria-hidden="true" />
                Burst suppression active until{' '}
                <span className="font-mono">{new Date(report.suppressedUntil).toLocaleString()}</span>
              </div>
            )}

            {/* Open flags warning */}
            {pendingFlags.length > 0 && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="icon-sm shrink-0" aria-hidden="true" />
                {pendingFlags.length} open abuse flag{pendingFlags.length > 1 ? 's' : ''} pending review
              </div>
            )}
          </div>

          {/* XP by Event Type Chart */}
          <Section title="XP by Event Type" icon={Zap} defaultOpen>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={xpChartData} layout="vertical" margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={130} />
                <Tooltip
                  formatter={(v: number, _: string, props: { payload?: { count: number } }) =>
                    [`${v} XP (${props.payload?.count ?? 0} events)`, 'Total XP']
                  }
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="xp" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 overflow-auto max-h-40">
              <table className="w-full text-xs text-gray-600">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-1.5 font-medium">Event</th>
                    <th className="pb-1.5 font-medium text-right">Events</th>
                    <th className="pb-1.5 font-medium text-right">Total XP</th>
                    <th className="pb-1.5 font-medium text-right">Avg XP</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.xpByEventType).map(([type, v]) => (
                    <tr key={type} className="border-b border-gray-50">
                      <td className="py-1 font-mono text-xs">{type}</td>
                      <td className="py-1 text-right tabular-nums">{v.count}</td>
                      <td className="py-1 text-right tabular-nums font-medium">{v.totalXp}</td>
                      <td className="py-1 text-right tabular-nums text-gray-400">{v.avgXp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Recent Events */}
          <Section title={`Recent XP Events (last ${report.recentEvents.length})`} icon={Clock}>
            <div className="overflow-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Base</th>
                    <th className="pb-2 font-medium">Final</th>
                    <th className="pb-2 font-medium">Mult</th>
                    <th className="pb-2 font-medium">Flag</th>
                    <th className="pb-2 font-medium">Explain</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recentEvents.map((e) => (
                    <XPEventRow key={e.id} e={e} />
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Badges */}
          <Section title={`Badges (${report.badges.length})`} icon={Award}>
            {report.badges.length === 0 ? (
              <p className="text-sm text-gray-400">No badges earned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {report.badges.map((b) => (
                  <div
                    key={b.badgeId}
                    className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    <span className="font-medium text-gray-800">{b.name}</span>
                    <span className="text-xs text-gray-400">· {b.category}</span>
                    {!b.seen && (
                      <span className="text-xs bg-green-100 text-green-600 px-1 rounded">new</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Streak */}
          <Section title="Streak" icon={TrendingUp}>
            {report.streak ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Current Streak</p>
                  <p className="font-bold text-2xl text-indigo-600">{report.streak.currentStreak}d</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Longest</p>
                  <p className="font-semibold text-gray-800">{report.streak.longestStreak}d</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Last Active</p>
                  <p className="text-gray-700">
                    {report.streak.lastActiveDate
                      ? new Date(report.streak.lastActiveDate).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Grace Used</p>
                  <p className="text-gray-700">
                    {report.streak.graceUsedAt
                      ? new Date(report.streak.graceUsedAt).toLocaleDateString()
                      : 'No'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No streak record found.</p>
            )}
          </Section>

          {/* Anomaly Flags */}
          <Section title={`Abuse Flags (${report.anomalies.length})`} icon={AlertTriangle}>
            {report.anomalies.length === 0 ? (
              <p className="text-sm text-gray-400">No abuse flags on this user.</p>
            ) : (
              <div className="space-y-2">
                {report.anomalies.map((a) => (
                  <div key={a.flagId} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: `hsl(${(1 - a.severity) * 120}, 70%, 50%)` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {a.type}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[a.status] ?? ''}`}
                        >
                          {a.status}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          severity {(a.severity * 100).toFixed(0)}%
                        </span>
                      </div>
                      {a.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Contribution scores */}
          {report.contributions.length > 0 && (
            <Section title={`Workspace Contributions (${report.contributions.length})`} icon={TrendingUp}>
              <div className="space-y-2">
                {report.contributions.map((c) => (
                  <div key={c.workspaceId} className="flex items-center justify-between text-sm border-b border-gray-50 py-1.5">
                    <span className="font-mono text-xs text-gray-500">{c.workspaceId}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, c.score)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-800 w-8 text-right">{c.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Search className="w-10 h-10 mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">Enter a user ID above to inspect their scoring profile.</p>
        </div>
      )}
    </div>
  );
}
