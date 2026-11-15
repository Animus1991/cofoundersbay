'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react';
import {
  adminListAbuseFlags, adminGetAbuseStats, adminResolveAbuseFlag, adminRunRingDetection,
  type AbuseFlagRecord, type AbuseStats,
} from '@/lib/api';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { FactLine } from '@/components/common/FactLine';
import { StatusText, statusEl } from '@/components/common/StatusText';
import { FailedLine, RowHead } from '@/components/dashboard/SectionCard';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning',
  reviewed: 'bg-status-info-bg text-status-info',
  actioned: 'bg-status-danger-bg text-status-danger',
  dismissed: 'bg-muted text-muted-foreground',
};

const TYPE_LABELS: Record<string, { en: string; el: string }> = {
  burst_spam: { en: 'Burst spam', el: 'Μαζικά μηνύματα' },
  low_quality_repetition: { en: 'Low-quality repetition', el: 'Επανάληψη χαμηλής ποιότητας' },
  fake_collaboration: { en: 'Fake collaboration', el: 'Ψεύτικη συνεργασία' },
  streak_manipulation: { en: 'Streak manipulation', el: 'Χειραγώγηση σερί' },
  empty_node_spam: { en: 'Empty node spam', el: 'Κενοί κόμβοι' },
  self_link_abuse: { en: 'Self-link abuse', el: 'Αυτοσυνδέσεις' },
  mutual_endorsement_ring: { en: 'Endorsement ring', el: 'Κύκλος αμοιβαίων συστάσεων' },
};

const typeLabel = (type: string) => TYPE_LABELS[type] ?? { en: type.replace(/_/g, ' '), el: type.replace(/_/g, ' ') };

/**
 * What closing a flag records. `POST /admin/abuse/:id/resolve` stores the
 * action on the flag and nothing else: it sends no warning and changes no XP
 * or streak. The labels said "Send Warning" and "Reduce XP" as if it did, so
 * they now say what is recorded, and the panel says the rest is done by hand.
 * "Mark Safe" and "Dismiss" sent the same request; they are one item.
 */
const ACTIONS = [
  { id: 'record_warning', action: 'warning', status: 'actioned', en: 'Close: warning given', el: 'Κλείσιμο: δόθηκε προειδοποίηση' },
  { id: 'record_reduced_xp', action: 'reduced_xp', status: 'actioned', en: 'Close: XP reduced', el: 'Κλείσιμο: μειώθηκαν οι XP' },
  { id: 'record_streak_freeze', action: 'streak_freeze', status: 'actioned', en: 'Close: streak frozen', el: 'Κλείσιμο: πάγωσε το σερί' },
  { id: 'dismiss_as_safe', action: 'safe', status: 'dismissed', en: 'Dismiss as safe', el: 'Απόρριψη ως ασφαλές' },
] as const;

const STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'];

