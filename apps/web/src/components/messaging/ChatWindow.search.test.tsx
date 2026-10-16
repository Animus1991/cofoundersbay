import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { ChatWindow, type Message } from './ChatWindow';

/**
 * Searching one conversation keeps the conversation whole: every hit is
 * marked, the search says which hit it is on out of how many, and Enter
 * steps to the next older one. The search used to hide every other message
 * and miss «όρους» when the reader typed «ορους».
 */

beforeAll(() => {
  // jsdom has no layout; the thread scrolls the hit into view.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

const at = (day: number) => new Date(Date.UTC(2026, 9, day, 9));
const messages: Message[] = [
  { id: 'm1', senderId: 'them', content: 'Θα σου στείλω τους όρους αύριο.', timestamp: at(1), status: 'read' },
  { id: 'm2', senderId: 'me', content: 'Τέλεια, ευχαριστώ.', timestamp: at(2), status: 'read' },
  { id: 'm3', senderId: 'them', content: 'Οι ΟΡΟΥΣ θέλουν μία αλλαγή στο vesting.', timestamp: at(3), status: 'read' },
];

function renderThread() {
  render(
    <LanguagePreferenceProvider>
      <ChatWindow
        conversation={{ id: 'c1', recipientId: 'them', recipientName: 'Elena Papadopoulos', recipientRole: 'founder' }}
        messages={messages}
        currentUserId="me"
        onSendMessage={vi.fn()}
      />
    </LanguagePreferenceProvider>,
  );
}

describe('search inside a conversation', () => {
  it('marks every hit in the whole thread and steps between them', () => {
    renderThread();
    fireEvent.click(screen.getAllByRole('button', { name: /Search messages/ })[0]);
    const box = screen.getByRole('searchbox');
    fireEvent.change(box, { target: { value: 'ορους' } });

    // The thread stays whole: the message without a hit is still there.
    expect(screen.getByText('Τέλεια, ευχαριστώ.')).toBeTruthy();
    // Both spellings are found and marked, on the newest hit first.
    expect(document.querySelectorAll('mark')).toHaveLength(2);
    expect(screen.getByText('2 of 2')).toBeTruthy();

    fireEvent.keyDown(box, { key: 'Enter' });
    expect(screen.getByText('1 of 2')).toBeTruthy();
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(screen.getByText('2 of 2')).toBeTruthy();
  });

  it('keeps the old view, only the matching messages, as a choice', () => {
    renderThread();
    fireEvent.click(screen.getAllByRole('button', { name: /Search messages/ })[0]);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ορους' } });
    fireEvent.click(screen.getByRole('button', { name: /Show only matching messages/ }));
    expect(screen.queryByText('Τέλεια, ευχαριστώ.')).toBeNull();
    expect(screen.getByText('2 results')).toBeTruthy();
  });

  it('says so when nothing matches, and Escape closes the search', () => {
    renderThread();
    fireEvent.click(screen.getAllByRole('button', { name: /Search messages/ })[0]);
    const box = screen.getByRole('searchbox');
    fireEvent.change(box, { target: { value: 'term sheet' } });
    expect(screen.getByText('No matches')).toBeTruthy();
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
});
