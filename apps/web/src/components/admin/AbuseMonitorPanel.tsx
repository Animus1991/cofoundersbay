'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, ChevronDown } from 'lucide-react';
import {
  adminListAbuseFlags, adminGetAbuseStats,
  adminResolveAbuseFlag, AbuseFlagRecord, AbuseStats,
} from '@/lib/api';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  actioned: 'bg-rose-100 text-rose-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

const TYPE_LABELS: Record<string, string> = {
  burst_spam: 'Burst Spam',
  low_quality_repetition: 'Low Quality Repeat',
  fake_collaboration: 'Fake Collab',
  streak_manipulation: 'Streak Manip.',
  empty_node_spam: 'Empty Node Spam',
  self_link_abuse: 'Self-Link Abuse',
  mutual_endorsement_ring: 'Endorsement Ring',
};

function SeverityBar({ v }: { v: number }) {
  const pct = Math.round(v * 100);
  const color = pct >= 70 ? 'bg-rose-500' : pct >= 40 ? 'bg-amber-400' : 'bg-green-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500">{pct}%</span>
    </div>
  );
}

export function AbuseMonitorPanel() {
  const [flags, setFlags] = useState<AbuseFlagRecord[]>([]);
  const [stats, setStats] = useState<AbuseStats | null>(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        adminListAbuseFlags({ status: statusFilter || undefined, type: typeFilter || undefined, limit: 50 }),
        adminGetAbuseStats(),
      ]);
      setFlags(res.flags);
      setTotal(res.total);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { void load(); }, [load]);

  const resolve = async (flagId: string, action: string, status: 'actioned' | 'dismissed') => {
    setActionLoading(flagId);
    try {
      await adminResolveAbuseFlag(flagId, action, status);
      setOpenAction(null);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Abuse Monitor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and action detected anti-gaming signals.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Flags', value: stats.totalFlags, color: 'text-gray-800' },
            { label: 'Pending', value: stats.pendingFlags, color: 'text-amber-600' },
            { label: 'Actioned', value: stats.actionedFlags, color: 'text-rose-600' },
            { label: 'Dismissed', value: stats.dismissedFlags, color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All statuses</option>
          {['pending', 'reviewed', 'actioned', 'dismissed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Flags table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <AlertTriangle className="icon-sm text-amber-500" aria-hidden="true" /> {total} flag{total !== 1 ? 's' : ''}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <RefreshCw className="icon-md animate-spin mr-2" aria-hidden="true" /> Loading…
          </div>
        ) : flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Shield className="icon-xl mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm">No flags found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {flags.map((f) => (
              <div key={f.id} className="px-5 py-3.5 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {TYPE_LABELS[f.type] ?? f.type}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLE[f.status] ?? ''}`}>
                        {f.status}
                      </span>
                      {f.actionTaken && (
                        <span className="text-xs text-gray-400">→ {f.actionTaken}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">
                      <span className="font-medium">{f.displayName ?? f.email}</span>
                      <span className="text-gray-400 text-xs ml-1">({f.userId.slice(0, 8)}…)</span>
                    </p>
                    {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                    <div className="mt-1">
                      <SeverityBar v={f.severity} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {f.status === 'pending' && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenAction(openAction === f.id ? null : f.id)}
                        className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-100"
                      >
                        Action <ChevronDown className="icon-2xs" aria-hidden="true" />
                      </button>
                      {openAction === f.id && (
                        <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[170px] py-1">
                          {[
                            { action: 'warning', label: 'Send Warning', icon: AlertTriangle },
                            { action: 'reduced_xp', label: 'Reduce XP', icon: XCircle },
                            { action: 'streak_freeze', label: 'Freeze Streak', icon: XCircle },
                            { action: 'safe', label: 'Mark Safe', icon: CheckCircle },
                          ].map(({ action, label, icon: Icon }) => (
                            <button
                              key={action}
                              disabled={actionLoading === f.id}
                              onClick={() => void resolve(f.id, action, action === 'safe' ? 'dismissed' : 'actioned')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                            >
                              <Icon className="w-3.5 h-3.5 text-gray-400" /> {label}
                            </button>
                          ))}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              disabled={actionLoading === f.id}
                              onClick={() => void resolve(f.id, 'safe', 'dismissed')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-400 text-left"
                            >
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats && stats.topOffenders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Offenders</h3>
          <div className="space-y-2">
            {stats.topOffenders.slice(0, 10).map((o) => (
              <div key={o.userId} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{o.displayName ?? o.email}</span>
                  <span className="text-xs text-gray-400 ml-2 font-mono">{o.userId.slice(0, 8)}…</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{o.flagCount} flags</span>
                  <SeverityBar v={o.maxSeverity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