function SeverityBar({ v }: { v: number }) {
  const pct = Math.round(v * 100);
  const color = pct >= 70 ? 'bg-status-danger-mark' : pct >= 40 ? 'bg-status-warning-mark' : 'bg-status-success-mark';
  return (
    // The figure first, on the row's axis, then its bar.
    <div className="flex items-center gap-2">
      <span className="text-xs tabular-nums text-muted-foreground">
        <BilingualText en={`Severity ${pct}%`} el={`Σοβαρότητα ${pct}%`} compact />
      </span>
      <div className="w-20 bg-muted rounded-full h-1.5" aria-hidden="true">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AbuseMonitorPanel() {
  const sayOne = useBilingualString();
  const { success, error: toastError } = useToast();
  const [flags, setFlags] = useState<AbuseFlagRecord[]>([]);
  const [stats, setStats] = useState<AbuseStats | null>(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  // A read that failed is not "No flags found" (docs §73): say so, with Try again.
  const [readState, setReadState] = useState<'idle' | 'ready' | 'failed'>('idle');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fmtDateTime = useDateFormat();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        adminListAbuseFlags({ status: statusFilter || undefined, type: typeFilter || undefined, limit: 50 }),
        adminGetAbuseStats(),
      ]);
      setFlags(Array.isArray(res?.flags) ? res.flags : []);
      setTotal(res?.total ?? 0);
      setStats(s);
      setReadState('ready');
    } catch {
      setReadState('failed');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { void load(); }, [load]);

  const resolve = async (flagId: string, item: (typeof ACTIONS)[number]) => {
    setActionLoading(flagId);
    try {
      await adminResolveAbuseFlag(flagId, item.action, item.status);
      await load();
    } catch {
      toastError('Could not close the flag', 'Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Nothing ran ring detection before: no schedule and no button, so the
  // "Endorsement ring" flag could never appear.
  const scanRings = async () => {
    setScanning(true);
    try {
      const out = await adminRunRingDetection();
      success('Endorsement scan finished', out.flagsCreated === 0 ? 'No new endorsement rings were found.' : 'New flags are waiting for review below.');
      await load();
    } catch {
      toastError('Could not run the scan', 'Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const pending = flags.filter((f) => f.status === 'pending');
  const flagName = (f: AbuseFlagRecord) => `${f.displayName ?? f.email} · ${typeLabel(f.type).en}`;
  const flagNameEl = (f: AbuseFlagRecord) => `${f.displayName ?? f.email} · ${typeLabel(f.type).el}`;
  usePageControls([
    choiceControl('abuse_status', 'Flag status', 'Κατάσταση επισήμανσης', [{ value: '', en: 'All statuses', el: 'Όλες οι καταστάσεις' }, ...STATUSES.map((st) => ({ value: st, en: st.charAt(0).toUpperCase() + st.slice(1), el: statusEl(st) ?? st }))], statusFilter, setStatusFilter),
    choiceControl('abuse_type', 'Flag type', 'Τύπος επισήμανσης', [{ value: '', en: 'All types', el: 'Όλοι οι τύποι' }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, en: v.en, el: v.el }))], typeFilter, setTypeFilter),
    // Closing a flag has no reopening endpoint, so none of these names an undo.
    ...ACTIONS.map((item) => ({
      id: item.id,
      labelEn: item.en,
      labelEl: item.el,
      writes: true,
      options: rowOptions(pending, (f) => f.id, flagName, flagNameEl),
      unavailableEn: pending.length ? undefined : 'No pending flag is listed.',
      unavailableEl: pending.length ? undefined : 'Δεν εμφανίζεται επισήμανση σε αναμονή.',
      run: async (v?: string) => { if (v) await resolve(v, item); },
    })),
    {
      id: 'scan_endorsement_rings',
      labelEn: 'Scan endorsements for rings',
      labelEl: 'Έλεγχος συστάσεων για κύκλους',
      writes: true,
      unavailableEn: scanning ? 'A scan is running.' : undefined,
      unavailableEl: scanning ? 'Ένας έλεγχος τρέχει ήδη.' : undefined,
      run: scanRings,
    },
  ]);
  usePageList([
    {
      id: 'abuse_flags',
      labelEn: 'Abuse flags',
      labelEl: 'Επισημάνσεις κατάχρησης',
      rows: readState === 'ready' ? flags.map((f) => `${flagName(f)} · ${f.status} · severity ${Math.round(f.severity * 100)}%`) : undefined,
      rowsEl: readState === 'ready' ? flags.map((f) => `${flagNameEl(f)} · ${statusEl(f.status) ?? f.status} · σοβαρότητα ${Math.round(f.severity * 100)}%`) : undefined,
      total,
    },
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground"><BilingualText en="Abuse Monitor" el="Παρακολούθηση κατάχρησης" compact /></h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <BilingualText
              en="Review detected anti-gaming signals. Closing a flag records what you did; warnings, XP and streaks are changed by hand."
              el="Ελέγξτε τα σήματα κατάχρησης που εντοπίστηκαν. Το κλείσιμο μιας επισήμανσης καταγράφει τι κάνατε· προειδοποιήσεις, XP και σερί αλλάζουν χειροκίνητα."
              wrap
            />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void scanRings()} disabled={scanning}>
            <BilingualText en={scanning ? 'Scanning…' : 'Scan for endorsement rings'} el={scanning ? 'Έλεγχος…' : 'Έλεγχος για κύκλους συστάσεων'} compact />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`icon-sm ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> <BilingualText en="Refresh" el="Ανανέωση" compact />
          </Button>
        </div>
      </div>

      {/* Stats: stat cards, a figure under its label */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Flags', labelEl: 'Σύνολο επισημάνσεων', value: stats.totalFlags, color: 'text-foreground' },
            { label: 'Pending', labelEl: 'Σε αναμονή', value: stats.pendingFlags, color: 'text-status-warning' },
            { label: 'Actioned', labelEl: 'Με ενέργεια', value: stats.actionedFlags, color: 'text-status-danger' },
            { label: 'Dismissed', labelEl: 'Απορρίφθηκαν', value: stats.dismissedFlags, color: 'text-muted-foreground' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent>
                <p className="text-xs text-muted-foreground"><BilingualText en={s.label} el={s.labelEl} compact wrap /></p>
                <p className={`page-stat text-2xl font-bold tabular-nums ${s.color}`}>{s.value ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters: over a list that was read */}
      {readState !== 'failed' ? (
        <div className="flex gap-3 flex-wrap">
          <select
            aria-label={bilingualInline('Status', 'Κατάσταση')}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-input bg-background rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="">{sayOne('All statuses', 'Όλες οι καταστάσεις')}</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>{sayOne(st.charAt(0).toUpperCase() + st.slice(1), statusEl(st) ?? st)}</option>
            ))}
          </select>
          <select
            aria-label={bilingualInline('Type', 'Τύπος')}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-input bg-background rounded-md px-3 py-2 focus:outline-none"
          >
            <option value="">{sayOne('All types', 'Όλοι οι τύποι')}</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{sayOne(v.en, v.el)}</option>)}
          </select>
        </div>
      ) : null}

      {/* Flags: a section card, one row per flag */}
      <Card>
        <CardHeader>
          <CardTitle>
            {readState === 'ready' ? (
              <BilingualText en={`${total} flag${total !== 1 ? 's' : ''}`} el={`${total} ${total !== 1 ? 'επισημάνσεις' : 'επισήμανση'}`} compact />
            ) : (
              <BilingualText en="Flags" el="Επισημάνσεις" compact />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
        {readState === 'failed' && !loading ? (
          <div className="px-4 py-6 sm:px-6">
            <FailedLine en="The flags could not be read just now." el="Οι επισημάνσεις δεν διαβάστηκαν αυτή τη στιγμή." onRetry={() => void load()} busy={loading} />
          </div>
        ) : loading || readState === 'idle' ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
            <RefreshCw className="icon-sm animate-spin" aria-hidden="true" /> <BilingualText en="Loading…" el="Φόρτωση…" compact />
          </div>
        ) : flags.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">
            {statusFilter === 'pending' && !typeFilter ? (
              <BilingualText en="Nothing is waiting for review." el="Τίποτα δεν περιμένει έλεγχο." compact wrap />
            ) : statusFilter || typeFilter ? (
              <BilingualText en="No flags match these filters." el="Καμία επισήμανση δεν ταιριάζει σε αυτά τα φίλτρα." compact wrap />
            ) : (
              <BilingualText en="Nothing has been flagged." el="Δεν έχει επισημανθεί τίποτα." compact wrap />
            )}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {flags.map((f) => (
              <div key={f.id} className="space-y-2 px-4 py-3 hover:bg-muted/40 sm:px-6">
                <RowHead
                  title={f.displayName ?? <span translate="no">{f.email}</span>}
                  subtitle={(
                    <FactLine
                      items={[
                        <BilingualText key="type" en={typeLabel(f.type).en} el={typeLabel(f.type).el} compact />,
                        <span key="id" className="font-mono" translate="no">{f.userId?.slice(0, 8)}…</span>,
                        fmtDateTime(f.createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      ]}
                    />
                  )}
                  asideStays
                  aside={(
                    <>
                      <span className={`rounded-md px-1.5 py-0.5 text-xs ${STATUS_STYLE[f.status] ?? ''}`}>
                        <StatusText value={f.status} />
                      </span>
                      {f.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === f.id}
                              aria-label={bilingualAria(`Close the flag on ${f.displayName ?? f.email}`, `Κλείσιμο της επισήμανσης για ${f.displayName ?? f.email}`)}
                            >
                              <BilingualText en="Close" el="Κλείσιμο" compact /> <ChevronDown className="icon-sm" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ACTIONS.map((item, i) => (
                              <Fragment key={item.id}>
                                {i === ACTIONS.length - 1 ? <DropdownMenuSeparator /> : null}
                                <DropdownMenuItem onSelect={() => void resolve(f.id, item)}>
                                  {item.action === 'safe' ? <CheckCircle className="icon-sm" aria-hidden="true" /> : <AlertTriangle className="icon-sm" aria-hidden="true" />}
                                  <BilingualText en={item.en} el={item.el} compact />
                                </DropdownMenuItem>
                              </Fragment>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}
                />
                {f.description && <p className="text-sm text-muted-foreground first-letter:uppercase">{f.description}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <SeverityBar v={f.severity} />
                  {f.actionTaken && (
                    <span className="text-xs text-muted-foreground">→ <StatusText value={f.actionTaken} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>

      {stats && (stats.topOffenders ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle><BilingualText en="Top Offenders" el="Συχνότεροι παραβάτες" compact /></CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(stats.topOffenders ?? []).slice(0, 10).map((o) => (
                <div key={o.userId} className="px-4 py-3 sm:px-6">
                  <RowHead
                    title={o.displayName ?? <span translate="no">{o.email}</span>}
                    subtitle={(
                      <FactLine
                        items={[
                          <span key="id" className="font-mono" translate="no">{o.userId?.slice(0, 8)}…</span>,
                          <BilingualText key="n" en={`${o.flagCount} flags`} el={`${o.flagCount} επισημάνσεις`} compact />,
                        ]}
                      />
                    )}
                    aside={<SeverityBar v={o.maxSeverity} />}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
