import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolvePreviewApi } from '@/lib/preview-api';
import { resetDemoMessages } from './messages-world';
import { DEMO_INVESTORS } from './investors-world';
import { DEMO_PROVIDERS } from './marketplace-world';
import { placeEl } from '@/lib/i18n/places';
import { termDisplay } from '@/lib/i18n/terms';

type Conversations = { conversations: Array<{ id: string; recipient: { id: string; displayName: string }; lastMessage: { body: string } | null }> };

const post = (path: string, body: unknown) => resolvePreviewApi(path, { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => resetDemoMessages());
afterEach(() => resetDemoMessages());

describe('demo messaging', () => {
  it('opens a conversation with the person asked for, not Elena', () => {
    const investor = DEMO_INVESTORS[1];
    const { conversationId } = post('/api/messages/conversations/direct', { userId: investor.userId }) as { conversationId: string };
    expect(conversationId).toBe(`conv-${investor.userId}`);
    const list = resolvePreviewApi('/api/messages/conversations') as Conversations;
    const opened = list.conversations.find((c) => c.id === conversationId);
    expect(opened?.recipient.displayName).toBe(investor.displayName);
  });

  it('keeps an existing thread rather than starting a second one', () => {
    expect((post('/api/messages/conversations/direct', { userId: 'user-elena' }) as { conversationId: string }).conversationId).toBe('conv-elena');
    const provider = DEMO_PROVIDERS.find((p) => p.providerUserId)!;
    const first = post('/api/messages/conversations/direct', { userId: provider.providerUserId }) as { conversationId: string };
    const again = post('/api/messages/conversations/direct', { userId: provider.providerUserId }) as { conversationId: string };
    expect(again.conversationId).toBe(first.conversationId);
    const list = resolvePreviewApi('/api/messages/conversations') as Conversations;
    expect(list.conversations.filter((c) => c.recipient.id === provider.providerUserId)).toHaveLength(1);
  });

  it('keeps what the visitor writes for the session and shows it as the latest message', () => {
    const { conversationId } = post('/api/messages/conversations/direct', { userId: DEMO_INVESTORS[0].userId }) as { conversationId: string };
    post(`/api/messages/conversations/${conversationId}/messages`, { body: 'Could we talk about your pre-seed thesis?' });
    const thread = resolvePreviewApi(`/api/messages/conversations/${conversationId}/messages`) as { messages: Array<{ body: string; senderId: string }> };
    expect(thread.messages.map((m) => m.body)).toEqual(['Could we talk about your pre-seed thesis?']);
    expect(thread.messages[0].senderId).toBe('preview-demo-user');
    const list = resolvePreviewApi('/api/messages/conversations') as Conversations;
    expect(list.conversations[0].id).toBe(conversationId);
    expect(list.conversations[0].lastMessage?.body).toBe('Could we talk about your pre-seed thesis?');
  });

  it('adds a written message after the seed thread\'s own', () => {
    post('/api/messages/conversations/conv-marcus/messages', { body: 'Sending the starter repo tonight.' });
    const thread = resolvePreviewApi('/api/messages/conversations/conv-marcus/messages') as { messages: Array<{ body: string }> };
    expect(thread.messages[thread.messages.length - 1].body).toBe('Sending the starter repo tonight.');
    expect(thread.messages.length).toBeGreaterThan(1);
  });
});

describe('demo profiles', () => {
  it('shows an investor and a provider from their own worlds', () => {
    const investor = DEMO_INVESTORS[1];
    const profile = resolvePreviewApi(`/api/profiles/${investor.userId}`) as { displayName: string; role: string; avatarUrl: string | null };
    expect(profile.displayName).toBe(investor.displayName);
    expect(profile.role).toBe('investor');
    expect(profile.avatarUrl).toMatch(/^https:\/\//);
    const provider = DEMO_PROVIDERS.find((p) => p.providerName === 'James Obi')!;
    expect((resolvePreviewApi(`/api/profiles/${provider.providerUserId}`) as { displayName: string }).displayName).toBe('James Obi');
  });

  it('answers an unknown member with a 404, not Elena', () => {
    expect(() => resolvePreviewApi('/api/profiles/user-nobody')).toThrow(/not found/i);
  });

  it('gives every demo investor and provider a member id', () => {
    expect(DEMO_INVESTORS.every((i) => i.userId.startsWith('user-'))).toBe(true);
    expect(DEMO_PROVIDERS.every((p) => p.providerUserId?.startsWith('user-'))).toBe(true);
  });
});

describe('places and terms', () => {
  it.each([
    ['Thessaloniki, GR', 'Θεσσαλονίκη, Ελλάδα'],
    ['Cyprus', 'Κύπρος'],
    ['UK', 'Ηνωμένο Βασίλειο'],
    ['Remote', 'Εξ αποστάσεως'],
    ['Amsterdam, NL', 'Άμστερνταμ, Ολλανδία'],
    ['Smallville, Nowhere', 'Smallville, Nowhere'],
  ])('%s → %s', (en, el) => {
    expect(placeEl(en)).toBe(el);
  });

  it('spells a sector one way', () => {
    expect(termDisplay('Fintech')).toBe('FinTech');
    expect(termDisplay('fintech')).toBe('FinTech');
    expect(termDisplay('saas')).toBe('SaaS');
    expect(termDisplay('Digital health')).toBe('Digital health');
  });
});
