import { afterEach, describe, expect, it } from 'vitest';
import { previewOrgApi } from './org-api';
import { ORG_ID, ORG_SLUG } from './org-world';

/*
 * The demo organisation's access policies and the mentor waiting to join
 * its pool (docs §103), with the API's answers.
 */
const iso = (days: number, hour = 9) => new Date(Date.parse('2026-10-24T00:00:00.000Z') + days * 86_400_000 + hour * 3_600_000).toISOString();
const api = (path: string, method = 'GET', body: Record<string, unknown> = {}) => previewOrgApi(path, path, method, iso, Date.now(), body) as any;
afterEach(() => window.sessionStorage.clear());

describe('demo organisation policies', () => {
  it('start at the defaults and keep a change for the session', () => {
    expect(api(`/api/organizations/${ORG_ID}/policies`).policies).toEqual({ publicProfile: true, openApplications: true, mentorSelfRegistration: false, workspaceAccess: true });
    expect(api(`/api/organizations/${ORG_ID}/policies`, 'PATCH', { openApplications: false, nonsense: true }).policies.openApplications).toBe(false);
    expect(api(`/api/organizations/${ORG_ID}/policies`).policies).toMatchObject({ openApplications: false, publicProfile: true });
  });

  it('list the mentor asking to join; accepting puts her in the pool', () => {
    const { requests } = api(`/api/organizations/${ORG_ID}/mentors/requests`);
    expect(requests.map((r: any) => r.displayName)).toEqual(['Helena Brandt']);
    expect(api(`/api/organizations/${ORG_ID}/mentors/requests/${requests[0].id}/accept`, 'POST')).toEqual({ ok: true, accepted: true });
    expect(api(`/api/organizations/${ORG_ID}/mentors/requests`).requests).toEqual([]);
    expect(api(`/api/organizations/${ORG_ID}/mentors`).mentors.some((m: any) => m.userId === 'user-helena-brandt')).toBe(true);
  });

  it('declining removes the request without adding her', () => {
    expect(api(`/api/organizations/${ORG_ID}/mentors/requests/omr-helena`, 'DELETE')).toEqual({ ok: true, accepted: false });
    expect(api(`/api/organizations/${ORG_ID}/mentors`).mentors.some((m: any) => m.userId === 'user-helena-brandt')).toBe(false);
  });

  it('tell the reader, already in the pool, where they stand', () => {
    expect(api(`/api/organizations/slug/${ORG_SLUG}/mentor-pool/me`)).toMatchObject({ standing: 'in_pool', isMentor: true });
    expect(() => api(`/api/organizations/${ORG_ID}/mentors/requests`, 'POST')).toThrow(/already in this organisation's mentor pool/);
  });
});

describe('demo organisation plan (docs §104)', () => {
  it('is Team, yearly, with its seats; nothing is charged', () => {
    const out = api(`/api/billing/organization/${ORG_ID}`);
    expect(out.subscription).toMatchObject({ status: 'active', billingCycle: 'annual', plan: { name: 'team', seatLimit: 25 } });
    expect(out.seats).toMatchObject({ limit: 25, full: false });
    expect(out.billingConfigured).toBe(false);
    expect(() => api(`/api/billing/organization/${ORG_ID}/portal`, 'POST')).toThrow(/nothing is charged/);
  });
});
