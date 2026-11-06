import { afterEach, describe, expect, it } from 'vitest';
import { previewPortfolioApi, resetDemoPortfolio } from './portfolio-world';
import { previewProposalsApi, resetDemoProposals } from './proposals-world';
import { resolvePreviewApi } from '../preview-api';

const NOW = '2026-11-06T10:00:00.000Z';
const ME = 'preview-demo-user';

afterEach(() => {
  resetDemoPortfolio();
  resetDemoProposals();
});

describe('the portfolio in the demo', () => {
  const api = (path: string, method = 'GET', body: Record<string, unknown> = {}) => previewPortfolioApi(path, method, body, NOW, ME) as { items: Array<{ id: string; title: string }> };

  it('holds what the visitor adds, on their profile and nobody else’s', () => {
    const { items } = api('/api/me/portfolio', 'POST', { title: ' Harbor ', url: 'https://harbor.example' });
    expect(items[0]).toMatchObject({ title: 'Harbor', type: 'project', url: 'https://harbor.example' });
    expect(api(`/api/profiles/${ME}/portfolio`).items).toHaveLength(1);
    expect(api('/api/profiles/user-elena/portfolio').items).toEqual([]);
    expect(api(`/api/me/portfolio/${items[0].id}`, 'PATCH', { title: 'New name' }).items[0].title).toBe('New name');
    expect(api(`/api/me/portfolio/${items[0].id}`, 'DELETE').items).toEqual([]);
  });

  it('refuses what the API refuses', () => {
    expect(() => api('/api/me/portfolio', 'POST', { title: ' ' })).toThrow(/title/);
    expect(() => api('/api/me/portfolio', 'POST', { title: 'x', url: 'javascript:alert(1)' })).toThrow(/http/);
    expect(() => api('/api/me/portfolio/nope', 'DELETE')).toThrow(/not found/);
  });

  it('is what the demo API answers', () => {
    resolvePreviewApi('/api/me/portfolio', { method: 'POST', body: JSON.stringify({ title: 'Harbor' }) });
    expect((resolvePreviewApi('/api/me/portfolio') as { items: unknown[] }).items).toHaveLength(1);
  });
});

describe('proposals in the demo', () => {
  const title = (id: string) => (id === 'opp-1' ? 'CTO wanted' : null);
  const api = (path: string, method = 'GET', body: Record<string, unknown> = {}) =>
    previewProposalsApi(path, method, body, NOW, title, { id: ME, displayName: 'Alex Demo' }) as { proposal: { id: string; status: string }; proposals: Array<{ id: string; status: string }> };
  const body = { scope: 'I would build the first version.' };

  it('sends one per listing, lists it, and sends again after a withdrawal', () => {
    const { proposal } = api('/api/opportunities/opp-1/proposals', 'POST', body);
    expect(proposal.status).toBe('pending');
    expect(api('/api/opportunities/proposals/sent').proposals).toHaveLength(1);
    expect(() => api('/api/opportunities/opp-1/proposals', 'POST', body)).toThrow(/already/);
    expect(api(`/api/opportunities/proposals/${proposal.id}`, 'PATCH', { status: 'withdrawn' }).proposal.status).toBe('withdrawn');
    expect(api('/api/opportunities/opp-1/proposals', 'POST', body).proposal.status).toBe('pending');
    expect(api('/api/opportunities/proposals/sent').proposals).toHaveLength(1);
  });

  it('refuses a missing listing, a thin description, and answers that are not the visitor’s to give', () => {
    expect(() => api('/api/opportunities/nope/proposals', 'POST', body)).toThrow(/not found/);
    expect(() => api('/api/opportunities/opp-1/proposals', 'POST', { scope: 'hi' })).toThrow(/sentence/);
    const { proposal } = api('/api/opportunities/opp-1/proposals', 'POST', body);
    expect(() => api(`/api/opportunities/proposals/${proposal.id}`, 'PATCH', { status: 'accepted' })).toThrow(/cannot/);
  });

  it('has nothing incoming of its own: the page shows its two samples', () => {
    expect(api('/api/opportunities/proposals/incoming').proposals).toEqual([]);
  });
});
