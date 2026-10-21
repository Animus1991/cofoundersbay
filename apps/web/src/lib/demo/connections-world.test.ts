import { afterEach, describe, expect, it } from 'vitest';
import { demoConnections, previewConnectionsApi, resetDemoConnections, type DemoConnection } from './connections-world';
import { resolvePreviewApi } from '../preview-api';

const ME = { id: 'me', displayName: 'Alex', avatarUrl: null, role: 'founder', headline: null };
const person = (id: string) => ({ id, displayName: id, avatarUrl: null, role: 'founder', headline: null });
const row = (id: string, requesterId: string, receiverId: string, status: string, createdAt: string): DemoConnection => ({
  id, requesterId, receiverId, status, message: null, createdAt, updatedAt: createdAt, requester: person(requesterId), receiver: person(receiverId),
});
const SEED = [
  row('in', 'elena', 'me', 'pending', '2026-10-20T09:00:00.000Z'),
  row('done', 'me', 'sarah', 'accepted', '2026-09-01T12:00:00.000Z'),
];
let n = 0;
const ctx = {
  seed: SEED,
  me: ME,
  personById: (id: string) => (['elena', 'sarah', 'marcus'].includes(id) ? person(id) : undefined),
  nowIso: '2026-10-21T10:00:00.000Z',
  newId: () => `new-${++n}`,
};
const api = (path: string, method = 'GET', body: Record<string, unknown> = {}) => {
  const [pathname, query] = path.split('?');
  return previewConnectionsApi(pathname, new URLSearchParams(query ?? ''), method, body, ctx) as Record<string, unknown>;
};
const ids = (answer: Record<string, unknown>) => (answer.connections as DemoConnection[]).map((c) => c.id);

afterEach(() => resetDemoConnections());

describe('demo connections keep what the visitor did, with the API’s rules', () => {
  it('lists one type at a time, received when none is given', () => {
    expect(ids(api('/api/connections'))).toEqual(['in']);
    expect(ids(api('/api/connections?type=received'))).toEqual(['in']);
    expect(ids(api('/api/connections?type=accepted'))).toEqual(['done']);
    // Sent means pending: an accepted request is a connection, not a request.
    expect(ids(api('/api/connections?type=sent'))).toEqual([]);
  });

  it('reads a status from the rows, and nothing for a stranger', () => {
    expect(api('/api/connections/status/elena')).toEqual({ status: 'pending', connectionId: 'in', direction: 'received' });
    expect(api('/api/connections/status/sarah')).toEqual({ status: 'accepted', connectionId: 'done', direction: 'sent' });
    // It used to say "request received" for everyone.
    expect(api('/api/connections/status/marcus')).toEqual({ status: null, connectionId: null, direction: null });
  });

  it('accepts a request sent to the visitor, once', () => {
    const answer = api('/api/connections/in', 'PATCH', { status: 'accepted' });
    expect((answer.connection as DemoConnection).status).toBe('accepted');
    expect(ids(api('/api/connections?type=accepted'))).toEqual(['in', 'done']);
    expect(ids(api('/api/connections'))).toEqual([]);
    expect(() => api('/api/connections/in', 'PATCH', { status: 'declined' })).toThrow('Request already responded to');
    expect(() => api('/api/connections/done', 'PATCH', { status: 'accepted' })).toThrow('Not authorized');
  });

  it('sends a request, refuses a second one, and lets the sender withdraw it', () => {
    const sent = api('/api/connections', 'POST', { receiverId: 'marcus', message: ' hi ' }).connection as DemoConnection;
    expect(sent).toMatchObject({ requesterId: 'me', receiverId: 'marcus', status: 'pending', message: 'hi' });
    expect(ids(api('/api/connections?type=sent'))).toEqual([sent.id]);
    expect(api('/api/connections/status/marcus')).toMatchObject({ status: 'pending', direction: 'sent' });
    expect(() => api('/api/connections', 'POST', { receiverId: 'marcus' })).toThrow('Connection request already sent');
    expect(() => api('/api/connections', 'POST', { receiverId: 'sarah' })).toThrow('Already connected');
    expect(() => api('/api/connections/in', 'DELETE')).toThrow('Only the sender can withdraw a request');
    expect(api(`/api/connections/${sent.id}`, 'DELETE')).toEqual({ ok: true, connectionId: sent.id });
    expect(api('/api/connections/status/marcus')).toEqual({ status: null, connectionId: null, direction: null });
  });

  it('replaces a declined request with a new one, as the API does', () => {
    api('/api/connections/in', 'PATCH', { status: 'declined' });
    const again = api('/api/connections', 'POST', { receiverId: 'elena' }).connection as DemoConnection;
    expect(demoConnections(SEED).map((c) => c.id)).toEqual([again.id, 'done']);
  });

  it('answers the demo’s own requests the same way', () => {
    // Marcus: nothing between them. Nikos: the request the visitor sent.
    expect(resolvePreviewApi('/api/connections/status/user-marcus')).toEqual({ status: null, connectionId: null, direction: null });
    expect(resolvePreviewApi('/api/connections/status/user-nikos')).toMatchObject({ status: 'pending', direction: 'sent' });
    expect((resolvePreviewApi('/api/connections?type=sent') as { connections: DemoConnection[] }).connections.map((c) => c.receiverId)).toEqual(['user-nikos']);
    const accepted = resolvePreviewApi('/api/connections/conn-elena', { method: 'PATCH', body: JSON.stringify({ status: 'accepted' }) }) as { connection: DemoConnection };
    expect(accepted.connection.status).toBe('accepted');
    expect(resolvePreviewApi('/api/connections/status/user-elena')).toMatchObject({ status: 'accepted', direction: 'received' });
  });
});
