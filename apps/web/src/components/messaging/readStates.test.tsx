import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { ComposeMessageDialog } from '@/app/messages/ComposeMessageDialog';
import { ChatWindow, NoChatSelected, type Message } from './ChatWindow';
import { ConversationList, type Conversation } from './ConversationList';

/**
 * docs §73: a list that has not been read is not an empty list. The inbox
 * said "No conversations yet" while it loaded and when the read failed, the
 * pane beside it said "Pick a conversation — select someone from the list"
 * over that empty list, a thread that failed to load offered "Say hello",
 * and New message told someone whose connections failed to load that they
 * had none.
 */

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

const wrap = (ui: React.ReactElement) => render(<LanguagePreferenceProvider>{ui}</LanguagePreferenceProvider>);

const marcus: Conversation = {
  id: 'c-marcus',
  recipientId: 'user-marcus',
  recipientName: 'Marcus Chen',
  recipientRole: 'cofounder',
  lastMessage: 'I sketched a starter we can reuse.',
  lastMessageTime: new Date(),
  unreadCount: 0,
};

describe('the conversation list before and after it is read', () => {
  it('shows rows still loading, not an empty inbox', () => {
    const { container } = wrap(<ConversationList conversations={[]} onSelect={vi.fn()} state="loading" />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText(/No conversations yet/)).toBeNull();
  });

  it('says a failed read failed, with Try again', () => {
    const onRetry = vi.fn();
    wrap(<ConversationList conversations={[]} onSelect={vi.fn()} state="failed" onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toMatch(/could not be read just now/);
    expect(screen.queryByText(/No conversations yet/)).toBeNull();
    // Nothing to search in a list that failed.
    expect(screen.queryByRole('textbox', { name: /Search conversations/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('says an empty inbox is empty once it is read', () => {
    wrap(<ConversationList conversations={[]} onSelect={vi.fn()} state="ready" />);
    expect(screen.getByText(/No conversations yet/)).toBeTruthy();
  });

  it('names the role as the thread header’s badge does', () => {
    wrap(<ConversationList conversations={[marcus]} onSelect={vi.fn()} state="ready" />);
    // The badge names the family ("Founder"); the row said "Cofounder".
    expect(screen.getByText('Founder')).toBeTruthy();
    expect(screen.queryByText('Cofounder')).toBeNull();
  });
});

describe('the pane beside the inbox', () => {
  it('does not ask to pick from a list that failed to load', () => {
    const onRetry = vi.fn();
    wrap(<NoChatSelected state="failed" onRetry={onRetry} onNewMessage={vi.fn()} onAskAi={vi.fn()} />);
    expect(screen.queryByText(/Pick a conversation/)).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/could not be read just now/);
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('says an empty inbox is empty, and points at New message when there are connections', () => {
    wrap(<NoChatSelected state="empty" hasConnections onNewMessage={vi.fn()} onAskAi={vi.fn()} />);
    expect(screen.getByText(/No conversations yet/)).toBeTruthy();
    expect(screen.getByText(/Choose New message/)).toBeTruthy();
    expect(screen.queryByText(/Pick a conversation/)).toBeNull();
    // The inbox beside it carries New message and Ask AI.
    expect(screen.queryByRole('button', { name: /^New message/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Ask AI|full AI assistant/ })).toBeNull();
    expect(screen.getByRole('link', { name: /View connections/ }).getAttribute('href')).toBe('/connections');
  });

  it('says nothing while the list loads', () => {
    const { container } = wrap(<NoChatSelected state="loading" />);
    expect(container.textContent).toBe('');
  });

  it('keeps New message and Ask AI for a phone only when a thread is to be picked', () => {
    wrap(<NoChatSelected state="pick" onNewMessage={vi.fn()} onAskAi={vi.fn()} />);
    expect(screen.getByText(/Pick a conversation/)).toBeTruthy();
    const newMessage = screen.getByRole('button', { name: /New message/ });
    expect(newMessage.className).toContain('md:hidden');
    // It opens the inbox's assistant, so it is called what the inbox calls it.
    expect(screen.getByRole('button', { name: /Ask AI/ }).className).toContain('md:hidden');
  });
});

describe('a thread before it is read', () => {
  const conversation = { id: 'c1', recipientId: 'them', recipientName: 'Elena Papadopoulos', recipientRole: 'founder' };

  it('offers no "Say hello" under a thread that failed to load', () => {
    const onRetryThread = vi.fn();
    wrap(<ChatWindow conversation={conversation} messages={[]} currentUserId="me" onSendMessage={vi.fn()} threadState="failed" onRetryThread={onRetryThread} />);
    expect(screen.queryByText(/Start the conversation/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Say hello/ })).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/could not be read just now/);
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(onRetryThread).toHaveBeenCalledTimes(1);
  });

  it('offers no "Say hello" while it loads', () => {
    wrap(<ChatWindow conversation={conversation} messages={[]} currentUserId="me" onSendMessage={vi.fn()} threadState="loading" />);
    expect(screen.queryByText(/Start the conversation/)).toBeNull();
  });

  it('offers it once the thread is read and empty', () => {
    wrap(<ChatWindow conversation={conversation} messages={[]} currentUserId="me" onSendMessage={vi.fn()} threadState="ready" />);
    expect(screen.getByText(/Start the conversation/)).toBeTruthy();
  });

  it('writes each message’s time on the 24-hour clock the list uses', () => {
    const evening: Message = { id: 'm1', senderId: 'them', content: 'See you there.', timestamp: new Date(2026, 9, 15, 19, 0), status: 'read' };
    wrap(<ChatWindow conversation={conversation} messages={[evening]} currentUserId="me" onSendMessage={vi.fn()} />);
    expect(screen.getByText('19:00')).toBeTruthy();
    expect(screen.queryByText(/07:00 PM/)).toBeNull();
  });

  it('keeps search, the profile, the match and Schedule out of the menu from sm, where the header has them', () => {
    wrap(<ChatWindow conversation={conversation} messages={[]} currentUserId="me" onSendMessage={vi.fn()} onAskAi={vi.fn()} />);
    // No calendar icon: Schedule under the name goes to the same place.
    expect(screen.queryByRole('link', { name: /^Calendar/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Schedule/ }).getAttribute('href')).toBe('/calendar?with=them');
    // Ask AI in the header only below md, where the inbox is out of view.
    expect(screen.getByRole('button', { name: /^Ask AI/ }).className).toContain('md:hidden');
  });
});

describe('New message when the connections could not be read', () => {
  it('says so, rather than "You have no connections"', () => {
    wrap(<ComposeMessageDialog open onOpenChange={vi.fn()} candidates={[]} onPick={vi.fn()} connectionsFailed />);
    expect(screen.getByText(/Your connections could not be read just now/)).toBeTruthy();
    expect(screen.queryByText(/You have no connections/)).toBeNull();
  });
});
