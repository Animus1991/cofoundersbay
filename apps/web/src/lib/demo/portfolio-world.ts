import type { PortfolioItem, PortfolioType } from '@/lib/portfolio';
import { DemoRefusal } from './demo-refusal';

/**
 * The portfolio in the preview demo: what the visitor adds holds for the tab,
 * with the API's rules (a title, a web address, thirty items). Other members'
 * portfolios are empty: the demo invents no work for them.
 */

const STORAGE_KEY = 'cfb:demo-portfolio:v1';
const LIMIT = 30;

let memory: PortfolioItem[] | null = null;

function read(): PortfolioItem[] {
  if (memory) return memory;
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    memory = Array.isArray(parsed) ? (parsed as PortfolioItem[]) : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(next: PortfolioItem[]) {
  memory = next;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the list holds for this page view only.
  }
}

export function resetDemoPortfolio() {
  memory = null;
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function fields(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) throw new DemoRefusal(400, 'title is required', { reason: 'title' });
  const url = typeof body.url === 'string' && body.url.trim() ? body.url.trim() : null;
  if (url && !/^https?:\/\//i.test(url)) throw new DemoRefusal(400, 'url must start with http or https', { reason: 'url' });
  const description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;
  return { type: (body.type as PortfolioType) ?? 'project', title, description, url };
}

export function previewPortfolioApi(pathname: string, method: string, body: Record<string, unknown>, nowIso: string, demoUserId: string): unknown {
  const memberMatch = /^\/api\/profiles\/([^/]+)\/portfolio$/.exec(pathname);
  if (memberMatch && method === 'GET') return { items: memberMatch[1] === demoUserId ? read() : [] };

  if (pathname === '/api/me/portfolio') {
    if (method === 'GET') return { items: read() };
    if (method === 'POST') {
      const items = read();
      if (items.length >= LIMIT) throw new DemoRefusal(400, `A portfolio holds up to ${LIMIT} items`, { reason: 'limit' });
      const next = [{ id: `item-${Date.parse(nowIso).toString(36)}-${items.length}`, createdAt: nowIso, ...fields(body) }, ...items];
      write(next);
      return { items: next };
    }
    return undefined;
  }

  const itemMatch = /^\/api\/me\/portfolio\/([^/]+)$/.exec(pathname);
  if (itemMatch) {
    const items = read();
    if (!items.some((i) => i.id === itemMatch[1])) throw new DemoRefusal(404, 'Portfolio item not found');
    if (method === 'DELETE') {
      const next = items.filter((i) => i.id !== itemMatch[1]);
      write(next);
      return { items: next };
    }
    if (method === 'PATCH') {
      const next = items.map((i) => (i.id === itemMatch[1] ? { ...i, ...fields(body) } : i));
      write(next);
      return { items: next };
    }
  }
  return undefined;
}
