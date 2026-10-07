/**
 * Saved searches in the preview demo.
 *
 * The API keeps saved searches in `SavedSearch` (`apps/api/src/saved-searches`);
 * before this module the demo answered `/api/saved-searches` with the generic
 * fallback, so the page listed nothing it could rename or alert on. These two
 * searches are the demo founder's own, in the shapes the API returns. State
 * lives in sessionStorage so a rename or an alert toggle survives navigation.
 */

export interface DemoSavedSearch {
  id: string;
  name: string;
  query: string;
  filters: { roles?: string[]; skills?: string[]; industries?: string[]; locations?: string[]; stage?: string[] };
  alertsEnabled: boolean;
  alertFrequency: 'instant' | 'daily' | 'weekly';
  lastRun?: string;
  resultCount?: number;
  newResults?: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'cfb:demo-saved-searches:v1';
const FREQUENCIES = ['instant', 'daily', 'weekly'] as const;
const DAY = 86_400_000;
let memory: DemoSavedSearch[] | null = null;

function seed(now: number): DemoSavedSearch[] {
  const iso = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();
  return [
    {
      id: 'ss-commercial-athens',
      name: 'Commercial co-founder, Athens',
      query: 'sales partnerships',
      filters: { roles: ['founder'], industries: ['ClimateTech'], locations: ['Athens'] },
      alertsEnabled: true,
      alertFrequency: 'daily',
      lastRun: iso(3),
      resultCount: 4,
      newResults: 2,
      createdAt: iso(21),
      updatedAt: iso(3),
    },
    {
      id: 'ss-fundraising-mentors',
      name: 'Fundraising mentors',
      query: 'fundraising',
      filters: { roles: ['mentor'] },
      alertsEnabled: false,
      alertFrequency: 'weekly',
      lastRun: iso(9),
      resultCount: 3,
      createdAt: iso(30),
      updatedAt: iso(9),
    },
  ];
}

function load(now: number): DemoSavedSearch[] {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    memory = raw ? (JSON.parse(raw) as DemoSavedSearch[]) : seed(now);
  } catch {
    memory = seed(now);
  }
  return memory;
}

function save() {
  try {
    if (memory && typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked: the demo keeps working for this page view.
  }
}

export function resetDemoSavedSearches() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function list(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').slice(0, 20) : undefined;
}

/** Answers `/api/saved-searches…` for the demo, or `undefined` for any other path. */
export function previewSavedSearchesApi(pathname: string, method: string, body: Record<string, unknown>, now: number): unknown {
  if (!pathname.startsWith('/api/saved-searches')) return undefined;
  const rows = load(now);
  const stamp = new Date(now).toISOString();
  const [, , , id, action] = pathname.split('/');

  if (!id) {
    if (method === 'GET') return { searches: [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
    if (method === 'POST') {
      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
      const raw = (body.filters ?? {}) as Record<string, unknown>;
      const search: DemoSavedSearch = {
        id: `ss-demo-${now.toString(36)}`,
        name: name || 'Untitled search',
        query: typeof body.query === 'string' ? body.query.trim().slice(0, 200) : '',
        filters: { roles: list(raw.roles), skills: list(raw.skills), industries: list(raw.industries), locations: list(raw.locations), stage: list(raw.stage) },
        alertsEnabled: body.alertsEnabled === true,
        alertFrequency: (FREQUENCIES as readonly unknown[]).includes(body.alertFrequency) ? (body.alertFrequency as DemoSavedSearch['alertFrequency']) : 'daily',
        createdAt: stamp,
        updatedAt: stamp,
      };
      rows.unshift(search);
      save();
      return { search };
    }
    return undefined;
  }

  const row = rows.find((r) => r.id === decodeURIComponent(id));
  if (!row) return { search: null };
  if (action === 'run' && method === 'POST') {
    row.lastRun = stamp;
    row.newResults = undefined;
    save();
    return { results: [], count: row.resultCount ?? 0 };
  }
  if (method === 'PATCH') {
    if (typeof body.name === 'string' && body.name.trim()) row.name = body.name.trim().slice(0, 80);
    if (typeof body.alertsEnabled === 'boolean') row.alertsEnabled = body.alertsEnabled;
    if ((FREQUENCIES as readonly unknown[]).includes(body.alertFrequency)) row.alertFrequency = body.alertFrequency as DemoSavedSearch['alertFrequency'];
    row.updatedAt = stamp;
    save();
    return { search: row };
  }
  if (method === 'DELETE') {
    rows.splice(rows.indexOf(row), 1);
    save();
    return { ok: true };
  }
  return undefined;
}
