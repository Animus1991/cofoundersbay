'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FlaskConical, Play, Square, Trash2, Plus, RefreshCw,
  Settings, ChevronDown, ChevronUp, BarChart2, Save,
} from 'lucide-react';
import {
  adminListExperiments, adminCreateExperiment, adminUpdateExperiment,
  adminActivateExperiment, adminDeactivateExperiment, adminDeleteExperiment,
  adminGetExperimentMetrics, adminListConfigs, adminUpsertConfig, adminSeedDefaultConfigs,
  ExperimentRecord, ExperimentMetrics, SystemConfigRecord,
} from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';

// ── Helpers ────────────────────────────────────────────────────────────────────

function MetricDiff({
  labelA, labelB, valA, valB, unit = '',
}: {
  labelA: string; labelB: string;
  valA: number; valB: number;
  unit?: string;
}) {
  const diff = valB - valA;
  const pct = valA > 0 ? ((diff / valA) * 100).toFixed(1) : '—';
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-1/3">
        <p className="text-xs text-gray-400">{labelA}</p>
        <p className="font-medium text-gray-800">{valA.toFixed(1)}{unit}</p>
      </div>
      <div className="w-1/3">
        <p className="text-xs text-gray-400">{labelB}</p>
        <p className="font-medium text-gray-800">{valB.toFixed(1)}{unit}</p>
      </div>
      <div className="w-1/3 text-right">
        <p className="text-xs text-gray-400">Δ</p>
        <p className={`font-semibold ${diff >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
          {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{unit}
          {' '}
          {pct !== '—' && (
            <span className="text-xs opacity-70">({pct}%)</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Experiment Card ─────────────────────────────────────────────────────────────

function ExperimentCard({
  exp, onRefresh,
}: {
  exp: ExperimentRecord;
  onRefresh: () => void;
}) {
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState<ExperimentMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [actLoading, setActLoading] = useState(false);

  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const m = await adminGetExperimentMetrics(exp.id);
      setMetrics(m);
    } finally {
      setMetricsLoading(false);
    }
  };

  const toggle = async () => {
    setActLoading(true);
    try {
      if (exp.active) await adminDeactivateExperiment(exp.id);
      else await adminActivateExperiment(exp.id);
      onRefresh();
    } finally {
      setActLoading(false);
    }
  };

  const del = async () => {
    const ok = await confirm({
      title: `Delete experiment "${exp.name}"?`,
      description: 'Its variants and collected results will be removed. This cannot be undone.',
      confirmLabel: 'Delete experiment',
      intent: 'destructive',
    });
    if (!ok) return;
    await adminDeleteExperiment(exp.id);
    onRefresh();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{exp.name}</span>
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{exp.key}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                exp.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {exp.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {exp.description && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{exp.description}</p>
          )}
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
            <span>Split {Math.round(exp.splitRatio * 100)}% B</span>
            <span>A: {exp.variantACounts} users · B: {exp.variantBCounts} users</span>
            {exp.startedAt && <span>Started {new Date(exp.startedAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            disabled={actLoading}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              exp.active
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {exp.active ? <Square className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
            {exp.active ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={async () => {
              setExpanded(!expanded);
              if (!expanded && !metrics) await loadMetrics();
            }}
            className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-600 px-2"
          >
            <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
            {expanded ? <ChevronUp className="icon-2xs" aria-hidden="true" /> : <ChevronDown className="icon-2xs" aria-hidden="true" />}
          </button>
          <button onClick={del} className="text-gray-300 hover:text-rose-500">
            <Trash2 className="icon-sm" aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          {metricsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <RefreshCw className="icon-sm animate-spin" aria-hidden="true" /> Loading metrics…
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricDiff
                  labelA="Variant A — Avg XP" labelB="Variant B — Avg XP"
                  valA={metrics.variantAXpAvg} valB={metrics.variantBXpAvg}
                />
                <MetricDiff
                  labelA="A Badge Rate" labelB="B Badge Rate"
                  valA={metrics.variantABadgeRate} valB={metrics.variantBBadgeRate}
                  unit="%"
                />
                <MetricDiff
                  labelA="A Retention 7d" labelB="B Retention 7d"
                  valA={metrics.variantARetention7d} valB={metrics.variantBRetention7d}
                  unit="%"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Variant A Config</p>
                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-auto max-h-28 font-mono">
                    {JSON.stringify(exp.variantA, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Variant B Config</p>
                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-auto max-h-28 font-mono">
                    {JSON.stringify(exp.variantB, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={loadMetrics}
              className="text-sm text-indigo-600 hover:underline"
            >
              Load metrics
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Experiment Modal ─────────────────────────────────────────────────────

function CreateExperimentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', key: '', description: '',
    variantA: '{}', variantB: '{}', splitRatio: '0.5',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    let vA: Record<string, unknown>, vB: Record<string, unknown>;
    try {
      vA = JSON.parse(form.variantA);
      vB = JSON.parse(form.variantB);
    } catch {
      setError('Variant A/B must be valid JSON objects.');
      return;
    }
    if (!form.name || !form.key) { setError('Name and key are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await adminCreateExperiment({
        name: form.name, key: form.key,
        description: form.description || undefined,
        variantA: vA, variantB: vB,
        splitRatio: parseFloat(form.splitRatio),
      });
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent size="md">
        <DialogTitle className="mb-4">New Experiment</DialogTitle>
        <div className="space-y-3">
          {[
            { label: 'Name', key: 'name', placeholder: 'e.g. Higher XP for artifacts' },
            { label: 'Key (slug)', key: 'key', placeholder: 'e.g. xp_artifact_boost_v1' },
            { label: 'Description', key: 'description', placeholder: 'Optional context…' },
          ].map(({ label, key, placeholder }) => (
            <FormField key={key} label={label}>
              {(field) => (
                <Input
                  {...field}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              )}
            </FormField>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Variant A (control)', key: 'variantA' }, { label: 'Variant B (treatment)', key: 'variantB' }].map(({ label, key }) => (
              <FormField key={key} label={label}>
                {(field) => (
                  <Textarea
                    {...field}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    rows={4}
                    className="resize-none font-mono text-xs"
                  />
                )}
              </FormField>
            ))}
          </div>
          <FormField
            label={`Split ratio (% assigned to B): ${Math.round(parseFloat(form.splitRatio) * 100)}%`}
          >
            {(field) => (
              <input
                {...field}
                type="range" min="0.1" max="0.9" step="0.05"
                value={form.splitRatio}
                onChange={(e) => setForm((f) => ({ ...f, splitRatio: e.target.value }))}
                className="w-full accent-primary"
              />
            )}
          </FormField>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="mt-5">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            loading={loading}
            loadingText="Creating experiment"
            fullWidth
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── System Config Editor ────────────────────────────────────────────────────────

function ConfigEditor() {
  const toast = useToast();
  const [configs, setConfigs] = useState<SystemConfigRecord[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await adminListConfigs(category || undefined);
      setConfigs(c);
      const vals: Record<string, string> = {};
      c.forEach((cfg) => { vals[cfg.key] = JSON.stringify(cfg.value, null, 2); });
      setEditValues(vals);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  const save = async (cfg: SystemConfigRecord) => {
    let value: unknown;
    try { value = JSON.parse(editValues[cfg.key] ?? ''); }
    catch {
      toast.error('Invalid JSON', `The value for "${cfg.key}" could not be parsed.`);
      return;
    }
    setSaving(cfg.key);
    try {
      await adminUpsertConfig(cfg.key, { value, description: cfg.description ?? undefined, category: cfg.category ?? undefined });
      await load();
    } finally {
      setSaving(null);
    }
  };

  const seed = async () => {
    setSeedLoading(true);
    try {
      const res = await adminSeedDefaultConfigs();
      await load();
      toast.success('Defaults seeded', `${res.seeded} config key${res.seeded === 1 ? '' : 's'} added.`);
    } finally {
      setSeedLoading(false);
    }
  };

  const CATEGORIES = ['xp_weights', 'streak_config', 'abuse_thresholds', 'readiness_weights'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={load} className="text-gray-400 hover:text-indigo-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
        <button
          onClick={() => void seed()}
          disabled={seedLoading}
          className="text-xs flex items-center gap-1.5 border border-dashed border-indigo-300 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
          {seedLoading ? 'Seeding…' : 'Seed Defaults'}
        </button>
      </div>

      {loading && configs.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <RefreshCw className="icon-sm animate-spin mr-2" aria-hidden="true" /> Loading…
        </div>
      ) : configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <Settings className="icon-xl mb-2 opacity-30" aria-hidden="true" />
          <p className="text-sm">No config keys found. Seed defaults to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((cfg) => (
            <div key={cfg.key} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-sm text-gray-800">{cfg.key}</span>
                    {cfg.category && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                        {cfg.category}
                      </span>
                    )}
                  </div>
                  {cfg.description && (
                    <p className="text-xs text-gray-400 mb-2">{cfg.description}</p>
                  )}
                  <textarea
                    value={editValues[cfg.key] ?? ''}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, [cfg.key]: e.target.value }))
                    }
                    rows={2}
                    className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>
                <button
                  disabled={saving === cfg.key}
                  onClick={() => void save(cfg)}
                  className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  {saving === cfg.key ? 'Saving…' : 'Save'}
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Updated {new Date(cfg.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function ExperimentationPanel() {
  const [tab, setTab] = useState<'experiments' | 'config'>('experiments');
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListExperiments();
      setExperiments(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'experiments') void loadExperiments();
  }, [tab, loadExperiments]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Experimentation & Tuning</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            A/B experiments with sticky variant assignment + live config weight tuning.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: 'experiments', label: 'Experiments', icon: FlaskConical },
          { key: 'config', label: 'System Config', icon: Settings },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'experiments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{experiments.length} experiment{experiments.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <button
                onClick={loadExperiments}
                className="text-gray-400 hover:text-indigo-600"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="icon-sm" aria-hidden="true" /> New Experiment
              </button>
            </div>
          </div>

          {loading && experiments.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <RefreshCw className="icon-md animate-spin mr-2" aria-hidden="true" /> Loading…
            </div>
          ) : experiments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <FlaskConical className="w-10 h-10 mb-2 opacity-30" aria-hidden="true" />
              <p className="text-sm">No experiments yet. Create one to start A/B testing.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                + Create first experiment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => (
                <ExperimentCard key={exp.id} exp={exp} onRefresh={() => void loadExperiments()} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'config' && <ConfigEditor />}

      {showCreate && (
        <CreateExperimentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void loadExperiments();
          }}
        />
      )}
    </div>
  );
}
